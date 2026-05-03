import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState({});
  const [eventName, setEventName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [judges, setJudges] = useState([]);

  const [newJudge, setNewJudge] = useState("");

  const styles = {
    container: {
      background: "#000",
      color: "#fff",
      minHeight: "100vh",
      padding: "15px",
      fontFamily: "Arial"
    },
    button: {
      width: "100%",
      padding: "14px",
      margin: "6px 0",
      fontSize: "16px"
    },
    input: {
      width: "100%",
      padding: "10px",
      margin: "6px 0"
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

        <button style={styles.button} onClick={() => setScreen("admin")}>
          Setup Event
        </button>
      </div>
    );
  }

  // ================= ADMIN =================
  if (screen === "admin") {
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
            if (!eventName.trim()) return alert("Enter event name");

            setEvents({
              ...events,
              [eventName]: []
            });

            setSelectedEvent(eventName);
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
            if (!newJudge.trim()) return alert("Enter judge name");

            if (judges.length >= 6) {
              return alert("Max 6 judges");
            }

            const updated = [...judges, newJudge];

            setEvents({
              ...events,
              [selectedEvent]: updated
            });

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
          <button key={j} style={styles.button}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={() => setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return null;
}
    
