import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Cuisine {
  name: string;
  code: string | null;
}

interface CuisineSelectorProps {
  onSelectCuisine: (cuisine: Cuisine) => void;
  selectedCuisine?: Cuisine | null;
}

const getFlagUrl = (code: string | null, size: number = 40): string | null => {
  if (!code) return null;
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
};

export function CuisineSelector({ onSelectCuisine, selectedCuisine }: CuisineSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCuisines();
  }, []);

  const fetchCuisines = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get<{ cuisines: Cuisine[]; count: number }>(
        API_CONFIG.ENDPOINTS.CUISINES
      );
      
      if (response && Array.isArray(response.cuisines)) {
        setCuisines(response.cuisines);
      } else if (Array.isArray(response)) {
        setCuisines(response as unknown as Cuisine[]);
      }
    } catch (err: any) {
      console.error('Error fetching cuisines:', err);
      setError(err.message || 'Failed to load cuisines');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCuisine = (cuisine: Cuisine) => {
    onSelectCuisine(cuisine);
    setModalVisible(false);
  };

  const renderFlagButton = (cuisine: Cuisine, index: number) => {
    const flagUrl = getFlagUrl(cuisine.code, 40);
    const isSelected = selectedCuisine?.name === cuisine.name;
    
    return (
      <TouchableOpacity
        key={cuisine.name}
        style={[
          styles.flagButton,
          isSelected && styles.flagButtonSelected,
          { borderColor: isSelected ? colors.tint : 'transparent' },
        ]}
        onPress={() => handleSelectCuisine(cuisine)}
        activeOpacity={0.7}
      >
        {flagUrl ? (
          <Image
            source={{ uri: flagUrl }}
            style={styles.flagImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.flagPlaceholder, { backgroundColor: colors.tabIconDefault }]}>
            <Ionicons name="globe-outline" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderModalItem = ({ item }: { item: Cuisine }) => {
    const flagUrl = getFlagUrl(item.code, 80);
    const isSelected = selectedCuisine?.name === item.name;
    
    return (
      <TouchableOpacity
        style={[
          styles.modalItem,
          isSelected && { backgroundColor: `${colors.tint}20` },
        ]}
        onPress={() => handleSelectCuisine(item)}
        activeOpacity={0.7}
      >
        {flagUrl ? (
          <Image
            source={{ uri: flagUrl }}
            style={styles.modalFlag}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.modalFlagPlaceholder, { backgroundColor: colors.tabIconDefault }]}>
            <Ionicons name="globe-outline" size={24} color="#fff" />
          </View>
        )}
        <ThemedText style={styles.modalItemText}>{item.name}</ThemedText>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">🌍 Country Cuisines</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading cuisines...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">🌍 Country Cuisines</ThemedText>
        </ThemedView>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={fetchCuisines} style={[styles.retryButton, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const displayedCuisines = cuisines.slice(0, 8);
  const hasMoreCuisines = cuisines.length > 8;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">🌍 Country Cuisines</ThemedText>
        <TouchableOpacity
          style={[styles.dropdownButton, { borderColor: colors.tabIconDefault }]}
          onPress={() => setModalVisible(true)}
        >
          <ThemedText style={styles.dropdownButtonText}>
            {selectedCuisine ? selectedCuisine.name : 'All Cuisines'}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color={colors.tabIconDefault} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.flagsRow}>
        {displayedCuisines.map((cuisine, index) => renderFlagButton(cuisine, index))}
        {hasMoreCuisines && (
          <TouchableOpacity
            style={[styles.moreButton, { backgroundColor: `${colors.tint}20` }]}
            onPress={() => setModalVisible(true)}
          >
            <ThemedText style={[styles.moreButtonText, { color: colors.tint }]}>
              +{cuisines.length - 8}
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {selectedCuisine && (
        <ThemedView style={styles.selectedInfo}>
          <ThemedText style={styles.selectedText}>
            Selected: <ThemedText style={{ fontWeight: '600' }}>{selectedCuisine.name}</ThemedText>
          </ThemedText>
          <TouchableOpacity
            onPress={() => onSelectCuisine(null as any)}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.tabIconDefault} />
          </TouchableOpacity>
        </ThemedView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Select a Cuisine</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </ThemedView>
            
            <FlatList
              data={cuisines}
              renderItem={renderModalItem}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.tabIconDefault + '30' }]} />
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  dropdownButtonText: {
    fontSize: 12,
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flagButton: {
    width: 40,
    height: 28,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
  },
  flagButtonSelected: {
    borderWidth: 2,
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  flagPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  selectedText: {
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  modalFlag: {
    width: 40,
    height: 28,
    borderRadius: 4,
  },
  modalFlagPlaceholder: {
    width: 40,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
  },
  separator: {
    height: 1,
  },
});
