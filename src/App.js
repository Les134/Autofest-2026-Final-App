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

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const auth = getAuth();

// ================= CONFIG =================
const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"
];

const categories = [
  "Instant Smoke","Volume of Smoke","Constant Smoke","Driver Skill & Control"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= STYLE =================
const page = { background:"#111", color:"#fff", minHeight:"100vh", padding:20 };
const bigBtn = { width:"100%", padding:18, margin:"6px 0", background:"#222", color:"#fff" };
const input = { width:"100%", padding:14, margin:"6px 0" };

const active = { background:"red" };

// ================= APP =================
export default function App(){

  const [user,setUser] = useState(null);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");
  const [judgeName,setJudgeName] = useState("");
  const [eventLocked,setEventLocked] = useState(false);
  const [entries,setEntries] = useState([]);

  // 🔐 AUTH LISTENER
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth,(u)=>{
      setUser(u);
    });
    return ()=>unsub();
  },[]);

  // 🔥 FIRESTORE LIVE
  useEffect(()=>{
    if(!user) return;
    const unsub = onSnapshot(collection(db,"scores"),snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[user]);

  // ================= LOGIN =================
  if(!user){
    return(
      <div style={page}>
        <h2>Autofest Login</h2>

        <input style={input}
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />

        <input style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <button style={bigBtn}
          onClick={()=>signInWithEmailAndPassword(auth,email,password)}>
          Login
        </button>
      </div>
    );
  }

  // ================= LOGOUT =================
  const logout = () => signOut(auth);

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
      const tyreCount = (tyres.left?1:0)+(tyres.right?1:0);
      const tyreScore = tyreCount * 5;
      const activeDeds = Object.keys(deductions).filter(d=>deductions[d]);
      const total = base + tyreScore - (activeDeds.length * 10);

      await addDoc(collection(db,"scores"),{
        eventName,
        judge: user.email,
        car,
        carClass,
        gender,
        base,
        tyreScore,
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

        <input style={input}
          placeholder="Car # / Rego"
          value={car}
          onChange={e=>setCar(e.target.value)}
        />

        <button onClick={()=>setGender("Male")} style={gender==="Male"?active:{}}>Male</button>
        <button onClick={()=>setGender("Female")} style={gender==="Female"?active:{}}>Female</button>

        <div>
          {classes.map(c=>(
            <button key={c}
              onClick={()=>setCarClass(c)}
              style={carClass===c?active:{}}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <b>{cat}</b><br/>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                onClick={()=>setScores(prev=>({...prev,[cat]:i}))}
                style={scores[cat]===i?active:{}}>
                {i}
              </button>
            ))}
          </div>
        ))}

        <div>
          Tyres
          <button onClick={()=>setTyres({...tyres,left:!tyres.left})}>L</button>
          <button onClick={()=>setTyres({...tyres,right:!tyres.right})}>R</button>
        </div>

        <div>
          {deductionsList.map(d=>(
            <button key={d}
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

  // ================= LEADERBOARD =================
  function Leaderboard(){
    return(
      <div style={page}>
        {entries
          .filter(e=>e.eventName===eventName)
          .sort((a,b)=>b.total-a.total)
          .map((e,i)=>(
            <div key={i}>
              #{i+1} | {e.car} ({e.gender==="Female"?"F":"M"}) | {e.carClass} |
              {e.base} +{e.tyreScore || 0} - ({e.deductions?.join(",")}) {e.total}
            </div>
        ))}
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

        <button style={bigBtn} onClick={logout}>Logout</button>
      </div>
    );
  }

  if(screen==="judge"){
    return(
      <div style={page}>
        <input style={input}
          placeholder="Event Name"
          value={eventName}
          onChange={async e=>{
            setEventName(e.target.value);
            await loadEvent(e.target.value);
          }}
        />

        {!eventLocked && <button style={bigBtn} onClick={lockEvent}>Lock Event</button>}

        <button style={bigBtn} onClick={()=>setScreen("score")}>Start</button>
        <button style={bigBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  if(screen==="score") return <ScoreScreen />;
  if(screen==="leader") return <Leaderboard />;

  return <div style={page}>Loading...</div>;
}
 
