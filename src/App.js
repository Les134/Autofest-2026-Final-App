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
    if(!selectedEvent || selectedEvent.locked) return;

    const updated=[...selectedEvent.judges,newJudge];

    await updateDoc(doc(db,"events",selectedEvent.id),{
      judges:updated
    });

    setSelectedEvent({...selectedEvent,judges:updated});
    setNewJudge("");
  }

  async function lockEvent(){
    await updateDoc(doc(db,"events",selectedEvent.id),{
      locked:true
    });

    setSelectedEvent({...selectedEvent,locked:true});
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
    if(selectedEvent.locked) return alert("Event locked");

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
      <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"}}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={{
          padding:"32px",
          marginBottom:"12px",
          background:"#ff2a2a",
          color:"#fff",
          fontSize:"22px",
          fontWeight:"bold",
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

        <button onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button onClick={()=>setScreen("leaderboard")}>Leaderboard</button>
      </div>
    );
  }

  // ================= JUDGE =================
  if(screen==="judge"){
    return(
      <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"}}>

        <input value={eventName} onChange={(e)=>setEventName(e.target.value)} placeholder="Event Name"/>
        <button onClick={createEvent}>Create Event</button>

        {events.map(e=>(
          <button key={e.id} onClick={()=>{
            setSelectedEvent(e);
            loadScores(e.id);
          }}>
            {e.name} {e.locked ? "🔒":""}
          </button>
        ))}

        {selectedEvent && (
          <>
            <input value={newJudge} onChange={(e)=>setNewJudge(e.target.value)} placeholder="Judge"/>
            <button onClick={addJudge}>Add Judge</button>

            {selectedEvent.judges.map(j=>(
              <button key={j} onClick={()=>{
                setSelectedJudge(j);
                setScreen("score");
              }}>
                {j}
              </button>
            ))}

            <button onClick={lockEvent}>🔒 Lock Event</button>
          </>
        )}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= SCORE =================
  if(screen==="score"){
    return(
      <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"}}>

        <h2>{selectedEvent?.name}</h2>
        <h3>{selectedJudge}</h3>

        <input value={car} onChange={(e)=>setCar(e.target.value)} placeholder="Car"/>

        {categories.map(cat=>(
          <div key={cat}>
            <p>{cat}</p>
            {[...Array(20)].map((_,i)=>(
              <button key={i} onClick={()=>setScore(cat,i+1)}>{i+1}</button>
            ))}
          </div>
        ))}

        <button onClick={submitScore}>Submit</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  if(screen==="leaderboard"){
    const data = sort(combineScores(getEventResults()));

    return(
      <div style={{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"}}>
        <h2>Leaderboard</h2>

        <button onClick={printPage}>Print</button>

        {data.map((r,i)=>{
          const d = r.deductions.length ? ` - ${r.deductions.join(", ")}` : "";
          return(
            <div key={i}>
              #{i+1} | {r.car} {r.gender} | {r.carClass}{d} ={r.total}
            </div>
          );
        })}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
