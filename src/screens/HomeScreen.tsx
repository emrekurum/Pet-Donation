// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Alert, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Ekran odaklandığında veri çekmek için
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

interface Shelter {
  id: string; name?: string; city?: string; imageUrl?: string;
}
interface UserProfile {
  selectedCity?: string | null;
}

const HomeScreen = ({ navigation }: Props) => {
  const user = auth.currentUser;
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSelectedCity, setUserSelectedCity] = useState<string | null>(null);

  const fetchUserAndShelters = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let cityToFilter: string | null = null;

    try {
      // 1. Kullanıcının seçtiği şehri Firestore'dan al
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data()?.selectedCity) {
        cityToFilter = userDoc.data()?.selectedCity;
        setUserSelectedCity(cityToFilter);
      } else {
        // Eğer kullanıcı şehir seçmemişse, AppNavigator zaten SelectCityScreen'e yönlendirmeli.
        // Bu ekrana gelinmişse bir sorun olabilir veya kullanıcı henüz seçim yapmamış olabilir.
        console.log('Kullanıcı henüz şehir seçmemiş.');
        setLoading(false);
        // navigation.replace('SelectCity'); // Gerekirse zorla yönlendir
        return;
      }

      // 2. Seçilen şehre göre barınakları çek
      if (cityToFilter) {
        const sheltersQuery = db.collection('shelters').where('city', '==', cityToFilter).limit(20);
        const unsubscribeShelters = sheltersQuery.onSnapshot(querySnapshot => {
          const sheltersData: Shelter[] = [];
          if (querySnapshot) {
            querySnapshot.forEach(documentSnapshot => {
              sheltersData.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data(),
              } as Shelter);
            });
            setShelters(sheltersData);
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore (Shelters) hatası:", err);
          setError(`Barınaklar yüklenirken bir hata oluştu (${cityToFilter}).`);
          setLoading(false);
        });
        return () => unsubscribeShelters(); // Listener'ı temizle
      } else {
        setShelters([]); // Şehir yoksa barınak listesini boşalt
        setLoading(false);
      }
    } catch (err) {
      console.error("Kullanıcı veya barınak verisi alınırken hata:", err);
      setError("Veriler yüklenirken bir sorun oluştu.");
      setLoading(false);
    }
  }, [user, navigation]); // user veya navigation değiştiğinde yeniden çalıştır

  // Ekran her odaklandığında verileri yeniden çekmek için (örn: şehir değiştirildikten sonra)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserAndShelters();
      return () => {
        // İsteğe bağlı olarak burada listener'ları temizleyebilirsiniz,
        // ancak onSnapshot zaten useEffect içinde temizleniyor.
      };
    }, [fetchUserAndShelters])
  );


  const handleShelterPress = (shelter: Shelter) => {
    navigation.navigate('ShelterAnimals', { shelterId: shelter.id, shelterName: shelter.name });
  };

  const renderShelterItem = ({ item }: { item: Shelter }) => ( /* ... (önceki gibi) ... */
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleShelterPress(item)}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/default-shelter.png')}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name || 'İsimsiz Barınak'}</Text>
        <Text style={styles.itemCity}>{item.city || 'Şehir belirtilmemiş'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) { /* ... (önceki gibi) ... */
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /><Text>Yükleniyor...</Text></View>);
  }
  if (error) { /* ... (önceki gibi) ... */
    return (<View style={styles.loaderContainer}><Text style={styles.errorText}>{error}</Text></View>);
  }
  if (!userSelectedCity && !loading) { // Yükleme bitti ve hala şehir seçilmemişse
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.infoText}>Barınakları görmek için lütfen önce yaşadığınız şehri seçin.</Text>
        <TouchableOpacity style={styles.buttonLink} onPress={() => navigation.navigate('SelectCity')}>
            <Text style={styles.buttonLinkText}>Şehir Seç</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{userSelectedCity || 'Tüm'} Barınakları</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={user?.photoURL ? {uri: user.photoURL} : require('../assets/default-avatar.png')} style={styles.profileIcon} />
        </TouchableOpacity>
      </View>
      {user && (<Text style={styles.welcomeText}>Merhaba, {user.displayName || user.email}!</Text>)}
      {shelters.length === 0 && !loading ? (
        <View style={styles.loaderContainer}>
            <Text style={styles.infoText}>{userSelectedCity} şehrinde gösterilecek barınak bulunamadı.</Text>
            <Text style={styles.infoTextSub}>Lütfen farklı bir şehir seçin veya bu şehir için barınak eklenmesini bekleyin.</Text>
        </View>
      ) : (
        <FlatList
          data={shelters}
          renderItem={renderShelterItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  // ... (önceki stiller büyük ölçüde aynı kalır, buttonLink için yeni stil eklenebilir)
  container: { flex: 1, backgroundColor: '#f0f4f7', },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 10) + 10 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#dfe6e9', },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2d3436', flexShrink: 1 }, // Başlık uzun olabileceği için
  profileIcon: { width: 36, height: 36, borderRadius: 18, },
  welcomeText: { fontSize: 16, paddingHorizontal: 20, paddingVertical: 12, textAlign: 'left', color: '#636e72', backgroundColor: '#dfe6e9', borderBottomWidth: 1, borderBottomColor: '#b2bec3', },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', },
  infoText: { fontSize: 16, textAlign: 'center', color: '#636e72', marginTop: 30, },
  infoTextSub: { fontSize: 14, textAlign: 'center', color: '#b2bec3', marginTop: 10, paddingHorizontal: 20, },
  listContentContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20, },
  itemContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, alignItems: 'center', },
  itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: '#eee', },
  itemInfo: { flex: 1, },
  itemName: { fontSize: 17, fontWeight: '600', color: '#2d3436', marginBottom: 4, },
  itemCity: { fontSize: 14, color: '#636e72', },
  buttonLink: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
    borderRadius: 20,
  },
  buttonLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
export default HomeScreen;
