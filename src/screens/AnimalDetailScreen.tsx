// src/screens/AnimalDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
  Alert, TouchableOpacity, Modal, TextInput, Platform, FlatList, Linking, Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalDetail'>;

interface AnimalDetails {
  id: string; name?: string; type?: string; breed?: string; age?: number;
  imageUrl?: string; photos?: string[]; description?: string;
  shelterId?: string; shelterName?: string; needs?: string[];
  virtualAdoptersCount?: number;
}

interface ShelterDetails {
  id: string; name?: string; contactPhone?: string; contactEmail?: string;
}

interface DonationData { type: string; amount?: string; description?: string; }

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}:</Text><Text style={styles.infoValue}>{String(value)}</Text></View>
);

const AnimalDetailScreen = ({ route, navigation }: Props) => {
  const { animalId } = route.params;
  const [animal, setAnimal] = useState<AnimalDetails | null>(null);
  const [shelterInfo, setShelterInfo] = useState<ShelterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [donationData, setDonationData] = useState<DonationData>({ type: 'Mama', amount: '', description: '' });
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [isAdoptingVirtually, setIsAdoptingVirtually] = useState(false);
  const [hasAlreadyAdopted, setHasAlreadyAdopted] = useState(false);
  const currentUser = auth.currentUser;

  const fetchData = useCallback(async () => {
    if (!animalId) {
      Alert.alert("Hata", "Hayvan ID'si bulunamadı.");
      if (navigation.canGoBack()) navigation.goBack();
      setLoading(false);
      return;
    }
    if (!currentUser) {
        Alert.alert("Hata", "Lütfen önce giriş yapın.");
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      const animalDocRef = db.collection('animals').doc(animalId);
      const docSnapshot = await animalDocRef.get();

      if (docSnapshot.exists) {
        const animalData = { id: docSnapshot.id, ...docSnapshot.data() } as AnimalDetails;
        setAnimal(animalData);

        if (animalData.shelterId) {
          const shelterDoc = await db.collection('shelters').doc(animalData.shelterId).get();
          if (shelterDoc.exists) {
            setShelterInfo({ id: shelterDoc.id, ...shelterDoc.data() } as ShelterDetails);
          }
        }

        const adoptionQuery = db.collection('virtualAdoptions')
                                .where('userId', '==', currentUser.uid)
                                .where('animalId', '==', animalId)
                                .limit(1);
        const adoptionSnapshot = await adoptionQuery.get();
        setHasAlreadyAdopted(!adoptionSnapshot.empty);
      } else {
        Alert.alert("Hata", "Hayvan bulunamadı.");
        if (navigation.canGoBack()) navigation.goBack();
      }
    } catch (error: any) {
      console.error("Veri çekilirken hata: ", error);
      let errorMessage = "Detaylar yüklenirken bir sorun oluştu.";
      if (error.code === 'firestore/failed-precondition') {
          errorMessage = "Veri yüklenemedi. Lütfen Firestore indekslerinizi kontrol edin.";
      }
      Alert.alert("Hata", errorMessage);
      if (navigation.canGoBack()) navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [animalId, currentUser, navigation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDonationModal = () => {
    setDonationData({ type: 'Mama', amount: '', description: '' });
    setModalVisible(true);
  };

  const handleDonationSubmit = async () => {
    if (!currentUser || !animal || !animal.id || !animal.shelterId) { Alert.alert("Hata", "Gerekli bilgiler yüklenemedi."); setIsSubmittingDonation(false); return; }
    if (!donationData.type) { Alert.alert("Hata", "Lütfen bağış türünü seçin."); return; }
    if (donationData.type === 'Nakit' && (!donationData.amount || isNaN(parseFloat(donationData.amount)) || parseFloat(donationData.amount) <= 0)) { Alert.alert("Hata", "Nakit bağış için geçerli bir miktar girin."); return;}
    if (donationData.type === 'Diğer' && !donationData.description?.trim()) { Alert.alert("Hata", "Diğer bağış türü için lütfen bir açıklama girin."); return; }
    setIsSubmittingDonation(true);
    try {
      await db.collection('donations').add({
        userId: currentUser.uid, userName: currentUser.displayName || currentUser.email,
        animalId: animal.id, animalName: animal.name, shelterId: animal.shelterId, shelterName: animal.shelterName,
        donationType: donationData.type,
        amount: donationData.type === 'Nakit' ? parseFloat(donationData.amount!) : null,
        description: donationData.type === 'Diğer' ? donationData.description : (donationData.type === 'Nakit' ? `${donationData.amount} TL Nakit Bağış` : donationData.type + " Bağışı"),
        donationDate: firestore.FieldValue.serverTimestamp(), status: 'Tamamlandı',
      });
      Alert.alert("Teşekkürler!", `${animal.name || 'Dostumuz'} için bağışınız başarıyla kaydedildi.`);
      setModalVisible(false);
    } catch (error: any) { console.error("Bağış kaydedilirken hata:", error); Alert.alert("Hata", `Bağışınız kaydedilirken bir sorun oluştu: ${error.message}`);
    } finally { setIsSubmittingDonation(false); }
  };

  const handleVirtualAdoption = async () => {
    if (!currentUser || !animal || !animal.id || !animal.shelterId) { Alert.alert("Hata", "Sanal sahiplenme için gerekli bilgiler yüklenemedi."); return; }
    if (hasAlreadyAdopted) { Alert.alert("Bilgi", "Bu sevimli dostu zaten sanal olarak sahiplendiniz!"); return; }
    setIsAdoptingVirtually(true);
    try {
      await db.collection('virtualAdoptions').add({
        userId: currentUser.uid, userDisplayName: currentUser.displayName || currentUser.email,
        animalId: animal.id, animalName: animal.name, shelterId: animal.shelterId, shelterName: animal.shelterName,
        adoptionDate: firestore.FieldValue.serverTimestamp(), status: 'active',
      });
      const animalRef = db.collection('animals').doc(animal.id);
      await db.runTransaction(async (transaction) => {
        const animalDoc = await transaction.get(animalRef);
        if (!animalDoc.exists) { throw "Hayvan dokümanı bulunamadı!"; }
        const currentAdoptersCount = animalDoc.data()?.virtualAdoptersCount || 0;
        transaction.update(animalRef, { virtualAdoptersCount: currentAdoptersCount + 1 });
      });
      setHasAlreadyAdopted(true);
      Alert.alert("Teşekkürler!", `${animal.name || 'Dostumuzu'} sanal olarak sahiplendiniz.`);
    } catch (error: any) { console.error("Sanal sahiplenme sırasında hata:", error); Alert.alert("Hata", `Sanal sahiplenme işlemi sırasında bir sorun oluştu: ${error.message}`);
    } finally { setIsAdoptingVirtually(false); }
  };

  const renderPhotoItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
  );

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }
  if (!animal) { // Bu kontrol sayesinde aşağıda animal! kullanabiliriz.
    return <View style={styles.loaderContainer}><Text>Hayvan bilgileri yüklenemedi.</Text></View>;
  }

  const displayImages = animal.photos && animal.photos.length > 0 ? animal.photos : (animal.imageUrl ? [animal.imageUrl] : []);
  
  const submitButtonContent = isSubmittingDonation ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Bağışı Tamamla</Text>;

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {displayImages.length > 0 ? (
          <FlatList
            data={displayImages}
            renderItem={renderPhotoItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            style={styles.imageGallery}
          />
        ) : (
          <Image source={require('../assets/default-animal.png')} style={styles.image} resizeMode="contain" />
        )}

        <Text style={styles.name}>{animal.name || 'İsimsiz'}</Text>
        <View style={styles.infoCard}>
            <InfoRow label="Tür" value={animal.type || 'N/A'} />
            <InfoRow label="Cins" value={animal.breed || 'N/A'} />
            <InfoRow label="Yaş" value={animal.age !== undefined ? animal.age.toString() : 'N/A'} />
            <InfoRow label="Barınak" value={animal.shelterName || shelterInfo?.name || 'N/A'} />
            {animal.virtualAdoptersCount !== undefined && <InfoRow label="Sanal Sahip Sayısı" value={animal.virtualAdoptersCount.toString()} />}
        </View>

        {shelterInfo && (shelterInfo.contactPhone || shelterInfo.contactEmail) && (
          <View style={styles.shelterContactCard}>
            <Text style={styles.sectionTitle}>Barınak İletişim</Text>
            {shelterInfo.contactPhone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${shelterInfo.contactPhone}`)}>
                <Text style={styles.contactText}>Telefon: {shelterInfo.contactPhone}</Text>
              </TouchableOpacity>
            )}
            {shelterInfo.contactEmail && (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${shelterInfo.contactEmail}`)}>
                <Text style={styles.contactText}>E-posta: {shelterInfo.contactEmail}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Hakkında</Text>
        <Text style={styles.description}>{animal.description || 'Açıklama bulunmuyor.'}</Text>

        {animal.needs && animal.needs.length > 0 && (
            <View style={styles.needsSection}>
                <Text style={styles.sectionTitle}>İhtiyaçları</Text>
                {animal.needs.map((need, index) => (
                    <View key={index} style={styles.needItemContainer}>
                        <Text style={styles.needItemText}>• {need}</Text>
                    </View>
                ))}
            </View>
        )}

        <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, (isAdoptingVirtually || hasAlreadyAdopted) && styles.disabledButton]}
              onPress={handleOpenDonationModal}
              disabled={isAdoptingVirtually || hasAlreadyAdopted || isSubmittingDonation}
            >
              <Text style={styles.buttonText}>Bu Dosta Bağış Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.virtualAdoptButton, hasAlreadyAdopted && styles.disabledButton]}
              onPress={handleVirtualAdoption}
              disabled={isAdoptingVirtually || hasAlreadyAdopted || isSubmittingDonation}
            >
              {isAdoptingVirtually ? <ActivityIndicator color="#333"/> : <Text style={styles.buttonTextDark}>{hasAlreadyAdopted ? "Sahiplenildi" : "Sanal Sahiplen"}</Text>}
            </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { if (!isSubmittingDonation) { setModalVisible(!modalVisible); } }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{(animal && animal.name) || 'Dostumuz'} İçin Bağış Yap</Text>
            <View style={styles.pickerContainer}>
                <Text style={styles.modalLabel}>Bağış Türü:</Text>
                <Picker selectedValue={donationData.type} style={styles.picker} onValueChange={(itemValue) => setDonationData(prev => ({...prev, type: itemValue, amount: '', description: ''}))} >
                    <Picker.Item label="Mama Bağışı" value="Mama" />
                    <Picker.Item label="İlaç Bağışı" value="İlaç" />
                    <Picker.Item label="Nakit Bağış" value="Nakit" />
                    <Picker.Item label="Diğer (Oyuncak, Malzeme vb.)" value="Diğer" />
                </Picker>
            </View>
            {donationData.type === 'Nakit' && ( <View style={styles.inputGroup}><Text style={styles.modalLabel}>Miktar (TL):</Text><TextInput style={styles.modalInput} placeholder="Örn: 50" keyboardType="numeric" value={donationData.amount} onChangeText={(text) => setDonationData(prev => ({...prev, amount: text}))} /></View> )}
            {donationData.type === 'Diğer' && ( <View style={styles.inputGroup}><Text style={styles.modalLabel}>Bağış Açıklaması:</Text><TextInput style={[styles.modalInput, styles.modalTextarea]} placeholder="Örn: Kedi Oyuncağı" multiline numberOfLines={3} value={donationData.description} onChangeText={(text) => setDonationData(prev => ({...prev, description: text}))} /></View> )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonClose]} onPress={() => setModalVisible(!modalVisible)} disabled={isSubmittingDonation} ><Text style={styles.modalButtonText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSubmit]} onPress={handleDonationSubmit} disabled={isSubmittingDonation} >
                {submitButtonContent}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { paddingBottom: 30, },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageGallery: { height: 300, marginBottom: 20, },
  galleryImage: { width: Platform.OS === 'web' ? 400 : Dimensions.get('window').width, height: 300, backgroundColor: '#e9ecef', },
  image: { width: '100%', height: 300, backgroundColor: '#e9ecef', marginBottom: 20, },
  name: { fontSize: 28, fontWeight: 'bold', color: '#2d3436', marginVertical: 15, textAlign: 'center', paddingHorizontal: 20, },
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginHorizontal: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  infoLabel: { fontSize: 16, fontWeight: '500', color: '#636e72' },
  infoValue: { fontSize: 16, color: '#2d3436', textAlign: 'right', flexShrink: 1 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3436', marginTop: 20, marginBottom: 10, paddingHorizontal: 20, },
  description: { fontSize: 16, color: '#636e72', lineHeight: 24, marginBottom: 20, paddingHorizontal: 20, },
  needsSection: { marginTop: 10, marginBottom: 20, paddingHorizontal: 20, },
  needItemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  needItemText: { fontSize: 16, color: '#555', },
  shelterContactCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginHorizontal: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, },
  contactText: { fontSize: 16, color: '#007bff', marginBottom: 5, textDecorationLine: 'underline', },
  buttonGroup: { marginTop: 20, paddingHorizontal: 20, },
  button: { backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  virtualAdoptButton: { backgroundColor: '#ffc107' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonTextDark: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#bdc3c7' },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%', },
  modalTitle: { marginBottom: 20, textAlign: "center", fontSize: 20, fontWeight: "bold" },
  pickerContainer: { width: '100%', marginBottom: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, },
  picker: { width: '100%', height: Platform.OS === 'ios' ? 180 : 50, },
  inputGroup: { width: '100%', marginBottom: 15, },
  modalLabel: { fontSize: 16, marginBottom: 5, color: '#333', alignSelf: 'flex-start' },
  modalInput: { width: '100%', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 16, backgroundColor: '#fff', },
  modalTextarea: { height: 80, textAlignVertical: 'top', },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, },
  modalButton: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 25, elevation: 2, minWidth: 100, alignItems: 'center' },
  modalButtonClose: { backgroundColor: "#7f8c8d", },
  modalButtonSubmit: { backgroundColor: "#27ae60", },
  modalButtonText: { color: "white", fontWeight: "bold", textAlign: "center" }
});

export default AnimalDetailScreen;
