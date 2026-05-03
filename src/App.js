import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState({});
  const [eventName, setEventName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [judges, setJudges] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [newJudge, setNewJudge] = useState("");

  const styles = {
    container: {
      background: "#000",
      color: "#fff",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial"
    },
    button: {
      width: "100%",
      padding: "14px",
      margin: "8px 0",
      fontSize: "16px",
      background: "#1c2333",
      color: "#fff",
      border: "1px solid #333"
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "8px 0",
      fontSize: "16px"
    }
  };

  // ================= HOME =================
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={() => setScreen("judge")}>
          Judge Login
        </button>

        <button style={styles.button} onClick={() => setScreen("setup")}>
          Setup Event
        </button>
      </div>
    );
  }

  // ================= SETUP =================
  if (screen === "setup") {
    return (
      <div style={styles.container}>

        <h2>Setup Event</h2>

        <input
          style={styles.input}
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={() => {
            const name = eventName.trim();
            if (!name) return alert("Enter event name");

            setEvents(prev => ({
              ...prev,
              [name]: []
            }));

            setSelectedEvent(name);
            setJudges([]);
            setEventName("");
          }}
        >
          Create Event
        </button>

        <h3>Select Event</h3>

        {Object.keys(events).map(e => (
          <button
            key={e}
            style={styles.button}
            onClick={() => {
              setSelectedEvent(e);
              setJudges(events[e]);
            }}
          >
            {e}
          </button>
        ))}

        <h3>Add Judges (max 6)</h3>

        <input
          style={styles.input}
          placeholder="Judge Name"
          value={newJudge}
          onChange={(e) => setNewJudge(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={() => {
            if (!selectedEvent) return alert("Select event first");

            const name = newJudge.trim();
            if (!name) return alert("Enter judge name");

            if (judges.length >= 6) return alert("Max 6 judges");

            const updated = [...judges, name];

            setEvents(prev => ({
              ...prev,
              [selectedEvent]: updated
            }));

            setJudges(updated);
            setNewJudge("");
          }}
        >
          Add Judge
        </button>

        <h4>Current Judges:</h4>
        {judges.map(j => (
          <div key={j}>{j}</div>
        ))}

        <button style={styles.button} onClick={() => setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if (screen === "judge") {
    return (
      <div style={styles.container}>

        <h2>Select Event</h2>

        {Object.keys(events).map(e => (
          <button
            key={e}
            style={styles.button}
            onClick={() => {
              setSelectedEvent(e);
              setJudges(events[e]);
            }}
          >
            {e}
          </button>
        ))}

        <h3>Select Judge</h3>

        {judges.map(j => (
          <button
            key={j}
            style={styles.button}
            onClick={() => {
              setSelectedJudge(j);
              setScreen("judgeScreen");
            }}
          >
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={() => setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // ================= JUDGE SCREEN =================
  if (screen === "judgeScreen") {
    return (
      <div style={styles.container}>

        <h2>Event: {selectedEvent}</h2>
        <h3>Judge: {selectedJudge}</h3>

        <p>Ready to start scoring...</p>

        <button
          style={styles.button}
          onClick={() => setScreen("judge")}
        >
          Back
        </button>
      </div>
    );
  }

  return null;
}
    
