import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  setDoc,
  doc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PASSWORD = "admin123";

const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Control"
];

const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [adminPass,setAdminPass] = useState("");

  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [data,setData] = useState([]);

  // LOAD SCORES
  useEffect(()=>{
    if(!eventName) return;

    async function load(){
      const q = query(collection(db,"scores"), where("event","==",eventName));
      const res = await getDocs(q);
      setData(res.docs.map(d=>d.data()));
    }

    load();
  },[eventName]);

  // 🔧 LOAD EVENT JUDGES (FIX)
  useEffect(()=>{
    if(!eventName) return;

    async function loadEvent(){
      const snap = await getDocs(collection(db,"events"));
      snap.forEach(d=>{
        if(d.id === eventName){
          setJudges(d.data().judges || []);
        }
      });
    }

    loadEvent();
  },[eventName]);

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  // 🔧 FIXED SUBMIT
  async function submit(){

    if(!car || !judge){
      alert("Enter entrant and judge");
      return;
    }

    if(Object.keys(scores).length !== categories.length){
      alert("Complete all score categories");
      return;
    }

    let rawScore = Object.values(scores).reduce((a,b)=>a+b,0);
    let deductionItems = Object.keys(deductions).filter(d=>deductions[d]);
    let deductionTotal = deductionItems.length * 10;
    let tyreBonus = tyres ? 5 : 0;

    let finalScore = rawScore - deductionTotal + tyreBonus;

    try{
      await addDoc(collection(db,"scores"), {
        event:eventName,
        judge,
        car,
        gender,
        carClass,
        rawScore,
        deductions: deductionItems,
        finalScore
      });

      alert("Score Submitted");

      setScores({});
      setDeductions({});
      setCar("");
      setGender("");
      setCarClass("");
      setTyres("");

    }catch(e){
      console.error(e);
      alert("Error saving score");
    }
  }

  function combineScores(){

    let combined = {};

    data.forEach(e=>{
      if(!combined[e.car]){
        combined[e.car] = {
          car:e.car,
          gender:e.gender,
          class:e.carClass,
          rawScore:0,
          finalScore:0,
          deductions:[]
        };
      }

      combined[e.car].rawScore += e.rawScore || 0;
      combined[e.car].finalScore += e.finalScore || 0;
      combined[e.car].deductions.push(...(e.deductions || []));
    });

    return Object.values(combined).sort((a,b)=>b.finalScore-a.finalScore);
  }

  const overall = combineScores();

  const female = overall.filter(e=>e.gender==="Female");

  const classBoards = {};
  classes.forEach(c=>{
    classBoards[c] = overall.filter(e=>e.class===c);
  });

  const btn = {
    padding:"10px",
    margin:"5px",
    background:"#222",
    color:"#fff"
  };

  const activeBtn = (active)=>({
    ...btn,
    background: active ? "#e53935" : "#222"
  });

  const scoreBtn = (active)=>({
    width:"40px",
    height:"40px",
    margin:"2px",
    background: active ? "#e53935" : "#333",
    color:"#fff"
  });

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>AUTOFEST</h1>

        <button style={btn} onClick={()=>setScreen("admin")}>Admin</button>
        <button style={btn} onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button style={btn} onClick={()=>setScreen("score")}>Resume Scoresheet</button>

        <h2>Top 30</h2>
        {overall.slice(0,30).map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} ({e.gender?.[0]}) | {e.class} | {e.finalScore}
          </div>
        ))}

        <h2>Top 150</h2>
        {overall.slice(0,150).map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} ({e.gender?.[0]}) | {e.class} | {e.finalScore}
          </div>
        ))}

        <h3>Female</h3>
        {female.map((e,i)=>(
          <div key={i}>
            #{i+1} | {e.car} ({e.gender?.[0]}) | {e.class} | {e.finalScore}
          </div>
        ))}

        <h2>Class Leaderboards</h2>
        {classes.map(c=>(
          <div key={c}>
            <h3>{c}</h3>
            {classBoards[c].map((e,i)=>(
              <div key={i}>
                #{i+1} | {e.car} ({e.gender?.[0]}) | {e.class} | {e.finalScore}
              </div>
            ))}
          </div>
        ))}

        <button onClick={()=>window.print()}>Print</button>
      </div>
    );
  }

  // ADMIN PAGE
  if(screen==="admin"){
    return (
      <div style={{padding:20}}>
        <h2>Event Setup</h2>

        <input placeholder="Admin Password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
        <input placeholder="Event Name" value={eventName} onChange={e=>setEventName(e.target.value)} />

        {judges.map((j,i)=>(
          <input key={i} placeholder={`Judge ${i+1}`} value={j}
            onChange={e=>{
              let copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button style={btn} onClick={async ()=>{
          if(adminPass!==ADMIN_PASSWORD){
            alert("Wrong password");
            return;
          }
          await setDoc(doc(db,"events",eventName),{ judges });
          alert("Event Saved");
          setScreen("home");
        }}>
          Save Event
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen==="judgeLogin"){
    return (
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          j && (
            <button key={i} style={btn} onClick={()=>{
              setJudge(j);
              setScreen("score");
            }}>
              {j}
            </button>
          )
        ))}
      </div>
    );
  }

  // SCORE SCREEN
  if(screen==="score"){
    return (
      <div style={{padding:20}}>

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input placeholder="Entrant" value={car} onChange={e=>setCar(e.target.value)} />

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
            <div>{cat}</div>
            {[...Array(20)].map((_,i)=>(
              <button key={i} style={scoreBtn(scores[cat]===i+1)} onClick={()=>setScore(cat,i+1)}>
                {i+1}
              </button>
            ))}
          </div>
        ))}

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

  return null;
}
