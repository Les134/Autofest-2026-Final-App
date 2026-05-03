import React, { useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc
} from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState([]);

  const [judge, setJudge] = useState("");

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");

  const [scores, setScores] = useState({});
  const [deductions, setDeductions] = useState({});

  const categories = [
    "Instant Smoke",
    "Volume of Smoke",
    "Constant Smoke",
    "Driver Skill & Control"
  ];

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];

  // ✅ FIXED EVENT LOAD (STRICT MATCH)
  async function loadEvent(event) {
    if (!event) {
      alert("Enter Event Name");
      return;
    }

    const snap = await getDocs(collection(db, "events"));

    let found = false;

    snap.forEach(d => {
      if (d.id === event) {
        setJudges(d.data().judges || []);
        found = true;
      }
    });

    if (!found) {
      alert("Event not found");
      setJudges([]);
    }
  }

  // =========================
  // HOME (UNCHANGED LAYOUT)
  // =========================
  if (screen === "home") {
    return (
      <div className="container">

        <h1>🔥 AUTOFEST 🔥</h1>

        <button onClick={() => setScreen("judgeLogin")}>
          Judge Login
        </button>

        <button onClick={() => {
          if (!judge) {
            alert("Login as judge first");
            return;
          }
          setScreen("score");
        }}>
          Resume Judging
        </button>

        <button onClick={() => setScreen("leaderboard")}>
          Leaderboard
        </button>

        <button onClick={() => setScreen("classLeaderboard")}>
          Class Leaderboard
        </button>

        <button onClick={() => setScreen("female")}>
          Female Overall
        </button>

        <button onClick={() => setScreen("top150")}>
          Top 150
        </button>

        <button onClick={() => setScreen("top30")}>
          Top 30 Finals
        </button>

      </div>
    );
  }

  // =========================
  // JUDGE LOGIN (FIXED)
  // =========================
  if (screen === "judgeLogin") {
    return (
      <div className="container">

        <h2>Judge Login</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        <button onClick={() => loadEvent(eventName)}>
          Load Judges
        </button>

        {judges.length === 0 && (
          <p>No judges loaded</p>
        )}

        {judges.map((j, i) => (
          <button key={i} onClick={() => {
            setJudge(j);
            setScreen("score"); // ✅ GUARANTEED NAVIGATION
          }}>
            {j}
          </button>
        ))}

        <button onClick={() => setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  // =========================
  // SCORE SCREEN (UNCHANGED UI)
  // =========================
  if (screen === "score") {
    return (
      <div className="container">

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input
          placeholder="Car # / Rego"
          value={car}
          onChange={(e) => setCar(e.target.value)}
        />

        <div>
          <button onClick={() => setGender("Male")}>Male</button>
          <button onClick={() => setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c => (
            <button key={c} onClick={() => setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat => (
          <div key={cat}>
            <p>{cat}</p>
            {[...Array(20)].map((_, i) => (
              <button
                key={i}
                onClick={() =>
                  setScores(prev => ({ ...prev, [cat]: i + 1 }))
                }
              >
                {i + 1}
              </button>
            ))}
          </div>
        ))}

        <button onClick={async () => {

          if (!judge) {
            alert("Judge not selected");
            return;
          }

          if (!car) {
            alert("Enter car number");
            return;
          }

          if (Object.keys(scores).length !== categories.length) {
            alert("Complete all scores");
            return;
          }

          let total = Object.values(scores).reduce((a, b) => a + b, 0);

          try {
            await addDoc(collection(db, "scores"), {
              event: eventName,
              judge,
              car,
              gender,
              carClass,
              total
            });

            alert("Submitted");

            setScores({});
            setCar("");

          } catch (err) {
            alert("Error saving score");
          }

        }}>
          Submit
        </button>

        <button onClick={() => setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  return null;
}
