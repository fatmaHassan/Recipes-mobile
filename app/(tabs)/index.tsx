import { Image } from 'expo-image';
import { StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CuisineSelector } from '@/components/CuisineSelector';
import { apiService } from '@/services/api';
import { API_CONFIG, getApiUrlWithId } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Cuisine {
  name: string;
  code: string | null;
}

interface Recipe {
  id?: number | string;
  recipe_id?: string;
  saved_id?: number;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  image?: string;
  image_url?: string;
  thumbnail?: string;
  photo?: string;
  ingredients?: string[];
  ingredient_list?: string[];
  instructions?: string;
  is_favorite?: boolean;
  saved_at?: string;
  [key: string]: any;
}

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cuisineRecipes, setCuisineRecipes] = useState<Recipe[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | null>(null);
  const [loading, setLoading] = useState(true);
  const [cuisineLoading, setCuisineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingRecipeId, setSavingRecipeId] = useState<string | number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PER_PAGE = 15;

  const handleRecipePress = (recipe: Recipe) => {
    const recipeId = recipe.id || recipe.recipe_id || recipe.saved_id || recipe.idMeal;
    if (recipeId) {
      router.push(`/recipe/${recipeId}`);
    }
  };

  const handleCuisineSelect = async (cuisine: Cuisine | null) => {
    setSelectedCuisine(cuisine);
    
    if (!cuisine) {
      setCuisineRecipes([]);
      return;
    }
    
    try {
      setCuisineLoading(true);
      const response = await apiService.get<{ cuisine: string; recipes: any[]; count: number }>(
        `${API_CONFIG.ENDPOINTS.CUISINES_RECIPES}/${encodeURIComponent(cuisine.name)}`
      );
      
      if (response && Array.isArray(response.recipes)) {
        const mappedRecipes = response.recipes.map((recipe: any, index: number) => ({
          ...recipe,
          id: recipe.idMeal || recipe.id || index,
          title: recipe.strMeal || recipe.title || recipe.name || `Recipe ${index + 1}`,
          image: recipe.strMealThumb || recipe.image || recipe.image_url,
          description: recipe.strCategory || recipe.description || cuisine.name,
        }));
        setCuisineRecipes(mappedRecipes);
      }
    } catch (err: any) {
      console.error('Error fetching cuisine recipes:', err);
      Alert.alert('Error', err.message || 'Failed to load cuisine recipes');
    } finally {
      setCuisineLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please log in to save recipes to your collection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    const recipeId = recipe.idMeal || recipe.id || recipe.recipe_id;
    if (!recipeId) return;

    try {
      setSavingRecipeId(recipeId);
      await apiService.post(API_CONFIG.ENDPOINTS.RECIPES_SAVE, {
        recipe_id: recipeId,
        recipe_data: recipe,
      });
      
      Alert.alert('Success', `"${recipe.title || recipe.strMeal}" saved to your recipes!`);
      
      if (isAuthenticated) {
        fetchMyRecipes();
      }
    } catch (err: any) {
      console.error('Error saving recipe:', err);
      Alert.alert('Error', err.message || 'Failed to save recipe');
    } finally {
      setSavingRecipeId(null);
    }
  };

  const fetchMyRecipes = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setError(null);
      }
      
      // Only fetch if user is authenticated
      if (!isAuthenticated) {
        setRecipes([]);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      
      // Call my-recipes endpoint with pagination parameters
      const response = await apiService.get<any>(
        `${API_CONFIG.ENDPOINTS.MY_RECIPES}?page=${page}&per_page=${PER_PAGE}`
      );
      
      // Debug logging
      console.log('[HomeScreen] API Response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let recipesArray: Recipe[] = [];
      
      if (Array.isArray(response)) {
        recipesArray = response;
      } else if (response && typeof response === 'object') {
        // Try common response structures
        if (Array.isArray(response.data)) {
          recipesArray = response.data;
        } else if (Array.isArray(response.recipes)) {
          recipesArray = response.recipes;
        } else if (Array.isArray(response.results)) {
          recipesArray = response.results;
        } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
          // Nested data structure
          recipesArray = response.data.data;
        } else {
          console.log('[HomeScreen] Response object keys:', Object.keys(response));
          console.log('[HomeScreen] Response structure:', JSON.stringify(response, null, 2));
        }
      }
      
      // Ensure all recipes have required fields and extract proper names
      recipesArray = recipesArray.map((recipe, index) => {
        // Extract title from various possible fields (including TheMealDB format)
        const title = 
          recipe.strMeal ||           // TheMealDB format
          recipe.title || 
          recipe.name || 
          recipe.label || 
          recipe.recipe_name ||
          (recipe.recipe_data && (recipe.recipe_data.strMeal || recipe.recipe_data.title || recipe.recipe_data.name || recipe.recipe_data.label)) ||
          `Recipe ${index + 1}`;
        
        // Extract image from various possible fields (including TheMealDB format)
        const image = 
          recipe.strMealThumb ||      // TheMealDB format
          recipe.image || 
          recipe.image_url || 
          recipe.thumbnail || 
          recipe.photo ||
          (recipe.recipe_data && (recipe.recipe_data.strMealThumb || recipe.recipe_data.image || recipe.recipe_data.image_url || recipe.recipe_data.thumbnail));
        
        // Extract description/summary
        const description = 
          recipe.strCategory ||       // Use category as description fallback
          recipe.description || 
          recipe.summary ||
          (recipe.strArea ? `${recipe.strCategory || ''} • ${recipe.strArea}`.trim() : '');
        
        return {
          ...recipe,
          id: recipe.id || recipe.recipe_id || recipe.saved_id || recipe.idMeal || index,
          title: title,
          image: image || recipe.image,
          description: description || recipe.description,
        };
      });
      
      console.log('[HomeScreen] Parsed recipes:', recipesArray.length, 'recipes');
      if (recipesArray.length > 0) {
        console.log('[HomeScreen] First recipe:', JSON.stringify(recipesArray[0], null, 2));
        console.log('[HomeScreen] Recipe keys:', Object.keys(recipesArray[0]));
        console.log('[HomeScreen] First recipe title:', recipesArray[0].title || recipesArray[0].name || 'NOT FOUND');
      } else {
        console.log('[HomeScreen] No recipes found. Response structure:', Object.keys(response || {}));
      }
      
      // Handle pagination metadata from response
      const totalPages = response.last_page || response.meta?.last_page || 
        (response.total && response.per_page ? Math.ceil(response.total / response.per_page) : null);
      const currentPageFromResponse = response.current_page || response.meta?.current_page || page;
      
      // Determine if there are more pages
      if (totalPages !== null) {
        setHasMorePages(currentPageFromResponse < totalPages);
      } else {
        // If no pagination metadata, check if we got a full page of results
        setHasMorePages(recipesArray.length >= PER_PAGE);
      }
      
      setCurrentPage(currentPageFromResponse);
      
      // Append or replace recipes based on the append flag
      if (append) {
        setRecipes(prev => [...prev, ...recipesArray]);
      } else {
        setRecipes(recipesArray);
      }
    } catch (err: any) {
      console.error('Error fetching my recipes:', err);
      console.log('Endpoint called:', API_CONFIG.ENDPOINTS.MY_RECIPES);
      console.log('Full URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MY_RECIPES}`);
      
      const errorStatus = err.status || err.response?.status;
      const errorMessage = err.message || '';
      
      // Check if it's an authentication error
      if (errorStatus === 401) {
        setError(`🔒 Authentication Required\n\n${errorMessage}\n\nPlease log in to view your recipes.`);
      } else if (
        errorStatus === 404 || 
        errorMessage.includes('Not Found') || 
        errorMessage.includes('not found') ||
        errorMessage.includes('Recipe not found')
      ) {
        // 404 error or "not found" message - endpoint might not exist, route is wrong, or user has no recipes
        // Show empty state instead of error - this is expected for users without recipes
        console.warn('404/Not Found error on /my-recipes - showing empty state');
        setRecipes([]);
        setError(null); // Clear error to show empty state
      } else if (errorStatus === 422 || errorMessage.includes('ingredients')) {
        // Validation error - likely backend endpoint misconfiguration
        // Show empty state instead of error - user might just not have recipes yet
        setRecipes([]);
        setError(null); // Clear error to show empty state
      } else {
        // Only show error for unexpected errors (network issues, server errors, etc.)
        const displayMessage = errorMessage || 'Failed to load your recipes';
        setError(`${displayMessage}\n\nAPI URL: ${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MY_RECIPES}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMoreRecipes = async () => {
    if (loadingMore || !hasMorePages || loading) return;
    
    setLoadingMore(true);
    await fetchMyRecipes(currentPage + 1, true);
  };

  const fetchRecipes = async (ingredients?: string[]) => {
    try {
      setError(null);
      
      // If no ingredients provided, fetch user's recipes if authenticated
      if (!ingredients || ingredients.length === 0) {
        if (isAuthenticated) {
          await fetchMyRecipes();
        } else {
          setRecipes([]);
          setLoading(false);
          setRefreshing(false);
        }
        return;
      }
      
      // Call recipes/search with ingredients
      const response = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.RECIPES_SEARCH,
        { ingredients }
      );
      
      // Handle different response structures
      if (Array.isArray(response)) {
        setRecipes(response);
      } else if (response.data && Array.isArray(response.data)) {
        setRecipes(response.data);
      } else if (response.recipes && Array.isArray(response.recipes)) {
        setRecipes(response.recipes);
      } else {
        setRecipes([]); // Empty response but API is working
      }
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      
      // Check if it's an authentication error
      if (err.status === 401) {
        setError(`🔒 Authentication Required\n\n${err.message}\n\nAPI URL: ${API_CONFIG.BASE_URL}\n\nTo fix this, you have two options:\n\n1. Make the endpoint public in Laravel (remove auth middleware)\n2. Implement authentication in the app (login/register)`);
      } else {
        const errorMessage = err.message || 'Failed to load recipes';
        setError(`${errorMessage}\n\nAPI URL: ${API_CONFIG.BASE_URL}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch user's latest recipes on initial load if authenticated
    if (isAuthenticated) {
      setCurrentPage(1);
      setHasMorePages(true);
      fetchMyRecipes(1, false);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMorePages(true);
    if (isAuthenticated) {
      fetchMyRecipes(1, false);
    } else {
      setRefreshing(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Recipes</ThemedText>
        {user && (
          <ThemedText style={styles.welcomeText}>Welcome, {user.name}!</ThemedText>
        )}
      </ThemedView>

      {/* Country Cuisine Selector */}
      <CuisineSelector
        onSelectCuisine={handleCuisineSelect}
        selectedCuisine={selectedCuisine}
      />

      {/* Cuisine Recipes Section */}
      {selectedCuisine && (
        <ThemedView style={styles.cuisineSection}>
          <ThemedView style={styles.cuisineSectionHeader}>
            <ThemedText type="subtitle">{selectedCuisine.name} Recipes</ThemedText>
            {cuisineRecipes.length > 0 && (
              <ThemedText style={styles.recipeCount}>{cuisineRecipes.length} recipes</ThemedText>
            )}
          </ThemedView>
          
          {cuisineLoading ? (
            <ThemedView style={styles.cuisineLoadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <ThemedText style={styles.loadingText}>Loading {selectedCuisine.name} recipes...</ThemedText>
            </ThemedView>
          ) : cuisineRecipes.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText>No recipes found for {selectedCuisine.name} cuisine.</ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.cuisineRecipesContainer}>
              {cuisineRecipes.map((recipe, index) => {
                const recipeId = recipe.idMeal || recipe.id || recipe.recipe_id || index;
                const recipeTitle = recipe.strMeal || recipe.title || recipe.name || 'Untitled Recipe';
                const recipeImage = recipe.strMealThumb || recipe.image || recipe.image_url;
                const isSaving = savingRecipeId === recipeId;
                
                return (
                  <ThemedView key={recipeId} style={styles.cuisineRecipeCard}>
                    <TouchableOpacity
                      style={styles.cuisineRecipeContent}
                      onPress={() => handleRecipePress(recipe)}
                      activeOpacity={0.7}
                    >
                      {recipeImage ? (
                        <Image
                          source={{ uri: recipeImage }}
                          style={styles.cuisineRecipeImage}
                          contentFit="cover"
                        />
                      ) : (
                        <ThemedView style={[styles.cuisineRecipeIcon, { backgroundColor: colors.tint }]}>
                          <Ionicons name="restaurant" size={24} color="#fff" />
                        </ThemedView>
                      )}
                      <ThemedText style={styles.cuisineRecipeTitle} numberOfLines={2}>
                        {recipeTitle}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: colors.tint }]}
                      onPress={() => handleSaveRecipe(recipe)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="add" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </ThemedView>
                );
              })}
            </ThemedView>
          )}
        </ThemedView>
      )}

      {/* My Recipes Section Header */}
      {recipes.length > 0 && (
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle">My Saved Recipes</ThemedText>
        </ThemedView>
      )}

      {loading ? (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading recipes...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="subtitle" style={styles.errorTitle}>Connection Error</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <ThemedView style={styles.troubleshootingContainer}>
            <ThemedText style={styles.troubleshootingTitle}>Troubleshooting:</ThemedText>
            <ThemedText style={styles.troubleshootingItem}>1. Ensure Laravel server is running: php artisan serve</ThemedText>
            <ThemedText style={styles.troubleshootingItem}>2. Check if server is accessible from simulator</ThemedText>
            <ThemedText style={styles.troubleshootingItem}>3. Verify CORS is configured in Laravel</ThemedText>
            <ThemedText style={styles.troubleshootingItem}>4. Try accessing the API URL in a browser</ThemedText>
          </ThemedView>
        </ThemedView>
      ) : recipes.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText type="subtitle">Welcome to Recipes!</ThemedText>
          {isAuthenticated ? (
            <>
              <ThemedText style={styles.emptyText}>
                You don't have any saved recipes yet.
              </ThemedText>
              <ThemedText style={styles.emptyHint}>
                💡 Tip: Search for recipes by selecting ingredients, or save recipes you like!
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.emptyText}>
                Search for recipes by selecting ingredients. The recipes/search endpoint requires ingredients to be provided.
              </ThemedText>
              <ThemedText style={styles.emptyHint}>
                💡 Tip: Log in to see your saved recipes, or go to the Explore tab to see your ingredients!
              </ThemedText>
            </>
          )}
        </ThemedView>
      ) : (
        <ThemedView style={styles.recipesContainer}>
          {recipes.map((recipe, index) => {
            // Handle different recipe data structures
            const recipeId = recipe.id || recipe.recipe_id || recipe.saved_id || index;
            const recipeTitle = recipe.title || recipe.name || 'Untitled Recipe';
            const recipeDescription = recipe.description || recipe.summary || '';
            const recipeImage = recipe.image || recipe.image_url || recipe.thumbnail || recipe.photo;
            const recipeIngredients = recipe.ingredients || recipe.ingredient_list || [];
            
            return (
              <TouchableOpacity
                key={recipeId}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe)}
                activeOpacity={0.7}>
                <ThemedView style={styles.recipeCardInner}>
                  {/* Recipe Image/Icon */}
                  <ThemedView style={styles.imageContainer}>
                    {recipeImage ? (
                      <Image
                        source={{ uri: recipeImage }}
                        style={styles.recipeImage}
                        contentFit="cover"
                      />
                    ) : (
                      <ThemedView style={[styles.recipeIcon, { backgroundColor: colors.tint }]}>
                        <Ionicons name="restaurant" size={32} color="#fff" />
                      </ThemedView>
                    )}
                  </ThemedView>

                  {/* Recipe Content */}
                  <ThemedView style={styles.recipeContent}>
                    <ThemedView style={styles.recipeHeader}>
                      <ThemedText type="subtitle" style={styles.recipeTitle} numberOfLines={2}>
                        {recipeTitle}
                      </ThemedText>
                      {recipe.is_favorite && (
                        <Ionicons name="star" size={20} color="#FFD700" style={styles.favoriteIcon} />
                      )}
                    </ThemedView>
                    
                    {recipeDescription && (
                      <ThemedText style={styles.recipeDescription} numberOfLines={2}>
                        {recipeDescription}
                      </ThemedText>
                    )}
                    
                    <ThemedView style={styles.recipeFooter}>
                      {Array.isArray(recipeIngredients) && recipeIngredients.length > 0 && (
                        <ThemedView style={styles.metaItem}>
                          <Ionicons name="list" size={14} color={colors.tabIconDefault} />
                          <ThemedText style={styles.metaText}>
                            {recipeIngredients.length} ingredient{recipeIngredients.length !== 1 ? 's' : ''}
                          </ThemedText>
                        </ThemedView>
                      )}
                      <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} style={styles.chevron} />
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </TouchableOpacity>
            );
          })}
          
          {/* Load More / Infinite Scroll */}
          {hasMorePages && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { borderColor: colors.tint }]}
              onPress={loadMoreRecipes}
              disabled={loadingMore}
              activeOpacity={0.7}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <>
                  <Ionicons name="chevron-down" size={20} color={colors.tint} />
                  <ThemedText style={[styles.loadMoreText, { color: colors.tint }]}>
                    Load More Recipes
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {!hasMorePages && recipes.length > 0 && (
            <ThemedView style={styles.endOfListContainer}>
              <ThemedText style={styles.endOfListText}>
                You've seen all {recipes.length} recipes
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  cuisineSection: {
    marginBottom: 16,
  },
  cuisineSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  cuisineLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  cuisineRecipesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cuisineRecipeCard: {
    width: '47%',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cuisineRecipeContent: {
    alignItems: 'center',
    padding: 8,
  },
  cuisineRecipeImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  cuisineRecipeIcon: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuisineRecipeTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
  },
  errorHint: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 8,
  },
  troubleshootingContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    gap: 6,
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  troubleshootingItem: {
    fontSize: 12,
    opacity: 0.9,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
  },
  emptyHint: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  recipesContainer: {
    gap: 12,
    paddingBottom: 16,
  },
  recipeCard: {
    marginBottom: 4,
  },
  recipeCardInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 100,
  },
  imageContainer: {
    width: 100,
    height: 100,
    flexShrink: 0,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  favoriteIcon: {
    marginTop: 2,
  },
  recipeDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
    marginTop: 4,
  },
  recipeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.6,
  },
  chevron: {
    opacity: 0.4,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  endOfListText: {
    fontSize: 13,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
