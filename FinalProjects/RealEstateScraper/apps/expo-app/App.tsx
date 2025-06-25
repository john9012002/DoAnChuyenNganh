import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen'; // Adjust path as needed
import ListingsScreen from './src/screens/ListingsScreen'; // Adjust path as needed
import TrendsScreen from './src/screens/TrendScreen'; // Adjust path as needed
import LoginScreen from './src/screens/LoginScreen'; // Adjust path as needed

export type RootStackParamList = {
  Home: undefined;
  Listings: undefined;
  Trends: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Listings" component={ListingsScreen} />
      <Stack.Screen name="Trends" component={TrendsScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;