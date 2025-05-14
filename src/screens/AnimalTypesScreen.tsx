// src/screens/AnimalTypesScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../api/firebase';
import { MainStackParamList } from '../navigation/AppNavigator'; // <<< DEĞİŞİKLİK BURADA

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalTypes'>; // <<< DEĞİŞİKLİK BURADA

const AnimalTypesScreen = ({ route, navigation }: Props) => {
  const { shelterId, shelterName } = route.params;
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = db.collection('animals')
      .where('shelterId', '==', shelterId)
      .onSnapshot(querySnapshot => {
        if (querySnapshot) {
          const types = new Set<string>();
          querySnapshot.forEach(doc => {
            const type = doc.data().type as string;
            if (type) {
              types.add(type);
            }
          });
          setAnimalTypes(Array.from(types).sort());
        }
        setLoading(false);
      }, (error) => {
        console.error("Hayvan türleri çekilirken hata: ", error);
        Alert.alert("Hata", "Hayvan türleri yüklenemedi.");
        setLoading(false);
      });
    return () => unsubscribe();
  }, [shelterId]);

  const handleTypePress = (type: string) => {
    navigation.navigate('AnimalsList', { shelterId, shelterName, animalType: type });
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  if (animalTypes.length === 0) {
    return <View style={styles.loaderContainer}><Text>Bu barınakta kayıtlı hayvan türü bulunamadı.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={animalTypes}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemButton} onPress={() => handleTypePress(item)}>
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f4f7' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flex: 1, justifyContent: "space-around" },
  itemButton: {
    flex: 1,
    margin: 5,
    paddingVertical: 25,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    minHeight: 100,
  },
  itemText: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
});

export default AnimalTypesScreen;
