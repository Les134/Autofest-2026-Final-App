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

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= DARK THEME =================
const container = {
  background: "#111",
  color: "#fff",
  minHeight: "100vh",
  padding: 20
};

const row = {
  marginBottom: 20
};

const scoreBtn = {
  background: "#222",
  color: "#fff",
  border: "1px solid #555",
  padding: "10px 12px",
  margin: "3px",
  minWidth: "40px",
  borderRadius: "4px"
};

const activeScore = {
  ...scoreBtn,
  background: "red",
  color: "#fff",
  border: "1px solid red"
};

const wideBtn = {
  width: "100%",
  padding: "16px",
  marginTop: 10,
  background: "#222",
  color: "#fff",
  border: "1px solid #555",
  fontSize: "16px"
};

const activeWide = {
  ...wideBtn,
  background: "red",
  border: "1px solid red"
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
        judge: activeJudge,
        total,
        deductions: activeDeds,
        createdAt: new Date()
      });

      // 🔥 CLEAN RESET (WORKING)
      setCar("");
      setScores({});
      setTyres({left:false,right:false});
      setDeductions({});
      setSaving(false);
    };

    return(
      <div style={container}>

        <h2>{eventName}</h2>
        <h3>{activeJudge}</h3>

        <input
          style={{width:"100%",padding:12,marginBottom:15}}
          placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        {categories.map(cat=>(
          <div key={cat} style={row}>
            <div>{cat}</div>

            {Array.from({length:21},(_,i)=>(
              <button
                key={i}
                style={scores[cat]===i ? activeScore : scoreBtn}
                onClick={()=>setScores({...scores,[cat]:i})}
              >
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* TYRES */}
        <div style={row}>
          <div>Blown Tyres (+5)</div>

          <button
            style={tyres.left ? activeWide : wideBtn}
            onClick={()=>setTyres({...tyres,left:!tyres.left})}
          >
            Left
          </button>

          <button
            style={tyres.right ? activeWide : wideBtn}
            onClick={()=>setTyres({...tyres,right:!tyres.right})}
          >
            Right
          </button>
        </div>

        {/* DEDUCTIONS */}
        <div style={row}>
          <div>Deductions (-10)</div>

          {deductionsList.map(d=>(
            <button
              key={d}
              style={deductions[d] ? activeWide : wideBtn}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}
            >
              {d}
            </button>
          ))}
        </div>

        <button style={wideBtn} onClick={submit}>
          {saving ? "Saving..." : "Submit Score"}
        </button>

        <button style={wideBtn} onClick={()=>setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={container}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={wideBtn} onClick={()=>setScreen("score")}>
          Start Scoring
        </button>

        <button style={wideBtn} onClick={()=>setScreen("leader")}>
          Leaderboard
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
      <div style={container}>
        <h2>Leaderboard</h2>

        {entries
          .filter(e=>e.eventName===eventName)
          .sort((a,b)=>b.total-a.total)
          .map((e,i)=>(
            <div key={i}>
              #{i+1} | Car {e.car} | {e.total}
            </div>
          ))}

        <button style={wideBtn} onClick={()=>setScreen("home")}>
          Back
        </button>
      </div>
    );
  }

  return <div style={container}>Loading...</div>;
}
