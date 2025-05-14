// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Image, ScrollView, FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

interface UserProfile {
  uid?: string; displayName?: string | null; email?: string | null;
  age?: number | null; location?: string | null; selectedCity?: string | null;
  profileImageUrl?: string | null; bio?: string | null;
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

interface Donation {
  id: string;
  animalName?: string;
  shelterName?: string;
  donationType?: string;
  amount?: number;
  description?: string;
  donationDate?: FirebaseFirestoreTypes.Timestamp;
}

interface VirtualAdoption {
  id: string;
  animalName?: string;
  shelterName?: string;
  adoptionDate?: FirebaseFirestoreTypes.Timestamp;
  status?: string;
}

interface InfoRowProps {
  label: string;
  value: string | number;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const ProfileScreen = ({ navigation }: Props) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [virtualAdoptions, setVirtualAdoptions] = useState<VirtualAdoption[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingAdoptions, setLoadingAdoptions] = useState(true);
  const currentUser = auth.currentUser;

  const fetchProfileData = useCallback(async () => {
    if (currentUser) {
      setLoadingProfile(true);
      try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile({ displayName: currentUser.displayName, email: currentUser.email });
        }
      } catch (error) {
        console.error("Profil bilgileri alınırken hata:", error);
        setUserProfile({ displayName: currentUser.displayName, email: currentUser.email });
      } finally {
        setLoadingProfile(false);
      }
    } else {
      setLoadingProfile(false);
    }
  }, [currentUser]);

  const fetchDonations = useCallback(async () => {
    if (currentUser) {
      setLoadingDonations(true);
      try {
        const donationsQuery = db.collection('donations')
          .where('userId', '==', currentUser.uid)
          .orderBy('donationDate', 'desc')
          .limit(10);
        const snapshot = await donationsQuery.get();
        const userDonations: Donation[] = [];
        snapshot.forEach(doc => userDonations.push({ id: doc.id, ...doc.data() } as Donation));
        setDonations(userDonations);
      } catch (error: any) {
        console.error("Bağışlar çekilirken hata:", error);
        if (error.code === 'firestore/failed-precondition') {
          Alert.alert("İndeks Gerekli (Bağışlar)", "Bağışlarınızı görmek için Firebase konsolunda bir indeks oluşturmanız gerekiyor. Lütfen konsoldaki hata mesajındaki bağlantıyı takip edin veya manuel olarak oluşturun: Koleksiyon: 'donations', Alanlar: 'userId' (Artan), 'donationDate' (Azalan).");
        } else {
          Alert.alert("Hata", "Bağışlarınız yüklenirken bir sorun oluştu.");
        }
      } finally {
        setLoadingDonations(false);
      }
    } else {
      setLoadingDonations(false);
    }
  }, [currentUser]);

  const fetchVirtualAdoptions = useCallback(async () => {
    if (currentUser) {
      setLoadingAdoptions(true);
      try {
        const adoptionsQuery = db.collection('virtualAdoptions')
          .where('userId', '==', currentUser.uid)
          .where('status', '==', 'active')
          .orderBy('adoptionDate', 'desc')
          .limit(10);
        const snapshot = await adoptionsQuery.get();
        const userAdoptions: VirtualAdoption[] = [];
        snapshot.forEach(doc => userAdoptions.push({ id: doc.id, ...doc.data() } as VirtualAdoption));
        setVirtualAdoptions(userAdoptions);
      } catch (error: any) {
        console.error("Sanal sahiplenmeler çekilirken hata:", error);
         if (error.code === 'firestore/failed-precondition') {
          Alert.alert("İndeks Gerekli (Sahiplenmeler)", "Sanal sahiplenmelerinizi görmek için Firebase konsolunda bir indeks oluşturmanız gerekiyor. Lütfen konsoldaki hata mesajındaki bağlantıyı takip edin veya manuel olarak oluşturun: Koleksiyon: 'virtualAdoptions', Alanlar: 'userId' (Artan), 'status' (Artan), 'adoptionDate' (Azalan).");
        } else {
          Alert.alert("Hata", "Sanal sahiplenmeleriniz yüklenirken bir sorun oluştu.");
        }
      } finally {
        setLoadingAdoptions(false);
      }
    } else {
      setLoadingAdoptions(false);
    }
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
      fetchDonations();
      fetchVirtualAdoptions();
    }, [fetchProfileData, fetchDonations, fetchVirtualAdoptions])
  );

  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Çıkış yapmak istediğinizden emin misiniz?",
      [{ text: "İptal", style: "cancel" },
       { text: "Evet, Çıkış Yap", onPress: async () => {
          try { await auth.signOut(); } catch (error: any) {
            console.error("Çıkış Hatası:", error); Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
          }}, style: "destructive" }])
  };

  // DÜZELTİLMİŞ RENDER FONKSİYONLARI
  const renderDonationItem = ({ item }: { item: Donation }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemTitle}>{item.animalName || 'Genel Barınak Bağışı'}</Text>
      <Text>Tür: {item.donationType} {item.amount ? `(${item.amount} TL)` : ''}</Text>
      <Text>Tarih: {item.donationDate ? new Date(item.donationDate.toDate().getTime()).toLocaleDateString() : 'Bilinmiyor'}</Text>
      {item.description && item.donationType === 'Diğer' && <Text>Açıklama: {item.description}</Text>}
    </View>
  );

  const renderAdoptionItem = ({ item }: { item: VirtualAdoption }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemTitle}>{item.animalName || 'Bilinmeyen Hayvan'}</Text>
      <Text>Barınak: {item.shelterName || 'N/A'}</Text>
      <Text>Başlangıç: {item.adoptionDate ? new Date(item.adoptionDate.toDate().getTime()).toLocaleDateString() : 'Bilinmiyor'}</Text>
      <Text>Durum: {item.status === 'active' ? 'Aktif' : item.status}</Text>
    </View>
  );

  if (loadingProfile) {
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>);
  }
  if (!currentUser) {
    return (<View style={styles.container}><Text>Lütfen giriş yapın.</Text></View>);
  }

  return (
    <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Image source={userProfile?.profileImageUrl || currentUser.photoURL ? { uri: userProfile?.profileImageUrl || currentUser.photoURL! } : require('../assets/default-avatar.png')} style={styles.avatar} />
                <Text style={styles.displayName}>{userProfile?.displayName || currentUser.displayName || 'Kullanıcı Adı'}</Text>
                <Text style={styles.email}>{userProfile?.email || currentUser.email}</Text>
            </View>

            <View style={styles.infoSection}>
                <InfoRow label="Yaş" value={userProfile?.age ? userProfile.age.toString() : 'Belirtilmemiş'} />
                <InfoRow label="Yaşadığı Şehir" value={userProfile?.selectedCity || 'Belirtilmemiş'} />
                <InfoRow label="Hakkımda" value={userProfile?.bio || 'Henüz bir bilgi girilmemiş.'} />
                <InfoRow label="Toplam Bağış Sayısı" value={loadingDonations ? "Yükleniyor..." : donations.length} />
                <InfoRow label="Aktif Sanal Sahiplenme" value={loadingAdoptions ? "Yükleniyor..." : virtualAdoptions.length} />
            </View>

            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => navigation.navigate('EditProfile')} >
                <Text style={styles.buttonText}>Profili Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cityButton]} onPress={() => navigation.navigate('SelectCity', { fromProfile: true, navigateToHomeOnSave: false })} >
                <Text style={styles.buttonText}>Yaşadığım Şehri Değiştir</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Yaptığım Bağışlar</Text>
            {loadingDonations ? <ActivityIndicator style={styles.listLoader}/> : (
                <FlatList
                    data={donations}
                    renderItem={renderDonationItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    ListEmptyComponent={<Text style={styles.emptyListText}>Henüz hiç bağış yapmamışsınız.</Text>}
                />
            )}

            <Text style={styles.sectionTitle}>Sanal Sahiplendiklerim</Text>
            {loadingAdoptions ? <ActivityIndicator style={styles.listLoader}/> : (
                <FlatList
                    data={virtualAdoptions}
                    renderItem={renderAdoptionItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                    ListEmptyComponent={<Text style={styles.emptyListText}>Henüz sanal olarak bir dost sahiplenmemişsiniz.</Text>}
                />
            )}

            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout} >
                <Text style={styles.buttonText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f8f9fa', },
  container: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 15, },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20, },
  profileHeader: { alignItems: 'center', marginBottom: 20, },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, borderWidth: 3, borderColor: '#007bff', backgroundColor: '#e0e0e0', },
  displayName: { fontSize: 22, fontWeight: 'bold', color: '#333', },
  email: { fontSize: 14, color: '#666', marginBottom: 15, },
  infoSection: { width: '100%', marginBottom: 15, backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  infoLabel: { fontSize: 15, color: '#555', fontWeight: '500', },
  infoValue: { fontSize: 15, color: '#333', textAlign: 'right', flexShrink: 1, },
  button: { width: '95%', paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.20, shadowRadius: 2.62, },
  editButton: { backgroundColor: '#ffc107', },
  cityButton: { backgroundColor: '#17a2b8', },
  logoutButton: { backgroundColor: '#dc3545', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 25, marginBottom: 10, alignSelf: 'flex-start' },
  listItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee', width: '100%', },
  listItemTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, },
  emptyListText: { textAlign: 'center', color: '#777', marginTop: 10, marginBottom: 20, paddingHorizontal: 10, },
  listLoader: { marginVertical: 20, }
});

export default ProfileScreen;
