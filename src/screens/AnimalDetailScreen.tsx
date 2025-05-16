import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Temel Renk Paleti (Örnek - Uygulamanızın genel temasına göre özelleştirin)
const colors = {
  primary: '#007bff', // Ana etkileşim rengi (mavi)
  primaryDark: '#0056b3', // Ana rengin koyu tonu (basılma durumları için)
  secondary: '#6c757d', // İkincil metinler, ikonlar
  accent: '#28a745', // Vurgu rengi (bağış butonu gibi)
  accentDark: '#1e7e34', // Vurgu renginin koyu tonu
  background: '#f0f2f5', // Genel sayfa arka planı (daha yumuşak bir gri)
  surface: '#ffffff', // Kartlar, modal gibi yüzeylerin arka planı
  textPrimary: '#212529', // Ana metin rengi (koyu gri/siyah)
  textSecondary: '#495057', // İkincil metin rengi (orta gri)
  textLight: '#ffffff', // Açık renkli metinler (butonlar üzerinde)
  error: '#dc3545', // Hata mesajları için renk
  border: '#dee2e6', // Kenarlıklar, ayırıcılar için renk
  shadow: '#000', // Gölgeler için renk
  disabled: '#ced4da', // Devre dışı bırakılmış elemanlar için
};

const styles = StyleSheet.create({
  // --- Genel Kapsayıcılar ---
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    paddingBottom: 30, // En altta boşluk bırakır
  },
  image: {
    width: '100%',
    height: height * 0.4, // Ekran yüksekliğinin %40'ı
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
    borderTopLeftRadius: 25, // Daha belirgin yuvarlaklık
    borderTopRightRadius: 25,
    backgroundColor: colors.surface,
    marginTop: -25, // Resmin üzerine daha yumuşak geçiş
    flex: 1,
  },

  // --- Bilgi Kartları (Grup Oluşturma) ---
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    // Platforma özel gölgeler
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700', // Daha kalın başlık
    color: colors.textPrimary,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },

  // --- Tipografi ve Metin Stilleri ---
  name: {
    fontSize: 30, // Daha büyük ve etkileyici
    fontWeight: 'bold', // 'bold' genellikle '700' veya daha üstüdür
    marginBottom: 8,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  animalType: { // Hayvan türü için ek stil (örneğin "Kedi", "Köpek")
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Değerler uzunsa daha iyi hizalama
    marginBottom: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // DİKKAT: '&:last-child' kaldırıldı. Bu mantık JSX/TSX içinde uygulanmalıdır.
    // Örneğin, bir liste render ederken son eleman için farklı bir stil (veya stilin bir parçasını) koşullu olarak atayabilirsiniz.
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1.2, // Etikete biraz daha fazla yer
    marginRight: 10,
  },
  value: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'left', // Değerleri sola yaslayarak okunabilirliği artırır
  },
  infoIcon: {
    marginRight: 12,
    color: colors.primary, // Ana renk ile uyumlu
    marginTop: 3, // Metinle daha iyi hizalama için
  },
  descriptionTitle: { // Açıklama için ayrı başlık
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 26, // Okunabilirlik için artırılmış satır yüksekliği
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'justify',
  },

  // --- İletişim Bilgileri ---
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactLabel: {
    fontWeight: '600', // 'bold' yerine '600'
    color: colors.textSecondary,
    fontSize: 16,
  },
  contactText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
  },
  contactLink: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginLeft: 8,
  },

  // --- Harita Alanı ---
  map: {
    height: 280, // Biraz daha yüksek harita
    borderRadius: 12, // Kartlarla uyumlu yuvarlaklık
    marginBottom: 20,
    overflow: 'hidden',
  },
  mapButtonContainer: { // Harita üzerinde butonlar için (örneğin "Tam Ekran")
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 20,
  },
  mapButtonIcon: { // İkonlar için (Feather, vb. kullanılıyorsa)
    // color: colors.primary,
    // fontSize: 20,
  },


  // --- Butonlar ---
  buttonContainer: { // Ana buton için kapsayıcı
    marginTop: 10, // Diğer içerikle arasına boşluk
    alignItems: 'center',
    paddingBottom: 10, // Scroll sonunda butonun kesilmemesi için
  },
  donateButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 30, // Tamamen yuvarlak kenarlar
    width: width * 0.85, // Biraz daha geniş
    alignItems: 'center',
    // Gölge
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // Butona basılma durumu için stil (JSX'te onPressIn/Out ile yönetilir)
  // donateButtonPressed: {
  //   backgroundColor: colors.accentDark,
  // },
  donateButtonText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // --- Modal Stilleri ---
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Biraz daha koyu arka plan
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: colors.surface,
    borderRadius: 18, // Daha yuvarlak
    padding: 25,
    alignItems: 'center',
    // Gölge
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 24, // Daha büyük modal başlığı
    fontWeight: 'bold',
    marginBottom: 25,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: colors.background, // Giriş alanı için hafif farklı arka plan
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalButtonRow: { // Modal içinde birden fazla buton varsa yan yana getirmek için
    flexDirection: 'row',
    justifyContent: 'space-around', // veya 'flex-end'
    width: '100%',
    marginTop: 15,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    marginTop: 10,
    minWidth: 130, // Minimum genişlik
    alignItems: 'center',
    // Gölge
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // modalButtonPressed: {
  //   backgroundColor: colors.primaryDark,
  // },
  modalButtonSecondary: { // İkincil modal butonu (örn: İptal)
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  modalButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: { // İkincil modal buton metni
    color: colors.primary,
  },
  closeButton: { // Modal kapatma butonu (sağ üst köşe)
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5, // Dokunma alanını genişletir
    zIndex: 1, // Diğer elemanların üzerinde kalması için
  },
  closeButtonText: {
      fontSize: 28, // Daha belirgin "X"
      fontWeight: '300', // Daha ince bir "X"
      color: colors.textSecondary,
  },

  // --- Yükleme ve Hata Durumları İçin Stiller (Örnek) ---
  loadingContainer: { // Sayfa yüklenirken gösterilecek kapsayıcı
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  // skeletonText: { // İskelet yükleyici için temel stil
  //   backgroundColor: '#e0e0e0',
  //   borderRadius: 4,
  //   height: 16, // Yüksekliği metne göre ayarlanır
  //   marginBottom: 8,
  //   opacity: 0.7,
  // },
  errorTextContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default styles;
