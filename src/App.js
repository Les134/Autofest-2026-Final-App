import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [judges, setJudges] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judge, setJudge] = useState("");

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");

  const [scores, setScores] = useState({});
  const [tyres, setTyres] = useState(0);
  const [deductions, setDeductions] = useState([]);

  const categories = [
    "Instant Smoke",
    "Volume of Smoke",
    "Constant Smoke",
    "Driver Skill & Control"
  ];

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];

  function goTo(screenName){
    setScreen(screenName);
  }

  // ✅ LOAD EVENTS AUTOMATICALLY
  async function loadEvents() {
    const snap = await getDocs(collection(db, "events"));
    const list = [];

    snap.forEach(doc => {
      list.push({
        id: doc.id,
        judges: doc.data().judges || []
      });
    });

    setEvents(list);
  }

  useEffect(() => {
    if (screen === "judgeLogin") {
      loadEvents();
    }
  }, [screen]);

  // ================= HOME =================
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={() => goTo("judgeLogin")}>
          Judge Login
        </button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>
        <h2>Select Event</h2>

        {events.map((e, i) => (
          <button
            key={i}
            style={styles.button}
            onClick={() => {
              setEventName(e.id);
              setJudges(e.judges);
            }}
          >
            {e.id}
          </button>
        ))}

        <h3>Select Judge</h3>

        {judges.map((j, i) => (
          <button
            key={i}
            style={styles.button}
            onClick={() => {
              setJudge(j);
              goTo("score");
            }}
          >
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={() => goTo("home")}>
          Home
        </button>
      </div>
    );
  }

  // ================= SCORE =================
  if (screen === "score") {
    return (
      <div style={styles.container}>
        <h2>{eventName}</h2>
        <h3>{judge}</h3>
      </div>
    );
  }

  return null;
}

// ================= STYLES =================
const styles = {
  container: {
    background: "#0b0f1a",
    color: "#fff",
    minHeight: "100vh",
    padding: "15px",
    fontFamily: "Arial"
  },
  button: {
    width: "100%",
    padding: "14px",
    margin: "6px 0",
    background: "#1c2333",
    border: "1px solid #2f3a55",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer"
  }
};

