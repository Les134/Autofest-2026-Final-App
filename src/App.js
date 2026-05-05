import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  deleteDoc
} from "firebase/firestore";

const ADMIN_PASSWORD = "admin123";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

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

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
  const categories = ["Instant Smoke","Volume","Constant","Driver Skill"];
  const deductionList = ["Fire","Reversing","Barrier","Stopping"];

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

    const ref = await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[],
      locked:false,
      archived:false,
      createdAt: new Date()
    });

    setSelectedEvent({ id: ref.id, name:eventName, judges:[] });
    setEventName("");
    loadEvents();
  }

  async function addJudge(){
    if(!selectedEvent || !newJudge) return;

    const updated = [...(selectedEvent.judges || []), newJudge];

    await updateDoc(doc(db,"events",selectedEvent.id),{
      judges: updated
    });

    setSelectedEvent({...selectedEvent, judges: updated});
    setNewJudge("");
  }

  async function lockEvent(){
    if(!selectedEvent || !isAdmin) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{locked:true});
    loadEvents();
  }

  async function unlockEvent(){
    if(!selectedEvent || !isAdmin) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{locked:false});
    loadEvents();
  }

  async function archiveEvent(){
    if(!selectedEvent || !isAdmin) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{archived:true});
    setSelectedEvent(null);
    loadEvents();
  }

  async function deleteEvent(){
    if(!selectedEvent || !isAdmin) return;
    await deleteDoc(doc(db,"events",selectedEvent.id));
    setSelectedEvent(null);
    loadEvents();
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleTyre(side){
    setTyres(prev => ({ ...prev, [side]: !prev[side] }));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  async function submitScore(){
    if(selectedEvent?.locked) return alert("Event Locked");

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreBonus = (tyres.left?5:0)+(tyres.right?5:0);
    const total = base + tyreBonus - deductions.length*10;

    await addDoc(collection(db,"scores"),{
      eventId:selectedEvent.id,
      car,
      gender,
      carClass,
      base,
      tyreBonus,
      deductions,
      total
    });

    alert("Saved");
    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

  function combineScores(list){
    const grouped={};
    list.forEach(r=>{
      if(!grouped[r.car]) grouped[r.car]={...r,total:0};
      grouped[r.car].total += r.total;
    });
    return Object.values(grouped);
  }

  function sort(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  function formatRow(r,i){
    const d = r.deductions.length ? " - "+r.deductions.join(", ") : "";
    return `#${i+1} | Car ${r.car} | ${r.gender} ${r.base+r.tyreBonus}${d} = ${r.total}`;
  }

  function adminLogin(){
    const pass = prompt("Enter Admin Password");
    if(pass===ADMIN_PASSWORD){
      setIsAdmin(true);
      alert("Admin unlocked");
    } else alert("Wrong password");
  }

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>AUTOFEST</h1>

        <button onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button onClick={()=>{loadScores(); setScreen("leaderboard");}}>Leaderboards</button>

        <button onClick={adminLogin}>Admin Login</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>

        <input value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="Event"/>
        <button onClick={createEvent}>Create Event</button>

        {events.filter(e=>!e.archived).map(e=>(
          <button key={e.id} onClick={()=>setSelectedEvent(e)}>
            {e.name} {e.locked ? "(LOCKED)" : ""}
          </button>
        ))}

        {isAdmin && (
          <>
            <button onClick={lockEvent}>Lock</button>
            <button onClick={unlockEvent}>Unlock</button>
            <button onClick={archiveEvent}>Archive</button>
            <button onClick={deleteEvent}>Delete</button>
          </>
        )}

        <input value={newJudge} onChange={e=>setNewJudge(e.target.value)} placeholder="Judge"/>
        <button onClick={addJudge}>Add Judge</button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j} onClick={()=>{setSelectedJudge(j); setScreen("score");}}>
            {j}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{selectedEvent?.name}</h3>

        <input value={car} onChange={e=>setCar(e.target.value)} placeholder="Car No"/>
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

        <button onClick={()=>toggleTyre("left")}>Left +5</button>
        <button onClick={()=>toggleTyre("right")}>Right +5</button>

        {deductionList.map(d=>(
          <button key={d} onClick={()=>toggleDeduction(d)}>{d}</button>
        ))}

        <button onClick={submitScore}>Submit</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    const data = sort(combineScores(results));

    return(
      <div style={{padding:20}}>
        {data.map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        <button onClick={()=>window.print()}>Print</button>
        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
