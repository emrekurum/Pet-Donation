# Pet Friends - Mobile Donation Platform

[![React Native](https://img.shields.io/badge/React%20Native-0.60%2B-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

This project is a mobile application built with React Native and Firebase, allowing users to view animals in shelters, make various donations, and virtually adopt them.

## 🐾 Key Features

* **Animal Listing & Detail View:** List shelter animals with details like species, breed, and age. View detailed profiles including description, needs, and shelter info.
* **Dynamic Donation System:**
  * Donate items (food, toys, medicine) or money to specific animals.
  * Donation item prices are dynamically fetched from Firebase.
* **Wallet System:** Users can donate using their in-app wallet. Balance top-up and spending are tracked.
* **Virtual Adoption:** Allows users to virtually adopt selected animals.
* **Shelter Information:** Access shelter contact info (phone, email, address).
* **User Authentication:** Secure login and signup with Firebase Authentication.

## 🛠️ Technologies Used

* **Frontend:** React Native
* **Backend & Database:** Firebase
  * Firebase Authentication
  * Firebase Firestore (NoSQL)
* **Navigation:** React Navigation (`@react-navigation/native-stack`)
* **Firebase Modules:** `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`
* **UI Components:** `@react-native-picker/picker`

## 🔥 Firebase Setup & Data Structure

To run the app, set up your own Firebase project and create the following Firestore collections:

1. **`users`** – Stores user info and wallet balance
   * Example Fields: `displayName`, `email`, `walletBalance` (number)

2. **`animals`** – Stores animal details
   * Fields: `name`, `type`, `breed`, `age`, `imageUrl`, `photos` (array), `description`, `shelterId`, `shelterName`, `needs` (array), `virtualAdoptersCount` (number)

3. **`shelters`** – Shelter info
   * Fields: `name`, `contactPhone`, `contactEmail`, `address`

4. **`donationItemPrices`** – Prices for donation items
   * Collection name: `donationItemPrices`
   * Document IDs: Item types (`Food`, `Toy`, `Medicine`)
   * Fields:
     * `name` (optional string)
     * `unitPrice` (required number – e.g., `60`)

5. **`donations`** – Donation history
   * Fields: `userId`, `userName`, `animalId`, `animalName`, `shelterId`, `shelterName`, `donationType`, `amount`, `currency` (e.g., "TL"), `description`, `quantity`, `donationDate`, `status`, `paymentMethod`

6. **`virtualAdoptions`** – Virtual adoption records
   * Fields: `userId`, `animalId`, `animalName`, `shelterId`, `adoptionDate`, `status`

7. **`walletTransactions`** – Tracks wallet deposits and spending
   * Fields: `userId`, `type` ("deposit" or "donation"), `amount`, `description`, `relatedAnimalId`, `relatedDonationId`, `transactionDate`

## 🚀 Getting Started

### Requirements

* Node.js (LTS version recommended)
* npm or Yarn
* React Native CLI (`npm install -g react-native-cli`)
* Android Studio (for Android) and/or Xcode (for iOS)
* A Firebase account and project

### Setup

1. **Clone the repository:**


git clone https://github.com/yourUsername/yourRepo.git
cd yourRepo

Install dependencies:

npm install
# or
yarn install
Firebase Project Setup:

Create a Firebase project.

Add your Android/iOS app in Firebase.

For Android: Download google-services.json and place it in android/app/.

For iOS: Download GoogleService-Info.plist and add it to your Xcode project (ios/Runner/). Then:


cd ios
pod install --repo-update
cd ..
Enable Authentication (email/password).

Create the Firestore database and collections as described above.

Set Firestore rules according to your environment (relaxed for development, strict for production).

Run the app:

Android:


npx react-native run-android
# or
yarn android
iOS:

npx react-native run-ios
# or
yarn ios
📂 Project Structure (Overview)

/
├── android/                # Android project
├── ios/                    # iOS project
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable UI components
│   ├── navigation/         # Navigation (AppNavigator.tsx)
│   ├── screens/            # Screens (AnimalDetailScreen.tsx, etc.)
│   ├── services/           # Firebase services, API handlers
│   ├── store/              # (Optional) State management (Redux, Zustand, etc.)
│   └── App.tsx             # Main app entry point
├── .gitignore
├── README.md
└── ...
🤝 Contributing
Your contributions are welcome! Please read CONTRIBUTING.md (if available) before submitting a pull request.

Fork the repository.

Create a new feature/fix branch: git checkout -b feature/new-donation-flow

Commit your changes: git commit -m 'Add new donation flow'

Push to your branch: git push origin feature/new-donation-flow

Open a Pull Request.

📜 License
This project is licensed under the MIT License. (Include LICENSE.md in your repo.)