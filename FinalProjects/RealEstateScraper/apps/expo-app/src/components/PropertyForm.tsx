import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Listing {
  _id: string;
  'Tiêu đề': string;
  'Mức giá': string;
  'Diện tích': string;
  'Địa chỉ': string;
  'Loại hình': string;
  'Link': string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const BASE_URL = 'http://localhost:5000'; // Thay bằng URL ngrok nếu chạy trên thiết bị thật

const PropertyForm: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const listingId = (route.params as { listingId?: string })?.listingId;

  const [formData, setFormData] = useState<Listing>({
    _id: '',
    'Tiêu đề': '',
    'Mức giá': '',
    'Diện tích': '',
    'Địa chỉ': '',
    'Loại hình': '',
    'Link': '',
  });

  useEffect(() => {
    if (listingId) {
      const fetchListing = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
            navigation.replace('Login');
            return;
          }
          const response = await axios.get<ApiResponse<Listing[]>>(`${BASE_URL}/api/listings/${listingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success && response.data.data[0]) {
            setFormData(response.data.data[0]);
          } else {
            Alert.alert('Lỗi', 'Không tìm thấy tin rao');
          }
        } catch (error: any) {
          console.error('Fetch listing error:', error);
          Alert.alert('Lỗi', error.response?.data?.error || 'Không thể tải thông tin tin rao');
        }
      };
      fetchListing();
    }
  }, [listingId, navigation]);

  const handleChange = (name: keyof Listing, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData['Tiêu đề'] || !formData['Mức giá'] || !formData['Diện tích'] || !formData['Địa chỉ']) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        navigation.replace('Login');
        return;
      }

      const payload = {
        'Tiêu đề': formData['Tiêu đề'],
        'Mức giá': formData['Mức giá'],
        'Diện tích': formData['Diện tích'],
        'Địa chỉ': formData['Địa chỉ'],
        'Loại hình': formData['Loại hình'],
        'Link': formData['Link'],
      };

      if (listingId) {
        await axios.put(`${BASE_URL}/api/admin/listings/${listingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Thành công', 'Đã cập nhật tin rao');
      } else {
        await axios.post(`${BASE_URL}/api/admin/listings`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Thành công', 'Đã thêm tin rao');
      }
      navigation.navigate('Admin');
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể lưu tin rao');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{listingId ? 'Sửa tin rao' : 'Thêm tin rao'}</Text>
      <TextInput
        label="Tiêu đề *"
        value={formData['Tiêu đề']}
        onChangeText={(text) => handleChange('Tiêu đề', text)}
        style={styles.input}
        mode="outlined"
        outlineColor="#ddd"
        activeOutlineColor="#6200ee"
      />
      <TextInput
        label="Mức giá *"
        value={formData['Mức giá']}
        onChangeText={(text) => handleChange('Mức giá', text)}
        style={styles.input}
        mode="outlined"
        outlineColor="#ddd"
        activeOutlineColor="#6200ee"
        keyboardType="numeric"
      />
      <TextInput
        label="Diện tích *"
        value={formData['Diện tích']}
        onChangeText={(text) => handleChange('Diện tích', text)}
        style={styles.input}
        mode="outlined"
        outlineColor="#ddd"
        activeOutlineColor="#6200ee"
        keyboardType="numeric"
      />
      <TextInput
        label="Địa chỉ *"
        value={formData['Địa chỉ']}
        onChangeText={(text) => handleChange('Địa chỉ', text)}
        style={styles.input}
        mode="outlined"
        outlineColor="#ddd"
        activeOutlineColor="#6200ee"
      />
      <TextInput
        label="Loại hình"
        value={formData['Loại hình']}
        onChangeText={(text) => handleChange('Loại hình', text)}
        style={styles.input}
        mode="outlined"
        outlineColor="#ddd"
        activeOutlineColor="#6200ee"
      />
      <TextInput
        label="Link"
        value={formData['Link']}
        onChangeText={(text) => handleChange('Link', text)}
        style={styles.input}
        mode="outlined"
        outlineColor="#ddd"
        activeOutlineColor="#6200ee"
        keyboardType="url"
      />
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        labelStyle={styles.buttonLabel}
      >
        {listingId ? 'Cập nhật' : 'Thêm'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    marginTop: 20,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PropertyForm;