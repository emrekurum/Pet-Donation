// src/screens/AnimalsListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../api/firebase';
import { MainStackParamList } from '../navigation/AppNavigator'; // <<< DEĞİŞİKLİK BURADA

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalsList'>; // <<< DEĞİŞİKLİK BURADA

interface Animal {
  id: string; name?: string; type?: string; breed?: string;
  age?: number; imageUrl?: string; description?: string; shelterId?: string;
}

const AnimalsListScreen = ({ route, navigation }: Props) => {
  const { shelterId, animalType, shelterName } = route.params;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = db.collection('animals')
      .where('shelterId', '==', shelterId)
      .where('type', '==', animalType)
      .onSnapshot(querySnapshot => {
        if (querySnapshot) {
          const animalsData: Animal[] = [];
          querySnapshot.forEach(doc => {
            animalsData.push({ id: doc.id, ...doc.data() } as Animal);
          });
          setAnimals(animalsData);
        }
        setLoading(false);
      }, (error) => {
        console.error(`${animalType} türündeki hayvanlar çekilirken hata: `, error);
        Alert.alert("Hata", `${animalType} türündeki hayvanlar yüklenemedi.`);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [shelterId, animalType]);

  const handleAnimalPress = (animal: Animal) => {
    navigation.navigate('AnimalDetail', { animalId: animal.id, animalName: animal.name });
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  if (animals.length === 0) {
    return <View style={styles.loaderContainer}><Text>{shelterName} barınağında hiç {animalType.toLowerCase()} bulunamadı.</Text></View>;
  }

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

  return (
    <View style={styles.container}>
      <FlatList
        data={animals}
        renderItem={renderAnimalItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7', },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  listContentContainer: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 20, },
  animalItemContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, alignItems: 'center', },
  animalImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: '#eee', },
  animalInfo: { flex: 1, },
  animalName: { fontSize: 17, fontWeight: '600', color: '#2d3436', marginBottom: 4, },
  animalBreed: { fontSize: 14, color: '#636e72', marginBottom: 2, },
  animalAge: { fontSize: 13, color: '#818181', },
});

export default AnimalsListScreen;
