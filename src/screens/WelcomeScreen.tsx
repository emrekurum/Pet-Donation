// src/screens/WelcomeScreen.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

// Navigasyon yığınındaki ekranlar ve alabilecekleri parametreler için tip tanımı.
// AppNavigator.tsx dosyasında tanımlanan AuthStackParamList'e uygun olmalıdır.
type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};
type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WelcomeScreen = ({navigation}: Props) => {
  return (
    <View style={styles.container}>
      {/* Uygulama logosu veya hoş bir görsel eklenebilir */}
      {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
      <Text style={styles.title}>Sosyal Bağış Uygulamasına Hoş Geldiniz!</Text>
      <Text style={styles.subtitle}>
        Barınaklardaki sevimli dostlarımıza bir el de siz uzatın.
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={() => navigation.navigate('Register')}>
        <Text style={styles.buttonText}>Kayıt Ol</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E0F2F7', // Açık mavi bir arka plan
  },
  // logo: {
  //   width: 150,
  //   height: 150,
  //   marginBottom: 30,
  // },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50', // Koyu mavi-gri
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#34495E', // Biraz daha açık mavi-gri
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  button: {
    width: '90%',
    paddingVertical: 15,
    borderRadius: 30, // Daha yuvarlak butonlar
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  loginButton: {
    backgroundColor: '#3498DB', // Canlı mavi
  },
  registerButton: {
    backgroundColor: '#2ECC71', // Canlı yeşil
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600', // Biraz daha kalın
  },
});

export default WelcomeScreen;
