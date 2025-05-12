// src/screens/SelectCityScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'; // setDoc eklendi (kullanıcı dokümanı yoksa oluşturmak için)
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'SelectCity'>;

const SelectCityScreen = ({ navigation }: Props) => {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false); // Genel yükleme durumu
  const [fetchingInitialCity, setFetchingInitialCity] = useState(true); // İlk şehir yükleme durumu
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserCity = async () => {
      if (currentUser) {
        setFetchingInitialCity(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data()?.selectedCity) {
            setCity(docSnap.data()?.selectedCity);
          }
        } catch (error) {
          console.warn("Mevcut şehir bilgisi alınırken hata:", error);
        } finally {
          setFetchingInitialCity(false);
        }
      } else {
        setFetchingInitialCity(false);
      }
    };
    fetchUserCity();
  }, [currentUser]);

  const handleSaveCity = async () => {
    if (!city.trim()) {
      Alert.alert('Hata', 'Lütfen bir şehir adı girin.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      // Kullanıcı dokümanı yoksa oluştur, varsa güncelle (merge:true ile)
      await setDoc(userDocRef, { selectedCity: city.trim() }, { merge: true });

      Alert.alert('Başarılı', 'Şehir bilginiz kaydedildi!');
      navigation.replace('Home');
    } catch (error) {
      console.error("Şehir kaydedilirken hata:", error);
      Alert.alert('Hata', 'Şehir bilgisi kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingInitialCity) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yaşadığınız Şehri Belirtin</Text>
      <Text style={styles.subtitle}>
        Size en yakın barınakları ve yardım bekleyen dostlarımızı gösterebilmemiz için bu bilgiye ihtiyacımız var.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Şehir Adı (Örn: Isparta)"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
        placeholderTextColor="#888"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSaveCity}>
          <Text style={styles.buttonText}>Kaydet ve Devam Et</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5', },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333', },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 30, paddingHorizontal: 10, },
  input: { width: '100%', height: 50, borderColor: '#ddd', borderWidth: 1, marginBottom: 20, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#fff', fontSize: 16, color: '#333', },
  button: { backgroundColor: '#007bff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
});

export default SelectCityScreen;
