import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import axios from 'axios';

const SubscribeScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleSubscribe = async () => {
    try {
      await axios.post('http://127.0.0.1:5000:5000/api/subscribe', { email, area, type });
      navigation.navigate('Home');
    } catch (err) {
      setError('Subscription failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscribe</Text>
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Area"
            value={area}
            onChangeText={setArea}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Type"
            value={type}
            onChangeText={setType}
            style={styles.input}
            mode="outlined"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button mode="contained" onPress={handleSubscribe} style={styles.button}>
            Subscribe
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  card: { borderRadius: 10, elevation: 4 },
  input: { marginVertical: 8 },
  button: { marginVertical: 10, backgroundColor: '#6200ee' },
  error: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default SubscribeScreen;