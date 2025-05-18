// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Image, ScrollView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { MainStackParamList } from '../navigation/AppNavigator'; // Yolu kontrol edin

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

interface UserProfile {
  uid?: string; displayName?: string | null; email?: string | null;
  age?: number | null; location?: string | null; selectedCity?: string | null;
  profileImageUrl?: string | null; bio?: string | null;
  walletBalance?: number; // Cüzdan bakiyesi eklendi
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
    const displayValue = (value === null || value === undefined || String(value).trim() === '')
        ? 'Belirtilmemiş'
        : String(value);
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}:</Text>
            <Text style={styles.infoValue}>{displayValue}</Text>
        </View>
    );
};

const ProfileScreen = ({ navigation }: Props) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [donationCount, setDonationCount] = useState<number>(0);
  const [virtualAdoptionCount, setVirtualAdoptionCount] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const currentUser = auth.currentUser;

  const fetchProfileData = useCallback(async () => {
    if (currentUser) {
      setLoadingProfile(true);
      try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const docSnap = await userDocRef.get();
        if (docSnap.exists) {
          const data = docSnap.data() as UserProfile;
          setUserProfile(data);
          // Cüzdan bakiyesini de burada alabiliriz (WalletScreen'de de çekiliyor ama özet için iyi olabilir)
          // setWalletBalance(data.walletBalance || 0); // Eğer UserProfile'da walletBalance varsa
        } else {
          setUserProfile({ displayName: currentUser.displayName, email: currentUser.email, walletBalance: 0 });
        }
      } catch (error) {
        console.error("Profil bilgileri alınırken hata:", error);
        setUserProfile({ displayName: currentUser.displayName, email: currentUser.email, walletBalance: 0 });
      } finally {
        setLoadingProfile(false);
      }
    } else {
      setLoadingProfile(false);
      setUserProfile(null);
    }
  }, [currentUser]);

  const fetchStats = useCallback(async () => {
    if (currentUser) {
      setLoadingStats(true);
      try {
        const donationsQuery = db.collection('donations').where('userId', '==', currentUser.uid);
        const donationsSnapshot = await donationsQuery.get();
        setDonationCount(donationsSnapshot.size);

        const adoptionsQuery = db.collection('virtualAdoptions')
          .where('userId', '==', currentUser.uid)
          .where('status', '==', 'active');
        const adoptionsSnapshot = await adoptionsQuery.get();
        setVirtualAdoptionCount(adoptionsSnapshot.size);
      } catch (error) {
        console.error("İstatistikler çekilirken hata:", error);
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
      fetchStats();
    }, [fetchProfileData, fetchStats])
  );

  const handleLogout = async () => { /* ... (önceki gibi) ... */ };

  if (loadingProfile) {
    return (<View style={styles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  if (!currentUser || !userProfile) {
    return (
        <View style={styles.loaderContainer}>
            <Text style={styles.emptyListText}>Profil bilgilerini görüntülemek için lütfen giriş yapın.</Text>
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
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

            {/* Cüzdan Bakiyesi Özeti */}
            <TouchableOpacity style={styles.walletSummaryCard} onPress={() => navigation.navigate('WalletScreen')}>
                <Text style={styles.walletSummaryLabel}>Cüzdan Bakiyem</Text>
                <Text style={styles.walletSummaryBalance}>
                    {loadingProfile ? <ActivityIndicator size="small" color={colors.primary} /> : `${(userProfile?.walletBalance || 0).toFixed(2)} TL`}
                </Text>
                <Text style={styles.walletSummaryActionText}>Detaylar ve Para Yükle →</Text>
            </TouchableOpacity>


            <View style={styles.infoSection}>
                <InfoRow label="Yaş" value={userProfile?.age ? userProfile.age.toString() : undefined} />
                <InfoRow label="Yaşadığı Şehir" value={userProfile?.selectedCity ?? undefined} />
                <InfoRow label="Hakkımda" value={userProfile?.bio ?? undefined} />
            </View>

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

            <TouchableOpacity
                style={[styles.button, styles.profileActionButton]}
                onPress={() => navigation.navigate('MyDonations')}
            >
                <Text style={styles.buttonText}>Yaptığım Bağışlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.profileActionButton]}
                onPress={() => navigation.navigate('MyVirtualAdoptions')}
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

const colors = { /* ... (önceki gibi) ... */
  primary: '#007bff', secondary: '#6c757d', light: '#f8f9fa',
  dark: '#343a40', white: '#ffffff', accent: '#ffc107', // Vurgu rengi (sarı)
  success: '#28a745', // Başarı rengi (yeşil)
  danger: '#dc3545', textPrimary: '#212529', textSecondary: '#6c757d',
  border: '#dee2e6',
};

const styles = StyleSheet.create({
  // ... (önceki stiller) ...
  scrollView: { flex: 1, backgroundColor: colors.light, },
  container: { alignItems: 'center', paddingVertical: 25, paddingHorizontal: 20, },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light, padding: 20, },
  profileHeader: { alignItems: 'center', marginBottom: 25, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border, width: '100%', },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 4, borderColor: colors.primary, backgroundColor: '#e0e0e0', },
  displayName: { fontSize: 26, fontWeight: '600', color: colors.textPrimary, marginBottom: 5, },
  email: { fontSize: 16, color: colors.textSecondary, marginBottom: 20, },
  infoSection: { width: '100%', marginBottom: 20, backgroundColor: colors.white, borderRadius: 12, padding: 20, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center', },
  infoLabel: { fontSize: 16, color: colors.textSecondary, fontWeight: '500', },
  infoValue: { fontSize: 16, color: colors.textPrimary, textAlign: 'right', flexShrink: 1, },
  statsCard: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: colors.white, borderRadius: 12, paddingVertical: 20, paddingHorizontal: 15, marginBottom: 20, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, },
  statItem: { alignItems: 'center', },
  statValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary, },
  statLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 5, },
  button: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.15, shadowRadius: 2.0, },
  profileActionButton: { backgroundColor: colors.primary, }, // Ana tema rengi
  editButton: { backgroundColor: colors.accent, }, // Sarı
  cityButton: { backgroundColor: colors.secondary, }, // Gri
  logoutButton: { backgroundColor: colors.danger, marginTop: 15, },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600', },
  emptyListText: { textAlign: 'center', color: colors.textSecondary, marginTop: 20, paddingHorizontal: 10, fontSize: 16, },

  // Cüzdan Özeti Kartı Stilleri
  walletSummaryCard: {
    width: '100%',
    backgroundColor: colors.success, // Yeşil bir arka plan
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  walletSummaryLabel: {
    fontSize: 16,
    color: colors.white,
    marginBottom: 5,
  },
  walletSummaryBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  walletSummaryActionText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    textDecorationLine: 'underline',
  }
});

export default ProfileScreen;
