// src/screens/ProfileScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {auth, db} from '../api/firebase';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'; // Sadece tip için
import {FirebaseAuthTypes} from '@react-native-firebase/auth';

// type MainStackParamList = { Profile: undefined; EditProfile: undefined; /* ... */ };
type Props = NativeStackScreenProps<any, 'Profile'>;

interface UserProfile {
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  age?: number | null;
  location?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

const ProfileScreen = ({navigation}: Props) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser; // Mevcut kullanıcıyı al

  useEffect(() => {
    if (currentUser) {
      const fetchUserProfile = async () => {
        setLoading(true);
        try {
          const userDocument = await db
            .collection('users')
            .doc(currentUser.uid)
            .get();
          if (userDocument.exists) {
            setUserProfile(userDocument.data() as UserProfile);
          } else {
            // Firestore'da doküman yoksa, Auth bilgilerini kullan
            setUserProfile({
              displayName: currentUser.displayName,
              email: currentUser.email,
            });
            console.log(
              "Firestore'da kullanıcı profili bulunamadı, Auth bilgileri kullanılıyor.",
            );
          }
        } catch (error) {
          console.error('Profil bilgileri alınırken hata:', error);
          Alert.alert('Hata', 'Profil bilgileri alınamadı.');
          setUserProfile({
            // Hata durumunda da Auth bilgilerini göster
            displayName: currentUser.displayName,
            email: currentUser.email,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchUserProfile();
    } else {
      // Kullanıcı yoksa (normalde AppNavigator yönlendirir)
      setLoading(false);
    }
  }, [currentUser]); // currentUser değiştiğinde useEffect'i tekrar çalıştır

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      {text: 'İptal', style: 'cancel'},
      {
        text: 'Evet, Çıkış Yap',
        onPress: async () => {
          try {
            await auth.signOut();
            // AppNavigator yönlendirmeyi yapacak
          } catch (error: any) {
            console.error('Çıkış Hatası:', error);
            Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!currentUser) {
    // Bu durum normalde AppNavigator tarafından yönetilir.
    return (
      <View style={styles.container}>
        <Text>Lütfen giriş yapın.</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.button}>
          <Text style={styles.buttonText}>Giriş Ekranına Git</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <Image
            source={
              userProfile?.profileImageUrl
                ? {uri: userProfile.profileImageUrl}
                : require('../assets/default-avatar.png')
            } // Varsayılan avatar ekleyin
            style={styles.avatar}
          />
          <Text style={styles.displayName}>
            {userProfile?.displayName ||
              currentUser.displayName ||
              'Kullanıcı Adı'}
          </Text>
          <Text style={styles.email}>
            {userProfile?.email || currentUser.email}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <InfoRow
            label="Yaş"
            value={
              userProfile?.age ? userProfile.age.toString() : 'Belirtilmemiş'
            }
          />
          <InfoRow
            label="Konum"
            value={userProfile?.location || 'Belirtilmemiş'}
          />
          <InfoRow
            label="Hakkımda"
            value={userProfile?.bio || 'Henüz bir bilgi girilmemiş.'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() =>
            Alert.alert('Bilgi', 'Profil düzenleme özelliği yakında!')
          } // TODO: EditProfileScreen'e yönlendir
        >
          <Text style={styles.buttonText}>Profili Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}>
          <Text style={styles.buttonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#007bff',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  infoSection: {
    width: '100%',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    flexShrink: 1, // Değer uzunsa sığması için
  },
  button: {
    width: '90%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButton: {
    backgroundColor: '#ffc107', // Sarı
  },
  logoutButton: {
    backgroundColor: '#dc3545', // Kırmızı
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
