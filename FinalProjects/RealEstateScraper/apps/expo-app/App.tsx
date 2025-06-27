import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/components/AdminDashboard';
import PropertyForm from './src/components/PropertyForm';
import ListingsScreen from './src/screens/ListingsScreen';
import HomeScreen from './src/screens/HomeScreen';
import TrendsScreen from './src/screens/TrendScreen'; // Sửa tên file từ TrendScreen thành TrendsScreen
import ListingDetailScreen from './src/screens/ListingDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  Listings: undefined;
  Trends: undefined;
  Login: undefined;
  Admin: undefined;
  PropertyForm: { listingId?: string };
  ListingDetail: { listingId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => (
  <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Trang chủ' }}
        />
        <Stack.Screen
          name="Listings"
          component={ListingsScreen}
          options={{ title: 'Danh sách tin rao' }}
        />
        <Stack.Screen
          name="Trends"
          component={TrendsScreen}
          options={{ title: 'Xu hướng' }}
        />
        <Stack.Screen
          name="Admin"
          component={AdminDashboard}
          options={{ title: 'Quản trị' }}
        />
        <Stack.Screen
          name="PropertyForm"
          component={PropertyForm}
          options={{ title: 'Thêm/Sửa tin rao' }}
        />
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{ title: 'Chi tiết tin rao' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
);

export default App;