/**
 * Recipe Detail Screen
 * Shows full recipe details when a recipe is clicked
 */

import { Image } from 'expo-image';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiService } from '@/services/api';
import { API_CONFIG, getApiUrlWithId } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Recipe {
  id?: number | string;
  recipe_id?: string;
  saved_id?: number;
  idMeal?: string;
  title?: string;
  name?: string;
  strMeal?: string;
  strCategory?: string;
  strArea?: string;
  description?: string;
  summary?: string;
  image?: string;
  image_url?: string;
  thumbnail?: string;
  photo?: string;
  strMealThumb?: string;
  ingredients?: string[];
  ingredient_list?: string[];
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
  instructions?: string | string[];
  strInstructions?: string;
  is_favorite?: boolean;
  saved_at?: string;
  strYoutube?: string;
  strSource?: string;
  [key: string]: any;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecipeDetails();
    }
  }, [id]);

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get recipe from API
      const url = getApiUrlWithId(API_CONFIG.ENDPOINTS.RECIPES_SHOW, id);
      const response = await apiService.get<any>(`${API_CONFIG.ENDPOINTS.RECIPES_SHOW}/${id}`);
      
      // Handle different response structures
      const recipeData = response.recipe || response.data || response;
      setRecipe(recipeData);
    } catch (err: any) {
      console.error('Error fetching recipe details:', err);
      setError(err.message || 'Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading recipe...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.centerContainer}>
          <ThemedText type="subtitle" style={styles.errorText}>
            {error || 'Recipe not found'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  // Extract recipe data (supporting TheMealDB format)
  const recipeTitle = recipe.strMeal || recipe.title || recipe.name || 'Untitled Recipe';
  const recipeImage = recipe.strMealThumb || recipe.image || recipe.image_url || recipe.thumbnail || recipe.photo;
  const recipeCategory = recipe.strCategory || '';
  const recipeArea = recipe.strArea || '';
  const recipeDescription = recipe.description || recipe.summary || (recipeCategory ? `${recipeCategory}${recipeArea ? ` • ${recipeArea}` : ''}` : '');
  
  // Extract ingredients from TheMealDB format (strIngredient1-20 with strMeasure1-20)
  const extractIngredients = (): Array<{ ingredient: string; measure: string }> => {
    const ingredients: Array<{ ingredient: string; measure: string }> = [];
    
    // Check if it's TheMealDB format
    for (let i = 1; i <= 20; i++) {
      const ingredientKey = `strIngredient${i}` as keyof Recipe;
      const measureKey = `strMeasure${i}` as keyof Recipe;
      const ingredient = recipe[ingredientKey] as string;
      const measure = recipe[measureKey] as string;
      
      if (ingredient && ingredient.trim() && ingredient.toLowerCase() !== 'null') {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: (measure && measure.trim() && measure.toLowerCase() !== 'null') ? measure.trim() : '',
        });
      }
    }
    
    // If no TheMealDB format ingredients found, try other formats
    if (ingredients.length === 0) {
      if (Array.isArray(recipe.ingredients)) {
        return recipe.ingredients.map((ing: string) => ({ ingredient: ing, measure: '' }));
      } else if (Array.isArray(recipe.ingredient_list)) {
        return recipe.ingredient_list.map((ing: string) => ({ ingredient: ing, measure: '' }));
      }
    }
    
    return ingredients;
  };
  
  const recipeIngredients = extractIngredients();
  
  // Extract instructions
  const recipeInstructions = recipe.strInstructions || recipe.instructions || '';

  // Handle instructions as string or array
  const instructionsArray = Array.isArray(recipeInstructions)
    ? recipeInstructions
    : typeof recipeInstructions === 'string'
    ? recipeInstructions.split('\r\n').filter((line: string) => line.trim()).map((line: string) => line.trim())
    : [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {recipe.is_favorite && (
          <Ionicons name="star" size={24} color="#FFD700" style={styles.favoriteIcon} />
        )}
      </ThemedView>

      {recipeImage && (
        <Image
          source={{ uri: recipeImage }}
          style={styles.heroImage}
          contentFit="cover"
        />
      )}

      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {recipeTitle}
        </ThemedText>

        {(recipeCategory || recipeArea) && (
          <ThemedView style={styles.metaContainer}>
            {recipeCategory && (
              <ThemedView style={styles.metaBadge}>
                <Ionicons name="restaurant" size={16} color={colors.tint} />
                <ThemedText style={styles.metaText}>{recipeCategory}</ThemedText>
              </ThemedView>
            )}
            {recipeArea && (
              <ThemedView style={styles.metaBadge}>
                <Ionicons name="location" size={16} color={colors.tint} />
                <ThemedText style={styles.metaText}>{recipeArea}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
        
        {recipeDescription && (
          <ThemedText style={styles.description}>
            {recipeDescription}
          </ThemedText>
        )}
        
        {(recipe.strYoutube || recipe.strSource) && (
          <ThemedView style={styles.linksContainer}>
            {recipe.strYoutube && (
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => {
                  Linking.openURL(recipe.strYoutube);
                }}>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <ThemedText style={styles.linkText}>Watch on YouTube</ThemedText>
              </TouchableOpacity>
            )}
            {recipe.strSource && (
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => {
                  Linking.openURL(recipe.strSource);
                }}>
                <Ionicons name="link" size={20} color={colors.tint} />
                <ThemedText style={styles.linkText}>View Source</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        )}

        {recipeIngredients.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Ingredients
            </ThemedText>
            {recipeIngredients.map((item: { ingredient: string; measure: string }, index: number) => (
              <ThemedView key={index} style={styles.ingredientItem}>
                <ThemedView style={styles.bullet} />
                <ThemedText style={styles.ingredientText}>
                  {item.measure ? `${item.measure} ${item.ingredient}` : item.ingredient}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {instructionsArray.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Instructions
            </ThemedText>
            {instructionsArray.map((instruction: string, index: number) => (
              <ThemedView key={index} style={styles.instructionItem}>
                <ThemedView style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                </ThemedView>
                <ThemedText style={styles.instructionText}>{instruction}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    marginRight: 16,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A1CEDC',
    marginTop: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A1CEDC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 16,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  linksContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
