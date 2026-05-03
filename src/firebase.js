import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOURS",
  authDomain: "autofest-burnout-judging.firebaseapp.com",
  projectId: "autofest-burnout-judging",
  storageBucket: "autofest-burnout-judging.appspot.com",
  messagingSenderId: "453347070025",
  appId: "REPLACE_WITH_YOURS"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
