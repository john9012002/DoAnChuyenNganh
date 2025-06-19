import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper'; // Sử dụng icon từ react-native-paper
import HomeScreen from './src/screens/HomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SubscribeScreen from './src/screens/SubscribeScreen';
import ListingsScreen from './src/screens/ListingsScreen';

export type RootStackParamList = {
  navigate(arg0: string): void;
  Home: undefined;
  Register: undefined;
  Subscribe: undefined;
  Listings: undefined;
  ListingDetail: { listingId: string };
};

const Tab = createBottomTabNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Register') {
              iconName = focused ? 'account-plus' : 'account-plus-outline';
            } else if (route.name === 'Subscribe') {
              iconName = focused ? 'bell' : 'bell-outline';
            } else if (route.name === 'Listings') {
              iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted-outline';
            }

            return <Icon source={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { height: 60, paddingBottom: 5 },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Register" component={RegisterScreen} />
        <Tab.Screen name="Subscribe" component={SubscribeScreen} />
        <Tab.Screen name="Listings" component={ListingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;