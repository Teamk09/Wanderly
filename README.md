## Run Locally

### Team Members:
- Cameron Kerestus
- Aidan Yokanovich
- Egi Rama

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create or update [.env.local](.env.local) with:
   GOOGLE_MAPS_API_KEY=your-google-maps-javascript-api-key
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   VITE_GEMINI_PROXY_URL=https://your-worker-subdomain.workers.dev

3. Run the app:
   `npm run dev`
