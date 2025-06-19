import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import axios, { AxiosError } from 'axios';
import { Card } from 'react-native-paper';
import { RootStackParamList } from '../../App';

type ListingDetailRouteProp = RouteProp<RootStackParamList, 'ListingDetail'>;

interface Listing {
  'Tiêu đề'?: string;
  'Địa chỉ'?: string;
  'Loại hình'?: string;
  'Mức giá'?: string;
  'Diện tích'?: string;
  'Link'?: string;
}

const ListingDetailScreen: React.FC = () => {
  const route = useRoute<ListingDetailRouteProp>();
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchListings = async () => {
    try {
      console.log('Fetching listings from http://127.0.0.1:5000/api/listings');
      const response = await axios.get('http://127.0.0.1:5000/api/listings', {
        timeout: 5000, // Thêm timeout 5 giây
      });
      console.log('Response data:', response.data);
      // Find the listing by ID and set it
      const foundListing = response.data.find((item: Listing & { id?: string | number }) => item.id === listingId);
      setListing(foundListing || null);
    } catch (error) {
      const err = error as AxiosError;
      console.log('Network error details:', err.message, err.code, err.response);
      setError('Failed to load listings: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };
  fetchListings();
}, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!listing) return <Text style={styles.empty}>No listing found</Text>;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>{listing['Tiêu đề'] || 'No Title'}</Text>
          <Text><Text style={styles.label}>Địa chỉ:</Text> {listing['Địa chỉ'] || 'N/A'}</Text>
          <Text><Text style={styles.label}>Loại hình:</Text> {listing['Loại hình'] || 'N/A'}</Text>
          <Text><Text style={styles.label}>Mức giá:</Text> {listing['Mức giá'] || 'N/A'}</Text>
          <Text><Text style={styles.label}>Diện tích:</Text> {listing['Diện tích'] || 'N/A'}</Text>
          <Text><Text style={styles.label}>Link:</Text> <Text style={styles.link}>{listing['Link'] || 'N/A'}</Text></Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  card: { marginVertical: 5, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  label: { fontWeight: 'bold' },
  link: { color: 'blue' },
  loading: { flex: 1, justifyContent: 'center' },
  error: { padding: 10, color: 'red' },
  empty: { textAlign: 'center', marginTop: 20 },
});

export default ListingDetailScreen;