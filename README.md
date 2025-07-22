# 📱 JoiApp Mobile (MVP)

JoiApp is a mobile application built using React Native that enables users to scan documents or faces, upload images, and receive AI-driven feedback or analysis. This MVP focuses on implementing essential native-level functionality to support a streamlined App Store release.

---

## 🚀 Core Features (MVP Scope)

- 📷 **Camera Access** – Scan documents or faces for AI processing  
- 🎙️ **Microphone Access** – Record audio for future use  
- 🖼️ **Photo Library Access** – Upload saved images or videos  
- 🔔 **Local Push Notifications** – Alert users on analysis completion or reminders  
- 💾 **Local Storage** – Store recent data and app settings  
- 📱 **Device Info Capture** – Collect device metadata for crash/error reporting  

---

## 🛠️ Tech Stack

- **React Native**
- **AsyncStorage / MMKV** – Local storage
- **React Native Push Notifications**
- **Sentry / Bugsnag** – Error tracking
- **Expo or React Native CLI**

---

## 📅 Development Timeline

- **Start Date:** July 22, 2025  
- **Feature Complete:** August 18, 2025  
- **Internal QA & Testing:** August 18–25  
- **App Store Submission:** Late August 2025  

---

## ✅ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/joiapp-mobile.git
cd joiapp-mobile
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Run the App

#### For iOS

```bash
npx react-native run-ios
```

#### For Android

```bash
npx react-native run-android
```

> Make sure your Android emulator or iOS simulator is running, or a real device is connected.

---

### 4. Build for Production

#### iOS
- Open the project in Xcode
- Archive and export via the App Store process

#### Android

```bash
cd android
./gradlew assembleRelease
```

- Or generate an AAB file for Google Play submission

---
