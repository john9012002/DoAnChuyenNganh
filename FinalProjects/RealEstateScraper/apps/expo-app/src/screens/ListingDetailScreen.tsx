import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import axios, { AxiosError } from 'axios';
import { Card, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ListingDetailRouteProp = RouteProp<RootStackParamList, 'ListingDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Listing {
  _id: string;
  'Tiêu đề': string;
  'Địa chỉ': string;
  'Loại hình': string;
  'Mức giá': string;
  'Diện tích': string;
  'Link': string;
}

interface ApiResponse {
  success: boolean;
  data: Listing;
  error?: string;
}

const BASE_URL = 'http://localhost:5000'; // Thay bằng URL ngrok nếu chạy trên thiết bị thật

const ListingDetailScreen: React.FC = () => {
  const route = useRoute<ListingDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập lại');
          setLoading(false);
          navigation.navigate('Login');
          return;
        }

        const response = await axios.get<ApiResponse>(`${BASE_URL}/api/listings/${listingId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });

        if (response.data.success) {
          setListing(response.data.data);
        } else {
          setError(response.data.error || 'Không tìm thấy tin rao');
        }
      } catch (error) {
        const err = error as AxiosError<{ error?: string }>;
        setError(err.response?.data?.error || 'Không thể tải tin rao');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingId, navigation]);

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ee" style={styles.loading} />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
        >
          Quay lại
        </Button>
      </View>
    );
  }

  if (!listing) {
    return <Text style={styles.empty}>Không tìm thấy tin rao</Text>;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>{listing['Tiêu đề'] || 'Không có tiêu đề'}</Text>
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
  container: { flex: 1, padding: 10, backgroundColor: '#f0f4f8' },
  card: { marginVertical: 5, elevation: 4, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  label: { fontWeight: 'bold', color: '#6200ee' },
  link: { color: 'blue' },
  loading: { flex: 1, justifyContent: 'center' },
  error: { padding: 10, color: '#d32f2f', textAlign: 'center', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  retryButton: { marginTop: 10, backgroundColor: '#6200ee' },
});

export default ListingDetailScreen;