// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Image, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase'; // Firebase importlarınızın doğru olduğundan emin olun
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// MainStackParamList'i kendi navigasyon dosyanızdan import edin
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

interface UserProfile {
  uid?: string; displayName?: string | null; email?: string | null;
  age?: number | null; location?: string | null; selectedCity?: string | null;
  profileImageUrl?: string | null; bio?: string | null;
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

// Donation ve VirtualAdoption interfaceleri yeni ekranlarda kullanılacak,
// burada sadece sayılar için fetch fonksiyonları kalabilir.

interface InfoRowProps {
  label: string;
  value: string | number | undefined; // undefined eklendi
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value !== undefined ? String(value) : 'N/A'}</Text>
    </View>
);

const ProfileScreen = ({ navigation }: Props) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [donationCount, setDonationCount] = useState<number>(0);
  const [virtualAdoptionCount, setVirtualAdoptionCount] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true); // Bağış ve sahiplenme sayıları için
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
          // Firestore'da kullanıcı profili yoksa, Auth bilgilerinden temel bir profil oluştur
          setUserProfile({ displayName: currentUser.displayName, email: currentUser.email });
        }
      } catch (error) {
        console.error("Profil bilgileri alınırken hata:", error);
        // Hata durumunda da Auth bilgilerini göster
        setUserProfile({ displayName: currentUser.displayName, email: currentUser.email });
      } finally {
        setLoadingProfile(false);
      }
    } else {
      setLoadingProfile(false);
      setUserProfile(null); // Kullanıcı yoksa profili temizle
    }
  }, [currentUser]);

  const fetchStats = useCallback(async () => {
    if (currentUser) {
      setLoadingStats(true);
      try {
        // Bağış sayısını çek
        const donationsQuery = db.collection('donations').where('userId', '==', currentUser.uid);
        const donationsSnapshot = await donationsQuery.get();
        setDonationCount(donationsSnapshot.size);

        // Aktif sanal sahiplenme sayısını çek
        const adoptionsQuery = db.collection('virtualAdoptions')
          .where('userId', '==', currentUser.uid)
          .where('status', '==', 'active'); // Sadece aktif olanları say
        const adoptionsSnapshot = await adoptionsQuery.get();
        setVirtualAdoptionCount(adoptionsSnapshot.size);

      } catch (error) {
        console.error("İstatistikler çekilirken hata:", error);
        // Hata durumunda sayaçları sıfırla veya bir uyarı göster
        setDonationCount(0);
        setVirtualAdoptionCount(0);
      } finally {
        setLoadingStats(false);
      }
    } else {
      setDonationCount(0);
      setVirtualAdoptionCount(0);
      setLoadingStats(false);
    }
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
      fetchStats(); // Bağış ve sahiplenme listeleri yerine sayıları çek
    }, [fetchProfileData, fetchStats])
  );

  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Çıkış yapmak istediğinizden emin misiniz?",
      [{ text: "İptal", style: "cancel" },
       { text: "Evet, Çıkış Yap", onPress: async () => {
         try { await auth.signOut(); /* Navigasyon AppNavigator'da yönetilecek */ } catch (error: any) {
           console.error("Çıkış Hatası:", error); Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
         }}, style: "destructive" }])
  };

  if (loadingProfile) {
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>);
  }
  if (!currentUser || !userProfile) { // currentUser veya userProfile null ise giriş yap ekranına yönlendir (AppNavigator'da yapılabilir)
    return (
        <View style={styles.loaderContainer}>
            <Text style={styles.emptyListText}>Profil bilgileri yüklenemedi veya giriş yapılmamış.</Text>
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={() => navigation.replace('Login')}>
                <Text style={styles.buttonText}>Giriş Yap</Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Image
                    source={userProfile?.profileImageUrl || currentUser.photoURL ? { uri: userProfile?.profileImageUrl || currentUser.photoURL! } : require('../assets/default-avatar.png')}
                    style={styles.avatar}
                />
                <Text style={styles.displayName}>{userProfile?.displayName || currentUser.displayName || 'Kullanıcı Adı'}</Text>
                <Text style={styles.email}>{userProfile?.email || currentUser.email}</Text>
            </View>

            <View style={styles.infoSection}>
                <InfoRow label="Yaş" value={userProfile?.age ? userProfile.age.toString() : undefined} />
                <InfoRow label="Yaşadığı Şehir" value={userProfile?.selectedCity} />
                <InfoRow label="Hakkımda" value={userProfile?.bio || 'Henüz bir bilgi girilmemiş.'} />
            </View>

            {/* İstatistik Kartı */}
            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{loadingStats ? <ActivityIndicator size="small" color={colors.primary}/> : donationCount}</Text>
                    <Text style={styles.statLabel}>Toplam Bağış</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{loadingStats ? <ActivityIndicator size="small" color={colors.primary}/> : virtualAdoptionCount}</Text>
                    <Text style={styles.statLabel}>Sanal Sahiplenme</Text>
                </View>
            </View>

            {/* Navigasyon Butonları */}
            <TouchableOpacity
                style={[styles.button, styles.profileActionButton]}
                onPress={() => navigation.navigate('MyDonations')} // Yeni ekrana yönlendirme
            >
                <Text style={styles.buttonText}>Yaptığım Bağışlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.profileActionButton]}
                onPress={() => navigation.navigate('MyVirtualAdoptions')} // Yeni ekrana yönlendirme
            >
                <Text style={styles.buttonText}>Sanal Sahiplendiklerim</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => navigation.navigate('EditProfile')} >
                <Text style={styles.buttonText}>Profili Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cityButton]} onPress={() => navigation.navigate('SelectCity', { fromProfile: true, navigateToHomeOnSave: false })} >
                <Text style={styles.buttonText}>Yaşadığım Şehri Değiştir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout} >
                <Text style={styles.buttonText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

// Renkler (Mobil uygulamanızın genel renk paletinden alınabilir)
const colors = {
  primary: '#007bff', // Ana mavi
  secondary: '#6c757d', // Gri
  light: '#f8f9fa', // Açık arka plan
  dark: '#343a40', // Koyu metin
  white: '#ffffff',
  accent: '#ffc107', // Vurgu rengi (sarı)
  danger: '#dc3545', // Kırmızı (çıkış butonu)
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.light,
  },
  container: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  avatar: {
    width: 120, // Avatar boyutu artırıldı
    height: 120,
    borderRadius: 60, // Tam yuvarlak
    marginBottom: 15,
    borderWidth: 4, // Daha belirgin kenarlık
    borderColor: colors.primary,
    backgroundColor: '#e0e0e0',
  },
  displayName: {
    fontSize: 26, // Font boyutu artırıldı
    fontWeight: '600', // Yarı kalın
    color: colors.textPrimary,
    marginBottom: 5,
  },
  email: {
    fontSize: 16, // Font boyutu artırıldı
    color: colors.textSecondary,
    marginBottom: 20,
  },
  infoSection: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 12, // Daha yuvarlak köşeler
    padding: 20,
    elevation: 4, // Android için gölge
    shadowColor: "#000", // iOS için gölge
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10, // Dikey padding artırıldı
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16, // Font boyutu artırıldı
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16, // Font boyutu artırıldı
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 20, // Dikey padding artırıldı
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20, // Font boyutu artırıldı
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
  },
  button: {
    width: '100%', // Butonlar tam genişlikte
    paddingVertical: 14, // Dikey padding artırıldı
    borderRadius: 10, // Daha yuvarlak köşeler
    alignItems: 'center',
    marginBottom: 12, // Butonlar arası boşluk
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.15,
    shadowRadius: 2.0,
  },
  profileActionButton: { // Bağışlarım ve Sahiplendiklerim butonları için
    backgroundColor: colors.primary, // Ana tema rengi
  },
  editButton: {
    backgroundColor: colors.accent, // Vurgu rengi (sarı)
  },
  cityButton: {
    backgroundColor: colors.secondary, // İkincil renk (gri)
  },
  logoutButton: {
    backgroundColor: colors.danger, // Tehlike rengi (kırmızı)
    marginTop: 15, // Çıkış butonu için üst boşluk
  },
  buttonText: {
    color: colors.white, // Beyaz buton yazısı
    fontSize: 16, // Font boyutu artırıldı
    fontWeight: '600', // Yarı kalın
  },
  emptyListText: { // Bu stil yeni ekranlarda kullanılacak
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  // listLoader stili artık burada gereksiz, yeni ekranlarda olacak.
});

export default ProfileScreen;
