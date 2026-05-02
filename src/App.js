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
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  const [adminPass,setAdminPass] = useState("");
  const [adminLogged,setAdminLogged] = useState(false);

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

  // PRINT
  function printPage(){
    window.print();
  }

  // ARCHIVE EVENT
  async function archiveEvent(){
    if(!eventName) return;

    const archiveRef = doc(db,"archives",eventName);
    await setDoc(archiveRef,{
      event:eventName,
      results:overall,
      archivedAt:new Date()
    });

    alert("Event archived safely");
  }

  // ADMIN LOGIN
  function adminLogin(){
    if(adminPass === "admin123"){ // simple local check
      setAdminLogged(true);
      setScreen("admin");
    } else {
      alert("Wrong password");
    }
  }

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

        <button style={menuBtn} onClick={()=>setScreen("eventSetup")}>Event Setup</button>
        <button style={menuBtn} onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button style={menuBtn} onClick={()=>setScreen("score")}>Scoresheet</button>
        <button style={menuBtn} onClick={()=>setScreen("leaderboard")}>Leaderboards</button>
        <button style={menuBtn} onClick={()=>setScreen("adminLogin")}>Admin</button>
      </div>
    );
  }

  // ADMIN LOGIN PAGE
  if(screen==="adminLogin"){
    return (
      <div style={{padding:20}}>
        <h2>Admin Login</h2>
        <input
          type="password"
          placeholder="Password"
          value={adminPass}
          onChange={e=>setAdminPass(e.target.value)}
        />
        <button style={menuBtn} onClick={adminLogin}>Login</button>
      </div>
    );
  }

  // ADMIN PANEL
  if(screen==="admin" && adminLogged){
    return (
      <div style={{padding:20}}>
        <h2>Admin Panel</h2>

        <button style={menuBtn} onClick={archiveEvent}>Archive Event</button>
        <button style={menuBtn} onClick={printPage}>Print Leaderboards</button>

        <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    return (
      <div style={{padding:20}}>
        <h2>🏆 Overall</h2>
        {overall.map((e,i)=>(
          <div key={i}>#{i+1} {e.car} - {e.total}</div>
        ))}

        <button style={menuBtn} onClick={printPage}>Print</button>
        <button style={menuBtn} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE PAGE
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
            {[...Array(21)].map((_,i)=>(
              <button
                key={i}
                disabled={locked}
                onClick={()=>setScore(cat,i)}
              >
                {i}
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
