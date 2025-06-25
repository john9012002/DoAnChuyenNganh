import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import axios, { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Trends: undefined;
  Listings: undefined;
  ListingDetail: { listingId: string };
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

interface TrendItem {
  name: string;
  count: number;
}

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

const TrendsScreen: React.FC = () => {
  const [districtTrends, setDistrictTrends] = useState<TrendItem[]>([]);
  const [typeTrends, setTypeTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  // API URLs for different Expo environments
  const getApiUrls = () => {
    // THAY ĐỔI IP NÀY THÀNH IP THẬT CỦA MÁY TÍNH BẠN
    const YOUR_COMPUTER_IP = '192.168.1.7'; // ⚠️ THAY ĐỔI IP NÀY
    
    const urls = [];
    
    if (Platform.OS === 'android') {
      // Cho Android emulator
      urls.push('http://10.0.2.2:5000/api/listings');
      // Cho Expo trên Android (device thật hoặc emulator)
      urls.push(`http://${YOUR_COMPUTER_IP}:5000/api/listings`);
    } else if (Platform.OS === 'ios') {
      // Cho iOS simulator
      urls.push('http://localhost:5000/api/listings');
      // Cho Expo trên iOS device thật
      urls.push(`http://${YOUR_COMPUTER_IP}:5000/api/listings`);
    } else {
      // Cho web
      urls.push('http://localhost:5000/api/listings');
      urls.push('http://127.0.0.1:5000/api/listings');
    }
    
    // Thêm các URL backup
    urls.push(`http://${YOUR_COMPUTER_IP}:5000/api/listings`);
    urls.push('http://localhost:5000/api/listings');
    urls.push('http://127.0.0.1:5000/api/listings');
    
    // Remove duplicates
    return [...new Set(urls)];
  };

  const API_URLS = getApiUrls();

  // Move fetchTrends outside useEffect so it can be called elsewhere
  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    
    // Try multiple API URLs
    for (let i = 0; i < API_URLS.length; i++) {
      const currentUrl = API_URLS[i];
      try {
        console.log(`Trying API URL ${i + 1}/${API_URLS.length}: ${currentUrl}`);
        console.log('Platform:', Platform.OS);
        console.log('All URLs being tried:', API_URLS);
        
        const response = await axios.get<ApiResponse>(currentUrl, {
          timeout: 10000, // Reduced timeout for faster fallback
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        console.log('API Response:', response.data);

        if (response.data.success && Array.isArray(response.data.data)) {
          const listings = response.data.data;
          console.log(`Successfully received ${listings.length} listings from: ${currentUrl}`);

          // Process districts
          const districtCounts: { [key: string]: number } = {};
          listings.forEach(listing => {
            const address = listing['Địa chỉ'] || '';
            // Enhanced district matching for Vietnamese addresses
            const districtMatch = address.match(/(Quận \d+|Huyện [^,]+|Thành phố [^,]+|Thị xã [^,]+)(?:,|$)/i);
            const district = districtMatch ? districtMatch[1].trim() : 'Không xác định';
            districtCounts[district] = (districtCounts[district] || 0) + 1;
          });

          const sortedDistricts = Object.entries(districtCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          
          console.log('District trends:', sortedDistricts);
          setDistrictTrends(sortedDistricts);

          // Process property types
          const typeCounts: { [key: string]: number } = {};
          listings.forEach(listing => {
            const type = listing['Loại hình'] || 'Không xác định';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });

          const sortedTypes = Object.entries(typeCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          
          console.log('Type trends:', sortedTypes);
          setTypeTrends(sortedTypes);
          
          setLoading(false);
          return; // Success, exit the loop

        } else {
          console.error('Invalid API response format from:', currentUrl, response.data);
          if (i === API_URLS.length - 1) {
            setError('Định dạng dữ liệu từ tất cả các API không đúng');
          }
        }
      } catch (error) {
        const err = error as AxiosError;
        console.error(`API error from ${currentUrl}:`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        // If this is the last URL, set error
        if (i === API_URLS.length - 1) {
          let errorMessage = 'Không thể tải dữ liệu từ bất kỳ API server nào';
          
          if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error') || err.message.includes('connect ECONNREFUSED')) {
            errorMessage += '\n\n🔧 Giải pháp:\n1. Kiểm tra MongoDB server có đang chạy trên port 5000\n2. Thử chạy: npm start hoặc node server.js\n3. Kiểm tra firewall/antivirus\n4. Thử truy cập http://localhost:5000/api/listings trên browser';
          } else if (err.response?.status === 404) {
            errorMessage += '\n\n❌ API endpoint không tồn tại. Kiểm tra đường dẫn /api/listings';
          } else if (err.response?.status === 500) {
            errorMessage += '\n\n💥 Lỗi server MongoDB. Kiểm tra logs server';
          } else {
            errorMessage += '\n\n❓ Lỗi: ' + (err.message || 'Không xác định');
          }
          
          setError(errorMessage);
        }
        // Continue to next URL
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải xu hướng từ MongoDB...</Text>
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
            fetchTrends();
          }}
          style={styles.retryButton}
        >
          Thử lại
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Xu hướng Bất động sản</Text>
      
      <View style={styles.section}>
        <Text style={styles.title}>🏘️ Top 5 Quận/Huyện Có Nhiều Tin Nhất</Text>
        <FlatList
          data={districtTrends}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => (
            <View style={[styles.item, { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }]}>
              <Text style={styles.rankText}>#{index + 1}</Text>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.countText}>{item.count} tin</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu quận/huyện</Text>}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>🏠 Top 5 Loại Hình Bất Động Sản Phổ Biến</Text>
        <FlatList
          data={typeTrends}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => (
            <View style={[styles.item, { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }]}>
              <Text style={styles.rankText}>#{index + 1}</Text>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.countText}>{item.count} tin</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu loại hình</Text>}
          scrollEnabled={false}
        />
      </View>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('Listings')}
        style={styles.listingsButton}
        labelStyle={styles.buttonLabel}
        icon="view-list"
      >
        Xem Danh sách Bất động sản
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      web: { maxWidth: 800, marginHorizontal: 'auto' },
    }),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    width: 30,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  error: {
    padding: 16,
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    margin: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6200ee',
  },
  listingsButton: {
    marginTop: 20,
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    borderRadius: 12,
    width: '80%',
    alignSelf: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TrendsScreen;