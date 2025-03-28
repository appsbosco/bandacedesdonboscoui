// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyAOgbxy6F-X6LouEHgNluCITlwN7uaN018",
  authDomain: "bcdb-app-9466f.firebaseapp.com",
  projectId: "bcdb-app-9466f",
  storageBucket: "bcdb-app-9466f.firebasestorage.app",
  messagingSenderId: "406724473775",
  appId: "1:406724473775:web:f05efa64455b951006355a",
  measurementId: "G-21V5MDTRXN",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

export const generateToken = async () => {
  const permission = await Notification.requestPermission();
  console.log("Permiso", permission);

  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey:
        "BJmb2xP_HgqJHavQ-ur2jLzepOyjt2V8Dubb59y8KMn6OZqEfZs_vclMuLd_8CDVofoCB0-u5jdXHx-VQw57_hA",
    });
    console.log("Token", token);

    return token;
  }
  return null;
};
