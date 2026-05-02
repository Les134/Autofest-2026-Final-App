import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

// ================= CONFIG =================
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary","Female"];
const categories = ["Instant","Volume","Constant","Driver"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= STYLE =================
const page = { background:"#111", color:"#fff", minHeight:"100vh", padding:20 };
const btn = { width:"100%", padding:16, margin:5, background:"#222", color:"#fff" };
const active = { ...btn, background:"red" };
const small = { padding:8, margin:2, background:"#222", color:"#fff" };
const activeSmall = { ...small, background:"red" };

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
    const [carClass,setCarClass] = useState("");
    const [gender,setGender] = useState("");
    const [scores,setScores] = useState({});
    const [deductions,setDeductions] = useState({});
    const [tyres,setTyres] = useState({left:false,right:false});

    const submit = async () => {

      if(!eventName) return alert("Enter Event Name");
      if(!judgeName) return alert("Enter Judge Name");
      if(!car) return alert("Enter Car #");

      const base = Object.values(scores).reduce((a,b)=>a+b,0);
      const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
      const deds = Object.keys(deductions).filter(d=>deductions[d]).length*10;

      const total = base + tyreScore - deds;

      await addDoc(collection(db,"scores"),{
        eventName,
        judge: judgeName,
        car,
        carClass,
        gender,
        total,
        deductions:Object.keys(deductions).filter(d=>deductions[d]),
        createdAt:new Date()
      });

      setCar(""); setScores({}); setDeductions({}); setTyres({left:false,right:false});
    };

    return(
      <div style={page}>
        <h2>{eventName}</h2>
        <h3>{judgeName}</h3>

        <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />

        <div>
          <button style={gender==="Male"?activeSmall:small} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?activeSmall:small} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?activeSmall:small}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            {cat}
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={scores[cat]===i?activeSmall:small}
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <div>
          Tyres
          <button style={tyres.left?activeSmall:small} onClick={()=>setTyres({...tyres,left:!tyres.left})}>L</button>
          <button style={tyres.right?activeSmall:small} onClick={()=>setTyres({...tyres,right:!tyres.right})}>R</button>
        </div>

        <div>
          Deductions
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?activeSmall:small}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button style={btn} onClick={submit}>Submit</button>
        <button style={btn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  function Leaderboard({filter}){

    const filtered = entries.filter(e=>e.eventName===eventName);

    let list = [...filtered].sort((a,b)=>b.total-a.total);

    if(filter==="female") list = list.filter(e=>e.gender==="Female");

    if(filter==="top150") list = list.slice(0,150);
    if(filter==="top30") list = list.slice(0,30);

    if(filter==="class"){
      return(
        <div style={page}>
          {classes.map(cls=>(
            <div key={cls}>
              <h3>{cls}</h3>
              {list.filter(e=>e.carClass===cls).map((e,i)=>(
                <div key={i}>#{i+1} {e.car} {e.total}</div>
              ))}
            </div>
          ))}
          <button style={btn} onClick={()=>window.print()}>Print</button>
          <button style={btn} onClick={()=>setScreen("home")}>Home</button>
        </div>
      );
    }

    return(
      <div style={page}>
        {list.map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} | {e.carClass} | {e.total}
          </div>
        ))}
        <button style={btn} onClick={()=>window.print()}>Print</button>
        <button style={btn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={page}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <input placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <button style={btn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={btn} onClick={()=>setScreen("score")}>Resume Judging</button>

        <button style={btn} onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button style={btn} onClick={()=>setScreen("class")}>Class Leaderboard</button>
        <button style={btn} onClick={()=>setScreen("female")}>Female Overall</button>
        <button style={btn} onClick={()=>setScreen("top150")}>Top 150</button>
        <button style={btn} onClick={()=>setScreen("top30")}>Top 30 Finals</button>
        <button style={btn}>Archived Events</button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judge"){
    return(
      <div style={page}>
        <h2>Judge Login</h2>

        <input placeholder="Judge Name"
          value={judgeName}
          onChange={e=>setJudgeName(e.target.value)}
        />

        <button style={btn} onClick={()=>setScreen("score")}>Start</button>
        <button style={btn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="score") return <ScoreScreen />;
  if(screen==="leader") return <Leaderboard />;
  if(screen==="class") return <Leaderboard filter="class" />;
  if(screen==="female") return <Leaderboard filter="female" />;
  if(screen==="top150") return <Leaderboard filter="top150" />;
  if(screen==="top30") return <Leaderboard filter="top30" />;

  return <div style={page}>Loading...</div>;
}
