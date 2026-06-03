// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyAOgbxy6F-X6LouEHgNluCITlwN7uaN018",
  authDomain: "bcdb-app-9466f.firebaseapp.com",
  projectId: "bcdb-app-9466f",
  storageBucket: "bcdb-app-9466f.appspot.com",
  messagingSenderId: "406724473775",
  appId: "1:406724473775:web:f05efa64455b951006355a",
  measurementId: "G-21V5MDTRXN",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  // Estrategia única: el backend envía payload FCM con `notification` /
  // `webpush.notification`, entonces Firebase muestra la notificación en
  // background. No llamamos showNotification() para ese mismo mensaje porque
  // produciría duplicados en navegadores.
  if (payload.notification) return;

  // Fallback solo para futuros mensajes data-only.
  const title = payload.data?.title;
  const body = payload.data?.body;
  if (!title && !body) return;

  self.registration.showNotification(title || "Banda CEDES Don Bosco", {
    body: body || "",
    icon: "./Icons-01.jpg",
  });
});
