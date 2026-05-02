import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

// ================= CONFIG =================
const classes = [
  "V8 Pro",
  "V8 N/A",
  "6 Cyl Pro",
  "6 Cyl N/A",
  "4 Cyl / Rotary"
];

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const deductionsList = ["Reversing", "Stopping", "Barrier", "Fire"];

// ================= STYLE =================
const page = { background:"#111", color:"#fff", minHeight:"100vh", padding:20 };
const bigBtn = { width:"100%", padding:18, margin:"6px 0", background:"#222", color:"#fff" };

// 🔥 UPDATED BUTTON SIZES (ONLY CHANGE)
const scoreBtn = {
  padding: "14px",
  margin: "4px",
  minWidth: "50px",
  fontSize: "16px",
  background: "#222",
  color: "#fff",
  border: "1px solid #555"
};

const selectBtn = {
  padding: "12px 16px",
  margin: "4px",
  fontSize: "16px",
  background: "#222",
  color: "#fff",
  border: "1px solid #555"
};

const active = {
  background: "red",
  color: "#fff"
};

// ================= APP =================
export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");
  const [judgeName,setJudgeName] = useState("");
  const [eventLocked,setEventLocked] = useState(false);
  const [entries,setEntries] = useState([]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  const loadEvent = async name => {
    if(!name) return;
    const ref = doc(db,"events",name);
    const snap = await getDoc(ref);
    setEventLocked(snap.exists() ? snap.data().locked : false);
  };

  const lockEvent = async () => {
    await setDoc(doc(db,"events",eventName),{
      locked:true,
      createdAt:new Date()
    });
    setEventLocked(true);
  };

  // ================= SCORE =================
  function ScoreScreen(){

    const [car,setCar] = useState("");
    const [gender,setGender] = useState("");
    const [carClass,setCarClass] = useState("");
    const [scores,setScores] = useState({});
    const [deductions,setDeductions] = useState({});
    const [tyres,setTyres] = useState({left:false,right:false});

    const submit = async () => {

      const base = Object.values(scores).reduce((a,b)=>a+b,0);
      const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
      const activeDeds = Object.keys(deductions).filter(d=>deductions[d]);
      const deductionTotal = activeDeds.length * 10;

      const total = base + tyreScore - deductionTotal;

      await addDoc(collection(db,"scores"),{
        eventName,
        judge: judgeName,
        car,
        carClass,
        gender,
        base,
        deductions: activeDeds,
        total,
        createdAt:new Date()
      });

      setCar("");
      setScores({});
      setDeductions({});
      setTyres({left:false,right:false});
    };

    return(
      <div style={page}>
        <h2>{eventName}</h2>
        <h3>{judgeName}</h3>

        <input
          placeholder="Car # / Rego"
          value={car}
          onChange={e=>setCar(e.target.value)}
          style={{width:"100%",padding:14,fontSize:18,marginBottom:10}}
        />

        {/* GENDER */}
        <div>
          <button
            style={{...selectBtn, ...(gender==="Male"?active:{})}}
            onClick={()=>setGender("Male")}
          >Male</button>

          <button
            style={{...selectBtn, ...(gender==="Female"?active:{})}}
            onClick={()=>setGender("Female")}
          >Female</button>
        </div>

        {/* CLASSES */}
        <div>
          {classes.map(c=>(
            <button key={c}
              style={{...selectBtn, ...(carClass===c?active:{})}}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* SCORES */}
        {categories.map(cat=>(
          <div key={cat}>
            <h4>{cat}</h4>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={{...scoreBtn, ...(scores[cat]===i?active:{})}}
                onClick={()=>setScores(prev=>({...prev,[cat]:i}))}>
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* 🔥 TYRES (RESTORED) */}
        <div>
          <h4>Tyres (+5)</h4>
          <button
            style={{...selectBtn, ...(tyres.left?active:{})}}
            onClick={()=>setTyres({...tyres,left:!tyres.left})}
          >Left</button>

          <button
            style={{...selectBtn, ...(tyres.right?active:{})}}
            onClick={()=>setTyres({...tyres,right:!tyres.right})}
          >Right</button>
        </div>

        {/* 🔥 DEDUCTIONS (RESTORED) */}
        <div>
          <h4>Deductions (-10)</h4>
          {deductionsList.map(d=>(
            <button key={d}
              style={{...selectBtn, ...(deductions[d]?active:{})}}
              onClick={()=>setDeductions(prev=>({...prev,[d]:!prev[d]}))}>
              {d}
            </button>
          ))}
        </div>

        <button style={bigBtn} onClick={submit}>Submit</button>
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={page}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={bigBtn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={bigBtn} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={bigBtn} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={bigBtn} onClick={()=>setScreen("class")}>Class Leaderboard</button>
        <button style={bigBtn} onClick={()=>setScreen("female")}>Female Overall</button>
        <button style={bigBtn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={bigBtn} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
      </div>
    );
  }

  if(screen==="judge"){
    return(
      <div style={page}>
        <input placeholder="Event Name" value={eventName} onChange={async e=>{
          setEventName(e.target.value);
          await loadEvent(e.target.value);
        }} />

        <input placeholder="Judge Name" value={judgeName} onChange={e=>setJudgeName(e.target.value)} />

        {!eventLocked && <button style={bigBtn} onClick={lockEvent}>Lock Event</button>}

        <button style={bigBtn} onClick={()=>setScreen("score")}>Start / Resume</button>
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="score") return <ScoreScreen />;

  return <div style={page}>Loading...</div>;
}
 
