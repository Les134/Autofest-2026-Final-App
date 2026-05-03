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
  doc,
  deleteDoc
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
  "Driver Skill & Control"
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

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){

    let rawScore = Object.values(scores).reduce((a,b)=>a+b,0);

    let deductionItems = Object.keys(deductions).filter(d=>deductions[d]);
    let deductionTotal = deductionItems.length * 10;

    let tyreBonus = tyres ? 5 : 0;

    let finalScore = rawScore - deductionTotal + tyreBonus;

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

    alert("Score submitted");

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
          gender:e.gender,
          class:e.carClass,
          rawScore:0,
          finalScore:0,
          deductions:[]
        };
      }

      combined[e.car].rawScore += e.rawScore || 0;
      combined[e.car].finalScore += e.finalScore || 0;

      if(e.deductions){
        combined[e.car].deductions.push(...e.deductions);
      }
    });

    return Object.values(combined).sort((a,b)=>b.finalScore - a.finalScore);
  }

  const overall = combineScores();

  // 🔐 ARCHIVE EVENT
  async function archiveEvent(){
    if(adminPass !== ADMIN_PASSWORD){
      alert("Admin password required");
      return;
    }

    await setDoc(doc(db,"archives",eventName),{
      event:eventName,
      results:overall,
      date:new Date()
    });

    alert("Event archived");
  }

  // 🔐 DELETE ARCHIVE
  async function deleteArchive(){
    if(adminPass !== ADMIN_PASSWORD){
      alert("Admin password required");
      return;
    }

    await deleteDoc(doc(db,"archives",eventName));
    alert("Archive deleted");
  }

  // STYLES
  const row = { display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"12px" };

  const activeBtn = (active)=>({
    padding:"10px",
    background: active ? "#e53935" : "#222",
    color:"#fff",
    border:"1px solid #555"
  });

  const scoreBtn = (active)=>({
    width:"40px",
    height:"40px",
    background: active ? "#e53935" : "#2a2a2a",
    color:"#fff",
    border:"1px solid #555"
  });

  const menuBtn = {
    width:"100%",
    padding:"14px",
    margin:"5px 0",
    background:"#222",
    color:"#fff"
  };

  // HOME
  if(screen==="home"){
    return (
      <div style={{padding:20}}>
        <h1>AUTOFEST</h1>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e=>setEventName(e.target.value)}
        />

        <input
          placeholder="Admin Password"
          value={adminPass}
          onChange={e=>setAdminPass(e.target.value)}
        />

        <button style={menuBtn} onClick={()=>setScreen("score")}>Start Judging</button>
        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboard</button>

        <button style={menuBtn} onClick={archiveEvent}>Archive Event</button>
        <button style={menuBtn} onClick={deleteArchive}>Delete Archive</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return (
      <div style={{padding:20}}>

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input placeholder="Entrant" value={car} onChange={e=>setCar(e.target.value)} />

        <div style={row}>
          <button style={activeBtn(gender==="Male")} onClick={()=>setGender("Male")}>Male</button>
          <button style={activeBtn(gender==="Female")} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div style={row}>
          {classes.map(c=>(
            <button key={c} style={activeBtn(carClass===c)} onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <div>{cat}</div>
            <div style={row}>
              {[...Array(20)].map((_,i)=>(
                <button key={i} style={scoreBtn(scores[cat]===i+1)} onClick={()=>setScore(cat,i+1)}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={row}>
          <button style={activeBtn(tyres==="Left")} onClick={()=>setTyres("Left")}>Left</button>
          <button style={activeBtn(tyres==="Right")} onClick={()=>setTyres("Right")}>Right</button>
        </div>

        <div style={row}>
          {deductionsList.map(d=>(
            <button key={d} style={activeBtn(deductions[d])} onClick={()=>toggleDeduction(d)}>
              {d}
            </button>
          ))}
        </div>

        <button style={menuBtn} onClick={submit}>Submit</button>
      </div>
    );
  }

  // LEADERBOARD
  return (
    <div style={{padding:20}}>

      {classes.map(cls=>{
        const filtered = overall.filter(e=>e.class===cls);

        return (
          <div key={cls} style={{marginBottom:20}}>
            <h2>{cls}</h2>

            {filtered.map((e,i)=>(
              <div key={i}>
                #{i+1} | {e.car} ({e.gender?.[0] || ""}) | {e.class} | {e.rawScore} - ({[...new Set(e.deductions)].join(",")}) {e.finalScore}
              </div>
            ))}
          </div>
        );
      })}

      <button onClick={()=>window.print()}>Print Leaderboards</button>
    </div>
  );
}
