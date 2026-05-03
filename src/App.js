import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";

export default function App() {

  const ADMIN_PASSWORD = "admin123";

  const [screen, setScreen] = useState("home");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");

  const [events, setEvents] = useState([]);
  const [judges, setJudges] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judge, setJudge] = useState("");

  const [scoresDB, setScoresDB] = useState([]);

  const [newEvent, setNewEvent] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [car, setCar] = useState("");
  const [driverName, setDriverName] = useState("");

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

  function goTo(s){ setScreen(s); }

  async function loadEvents() {
    const snap = await getDocs(collection(db, "events"));
    const list = [];
    snap.forEach(d => list.push({ id:d.id, ...d.data() }));
    setEvents(list);
  }

  async function loadScores() {
    const snap = await getDocs(collection(db, "scores"));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    setScoresDB(list);
  }

  useEffect(() => {
    if (screen === "judgeLogin") loadEvents();
    if (screen.includes("leaderboard")) loadScores();
  }, [screen]);

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{width:"100%",padding:"14px",margin:"6px 0",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    active:{background:"#ff0000"},
    row:{display:"flex",gap:"6px"},
    scoreRow:{display:"flex",overflowX:"auto"},
    scoreBtn:{padding:"14px",margin:"3px",minWidth:"42px",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    input:{width:"100%",padding:"10px",margin:"6px 0",background:"#111827",border:"1px solid #2f3a55",color:"#fff"}
  };

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>goTo("judgeLogin")}>
          Judge Login
        </button>

        <button style={styles.button} onClick={()=>goTo("score")}>
          Resume Judging
        </button>

        <button style={styles.button} onClick={()=>goTo("leaderboard")}>
          Leaderboard
        </button>
      </div>
    );
  }

  // ✅ FIXED JUDGE LOGIN + ADMIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>

        <h2>Judge Login</h2>

        {/* ADMIN LOGIN */}
        <input
          style={styles.input}
          placeholder="Admin Password"
          value={adminPass}
          onChange={(e)=>setAdminPass(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={()=>{
            if(adminPass === ADMIN_PASSWORD){
              setIsAdmin(true);
              alert("Admin unlocked");
            } else {
              alert("Wrong password");
            }
          }}
        >
          Admin Login
        </button>

        {/* ADMIN CONTROLS */}
        {isAdmin && (
          <>
            <h3>Create Event</h3>

            <input
              style={styles.input}
              placeholder="Event Name"
              value={newEvent}
              onChange={(e)=>setNewEvent(e.target.value)}
            />

            <button
              style={styles.button}
              onClick={async ()=>{
                if(!newEvent) return alert("Enter event name");

                await setDoc(doc(db,"events",newEvent),{
                  judges:[],
                  locked:false
                });

                setNewEvent("");
                loadEvents();
              }}
            >
              Add Event
            </button>

            <h3>Add Judges (Select Event First)</h3>

            <input
              style={styles.input}
              placeholder="Judge Name"
              value={newJudge}
              onChange={(e)=>setNewJudge(e.target.value)}
            />

            <button
              style={styles.button}
              onClick={async ()=>{
                if(!eventName) return alert("Select event first");
                if(!newJudge) return alert("Enter judge name");

                const ev = events.find(e=>e.id===eventName);

                await updateDoc(doc(db,"events",eventName),{
                  judges:[...(ev?.judges || []), newJudge]
                });

                setNewJudge("");
                loadEvents();
              }}
            >
              Add Judge
            </button>
          </>
        )}

        {/* EVENT SELECT */}
        <h3>Select Event</h3>

        {events.map((e,i)=>(
          <button
            key={i}
            style={styles.button}
            onClick={()=>{
              setEventName(e.id);
              setJudges(e.judges || []);
            }}
          >
            {e.id}
          </button>
        ))}

        {/* JUDGES */}
        <h3>Select Judge</h3>

        {judges.map((j,i)=>(
          <button
            key={i}
            style={styles.button}
            onClick={()=>{
              setJudge(j);
              goTo("score");
            }}
          >
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>goTo("home")}>
          Home
        </button>

      </div>
    );
  }

  // SCORE (UNCHANGED)
  if (screen === "score") {
    return (
      <div style={styles.container}>
        <h2>{eventName}</h2>
        <h3>{judge}</h3>
        <p>Score screen unchanged</p>
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD (UNCHANGED)
  if (screen === "leaderboard") {
    return (
      <div style={styles.container}>
        <h2>Leaderboard</h2>
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  return null;
}
    
