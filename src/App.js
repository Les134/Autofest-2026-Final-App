import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState([]);
  const [judge, setJudge] = useState("");

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");
  const [scores, setScores] = useState({});

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

  async function loadEvent(event) {
    try {
      const snap = await getDocs(collection(db, "events"));
      let found = false;

      snap.forEach(d => {
        if (d.id.toLowerCase() === event.toLowerCase()) {
          setJudges(d.data().judges || []);
          found = true;
        }
      });

      if (!found) {
        alert("Event not found");
        setJudges([]);
      }

    } catch (err) {
      alert("Error loading event");
    }
  }

  const styles = {
    container: {
      background: "#0b0f1a",
      color: "#fff",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial",
      textAlign: "center"
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
    smallBtn: {
      padding: "6px 8px",
      margin: "2px",
      background: "#1c2333",
      border: "1px solid #2f3a55",
      color: "#fff",
      fontSize: "12px",
      minWidth: "28px"
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "10px 0",
      background: "#111827",
      border: "1px solid #2f3a55",
      color: "#fff"
    },
    row: {
      marginBottom: "10px"
    }
  };

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={() => goTo("judgeLogin")}>Judge Login</button>
        <button style={styles.button} onClick={() => goTo("score")}>Resume Judging</button>
        <button style={styles.button} onClick={() => goTo("leaderboard")}>Leaderboard</button>
        <button style={styles.button} onClick={() => goTo("classLeaderboard")}>Class Leaderboard</button>
        <button style={styles.button} onClick={() => goTo("female")}>Female Overall</button>
        <button style={styles.button} onClick={() => goTo("top150")}>Top 150</button>
        <button style={styles.button} onClick={() => goTo("top30")}>Top 30 Finals</button>
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

  // SCORE
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

        <div style={styles.row}>
          {classes.map(c => (
            <button key={c} style={styles.smallBtn} onClick={() => setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat => (
          <div key={cat} style={styles.row}>
            <p>{cat}</p>
            {[...Array(20)].map((_, i) => (
              <button
                key={i}
                style={styles.smallBtn}
                onClick={() =>
                  setScores(prev => ({ ...prev, [cat]: i + 1 }))
                }
              >
                {i + 1}
              </button>
            ))}
          </div>
        ))}

        <button style={styles.button} onClick={async () => {

          if (!judge) return alert("Select judge");
          if (!car) return alert("Enter car");

          let total = Object.values(scores).reduce((a,b)=>a+b,0);

          await addDoc(collection(db,"scores"),{
            event:eventName,
            judge,
            car,
            gender,
            carClass,
            total
          });

          alert("Submitted");
          setScores({});
          setCar("");

        }}>
          Submit
        </button>

        <button style={styles.button} onClick={() => goTo("home")}>
          Home
        </button>

      </div>
    );
  }

  return null;
}

