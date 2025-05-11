// src/screens/LoginScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {auth} from '../api/firebase';

// type AuthStackParamList = { Login: undefined; Register: undefined; Welcome: undefined; };
type Props = NativeStackScreenProps<any, 'Login'>;

const LoginScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifre alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email.trim(), password);
      // Başarılı giriş sonrası AppNavigator otomatik olarak MainStack'e yönlendirecek.
      // İsteğe bağlı olarak burada bir "Hoş Geldiniz" mesajı gösterilebilir.
    } catch (error: any) {
      let errorMessage = 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential'
      ) {
        errorMessage = 'E-posta veya şifre hatalı.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Yanlış şifre girdiniz.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi formatı.';
      } else {
        console.error('Giriş Hatası Detayı:', error);
        errorMessage = 'Giriş sırasında bir sorun oluştu: ' + error.message;
      }
      Alert.alert('Giriş Başarısız', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Giriş Yap</Text>
          <TextInput
            style={styles.input}
            placeholder="E-posta Adresiniz"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifreniz"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#007bff"
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Giriş Yap</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={loading}>
            <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Welcome')}
            disabled={loading}
            style={{marginTop: 10}}>
            <Text style={styles.link}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 12,
    color: '#007bff',
    textAlign: 'center',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
});

export default LoginScreen;
