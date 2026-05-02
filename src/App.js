import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill"
];

// ================= SCORE SCREEN =================
function ScoreScreen({ eventName, activeJudge, onBackHome, onLeaderboard, onReset }) {
  const [car, setCar] = useState("");
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  const btn = { padding: 10, margin: 5 };
  const active = { ...btn, background: "red", color: "#fff" };

  const submit = async () => {

    if (saving) return;

    if (!eventName) return alert("No event started");
    if (!activeJudge) return alert("No judge selected");
    if (!car) return alert("Enter Car #");

    setSaving(true);

    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    try {
      await addDoc(collection(db, "scores"), {
        eventName,
        car,
        judge: activeJudge,
        total,
        createdAt: new Date()
      });

      // 🔥 THIS FORCES A BRAND NEW CLEAN SCORE SCREEN
      onReset();

    } catch (err) {
      console.error(err);
      alert("Error saving");
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>{eventName} - {activeJudge}</h3>

      <input
        placeholder="Car #"
        value={car}
        onChange={(e) => setCar(e.target.value)}
      />

      {categories.map(cat => (
        <div key={cat}>
          <strong>{cat}</strong><br />
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              style={scores[cat] === i ? active : btn}
              onClick={() => setScores({ ...scores, [cat]: i })}
            >
              {i}
            </button>
          ))}
        </div>
      ))}

      <br />

      <button disabled={saving} onClick={submit}>
        {saving ? "Saving..." : "Submit"}
      </button>

      <button onClick={onLeaderboard}>Leaderboard</button>
      <button onClick={onBackHome}>Home</button>
    </div>
  );
}

// ================= MAIN APP =================
export default function App() {
  const [screen, setScreen] = useState("home");

  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState(["", "", ""]);
  const [activeJudge, setActiveJudge] = useState("");

  const [entries, setEntries] = useState([]);

  // 🔥 THIS KEY IS THE SECRET TO RESETTING THE FORM
  const [scoreKey, setScoreKey] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "scores"), snap => {
      setEntries(snap.docs.map(d => d.data()));
    });
    return () => unsub();
  }, []);

  const startEvent = () => {
    if (!eventName) return alert("Enter event name");

    const valid = judges.filter(j => j.trim() !== "");
    if (valid.length === 0) return alert("Add at least 1 judge");

    setJudges(valid);
    setScreen("judge");
  };

  // ================= HOME =================
  if (screen === "home") {
    return (
      <div style={{ padding: 20 }}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button onClick={() => setScreen("setup")}>New Event</button>
        <button onClick={() => setScreen("judge")}>Judge Login</button>
        <button onClick={() => setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  // ================= SETUP =================
  if (screen === "setup") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        {judges.map((j, i) => (
          <input
            key={i}
            placeholder={`Judge ${i + 1}`}
            value={judges[i]}
            onChange={(e) => {
              const copy = [...judges];
              copy[i] = e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={startEvent}>Start Event</button>
        <button onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= JUDGE =================
  if (screen === "judge") {
    return (
      <div style={{ padding: 20 }}>
        <h2>Select Judge</h2>

        {judges.map((j, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveJudge(j);
              setScreen("score");
            }}
          >
            {j || `Judge ${i + 1}`}
          </button>
        ))}

        <button onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= SCORE =================
  if (screen === "score") {
    return (
      <ScoreScreen
        key={scoreKey}
        eventName={eventName}
        activeJudge={activeJudge}
        onBackHome={() => setScreen("home")}
        onLeaderboard={() => setScreen("leader")}
        onReset={() => {
          // 🔥 THIS CREATES A BRAND NEW CLEAN FORM
          setScoreKey(prev => prev + 1);
        }}
      />
    );
  }

  // ================= LEADERBOARD =================
  if (screen === "leader") {
    return (
      <div style={{ padding: 20 }}>
        <h2>🏆 Leaderboard</h2>

        {entries
          .sort((a, b) => b.total - a.total)
          .map((e, i) => (
            <div key={i}>
              #{i + 1} | Car {e.car} | {e.total}
            </div>
          ))}

        <button onClick={() => setScreen("home")}>Back</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
