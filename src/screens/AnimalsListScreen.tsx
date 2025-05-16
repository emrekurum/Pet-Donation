// src/screens/AnimalsListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../api/firebase';
// FirebaseFirestoreTypes'ı genel tipler için ve Query'yi spesifik tip için import ediyoruz.
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalsList'>;

interface Animal {
  id: string; name?: string; type?: string; breed?: string;
  age?: number; imageUrl?: string; description?: string; shelterId?: string;
  dateAdded?: FirebaseFirestoreTypes.Timestamp;
}

type SortOption = 'name_asc' | 'name_desc' | 'age_asc' | 'age_desc' | 'date_desc' | 'date_asc';

// Sıralama yönü için string literal tipini kullanalım
type OrderByDirection = 'asc' | 'desc';

const AnimalsListScreen = ({ route, navigation }: Props) => {
  const { shelterId, animalType, shelterName } = route.params;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');

  useEffect(() => {
    setLoading(true);

    let query: FirebaseFirestoreTypes.Query = db.collection('animals')
      .where('shelterId', '==', shelterId)
      .where('type', '==', animalType);

    let orderByField: string = 'name';
    let orderByDirection: OrderByDirection = 'asc'; // Kendi tanımladığımız tipi kullanıyoruz

    switch (sortOption) {
      case 'name_asc':
        orderByField = 'name';
        orderByDirection = 'asc';
        break;
      case 'name_desc':
        orderByField = 'name';
        orderByDirection = 'desc';
        break;
      case 'age_asc':
        orderByField = 'age';
        orderByDirection = 'asc';
        break;
      case 'age_desc':
        orderByField = 'age';
        orderByDirection = 'desc';
        break;
      // case 'date_desc':
      //   orderByField = 'dateAdded'; // Firestore'da bu alanın Timestamp olması gerekir
      //   orderByDirection = 'desc';
      //   break;
      // case 'date_asc':
      //   orderByField = 'dateAdded';
      //   orderByDirection = 'asc';
      //   break;
    }

    // DİKKAT: Bu sorgular birleşik indeksler gerektirebilir.
    // Örneğin, ('shelterId', 'type', 'name' ASC/DESC) veya ('shelterId', 'type', 'age' ASC/DESC)
    // Firebase konsolunda hata mesajındaki linke tıklayarak indeksi oluşturun.
    query = query.orderBy(orderByField, orderByDirection).limit(30);

    const unsubscribe = query.onSnapshot(querySnapshot => {
      if (querySnapshot) {
        const animalsData: Animal[] = [];
        querySnapshot.forEach(doc => {
          animalsData.push({ id: doc.id, ...doc.data() } as Animal);
        });
        setAnimals(animalsData);
      }
      setLoading(false);
    }, (error: any) => {
      console.error(`${animalType} türündeki hayvanlar çekilirken hata (${shelterName}): `, error);
      if (error.code === 'firestore/failed-precondition') {
          Alert.alert("İndeks Gerekli", `Hayvanları '${orderByField}' alanına göre sıralamak için Firebase konsolunda bir indeks oluşturmanız gerekiyor. Lütfen konsoldaki hata mesajındaki bağlantıyı takip edin.`);
      } else {
        Alert.alert("Hata", `${animalType} türündeki hayvanlar yüklenemedi.`);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shelterId, animalType, shelterName, sortOption]);

  const handleAnimalPress = (animal: Animal) => {
    navigation.navigate('AnimalDetail', { animalId: animal.id, animalName: animal.name });
  };

  const renderAnimalItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity style={styles.animalItemContainer} onPress={() => handleAnimalPress(item)}>
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/default-animal.png')}
        style={styles.animalImage}
      />
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name || 'İsimsiz'}</Text>
        <Text style={styles.animalBreed}>{item.breed || 'Cins belirtilmemiş'}</Text>
        {item.age !== undefined && <Text style={styles.animalAge}>Yaş: {item.age}</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading && animals.length === 0) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /><Text>Hayvanlar yükleniyor...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={sortOption}
          onValueChange={(itemValue) => setSortOption(itemValue as SortOption)}
          style={styles.picker}
          prompt="Sıralama Ölçütü"
        >
          <Picker.Item label="İsme Göre (A-Z)" value="name_asc" />
          <Picker.Item label="İsme Göre (Z-A)" value="name_desc" />
          <Picker.Item label="Yaşa Göre (Artan)" value="age_asc" />
          <Picker.Item label="Yaşa Göre (Azalan)" value="age_desc" />
        </Picker>
      </View>

      {loading && animals.length > 0 && <ActivityIndicator size="small" color="#007bff" style={styles.inlineLoader}/>}

      {animals.length === 0 && !loading ? (
         <View style={styles.loaderContainer}><Text style={styles.infoText}>{shelterName} barınağında hiç {animalType.toLowerCase()} bulunamadı.</Text></View>
      ) : (
        <FlatList
          data={animals}
          renderItem={renderAnimalItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7', },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  inlineLoader: { marginVertical: 10, },
  pickerContainer: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  infoText: { fontSize: 16, color: '#636e72', textAlign: 'center' },
  listContentContainer: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 20, },
  animalItemContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, alignItems: 'center' },
  animalImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: '#eee' },
  animalInfo: { flex: 1 },
  animalName: { fontSize: 17, fontWeight: '600', color: '#2d3436', marginBottom: 4 },
  animalBreed: { fontSize: 14, color: '#636e72', marginBottom: 2 },
  animalAge: { fontSize: 13, color: '#818181' },
});

export default AnimalsListScreen;
