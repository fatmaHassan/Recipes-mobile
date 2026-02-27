import { StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';

interface Ingredient {
  id: number;
  name: string;
  [key: string]: any;
}

export default function TabTwoScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIngredients = async () => {
    try {
      setError(null);
      const response = await apiService.get<any>(API_CONFIG.ENDPOINTS.INGREDIENTS);
      
      // Handle different response structures
      if (Array.isArray(response)) {
        setIngredients(response);
      } else if (response.data && Array.isArray(response.data)) {
        setIngredients(response.data);
      } else if (response.ingredients && Array.isArray(response.ingredients)) {
        setIngredients(response.ingredients);
      } else {
        setIngredients([]); // Empty response but API is working
      }
    } catch (err: any) {
      console.error('Error fetching ingredients:', err);
      
      // Check if it's an authentication error
      if (err.status === 401) {
        setError(`🔒 Authentication Required\n\n${err.message}\n\nThis endpoint requires authentication. Consider making it public for testing or implementing login.`);
      } else {
        const errorMessage = err.message || 'Failed to load ingredients';
        setError(`${errorMessage}\n\nAPI URL: ${API_CONFIG.BASE_URL}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIngredients();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Explore
        </ThemedText>
      </ThemedView>

      <Collapsible title="Ingredients" defaultOpen>
        {loading ? (
          <ThemedView style={styles.centerContainer}>
            <ActivityIndicator size="small" />
            <ThemedText style={styles.loadingText}>Loading ingredients...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : ingredients.length === 0 ? (
          <ThemedText style={styles.emptyText}>No ingredients found</ThemedText>
        ) : (
          <ThemedView style={styles.ingredientsList}>
            {ingredients.map((ingredient) => (
              <ThemedView key={ingredient.id} style={styles.ingredientItem}>
                <ThemedText style={styles.ingredientName}>{ingredient.name}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </Collapsible>
      <Collapsible title="API Status">
        <ThemedText>
          Connected to API at: <ThemedText type="defaultSemiBold">{API_CONFIG.BASE_URL}</ThemedText>
        </ThemedText>
        {!loading && !error && (
          <ThemedText style={styles.successText}>
            ✓ Successfully loaded {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
          </ThemedText>
        )}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.7,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
  },
  emptyText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  successText: {
    color: '#4CAF50',
    marginTop: 8,
    fontSize: 12,
  },
});
