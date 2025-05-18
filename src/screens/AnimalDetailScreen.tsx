// src/screens/AnimalDetailScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, ActivityIndicator,
  Alert, TouchableOpacity, Modal, TextInput, Platform, FlatList, Linking, Dimensions,
  StyleSheet
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import { MainStackParamList } from '../navigation/AppNavigator'; // Navigasyon tipleriniz

// Sabit item bedelleri (TL cinsinden)
const DONATION_ITEM_COSTS: { [key: string]: number } = {
  'Mama': 50,
  'Oyuncak': 30,
  'İlaç': 75,
};

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalDetail'>;

interface AnimalDetails {
  id: string; name?: string; type?: string; breed?: string; age?: number | string;
  imageUrl?: string; photos?: string[]; description?: string;
  shelterId?: string; shelterName?: string; needs?: string[];
  virtualAdoptersCount?: number;
}
interface ShelterDetails {
  id: string; name?: string; contactPhone?: string; contactEmail?: string; address?: string;
}
interface DonationFormData {
    type: string;
    amountInput: string;
    description: string;
}
interface InfoRowProps { label: string; value: string | number | undefined; }

// Renkler ve Ana Stil Tanımlamaları
const { width, height } = Dimensions.get('window');
const colors = {
  primary: '#007bff', primaryDark: '#0056b3', secondary: '#6c757d',
  accent: '#28a745', accentYellow: '#ffc107', accentDark: '#1e7e34',
  background: '#f0f2f5', surface: '#ffffff', textPrimary: '#212529',
  textSecondary: '#495057', textLight: '#ffffff', textDark: '#333333',
  error: '#dc3545', border: '#dee2e6', shadow: '#000', disabled: '#bdc3c7',
  depositGreen: '#20c997', donationRed: '#e74c3c',
};

const componentStyles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 30 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorTextContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: colors.error, textAlign: 'center', lineHeight: 24 },
  imageGallery: { height: 320, backgroundColor: '#e0e0e0' },
  galleryImage: { width: Dimensions.get('window').width, height: 320 },
  fallbackImageContainer: { width: '100%', height: 300, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  fallbackImageText: { fontSize: 18, color: colors.textSecondary },
  contentPadding: { paddingHorizontal: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginVertical: 15, textAlign: 'center' },
  infoCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 18, marginHorizontal: 20, marginBottom: 20, ...Platform.select({ ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 16, fontWeight: '500', color: colors.textSecondary, marginRight: 10 },
  infoValue: { fontSize: 16, color: colors.textPrimary, textAlign: 'right', flexShrink: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginTop: 10, marginBottom: 10, paddingHorizontal: 20 },
  description: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, paddingHorizontal: 20, marginBottom: 20 },
  needsSection: { backgroundColor: colors.surface, borderRadius: 12, padding: 18, marginHorizontal: 20, marginBottom: 20, ...Platform.select({ ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  needsTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
  needItemContainer: { paddingVertical: 5 },
  needItemText: { fontSize: 16, color: colors.textSecondary },
  shelterContactCard: { backgroundColor: '#e9f5ff', borderRadius: 12, padding: 18, marginHorizontal: 20, marginBottom: 20, borderColor: colors.primary, borderWidth:0.5, ...Platform.select({ ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 2 } }) },
  shelterNameText: { fontSize: 18, fontWeight: 'bold', color: colors.primaryDark, marginBottom: 8 },
  contactText: { fontSize: 16, color: colors.textSecondary, marginBottom: 5 },
  contactLink: { fontSize: 16, color: colors.primary, marginBottom: 5, textDecorationLine: 'underline' },
  mapPlaceholder: { height: 150, borderRadius: 12, marginBottom: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', padding: 10 },
  mapPlaceholderText: { textAlign: 'center', color: colors.textSecondary },
  buttonGroup: { marginTop: 15, paddingHorizontal: 20, paddingBottom: 20 },
  button: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 12, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  donateButton: { backgroundColor: colors.accent },
  virtualAdoptButton: { backgroundColor: colors.accentYellow },
  buttonText: { color: colors.textLight, fontSize: 16, fontWeight: 'bold' },
  buttonTextDark: { color: colors.textDark, fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: colors.disabled, opacity: 0.7 },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalView: { width: '90%', backgroundColor: colors.surface, borderRadius: 15, padding: 25, alignItems: "center", shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { marginBottom: 20, textAlign: "center", fontSize: 22, fontWeight: "bold", color: colors.textPrimary },
  pickerContainer: { width: '100%', marginBottom: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.background },
  picker: { width: '100%', height: Platform.OS === 'ios' ? 180 : 50, color: colors.textPrimary },
  inputGroup: { width: '100%', marginBottom: 15 },
  modalLabel: { fontSize: 16, marginBottom: 8, color: colors.textSecondary, alignSelf: 'flex-start' },
  modalInput: { width: '100%', height: 50, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#fff' },
  modalTextarea: { height: 80, textAlignVertical: 'top' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  modalButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, elevation: 2, flex:1, marginHorizontal:5, alignItems: 'center' },
  modalButtonClose: { backgroundColor: colors.secondary },
  modalButtonSubmit: { backgroundColor: colors.accent },
  // DÜZELTME: modalButtonText stili burada tanımlı olmalı ve yorum satırı olmamalı
  modalButtonText: { color: colors.textLight, fontWeight: "bold", textAlign: "center", fontSize: 16 },
});

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
    const displayValue = (value === null || value === undefined || String(value).trim() === '')
        ? 'Belirtilmemiş'
        : String(value);
    return (
        <View style={componentStyles.infoRow}>
            <Text style={componentStyles.infoLabel}>{label}:</Text>
            <Text style={componentStyles.infoValue}>{displayValue}</Text>
        </View>
    );
};

const Icon = ({ name, size, style }: { name: string, size: number, style?: any }) => (
  <Text style={[{ fontSize: size, color: colors.primary }, style]}>[{name.substring(0,1).toUpperCase()}]</Text>
);

const MapViewPlaceholder = () => (
    <View style={componentStyles.mapPlaceholder}>
        <Text style={componentStyles.mapPlaceholderText}>Harita özelliği için 'react-native-maps' kurulumu gereklidir.</Text>
    </View>
);

const AnimalDetailScreen = ({ route, navigation }: Props) => {
  const { animalId } = route.params;
  const [animal, setAnimal] = useState<AnimalDetails | null>(null);
  const [shelterInfo, setShelterInfo] = useState<ShelterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [donationForm, setDonationForm] = useState<DonationFormData>({
    type: 'Mama',
    amountInput: '',
    description: '',
  });
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [isAdoptingVirtually, setIsAdoptingVirtually] = useState(false);
  const [hasAlreadyAdopted, setHasAlreadyAdopted] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const currentUser: FirebaseAuthTypes.User | null = auth().currentUser;

  const donationTypes = [
    { label: `Mama Bağışı (${DONATION_ITEM_COSTS['Mama']} TL)`, value: 'Mama' },
    { label: 'Nakit Bağış', value: 'Nakit' },
    { label: `Oyuncak Bağışı (${DONATION_ITEM_COSTS['Oyuncak']} TL)`, value: 'Oyuncak' },
    { label: `İlaç/Veteriner Desteği (${DONATION_ITEM_COSTS['İlaç']} TL)`, value: 'İlaç' },
    { label: 'Diğer (Açıklama ve Miktar Girin)', value: 'Diğer' },
  ];

  const fetchData = useCallback(async () => {
    if (!animalId) {
      Alert.alert("Hata", "Hayvan ID'si bulunamadı.");
      if (navigation.canGoBack()) navigation.goBack();
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const animalDocRef = firestore().collection('animals').doc(animalId);
      const docSnapshot = await animalDocRef.get();

      if (docSnapshot.exists) {
        const animalDataTemp = { id: docSnapshot.id, ...docSnapshot.data() } as AnimalDetails;
        setAnimal(animalDataTemp);
        if (animalDataTemp.shelterId) {
          const shelterDoc = await firestore().collection('shelters').doc(animalDataTemp.shelterId).get();
          if (shelterDoc.exists) {
            setShelterInfo({ id: shelterDoc.id, ...shelterDoc.data() } as ShelterDetails);
          }
        }
        if (currentUser) {
          const adoptionQuery = firestore().collection('virtualAdoptions').where('userId', '==', currentUser.uid).where('animalId', '==', animalId).limit(1);
          const adoptionSnapshot = await adoptionQuery.get();
          setHasAlreadyAdopted(!adoptionSnapshot.empty);
        }
      } else {
        Alert.alert("Bulunamadı", `"${animalId}" ID'li hayvan bilgisi bulunamadı.`);
        setAnimal(null);
      }
    } catch (error: any) {
      console.error(`Hayvan verisi çekme hatası (${animalId}): `, error);
      Alert.alert("Veri Çekme Hatası", "Hayvan bilgileri yüklenirken bir sorun oluştu.");
      setAnimal(null);
    } finally {
      setLoading(false);
    }
  }, [animalId, currentUser, navigation]);


  const fetchUserWalletBalance = useCallback(async () => {
    if (currentUser) {
      setLoadingWallet(true);
      try {
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          setUserWalletBalance(userDoc.data()?.walletBalance || 0);
        } else {
          setUserWalletBalance(0);
        }
      } catch (error) {
        console.error("Cüzdan bakiyesi çekilirken hata:", error);
        setUserWalletBalance(0);
      } finally {
        setLoadingWallet(false);
      }
    }
   }, [currentUser]);

  useEffect(() => {
    fetchData();
    if (modalVisible) {
        fetchUserWalletBalance();
    }
  }, [fetchData, modalVisible, fetchUserWalletBalance]);

  const handleOpenDonationModal = () => {
    setDonationForm({ type: 'Mama', amountInput: '', description: '' });
    setModalVisible(true);
  };

  const handleDonationSubmit = async () => {
    if (!currentUser) { Alert.alert("Giriş Gerekli", "Bağış yapmak için lütfen giriş yapın."); return; }
    if (!animal) { Alert.alert("Hata", "Hayvan bilgisi bulunamadı, bağış yapılamıyor."); return; }

    let donationAmountValue: number;
    let donationDescription = donationForm.description;

    if (donationForm.type === 'Nakit') {
      donationAmountValue = parseFloat(donationForm.amountInput);
      if (isNaN(donationAmountValue) || donationAmountValue <= 0) {
        Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir nakit bağış miktarı girin.");
        return;
      }
    } else if (DONATION_ITEM_COSTS[donationForm.type]) {
      donationAmountValue = DONATION_ITEM_COSTS[donationForm.type];
      if (!donationDescription) {
        donationDescription = `${donationForm.type} Bağışı`;
      }
    } else if (donationForm.type === 'Diğer') {
        donationAmountValue = parseFloat(donationForm.amountInput);
        if (isNaN(donationAmountValue) || donationAmountValue <= 0) {
            Alert.alert("Geçersiz Miktar", "'Diğer' bağış türü için lütfen geçerli bir miktar girin.");
            return;
        }
        if (!donationDescription) {
            Alert.alert("Açıklama Gerekli", "'Diğer' bağış türü için lütfen bir açıklama girin.");
            return;
        }
    }
     else {
      Alert.alert("Geçersiz Bağış Türü", "Lütfen geçerli bir bağış türü seçin.");
      return;
    }

    if (userWalletBalance < donationAmountValue) {
      Alert.alert("Yetersiz Bakiye", `Cüzdanınızda yeterli bakiye bulunmuyor. Mevcut bakiye: ${userWalletBalance.toFixed(2)} TL`);
      return;
    }

    setIsSubmittingDonation(true);
    try {
      const userDocRef = firestore().collection('users').doc(currentUser.uid);
      const donationDocRef = firestore().collection('donations').doc();
      const walletTransactionDocRef = firestore().collection('walletTransactions').doc();

      await firestore().runTransaction(async (transaction) => {
        const userSnapshot = await transaction.get(userDocRef);
        if (!userSnapshot.exists) {
          throw "Kullanıcı bulunamadı!";
        }
        const currentBalance = (userSnapshot.data()?.walletBalance || 0) as number;
        if (currentBalance < donationAmountValue) {
          throw "Yetersiz bakiye!";
        }
        transaction.update(userDocRef, {
          walletBalance: currentBalance - donationAmountValue,
        });

        const donationPayload: FirebaseFirestoreTypes.DocumentData = {
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email || 'Bilinmeyen Kullanıcı',
          animalId: animal.id,
          animalName: animal.name ?? 'Bilinmiyor',
          shelterId: animal.shelterId ?? '',
          shelterName: shelterInfo?.name || animal.shelterName || 'Bilinmiyor',
          donationType: donationForm.type,
          amount: donationAmountValue,
          currency: 'TL',
          description: donationDescription,
          donationDate: firestore.FieldValue.serverTimestamp(),
          status: 'completed',
          paymentMethod: 'wallet',
        };
        transaction.set(donationDocRef, donationPayload);

        transaction.set(walletTransactionDocRef, {
          userId: currentUser.uid,
          type: 'donation',
          amount: donationAmountValue,
          description: `${animal.name || 'Hayvan'} için ${donationForm.type} bağışı`,
          relatedAnimalId: animal.id,
          relatedShelterId: animal.shelterId ?? '',
          relatedDonationId: donationDocRef.id,
          transactionDate: firestore.FieldValue.serverTimestamp(),
        });
      });

      Alert.alert("Bağış Başarılı!", "Bağışınız için teşekkür ederiz. Cüzdanınızdan düşüldü.");
      setModalVisible(false);
      setDonationForm({ type: 'Mama', amountInput: '', description: '' });
      fetchUserWalletBalance();

    } catch (error) {
      console.error("Bağış gönderme hatası (cüzdan): ", error);
      Alert.alert("Hata", `Bağış gönderilirken bir sorun oluştu: ${error}`);
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const handleVirtualAdoption = async () => { /* ... */ };
  const renderPhotoItem = ({ item }: { item: string }) => ( <Image source={{ uri: item }} style={componentStyles.galleryImage} resizeMode="cover" /> );

  if (loading) { return <View style={componentStyles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>; }
  if (!animal) { return <View style={componentStyles.errorTextContainer}><Text style={componentStyles.errorText}>Hayvan bilgileri yüklenemedi veya bulunamadı.</Text><Text style={componentStyles.errorText}>(ID: {animalId || "Belirtilmedi"})</Text></View>; }

  const displayImages = animal.photos && animal.photos.length > 0 ? animal.photos : (animal.imageUrl ? [animal.imageUrl] : []);
  const submitButtonContent = isSubmittingDonation ? <ActivityIndicator color="#fff" /> : <Text style={componentStyles.modalButtonText}>Bağışı Tamamla</Text>;
  const selectedDonationCost = DONATION_ITEM_COSTS[donationForm.type];
  const isNakitOrOther = donationForm.type === 'Nakit' || donationForm.type === 'Diğer';

  return (
    <ScrollView style={componentStyles.scrollView}>
        <View style={componentStyles.container}>
        {displayImages.length > 0 ? (
          <FlatList data={displayImages} renderItem={renderPhotoItem} keyExtractor={(item, index) => `photo-${animal.id}-${index}`} horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={componentStyles.imageGallery} />
        ) : (
          <View style={componentStyles.fallbackImageContainer}><Text style={componentStyles.fallbackImageText}>Resim Yok</Text></View>
        )}
        <View style={componentStyles.contentPadding}>
            <Text style={componentStyles.name}>{animal.name || 'İsimsiz'}</Text>
        </View>

        <View style={componentStyles.infoCard}>
            <InfoRow label="Tür" value={animal.type} />
            <InfoRow label="Cins" value={animal.breed} />
            <InfoRow label="Yaş" value={animal.age} />
            <InfoRow label="Barınak" value={animal.shelterName || shelterInfo?.name} />
            {animal.virtualAdoptersCount !== undefined && <InfoRow label="Sanal Sahip Sayısı" value={animal.virtualAdoptersCount} />}
        </View>

        {shelterInfo && (shelterInfo.contactPhone || shelterInfo.contactEmail || shelterInfo.address) && (
          <View style={componentStyles.shelterContactCard}>
            <Text style={componentStyles.shelterNameText}>{shelterInfo.name || 'Barınak Bilgileri'}</Text>
            {shelterInfo.address && <Text style={componentStyles.contactText}>Adres: {shelterInfo.address}</Text>}
            {shelterInfo.contactPhone && ( <TouchableOpacity onPress={() => Linking.openURL(`tel:${shelterInfo.contactPhone}`)}><Text style={componentStyles.contactLink}>Telefon: {shelterInfo.contactPhone}</Text></TouchableOpacity> )}
            {shelterInfo.contactEmail && ( <TouchableOpacity onPress={() => Linking.openURL(`mailto:${shelterInfo.contactEmail}`)}><Text style={componentStyles.contactLink}>E-posta: {shelterInfo.contactEmail}</Text></TouchableOpacity> )}
          </View>
        )}
        <View style={componentStyles.contentPadding}>
            <Text style={componentStyles.sectionTitle}>Hakkında</Text>
            <Text style={componentStyles.description}>{animal.description || 'Açıklama bulunmuyor.'}</Text>
        </View>

        {animal.needs && animal.needs.length > 0 && (
          <View style={componentStyles.needsSection}>
            <Text style={componentStyles.needsTitle}>İhtiyaçları</Text>
            {animal.needs.map((need, index) => ( <View key={index} style={componentStyles.needItemContainer}><Text style={componentStyles.needItemText}>• {need}</Text></View> ))}
          </View>
        )}

        <View style={componentStyles.buttonGroup}>
            <TouchableOpacity style={[componentStyles.button, componentStyles.donateButton, (isAdoptingVirtually || isSubmittingDonation) && componentStyles.disabledButton]} onPress={handleOpenDonationModal} disabled={isAdoptingVirtually || isSubmittingDonation}>
                <Text style={componentStyles.buttonText}>Bu Dosta Bağış Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[componentStyles.button, componentStyles.virtualAdoptButton, (isAdoptingVirtually || hasAlreadyAdopted) && componentStyles.disabledButton]} onPress={handleVirtualAdoption} disabled={isAdoptingVirtually || hasAlreadyAdopted || isSubmittingDonation}>
                {isAdoptingVirtually ? <ActivityIndicator color={colors.textDark}/> : <Text style={componentStyles.buttonTextDark}>{hasAlreadyAdopted ? "Sahiplenildi" : "Sanal Sahiplen"}</Text>}
            </TouchableOpacity>
        </View>
      </View>
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => { if (!isSubmittingDonation) { setModalVisible(!modalVisible); } }} >
        <View style={componentStyles.centeredView}>
            <View style={componentStyles.modalView}>
                <Text style={componentStyles.modalTitle}>{(animal && animal.name) || 'Dostumuz'} İçin Bağış Yap</Text>
                {loadingWallet ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.walletBalanceText}>Cüzdan Bakiyeniz: {userWalletBalance.toFixed(2)} TL</Text> }

                <View style={componentStyles.inputGroup}>
                    <Text style={componentStyles.modalLabel}>Bağış Türü:</Text>
                    <View style={componentStyles.pickerContainer}>
                        <Picker
                            selectedValue={donationForm.type}
                            style={componentStyles.picker}
                            onValueChange={(itemValue) => setDonationForm(prev => ({...prev, type: itemValue, amountInput: '', description: ''}))}
                            enabled={!isSubmittingDonation}
                            dropdownIconColor={colors.textSecondary}>
                            {donationTypes.map((type) => ( <Picker.Item key={type.value} label={type.label} value={type.value} /> ))}
                        </Picker>
                    </View>
                </View>

                {!isNakitOrOther && selectedDonationCost !== undefined && (
                    <View style={componentStyles.inputGroup}>
                        <Text style={componentStyles.modalLabel}>Bağış Bedeli:</Text>
                        <TextInput
                            style={[componentStyles.modalInput, styles.disabledInput]}
                            value={`${selectedDonationCost.toFixed(2)} TL`}
                            editable={false}
                        />
                    </View>
                )}

                {(isNakitOrOther || donationForm.type === 'Diğer') && (
                    <View style={componentStyles.inputGroup}>
                        <Text style={componentStyles.modalLabel}>{donationForm.type === 'Diğer' ? 'Bağış Miktarı (TL - İsteğe Bağlı)' : 'Miktar (TL):'}</Text>
                        <TextInput
                            style={componentStyles.modalInput}
                            placeholder={donationForm.type === 'Diğer' ? "0.00 (Belirtmek isterseniz)" : "0.00"}
                            keyboardType="numeric"
                            value={donationForm.amountInput}
                            onChangeText={(text) => setDonationForm(prev => ({...prev, amountInput: text}))}
                            editable={!isSubmittingDonation}
                        />
                    </View>
                )}

                {(donationForm.type === 'Mama' || donationForm.type === 'İlaç' || donationForm.type === 'Oyuncak' || donationForm.type === 'Diğer') && (
                     <View style={componentStyles.inputGroup}>
                        <Text style={componentStyles.modalLabel}>
                            {donationForm.type === 'Diğer' ? 'Bağış Açıklaması (Gerekli):' : 'Bağış Açıklaması (isteğe bağlı):'}
                        </Text>
                        <TextInput
                            style={[componentStyles.modalInput, componentStyles.modalTextarea]}
                            placeholder={
                                donationForm.type === 'Diğer'
                                ? "Lütfen bağışınızın ne olduğunu açıklayın."
                                : `Örn: 1 paket ${donationForm.type.toLowerCase()} veya özel bir not`
                            }
                            multiline
                            numberOfLines={3}
                            value={donationForm.description}
                            onChangeText={(text) => setDonationForm(prev => ({...prev, description: text}))}
                            editable={!isSubmittingDonation}
                        />
                    </View>
                )}
                <View style={componentStyles.modalButtonContainer}>
                    <TouchableOpacity style={[componentStyles.modalButton, componentStyles.modalButtonClose]} onPress={() => setModalVisible(!modalVisible)} disabled={isSubmittingDonation} ><Text style={componentStyles.modalButtonText}>İptal</Text></TouchableOpacity>
                    <TouchableOpacity style={[componentStyles.modalButton, componentStyles.modalButtonSubmit, isSubmittingDonation && componentStyles.disabledButton]} onPress={handleDonationSubmit} disabled={isSubmittingDonation || loadingWallet} >{submitButtonContent}</TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// DÜZELTME: 'styles' objesi 'componentStyles'ı doğru şekilde yayıyor ve ek stilleri tanımlıyor.
const styles = StyleSheet.create({
    ...componentStyles, // Önceki tüm stiller buraya dahil edildi
    walletBalanceText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: 15,
        textAlign: 'center',
    },
    disabledInput: {
        backgroundColor: '#e9ecef', // Daha açık bir gri
        color: colors.textSecondary, // Metin rengi
    }
});

export default AnimalDetailScreen;
