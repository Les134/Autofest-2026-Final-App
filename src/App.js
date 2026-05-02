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
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary","Female"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= STYLES =================
const page = {
  background:"#111",
  color:"#fff",
  minHeight:"100vh",
  padding:20
};

const row = { marginBottom:15 };

const scoreBtn = {
  background:"#222",
  color:"#fff",
  border:"1px solid #555",
  padding:"8px",
  margin:"2px",
  minWidth:"36px"
};

const activeScore = {
  ...scoreBtn,
  background:"red",
  border:"1px solid red"
};

const smallBtn = {
  background:"#222",
  color:"#fff",
  border:"1px solid #555",
  padding:"8px 12px",
  margin:"2px"
};

const activeSmall = {
  ...smallBtn,
  background:"red"
};

const bigBtn = {
  width:"100%",
  padding:"16px",
  marginTop:10,
  background:"#222",
  color:"#fff",
  border:"1px solid #555"
};

// ================= APP =================
export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");
  const [activeJudge,setActiveJudge] = useState("");
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
    const [carClass,setCarClass] = useState("");
    const [scores,setScores] = useState({});
    const [tyres,setTyres] = useState({left:false,right:false});
    const [deductions,setDeductions] = useState({});
    const [saving,setSaving] = useState(false);

    const submit = async () => {

      if (saving) return;
      if (!car) return alert("Enter Car #");

      setSaving(true);

      const base = Object.values(scores).reduce((a,b)=>a+b,0);
      const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
      const activeDeds = Object.keys(deductions).filter(d=>deductions[d]);
      const deductionTotal = activeDeds.length * 10;

      const total = base + tyreScore - deductionTotal;

      await addDoc(collection(db,"scores"),{
        eventName,
        car,
        carClass,
        judge: activeJudge,
        total,
        deductions: activeDeds,
        createdAt: new Date()
      });

      // 🔥 RESET
      setCar("");
      setCarClass("");
      setScores({});
      setTyres({left:false,right:false});
      setDeductions({});
      setSaving(false);
    };

    return(
      <div style={page}>

        <h2>{eventName}</h2>
        <h3>{activeJudge}</h3>

        <input
          style={{width:"100%",padding:10,marginBottom:10}}
          placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        {/* CLASSES */}
        <div style={row}>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c ? activeSmall : smallBtn}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* SCORES */}
        {categories.map(cat=>(
          <div key={cat} style={row}>
            <div>{cat}</div>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={scores[cat]===i?activeScore:scoreBtn}
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* TYRES INLINE */}
        <div style={row}>
          Blown Tyres (+5)<br/>
          <button style={tyres.left?activeSmall:smallBtn}
            onClick={()=>setTyres({...tyres,left:!tyres.left})}>
            Left
          </button>
          <button style={tyres.right?activeSmall:smallBtn}
            onClick={()=>setTyres({...tyres,right:!tyres.right})}>
            Right
          </button>
        </div>

        {/* DEDUCTIONS INLINE */}
        <div style={row}>
          Deductions (-10)<br/>
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?activeSmall:smallBtn}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button style={bigBtn} onClick={submit}>
          {saving ? "Saving..." : "Submit Score"}
        </button>

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={page}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={bigBtn} onClick={()=>setScreen("judge")}>
          Judge Login
        </button>

        <button style={bigBtn} onClick={()=>setScreen("leader")}>
          Leaderboard
        </button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judge"){
    const judges = ["Judge 1","Judge 2","Judge 3","Judge 4"];

    return(
      <div style={page}>
        <h2>Judge Login</h2>

        {judges.map(j=>(
          <button key={j}
            style={bigBtn}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Back
        </button>
      </div>
    );
  }

  // ================= SCORE =================
  if(screen==="score"){
    return <ScoreScreen />;
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
              #{i+1} | Car {e.car} | {e.carClass} | {e.total}
            </div>
          ))}

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Back
        </button>
      </div>
    );
  }

  return <div style={page}>Loading...</div>;
}
