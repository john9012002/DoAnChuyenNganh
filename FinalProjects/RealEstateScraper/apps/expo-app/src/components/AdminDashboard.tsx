import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
}

interface Listing {
  _id: string;
  'Tiêu đề': string;
  'Mức giá': string;
  'Diện tích': string;
  'Địa chỉ': string;
  'Loại hình': string;
  'Link': string;
}

interface AdminData {
  users: User[];
  listings: Listing[];
}

const BASE_URL = 'http://localhost:5000'; // Thay bằng ngrok hoặc IP nếu chạy trên thiết bị thật

const AdminDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [data, setData] = useState<AdminData>({ users: [], listings: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập lại');
          navigation.replace('Login');
          return;
        }

        const [usersResponse, listingsResponse] = await Promise.all([
          axios.get(`${BASE_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/admin/listings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setData({
          users: usersResponse.data.data,
          listings: listingsResponse.data.data,
        });
      } catch (error) {
        const err = error as AxiosError;
        setError(
          (err.response?.data && typeof err.response.data === 'object' && 'error' in err.response.data
            ? (err.response.data as { error?: string }).error
            : undefined) || 'Không thể tải dữ liệu'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [navigation]);

  const handleDeleteListing = async (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa tin rao này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${BASE_URL}/api/admin/listings/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setData((prev) => ({
                ...prev,
                listings: prev.listings.filter((listing) => listing._id !== id),
              }));
              Alert.alert('Thành công', 'Xóa tin rao thành công');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa tin rao');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return <Text style={styles.loading}>Đang tải...</Text>;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.replace('Login')}
          style={styles.retryButton}
        >
          Đăng nhập lại
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bảng điều khiển Quản trị</Text>

      <Button
        mode="contained"
        onPress={() => navigation.navigate({ name: 'PropertyForm' })}
        style={styles.addButton}
      >
        Thêm tin rao
      </Button>

      <Text style={styles.sectionTitle}>Danh sách người dùng</Text>
      <FlatList
        data={data.users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Title>{item.name}</Title>
              <Paragraph>Email: {item.email}</Paragraph>
              <Paragraph>Vai trò: {item.role}</Paragraph>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Không có người dùng</Text>}
      />

      <Text style={styles.sectionTitle}>Danh sách tin rao</Text>
      <FlatList
        data={data.listings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Title>{item['Tiêu đề']}</Title>
              <Paragraph>Giá: {item['Mức giá']}</Paragraph>
              <Paragraph>Địa chỉ: {item['Địa chỉ']}</Paragraph>
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('PropertyForm', { listingId: item._id })}
                  style={styles.editButton}
                >
                  Sửa
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleDeleteListing(item._id)}
                  style={styles.deleteButton}
                >
                  Xóa
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Không có tin rao</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  card: {
    marginVertical: 5,
    borderRadius: 8,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#1976d2',
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    flex: 1,
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#6200ee',
    marginBottom: 20,
  },
  loading: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  error: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#6200ee',
  },
});

export default AdminDashboard;