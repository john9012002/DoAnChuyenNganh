import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = () => {
    if (username === 'admin' && password === 'password123') {
      navigation.navigate('Listings');
    } else {
      Alert.alert('Lỗi', 'Thông tin đăng nhập không hợp lệ');
    }
  };

  const handleRegister = () => {
    if (fullName && email && username && password) {
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.');
      setAuthMode('login');
      setFullName('');
      setEmail('');
      setUsername('');
      setPassword('');
    } else {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.authContainer}>
        {authMode === 'login' ? (
          <>
            <TextInput
              label="Tên người dùng"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              mode="outlined"
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
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
                setUsername('');
                setPassword('');
              }}
              style={styles.switchButton}
              pointerEvents="auto"
              accessibilityLabel="Chuyển sang đăng ký"
            >
              <Text style={styles.switchText}>
                Chưa có tài khoản? Đăng ký
              </Text>
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
              label="Tên người dùng"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              mode="outlined"
              outlineColor="#ddd"
              activeOutlineColor="#6200ee"
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
                setUsername('');
                setPassword('');
              }}
              style={styles.switchButton}
              pointerEvents="auto"
              accessibilityLabel="Chuyển sang đăng nhập"
            >
              <Text style={styles.switchText}>
                Đã có tài khoản? Đăng nhập
              </Text>
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
    flexDirection: 'column',
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
    backgroundColor: 'rgba(0, 0, 255, 0.1)', // Debug: Remove in production
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