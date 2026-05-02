import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE HERE",
  authDomain: "PASTE HERE",
  projectId: "PASTE HERE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
