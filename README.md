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

## 📂 Project Structure (example)

JoiApp/
├── src/
│ ├── components/
│ ├── screens/
│ ├── services/
│ ├── utils/
│ └── assets/
├── App.js
└── README.md

yaml
Copy
Edit

---

## ✅ Getting Started

1. **Install dependencies**

```bash
npm install
# or
yarn install
Run the app

bash
Copy
Edit
npx react-native run-ios       # iOS
npx react-native run-android   # Android
Build for production

iOS: Use Xcode archive

Android: Generate signed APK or AAB

📌 Notes
Survey page designs by Sunny (ETA: July 25)

MVP will launch with only critical features for App Store readiness

Additional features (like full AI interaction) planned for post-launch
