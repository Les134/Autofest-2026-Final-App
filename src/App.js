import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONFIG
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  const btn = {
    width:"100%",
    padding:"20px",
    margin:"10px 0",
    fontSize:"20px",
    background:"#1e1e1e",
    color:"#fff",
    border:"1px solid #444",
    borderRadius:"6px"
  };

  const scoreBtn = (active) => ({
    width:45,
    height:45,
    margin:4,
    fontSize:16,
    background: active ? "red" : "#333",
    color:"#fff",
    border:"none"
  });

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){

    if(!eventName) return alert("Enter event name");
    if(!judge) return alert("Select judge");
    if(!car) return alert("Enter car");

    const q = query(
      collection(db,"scores"),
      where("event","==",eventName),
      where("judge","==",judge),
      where("car","==",car)
    );

    const existing = await getDocs(q);
    if(!existing.empty){
      return alert("Already scored");
    }

    let total = Object.values(scores).reduce((a,b)=>a+b,0);
    let deductionCount = Object.values(deductions).filter(Boolean).length;
    let finalScore = total - (deductionCount * 10);

    await addDoc(collection(db,"scores"), {
      event:eventName,
      judge,
      car,
      gender,
      carClass,
      tyres,
      scores,
      deductions,
      finalScore,
      createdAt:new Date()
    });

    alert("Saved");

    setScores({});
    setDeductions({});
    setCar("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  // ================= HOME =================
  if(screen==="home"){
    return (
      <div style={{padding:20,background:"#111",minHeight:"100vh",color:"#fff"}}>
        <h1 style={{textAlign:"center"}}>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
          style={{padding:12,width:"100%",marginBottom:10}}
        />

        <button style={btn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={btn}>Resume Scoring</button>
        <button style={btn}>Leaderboard</button>
        <button style={btn}>Event Archive</button>
        <button style={btn}>Set Admin</button>
        <button style={btn}>Admin Login</button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judge"){
    return (
      <div style={{padding:20,background:"#111",color:"#fff"}}>
        <h2>Select Judge</h2>
        {[1,2,3,4,5,6].map(j=>(
          <button key={j} style={btn} onClick={()=>{setJudge(j);setScreen("score");}}>
            Judge {j}
          </button>
        ))}
      </div>
    );
  }

  // ================= SCORE SHEET =================
  return (
    <div style={{padding:20,background:"#111",color:"#fff"}}>

      <h2>{eventName}</h2>
      <h3>Judge {judge}</h3>

      <input
        placeholder="Car #"
        value={car}
        onChange={e=>setCar(e.target.value)}
        style={{padding:10,width:"100%",marginBottom:10}}
      />

      {/* Gender */}
      <div>
        <strong>Gender</strong><br/>
        <button style={btn} onClick={()=>setGender("Male")}>Male</button>
        <button style={btn} onClick={()=>setGender("Female")}>Female</button>
      </div>

      {/* Classes */}
      <div>
        <strong>Class</strong>
        {classes.map(c=>(
          <button key={c} style={btn} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      {/* Tyres */}
      <div>
        <strong>Blown Tyres (+5)</strong>
        <button style={btn} onClick={()=>setTyres("Left")}>Left</button>
        <button style={btn} onClick={()=>setTyres("Right")}>Right</button>
      </div>

      {/* Scores */}
      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {[...Array(21)].map((_,i)=>(
              <button
                key={i}
                onClick={()=>setScore(cat,i)}
                style={scoreBtn(scores[cat]===i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Deductions */}
      <div>
        <strong>Deductions (-10)</strong>
        {deductionsList.map(d=>(
          <button
            key={d}
            onClick={()=>toggleDeduction(d)}
            style={{
              ...btn,
              background: deductions[d] ? "red" : "#333"
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <button style={btn} onClick={submit}>Submit Score</button>
      <button style={btn} onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}
