// src/screens/ShelterAnimalsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../api/firebase';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Navigasyon parametreleri için tipler (AppNavigator.tsx'de tanımlanacak)
export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  ShelterAnimals: { shelterId: string; shelterName?: string }; // Bu ekranın alacağı parametreler
  AnimalDetail: { animalId: string; animalName?: string };
};
type Props = NativeStackScreenProps<MainStackParamList, 'ShelterAnimals'>;

interface Animal {
  id: string;
  name?: string;
  type?: string;
  breed?: string;
  age?: number;
  imageUrl?: string;
  shelterName?: string; // Bu artık gerekmeyebilir, çünkü barınak zaten belli
  description?: string;
}

const ShelterAnimalsScreen = ({ route, navigation }: Props) => {
  const { shelterId, shelterName } = route.params; // Gelen parametreleri al
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const subscriber = db.collection('animals')
      .where('shelterId', '==', shelterId) // Sadece seçilen barınağa ait hayvanları filtrele
      .limit(20)
      .onSnapshot(querySnapshot => {
        const animalsData: Animal[] = [];
        if (querySnapshot) {
          querySnapshot.forEach(documentSnapshot => {
            animalsData.push({
              id: documentSnapshot.id,
              ...documentSnapshot.data(),
            } as Animal);
          });
          setAnimals(animalsData);
          setError(null);
        } else {
          setError("Hayvan verileri alınamadı (querySnapshot null).");
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore onSnapshot hatası (ShelterAnimalsScreen):", err);
        setError(`Hayvan verileri yüklenirken bir hata oluştu: ${err.message}`);
        Alert.alert("Hata", `Hayvan verileri yüklenirken bir sorun oluştu.`);
        setLoading(false);
      });

    return () => subscriber();
  }, [shelterId]); // shelterId değiştiğinde useEffect'i tekrar çalıştır

  const handleAnimalPress = (animal: Animal) => {
    Alert.alert(
      animal.name || 'Hayvan Detayı',
      `${animal.type} - ${animal.breed}\nYaş: ${animal.age}\n\n${animal.description || 'Açıklama yok.'}`
    );
    // navigation.navigate('AnimalDetail', { animalId: animal.id, animalName: animal.name });
  };

  const renderAnimalItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={styles.animalItemContainer}
      onPress={() => handleAnimalPress(item)}
    >
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/default-animal.png')}
        style={styles.animalImage}
        onError={(e) => console.log("Resim yükleme hatası:", item.imageUrl, e.nativeEvent.error)}
      />
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name || 'İsimsiz'}</Text>
        <Text style={styles.animalType}>{item.type || 'Tür belirtilmemiş'} - {item.breed || 'Cins belirtilmemiş'}</Text>
        {item.age !== undefined && <Text style={styles.animalAge}>Yaş: {item.age}</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Hayvanlar yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {animals.length === 0 && !loading ? (
        <View style={styles.loaderContainer}>
            <Text style={styles.infoText}>Bu barınakta gösterilecek hayvan bulunamadı.</Text>
        </View>
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

// Stiller HomeScreen'deki hayvan listeleme stillerine benzer olabilir,
// veya bu ekrana özel stiller tanımlanabilir.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#636e72',
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20,
  },
  animalItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
    alignItems: 'center',
  },
  animalImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  animalType: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 2,
  },
  animalAge: {
    fontSize: 13,
    color: '#818181',
    marginBottom: 4,
  },
});

export default ShelterAnimalsScreen;
