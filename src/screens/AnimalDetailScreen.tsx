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

  import { MainStackParamList } from '../navigation/AppNavigator';

  const DONATION_ITEM_UNIT_COSTS: { [key: string]: number } = {
    'Mama': 50, 'Oyuncak': 30, 'İlaç': 75,
  };
  const MAX_QUANTITY = 5;
  type Props = NativeStackScreenProps<MainStackParamList, 'AnimalDetail'>;

  // DÜZELTME: Interface tanımlamaları eksiksiz olmalı
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
      quantity: number;
      description: string;
  }
  interface InfoRowProps { // DÜZELTME: InfoRowProps tanımlandı
      label: string;
      value: string | number | undefined;
  }

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
    modalButtonText: { color: colors.textLight, fontWeight: "bold", textAlign: "center", fontSize: 16 },
  });

  // DÜZELTME: InfoRow artık JSX döndürüyor ve props'ları doğru alıyor
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

  // DÜZELTME: Icon artık JSX döndürüyor
  const Icon = ({ name, size, style }: { name: string, size: number, style?: any }) => (
    <Text style={[{ fontSize: size, color: colors.primary }, style]}>[{name.substring(0,1).toUpperCase()}]</Text>
  );

  // DÜZELTME: MapViewPlaceholder artık JSX döndürüyor
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
      type: 'Mama', amountInput: '', quantity: 1, description: '',
    });
    const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
    const [isAdoptingVirtually, setIsAdoptingVirtually] = useState(false);
    const [hasAlreadyAdopted, setHasAlreadyAdopted] = useState(false);
    const [userWalletBalance, setUserWalletBalance] = useState<number>(0);
    const [loadingWallet, setLoadingWallet] = useState(false);

    const currentUser: FirebaseAuthTypes.User | null = auth().currentUser;
    const donationTypes = [
      { label: `Mama Bağışı (${DONATION_ITEM_UNIT_COSTS['Mama']} TL)`, value: 'Mama' },
      { label: 'Nakit Bağış', value: 'Nakit' },
      { label: `Oyuncak Bağışı (${DONATION_ITEM_UNIT_COSTS['Oyuncak']} TL)`, value: 'Oyuncak' },
      { label: `İlaç Desteği (${DONATION_ITEM_UNIT_COSTS['İlaç']} TL)`, value: 'İlaç' },
      { label: 'Diğer (Açıklama ve Miktar Girin)', value: 'Diğer' },
    ];

    // DÜZELTME: fetchData'nın tam implementasyonu
    const fetchData = useCallback(async () => {
      if (!animalId) {
        Alert.alert("Hata", "Hayvan ID'si bulunamadı.");
        if (navigation.canGoBack()) navigation.goBack();
        setLoading(false);
        return;
      }
      console.log(`Firebase'den ${animalId} ID'li hayvan çekiliyor...`);
      setLoading(true);
      try {
        const animalDocRef = firestore().collection('animals').doc(animalId);
        const docSnapshot = await animalDocRef.get();

        if (docSnapshot.exists) {
          const animalDataTemp = { id: docSnapshot.id, ...docSnapshot.data() } as AnimalDetails;
          setAnimal(animalDataTemp);
          console.log("Hayvan verisi çekildi:", animalDataTemp);

          if (animalDataTemp.shelterId) {
            const shelterDoc = await firestore().collection('shelters').doc(animalDataTemp.shelterId).get();
            if (shelterDoc.exists) {
              setShelterInfo({ id: shelterDoc.id, ...shelterDoc.data() } as ShelterDetails);
              console.log("Barınak verisi çekildi:", shelterDoc.data());
            } else {
              console.log("Barınak bulunamadı:", animalDataTemp.shelterId);
            }
          }

          if (currentUser) {
            const adoptionQuery = firestore().collection('virtualAdoptions').where('userId', '==', currentUser.uid).where('animalId', '==', animalId).limit(1);
            const adoptionSnapshot = await adoptionQuery.get();
            setHasAlreadyAdopted(!adoptionSnapshot.empty);
            console.log("Sanal sahiplenme durumu:", !adoptionSnapshot.empty);
          }
        } else {
          console.log("Firebase'de hayvan bulunamadı:", animalId);
          Alert.alert("Bulunamadı", `"${animalId}" ID'li hayvan bilgisi bulunamadı.`);
          setAnimal(null);
        }
      } catch (error: any) {
        console.error(`Hayvan verisi çekme hatası (${animalId}): `, error);
        Alert.alert("Veri Çekme Hatası", "Hayvan bilgileri yüklenirken bir sorun oluştu.");
        setAnimal(null);
      } finally {
        setLoading(false);
        console.log("Sayfa yüklemesi (fetchData) tamamlandı.");
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
      console.log("AnimalDetailScreen mounted or animalId changed, fetching animal data...");
      fetchData();
    }, [fetchData]);

    useEffect(() => {
      if (modalVisible) {
        console.log("Modal became visible, fetching user wallet balance...");
        fetchUserWalletBalance();
      }
    }, [modalVisible, fetchUserWalletBalance]);

    const handleOpenDonationModal = () => {
      console.log("handleOpenDonationModal called");
      setDonationForm({ type: 'Mama', amountInput: '', quantity: 1, description: '' });
      setModalVisible(true);
      console.log("modalVisible state set to true");
    };

    // DÜZELTME: handleDonationSubmit'in tam implementasyonu
    const handleDonationSubmit = async () => {
      if (!currentUser) { Alert.alert("Giriş Gerekli", "Bağış yapmak için lütfen giriş yapın."); return; }
      if (!animal) { Alert.alert("Hata", "Hayvan bilgisi bulunamadı, bağış yapılamıyor."); return; }

      let finalDonationAmount: number;
      let finalDescription = donationForm.description;

      if (donationForm.type === 'Nakit') {
        finalDonationAmount = parseFloat(donationForm.amountInput);
        if (isNaN(finalDonationAmount) || finalDonationAmount <= 0) {
          Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir nakit bağış miktarı girin."); return;
        }
        if (!finalDescription) finalDescription = `${finalDonationAmount.toFixed(2)} TL Nakit Bağış`;
      } else if (DONATION_ITEM_UNIT_COSTS[donationForm.type]) {
        finalDonationAmount = DONATION_ITEM_UNIT_COSTS[donationForm.type] * donationForm.quantity;
        if (!finalDescription) finalDescription = `${donationForm.quantity} adet ${donationForm.type} Bağışı`;
      } else if (donationForm.type === 'Diğer') {
          finalDonationAmount = parseFloat(donationForm.amountInput);
          if (isNaN(finalDonationAmount) || finalDonationAmount <= 0) {
              Alert.alert("Geçersiz Miktar", "'Diğer' bağış türü için lütfen geçerli bir miktar girin."); return;
          }
          if (!finalDescription) {
              Alert.alert("Açıklama Gerekli", "'Diğer' bağış türü için lütfen bir açıklama girin."); return;
          }
      } else {
        Alert.alert("Geçersiz Bağış Türü", "Lütfen geçerli bir bağış türü seçin."); return;
      }

      if (userWalletBalance < finalDonationAmount) {
        Alert.alert("Yetersiz Bakiye", `Cüzdanınızda yeterli bakiye bulunmuyor. Mevcut bakiye: ${userWalletBalance.toFixed(2)} TL. Gereken: ${finalDonationAmount.toFixed(2)} TL`); return;
      }

      setIsSubmittingDonation(true);
      try {
        const userDocRef = firestore().collection('users').doc(currentUser.uid);
        const donationDocRef = firestore().collection('donations').doc();
        const walletTransactionDocRef = firestore().collection('walletTransactions').doc();

        await firestore().runTransaction(async (transaction) => {
          const userSnapshot = await transaction.get(userDocRef);
          if (!userSnapshot.exists) throw "Kullanıcı bulunamadı!";
          const currentBalance = (userSnapshot.data()?.walletBalance || 0) as number;
          if (currentBalance < finalDonationAmount) throw "Yetersiz bakiye!";

          transaction.update(userDocRef, { walletBalance: currentBalance - finalDonationAmount });

          const donationPayload: FirebaseFirestoreTypes.DocumentData = {
            userId: currentUser.uid, userName: currentUser.displayName || currentUser.email || 'Bilinmeyen Kullanıcı',
            animalId: animal.id, animalName: animal.name ?? 'Bilinmiyor',
            shelterId: animal.shelterId ?? '', shelterName: shelterInfo?.name || animal.shelterName || 'Bilinmiyor',
            donationType: donationForm.type,
            amount: finalDonationAmount,
            currency: 'TL',
            description: finalDescription,
            quantity: DONATION_ITEM_UNIT_COSTS[donationForm.type] ? donationForm.quantity : undefined,
            donationDate: firestore.FieldValue.serverTimestamp(), status: 'completed', paymentMethod: 'wallet',
          };
          transaction.set(donationDocRef, donationPayload);

          transaction.set(walletTransactionDocRef, {
            userId: currentUser.uid, type: 'donation', amount: finalDonationAmount,
            description: `${animal.name || 'Hayvan'} için: ${finalDescription}`,
            relatedAnimalId: animal.id, relatedShelterId: animal.shelterId ?? '',
            relatedDonationId: donationDocRef.id, transactionDate: firestore.FieldValue.serverTimestamp(),
          });
        });

        Alert.alert("Bağış Başarılı!", "Bağışınız için teşekkür ederiz. Cüzdanınızdan düşüldü.");
        setModalVisible(false);
        setDonationForm({ type: 'Mama', amountInput: '', quantity: 1, description: '' });
        fetchUserWalletBalance();
      } catch (error) {
        console.error("Bağış gönderme hatası (cüzdan): ", error);
        Alert.alert("Hata", `Bağış gönderilirken bir sorun oluştu: ${error}`);
      } finally {
        setIsSubmittingDonation(false);
      }
    };

    // DÜZELTME: handleVirtualAdoption'ın tam implementasyonu
    const handleVirtualAdoption = async () => {
      if (!currentUser) { Alert.alert("Giriş Gerekli", "Sanal sahiplenme için lütfen giriş yapın."); return; }
      if (hasAlreadyAdopted) { Alert.alert("Bilgi", "Bu dostumuzu zaten sanal olarak sahiplendiniz."); return; }
      if (!animal) { Alert.alert("Hata", "Hayvan bilgisi bulunamadı, sanal sahiplenme yapılamıyor."); return; }

      setIsAdoptingVirtually(true);
      try {
        await firestore().collection('virtualAdoptions').add({
          userId: currentUser.uid,
          animalId: animal.id,
          animalName: animal.name ?? 'Bilinmiyor',
          shelterId: animal.shelterId ?? '',
          adoptionDate: firestore.FieldValue.serverTimestamp(),
          status: 'active', // Sanal sahiplenme durumu
        });

        if (animal.id) {
          const animalRef = firestore().collection('animals').doc(animal.id);
          await animalRef.update({
            virtualAdoptersCount: firestore.FieldValue.increment(1)
          });
          setAnimal(prev => prev ? ({ ...prev, virtualAdoptersCount: (prev.virtualAdoptersCount || 0) + 1 }) : null);
        }

        setHasAlreadyAdopted(true);
        Alert.alert("Teşekkürler!", `${animal.name || 'Bu dostumuzu'} sanal olarak sahiplendiniz.`);
      } catch (error) {
        console.error("Sanal sahiplenme hatası: ", error);
        Alert.alert("Hata", "Sanal sahiplenme sırasında bir sorun oluştu.");
      } finally {
        setIsAdoptingVirtually(false);
      }
    };

    // DÜZELTME: renderPhotoItem'ın tam implementasyonu
    const renderPhotoItem = ({ item }: { item: string }) => (
      <Image source={{ uri: item }} style={componentStyles.galleryImage} resizeMode="cover" />
    );

    if (loading) { return <View style={componentStyles.loaderContainer}><ActivityIndicator size="large" color={colors.primary} /></View>; }
    if (!animal) { return <View style={componentStyles.errorTextContainer}><Text style={componentStyles.errorText}>Hayvan bilgileri yüklenemedi veya bulunamadı.</Text><Text style={componentStyles.errorText}>(ID: {animalId || "Belirtilmedi"})</Text></View>; }

    const displayImages = animal.photos && animal.photos.length > 0 ? animal.photos : (animal.imageUrl ? [animal.imageUrl] : []);
    const submitButtonContent = isSubmittingDonation ? <ActivityIndicator color="#fff" /> : <Text style={componentStyles.modalButtonText}>Bağışı Tamamla</Text>;
    const selectedDonationCost = DONATION_ITEM_UNIT_COSTS[donationForm.type];
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
      
<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => {
      if (!isSubmittingDonation) {
          setModalVisible(false);
      }
  }}
>
  <View style={componentStyles.centeredView}>
    <View style={componentStyles.modalView}>
      <Text style={componentStyles.modalTitle}>
        {(animal?.name) || 'Dostumuz'} İçin Bağış Yap
      </Text>

      {loadingWallet
        ? <ActivityIndicator color={colors.primary} />
        : <Text style={styles.walletBalanceText}>
            Cüzdan Bakiyeniz: {userWalletBalance.toFixed(2)} TL
          </Text>
      }

      <View style={componentStyles.inputGroup}>
        <Text style={componentStyles.modalLabel}>Bağış Türü:</Text>
        <View style={componentStyles.pickerContainer}>
          <Picker
            selectedValue={donationForm.type}
            style={componentStyles.picker}
            onValueChange={(itemValue) =>
              setDonationForm(prev => ({
                ...prev,
                type: itemValue,
                amountInput: '',
                quantity: 1,
                description: ''
              }))
            }
            enabled={!isSubmittingDonation}
            dropdownIconColor={colors.textSecondary}
          >
            {donationTypes.map((type) => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>
      </View>

      {(donationForm.type === 'Mama' || donationForm.type === 'İlaç' || donationForm.type === 'Oyuncak') && (
        <View style={componentStyles.inputGroup}>
          <Text style={componentStyles.modalLabel}>Adet Seçimi:</Text>
          <View style={componentStyles.pickerContainer}>
            <Picker
              selectedValue={donationForm.quantity}
              style={componentStyles.picker}
              onValueChange={(value) => setDonationForm(prev => ({ ...prev, quantity: value }))}
              enabled={!isSubmittingDonation}
            >
              {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map((num) => (
                <Picker.Item key={num} label={`${num} Adet`} value={num} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {!isNakitOrOther && selectedDonationCost !== undefined && (
        <View style={componentStyles.inputGroup}>
          <Text style={componentStyles.modalLabel}>Bağış Bedeli:</Text>
          <TextInput
            style={[componentStyles.modalInput, styles.disabledInput]}
            value={`${(selectedDonationCost * donationForm.quantity).toFixed(2)} TL`}
            editable={false}
          />
        </View>
      )}

      {(isNakitOrOther || donationForm.type === 'Diğer') && (
        <View style={componentStyles.inputGroup}>
          <Text style={componentStyles.modalLabel}>
            {donationForm.type === 'Diğer'
              ? 'Bağış Miktarı (TL - Gerekli)'
              : 'Miktar (TL):'}
          </Text>
          <TextInput
            style={componentStyles.modalInput}
            placeholder="0.00"
            keyboardType="numeric"
            value={donationForm.amountInput}
            onChangeText={(text) => setDonationForm(prev => ({ ...prev, amountInput: text }))}
            editable={!isSubmittingDonation}
          />
        </View>
      )}

      {(donationForm.type === 'Mama' || donationForm.type === 'İlaç' || donationForm.type === 'Oyuncak' || donationForm.type === 'Diğer') && (
        <View style={componentStyles.inputGroup}>
          <Text style={componentStyles.modalLabel}>
            {donationForm.type === 'Diğer'
              ? 'Bağış Açıklaması (Gerekli):'
              : 'Bağış Notu (isteğe bağlı):'}
          </Text>
          <TextInput
            style={[componentStyles.modalInput, componentStyles.modalTextarea]}
            placeholder={
              donationForm.type === 'Diğer'
                ? "Lütfen bağışınızın ne olduğunu açıklayın."
                : `Örn: ${donationForm.quantity} adet ${donationForm.type.toLowerCase()}`
            }
            multiline
            numberOfLines={3}
            value={donationForm.description}
            onChangeText={(text) => setDonationForm(prev => ({ ...prev, description: text }))}
            editable={!isSubmittingDonation}
          />
        </View>
      )}

      <View style={componentStyles.modalButtonContainer}>
        <TouchableOpacity
          style={[componentStyles.modalButton, componentStyles.modalButtonClose]}
          onPress={() => setModalVisible(!modalVisible)}
          disabled={isSubmittingDonation}
        >
          <Text style={componentStyles.modalButtonText}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            componentStyles.modalButton,
            componentStyles.modalButtonSubmit,
            isSubmittingDonation && componentStyles.disabledButton
          ]}
          onPress={handleDonationSubmit}
          disabled={isSubmittingDonation || loadingWallet}
        >
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
      ...componentStyles,
      walletBalanceText: {
          fontSize: 16,
          fontWeight: '500',
          color: colors.textSecondary,
          marginBottom: 15,
          textAlign: 'center',
      },
      disabledInput: {
          backgroundColor: '#e9ecef',
          color: colors.textSecondary,
      },
      calculatedTotalText: {
          fontSize: 16,
          fontWeight: 'bold',
          color: colors.primary,
          textAlign: 'right',
          marginTop: 8,
      }
  });

  export default AnimalDetailScreen;
