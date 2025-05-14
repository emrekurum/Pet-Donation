// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Alert, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import { MainStackParamList } from '../navigation/AppNavigator'; // AppNavigator'dan tipleri import et

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

interface Shelter {
  id: string; name?: string; city?: string; imageUrl?: string;
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
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data()?.selectedCity) {
        cityToFilter = userDoc.data()?.selectedCity;
        setUserSelectedCity(cityToFilter);
      } else {
        console.log('HomeScreen: Kullanıcı şehir seçmemiş veya bilgi alınamadı.');
        setLoading(false);
        setShelters([]);
        return;
      }

      if (cityToFilter) {
        const sheltersQuery = db.collection('shelters').where('city', '==', cityToFilter).limit(20);
        const querySnapshot = await sheltersQuery.get();
        const sheltersData: Shelter[] = [];
        querySnapshot.forEach(documentSnapshot => {
          sheltersData.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          } as Shelter);
        });
        setShelters(sheltersData);
      } else {
        setShelters([]);
      }
    } catch (err) {
      console.error("Kullanıcı veya barınak verisi alınırken hata:", err);
      setError("Veriler yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserAndShelters();
    }, [fetchUserAndShelters])
  );

  const handleShelterPress = (shelter: Shelter) => {
    // <<< DEĞİŞİKLİK BURADA: 'ShelterAnimals' yerine 'AnimalTypes' ekranına yönlendiriyoruz
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
      {shelters.length === 0 && !loading ? (
        <View style={styles.loaderContainer}>
            <Text style={styles.infoText}>{userSelectedCity} şehrinde gösterilecek barınak bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={shelters}
          renderItem={renderShelterItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && userSelectedCity ? (
              <View style={styles.loaderContainer}>
                <Text style={styles.infoText}>{userSelectedCity} şehrinde barınak bulunamadı.</Text>
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', },
  infoText: { fontSize: 16, textAlign: 'center', color: '#636e72', marginTop: 30, },
  listContentContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20, },
  itemContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, alignItems: 'center', },
  itemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: '#eee', },
  itemInfo: { flex: 1, },
  itemName: { fontSize: 17, fontWeight: '600', color: '#2d3436', marginBottom: 4, },
  itemCity: { fontSize: 14, color: '#636e72', },
  buttonLink: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#007bff', borderRadius: 20, },
  buttonLinkText: { color: '#fff', fontSize: 16, fontWeight: 'bold', }
});
export default HomeScreen;
