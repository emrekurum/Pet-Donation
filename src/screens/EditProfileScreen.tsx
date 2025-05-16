// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary, ImagePickerResponse, Asset, ImageLibraryOptions } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker'; // Picker import edildi
import { turkishCities } from '../constants/cities'; // Şehir listesi import edildi

import { auth, db, storage } from '../api/firebase';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

interface ProfileData {
  displayName: string;
  age: string;
  selectedCity: string;
  bio: string;
  profileImageUrl: string;
}

const EditProfileScreen = ({ navigation }: Props) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '', age: '', selectedCity: '', bio: '', profileImageUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageAsset, setImageAsset] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transferred, setTransferred] = useState(0);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const userDocRef: FirebaseFirestoreTypes.DocumentReference = db.collection('users').doc(currentUser.uid);
          const docSnap: FirebaseFirestoreTypes.DocumentSnapshot = await userDocRef.get();
          if (docSnap.exists) {
            const data = docSnap.data();
            setProfileData({
              displayName: data?.displayName || currentUser.displayName || '',
              age: data?.age ? data.age.toString() : '',
              selectedCity: data?.selectedCity || data?.location || '',
              bio: data?.bio || '',
              profileImageUrl: data?.profileImageUrl || currentUser.photoURL || '',
            });
          } else {
            setProfileData({
              displayName: currentUser.displayName || '',
              age: '', selectedCity: '', bio: '',
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
        if(navigation.canGoBack()) navigation.goBack();
      }
    };
    fetchUserProfile();
  }, [currentUser, navigation]);

  const handleInputChange = (name: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleChoosePhoto = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: false,
    };
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) { console.log('User cancelled image picker'); }
      else if (response.errorCode) { console.log('ImagePicker Error: ', response.errorMessage); Alert.alert('Hata', `Resim seçilirken bir sorun oluştu: ${response.errorMessage}`); }
      else if (response.assets && response.assets.length > 0 && response.assets[0].uri) {
        setImageAsset(response.assets[0]);
      } else { Alert.alert('Hata', 'Resim seçilemedi.'); }
    });
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageAsset || !imageAsset.uri || !currentUser) {
      return profileData.profileImageUrl || currentUser?.photoURL || null;
    }
    const uploadUri = Platform.OS === 'ios' ? imageAsset.uri.replace('file://', '') : imageAsset.uri;
    const filename = imageAsset.fileName || `profile_${currentUser.uid}_${Date.now()}.${uploadUri.split('.').pop()}`;
    const storageRef = storage.ref(`profile_images/${currentUser.uid}/${filename}`);
    setUploading(true);
    setTransferred(0);
    const task = storageRef.putFile(uploadUri);
    task.on('state_changed', taskSnapshot => {
      setTransferred(Math.round((taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100));
    });
    try {
      await task;
      const url = await storageRef.getDownloadURL();
      setUploading(false);
      return url;
    } catch (e: any) {
      console.error("Resim yükleme veya URL alma hatası:", e);
      setUploading(false);
      Alert.alert('Resim Yükleme Hatası', `Profil resmi yüklenirken bir sorun oluştu: ${e.message}`);
      return null;
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    if (!profileData.displayName.trim()) { Alert.alert('Hata', 'Görünen ad boş bırakılamaz.'); return; }
    if (!profileData.selectedCity) { Alert.alert('Hata', 'Lütfen yaşadığınız şehri seçin.'); return; }

    setSaving(true);
    let finalProfileImageUrl = profileData.profileImageUrl;

    try {
      if (imageAsset && imageAsset.uri) { // Sadece yeni bir resim seçilmişse yükle
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          finalProfileImageUrl = uploadedUrl;
        }
      }

      await currentUser.updateProfile({
        displayName: profileData.displayName.trim(),
        photoURL: finalProfileImageUrl || null,
      });

      const userDocRef = db.collection('users').doc(currentUser.uid);
      await userDocRef.update({
        displayName: profileData.displayName.trim(),
        age: profileData.age ? parseInt(profileData.age, 10) : null,
        selectedCity: profileData.selectedCity.trim(),
        bio: profileData.bio.trim(),
        profileImageUrl: finalProfileImageUrl || null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Profiliniz güncellendi!');
      if(navigation.canGoBack()) navigation.goBack();
    } catch (error: any) {
      console.error("Profil güncellenirken hata:", error.message, error.code);
      Alert.alert('Hata', `Profil güncellenirken bir sorun oluştu: ${error.message}`);
    } finally {
      setSaving(false);
      setUploading(false);
      setImageAsset(null);
    }
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Profili Düzenle</Text>
          <TouchableOpacity onPress={handleChoosePhoto}>
            <Image
              source={imageAsset?.uri ? { uri: imageAsset.uri } : (profileData.profileImageUrl ? { uri: profileData.profileImageUrl } : require('../assets/default-avatar.png'))}
              style={styles.avatar}
            />
            <Text style={styles.changePhotoText}>Profil Resmini Değiştir</Text>
          </TouchableOpacity>
          {uploading && (
            <View style={styles.uploadStatus}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.uploadText}>Yükleniyor: {transferred}%</Text>
            </View>
          )}
          <TextInput style={styles.input} placeholder="Görünen Adınız" value={profileData.displayName} onChangeText={(value) => handleInputChange('displayName', value)} placeholderTextColor="#888" />
          <TextInput style={styles.input} placeholder="Yaşınız" value={profileData.age} onChangeText={(value) => handleInputChange('age', value)} keyboardType="number-pad" placeholderTextColor="#888" />
          
          <Text style={styles.label}>Yaşadığınız Şehir:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={profileData.selectedCity}
              onValueChange={(itemValue: string) => handleInputChange('selectedCity', itemValue || '')} // itemValue tipi eklendi
              style={styles.picker}
              prompt="Bir şehir seçin"
            >
              <Picker.Item label="Lütfen bir şehir seçin..." value="" />
              {turkishCities.map((city: string) => (
                <Picker.Item key={city} label={city} value={city} />
              ))}
            </Picker>
          </View>

          <TextInput style={[styles.input, styles.bioInput]} placeholder="Hakkınızda (Bio)" value={profileData.bio} onChangeText={(value) => handleInputChange('bio', value)} multiline numberOfLines={3} placeholderTextColor="#888" />
          {saving ? (
            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }}/>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleSaveProfile} disabled={uploading}>
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
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 10, alignSelf: 'center', backgroundColor: '#e0e0e0', },
  changePhotoText: { textAlign: 'center', color: '#007bff', marginBottom: 20, },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, color: '#333', },
  bioInput: { height: 80, textAlignVertical: 'top', },
  label: { fontSize: 16, color: '#333', marginBottom: 5, alignSelf: 'flex-start'},
  pickerContainer: { width: '100%', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 15, backgroundColor: '#fff', },
  picker: { width: '100%', height: Platform.OS === 'ios' ? 200 : 50, color: '#333', },
  button: { backgroundColor: '#007bff', paddingVertical: 15, borderRadius: 25, alignItems: 'center', width: '100%', marginTop: 10, },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
  uploadStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  uploadText: { marginLeft: 10, fontSize: 14, color: '#555' },
});

export default EditProfileScreen;
