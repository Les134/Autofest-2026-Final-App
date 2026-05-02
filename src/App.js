import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

// ================= CONFIG =================
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= STYLES =================
const page = {
  background:"#111",
  color:"#fff",
  minHeight:"100vh",
  padding:20
};

const bigBtn = {
  width:"100%",
  padding:"18px",
  margin:"6px 0",
  background:"#222",
  color:"#fff",
  fontSize:"18px",
  border:"1px solid #555"
};

const scoreBtn = {
  background:"#222",
  color:"#fff",
  border:"1px solid #555",
  padding:"12px",
  margin:"4px",
  minWidth:"45px",
  fontSize:"16px"
};

const activeScore = {
  ...scoreBtn,
  background:"red"
};

const smallBtn = {
  padding:"10px 14px",
  margin:"4px",
  background:"#222",
  color:"#fff",
  border:"1px solid #555"
};

const activeSmall = {
  ...smallBtn,
  background:"red"
};

// ================= APP =================
export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");
  const [judgeName,setJudgeName] = useState("");
  const [entries,setEntries] = useState([]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  // ================= SCORE =================
  function ScoreScreen(){

    const [car,setCar] = useState("");
    const [gender,setGender] = useState("");
    const [carClass,setCarClass] = useState("");
    const [scores,setScores] = useState({});
    const [deductions,setDeductions] = useState({});
    const [tyres,setTyres] = useState({left:false,right:false});

    const submit = async () => {

      if(!eventName) return alert("Enter Event Name");
      if(!judgeName) return alert("Enter Judge Name");
      if(!car) return alert("Enter Car # or Rego");

      const base = Object.values(scores).reduce((a,b)=>a+b,0);
      const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
      const deds = Object.keys(deductions).filter(d=>deductions[d]).length*10;

      const total = base + tyreScore - deds;

      await addDoc(collection(db,"scores"),{
        eventName,
        judge: judgeName,
        car,
        gender,
        carClass,
        total,
        createdAt:new Date()
      });

      // RESET CLEAN
      setCar("");
      setGender("");
      setCarClass("");
      setScores({});
      setDeductions({});
      setTyres({left:false,right:false});
    };

    return(
      <div style={page}>

        <h2>{eventName}</h2>
        <h3>{judgeName}</h3>

        {/* TOP LINE */}
        <input
          style={{width:"100%",padding:"14px",fontSize:"18px",marginBottom:10}}
          placeholder="Car # / Rego"
          value={car}
          onChange={e=>setCar(e.target.value)}
        />

        {/* GENDER */}
        <div>
          <button style={gender==="Male"?activeSmall:smallBtn}
            onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?activeSmall:smallBtn}
            onClick={()=>setGender("Female")}>Female</button>
        </div>

        {/* CLASSES */}
        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?activeSmall:smallBtn}
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
                style={scores[cat]===i?activeScore:scoreBtn}
                onClick={()=>setScores(prev=>({...prev,[cat]:i}))}>
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* TYRES */}
        <div>
          <h4>Tyres (+5)</h4>
          <button style={tyres.left?activeSmall:smallBtn}
            onClick={()=>setTyres({...tyres,left:!tyres.left})}>
            Left
          </button>
          <button style={tyres.right?activeSmall:smallBtn}
            onClick={()=>setTyres({...tyres,right:!tyres.right})}>
            Right
          </button>
        </div>

        {/* DEDUCTIONS */}
        <div>
          <h4>Deductions (-10)</h4>
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?activeSmall:smallBtn}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button style={bigBtn} onClick={submit}>Submit Score</button>
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={page}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <input
          placeholder="Event Name"
          style={{width:"100%",padding:"14px",marginBottom:10}}
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <button style={bigBtn} onClick={()=>setScreen("judge")}>
          Judge Login
        </button>

        <button style={bigBtn} onClick={()=>setScreen("score")}>
          Resume Judging
        </button>

        <button style={bigBtn} onClick={()=>setScreen("leader")}>
          Leaderboard
        </button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judge"){
    return(
      <div style={page}>
        <h2>Judge Login</h2>

        <input
          placeholder="Event Name"
          style={{width:"100%",padding:"14px"}}
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <input
          placeholder="Judge Name"
          style={{width:"100%",padding:"14px"}}
          value={judgeName}
          onChange={e=>setJudgeName(e.target.value)}
        />

        <button style={bigBtn} onClick={()=>setScreen("score")}>
          Start Judging
        </button>

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  if(screen==="leader"){
    return(
      <div style={page}>
        <h2>Leaderboard</h2>

        {entries
          .filter(e=>e.eventName===eventName)
          .sort((a,b)=>b.total-a.total)
          .map((e,i)=>(
            <div key={i}>
              #{i+1} | {e.car} | {e.carClass} | {e.total}
            </div>
          ))}

        <button style={bigBtn} onClick={()=>window.print()}>
          Print
        </button>

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  if(screen==="score") return <ScoreScreen />;

  return <div style={page}>Loading...</div>;
}
