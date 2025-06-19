import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { RootStackParamList } from '../../App';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootStackParamList>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Real Estate Scraper</Text>
      <Text style={styles.subtitle}>Register or subscribe to get updates</Text>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Register')}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Register
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Subscribe')}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Subscribe
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Listings')}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Listings
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    width: '80%',
    gap: 10, // Khoảng cách giữa các nút
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default HomeScreen;