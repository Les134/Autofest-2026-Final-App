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
const categories = [
  "Instant Smoke",
  "Volume",
  "Consistency",
  "Driver Control"
];

const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judgeNames,setJudgeNames] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  const [data,setData] = useState([]);

  // LOAD EVENT DATA
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

    // 🔥 CLEAR FOR NEXT CAR
    setScores({});
    setDeductions({});
    setCar("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  // COMBINE SCORES (ALL JUDGES)
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

  const btn = {
    padding:"12px",
    margin:"5px",
    background:"#222",
    color:"#fff",
    border:"1px solid #444"
  };

  const activeBtn = (active) => ({
    ...btn,
    background: active ? "red" : "#333"
  });

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20,background:"#111",color:"#fff"}}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
          style={{width:"100%",padding:10}}
        />

        <button style={btn} onClick={()=>setScreen("event")}>Setup Event</button>
        <button style={btn} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={btn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
      </div>
    );
  }

  // EVENT SETUP
  if(screen==="event"){
    return (
      <div style={{padding:20,color:"#fff"}}>
        <h2>Judge Names</h2>

        {judgeNames.map((n,i)=>(
          <input
            key={i}
            placeholder={`Judge ${i+1}`}
            value={n}
            onChange={e=>{
              let copy=[...judgeNames];
              copy[i]=e.target.value;
              setJudgeNames(copy);
            }}
            style={{width:"100%",margin:5}}
          />
        ))}

        <button style={btn} onClick={()=>setScreen("home")}>Save</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen==="judge"){
    return (
      <div style={{padding:20,color:"#fff"}}>
        <h2>Select Judge</h2>

        {judgeNames.map((name,i)=>(
          name && (
            <button key={i} style={btn} onClick={()=>{setJudge(name);setScreen("score");}}>
              {name}
            </button>
          )
        ))}
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    const combined = combineScores();

    return (
      <div style={{padding:20,color:"#fff"}}>
        <h2>Leaderboard</h2>

        {combined.map((e,i)=>(
          <div key={i}>
            #{i+1} {e.car} - {e.total}
          </div>
        ))}

        <button style={btn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE SHEET
  return (
    <div style={{padding:20,background:"#111",color:"#fff"}}>

      <h2>{eventName}</h2>
      <h3>{judge}</h3>

      {/* CAR */}
      <input
        placeholder="Entrant No / Rego"
        value={car}
        onChange={e=>setCar(e.target.value)}
        style={{width:"100%",padding:12,fontSize:18}}
      />

      {/* GENDER */}
      <div>
        <button style={activeBtn(gender==="Male")} onClick={()=>setGender("Male")}>Male</button>
        <button style={activeBtn(gender==="Female")} onClick={()=>setGender("Female")}>Female</button>
      </div>

      {/* CLASS */}
      <div>
        {classes.map(c=>(
          <button key={c} style={activeBtn(carClass===c)} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* SCORES */}
      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong><br/>
          {[...Array(21)].map((_,i)=>(
            <button key={i} style={activeBtn(scores[cat]===i)} onClick={()=>setScore(cat,i)}>
              {i}
            </button>
          ))}
        </div>
      ))}

      {/* TYRES */}
      <div>
        <button style={activeBtn(tyres==="Left")} onClick={()=>setTyres("Left")}>Left</button>
        <button style={activeBtn(tyres==="Right")} onClick={()=>setTyres("Right")}>Right</button>
      </div>

      {/* DEDUCTIONS */}
      <div>
        {deductionsList.map(d=>(
          <button key={d} style={activeBtn(deductions[d])} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button style={btn} onClick={submit}>Submit</button>
      <button style={btn} onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}
