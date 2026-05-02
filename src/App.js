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
  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  useEffect(()=>{
    async function load(){
      try{
        const q = await getDocs(collection(db,"scores"));
        setData(q.docs.map(d=>d.data()));
      }catch{
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
    let total = Object.values(scores).reduce((a,b)=>a+b,0);
    let deductionCount = Object.values(deductions).filter(Boolean).length;
    let finalScore = total - (deductionCount * 10);

    await addDoc(collection(db,"scores"), {
      judge, car, finalScore, createdAt:new Date()
    });

    setScores({});
    setDeductions({});
    setCar("");
  }

  function combineScores(){
    let combined = {};
    data.forEach(e=>{
      let key = e.car;
      if(!combined[key]) combined[key] = { car:e.car,total:0 };
      combined[key].total += e.finalScore;
    });
    return Object.values(combined);
  }

  function buildTop150(){
    setTop150(
      combineScores().sort((a,b)=>b.total-a.total).slice(0,150)
    );
    setScreen("leaderboard");
  }

  const btnStyle = {
    width:"100%",
    padding:"18px",
    margin:"10px 0",
    fontSize:"18px",
    background:"#1e1e1e",
    color:"#fff",
    border:"1px solid #444",
    borderRadius:"6px"
  };

  // HOME SCREEN (MATCH YOUR OLD ONE)
  if(screen === "home"){
    return (
      <div style={{padding:20,background:"#111",minHeight:"100vh",color:"#fff"}}>
        <h1 style={{textAlign:"center"}}>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={btnStyle} onClick={()=>setScreen("event")}>New Event</button>
        <button style={btnStyle} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={btnStyle}>Resume Scoring</button>
        <button style={btnStyle} onClick={buildTop150}>Leaderboard</button>
        <button style={btnStyle}>Event Archive</button>
        <button style={btnStyle}>Set Admin</button>
        <button style={btnStyle}>Admin Login</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen === "judge"){
    return (
      <div style={{padding:20,background:"#111",minHeight:"100vh",color:"#fff"}}>
        <h2>Select Judge</h2>
        {[1,2,3,4,5,6].map(j=>(
          <button key={j} style={btnStyle} onClick={()=>{setJudge(j);setScreen("score");}}>
            Judge {j}
          </button>
        ))}
      </div>
    );
  }

  // LEADERBOARD
  if(screen === "leaderboard"){
    return (
      <div style={{padding:20,background:"#111",minHeight:"100vh",color:"#fff"}}>
        <h2>Leaderboard</h2>
        {top150.map((e,i)=>(
          <div key={i}>#{i+1} {e.car} - {e.total}</div>
        ))}
        <button style={btnStyle} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE SHEET (MATCH YOUR LOOK)
  return (
    <div style={{padding:20,background:"#111",minHeight:"100vh",color:"#fff"}}>

      <h2>Judge {judge}</h2>

      <input
        placeholder="Car #"
        value={car}
        onChange={e=>setCar(e.target.value)}
        style={{padding:10,width:"100%",marginBottom:10}}
      />

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {[...Array(21)].map((_,i)=>(
              <button
                key={i}
                onClick={()=>setScore(cat,i)}
                style={{
                  width:40,
                  height:40,
                  margin:3,
                  background: scores[cat]===i ? "red" : "#333",
                  color:"#fff"
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <strong>Deductions</strong>
        {deductionsList.map(d=>(
          <button
            key={d}
            onClick={()=>toggleDeduction(d)}
            style={{
              margin:5,
              background: deductions[d] ? "red" : "#333",
              color:"#fff"
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <button style={btnStyle} onClick={submit}>Submit Score</button>
      <button style={btnStyle} onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}
