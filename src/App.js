import React, { useState, useEffect } from "react";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
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

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
  const [judges, setJudges] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [lockedEvents, setLockedEvents] = useState({});
  const [results, setResults] = useState([]);

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

  const classes = [
    "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"
  ];

  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{padding:"10px",margin:"4px",background:"#1c2333",color:"#fff"},
    active:{background:"red"},
    row:{display:"flex",flexWrap:"wrap",gap:"4px"},
    input:{padding:"10px",margin:"6px 0",width:"100%"},
    scoreBtn:{width:"36px",margin:"2px"}
  };

  useEffect(()=>{ loadScores(); },[]);

  async function loadScores(){
    const snap = await getDocs(collection(db,"scores"));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    setResults(list);
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  function totalScore(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    return base + tyres - deductions.length*10;
  }

  async function submitScore(){
    if(lockedEvents[selectedEvent]) return alert("Event Locked");

    const total = totalScore();

    await addDoc(collection(db,"scores"),{
      event:selectedEvent,
      judge:selectedJudge,
      car,
      gender,
      carClass,
      scores,
      tyres,
      deductions,
      total
    });

    await loadScores();

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres(0); setDeductions([]);
  }

  function printPage(){ window.print(); }

  function formatRow(r,i){
    const d = r.deductions?.length ? ` - (${r.deductions.join(", ")})` : "";
    return `#${i+1}${r.gender} | ${r.car} | ${r.carClass} | ${r.total}${d}`;
  }

  function getEventResults(){
    return results.filter(r=>r.event===selectedEvent);
  }

  function sortResults(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  // ---------- SCREENS ----------

  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>
        <button style={styles.button} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={styles.button} onClick={()=>setScreen("setup")}>Setup Event</button>
        <button style={styles.button} onClick={()=>setScreen("leaderboard")}>Leaderboards</button>
      </div>
    );
  }

  if(screen==="leaderboard"){
    const eventData = getEventResults();

    return(
      <div style={styles.container}>
        <h2>Leaderboards</h2>

        <button style={styles.button} onClick={printPage}>Print</button>

        <h3>Overall</h3>
        {sortResults(eventData).map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        <h3>Female</h3>
        {sortResults(eventData.filter(r=>r.gender==="F")).map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        {classes.map(c=>(
          <div key={c}>
            <h3>{c}</h3>
            {sortResults(eventData.filter(r=>r.carClass===c)).map((r,i)=>(
              <div key={i}>{formatRow(r,i)}</div>
            ))}
          </div>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // (rest of your working setup + scoring screens remain unchanged)

  return <div />;
}
