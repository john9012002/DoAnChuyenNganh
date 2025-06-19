import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Menu, Provider, Button } from 'react-native-paper';
import axios, { AxiosError } from 'axios';
import type { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation param list type
type RootStackParamList = {
  ListingDetail: { listingId: string };
  // Add other screens here as needed
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Listing {
  _id: string;
  'Tiêu đề'?: string;
  'Địa chỉ'?: string;
  'Loại hình'?: string;
  'Mức giá'?: string;
  'Diện tích'?: string;
  'Link'?: string;
}

// Define API response structure
interface ApiResponse {
  success: boolean;
  data: Listing[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ListingsScreen: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('All');
  const navigation = useNavigation<NavigationProp>();

  const propertyTypes = ['All', 'Nhà phố', 'Chung cư', 'Đất nền', 'Biệt thự'];

  useEffect(() => {
  const fetchListings = async () => {
    try {
      console.log('Attempting to fetch from http://127.0.0.1:5000/api/listings');
      const response = await axios.get<ApiResponse>('http://127.0.0.1:5000/api/listings', {
        timeout: 30000,
      });
      console.log('Fetch successful, status:', response.status);
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      if (response.data.success && Array.isArray(response.data.data)) {
        setListings(response.data.data);
        setFilteredListings(response.data.data);
      } else {
        console.log('Unexpected response format:', response.data);
        setListings([]);
        setFilteredListings([]);
      }
    } catch (error) {
      const err = error as AxiosError;
      console.log('Network error details:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError('Failed to load listings: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };
  fetchListings();
}, []);

  const filterListings = (type: string) => {
    setSelectedType(type);
    setVisible(false);
    if (type === 'All') {
      setFilteredListings(listings);
    } else {
      setFilteredListings(listings.filter(listing => listing['Loại hình'] === type));
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  };

  const handleCardPress = (listingId: string) => {
    try {
      navigation.navigate('ListingDetail', { listingId });
    } catch (error) {
      console.log('Navigation error:', error);
      // Handle navigation error gracefully
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading listings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => {
            setLoading(true);
            setError(null);
            // Trigger refetch by updating a state that useEffect depends on
            window.location.reload(); // For web, use different approach for mobile
          }}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.title}>Real Estate Listings</Text>
        <Text style={styles.subtitle}>Total: {filteredListings.length} properties</Text>
        
        <View style={styles.filterContainer}>
          <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            anchor={
              <Button 
                mode="contained" 
                onPress={() => setVisible(true)} 
                style={styles.filterButton}
                icon="filter"
              >
                Filter: {selectedType}
              </Button>
            }
          >
            {propertyTypes.map((type) => (
              <Menu.Item 
                key={type} 
                onPress={() => filterListings(type)} 
                title={type}
                titleStyle={selectedType === type ? styles.selectedMenuItem : undefined}
              />
            ))}
          </Menu>
        </View>

        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card 
              style={styles.card} 
              onPress={() => handleCardPress(item._id)}
              mode="elevated"
            >
              <Card.Content>
                <Text style={styles.cardTitle}>
                  {formatValue(item['Tiêu đề']) || 'No Title'}
                </Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.label}>📍 Địa chỉ: </Text>
                  <Text style={styles.value}>{formatValue(item['Địa chỉ'])}</Text>
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
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>No listings available for "{selectedType}"</Text>
              {selectedType !== 'All' && (
                <Button 
                  mode="outlined" 
                  onPress={() => filterListings('All')}
                  style={styles.showAllButton}
                >
                  Show All Listings
                </Button>
              )}
            </View>
          }
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            // Trigger refetch
          }}
          contentContainerStyle={filteredListings.length === 0 ? styles.emptyList : undefined}
        />
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 16,
  },
  filterContainer: { 
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  filterButton: { 
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedMenuItem: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  card: { 
    marginVertical: 8, 
    marginHorizontal: 4,
    backgroundColor: 'white',
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 12,
    color: '#333',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  label: { 
    fontWeight: 'bold',
    color: '#555',
    minWidth: 100,
  },
  value: {
    flex: 1,
    color: '#333',
  },
  priceText: {
    fontWeight: '600',
    color: '#2196F3',
  },
  link: { 
    color: '#2196F3',
    textDecorationLine: 'underline',
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  error: { 
    padding: 16, 
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  empty: { 
    textAlign: 'center', 
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  showAllButton: {
    marginTop: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default ListingsScreen;