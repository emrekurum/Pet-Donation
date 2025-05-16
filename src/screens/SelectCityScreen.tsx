// src/screens/SelectCityScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
// Firebase Web SDK importları kaldırıldı, @react-native-firebase/firestore metodları db üzerinden kullanılır.
// import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';
import { turkishCities } from '../constants/cities'; // Bu dosyanın var olduğundan ve doğru export yaptığından emin olun

type Props = NativeStackScreenProps<MainStackParamList, 'SelectCity'>;

const SelectCityScreen = ({ navigation, route }: Props) => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingInitialCity, setFetchingInitialCity] = useState(true);
  const currentUser = auth.currentUser;

  // route.params'ın varlığını kontrol ederek undefined olmasını engelliyoruz.
  const fromProfile = route.params?.fromProfile === true;
  const navigateToHomeOnSave = route.params?.navigateToHomeOnSave !== false;

  useEffect(() => {
    const fetchUserCity = async () => {
      if (currentUser) {
        setFetchingInitialCity(true);
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          const docSnap = await userDocRef.get();
          if (docSnap.exists && docSnap.data()?.selectedCity) {
            setSelectedCity(docSnap.data()?.selectedCity);
          } else if (turkishCities.length > 0 && !selectedCity) { // Eğer seçili şehir yoksa ve liste boş değilse
            // setSelectedCity(''); // Veya varsayılan olarak "Lütfen bir şehir seçin..." kalsın
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
  }, [currentUser]); // selectedCity'yi bağımlılıktan çıkardık, gereksiz yeniden render'ı önlemek için

  const handleSaveCity = async () => {
    if (!selectedCity) {
      Alert.alert('Hata', 'Lütfen bir şehir seçin.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      await userDocRef.set({ selectedCity: selectedCity }, { merge: true });

      Alert.alert('Başarılı', 'Şehir bilginiz kaydedildi!');
      if (fromProfile) {
        if (navigation.canGoBack()) navigation.goBack();
      } else if (navigateToHomeOnSave) {
        navigation.replace('Home');
      }
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
        Size en yakın barınakları ve dostlarımızı gösterebilmemiz için bu bilgiye ihtiyacımız var.
      </Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCity}
          onValueChange={(itemValue) => setSelectedCity(itemValue || '')} // itemValue null olabilir, boş stringe çevir
          style={styles.picker}
          prompt="Bir şehir seçin"
        >
          <Picker.Item label="Lütfen bir şehir seçin..." value="" />
          {turkishCities.map((city: string) => ( // city parametresine string tipi eklendi
            <Picker.Item key={city} label={city} value={city} />
          ))}
        </Picker>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{marginTop: 20}}/>
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
  pickerContainer: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 50,
    color: '#333',
  },
  button: { backgroundColor: '#007bff', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
});

export default SelectCityScreen;
