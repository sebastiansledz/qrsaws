# QRSaws - Blade Management System

A modern blade tracking and management system built with React, TypeScript, and Firebase.

## Features

- 🔐 Firebase Authentication with role-based access
- 📱 Mobile-first responsive design
- 🌍 Multi-language support (Polish/English)
- 📊 QR code scanning for blade tracking
- 👥 Admin and client dashboards
- 🎨 Apple-inspired UI with smooth animations

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication and Firestore
   - Copy your Firebase config to `.env`:
   
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Deploy security rules:
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init
   
   # Deploy Firestore rules
   firebase deploy --only firestore:rules
   
   # Deploy Storage rules
   firebase deploy --only storage:rules
   ```
6. Set up custom claims for users (role and clientId) using Cloud Functions or Admin SDK
5. Copy the config values to your `.env` file

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── i18n/               # Translation files
├── lib/                # Utilities and configurations
├── routes/             # Page components
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Technologies

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Routing:** React Router v6
- **Authentication:** Firebase Auth
- **Database:** Firestore
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **QR Codes:** react-qr-reader
- **Internationalization:** i18next

## License

MIT