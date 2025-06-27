import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card, Menu, Provider, Button } from 'react-native-paper';
import axios, { AxiosError } from 'axios';
import type { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation param list type
interface Listing {
  _id: string;
  'Tiêu đề'?: string;
  'Địa chỉ'?: string;
  'Loại hình'?: string;
  'Mức giá'?: string;
  'Diện tích'?: string;
  'Link'?: string;
}

interface ApiResponse {
  success: boolean;
  data: Listing[];
}

type RootStackParamList = {
  ListingDetail: { listingId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ListingsScreen: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [districtMenuVisible, setDistrictMenuVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả');
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const propertyTypes = ['All', 'Nhà phố', 'Chung cư', 'Đất nền', 'Biệt thự', 'Căn hộ'];
  const districts = [
    'Tất cả', 'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6',
    'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
    'Thủ Đức', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Tân Phú',
    'Phú Nhuận', 'Bình Tân', 'Củ Chi', 'Hóc Môn', 'Nhà Bè', 'Cần Giờ',
  ];

  // Memoized filter function to prevent unnecessary re-renders
  const applyFilters = useCallback((
    data: Listing[] = listings,
    typeFilter: string = selectedType,
    districtFilter: string = selectedDistrict
  ) => {
    let filtered = [...data];
    
    if (typeFilter !== 'All') {
      filtered = filtered.filter(listing => 
        listing['Loại hình']?.trim() === typeFilter
      );
    }
    
    if (districtFilter !== 'Tất cả') {
      filtered = filtered.filter(listing => 
        listing['Địa chỉ']?.includes(districtFilter)
      );
    }
    
    setFilteredListings(filtered);
  }, [listings, selectedType, selectedDistrict]);

  const fetchListings = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Try multiple API endpoints - adjust these to your actual server IP
      const API_ENDPOINTS = [
        'http://192.168.1.7:5000/api/listings',
        'http://192.168.1.7:5000/api/listings', // Alternative subnet
        'http://10.0.2.2:5000/api/listings',    // Android emulator
        'http://localhost:5000/api/listings',    // iOS simulator
      ];

      let response;
      let lastError;

      // Try each endpoint until one works
      for (const endpoint of API_ENDPOINTS) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await axios.get<ApiResponse>(endpoint, {
            timeout: 10000, // Reduced timeout for faster failover
            headers: {
              'Content-Type': 'application/json',
            },
          });
          console.log(`Success with endpoint: ${endpoint}`);
          break;
        } catch (err) {
          console.log(`Failed endpoint: ${endpoint}`, (err instanceof Error ? err.message : String(err)));
          lastError = err;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('All API endpoints failed');
      }

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const validListings = response.data.data.filter(listing => 
          listing && typeof listing === 'object' && listing._id
        );
        setListings(validListings);
        applyFilters(validListings, selectedType, selectedDistrict);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const error = err as AxiosError;
      let errorMessage = 'Failed to load listings';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = `Network error. Please check your internet connection. Platform: ${Platform.OS}`;
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Check server is running.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      setListings([]);
      setFilteredListings([]);
      
      // Show alert for better user experience
      Alert.alert('Error', errorMessage, [
        { text: 'OK' },
        { text: 'Retry', onPress: () => fetchListings() }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Apply filters when selections change
  useEffect(() => {
    if (listings.length > 0) {
      applyFilters();
    }
  }, [selectedType, selectedDistrict, applyFilters]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return String(value).trim();
  };

  const onRefresh = useCallback(() => {
    fetchListings(true);
  }, []);

  const handleCardPress = useCallback((listingId: string) => {
    if (listingId) {
      navigation.navigate('ListingDetail', { listingId });
    }
  }, [navigation]);

  const handleTypeFilter = useCallback((type: string) => {
    setSelectedType(type);
    setTypeMenuVisible(false);
  }, []);

  const handleDistrictFilter = useCallback((district: string) => {
    setSelectedDistrict(district);
    setDistrictMenuVisible(false);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedType('All');
    setSelectedDistrict('Tất cả');
  }, []);

  const renderListItem = useCallback(({ item }: { item: Listing }) => (
    <Card 
      style={styles.card} 
      onPress={() => handleCardPress(item._id)} 
      mode="elevated"
      accessible={true}
      accessibilityLabel={`Property: ${formatValue(item['Tiêu đề'])}`}
    >
      <Card.Content>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {formatValue(item['Tiêu đề'])}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>📍 Địa chỉ: </Text>
          <Text style={styles.value} numberOfLines={2}>
            {formatValue(item['Địa chỉ'])}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>🏠 Loại hình: </Text>
          <Text style={styles.value}>{formatValue(item['Loại hình'])}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>💰 Mức giá: </Text>
          <Text style={[styles.value, styles.priceText]}>
            {formatValue(item['Mức giá'])}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>📐 Diện tích: </Text>
          <Text style={styles.value}>{formatValue(item['Diện tích'])}</Text>
        </View>
        {item['Link'] && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>🔗 Link: </Text>
            <Text style={styles.link} numberOfLines={1} ellipsizeMode="tail">
              {formatValue(item['Link'])}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  ), [handleCardPress]);

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.empty}>
        No listings available for "{selectedType}"
        {selectedDistrict !== 'Tất cả' && ` in ${selectedDistrict}`}
      </Text>
      {(selectedType !== 'All' || selectedDistrict !== 'Tất cả') && (
        <Button
          mode="outlined"
          onPress={resetFilters}
          style={styles.showAllButton}
        >
          Show All Listings
        </Button>
      )}
    </View>
  ), [selectedType, selectedDistrict, resetFilters]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing && listings.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.error}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => fetchListings()} 
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Provider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Real Estate Listings</Text>
          <Text style={styles.subtitle}>
            Total: {filteredListings.length} properties
          </Text>

          <View style={styles.filterContainer}>
            <View style={styles.filterRow}>
              <View style={styles.filterButtonContainer}>
                <Menu
                  visible={typeMenuVisible}
                  onDismiss={() => setTypeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="contained"
                      onPress={() => setTypeMenuVisible(true)}
                      style={styles.filterButton}
                      icon="home"
                      compact
                      labelStyle={styles.filterButtonLabel}
                    >
                      {selectedType === 'All' ? 'Tất cả loại' : selectedType}
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  {propertyTypes.map((type) => (
                    <Menu.Item
                      key={type}
                      onPress={() => handleTypeFilter(type)}
                      title={type === 'All' ? 'Tất cả loại' : type}
                      titleStyle={selectedType === type ? styles.selectedMenuItem : undefined}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.filterButtonContainer}>
                <Menu
                  visible={districtMenuVisible}
                  onDismiss={() => setDistrictMenuVisible(false)}
                  anchor={
                    <Button
                      mode="contained"
                      onPress={() => setDistrictMenuVisible(true)}
                      style={styles.filterButton}
                      icon="map-marker"
                      compact
                      labelStyle={styles.filterButtonLabel}
                    >
                      {selectedDistrict}
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  {districts.map((district) => (
                    <Menu.Item
                      key={district}
                      onPress={() => handleDistrictFilter(district)}
                      title={district}
                      titleStyle={selectedDistrict === district ? styles.selectedMenuItem : undefined}
                    />
                  ))}
                </Menu>
              </View>
            </View>
          </View>

          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item._id}
            renderItem={renderListItem}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
                tintColor="#2196F3"
              />
            }
            contentContainerStyle={[
              filteredListings.length === 0 ? styles.emptyList : undefined,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
          />
        </View>
      </SafeAreaView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 8 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginVertical: 16, 
    textAlign: 'center', 
    color: '#333' 
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    color: '#666', 
    marginBottom: 16 
  },
  filterContainer: { 
    marginBottom: 16, 
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: 12,
  },
  filterButtonContainer: {
    flex: 1,
  },
  filterButton: { 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    minHeight: 40,
    justifyContent: 'center',
  },
  filterButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuContent: {
    maxHeight: 300,
  },
  selectedMenuItem: { 
    fontWeight: 'bold', 
    color: '#2196F3' 
  },
  card: { 
    marginVertical: 8, 
    marginHorizontal: 4, 
    backgroundColor: 'white',
    elevation: 2,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: '#333', 
    lineHeight: 24 
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 6, 
    alignItems: 'flex-start' 
  },
  label: { 
    fontWeight: 'bold', 
    color: '#555', 
    minWidth: 100 
  },
  value: { 
    flex: 1, 
    color: '#333' 
  },
  priceText: { 
    fontWeight: '600', 
    color: '#2196F3' 
  },
  link: { 
    color: '#2196F3', 
    textDecorationLine: 'underline', 
    flex: 1 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666' 
  },
  error: { 
    padding: 16, 
    color: 'red', 
    textAlign: 'center', 
    fontSize: 16, 
    lineHeight: 24 
  },
  retryButton: { 
    marginTop: 16 
  },
  emptyContainer: { 
    alignItems: 'center', 
    padding: 32 
  },
  empty: { 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 16 
  },
  showAllButton: { 
    marginTop: 8 
  },
  emptyList: { 
    flexGrow: 1, 
    justifyContent: 'center' 
  },
});

export default ListingsScreen;