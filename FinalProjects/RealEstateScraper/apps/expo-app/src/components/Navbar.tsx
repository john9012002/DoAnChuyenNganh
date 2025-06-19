import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import { useWindowDimensions } from 'react-native';
import { RootStackParamList } from '../../App'; // Điều chỉnh đường dẫn dựa trên cấu trúc thư mục

const Navbar: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();

  // Chuyển sang bố cục dọc nếu chiều rộng nhỏ hơn 300px
  const isVertical = width < 300;

  return (
    <View style={[styles.navbar, isVertical && styles.navbarVertical]}>
      <IconButton icon="home" size={20} onPress={() => navigation.navigate('Home')} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.navText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Subscribe')}>
        <Text style={styles.navText}>Subscribe</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Listings')}>
        <Text style={styles.navText}>Listings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row', // Bố cục ngang mặc định
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#6200ee',
    alignItems: 'center',
  },
  navbarVertical: {
    flexDirection: 'column', // Bố cục dọc khi kích thước nhỏ
    alignItems: 'stretch',
  },
  navText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 5, // Thêm padding để nút dễ nhìn hơn khi dọc
    textAlign: 'center', // Căn giữa văn bản khi dọc
  },
});

export default Navbar;