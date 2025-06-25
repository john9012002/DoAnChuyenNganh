import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import HomeScreen from './src/screens/HomeScreen';
import ListingsScreen from './src/screens/ListingsScreen';
import TrendsScreen from './src/screens/TrendScreen';

export type RootStackParamList = {
  navigate(arg0: string): void;
  Home: undefined;
  Register: undefined;
  Trends: undefined;
  Listings: undefined;
  ListingDetail: { listingId: string };
};

const Tab = createBottomTabNavigator();

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
            } else if (route.name === 'Trends') {
              iconName = focused ? 'trending-up' : 'trending-up';
            } else if (route.name === 'Listings') {
              iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted-outline';
            }

            return <Icon source={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: 60,
            paddingBottom: 5
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Trends" component={TrendsScreen} />
        <Tab.Screen name="Listings" component={ListingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;