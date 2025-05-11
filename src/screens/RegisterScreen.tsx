// src/screens/RegisterScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {auth, db} from '../api/firebase';

// AuthStackParamList tipini AppNavigator.tsx dosyasından import etmek daha iyi bir pratiktir.
type AuthStackParamList = {
  Register: undefined;
  Login: undefined;
};
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !displayName.trim()
    ) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    // E-posta formatı kontrolü (basit)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    // Şifre uzunluğu kontrolü
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        email.trim(),
        password,
      );
      const user = userCredential.user;

      if (user) {
        await user.updateProfile({
          displayName: displayName.trim(),
        });

        // Firestore'a kullanıcı bilgilerini kaydetme
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: user.email?.toLowerCase(), // E-postayı küçük harfe çevirerek sakla
          displayName: displayName.trim(),
          createdAt: new Date(), // Veya Firebase.firestore.FieldValue.serverTimestamp()
          profileImageUrl: null,
          age: null,
          location: null,
          bio: null, // Kullanıcı hakkında kısa bilgi
        });

        Alert.alert(
          'Kayıt Başarılı!',
          'Hesabınız başarıyla oluşturuldu. Lütfen giriş yapın.',
          [{text: 'Tamam', onPress: () => navigation.replace('Login')}], // Kayıt sonrası Login ekranına yönlendir ve geri dönemesin
        );
      }
    } catch (error: any) {
      let errorMessage = 'Bilinmeyen bir hata oluştu.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanımda.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi formatı.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. Lütfen en az 6 karakter kullanın.';
      } else {
        console.error('Kayıt Hatası Detayı:', error);
        errorMessage = 'Kayıt sırasında bir sorun oluştu: ' + error.message;
      }
      Alert.alert('Kayıt Başarısız', errorMessage);
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
          <Text style={styles.title}>Hesap Oluştur</Text>
          <TextInput
            style={styles.input}
            placeholder="Adınız Soyadınız"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholderTextColor="#888"
          />
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
            placeholder="Şifreniz (en az 6 karakter)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifrenizi Tekrar Girin"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}>
            <Text style={styles.link}>Zaten hesabın var mı? Giriş yap</Text>
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
    backgroundColor: '#28a745', // Yeşil kayıt butonu
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

export default RegisterScreen;
