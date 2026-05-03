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
    container:{background:"#0b0f1a",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{width:"100%",padding:"14px",margin:"6px 0",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    active:{background:"#ff0000"},
    row:{display:"flex",gap:"6px"},
    scoreRow:{display:"flex",overflowX:"auto"},
    scoreBtn:{padding:"14px",margin:"3px",minWidth:"42px",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    input:{width:"100%",padding:"10px",margin:"6px 0",background:"#111827",border:"1px solid #2f3a55",color:"#fff"}
  };

  function buildLeaderboard(filter = () => true) {
    return scoresDB
      .filter(s => s.event === eventName)
      .filter(filter)
      .sort((a,b)=>b.total - a.total);
  }

  function formatRow(s, i){
    const g = s.gender === "Female" ? "F" : "M";
    const base = Object.values(s.scores||{}).reduce((a,b)=>a+b,0) + (s.tyres||0);
    const d = s.deductions?.length ? ` - (${s.deductions.join(", ")})` : "";
    return `#${i+1}${g} | ${s.car} | ${s.carClass} | ${base}${d} ${s.total}`;
  }

  function printPage(){ window.print(); }

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>
        <button style={styles.button} onClick={()=>goTo("judgeLogin")}>Judge Login</button>
        <button style={styles.button} onClick={()=>goTo("score")}>Resume Judging</button>
        <button style={styles.button} onClick={()=>goTo("leaderboard")}>Leaderboard</button>
        <button style={styles.button} onClick={()=>goTo("classLeaderboard")}>Class Leaderboard</button>
        <button style={styles.button} onClick={()=>goTo("femaleLeaderboard")}>Female</button>
      </div>
    );
  }

  // JUDGE LOGIN + ADMIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>

        <h2>Judge Login</h2>

        <input style={styles.input} placeholder="Admin Password"
          value={adminPass} onChange={e=>setAdminPass(e.target.value)} />

        <button style={styles.button} onClick={()=> {
          if(adminPass === ADMIN_PASSWORD) setIsAdmin(true);
        }}>
          Admin Login
        </button>

        {isAdmin && (
          <>
            <h3>Create Event</h3>
            <input style={styles.input} value={newEvent}
              onChange={e=>setNewEvent(e.target.value)} />

            <button style={styles.button} onClick={async ()=>{
              await setDoc(doc(db,"events",newEvent),{ judges:[], locked:false });
              loadEvents();
            }}>Add Event</button>

            <h3>Add Judge</h3>
            <input style={styles.input} value={newJudge}
              onChange={e=>setNewJudge(e.target.value)} />

            <button style={styles.button} onClick={async ()=>{
              const ev = events.find(e=>e.id===eventName);
              await updateDoc(doc(db,"events",eventName),{
                judges:[...(ev?.judges||[]), newJudge]
              });
              loadEvents();
            }}>Add Judge</button>
          </>
        )}

        <h3>Select Event</h3>

        {events.map(e=>(
          <div key={e.id}>
            <button style={styles.button} onClick={()=>{
              setEventName(e.id);
              setJudges(e.judges||[]);
            }}>
              {e.id} {e.locked && "🔒"}
            </button>

            {isAdmin && (
              <>
                <button onClick={()=>updateDoc(doc(db,"events",e.id),{locked:true})}>Lock</button>
                <button onClick={()=>deleteDoc(doc(db,"events",e.id))}>Delete</button>
              </>
            )}
          </div>
        ))}

        <h3>Select Judge</h3>

        {judges.map(j=>(
          <button key={j} style={styles.button}
            onClick={()=>{setJudge(j);goTo("score");}}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // SCORE (UNCHANGED LAYOUT)
  if (screen === "score") {
    return (
      <div style={styles.container}>
        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input style={styles.input} placeholder="Car" value={car} onChange={e=>setCar(e.target.value)} />

        <div style={styles.row}>
          <button style={{...styles.button,...(gender==="Male"?styles.active:{})}} onClick={()=>setGender("Male")}>Male</button>
          <button style={{...styles.button,...(gender==="Female"?styles.active:{})}} onClick={()=>setGender("Female")}>Female</button>
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <p>{cat}</p>
            <div style={styles.scoreRow}>
              {[...Array(20)].map((_,i)=>(
                <button key={i}
                  style={{...styles.scoreBtn,...(scores[cat]===i+1?styles.active:{})}}
                  onClick={()=>setScores(prev=>({...prev,[cat]:i+1}))}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button style={styles.button} onClick={()=>setTyres(t=>t+5)}>Tyre +5</button>

        <h3>Total: {Object.values(scores).reduce((a,b)=>a+b,0) + tyres}</h3>

        <button style={styles.button} onClick={async ()=>{
          const total = Object.values(scores).reduce((a,b)=>a+b,0) + tyres;

          await addDoc(collection(db,"scores"),{
            event:eventName,
            judge,
            car,
            gender,
            carClass,
            scores,
            tyres,
            deductions,
            total
          });

          setScores({});
          setTyres(0);
          setCar("");
          setGender("");
        }}>
          Submit
        </button>

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if (screen === "leaderboard") {
    const data = buildLeaderboard();
    return (
      <div style={styles.container}>
        <h2>Leaderboard</h2>
        <button onClick={printPage}>Print</button>
        {data.map((s,i)=>(<p key={i}>{formatRow(s,i)}</p>))}
      </div>
    );
  }

  return null;
}
    
