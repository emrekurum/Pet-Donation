import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Açık bir arka plan rengi
  },
  image: {
    width: '100%',
    height: 300, // Yüksekliği artırıldı
    resizeMode: 'cover', // Resmin tamamını kaplaması için
  },
  contentContainer: {
    padding: 20,
    borderTopLeftRadius: 20, // Üst köşelere yuvarlaklık
    borderTopRightRadius: 20,
    backgroundColor: '#ffffff', // İçerik alanı için beyaz arka plan
    marginTop: -20, // Resmin üzerine gelmesi için negatif margin
    flex: 1,
  },
  name: {
    fontSize: 28, // Daha büyük başlık fontu
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333', // Koyu gri renk
    textAlign: 'center', // Ortalanmış başlık
  },
  // HATA DÜZELTMESİ: infoRow stili eklendi
  infoRow: {
    flexDirection: 'row', // Öğeleri yatayda sıralar
    alignItems: 'center', // Öğeleri dikeyde ortalar
    marginBottom: 12, // Alt boşluk
    paddingVertical: 8, // Dikey iç boşluk
    borderBottomWidth: 1, // Ayırıcı çizgi
    borderBottomColor: '#eee', // Ayırıcı çizgi rengi
  },
  // HATA DÜZELTMESİ: label stili eklendi
  label: {
    fontSize: 16,
    fontWeight: '600', // Yarı kalın font
    color: '#555', // Orta gri renk
    flex: 1, // Etiketin genişlemesini sağlar
  },
  // HATA DÜZELTMESİ: value stili eklendi
  value: {
    fontSize: 16,
    color: '#333', // Koyu gri renk
    flex: 2, // Değerin daha fazla alan kaplamasını sağlar
    textAlign: 'right', // Değeri sağa yaslar
  },
  infoIcon: {
    marginRight: 10, // İkon ve metin arasına boşluk
    color: '#007bff', // İkon rengi (örnek: mavi)
  },
  description: {
    fontSize: 16,
    lineHeight: 24, // Satır yüksekliği
    color: '#666', // Biraz daha açık gri renk
    marginBottom: 20,
    textAlign: 'justify', // Metni iki yana yaslar
  },
  title: {
    fontSize: 20, // Ara başlıklar için font boyutu
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15, // Daha fazla alt boşluk
  },
  contactLabel: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 16,
  },
  // HATA DÜZELTMESİ: contactText stili eklendi (contactLink yerine veya ek olarak kullanılabilir)
  contactText: {
    fontSize: 16,
    color: '#007bff', // Bağlantı rengi
    marginLeft: 8,
  },
  contactLink: {
    fontSize: 16,
    color: '#007bff', // Bağlantı rengi
    textDecorationLine: 'underline', // Altı çizili
    marginLeft: 8,
  },
  map: {
    height: 250, // Harita yüksekliği artırıldı
    borderRadius: 10, // Köşeleri yuvarlaklaştırıldı
    marginBottom: 20,
    overflow: 'hidden', // Taşan içeriği gizler (özellikle borderRadius için)
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center', // Butonu ortalar
  },
  donateButton: {
    backgroundColor: '#28a745', // Yeşil renk (bağış butonu için uygun)
    paddingVertical: 15, // Dikey iç boşluk
    paddingHorizontal: 30, // Yatay iç boşluk
    borderRadius: 25, // Daha yuvarlak buton
    width: width * 0.8, // Genişliğin %80'i
    alignItems: 'center',
    shadowColor: '#000', // Gölge
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 18, // Font boyutu artırıldı
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Yarı saydam arka plan
  },
  modalContent: {
    width: width * 0.9, // Modal genişliği
    backgroundColor: '#fff',
    borderRadius: 15, // Daha yuvarlak köşeler
    padding: 25, // İç boşluk artırıldı
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22, // Modal başlığı font boyutu
    fontWeight: 'bold',
    marginBottom: 20, // Alt boşluk
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50, // Giriş alanı yüksekliği
    borderColor: '#ccc', // Kenarlık rengi
    borderWidth: 1,
    borderRadius: 10, // Köşe yuvarlaklığı
    paddingHorizontal: 15, // Yatay iç boşluk
    marginBottom: 15, // Alt boşluk
    fontSize: 16, // Font boyutu
  },
  modalButton: {
    backgroundColor: '#007bff', // Mavi renk
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20, // Daha yuvarlak buton
    marginTop: 10, // Üst boşluk
    minWidth: 120, // Minimum genişlik
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // İsteğe bağlı: Kapatma butonu için ek stil
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  closeButtonText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#888'
  }
});

export default styles;
