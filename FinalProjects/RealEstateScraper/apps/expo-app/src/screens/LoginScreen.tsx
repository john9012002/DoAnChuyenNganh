import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface User {
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  error?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  error?: string;
}

const BASE_URL = 'http://192.168.1.7:5000'; // Thay bằng ngrok hoặc IP nếu cần

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền email và mật khẩu');
      return;
    }

    try {
      console.log('Login request:', { email, password });
      const response = await axios.post<LoginResponse>(`${BASE_URL}/api/login`, {
        email,
        password,
      });
      console.log('Login response:', response.data);

      if (response.data.success && response.data.user && response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        navigation.replace(response.data.user.role === 'admin' ? 'Admin' : 'Home');
      } else {
        Alert.alert('Lỗi', response.data.error || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      const err = error as AxiosError;
      console.error('Login error:', err.message, err.response?.data);
      const errorMessage =
        err.response?.data && typeof err.response.data === 'object' && 'error' in err.response.data
          ? (err.response.data as { error: string }).error
          : 'Không thể kết nối đến server';
      Alert.alert('Lỗi', errorMessage);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      console.log('Register request:', { email, password, name: fullName, role: 'user' });
      const response = await axios.post<RegisterResponse>(`${BASE_URL}/api/register`, {
        email,
        password,
        name: fullName,
        role: 'user',
      });
      console.log('Register response:', response.data);

      if (response.data.success) {
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.');
        setAuthMode('login');
        setFullName('');
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('Lỗi', response.data.error || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      const err = error as AxiosError;
      console.error('Register error:', err.message, err.response?.data);
      let errorMessage = err.response?.data?.error || err.message;
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage += '\nKiểm tra: \n1. Backend có chạy trên port 5000?\n2. Dùng đúng BASE_URL?';
      }
      Alert.alert('Lỗi', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        {authMode === 'login' ? (
          <>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
            />
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.signInButton}
              labelStyle={styles.buttonLabel}
            >
              Đăng nhập
            </Button>
            <TouchableOpacity
              activeOpacity={0.4}
              onPress={() => {
                console.log('Tapped: Switch to register');
                setAuthMode('register');
                setFullName('');
                setEmail('');
                setPassword('');
              }}
              style={styles.switchButton}
              accessibilityLabel="Chuyển sang đăng ký"
            >
              <Text style={styles.switchText}>Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              label="Họ tên"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              mode="outlined"
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
              autoCapitalize="words"
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
            />
            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.signInButton}
              labelStyle={styles.buttonLabel}
            >
              Đăng ký
            </Button>
            <TouchableOpacity
              activeOpacity={0.4}
              onPress={() => {
                console.log('Tapped: Switch to login');
                setAuthMode('login');
                setFullName('');
                setEmail('');
                setPassword('');
              }}
              style={styles.switchButton}
              accessibilityLabel="Chuyển sang đăng nhập"
            >
              <Text style={styles.switchText}>Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>
          </>
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
    justifyContent: 'center',
  },
  authContainer: {
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
  },
  signInButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 6,
    borderRadius: 8,
    width: '100%',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  switchButton: {
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 255, 0.1)',
    ...(Platform.OS === 'web' && { cursor: 'pointer', WebkitUserSelect: 'none' }),
  },
  switchText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default LoginScreen;