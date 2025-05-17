// src/screens/MyVirtualAdoptionsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert, Image
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // useNavigation eklendi
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase'; // Firebase importlarınızın doğru olduğundan emin olun
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// MainStackParamList'i kendi navigasyon dosyanızdan import edin
import { MainStackParamList } from '../navigation/AppNavigator'; // Yolu kendi projenize göre güncelleyin

// Bu ekran için Props tipi (AppNavigator'da tanımlanacak)
type Props = NativeStackScreenProps<MainStackParamList, 'MyVirtualAdoptions'>;

interface VirtualAdoption {
  id: string;
  animalId?: string; // Hayvan detayına gitmek için
  animalName?: string;
  shelterName?: string;
  animalImageUrl?: string; // Hayvanın resmi için
  adoptionDate?: FirebaseFirestoreTypes.Timestamp;
  status?: string; // 'active', 'expired' gibi durumlar olabilir
}

const MyVirtualAdoptionsScreen = ({ navigation }: Props) => {
  const [adoptions, setAdoptions] = useState<VirtualAdoption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  const fetchVirtualAdoptions = useCallback(async () => {
    if (!currentUser) {
      Alert.alert("Hata", "Sanal sahiplenmelerinizi görmek için lütfen giriş yapın.");
      setLoading(false);
      navigation.goBack(); // Veya login ekranına yönlendir
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const adoptionsQuery = db.collection('virtualAdoptions')
        .where('userId', '==', currentUser.uid)
        // .where('status', '==', 'active') // Sadece aktif olanları göstermek isterseniz
        .orderBy('adoptionDate', 'desc'); // En yeni sahiplenmeler üstte
      const snapshot = await adoptionsQuery.get();
      const userAdoptions: VirtualAdoption[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        userAdoptions.push({
          id: doc.id,
          animalId: data.animalId,
          animalName: data.animalName,
          shelterName: data.shelterName,
          animalImageUrl: data.animalImageUrl, // Firestore'da bu alanın kaydedildiğinden emin olun
          adoptionDate: data.adoptionDate as FirebaseFirestoreTypes.Timestamp,
          status: data.status,
        });
      });
      setAdoptions(userAdoptions);
    } catch (err: any) {
      console.error("Sanal sahiplenmeler çekilirken hata:", err);
      if (err.code === 'firestore/failed-precondition') {
        Alert.alert(
          "İndeks Gerekli",
          "Sanal sahiplenmelerinizi görmek için Firebase konsolunda bir indeks oluşturmanız gerekiyor. Lütfen konsoldaki hata mesajındaki bağlantıyı takip edin veya manuel olarak oluşturun: Koleksiyon: 'virtualAdoptions', Alanlar: 'userId' (Artan), 'status' (Artan - eğer kullanılıyorsa), 'adoptionDate' (Azalan)."
        );
      } else {
        Alert.alert("Hata", "Sanal sahiplenmeleriniz yüklenirken bir sorun oluştu.");
      }
      setError("Sanal sahiplenmeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      fetchVirtualAdoptions();
    }, [fetchVirtualAdoptions])
  );

  const navigateToAnimalDetail = (animalId?: string, animalName?: string) => {
    if (animalId) {
      navigation.navigate('AnimalDetail', { animalId, animalName });
    } else {
      Alert.alert("Hata", "Hayvan detayı bulunamadı.");
    }
  };

  const renderAdoptionItem = ({ item }: { item: VirtualAdoption }) => (
    <TouchableOpacity onPress={() => navigateToAnimalDetail(item.animalId, item.animalName)} style={styles.listItem}>
      {item.animalImageUrl ? (
        <Image source={{ uri: item.animalImageUrl }} style={styles.animalImage} />
      ) : (
        <View style={[styles.animalImage, styles.animalImagePlaceholder]}>
          <Text style={styles.animalImagePlaceholderText}>🐾</Text>
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.listItemTitle}>{item.animalName || 'Bilinmeyen Hayvan'}</Text>
        <Text style={styles.itemSubtitle}>Barınak: {item.shelterName || 'N/A'}</Text>
        <Text style={styles.itemSubtitle}>
          Sahiplenme Tarihi: {item.adoptionDate ? new Date(item.adoptionDate.toDate().getTime()).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
        </Text>
        {item.status && <Text style={[styles.itemSubtitle, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>Durum: {item.status === 'active' ? 'Aktif' : item.status}</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchVirtualAdoptions}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={adoptions}
      renderItem={renderAdoptionItem}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={adoptions.length === 0 ? styles.emptyListContainer : styles.listContentContainer}
      ListEmptyComponent={
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Henüz sanal olarak bir dost sahiplenmemişsiniz.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')} // Ana sayfaya veya hayvan listeleme ekranına yönlendir
          >
            <Text style={styles.exploreButtonText}>Sahiplenilecek Canları Keşfet</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

// Renkler (MyDonationsScreen.tsx'teki colors objesiyle aynı veya benzer olabilir)
const colors = {
  primary: '#007bff',
  secondary: '#6c757d',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  error: '#dc3545',
  activeGreen: '#28a745',
  inactiveGray: '#adb5bd',
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.light,
  },
  listContentContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3, // Android için gölge
    shadowColor: "#000", // iOS için gölge
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2.00,
    flexDirection: 'row', // Resim ve detayları yan yana getirmek için
    alignItems: 'center',
  },
  animalImage: {
    width: 70, // Resim boyutu
    height: 70,
    borderRadius: 10, // Daha yuvarlak resim köşeleri
    marginRight: 15, // Resim ve detaylar arası boşluk
    backgroundColor: '#e0e0e0', // Placeholder rengi
  },
  animalImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImagePlaceholderText: {
    fontSize: 30, // Emoji boyutu
    color: colors.secondary,
  },
  itemDetails: {
    flex: 1, // Kalan alanı kaplaması için
  },
  listItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusActive: {
    color: colors.activeGreen,
    fontWeight: 'bold',
  },
  statusInactive: {
    color: colors.inactiveGray,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 17,
    color: colors.textSecondary,
    marginBottom: 25,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyVirtualAdoptionsScreen;
