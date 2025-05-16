// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo eklendi
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Alert, Platform, StatusBar, TextInput // TextInput eklendi
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

interface Shelter {
  id: string; name?: string; city?: string; imageUrl?: string;
}

const HomeScreen = ({ navigation }: Props) => {
  const user = auth.currentUser;
  const [allSheltersInCity, setAllSheltersInCity] = useState<Shelter[]>([]); // Şehirdeki tüm barınaklar
  const [filteredShelters, setFilteredShelters] = useState<Shelter[]>([]); // Filtrelenmiş barınaklar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSelectedCity, setUserSelectedCity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Arama terimi için state

  const fetchUserAndShelters = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let cityToFilter: string | null = null;

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data()?.selectedCity) {
        cityToFilter = userDoc.data()?.selectedCity;
        setUserSelectedCity(cityToFilter);
      } else {
        setLoading(false);
        setAllSheltersInCity([]);
        setFilteredShelters([]);
        // AppNavigator zaten SelectCity'ye yönlendirmeli, ama güvenlik için:
        // navigation.replace('SelectCity', { navigateToHomeOnSave: true });
        return;
      }

      if (cityToFilter) {
        const sheltersQuery = db.collection('shelters').where('city', '==', cityToFilter);
        // onSnapshot yerine get kullanarak başlangıçta bir kez çekelim, arama lokal yapılacak
        const querySnapshot = await sheltersQuery.get();
        const sheltersData: Shelter[] = [];
        querySnapshot.forEach(documentSnapshot => {
          sheltersData.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          } as Shelter);
        });
        setAllSheltersInCity(sheltersData);
        setFilteredShelters(sheltersData); // Başlangıçta tümü gösterilir
      } else {
        setAllSheltersInCity([]);
        setFilteredShelters([]);
      }
    } catch (err: any) {
      console.error("Kullanıcı veya barınak verisi alınırken hata:", err);
      setError(`Veriler yüklenirken bir sorun oluştu. (${err.message})`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserAndShelters();
    }, [fetchUserAndShelters])
  );

  // Arama terimi değiştikçe barınakları filtrele
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredShelters(allSheltersInCity);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filteredData = allSheltersInCity.filter(shelter => {
        return shelter.name?.toLowerCase().includes(lowercasedFilter);
      });
      setFilteredShelters(filteredData);
    }
  }, [searchTerm, allSheltersInCity]);


  const handleShelterPress = (shelter: Shelter) => {
    navigation.navigate('AnimalTypes', { shelterId: shelter.id, shelterName: shelter.name });
  };

  const renderShelterItem = ({ item }: { item: Shelter }) => (
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

  if (loading) {
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /><Text>Yükleniyor...</Text></View>);
  }
  if (error) {
    return (<View style={styles.loaderContainer}><Text style={styles.errorText}>{error}</Text></View>);
  }
  if (!userSelectedCity && !loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.infoText}>Barınakları görmek için lütfen önce yaşadığınız şehri seçin.</Text>
        <TouchableOpacity style={styles.buttonLink} onPress={() => navigation.navigate('SelectCity', { fromProfile: false, navigateToHomeOnSave: true })}>
            <Text style={styles.buttonLinkText}>Şehir Seç</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{userSelectedCity} Barınakları</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image source={user?.photoURL ? {uri: user.photoURL} : require('../assets/default-avatar.png')} style={styles.profileIcon} />
        </TouchableOpacity>
      </View>
      {user && (<Text style={styles.welcomeText}>Merhaba, {user.displayName || user.email}!</Text>)}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Barınak adı ile ara..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#888"
        />
      </View>

      {filteredShelters.length === 0 && !loading ? (
        <View style={styles.loaderContainer}>
            <Text style={styles.infoText}>
              {searchTerm ? `'${searchTerm}' için sonuç bulunamadı.` : `${userSelectedCity} şehrinde gösterilecek barınak bulunamadı.`}
            </Text>
        </View>
      ) : (
        <FlatList
          data={filteredShelters} // Filtrelenmiş veriyi kullan
          renderItem={renderShelterItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ // Bu, filteredShelters boşsa ve arama yapılıyorsa gösterilir
            !loading && searchTerm ? (
              <View style={styles.loaderContainer}>
                <Text style={styles.infoText}>'${searchTerm}' ile eşleşen barınak bulunamadı.</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7', },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 10) + 10 : 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#dfe6e9', },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2d3436', flexShrink: 1 },
  profileIcon: { width: 36, height: 36, borderRadius: 18, },
  welcomeText: { fontSize: 16, paddingHorizontal: 20, paddingVertical: 12, textAlign: 'left', color: '#636e72', backgroundColor: '#dfe6e9', borderBottomWidth: 1, borderBottomColor: '#b2bec3', },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5, // Arama çubuğu altına biraz boşluk
    backgroundColor: '#f0f4f7', // Arka planla aynı veya hafif farklı
  },
  searchInput: {
    height: 45,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 25, // Daha yuvarlak
    paddingHorizontal: 20, // İç boşluk
    fontSize: 16,
    color: '#333',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', },
  infoText: { fontSize: 16, textAlign: 'center', color: '#636e72', marginTop: 30, },
  listContentContainer: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 20, }, // paddingTop azaltıldı
  itemContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, alignItems: 'center', },
  itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: '#eee', },
  itemInfo: { flex: 1, },
  itemName: { fontSize: 17, fontWeight: '600', color: '#2d3436', marginBottom: 4, },
  itemCity: { fontSize: 14, color: '#636e72', },
  buttonLink: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#007bff', borderRadius: 20, },
  buttonLinkText: { color: '#fff', fontSize: 16, fontWeight: 'bold', }
});
export default HomeScreen;
