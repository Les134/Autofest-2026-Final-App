import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";

// ================= CONFIG =================
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary","Female"];
const categories = ["Instant Smoke","Volume of Smoke","Constant Smoke","Driver Skill & Control"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= STYLE =================
const page = { background:"#111", color:"#fff", minHeight:"100vh", padding:20 };
const bigBtn = { width:"100%", padding:18, margin:"6px 0", background:"#222", color:"#fff", fontSize:18 };
const smallBtn = { padding:10, margin:4, background:"#222", color:"#fff" };
const active = { ...smallBtn, background:"red" };

// ================= APP =================
export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");
  const [judgeName,setJudgeName] = useState("");
  const [eventLocked,setEventLocked] = useState(false);
  const [entries,setEntries] = useState([]);

  // LIVE DATA
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  // ================= LOCK EVENT =================
  const lockEvent = async () => {
    if(!eventName) return alert("Enter Event Name first");

    await setDoc(doc(db,"events",eventName),{
      locked:true,
      createdAt:new Date()
    });

    setEventLocked(true);
  };

  // ================= LOAD EVENT LOCK =================
  const loadEvent = async (name) => {
    const ref = doc(db,"events",name);
    const snap = await getDoc(ref);

    if(snap.exists()){
      setEventLocked(snap.data().locked);
    } else {
      setEventLocked(false);
    }
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

      if(!eventName) return alert("No Event");
      if(!judgeName) return alert("No Judge");
      if(!car) return alert("Enter Car #");

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
        locked: eventLocked,
        createdAt:new Date()
      });

      setCar(""); setGender(""); setCarClass("");
      setScores({}); setDeductions({}); setTyres({left:false,right:false});
    };

    return(
      <div style={page}>
        <h2>{eventName} {eventLocked && "🔒"}</h2>
        <h3>{judgeName}</h3>

        <input placeholder="Car # / Rego" value={car} onChange={e=>setCar(e.target.value)} />

        <div>
          <button style={gender==="Male"?active:smallBtn} onClick={()=>setGender("Male")}>Male</button>
          <button style={gender==="Female"?active:smallBtn} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?active:smallBtn}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <b>{cat}</b><br/>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={scores[cat]===i?active:smallBtn}
                onClick={()=>setScores({...scores,[cat]:i})}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <div>
          Tyres
          <button style={tyres.left?active:smallBtn} onClick={()=>setTyres({...tyres,left:!tyres.left})}>L</button>
          <button style={tyres.right?active:smallBtn} onClick={()=>setTyres({...tyres,right:!tyres.right})}>R</button>
        </div>

        <div>
          Deductions
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?active:smallBtn}
              onClick={()=>setDeductions({...deductions,[d]:!deductions[d]})}>
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
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judge"){
    return(
      <div style={page}>
        <h2>Event Login</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={async (e)=>{
            setEventName(e.target.value);
            await loadEvent(e.target.value);
          }}
        />

        <input
          placeholder="Judge Name"
          value={judgeName}
          onChange={e=>setJudgeName(e.target.value)}
        />

        {!eventLocked && (
          <button style={bigBtn} onClick={lockEvent}>
            Lock Event
          </button>
        )}

        <button style={bigBtn} onClick={()=>setScreen("score")}>
          Start / Resume
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
 
