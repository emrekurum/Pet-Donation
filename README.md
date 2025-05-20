# Hayvan Dostları - Mobil Bağış Platformu

[![React Native](https://img.shields.io/badge/React%20Native-0.60%2B-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
Bu proje, React Native ve Firebase kullanılarak geliştirilmiş, kullanıcıların barınaklardaki hayvanları görüntülemesine, çeşitli bağışlar yapmasına ve onları sanal olarak sahiplenmesine olanak tanıyan bir mobil uygulamadır.

## 🐾 Temel Özellikler

* **Hayvan Listeleme ve Detay Görüntüleme:** Barınaklardaki hayvanları tür, cins, yaş gibi bilgilerle listeleyin ve detaylı profillerini (açıklama, ihtiyaçlar, barınak bilgisi) inceleyin.
* **Dinamik Bağış Sistemi:**
    * Belirli hayvanlar için mama, oyuncak, ilaç gibi ürün bağışları veya nakit bağış yapın.
    * Bağış kalemlerinin fiyatları Firebase'den dinamik olarak çekilir.
* **Cüzdan Sistemi:** Kullanıcıların uygulama içi cüzdanları aracılığıyla bağış yapmasını sağlayın. Bakiye yükleme ve harcama işlemleri takip edilir.
* **Sanal Sahiplenme:** Kullanıcıların seçtikleri hayvanları sanal olarak sahiplenmelerine imkan tanıyın.
* **Barınak Bilgileri:** Hayvanların bulunduğu barınakların iletişim bilgilerine (telefon, e-posta, adres) erişim sağlayın.
* **Kullanıcı Kimlik Doğrulama:** Firebase Authentication ile güvenli kullanıcı girişi ve kaydı.

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React Native
* **Backend & Veritabanı:** Firebase
    * Firebase Authentication (Kullanıcı kimlik doğrulama)
    * Firebase Firestore (NoSQL Veritabanı)
* **Navigasyon:** React Navigation (`@react-navigation/native-stack`)
* **Firebase Entegrasyonu:** `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`
* **UI Bileşenleri:** `@react-native-picker/picker`

## 🔥 Firebase Kurulumu ve Veri Yapısı

Bu projeyi çalıştırabilmek için kendi Firebase projenizi kurmanız ve aşağıdaki Firestore koleksiyon yapılarını oluşturmanız gerekmektedir:

1.  **`users`**: Kullanıcı bilgilerini ve cüzdan bakiyelerini (`walletBalance`) saklar.
    * Örnek Alanlar: `displayName`, `email`, `walletBalance` (number)

2.  **`animals`**: Hayvanların detaylı bilgilerini içerir.
    * Örnek Alanlar: `name`, `type`, `breed`, `age`, `imageUrl`, `photos` (array), `description`, `shelterId`, `shelterName`, `needs` (array), `virtualAdoptersCount` (number)

3.  **`shelters`**: Barınak bilgilerini saklar.
    * Örnek Alanlar: `name`, `contactPhone`, `contactEmail`, `address`

4.  **`donationItemPrices`**: Bağışlanabilir ürünlerin birim fiyatlarını saklar. **Bu koleksiyonun adı ve içindeki alan adı önemlidir.**
    * **Koleksiyon Adı:** `donationItemPrices`
    * **Doküman ID'leri:** Bağış türünün anahtarı (Örn: `Mama`, `Oyuncak`, `İlaç`)
    * **Doküman Alanları:**
        * `name`: (String, isteğe bağlı, örn: "Kaliteli Kedi Maması")
        * `unitPrice`: (Number, örn: `60`) - **Kod bu alanı `unitPrice` olarak beklemektedir.**

5.  **`donations`**: Yapılan tüm bağışların kaydını tutar.
    * Örnek Alanlar: `userId`, `userName`, `animalId`, `animalName`, `shelterId`, `shelterName`, `donationType`, `amount` (number), `currency` ("TL"), `description`, `quantity` (number, eğer ürün bazlıysa), `donationDate` (timestamp), `status`, `paymentMethod`

6.  **`virtualAdoptions`**: Sanal sahiplenme kayıtlarını tutar.
    * Örnek Alanlar: `userId`, `animalId`, `animalName`, `shelterId`, `adoptionDate` (timestamp), `status`

7.  **`walletTransactions`**: Kullanıcı cüzdanlarındaki tüm para yatırma ve çekme (bağış yapma) işlemlerini kaydeder.
    * Örnek Alanlar: `userId`, `type` ("deposit" veya "donation"), `amount` (number), `description`, `relatedAnimalId`, `relatedDonationId`, `transactionDate` (timestamp)

## 🚀 Başlarken

Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler

* Node.js (LTS sürümü önerilir)
* npm veya Yarn
* React Native CLI (`npm install -g react-native-cli` veya `yarn global add react-native-cli`)
* Android Studio (Android için) ve/veya Xcode (iOS için)
* Bir Firebase hesabı ve projesi

### Kurulum

1.  **Depoyu Klonlayın:**
    ```bash
    git clone [https://github.com/kullaniciAdiniz/repoAdiniz.git](https://github.com/kullaniciAdiniz/repoAdiniz.git)
    cd repoAdiniz
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    yarn install
    ```

3.  **Firebase Proje Kurulumu:**
    * Firebase konsolunda yeni bir proje oluşturun.
    * Projenize Android ve/veya iOS uygulaması ekleyin.
    * **Android için:** `android/app/google-services.json` dosyasını Firebase'den indirin ve projenizdeki ilgili konuma yerleştirin.
    * **iOS için:** `ios/Runner/GoogleService-Info.plist` dosyasını Firebase'den indirin ve projenizdeki ilgili konuma (Xcode üzerinden) ekleyin. `Podfile`'ı güncelleyin:
        ```bash
        cd ios
        pod install --repo-update
        cd ..
        ```
    * Firebase konsolunda **Authentication**'ı (E-posta/Şifre metoduyla) etkinleştirin.
    * **Firestore Veritabanı** oluşturun ve yukarıda belirtilen koleksiyon yapılarını manuel olarak veya bir script ile oluşturun (özellikle `donationItemPrices` başlangıç için önemlidir).
    * Firestore **Kurallarınızı** projenizin ihtiyaçlarına göre ayarlayın (geliştirme için daha esnek, üretim için daha sıkı kurallar).

4.  **Uygulamayı Çalıştırma:**

    * **Android için:**
        ```bash
        npx react-native run-android
        # veya
        yarn android
        ```
    * **iOS için:**
        ```bash
        npx react-native run-ios
        # veya
        yarn ios
        ```

## 📂 Proje Yapısı (Özet)
Kodlama desteği

Düşünme sürecini göster
Harika bir fikir! GitHub için iyi bir README.md dosyası, projenizin ne hakkında olduğunu, nasıl kurulacağını ve kullanılacağını anlatır, ayrıca potansiyel katkıda bulunanlar için de yol gösterici olur.

Projenizin mevcut özelliklerini ve teknolojilerini göz önünde bulundurarak sizin için bir README.md taslağı oluşturdum. Bu taslağı projenize özel detaylarla daha da geliştirebilirsiniz.

Markdown

# Hayvan Dostları - Mobil Bağış Platformu

[![React Native](https://img.shields.io/badge/React%20Native-0.60%2B-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
Bu proje, React Native ve Firebase kullanılarak geliştirilmiş, kullanıcıların barınaklardaki hayvanları görüntülemesine, çeşitli bağışlar yapmasına ve onları sanal olarak sahiplenmesine olanak tanıyan bir mobil uygulamadır.

## 🐾 Temel Özellikler

* **Hayvan Listeleme ve Detay Görüntüleme:** Barınaklardaki hayvanları tür, cins, yaş gibi bilgilerle listeleyin ve detaylı profillerini (açıklama, ihtiyaçlar, barınak bilgisi) inceleyin.
* **Dinamik Bağış Sistemi:**
    * Belirli hayvanlar için mama, oyuncak, ilaç gibi ürün bağışları veya nakit bağış yapın.
    * Bağış kalemlerinin fiyatları Firebase'den dinamik olarak çekilir.
* **Cüzdan Sistemi:** Kullanıcıların uygulama içi cüzdanları aracılığıyla bağış yapmasını sağlayın. Bakiye yükleme ve harcama işlemleri takip edilir.
* **Sanal Sahiplenme:** Kullanıcıların seçtikleri hayvanları sanal olarak sahiplenmelerine imkan tanıyın.
* **Barınak Bilgileri:** Hayvanların bulunduğu barınakların iletişim bilgilerine (telefon, e-posta, adres) erişim sağlayın.
* **Kullanıcı Kimlik Doğrulama:** Firebase Authentication ile güvenli kullanıcı girişi ve kaydı.

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React Native
* **Backend & Veritabanı:** Firebase
    * Firebase Authentication (Kullanıcı kimlik doğrulama)
    * Firebase Firestore (NoSQL Veritabanı)
* **Navigasyon:** React Navigation (`@react-navigation/native-stack`)
* **Firebase Entegrasyonu:** `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`
* **UI Bileşenleri:** `@react-native-picker/picker`

## 🔥 Firebase Kurulumu ve Veri Yapısı

Bu projeyi çalıştırabilmek için kendi Firebase projenizi kurmanız ve aşağıdaki Firestore koleksiyon yapılarını oluşturmanız gerekmektedir:

1.  **`users`**: Kullanıcı bilgilerini ve cüzdan bakiyelerini (`walletBalance`) saklar.
    * Örnek Alanlar: `displayName`, `email`, `walletBalance` (number)

2.  **`animals`**: Hayvanların detaylı bilgilerini içerir.
    * Örnek Alanlar: `name`, `type`, `breed`, `age`, `imageUrl`, `photos` (array), `description`, `shelterId`, `shelterName`, `needs` (array), `virtualAdoptersCount` (number)

3.  **`shelters`**: Barınak bilgilerini saklar.
    * Örnek Alanlar: `name`, `contactPhone`, `contactEmail`, `address`

4.  **`donationItemPrices`**: Bağışlanabilir ürünlerin birim fiyatlarını saklar. **Bu koleksiyonun adı ve içindeki alan adı önemlidir.**
    * **Koleksiyon Adı:** `donationItemPrices`
    * **Doküman ID'leri:** Bağış türünün anahtarı (Örn: `Mama`, `Oyuncak`, `İlaç`)
    * **Doküman Alanları:**
        * `name`: (String, isteğe bağlı, örn: "Kaliteli Kedi Maması")
        * `unitPrice`: (Number, örn: `60`) - **Kod bu alanı `unitPrice` olarak beklemektedir.**

5.  **`donations`**: Yapılan tüm bağışların kaydını tutar.
    * Örnek Alanlar: `userId`, `userName`, `animalId`, `animalName`, `shelterId`, `shelterName`, `donationType`, `amount` (number), `currency` ("TL"), `description`, `quantity` (number, eğer ürün bazlıysa), `donationDate` (timestamp), `status`, `paymentMethod`

6.  **`virtualAdoptions`**: Sanal sahiplenme kayıtlarını tutar.
    * Örnek Alanlar: `userId`, `animalId`, `animalName`, `shelterId`, `adoptionDate` (timestamp), `status`

7.  **`walletTransactions`**: Kullanıcı cüzdanlarındaki tüm para yatırma ve çekme (bağış yapma) işlemlerini kaydeder.
    * Örnek Alanlar: `userId`, `type` ("deposit" veya "donation"), `amount` (number), `description`, `relatedAnimalId`, `relatedDonationId`, `transactionDate` (timestamp)

## 🚀 Başlarken

Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler

* Node.js (LTS sürümü önerilir)
* npm veya Yarn
* React Native CLI (`npm install -g react-native-cli` veya `yarn global add react-native-cli`)
* Android Studio (Android için) ve/veya Xcode (iOS için)
* Bir Firebase hesabı ve projesi

### Kurulum

1.  **Depoyu Klonlayın:**
    ```bash
    git clone [https://github.com/kullaniciAdiniz/repoAdiniz.git](https://github.com/kullaniciAdiniz/repoAdiniz.git)
    cd repoAdiniz
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    yarn install
    ```

3.  **Firebase Proje Kurulumu:**
    * Firebase konsolunda yeni bir proje oluşturun.
    * Projenize Android ve/veya iOS uygulaması ekleyin.
    * **Android için:** `android/app/google-services.json` dosyasını Firebase'den indirin ve projenizdeki ilgili konuma yerleştirin.
    * **iOS için:** `ios/Runner/GoogleService-Info.plist` dosyasını Firebase'den indirin ve projenizdeki ilgili konuma (Xcode üzerinden) ekleyin. `Podfile`'ı güncelleyin:
        ```bash
        cd ios
        pod install --repo-update
        cd ..
        ```
    * Firebase konsolunda **Authentication**'ı (E-posta/Şifre metoduyla) etkinleştirin.
    * **Firestore Veritabanı** oluşturun ve yukarıda belirtilen koleksiyon yapılarını manuel olarak veya bir script ile oluşturun (özellikle `donationItemPrices` başlangıç için önemlidir).
    * Firestore **Kurallarınızı** projenizin ihtiyaçlarına göre ayarlayın (geliştirme için daha esnek, üretim için daha sıkı kurallar).

4.  **Uygulamayı Çalıştırma:**

    * **Android için:**
        ```bash
        npx react-native run-android
        # veya
        yarn android
        ```
    * **iOS için:**
        ```bash
        npx react-native run-ios
        # veya
        yarn ios
        ```

## 📂 Proje Yapısı (Özet)

/
├── android/                # Android projesi
├── ios/                    # iOS projesi
├── src/
│   ├── assets/             # Resimler, fontlar vb.
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri
│   ├── navigation/         # Navigasyon yapısı (AppNavigator.tsx)
│   ├── screens/            # Ana ekran bileşenleri (AnimalDetailScreen.tsx vb.)
│   ├── services/           # Firebase servisleri, API çağrıları vb.
│   ├── store/              # (Eğer varsa) Global state yönetimi (Redux, Zustand vb.)
│   └── App.tsx             # Ana uygulama bileşeni
├── ...                     # Diğer yapılandırma dosyaları (babel.config.js, metro.config.js vb.)
└── README.md

## 🤝 Katkıda Bulunma

Katkılarınız projeyi daha da geliştirmemize yardımcı olacaktır! Lütfen katkıda bulunmadan önce `CONTRIBUTING.md` (eğer oluşturulursa) dosyasını okuyun.

1.  Bu depoyu fork'layın.
2.  Yeni bir özellik veya düzeltme için kendi branch'inizi oluşturun (`git checkout -b ozellik/yeni-bagis-akisi`).
3.  Değişikliklerinizi commit'leyin (`git commit -m 'Yeni bağış akışı eklendi'`).
4.  Branch'inizi push'layın (`git push origin ozellik/yeni-bagis-akisi`).
5.  Bir Pull Request (PR) açın.

## 📜 Lisans

Bu proje [MIT Lisansı](LISANS.md) altında lisanslanmıştır. (Eğer bir LISANS.md dosyası eklerseniz.)

---