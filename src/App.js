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
const categories = ["Smoke","Commitment","Style","Control","Entertainment"];
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");
  const [judge,setJudge] = useState("");

  const [data,setData] = useState([]);
  const [top150,setTop150] = useState([]);

  const [car,setCar] = useState("");
  const [driver,setDriver] = useState("");
  const [rego,setRego] = useState("");
  const [carName,setCarName] = useState("");

  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  // SAFE LOAD
  useEffect(()=>{
    async function load(){
      try{
        const q = await getDocs(collection(db,"scores"));
        setData(q.docs.map(d=>d.data()));
      }catch(err){
        console.log("Load error:", err);
        setData([]);
      }
    }
    load();
  },[]);

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){

    if(!car) return alert("Enter car");
    if(Object.keys(scores).length < categories.length){
      return alert("Complete all scores");
    }

    try {
      const q = query(
        collection(db,"scores"),
        where("judge","==",judge),
        where("car","==",car)
      );

      const existing = await getDocs(q);
      if(!existing.empty){
        return alert("Already scored this car");
      }

      let total = Object.values(scores).reduce((a,b)=>a+b,0);
      let deductionCount = Object.values(deductions).filter(Boolean).length;
      let finalScore = total - (deductionCount * 10);

      const payload = {
        judge, car, driver, rego, carName,
        gender, carClass,
        finalScore,
        createdAt: new Date()
      };

      await addDoc(collection(db,"scores"), payload);
      setData(prev => [...prev, payload]);

      // RESET
      setScores({});
      setDeductions({});
      setCar("");
      setDriver("");
      setRego("");
      setCarName("");
      setGender("");
      setCarClass("");

    } catch(err){
      console.log(err);
      alert("Save failed");
    }
  }

  function combineScores(){
    let combined = {};
    (data || []).forEach(e=>{
      let key = e.car || "Unknown";
      if(!combined[key]){
        combined[key] = { car:e.car, total:0 };
      }
      combined[key].total += e.finalScore;
    });
    return Object.values(combined);
  }

  function buildTop150(){
    setTop150(
      combineScores()
        .sort((a,b)=>b.total-a.total)
        .slice(0,150)
    );
    setScreen("top150");
  }

  // HOME
  if(screen === "home"){
    return (
      <div style={{padding:20}}>
        <h1>🔥 AutoFest 🔥</h1>
        <button onClick={()=>setScreen("event")}>Enter Event</button>
        <button onClick={buildTop150}>Leaderboards</button>
      </div>
    );
  }

  // EVENT LOGIN
  if(screen === "event"){
    return (
      <div style={{padding:20}}>
        <h2>Event Login</h2>
        <button onClick={()=>setScreen("judge")}>
          Unlock Event
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen === "judge"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>
        {[1,2,3,4,5,6].map(j=>(
          <button key={j} onClick={()=>{
            setJudge(j);
            setScreen("score");
          }}>
            Judge {j}
          </button>
        ))}
      </div>
    );
  }

  // TOP 150
  if(screen === "top150"){
    return (
      <div style={{padding:20}}>
        <h2>Top 150</h2>
        {top150.map((e,i)=>(
          <div key={i}>
            #{i+1} {e.car} - {e.total}
          </div>
        ))}
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  return (
    <div style={{padding:20}}>

      <h2>Judge {judge}</h2>

      <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />
      <input placeholder="Driver" value={driver} onChange={e=>setDriver(e.target.value)} />
      <input placeholder="Rego" value={rego} onChange={e=>setRego(e.target.value)} />
      <input placeholder="Car Name" value={carName} onChange={e=>setCarName(e.target.value)} />

      <div>
        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div>
        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {Array.from({length:21},(_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      <div>
        {deductionsList.map(d=>(
          <button key={d} onClick={()=>toggleDeduction(d)}>{d}</button>
        ))}
      </div>

      <button onClick={submit}>Submit</button>
      <button onClick={buildTop150}>Leaderboards</button>
      <button onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}
