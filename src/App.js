import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [boardType, setBoardType] = useState("overall");

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [results, setResults] = useState([]);

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");
  const [scores, setScores] = useState({});
  const [tyres, setTyres] = useState({ left:false, right:false });
  const [deductions, setDeductions] = useState([]);

  const classes = [
    "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl Open/Rotary"
  ];

  const categories = [
    "Instant Smoke",
    "Volume of Smoke",
    "Constant Smoke",
    "Driver Skill & Control"
  ];

  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  useEffect(()=>{
    loadEvents();
  },[]);

  async function loadEvents(){
    const snap = await getDocs(collection(db,"events"));
    const data = snap.docs.map(d=>({id:d.id,...d.data()}));
    setEvents(data);
  }

  async function loadScores(eventId){
    const q = query(collection(db,"scores"), where("eventId","==",eventId));
    const snap = await getDocs(q);
    setResults(snap.docs.map(d=>d.data()));
  }

  async function createEvent(){
    if(!eventName) return;

    await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[],
      locked:false
    });

    setEventName("");
    loadEvents();
  }

  async function addJudge(){
    if(!selectedEvent || !newJudge) return;

    const updated=[...(selectedEvent.judges||[]),newJudge];

    await updateDoc(doc(db,"events",selectedEvent.id),{
      judges:updated
    });

    setSelectedEvent({...selectedEvent,judges:updated});
    setNewJudge("");
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  function toggleTyre(side){
    setTyres(prev => ({ ...prev, [side]: !prev[side] }));
  }

  function totalScore(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreBonus = (tyres.left?5:0)+(tyres.right?5:0);
    return base + tyreBonus - deductions.length*10;
  }

  async function submitScore(){
    if(!selectedEvent || !selectedJudge) return alert("Select Event & Judge");

    await addDoc(collection(db,"scores"),{
      eventId:selectedEvent.id,
      car,
      gender,
      carClass,
      total: totalScore(),
      deductions
    });

    loadScores(selectedEvent.id);

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

  function combineScores(list){
    const grouped={};
    list.forEach(r=>{
      if(!grouped[r.car]) grouped[r.car]={...r, totals:[]};
      grouped[r.car].totals.push(r.total);
    });

    return Object.values(grouped).map(g=>{
      let scores=[...g.totals].sort((a,b)=>a-b);
      if(scores.length>2) scores=scores.slice(1,-1);
      const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
      return {...g,total:Math.round(avg)};
    });
  }

  function sort(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  function getEventResults(){
    return results;
  }

  function printPage(){ window.print(); }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={{
          padding:"32px",
          marginBottom:"12px",
          background:"#ff2a2a",
          color:"#fff",
          fontSize:"22px",
          fontWeight:"bold",
          border:"2px solid #ff0000",
          width:"100%"
        }}
        onClick={()=>setScreen("score")}
        >
          SCORE SHEET
          <br/>
          {selectedEvent?.name || "NO EVENT"}
          <br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Event / Judge Login
        </button>

        <button style={styles.button} onClick={()=>setScreen("score")}>
          Resume Judging
        </button>

        <button style={styles.button} onClick={()=>{setBoardType("overall");setScreen("leaderboard");}}>
          Leaderboard
        </button>

        <button style={styles.button} onClick={()=>{setBoardType("class");setScreen("leaderboard");}}>
          Class Leaderboard
        </button>

        <button style={styles.button} onClick={()=>{setBoardType("female");setScreen("leaderboard");}}>
          Female Overall
        </button>

        <button style={styles.button} onClick={()=>{setBoardType("top150");setScreen("leaderboard");}}>
          Top 150
        </button>

        <button style={styles.button} onClick={()=>{setBoardType("top30");setScreen("leaderboard");}}>
          Top 30 Finals
        </button>
      </div>
    );
  }

  // ================= JUDGE =================
  if(screen==="judge"){
    return(
      <div style={styles.container}>

        <input style={styles.input} value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
          placeholder="Event Name"
        />

        <button style={styles.button} onClick={createEvent}>Create Event</button>

        {events.map(e=>(
          <button key={e.id} style={styles.button}
            onClick={()=>{ setSelectedEvent(e); loadScores(e.id); }}>
            {e.name}
          </button>
        ))}

        <input style={styles.input} value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
          placeholder="Judge Name"
        />

        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j} style={styles.button}
            onClick={()=>{ setSelectedJudge(j); setScreen("score"); }}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= KEEP REST EXACT SAME =================
  // (score + leaderboard sections unchanged from your file)

  return null;
}
