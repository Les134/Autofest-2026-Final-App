import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState([]);
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

  useEffect(() => {
    const savedJudge = localStorage.getItem("judge");
    if (savedJudge) setJudge(savedJudge);
  }, []);

  useEffect(() => {
    if (judge) localStorage.setItem("judge", judge);
  }, [judge]);

  // ✅ FIXED JUDGE LOAD
  async function loadEvent(event) {
    if (!event) return alert("Enter event name");

    try {
      const cleanEvent = event.trim().toLowerCase();

      const ref = doc(db, "events", cleanEvent);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setJudges(data.judges || []);

        // ✅ DEBUG CONFIRM
        alert("Judges loaded: " + (data.judges?.length || 0));

      } else {
        alert("Event not found: " + cleanEvent);
        setJudges([]);
      }

    } catch (err) {
      console.error(err);
      alert("Error loading event");
    }
  }

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
    },
    row: {
      display: "flex",
      gap: "6px"
    },
    scoreRow: {
      display: "flex",
      flexWrap: "nowrap",
      overflowX: "auto"
    },
    scoreBtn: {
      padding: "10px",
      margin: "2px",
      minWidth: "36px",
      background: "#1c2333",
      border: "1px solid #2f3a55",
      color: "#fff",
      fontSize: "14px",
      cursor: "pointer"
    },
    activeBtn: {
      background: "#ff6b00"
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "10px 0",
      background: "#111827",
      border: "1px solid #2f3a55",
      color: "#fff"
    }
  };

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={() => goTo("judgeLogin")}>Judge Login</button>
        <button style={styles.button} onClick={() => goTo("score")}>Resume Judging</button>
        <button style={styles.button}>Leaderboard</button>
        <button style={styles.button}>Class Leaderboard</button>
        <button style={styles.button}>Female Overall</button>
        <button style={styles.button}>Top 150</button>
        <button style={styles.button}>Top 30 Finals</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>
        <h2>Judge Login</h2>

        <input
          style={styles.input}
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        <button style={styles.button} onClick={() => loadEvent(eventName)}>
          Load Judges
        </button>

        {judges.map((j, i) => (
          <button key={i} style={styles.button} onClick={() => {
            setJudge(j);
            goTo("score");
          }}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={() => goTo("home")}>
          Home
        </button>
      </div>
    );
  }

  // SCORE
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

