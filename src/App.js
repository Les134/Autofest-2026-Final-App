import React, { useState } from "react";
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
  const [eventLocked,setEventLocked] = useState(false);

  const [judgeNames,setJudgeNames] = useState(["","","","","",""]);
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
    border:"1px solid #444"
  };

  const scoreBtn = (active) => ({
    width:45,
    height:45,
    margin:4,
    background: active ? "red" : "#333",
    color:"#fff"
  });

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){

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
  }

  // ================= HOME =================
  if(screen==="home"){
    return (
      <div style={{padding:20,background:"#111",color:"#fff"}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={btn} onClick={()=>setScreen("eventSetup")}>
          Event Login / Setup
        </button>

        <button style={btn} onClick={()=>setScreen("judgeLogin")}>
          Judge Login
        </button>
      </div>
    );
  }

  // ================= EVENT SETUP =================
  if(screen==="eventSetup"){
    return (
      <div style={{padding:20,background:"#111",color:"#fff"}}>

        <h2>Event Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
          style={{width:"100%",padding:10}}
        />

        <h3>Judge Names</h3>

        {judgeNames.map((name,i)=>(
          <input
            key={i}
            placeholder={`Judge ${i+1}`}
            value={name}
            onChange={e=>{
              let copy=[...judgeNames];
              copy[i]=e.target.value;
              setJudgeNames(copy);
            }}
            style={{width:"100%",padding:10,marginTop:5}}
          />
        ))}

        <button
          style={btn}
          onClick={()=>{
            if(!eventName) return alert("Enter event name");
            setEventLocked(true);
            setScreen("home");
          }}
        >
          LOCK EVENT
        </button>

      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judgeLogin"){

    if(!eventLocked){
      return (
        <div style={{padding:20,color:"#fff"}}>
          <h2>No Event Started</h2>
          <button style={btn} onClick={()=>setScreen("eventSetup")}>
            Setup Event First
          </button>
        </div>
      );
    }

    return (
      <div style={{padding:20,background:"#111",color:"#fff"}}>
        <h2>Select Judge</h2>

        {judgeNames.map((name,i)=>(
          name && (
            <button
              key={i}
              style={btn}
              onClick={()=>{setJudge(name);setScreen("score");}}
            >
              {name}
            </button>
          )
        ))}

      </div>
    );
  }

  // ================= SCORE =================
  return (
    <div style={{padding:20,background:"#111",color:"#fff"}}>

      <h2>{eventName}</h2>
      <h3>{judge}</h3>

      <input
        placeholder="Car #"
        value={car}
        onChange={e=>setCar(e.target.value)}
      />

      <div>
        <button style={btn} onClick={()=>setGender("Male")}>Male</button>
        <button style={btn} onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div>
        {classes.map(c=>(
          <button key={c} style={btn} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      <div>
        <button style={btn} onClick={()=>setTyres("Left")}>Left</button>
        <button style={btn} onClick={()=>setTyres("Right")}>Right</button>
      </div>

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong>
          {[...Array(21)].map((_,i)=>(
            <button key={i} style={scoreBtn(scores[cat]===i)} onClick={()=>setScore(cat,i)}>
              {i}
            </button>
          ))}
        </div>
      ))}

      <div>
        {deductionsList.map(d=>(
          <button key={d} style={btn} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button style={btn} onClick={submit}>Submit Score</button>
    </div>
  );
}
