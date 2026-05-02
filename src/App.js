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

    // reset
    setScores({});
    setDeductions({});
    setCar("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  function combineScores(){
    let combined = {};
    data.forEach(e=>{
      if(!combined[e.car]){
        combined[e.car] = { car:e.car,total:0 };
      }
      combined[e.car].total += e.finalScore;
    });
    return Object.values(combined).sort((a,b)=>b.total-a.total);
  }

  const btn = {
    width:"100%",
    padding:"18px",
    margin:"8px 0",
    fontSize:"18px",
    background:"#222",
    color:"#fff"
  };

  const activeBtn = (active)=>({
    ...btn,
    background: active ? "red" : "#333"
  });

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>🔥 AutoFest 🔥</h1>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
          style={{width:"100%",padding:12}}
        />

        <button style={btn} onClick={()=>setScreen("eventSetup")}>Event Setup</button>
        <button style={btn} onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button style={btn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
      </div>
    );
  }

  // EVENT SETUP
  if(screen==="eventSetup"){
    return (
      <div style={{padding:20}}>
        <h2>Judges</h2>

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
            style={{width:"100%",margin:5,padding:10}}
          />
        ))}

        <button style={btn} onClick={()=>{
          if(!eventName) return alert("Enter event name");
          setEventLocked(true);
          setScreen("home");
        }}>
          LOCK EVENT
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen==="judgeLogin"){
    if(!eventLocked){
      return (
        <div style={{padding:20}}>
          <h2>No Event Setup</h2>
          <button style={btn} onClick={()=>setScreen("eventSetup")}>Setup Event</button>
        </div>
      );
    }

    return (
      <div style={{padding:20}}>
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
    const list = combineScores();
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {list.map((e,i)=>(
          <div key={i}>#{i+1} {e.car} - {e.total}</div>
        ))}
        <button style={btn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE SHEET
  return (
    <div style={{padding:20}}>

      <h2>{eventName}</h2>
      <h3>{judge}</h3>

      <input
        placeholder="Entrant No / Rego"
        value={car}
        onChange={e=>setCar(e.target.value)}
        style={{width:"100%",padding:16,fontSize:20}}
      />

      <div>
        <button style={activeBtn(gender==="Male")} onClick={()=>setGender("Male")}>Male</button>
        <button style={activeBtn(gender==="Female")} onClick={()=>setGender("Female")}>Female</button>
      </div>

      <div>
        {classes.map(c=>(
          <button key={c} style={activeBtn(carClass===c)} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {categories.map(cat=>(
        <div key={cat}>
          <strong>{cat}</strong>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {[...Array(21)].map((_,i)=>(
              <button key={i} style={activeBtn(scores[cat]===i)} onClick={()=>setScore(cat,i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <button style={activeBtn(tyres==="Left")} onClick={()=>setTyres("Left")}>Left</button>
        <button style={activeBtn(tyres==="Right")} onClick={()=>setTyres("Right")}>Right</button>
      </div>

      <div>
        {deductionsList.map(d=>(
          <button key={d} style={activeBtn(deductions[d])} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button style={btn} onClick={submit}>Submit</button>
    </div>
  );
}
