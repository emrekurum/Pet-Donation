// src/screens/WalletScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../api/firebase'; // Firebase db (Firestore instance) importunuz
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // DÜZELTME: firestore import edildi
import { MainStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'WalletScreen'>;

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'donation' | 'withdrawal';
  amount: number;
  description: string;
  transactionDate?: FirebaseFirestoreTypes.Timestamp;
  relatedAnimalName?: string;
  relatedShelterName?: string;
}

const WalletScreen = ({ navigation }: Props) => {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const currentUser = auth.currentUser;

  const fetchWalletData = useCallback(async () => {
    if (!currentUser) {
      Alert.alert("Hata", "Cüzdan bilgilerinizi görmek için lütfen giriş yapın.");
      setLoadingBalance(false);
      setLoadingTransactions(false);
      return;
    }

    setLoadingBalance(true);
    try {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      const docSnap = await userDocRef.get();
      if (docSnap.exists) {
        setWalletBalance(docSnap.data()?.walletBalance || 0);
      } else {
        setWalletBalance(0);
        // İsteğe bağlı: Kullanıcı dokümanı yoksa oluştur
        // await userDocRef.set({ walletBalance: 0, createdAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    } catch (error) {
      console.error("Cüzdan bakiyesi çekilirken hata:", error);
      Alert.alert("Hata", "Cüzdan bakiyeniz yüklenirken bir sorun oluştu.");
    } finally {
      setLoadingBalance(false);
    }

    setLoadingTransactions(true);
    try {
      const transactionsQuery = db.collection('walletTransactions')
        .where('userId', '==', currentUser.uid)
        .orderBy('transactionDate', 'desc')
        .limit(20);
      const snapshot = await transactionsQuery.get();
      const userTransactions: WalletTransaction[] = [];
      snapshot.forEach(doc => {
        userTransactions.push({ id: doc.id, ...doc.data() } as WalletTransaction);
      });
      setTransactions(userTransactions);
    } catch (error: any) {
      console.error("Cüzdan hareketleri çekilirken hata:", error);
      if (error.code === 'firestore/failed-precondition') {
        Alert.alert("İndeks Gerekli", "Cüzdan hareketlerinizi görmek için Firebase konsolunda bir indeks oluşturmanız gerekiyor: Koleksiyon: 'walletTransactions', Alanlar: 'userId' (Artan), 'transactionDate' (Azalan).");
      } else {
        Alert.alert("Hata", "Cüzdan hareketleriniz yüklenirken bir sorun oluştu.");
      }
    } finally {
      setLoadingTransactions(false);
    }
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  const handleDeposit = async () => {
    const amountToDeposit = parseFloat(depositAmount);
    if (!currentUser) {
      Alert.alert("Hata", "Para yüklemek için lütfen giriş yapın.");
      return;
    }
    if (isNaN(amountToDeposit) || amountToDeposit <= 0) {
      Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir miktar girin.");
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      const newTransactionRef = db.collection('walletTransactions').doc();

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists) {
          transaction.set(userDocRef, { walletBalance: amountToDeposit, createdAt: firestore.FieldValue.serverTimestamp() }); // DÜZELTME
        } else {
          const currentBalance = (userDoc.data()?.walletBalance || 0) as number;
          transaction.update(userDocRef, { walletBalance: currentBalance + amountToDeposit });
        }

        transaction.set(newTransactionRef, {
          userId: currentUser.uid,
          type: 'deposit',
          amount: amountToDeposit,
          description: `${amountToDeposit.toFixed(2)} TL cüzdana yüklendi`,
          transactionDate: firestore.FieldValue.serverTimestamp(), // DÜZELTME
        });
      });

      Alert.alert("Başarılı", `${amountToDeposit.toFixed(2)} TL cüzdanınıza başarıyla yüklendi.`);
      setDepositAmount('');
      fetchWalletData();
    } catch (error) {
      console.error("Para yükleme hatası:", error);
      Alert.alert("Hata", "Para yüklenirken bir sorun oluştu.");
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionRow}>
        <Text style={[styles.transactionType, item.type === 'deposit' ? styles.depositText : styles.donationText]}>
          {item.type === 'deposit' ? 'Yükleme' : 'Bağış'}
        </Text>
        <Text style={[styles.transactionAmount, item.type === 'deposit' ? styles.depositText : styles.donationText]}>
          {item.type === 'deposit' ? '+' : '-'}{item.amount.toFixed(2)} TL
        </Text>
      </View>
      <Text style={styles.transactionDescription}>{item.description}</Text>
      <Text style={styles.transactionDate}>
        {item.transactionDate ? new Date(item.transactionDate.toDate().getTime()).toLocaleString('tr-TR') : 'Bilinmiyor'}
      </Text>
    </View>
  );

  if (loadingBalance && loadingTransactions && !currentUser) {
    return (
        <View style={styles.loaderContainer}>
            <Text style={styles.emptyListText}>Cüzdan bilgilerinizi görmek için lütfen giriş yapın.</Text>
        </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
        {loadingBalance ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 10 }}/>
        ) : (
          <Text style={styles.balanceAmount}>{walletBalance.toFixed(2)} TL</Text>
        )}
      </View>

      <View style={styles.depositSection}>
        <Text style={styles.sectionTitle}>Cüzdana Para Yükle</Text>
        <TextInput
          style={styles.input}
          placeholder="Yüklenecek Miktar (TL)"
          keyboardType="numeric"
          value={depositAmount}
          onChangeText={setDepositAmount}
          editable={!isSubmittingDeposit}
        />
        <TouchableOpacity
          style={[styles.button, styles.depositButton, isSubmittingDeposit && styles.disabledButton]}
          onPress={handleDeposit}
          disabled={isSubmittingDeposit}
        >
          {isSubmittingDeposit ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Yükle</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Son Cüzdan Hareketleri</Text>
        {loadingTransactions ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }}/>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyListText}>Henüz cüzdan hareketiniz bulunmuyor.</Text>}
          />
        )}
      </View>
    </ScrollView>
  );
};

const colors = {
  primary: '#007bff', secondary: '#6c757d', light: '#f8f9fa',
  dark: '#343a40', white: '#ffffff', accent: '#28a745',
  danger: '#dc3545', textPrimary: '#212529', textSecondary: '#6c757d',
  border: '#dee2e6', depositGreen: '#20c997', donationRed: '#e74c3c',
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: colors.light, },
  scrollContentContainer: { paddingBottom: 30, },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light, padding: 20, },
  headerContainer: { backgroundColor: colors.primary, paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center', marginBottom: 20, },
  balanceLabel: { fontSize: 18, color: colors.white, marginBottom: 8, opacity: 0.9, },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: colors.white, },
  depositSection: { backgroundColor: colors.white, marginHorizontal: 15, borderRadius: 12, padding: 20, marginBottom: 25, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 15, },
  input: { backgroundColor: colors.light, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 15, },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.15, shadowRadius: 2.0, },
  depositButton: { backgroundColor: colors.accent, },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold', },
  disabledButton: { opacity: 0.7, },
  transactionsSection: { marginHorizontal: 15, },
  transactionItem: { backgroundColor: colors.white, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.border, },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, },
  transactionType: { fontSize: 16, fontWeight: '500', },
  depositText: { color: colors.depositGreen, },
  donationText: { color: colors.donationRed, },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', },
  transactionDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 3, },
  transactionDate: { fontSize: 12, color: '#999', textAlign: 'right', },
  emptyListText: { textAlign: 'center', color: colors.textSecondary, marginTop: 20, paddingHorizontal: 10, fontSize: 16, },
});

export default WalletScreen;
