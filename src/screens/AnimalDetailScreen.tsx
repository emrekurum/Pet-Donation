// src/screens/AnimalDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
  Alert, TouchableOpacity, Modal, TextInput, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase';
// FirebaseFirestoreTypes importunu doğrudan firestore instance'ından almak için değiştiriyoruz
import firestore from '@react-native-firebase/firestore'; // Doğrudan firestore importu
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'AnimalDetail'>;

interface AnimalDetails {
  id: string; name?: string; type?: string; breed?: string; age?: number;
  imageUrl?: string; description?: string; shelterId?: string; shelterName?: string;
  needs?: string[];
}

interface DonationData {
  type: string;
  amount?: string;
  description?: string;
}

const AnimalDetailScreen = ({ route, navigation }: Props) => {
  const { animalId } = route.params;
  const [animal, setAnimal] = useState<AnimalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [donationData, setDonationData] = useState<DonationData>({ type: 'Mama', amount: '', description: '' });
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    setLoading(true);
    const unsubscribe = db.collection('animals').doc(animalId)
      .onSnapshot(docSnapshot => {
        if (docSnapshot.exists) {
          setAnimal({ id: docSnapshot.id, ...docSnapshot.data() } as AnimalDetails);
        } else {
          Alert.alert("Hata", "Hayvan bulunamadı.");
          if (navigation.canGoBack()) navigation.goBack();
        }
        setLoading(false);
      }, (error) => {
        console.error("Hayvan detayı çekilirken hata: ", error);
        Alert.alert("Hata", "Hayvan detayları yüklenemedi.");
        setLoading(false);
        if (navigation.canGoBack()) navigation.goBack();
      });
    return () => unsubscribe();
  }, [animalId, navigation]);

  const handleOpenDonationModal = () => {
    setDonationData({ type: 'Mama', amount: '', description: '' });
    setModalVisible(true);
  };

  const handleDonationSubmit = async () => {
    if (!currentUser) {
      Alert.alert("Hata", "Bağış yapmak için giriş yapmış olmalısınız.");
      return;
    }
    if (!animal || !animal.id || !animal.shelterId) {
      Alert.alert("Hata", "Hayvan bilgileri tam olarak yüklenemedi. Lütfen tekrar deneyin.");
      setIsSubmittingDonation(false);
      return;
    }
    if (!donationData.type) {
        Alert.alert("Hata", "Lütfen bağış türünü seçin.");
        return;
    }
    if (donationData.type === 'Nakit' && (!donationData.amount || isNaN(parseFloat(donationData.amount)) || parseFloat(donationData.amount) <= 0)) {
        Alert.alert("Hata", "Nakit bağış için geçerli bir miktar girin.");
        return;
    }
     if (donationData.type === 'Diğer' && !donationData.description?.trim()) {
        Alert.alert("Hata", "Diğer bağış türü için lütfen bir açıklama girin.");
        return;
    }

    setIsSubmittingDonation(true);
    try {
      await db.collection('donations').add({
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        animalId: animal.id,
        animalName: animal.name || 'Bilinmiyor',
        shelterId: animal.shelterId,
        shelterName: animal.shelterName || 'Bilinmiyor',
        donationType: donationData.type,
        amount: donationData.type === 'Nakit' ? parseFloat(donationData.amount!) : null,
        description: donationData.type === 'Diğer' ? donationData.description : (donationData.type === 'Nakit' ? `${donationData.amount} TL Nakit Bağış` : donationData.type + " Bağışı"),
        // <<< DEĞİŞİKLİK BURADA: serverTimestamp() kullanımı
        donationDate: firestore.FieldValue.serverTimestamp(),
        status: 'Tamamlandı',
      });
      Alert.alert("Teşekkürler!", `${animal.name || 'Dostumuz'} için bağışınız başarıyla kaydedildi.`);
      setModalVisible(false);
    } catch (error: any) {
      console.error("Bağış kaydedilirken hata:", error);
      Alert.alert("Hata", `Bağışınız kaydedilirken bir sorun oluştu: ${error.message}`);
    } finally {
      setIsSubmittingDonation(false);
    }
  };


  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#007bff" /></View>;
  }
  if (!animal) {
    return <View style={styles.loaderContainer}><Text>Hayvan bilgileri yüklenemedi.</Text></View>;
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {animal.imageUrl ? (
          <Image source={{ uri: animal.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Image source={require('../assets/default-animal.png')} style={styles.image} resizeMode="contain" />
        )}
        <Text style={styles.name}>{animal.name || 'İsimsiz'}</Text>
        <View style={styles.infoCard}>
            <InfoRow label="Tür" value={animal.type || 'N/A'} />
            <InfoRow label="Cins" value={animal.breed || 'N/A'} />
            <InfoRow label="Yaş" value={animal.age !== undefined ? animal.age.toString() : 'N/A'} />
            <InfoRow label="Barınak" value={animal.shelterName || 'N/A'} />
        </View>
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <Text style={styles.description}>{animal.description || 'Açıklama bulunmuyor.'}</Text>
        {animal.needs && animal.needs.length > 0 && (
            <View style={styles.needsSection}><Text style={styles.sectionTitle}>İhtiyaçları:</Text>
                {animal.needs.map((need, index) => (<Text key={index} style={styles.needItem}>• {need}</Text>))}
            </View>
        )}
        <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.button} onPress={handleOpenDonationModal}>
              <Text style={styles.buttonText}>Bu Dosta Bağış Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.virtualAdoptButton]} onPress={() => Alert.alert("Sanal Sahiplen", `${animal.name} için sanal sahiplenme özelliği yakında!`)}>
              <Text style={styles.buttonText}>Sanal Sahiplen</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!isSubmittingDonation) {
            setModalVisible(!modalVisible);
          }
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{(animal && animal.name) || 'Dostumuz'} İçin Bağış Yap</Text>
            <View style={styles.pickerContainer}>
                <Text style={styles.modalLabel}>Bağış Türü:</Text>
                <Picker
                    selectedValue={donationData.type}
                    style={styles.picker}
                    onValueChange={(itemValue) => setDonationData(prev => ({...prev, type: itemValue, amount: '', description: ''}))}
                >
                    <Picker.Item label="Mama Bağışı" value="Mama" />
                    <Picker.Item label="İlaç Bağışı" value="İlaç" />
                    <Picker.Item label="Nakit Bağış" value="Nakit" />
                    <Picker.Item label="Diğer (Oyuncak, Malzeme vb.)" value="Diğer" />
                </Picker>
            </View>
            {donationData.type === 'Nakit' && (
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Miktar (TL):</Text>
                <TextInput style={styles.modalInput} placeholder="Örn: 50" keyboardType="numeric" value={donationData.amount} onChangeText={(text) => setDonationData(prev => ({...prev, amount: text}))} />
              </View>
            )}
            {donationData.type === 'Diğer' && (
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Bağış Açıklaması:</Text>
                <TextInput style={[styles.modalInput, styles.modalTextarea]} placeholder="Örn: 1 adet Kedi Oyuncağı" multiline numberOfLines={3} value={donationData.description} onChangeText={(text) => setDonationData(prev => ({...prev, description: text}))} />
              </View>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonClose]} onPress={() => setModalVisible(!modalVisible)} disabled={isSubmittingDonation} >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSubmit]} onPress={handleDonationSubmit} disabled={isSubmittingDonation} >
                {isSubmittingDonation ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Bağışı Tamamla</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const InfoRow = ({label, value}: {label: string, value: string}) => (
    <View style={styles.infoRow}><Text style={styles.label}>{label}:</Text><Text style={styles.value}>{value}</Text></View>
);

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { paddingBottom: 30, },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, backgroundColor: '#e9ecef' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#2d3436', marginVertical: 15, textAlign: 'center', paddingHorizontal: 20, },
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginHorizontal: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  label: { fontSize: 16, fontWeight: '500', color: '#636e72' },
  value: { fontSize: 16, color: '#2d3436', textAlign: 'right', flexShrink: 1 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3436', marginTop: 20, marginBottom: 10, paddingHorizontal: 20, },
  description: { fontSize: 16, color: '#636e72', lineHeight: 24, marginBottom: 20, paddingHorizontal: 20, },
  needsSection: { marginTop: 10, marginBottom: 20, paddingHorizontal: 20, },
  needItem: { fontSize: 16, color: '#636e72', marginBottom: 5, marginLeft: 10 },
  buttonGroup: { marginTop: 20, paddingHorizontal: 20, },
  button: { backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  virtualAdoptButton: { backgroundColor: '#ffc107' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
