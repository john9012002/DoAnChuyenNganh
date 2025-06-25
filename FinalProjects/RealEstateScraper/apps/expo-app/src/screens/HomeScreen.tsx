import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    Alert.alert('Thành công', 'Bạn đã đăng xuất thành công', [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header với nút Đăng nhập/Đăng xuất */}
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
      </View>

      {/* Nội dung chính */}
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://example.com/logo.png' }} // Replace with valid URI or require()
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
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default HomeScreen;