import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill"
];

function ScoreScreen({ eventName, activeJudge, onBackHome, onLeaderboard }) {
  const [car, setCar] = useState("");
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false); // 🔥 KEY FIX

  const btn = { padding: 10, margin: 5 };
  const active = { ...btn, background: "red", color: "#fff" };

  const submit = async () => {

    if (saving) return; // 🔥 BLOCK DOUBLE CLICK

    if (!eventName) return alert("No event started");
    if (!activeJudge) return alert("No judge selected");
    if (!car) return alert("Enter Car #");

    setSaving(true); // 🔥 LOCK BUTTON

    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    try {
      await addDoc(collection(db, "scores"), {
        eventName,
        car,
        judge: activeJudge,
        total,
        createdAt: new Date()
      });

      // 🔥 RESET IMMEDIATELY
      setCar("");
      setScores({});

    } catch (err) {
      console.error(err);
      alert("Error saving");
    }

    setSaving(false); // 🔥 UNLOCK AFTER COMPLETE
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

      <button 
        onClick={submit}
        disabled={saving} // 🔥 BUTTON DISABLED
      >
        {saving ? "Saving..." : "Submit"}
      </button>

      <button onClick={onLeaderboard}>Leaderboard</button>
      <button onClick={onBackHome}>Home</button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");

  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState(["", "", ""]);
  const [activeJudge, setActiveJudge] = useState("");

  const [entries, setEntries] = useState([]);

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

  if (screen === "score") {
    return (
      <ScoreScreen
        eventName={eventName}
        activeJudge={activeJudge}
        onBackHome={() => setScreen("home")}
        onLeaderboard={() => setScreen("leader")}
      />
    );
  }

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
