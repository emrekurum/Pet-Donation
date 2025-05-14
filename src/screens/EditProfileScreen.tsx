// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db, storage } from '../api/firebase';
// Firebase Web SDK importları kaldırıldı.
// import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { updateProfile } from 'firebase/auth';
import firestore from '@react-native-firebase/firestore'; // serverTimestamp için doğrudan firestore importu

import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

interface ProfileData {
  displayName: string;
  age: string;
  location: string;
  bio: string;
  profileImageUrl: string;
}

const EditProfileScreen = ({ navigation }: Props) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    age: '',
    location: '',
    bio: '',
    profileImageUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          const docSnap = await userDocRef.get();
          if (docSnap.exists) {
            const data = docSnap.data();
            setProfileData({
              displayName: data?.displayName || currentUser.displayName || '',
              age: data?.age ? data.age.toString() : '',
              location: data?.selectedCity || data?.location || '',
              bio: data?.bio || '',
              profileImageUrl: data?.profileImageUrl || currentUser.photoURL || '',
            });
          } else {
            setProfileData({
              displayName: currentUser.displayName || '',
              age: '',
              location: '',
              bio: '',
              profileImageUrl: currentUser.photoURL || '',
            });
          }
        } catch (error) {
          console.error("Profil bilgileri alınırken hata:", error);
          Alert.alert("Hata", "Profil bilgileri alınamadı.");
        } finally {
          setLoading(false);
        }
      } else {
        navigation.goBack();
      }
    };
    fetchUserProfile();
  }, [currentUser, navigation]);

  const handleInputChange = (name: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    if (!profileData.displayName.trim()) {
      Alert.alert('Hata', 'Görünen ad boş bırakılamaz.');
      return;
    }

    setSaving(true);
    try {
      let finalProfileImageUrl = profileData.profileImageUrl;
      // TODO: Resim yükleme mantığı (react-native-image-picker ve Firebase Storage ile)

      await currentUser.updateProfile({
        displayName: profileData.displayName.trim(),
        photoURL: finalProfileImageUrl || null,
      });

      const userDocRef = db.collection('users').doc(currentUser.uid);
      await userDocRef.update({
        displayName: profileData.displayName.trim(),
        age: profileData.age ? parseInt(profileData.age, 10) : null,
        selectedCity: profileData.location.trim(),
        bio: profileData.bio.trim(),
        profileImageUrl: finalProfileImageUrl || null,
        // <<< DEĞİŞİKLİK BURADA: serverTimestamp() kullanımı
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Profiliniz güncellendi!');
      navigation.goBack();
    } catch (error: any) {
      console.error("Profil güncellenirken hata:", error.message, error.code);
      Alert.alert('Hata', `Profil güncellenirken bir sorun oluştu: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Profili Düzenle</Text>
          <TouchableOpacity onPress={() => Alert.alert("Bilgi", "Resim yükleme özelliği yakında!")}>
            <Image
              source={profileData.profileImageUrl ? { uri: profileData.profileImageUrl } : require('../assets/default-avatar.png')}
              style={styles.avatar}
            />
            <Text style={styles.changePhotoText}>Profil Resmi URL'si</Text>
          </TouchableOpacity>
           <TextInput
            style={styles.input}
            placeholder="Profil Resmi URL'si"
            value={profileData.profileImageUrl}
            onChangeText={(value) => handleInputChange('profileImageUrl', value)}
            placeholderTextColor="#888"
          />
          <TextInput style={styles.input} placeholder="Görünen Adınız" value={profileData.displayName} onChangeText={(value) => handleInputChange('displayName', value)} placeholderTextColor="#888" />
          <TextInput style={styles.input} placeholder="Yaşınız" value={profileData.age} onChangeText={(value) => handleInputChange('age', value)} keyboardType="number-pad" placeholderTextColor="#888" />
          <TextInput style={styles.input} placeholder="Yaşadığınız Şehir" value={profileData.location} onChangeText={(value) => handleInputChange('location', value)} autoCapitalize="words" placeholderTextColor="#888" />
          <TextInput style={[styles.input, styles.bioInput]} placeholder="Hakkınızda (Bio)" value={profileData.bio} onChangeText={(value) => handleInputChange('bio', value)} multiline numberOfLines={3} placeholderTextColor="#888" />
          {saving ? (
            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }}/>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
              <Text style={styles.buttonText}>Kaydet</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa', },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 5, alignSelf: 'center', backgroundColor: '#e0e0e0', },
  changePhotoText: { textAlign: 'center', color: '#007bff', marginBottom: 10, },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, color: '#333', },
  bioInput: { height: 80, textAlignVertical: 'top', },
  button: { backgroundColor: '#007bff', paddingVertical: 15, borderRadius: 25, alignItems: 'center', width: '100%', marginTop: 10, },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
});

export default EditProfileScreen;
