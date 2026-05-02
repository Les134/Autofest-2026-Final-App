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

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = ["Instant Smoke","Volume","Consistency","Driver Control"];
const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [eventLocked,setEventLocked] = useState(false);
  const [judgeNames,setJudgeNames] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [data,setData] = useState([]);
  const [locked,setLocked] = useState(false);

  // 🔧 FIX: Reset judge when opening login
  useEffect(()=>{
    if(screen==="judgeLogin"){
      setJudge("");
    }
  },[screen]);

  // LOAD DATA
  useEffect(()=>{
    if(!eventName) return;

    async function load(){
      const q = query(collection(db,"scores"), where("event","==",eventName));
      const res = await getDocs(q);
      setData(res.docs.map(d=>d.data()));
    }

    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  },[eventName]);

  // LOCK CHECK
  useEffect(()=>{
    if(!car || !judge || !eventName) return;

    async function check(){
      const q = query(
        collection(db,"scores"),
        where("event","==",eventName),
        where("car","==",car),
        where("judge","==",judge)
      );
      const res = await getDocs(q);
      setLocked(!res.empty);
    }

    check();
  },[car,judge,eventName]);

  function setScore(cat,val){
    if(locked) return;
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    if(locked) return;
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){
    if(locked){
      alert("Already scored");
      return;
    }

    let total = Object.values(scores).reduce((a,b)=>a+b,0);
    let deductionCount = Object.values(deductions).filter(Boolean).length;
    let tyreBonus = tyres ? 5 : 0;

    let finalScore = total - (deductionCount * 10) + tyreBonus;

    const q = query(
      collection(db,"scores"),
      where("event","==",eventName),
      where("car","==",car),
      where("judge","==",judge)
    );

    const res = await getDocs(q);
    if(!res.empty){
      setLocked(true);
      return;
    }

    await addDoc(collection(db,"scores"), {
      event:eventName,
      judge,
      car,
      gender,
      carClass,
      finalScore,
      locked:true
    });

    setScores({});
    setDeductions({});
    setCar("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  // COMBINE
  function combineScores(){
    let combined = {};
    data.forEach(e=>{
      if(!combined[e.car]){
        combined[e.car] = {
          car:e.car,
          total:0,
          class:e.carClass,
          gender:e.gender
        };
      }
      combined[e.car].total += e.finalScore;
    });
    return Object.values(combined).sort((a,b)=>b.total-a.total);
  }

  const overall = combineScores();
  const female = overall.filter(e=>e.gender==="Female");

  const classBoards = {};
  classes.forEach(c=>{
    classBoards[c] = overall.filter(e=>e.class===c);
  });

  const menuBtn = {
    width:"100%",
    padding:"16px",
    margin:"6px 0",
    fontSize:"18px",
    background:"#222",
    color:"#fff"
  };

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>🔥 AutoFest 🔥</h1>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>!eventLocked && setEventName(e.target.value)}
          style={{width:"100%",padding:12}}
        />

        <button style={menuBtn} onClick={()=>setScreen("eventSetup")}>Event Setup</button>
        <button style={menuBtn} onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Return to Scoresheet</button>
        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Full Leaderboards</button>

        <h2>🏆 Top 30</h2>
        {overall.slice(0,30).map((e,i)=>(
          <div key={i}>#{i+1} {e.car} - {e.total}</div>
        ))}

        <h3>👩 Female</h3>
        {female.slice(0,10).map((e,i)=>(
          <div key={i}>#{i+1} {e.car} - {e.total}</div>
        ))}

        <button style={menuBtn} onClick={()=>window.print()}>
          Print Leaderboard
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen==="judgeLogin"){
    if(!eventLocked){
      return <div style={{padding:20}}>Event not locked</div>;
    }

    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judgeNames.map((name,i)=>(
          name && (
            <button key={i} style={menuBtn} onClick={()=>setJudge(name)}>
              {name}
            </button>
          )
        ))}

        {judge && (
          <button style={menuBtn} onClick={()=>setScreen("score")}>
            Continue to Scoresheet
          </button>
        )}
      </div>
    );
  }

  // 🔧 FIX: prevent scoring without judge
  if(screen==="score" && !judge){
    return (
      <div style={{padding:20}}>
        <h2>No Judge Selected</h2>
        <button style={menuBtn} onClick={()=>setScreen("judgeLogin")}>
          Go to Judge Login
        </button>
      </div>
    );
  }

  // LEADERBOARD unchanged...

  // SCORE PAGE (unchanged)
  return (
    <div style={{padding:20}}>
      <h2>{eventName}</h2>
      <h3>{judge}</h3>

      <input
        placeholder="Entrant No / Rego"
        value={car}
        onChange={e=>setCar(e.target.value)}
      />

      {categories.map(cat=>(
        <div key={cat}>
          <div>{cat}</div>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {[...Array(20)].map((_,i)=>(
              <button
                key={i}
                disabled={locked}
                onClick={()=>setScore(cat,i+1)}
              >
                {i+1}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button style={menuBtn} onClick={submit}>Submit</button>
      <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>
    </div>
  );
}
