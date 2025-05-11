// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../api/firebase';

// type MainStackParamList = { Home: undefined; Profile: undefined; /* ... */ };
type Props = NativeStackScreenProps<any, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ana Sayfa</Text>
      {user && (
        <Text style={styles.welcomeText}>
          Hoş geldin, {user.displayName || user.email}!
        </Text>
      )}
      <Text style={styles.infoText}>
        Burada barınakları ve sevimli dostlarımızı görebileceksin.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.buttonText}>Profilime Git</Text>
      </TouchableOpacity>
      {/* Gelecekte eklenecekler:
          - Barınak listesi veya haritası
          - Öne çıkan hayvanlar
          - Arama çubuğu
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#5cb85c', // Farklı bir buton rengi
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
