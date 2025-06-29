import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  email: string;
  name: string;
  role: 'user' | 'admin';
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) {
          const user: User = JSON.parse(userData);
          setIsLoggedIn(true);
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              setIsLoggedIn(false);
              setUserRole(null);
              Alert.alert('Thành công', 'Bạn đã đăng xuất thành công');
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Lỗi', 'Không thể đăng xuất');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => {
            if (isLoggedIn) {
              handleLogout();
            } else {
              navigation.navigate('Login');
            }
          }}
        >
          <Text style={styles.authButtonText}>
            {isLoggedIn ? 'Đăng xuất' : 'Đăng nhập'}
          </Text>
        </TouchableOpacity>
        {isLoggedIn && userRole === 'admin' && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('Admin')}
          >
            <Text style={styles.authButtonText}>Quản trị</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: 'https://i.fbcd.co/products/resized/resized-750-500/6-ba5a78a44883f35cc66fe529cd73088875bd9c66e93f3bfcd5b6c9e9b9b51c37.jpg' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Chào mừng đến với Real Estate Scraper</Text>
        <Text style={styles.subtitle}>Khám phá tài sản mơ ước của bạn hôm nay</Text>
        <View style={styles.decorationLine} />
        <Text style={styles.description}>
          Khám phá nhiều danh sách bất động sản, từ những ngôi nhà sang trọng đến các căn hộ giá phải chăng. Đăng ký hoặc đăng nhập để nhận cập nhật độc quyền!
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Trends')}
          style={styles.trendsButton}
          labelStyle={styles.buttonLabel}
        >
          Xem Xu hướng
        </Button>
        {isLoggedIn && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Listings')}
            style={styles.listingsButton}
            labelStyle={styles.buttonLabel}
          >
            Xem Danh sách
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  authButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  adminButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  authButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  decorationLine: {
    width: '60%',
    height: 2,
    backgroundColor: '#6200ea',
    marginVertical: 20,
    borderRadius: 1,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  trendsButton: {
    marginTop: 20,
    backgroundColor: '#6200ee',
    paddingVertical: 6,
    borderRadius: 8,
    width: '60%',
  },
  listingsButton: {
    marginTop: 10,
    backgroundColor: '#1976d2',
    paddingVertical: 6,
    borderRadius: 8,
    width: '60%',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default HomeScreen;