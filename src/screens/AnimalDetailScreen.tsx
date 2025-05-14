// src/screens/AnimalDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../api/firebase';
import { MainStackParamList } from '../navigation/AppNavigator'; // <<< DEĞİŞİKLİK BURADA

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalDetail'>; // <<< DEĞİŞİKLİK BURADA

interface AnimalDetails {
  id: string; name?: string; type?: string; breed?: string; age?: number;
  imageUrl?: string; description?: string; shelterId?: string; shelterName?: string;
  needs?: string[];
}

const AnimalDetailScreen = ({ route, navigation }: Props) => {
  const { animalId } = route.params; // animalName'i de alabiliriz: const { animalId, animalName } = route.params;
  const [animal, setAnimal] = useState<AnimalDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = db.collection('animals').doc(animalId)
      .onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          setAnimal({ id: docSnapshot.id, ...docSnapshot.data() } as AnimalDetails);
        } else {
          Alert.alert("Hata", "Hayvan bulunamadı.");
          navigation.goBack();
        }
        setLoading(false);
      }, (error) => {
        console.error("Hayvan detayı çekilirken hata: ", error);
        Alert.alert("Hata", "Hayvan detayları yüklenemedi.");
        setLoading(false);
        navigation.goBack();
      });
    return () => unsubscribe();
  }, [animalId, navigation]);

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  if (!animal) {
    return <View style={styles.loaderContainer}><Text>Hayvan bilgileri yüklenemedi.</Text></View>;
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {animal.imageUrl ? (
          <Image source={{ uri: animal.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Image source={require('../assets/default-animal.png')} style={styles.image} resizeMode="contain" />
        )}
        <Text style={styles.name}>{animal.name || 'İsimsiz'}</Text>
        <View style={styles.infoRow}><Text style={styles.label}>Tür:</Text><Text style={styles.value}>{animal.type || 'N/A'}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Cins:</Text><Text style={styles.value}>{animal.breed || 'N/A'}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Yaş:</Text><Text style={styles.value}>{animal.age !== undefined ? animal.age : 'N/A'}</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>Barınak:</Text><Text style={styles.value}>{animal.shelterName || 'N/A'}</Text></View>
        <Text style={styles.descriptionTitle}>Hakkında:</Text>
        <Text style={styles.description}>{animal.description || 'Açıklama bulunmuyor.'}</Text>
        {animal.needs && animal.needs.length > 0 && (
            <View style={styles.needsSection}><Text style={styles.needsTitle}>İhtiyaçları:</Text>
                {animal.needs.map((need, index) => (<Text key={index} style={styles.needItem}>• {need}</Text>))}
            </View>
        )}
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Bağış Yap", `${animal.name} için bağış yapma özelliği yakında!`)}><Text style={styles.buttonText}>Bağış Yap</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.virtualAdoptButton]} onPress={() => Alert.alert("Sanal Sahiplen", `${animal.name} için sanal sahiplenme özelliği yakında!`)}><Text style={styles.buttonText}>Sanal Sahiplen</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, borderRadius: 10, marginBottom: 20, backgroundColor: '#eee' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 16, fontWeight: '600', color: '#555' },
  value: { fontSize: 16, color: '#333' },
  descriptionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 5 },
  description: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 20 },
  needsSection: { marginTop: 15, marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 5 },
  needsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  needItem: { fontSize: 16, color: '#555', marginBottom: 3 },
  button: { backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 5 },
  virtualAdoptButton: { backgroundColor: '#ffc107' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AnimalDetailScreen;
