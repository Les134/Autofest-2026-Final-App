import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill"
];

const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [entries,setEntries] = useState([]);

  const [car,setCar] = useState("");
  const [name,setName] = useState("");
  const [rego,setRego] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [tyres,setTyres] = useState({left:false,right:false});

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"), snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  const startEvent = ()=>{
    const valid = judges.filter(j=>j.trim() !== "");
    if(!eventName) return alert("Enter event name");
    if(valid.length===0) return alert("Add at least 1 judge");

    setJudges(valid);
    setScreen("judge");
  };

  const submit = async ()=>{
    if(!car && !name && !rego)
      return alert("Enter Car # OR Name OR Rego");

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
    const activeDeds = Object.keys(deductions).filter(d=>deductions[d]);
    const deductionTotal = activeDeds.length*10;

    const total = base + tyreScore - deductionTotal;

    await addDoc(collection(db,"scores"),{
      eventName,
      car,
      name,
      rego,
      gender,
      carClass,
      judge:activeJudge,
      total,
      deductions:activeDeds
    });

    setScores({});
    setDeductions({});
    setTyres({left:false,right:false});
    setCar(""); setName(""); setRego("");
    setGender(""); setCarClass("");
  };

  const btn={padding:10,margin:5};
  const active={...btn,background:"red",color:"#fff"};

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button onClick={()=>setScreen("setup")}>New Event</button>
        <button onClick={()=>setScreen("judge")}>Judge Login</button>
        <button onClick={()=>setScreen("leader")}>Leaderboard</button>
      </div>
    );
  }

  // ================= SETUP =================
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

        {judges.map((j,i)=>(
          <input key={i}
            placeholder={`Judge ${i+1}`}
            value={judges[i]}
            onChange={(e)=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={startEvent}>Start Event</button>
        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= JUDGE =================
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= SCORE =================
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} - {activeJudge}</h3>

        <input placeholder="Car #" value={car} onChange={(e)=>setCar(e.target.value)} />
        <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Rego" value={rego} onChange={(e)=>setRego(e.target.value)} />

        <div>
          <button style={gender==="Male"?active:btn} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?active:btn} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?active:btn}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <strong>{cat}</strong><br/>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={scores[cat]===i?active:btn}
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <div>
          <h4>Tyres Blown</h4>
          <button style={tyres.left?active:btn}
            onClick={()=>setTyres({...tyres,left:!tyres.left})}>
            Left
          </button>
          <button style={tyres.right?active:btn}
            onClick={()=>setTyres({...tyres,right:!tyres.right})}>
            Right
          </button>
        </div>

        <div>
          <h4>Deductions</h4>
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?active:btn}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
              {d}
            </button>
          ))}
        </div>

        <button onClick={submit}>Submit</button>
        <button onClick={()=>setScreen("judge")}>Next Judge</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {entries
          .sort((a,b)=>b.total-a.total)
          .map((e,i)=>(
            <div key={i}>
              {e.car} | {e.carClass} | {e.total}
            </div>
          ))}

        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
