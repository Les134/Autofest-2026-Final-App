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

  // ✅ DEBUG VERSION
  async function loadEvents() {
    try {
      const snap = await getDocs(collection(db, "events"));

      console.log("RAW SNAP:", snap);

      const list = [];

      snap.forEach(doc => {
        console.log("DOC FOUND:", doc.id, doc.data());
        list.push({
          id: doc.id,
          judges: doc.data().judges || []
        });
      });

      console.log("FINAL EVENTS:", list);

      alert("Events found: " + list.length);

      setEvents(list);

    } catch (err) {
      console.error("FIRESTORE ERROR:", err);
      alert("Firestore error: " + err.message);
    }
  }

  useEffect(() => {
    if (screen === "judgeLogin") loadEvents();
  }, [screen]);

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
      fontSize: "16px"
    },
    row: {
      display: "flex",
      gap: "6px"
    },
    scoreRow: {
      display: "flex",
      overflowX: "auto"
    },
    scoreBtn: {
      padding: "10px",
      margin: "2px",
      minWidth: "36px",
      background: "#1c2333",
      border: "1px solid #2f3a55",
      color: "#fff"
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
        <button style={styles.button} onClick={() => goTo("judgeLogin")}>
          Judge Login
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>
        <h2>Select Event</h2>

        {events.map((e, i) => (
          <button key={i} style={styles.button} onClick={() => {
            setEventName(e.id);
            setJudges(e.judges);
          }}>
            {e.id}
          </button>
        ))}

        <h3>Select Judge</h3>

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

  // SCORE SCREEN
  if (screen === "score") {
    return (
      <div style={styles.container}>

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input
          style={styles.input}
          placeholder="Car # / Rego"
          value={car}
          onChange={(e) => setCar(e.target.value)}
        />

        <div style={styles.row}>
          <button style={styles.button} onClick={() => setGender("Male")}>Male</button>
          <button style={styles.button} onClick={() => setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c => (
            <button key={c} style={styles.scoreBtn} onClick={() => setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat => (
          <div key={cat}>
            <p>{cat}</p>
            <div style={styles.scoreRow}>
              {[...Array(20)].map((_, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.scoreBtn,
                    ...(scores[cat] === i + 1 ? styles.activeBtn : {})
                  }}
                  onClick={() =>
                    setScores(prev => ({ ...prev, [cat]: i + 1 }))
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button style={styles.button} onClick={() => goTo("home")}>
          Home
        </button>

      </div>
    );
  }

  return null;
}

