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
const categories = ["Instant Smoke","Volume of Smoke","Constant Smoke","Driver Skill & Control"];
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judge,setJudge] = useState("");

  const [data,setData] = useState([]);

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  useEffect(()=>{
    if(!eventName) return;
    async function load(){
      const q = query(collection(db,"scores"), where("event","==",eventName));
      const res = await getDocs(q);
      setData(res.docs.map(d=>d.data()));
    }
    load();
  },[eventName]);

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){

    if(!eventName) return alert("No event");
    if(!judge) return alert("No judge");
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
      event: eventName,
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

    setScores({});
    setDeductions({});
    setCar("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  const btn = {
    width:"100%",
    padding:"18px",
    margin:"10px 0",
    fontSize:"18px",
    background:"#1e1e1e",
    color:"#fff",
    border:"1px solid #444"
  };

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20,background:"#111",minHeight:"100vh",color:"#fff"}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
          style={{padding:10,width:"100%"}}
        />

        <button style={btn} onClick={()=>setScreen("judge")}>Judge Login</button>
      </div>
    );
  }

  // JUDGE LOGIN
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

  // SCORE
  return (
    <div style={{padding:20,background:"#111",color:"#fff"}}>

      <h2>{eventName}</h2>
      <h3>Judge {judge}</h3>

      <input placeholder="Car #" value={car} onChange={e=>setCar(e.target.value)} />

      {/* Gender */}
      <div>
        <button onClick={()=>setGender("Male")}>Male</button>
        <button onClick={()=>setGender("Female")}>Female</button>
      </div>

      {/* Classes */}
      <div>
        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}
      </div>

      {/* Tyres */}
      <div>
        <button onClick={()=>setTyres("Left")}>Left</button>
        <button onClick={()=>setTyres("Right")}>Right</button>
      </div>

      {/* Scores */}
      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong>
          {[...Array(21)].map((_,i)=>(
            <button key={i} onClick={()=>setScore(cat,i)}>{i}</button>
          ))}
        </div>
      ))}

      {/* Deductions */}
      <div>
        {deductionsList.map(d=>(
          <button key={d} onClick={()=>toggleDeduction(d)}>{d}</button>
        ))}
      </div>

      <button style={btn} onClick={submit}>Submit Score</button>

    </div>
  );
}
