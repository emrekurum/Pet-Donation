// src/screens/MyDonationsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase'; // Firebase importlarınızın doğru olduğundan emin olun
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// MainStackParamList'i kendi navigasyon dosyanızdan import edin
import { MainStackParamList } from '../navigation/AppNavigator'; // Yolu kendi projenize göre güncelleyin

// Bu ekran için Props tipi (AppNavigator'da tanımlanacak)
type Props = NativeStackScreenProps<MainStackParamList, 'MyDonations'>;

interface Donation {
  id: string;
  animalName?: string;
  shelterName?: string;
  donationType?: string;
  amount?: number;
  currency?: string; // Para birimi eklendi
  description?: string;
  donationDate?: FirebaseFirestoreTypes.Timestamp; // Firestore Timestamp tipi
  // Profil ekranındaki Donation arayüzü ile aynı olmalı
}

const MyDonationsScreen = ({ navigation }: Props) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  const fetchDonations = useCallback(async () => {
    if (!currentUser) {
      Alert.alert("Hata", "Bağışlarınızı görmek için lütfen giriş yapın.");
      setLoading(false);
      navigation.goBack(); // Veya login ekranına yönlendir
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const donationsQuery = db.collection('donations')
        .where('userId', '==', currentUser.uid)
        .orderBy('donationDate', 'desc'); // En yeni bağışlar üstte
      const snapshot = await donationsQuery.get();
      const userDonations: Donation[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        userDonations.push({
          id: doc.id,
          animalName: data.animalName,
          shelterName: data.shelterName,
          donationType: data.donationType,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          donationDate: data.donationDate as FirebaseFirestoreTypes.Timestamp,
        });
      });
      setDonations(userDonations);
    } catch (err: any) { // Hata tipini any olarak belirttik, daha spesifik olabilir
      console.error("Bağışlar çekilirken hata:", err);
      if (err.code === 'firestore/failed-precondition') {
        Alert.alert(
          "İndeks Gerekli",
          "Bağışlarınızı görmek için Firebase konsolunda bir indeks oluşturmanız gerekiyor. Lütfen konsoldaki hata mesajındaki bağlantıyı takip edin veya manuel olarak oluşturun: Koleksiyon: 'donations', Alanlar: 'userId' (Artan), 'donationDate' (Azalan)."
        );
      } else {
        Alert.alert("Hata", "Bağışlarınız yüklenirken bir sorun oluştu.");
      }
      setError("Bağışlar yüklenemedi."); // Kullanıcıya hata mesajı göstermek için
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      fetchDonations();
    }, [fetchDonations])
  );

  const renderDonationItem = ({ item }: { item: Donation }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemTitle}>{item.animalName || item.shelterName || 'Genel Bağış'}</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Tür:</Text>
        <Text style={styles.detailValue}>{item.donationType || '-'}</Text>
      </View>
      {item.donationType === 'Nakit' && item.amount != null && ( // amount null değilse göster
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Miktar:</Text>
          <Text style={styles.detailValue}>{item.amount.toFixed(2)} {item.currency || 'TL'}</Text>
        </View>
      )}
      {item.description && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Açıklama:</Text>
          <Text style={styles.detailValue}>{item.description}</Text>
        </View>
      )}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Tarih:</Text>
        <Text style={styles.detailValue}>
          {item.donationDate ? new Date(item.donationDate.toDate().getTime()).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Bilinmiyor'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  if (error) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDonations}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={donations}
      renderItem={renderDonationItem}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={donations.length === 0 ? styles.emptyListContainer : styles.listContentContainer}
      ListEmptyComponent={
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Henüz hiç bağış yapmamışsınız.</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')} // Ana sayfaya veya hayvan listeleme ekranına yönlendir
          >
            <Text style={styles.exploreButtonText}>Destek Bekleyen Canları Keşfet</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

// Renkler (ProfileScreen.tsx'teki colors objesiyle aynı veya benzer olabilir)
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
    padding: 18, // İç boşluk artırıldı
    borderRadius: 12, // Daha yuvarlak köşeler
    marginBottom: 12, // Öğeler arası boşluk
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2, // Android için gölge
    shadowColor: "#000", // iOS için gölge
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  listItemTitle: {
    fontSize: 17, // Font boyutu artırıldı
    fontWeight: '600', // Yarı kalın
    color: colors.textPrimary,
    marginBottom: 8, // Başlık altı boşluk
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4, // Detay satırları arası boşluk
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },
  emptyListContainer: { // FlatList boşken içeriği ortalamak için
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
    fontSize: 17, // Font boyutu artırıldı
    color: colors.textSecondary,
    marginBottom: 25, // Butonla arası boşluk
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

export default MyDonationsScreen;
