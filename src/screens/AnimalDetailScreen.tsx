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

const MAX_QUANTITY = 5;
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
    quantity: number;
    description: string;
}
interface InfoRowProps {
    label: string;
    value: string | number | undefined;
}

// GÜNCELLENDİ: Firebase'den gelen veri yapısına uygun (unitPrice olarak)
interface DonationItemPriceFirestore { // Interface adını da güncelleyebiliriz, anlamlı olması için
  name?: string;
  unitPrice: number; // unitCost yerine unitPrice
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
  loaderText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
  errorTextContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: colors.error, textAlign: 'center', lineHeight: 24 },
  imageGallery: { height: 320, backgroundColor: '#e0e0e0' },
  galleryImage: { width: Dimensions.get('window').width, height: 320 },
  fallbackImageContainer: { width: '100%', height: 300, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  fallbackImageText: { fontSize: 18, color: colors.textSecondary },
  contentPadding: { paddingHorizontal: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginVertical: 15, textAlign: 'center' },
  infoCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 18, marginHorizontal: 20, marginBottom: 20, ...Platform.select({ ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
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

  const [donationItemPrices, setDonationItemPrices] = useState<{ [key: string]: number }>({}); // State adını da güncelleyebiliriz
  const [loadingPrices, setLoadingPrices] = useState(true); // loadingCosts yerine loadingPrices

  const currentUser: FirebaseAuthTypes.User | null = auth().currentUser;

  const fetchDonationItemPrices = useCallback(async () => { // Fonksiyon adını da güncelleyebiliriz
    const collectionName = 'donationItemPrices'; // GÜNCELLENDİ: Koleksiyon adı
    console.log(`[LOG] fetchDonationItemPrices ÇAĞRILDI. Koleksiyon: '${collectionName}'`);
    setLoadingPrices(true);
    try {
      const pricesSnapshot = await firestore().collection(collectionName).get();
      console.log(`[LOG] pricesSnapshot alındı. Boş mu?: ${pricesSnapshot.empty}, Boyut: ${pricesSnapshot.size}`);

      const fetchedPrices: { [key: string]: number } = {};
      pricesSnapshot.forEach(doc => {
        console.log(`[LOG] Doküman ID: ${doc.id}, Var mı?: ${doc.exists}`);
        if (doc.exists) {
          const data = doc.data() as DonationItemPriceFirestore; // GÜNCELLENDİ: Interface adı
          console.log(`[LOG] Doküman (${doc.id}) verisi:`, JSON.stringify(data));

          if (data && typeof data.unitPrice === 'number') { // GÜNCELLENDİ: unitCost yerine unitPrice
            fetchedPrices[doc.id] = data.unitPrice;         // GÜNCELLENDİ: unitCost yerine unitPrice
            console.log(`[LOG] fetchedPrices'e eklendi: ${doc.id} -> ${data.unitPrice}`);
          } else {
            console.warn(`[UYARI] Doküman ${doc.id} için 'unitPrice' alanı bulunamadı veya sayı değil. Alınan 'unitPrice' tipi: ${typeof data?.unitPrice}, Değer: ${data?.unitPrice}`);
          }
        }
      });

      setDonationItemPrices(fetchedPrices);
      console.log("[LOG] setDonationItemPrices çağrıldı. Son fetchedPrices:", JSON.stringify(fetchedPrices));

      if (Object.keys(fetchedPrices).length === 0 && !pricesSnapshot.empty) {
        console.warn("[UYARI] Firebase'den dokümanlar çekildi ancak 'unitPrice' formatı uygun değil veya eksik.");
      } else if (pricesSnapshot.empty) {
        console.warn(`[UYARI] Firebase '${collectionName}' koleksiyonu boş veya bulunamadı.`);
      }

    } catch (error: any) {
      console.error("[HATA] fetchDonationItemPrices İÇİNDE HATA OLUŞTU: ", error.message);
      console.error("[HATA DETAYI] fetchDonationItemPrices: ", JSON.stringify(error));
      Alert.alert(
          "Fiyat Yükleme Hatası",
          `Bağış kalemleri için fiyat bilgileri yüklenirken bir sorun oluştu. Hata: ${error.message}`
      );
      setDonationItemPrices({});
    } finally {
      setLoadingPrices(false);
      console.log("[LOG] fetchDonationItemPrices TAMAMLANDI. loadingPrices şimdi:", false);
    }
  }, []);


  const [donationTypes, setDonationTypes] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const generateDonationTypes = () => {
      const isLoading = loadingPrices || Object.keys(donationItemPrices).length === 0;

      let types = [
        { label: 'Nakit Bağış', value: 'Nakit' },
        { label: 'Diğer (Açıklama ve Miktar Girin)', value: 'Diğer' },
      ];

      const itemBasedTypes: Array<{ label: string; value: string }> = [];
      const commonItems = ['Mama', 'Oyuncak', 'İlaç'];

      commonItems.forEach(itemKey => {
        if (donationItemPrices[itemKey] !== undefined) {
          itemBasedTypes.push({
            label: `${itemKey} Bağışı (${donationItemPrices[itemKey]} TL)`,
            value: itemKey
          });
        } else if (!loadingPrices) {
            itemBasedTypes.push({
            label: `${itemKey} Bağışı (Fiyat Bilgisi Yok)`,
            value: itemKey
          });
        }
      });

      Object.keys(donationItemPrices).forEach(itemKey => {
        if (!commonItems.includes(itemKey) && donationItemPrices[itemKey] !== undefined) {
            itemBasedTypes.push({
            label: `${itemKey} (${donationItemPrices[itemKey]} TL)`,
            value: itemKey
          });
        }
      });

      setDonationTypes([...itemBasedTypes, ...types]);

      let defaultTypeForForm = 'Nakit';
      if (itemBasedTypes.length > 0) {
        const mamaOption = itemBasedTypes.find(t => t.value === 'Mama' && donationItemPrices[t.value] !== undefined);
        if (mamaOption) {
            defaultTypeForForm = mamaOption.value;
        } else {
            const firstAvailableItem = itemBasedTypes.find(t => donationItemPrices[t.value] !== undefined);
            if (firstAvailableItem) {
                defaultTypeForForm = firstAvailableItem.value;
            }
        }
      }
      setDonationForm(prev => ({ ...prev, type: defaultTypeForForm, quantity: 1, amountInput: '', description: '' }));
    };

    generateDonationTypes();
  }, [donationItemPrices, loadingPrices]);

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
        setUserWalletBalance(0);
      } finally {
        setLoadingWallet(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
    fetchDonationItemPrices(); // GÜNCELLENDİ: Fonksiyon adı
  }, [animalId, fetchData, fetchDonationItemPrices]); // Bağımlılıklara eklendi

  useEffect(() => {
    if (modalVisible) {
      fetchUserWalletBalance();
      if (loadingPrices) {
        console.log("[LOG] Modal açıldı, ancak bağış fiyatları hala yükleniyor.");
      } else if (Object.keys(donationItemPrices).length === 0) {
        console.warn("[UYARI] Modal açıldı, ancak bağış fiyatları yüklenemedi (fetch işlemi bitti).");
      }
    }
  }, [modalVisible, fetchUserWalletBalance, loadingPrices, donationItemPrices]);


  const handleOpenDonationModal = () => {
    if (loadingPrices) {
      Alert.alert("Lütfen Bekleyin", "Bağış seçenekleri için fiyatlar yükleniyor...");
      return;
    }
    const currentSelectedTypePrice = donationItemPrices[donationForm.type];
    if (!currentSelectedTypePrice && donationForm.type !== 'Nakit' && donationForm.type !== 'Diğer') {
        Alert.alert(
            "Fiyat Bilgisi Eksik",
            `"${donationForm.type}" için şu anda bir fiyat bilgisi bulunmuyor. Lütfen 'Nakit' veya 'Diğer' seçeneklerini kullanın veya farklı bir ürün seçin.`
        );
        setDonationForm(prev => ({ ...prev, type: 'Nakit', quantity:1, amountInput:'', description:'' }));
    }
    setModalVisible(true);
  };

  const handleDonationSubmit = async () => {
    if (!currentUser) { Alert.alert("Giriş Gerekli", "Bağış yapmak için lütfen giriş yapın."); return; }
    if (!animal) { Alert.alert("Hata", "Hayvan bilgisi bulunamadı, bağış yapılamıyor."); return; }
    if (loadingPrices) { Alert.alert("Lütfen Bekleyin", "Fiyat bilgileri hala işleniyor."); return; }

    let finalDonationAmount: number;
    let finalDescription = donationForm.description;
    const selectedUnitPrice = donationItemPrices[donationForm.type]; // GÜNCELLENDİ: unitCost yerine unitPrice

    if (donationForm.type === 'Nakit') {
      finalDonationAmount = parseFloat(donationForm.amountInput);
      if (isNaN(finalDonationAmount) || finalDonationAmount <= 0) {
        Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir nakit bağış miktarı girin."); return;
      }
      if (!finalDescription) finalDescription = `${finalDonationAmount.toFixed(2)} TL Nakit Bağış`;
    } else if (selectedUnitPrice !== undefined) { // GÜNCELLENDİ
      finalDonationAmount = selectedUnitPrice * donationForm.quantity;
      if (!finalDescription) finalDescription = `${donationForm.quantity} adet ${donationForm.type} Bağışı (${finalDonationAmount.toFixed(2)} TL)`;
    } else if (donationForm.type === 'Diğer') {
        finalDonationAmount = parseFloat(donationForm.amountInput);
        if (isNaN(finalDonationAmount) || finalDonationAmount <= 0) {
            Alert.alert("Geçersiz Miktar", "'Diğer' bağış türü için lütfen geçerli bir miktar girin."); return;
        }
        if (!finalDescription) {
            Alert.alert("Açıklama Gerekli", "'Diğer' bağış türü için lütfen bir açıklama girin."); return;
        }
    } else {
      Alert.alert("Geçersiz Bağış Türü", `"${donationForm.type}" için fiyat bilgisi bulunamadı veya geçersiz bir tür seçtiniz.`); return;
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
          quantity: selectedUnitPrice !== undefined ? donationForm.quantity : undefined, // GÜNCELLENDİ
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
      const defaultTypeAfterSubmit = (donationTypes.find(dt => dt.value === 'Mama' && donationItemPrices[dt.value] !== undefined) || donationTypes.find(dt => donationItemPrices[dt.value] !== undefined) || {value: 'Nakit'}).value;
      setDonationForm({ type: defaultTypeAfterSubmit, amountInput: '', quantity: 1, description: '' });
      fetchUserWalletBalance();
    } catch (error: any) {
      console.error("Bağış gönderme hatası (cüzdan): ", error.message);
      Alert.alert("Hata", `Bağış gönderilirken bir sorun oluştu: ${error.message}`);
    } finally {
      setIsSubmittingDonation(false);
    }
  };

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
        status: 'active',
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
    } catch (error: any) {
      console.error("Sanal sahiplenme hatası: ", error.message);
      Alert.alert("Hata", "Sanal sahiplenme sırasında bir sorun oluştu.");
    } finally {
      setIsAdoptingVirtually(false);
    }
  };
  const renderPhotoItem = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={componentStyles.galleryImage} resizeMode="cover" />
  );

  if (loading || loadingPrices) { // GÜNCELLENDİ: loadingCosts yerine loadingPrices
    return (
        <View style={componentStyles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={componentStyles.loaderText}>
                {loading && loadingPrices ? "Hayvan bilgileri ve bağış seçenekleri yükleniyor..." :
                 loading ? "Hayvan bilgileri yükleniyor..." :
                 "Bağış seçenekleri yükleniyor..."}
            </Text>
        </View>
    );
  }
  if (!animal) { return <View style={componentStyles.errorTextContainer}><Text style={componentStyles.errorText}>Hayvan bilgileri yüklenemedi veya bulunamadı.</Text><Text style={componentStyles.errorText}>(ID: {animalId || "Belirtilmedi"})</Text></View>; }

  const displayImages = animal.photos && animal.photos.length > 0 ? animal.photos : (animal.imageUrl ? [animal.imageUrl] : []);
  const submitButtonContent = isSubmittingDonation ? <ActivityIndicator color="#fff" /> : <Text style={componentStyles.modalButtonText}>Bağışı Tamamla</Text>;

  const selectedUnitPriceForDisplay = donationItemPrices[donationForm.type]; // GÜNCELLENDİ
  const isNakitOrOther = donationForm.type === 'Nakit' || donationForm.type === 'Diğer';
  const showQuantityPicker = selectedUnitPriceForDisplay !== undefined && !isNakitOrOther;

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
        {/* <MapViewPlaceholder /> Harita için placeholder */}

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
            <TouchableOpacity
                style={[componentStyles.button, componentStyles.donateButton, (isAdoptingVirtually || isSubmittingDonation || loadingPrices) && componentStyles.disabledButton]}
                onPress={handleOpenDonationModal}
                disabled={isAdoptingVirtually || isSubmittingDonation || loadingPrices}>
                <Text style={componentStyles.buttonText}>Bu Dosta Bağış Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[componentStyles.button, componentStyles.virtualAdoptButton, (isAdoptingVirtually || hasAlreadyAdopted || isSubmittingDonation) && componentStyles.disabledButton]}
                onPress={handleVirtualAdoption}
                disabled={isAdoptingVirtually || hasAlreadyAdopted || isSubmittingDonation}>
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
                onValueChange={(itemValue) => {
                if (itemValue) {
                    const selectedPrice = donationItemPrices[itemValue]; // GÜNCELLENDİ
                    if (!selectedPrice && itemValue !== 'Nakit' && itemValue !== 'Diğer' && !loadingPrices) {
                        Alert.alert("Fiyat Bilgisi Yok", `"${itemValue}" için henüz fiyatlandırma yapılmamış. Lütfen başka bir tür seçin.`);
                    }
                    setDonationForm(prev => ({
                        ...prev,
                        type: itemValue,
                        amountInput: '',
                        quantity: 1,
                        description: ''
                    }));
                }
                }}
                enabled={!isSubmittingDonation && !loadingPrices} // GÜNCELLENDİ
                dropdownIconColor={colors.textSecondary}
            >
                {donationTypes.length === 0 && loadingPrices ? ( // GÜNCELLENDİ
                    <Picker.Item key="loading-types" label="Türler Yükleniyor..." value="" />
                ) : donationTypes.length === 0 && !loadingPrices ? ( // GÜNCELLENDİ
                     <Picker.Item key="no-types" label="Uygun Bağış Türü Yok" value="" />
                ) : (
                    donationTypes.map((type) => (
                        <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))
                )}
            </Picker>
            </View>
        </View>

        {showQuantityPicker && (
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

        {selectedUnitPriceForDisplay !== undefined && !isNakitOrOther && ( // GÜNCELLENDİ
            <View style={componentStyles.inputGroup}>
            <Text style={componentStyles.modalLabel}>Bağış Bedeli:</Text>
            <TextInput
                style={[componentStyles.modalInput, styles.disabledInput]}
                value={`${(selectedUnitPriceForDisplay * donationForm.quantity).toFixed(2)} TL`} // GÜNCELLENDİ
                editable={false}
            />
            </View>
        )}

        {(isNakitOrOther) && (
            <View style={componentStyles.inputGroup}>
            <Text style={componentStyles.modalLabel}>
                {donationForm.type === 'Diğer'
                ? 'Bağış Miktarı (TL - Gerekli)'
                : 'Nakit Miktar (TL):'}
            </Text>
            <TextInput
                style={componentStyles.modalInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={donationForm.amountInput}
                onChangeText={(text) => setDonationForm(prev => ({ ...prev, amountInput: text.replace(',', '.') }))}
                editable={!isSubmittingDonation}
            />
            </View>
        )}

        {(selectedUnitPriceForDisplay !== undefined || isNakitOrOther) && ( // GÜNCELLENDİ
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
                    ? "Lütfen bağışınızın ne olduğunu açıklayın (örn: 2 paket köpek bisküvisi)."
                    : (selectedUnitPriceForDisplay !== undefined // GÜNCELLENDİ
                        ? `Örn: ${donationForm.quantity} adet ${donationForm.type.toLowerCase()} için özel bir notunuz`
                        : (donationForm.type === 'Nakit' ? 'Örn: Genel tedavi masrafları için' : '')
                        )
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
                (isSubmittingDonation || loadingWallet || loadingPrices) && componentStyles.disabledButton // GÜNCELLENDİ
            ]}
            onPress={handleDonationSubmit}
            disabled={isSubmittingDonation || loadingWallet || loadingPrices} // GÜNCELLENDİ
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
});

export default AnimalDetailScreen;