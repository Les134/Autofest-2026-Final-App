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

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl Open/Rotary"];
  const categories = ["Instant Smoke","Volume of Smoke","Constant Smoke","Driver Skill & Control"];
  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  // LOAD EVENTS
  useEffect(()=>{ loadEvents(); },[]);

  async function loadEvents(){
    const snap = await getDocs(collection(db,"events"));
    setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  async function loadScores(){
    if(!selectedEvent) return;
    const q = query(collection(db,"scores"), where("eventId","==",selectedEvent.id));
    const snap = await getDocs(q);
    setResults(snap.docs.map(d=>d.data()));
  }

  async function createEvent(){
    if(!eventName) return;

    await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[],
      locked:false,
      archived:false
    });

    setEventName("");
    loadEvents();
  }

  async function addJudge(){
    if(!selectedEvent || !newJudge) return;
    if(selectedEvent.locked) return alert("Event Locked");

    await updateDoc(doc(db,"events",selectedEvent.id),{
      judges:[...(selectedEvent.judges||[]), newJudge]
    });

    setNewJudge("");
    loadEvents();
  }

  async function lockEvent(){
    if(!selectedEvent) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{locked:true});
    loadEvents();
  }

  async function archiveEvent(){
    if(!selectedEvent) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{archived:true});
    setSelectedEvent(null);
    loadEvents();
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

  function isValid(){
    return car && gender && carClass && categories.every(c=>scores[c]);
  }

  async function submitScore(){
    if(selectedEvent.locked) return alert("Event Locked");
    if(!isValid()) return alert("Complete all fields");

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreBonus = (tyres.left?5:0)+(tyres.right?5:0);
    const total = base + tyreBonus - deductions.length*10;

    await addDoc(collection(db,"scores"),{
      eventId:selectedEvent.id,
      judge:selectedJudge,
      car,
      gender,
      carClass,
      base,
      tyreBonus,
      deductions,
      total
    });

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

  function combineScores(list){
    const grouped={};

    list.forEach(r=>{
      if(!grouped[r.car]){
        grouped[r.car]={...r, total:0, base:0, tyreBonus:0, deductions:[]};
      }
      grouped[r.car].total += r.total;
      grouped[r.car].base += r.base;
      grouped[r.car].tyreBonus += r.tyreBonus;
      grouped[r.car].deductions = [...new Set([...grouped[r.car].deductions, ...r.deductions])];
    });

    return Object.values(grouped);
  }

  function sort(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  function formatRow(r,i){
    const d = r.deductions.length ? " - " + r.deductions.join(", ").toLowerCase() : "";
    return `#${i+1} | Car No ${r.car} | ${r.gender} ${r.base + r.tyreBonus}${d} = ${r.total}`;
  }

  function printPage(){ window.print(); }

  // HOME
  if(screen==="home"){
    return(
      <div>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button onClick={()=>setScreen("score")}>
          SCORE SHEET<br/>
          {selectedEvent?.name || "NO EVENT"}<br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button onClick={()=>{loadScores(); setScreen("leaderboard");}}>Leaderboard</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div>

        <input value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="Event"/>
        <button onClick={createEvent}>Create Event</button>

        {events.filter(e=>!e.archived).map(e=>(
          <button key={e.id} onClick={()=>setSelectedEvent(e)}>
            {e.name} {e.locked ? "(LOCKED)" : ""}
          </button>
        ))}

        <button onClick={lockEvent}>Lock Event</button>
        <button onClick={archiveEvent}>Archive Event</button>

        <input value={newJudge} onChange={e=>setNewJudge(e.target.value)} placeholder="Judge"/>
        <button onClick={addJudge}>Add Judge</button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j} onClick={()=>{setSelectedJudge(j); setScreen("score");}}>
            {j}
          </button>
        ))}

      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div>

        <h3>{selectedEvent?.name}</h3>
        <h4>{selectedJudge}</h4>

        <input value={car} onChange={e=>setCar(e.target.value)} placeholder="Car No / Rego"/>

        <button onClick={()=>setGender("M")}>M</button>
        <button onClick={()=>setGender("F")}>F</button>

        {classes.map(c=>(
          <button key={c} onClick={()=>setCarClass(c)}>{c}</button>
        ))}

        {categories.map(cat=>(
          <div key={cat}>
            {cat}
            {[...Array(20)].map((_,i)=>(
              <button key={i} onClick={()=>setScore(cat,i+1)}>{i+1}</button>
            ))}
          </div>
        ))}

        <button onClick={submitScore}>Submit</button>

      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    const data = sort(combineScores(results));

    return(
      <div>

        <button onClick={printPage}>Print</button>

        {data.map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>

      </div>
    );
  }

  return null;
}
