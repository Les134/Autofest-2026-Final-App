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
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judgeName,setJudgeName] = useState("");
  const [judge,setJudge] = useState("");
  const [eventLocked,setEventLocked] = useState(false);

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [data,setData] = useState([]);

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
    return ()=>clearInterval(interval);
  },[eventName]);

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){

    let total = Object.values(scores).reduce((a,b)=>a+b,0);
    let deductionCount = Object.values(deductions).filter(Boolean).length;
    let tyreBonus = tyres ? 5 : 0;

    let finalScore = total - (deductionCount * 10) + tyreBonus;

    await addDoc(collection(db,"scores"), {
      event:eventName,
      judge,
      car,
      gender,
      carClass,
      finalScore
    });

    setScores({});
    setDeductions({});
    setCar("");
  }

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

  const menuBtn = {
    width:"100%",
    padding:"16px",
    margin:"6px 0",
    background:"#222",
    color:"#fff"
  };

  // HOME (MATCH YOUR SCREENSHOT)
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={menuBtn} onClick={()=>setScreen("login")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
        <button style={menuBtn}>Class Leaderboard</button>
        <button style={menuBtn}>Female Overall</button>
        <button style={menuBtn}>Top 150</button>
        <button style={menuBtn}>Top 30 Finals</button>
      </div>
    );
  }

  // LOGIN SCREEN (FIXED FLOW)
  if(screen==="login"){
    return (
      <div style={{padding:20}}>
        <h2>Judge Login</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <input
          placeholder="Judge Name"
          value={judgeName}
          onChange={e=>setJudgeName(e.target.value)}
        />

        <button style={menuBtn} onClick={()=>{
          if(!eventName || !judgeName){
            alert("Enter Event + Judge");
            return;
          }
          setJudge(judgeName);
          setScreen("score");
        }}>
          Start Judging
        </button>

        <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // BLOCK IF NO JUDGE
  if(screen==="score" && !judge){
    return (
      <div style={{padding:20}}>
        <h2>No Judge Logged In</h2>
        <button style={menuBtn} onClick={()=>setScreen("login")}>
          Go to Login
        </button>
      </div>
    );
  }

  // SCORE SCREEN (MATCHES YOUR IMAGE)
  if(screen==="score"){
    return (
      <div style={{padding:20}}>

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input
          placeholder="Entrant No"
          value={car}
          onChange={e=>setCar(e.target.value)}
        />

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
            <div>{cat}</div>
            <div style={{display:"flex",flexWrap:"wrap"}}>
              {[...Array(20)].map((_,i)=>(
                <button key={i} onClick={()=>setScore(cat,i+1)}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <button onClick={()=>setTyres("Left")}>Left</button>
          <button onClick={()=>setTyres("Right")}>Right</button>
        </div>

        <div>
          {deductionsList.map(d=>(
            <button key={d} onClick={()=>toggleDeduction(d)}>{d}</button>
          ))}
        </div>

        <button style={menuBtn} onClick={submit}>Submit</button>
        <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>

      </div>
    );
  }

  // LEADERBOARD (SIMPLE — SAME STYLE AS YOURS)
  return (
    <div style={{padding:20}}>
      <h2>Leaderboard</h2>
      {overall.map((e,i)=>(
        <div key={i}>#{i+1} {e.car} - {e.total}</div>
      ))}
      <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>
    </div>
  );
}
