import React, { useState, useEffect } from "react";

// FIREBASE (INLINE — NO EXTERNAL FILE)
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCSCBgg7bR1FYMNqOZGJQwXDqe79eXyAAM",
  authDomain: "autofest-burnout-judging.firebaseapp.com",
  projectId: "autofest-burnout-judging",
  storageBucket: "autofest-burnout-judging.firebasestorage.app",
  messagingSenderId: "453347070025",
  appId: "1:453347070025:web:0567bc51df8a0b49b46f98"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {

  const ADMIN_PASSWORD = "admin123";

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState([]);

  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [newEvent, setNewEvent] = useState("");
  const [newJudge, setNewJudge] = useState("");

  // LOAD EVENTS
  async function loadEvents() {
    const snap = await getDocs(collection(db, "events"));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    setEvents(list);
  }

  // LOAD JUDGES FROM FIREBASE
  async function loadJudges(eventId) {
    if (!eventId) return;
    const ref = doc(db, "events", eventId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setJudges(snap.data().judges || []);
    } else {
      setJudges([]);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

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
          Admin Setup
        </button>
      </div>
    );
  }

  // ================= ADMIN =================
  if (screen === "admin") {
    return (
      <div style={styles.container}>

        <h2>Admin Setup</h2>

        <input
          style={styles.input}
          placeholder="Password"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
        />

        <button style={styles.button} onClick={() => {
          if (adminPass === ADMIN_PASSWORD) {
            setIsAdmin(true);
          } else {
            alert("Wrong password");
          }
        }}>
          Login
        </button>

        {isAdmin && (
          <>
            <h3>Create Event</h3>

            <input
              style={styles.input}
              placeholder="Event Name"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
            />

            <button style={styles.button} onClick={async () => {
              const clean = newEvent.trim();
              if (!clean) return alert("Enter event name");

              await setDoc(doc(db, "events", clean), {
                judges: []
              });

              setEventName(clean);
              setNewEvent("");
              await loadEvents();
              await loadJudges(clean);
            }}>
              Create Event
            </button>

            <h3>Select Event</h3>

            {events.map(e => (
              <button
                key={e.id}
                style={styles.button}
                onClick={() => {
                  setEventName(e.id);
                  loadJudges(e.id);
                }}
              >
                {e.id}
              </button>
            ))}

            <h3>Add Judge (max 6)</h3>

            <input
              style={styles.input}
              placeholder="Judge Name"
              value={newJudge}
              onChange={(e) => setNewJudge(e.target.value)}
            />

            <button style={styles.button} onClick={async () => {
              if (!eventName) return alert("Select event first");
              if (!newJudge.trim()) return alert("Enter judge name");

              const ref = doc(db, "events", eventName);
              const snap = await getDoc(ref);

              if (!snap.exists()) return alert("Event not found");

              const current = snap.data().judges || [];

              if (current.length >= 6) {
                return alert("Max 6 judges");
              }

              await updateDoc(ref, {
                judges: [...current, newJudge.trim()]
              });

              setNewJudge("");
              await loadJudges(eventName);
            }}>
              Add Judge
            </button>

            <h4>Current Judges:</h4>
            {judges.map(j => (
              <div key={j}>{j}</div>
            ))}

            <h3>Delete Event</h3>

            <button style={styles.button} onClick={async () => {
              if (!eventName) return alert("Select event");

              if (!window.confirm("Delete this event?")) return;

              await deleteDoc(doc(db, "events", eventName));

              setEventName("");
              setJudges([]);
              await loadEvents();
            }}>
              Delete Selected Event
            </button>
          </>
        )}

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

        {events.map(e => (
          <button
            key={e.id}
            style={styles.button}
            onClick={() => {
              setEventName(e.id);
              loadJudges(e.id);
            }}
          >
            {e.id}
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

    
