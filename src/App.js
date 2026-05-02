✅ REPLACE ENTIRE src/App.js WITH THIS
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
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});

  // LOAD DATA
  useEffect(() => {
    async function load() {
      try {
        const q = await getDocs(collection(db, "scores"));
        setData(q.docs.map(d => d.data()));
      } catch {
        setData([]);
      }
    }
    load();
  }, []);

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

    const q = query(
      collection(db,"scores"),
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

    const payload = {
      judge,
      car,
      driver,
      rego,
      carName,
      gender,
      carClass,
      tyres,
      finalScore,
      createdAt: new Date()
    };

    await addDoc(collection(db,"scores"), payload);
    setData(prev => [...prev, payload]);

    // RESET FOR NEXT CAR
    setScores({});
    setDeductions({});
    setCar("");
    setDriver("");
    setRego("");
    setCarName("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  function combineScores(){
    let combined = {};

    data.forEach(e=>{
      if(!combined[e.car]){
        combined[e.car] = {
          car:e.car,
          total:0
        };
      }
      combined[e.car].total += e.finalScore;
    });

    return Object.values(combined).sort((a,b)=>b.total-a.total);
  }

  function buildTop150(){
    setTop150(combineScores().slice(0,150));
    setScreen("top150");
  }

  const btn = {
    margin:5,
    padding:12,
    background:"#333",
    color:"#fff",
    border:"none"
  };

  const activeBtn = (active) => ({
    ...btn,
    background: active ? "red" : "#333"
  });

  // HOME
  if(screen === "home"){
    return (
      <div style={{padding:20}}>
        <h1>🔥 AutoFest 🔥</h1>
        <button onClick={()=>setScreen("event")}>Enter Event</button>
        <button onClick={buildTop150}>Leaderboard</button>
      </div>
    );
  }

  // EVENT
  if(screen === "event"){
    return (
      <div style={{padding:20}}>
        <h2>Event Access</h2>
        <button onClick={()=>setScreen("judge")}>Continue</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen === "judge"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>
        {[1,2,3,4,5,6].map(j=>(
          <button key={j} onClick={()=>{setJudge(j);setScreen("score");}}>
            Judge {j}
          </button>
        ))}
      </div>
    );
  }

  // LEADERBOARD
  if(screen === "top150"){
    return (
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>
        {top150.map((e,i)=>(
          <div key={i}>#{i+1} {e.car} - {e.total}</div>
        ))}
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE SHEET
  return (
    <div style={{padding:20}}>

      <h2>Judge {judge}</h2>

      <input
        placeholder="Entrant No / Rego"
        value={car}
        onChange={e=>setCar(e.target.value)}
        style={{width:"100%",padding:12,fontSize:18,marginBottom:10}}
      />

      {/* Gender */}
      <div>
        <button style={activeBtn(gender==="Male")} onClick={()=>setGender("Male")}>Male</button>
        <button style={activeBtn(gender==="Female")} onClick={()=>setGender("Female")}>Female</button>
      </div>

      {/* Class */}
      <div>
        {classes.map(c=>(
          <button key={c} style={activeBtn(carClass===c)} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Scores */}
      {categories.map(cat=>(
        <div key={cat} style={{marginBottom:15}}>
          <div style={{fontSize:18}}>{cat}</div>
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {[...Array(21)].map((_,i)=>(
              <button
                key={i}
                onClick={()=>setScore(cat,i)}
                style={{
                  width:50,
                  height:50,
                  margin:2,
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

      {/* Tyres */}
      <div>
        <strong>Tyres (+5)</strong><br/>
        <button style={activeBtn(tyres==="Left")} onClick={()=>setTyres("Left")}>Left</button>
        <button style={activeBtn(tyres==="Right")} onClick={()=>setTyres("Right")}>Right</button>
      </div>

      {/* Deductions */}
      <div>
        {deductionsList.map(d=>(
          <button key={d} style={activeBtn(deductions[d])} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button onClick={submit}>Submit</button>
      <button onClick={buildTop150}>Leaderboard</button>
      <button onClick={()=>setScreen("home")}>Home</button>

    </div>
  );
}
