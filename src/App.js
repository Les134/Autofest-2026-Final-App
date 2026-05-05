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

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"},
    button:{padding:"16px",margin:"6px 0",background:"#2a2a2a",color:"#fff",border:"2px solid #555",width:"100%"},
    smallBtn:{padding:"10px",background:"#2a2a2a",color:"#fff",border:"2px solid #555"},
    active:{background:"#ff2a2a"},
    row:{display:"flex",gap:"8px",overflowX:"auto",marginBottom:"10px"},
    scoreRow:{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"10px"},
    scoreBtn:{minWidth:"44px",height:"44px",background:"#2a2a2a",border:"2px solid #666",color:"#fff"},
    input:{padding:"12px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
  };

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
    if(selectedEvent?.locked) return alert("Event Locked");
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
      if(!grouped[r.car]) grouped[r.car]={...r,total:0,base:0,tyreBonus:0,deductions:[]};
      grouped[r.car].total += r.total;
      grouped[r.car].base += r.base;
      grouped[r.car].tyreBonus += r.tyreBonus;
      grouped[r.car].deductions = [...new Set([...grouped[r.car].deductions,...r.deductions])];
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
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={{padding:"32px",background:"#ff2a2a",width:"100%",fontWeight:"bold"}}
        onClick={()=>setScreen("score")}>
          SCORE SHEET<br/>
          {selectedEvent?.name || "NO EVENT"}<br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button style={styles.button} onClick={()=>setScreen("score")}>Resume Judging</button>

        <button style={styles.button} onClick={()=>{loadScores(); setBoardType("overall"); setScreen("leaderboard");}}>Leaderboard</button>
        <button style={styles.button} onClick={()=>{loadScores(); setBoardType("class"); setScreen("leaderboard");}}>Class Leaderboard</button>
        <button style={styles.button} onClick={()=>{loadScores(); setBoardType("female"); setScreen("leaderboard");}}>Female Overall</button>
        <button style={styles.button} onClick={()=>{loadScores(); setBoardType("top150"); setScreen("leaderboard");}}>Top 150</button>
        <button style={styles.button} onClick={()=>{loadScores(); setBoardType("top30"); setScreen("leaderboard");}}>Top 30 Finals</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={styles.container}>
        <input style={styles.input} value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="Event Name"/>
        <button style={styles.button} onClick={createEvent}>Create Event</button>

        {events.filter(e=>!e.archived).map(e=>(
          <button key={e.id} style={styles.button} onClick={()=>setSelectedEvent(e)}>
            {e.name} {e.locked ? "(LOCKED)" : ""}
          </button>
        ))}

        <button style={styles.button} onClick={lockEvent}>Lock Event</button>
        <button style={styles.button} onClick={archiveEvent}>Archive Event</button>

        <input style={styles.input} value={newJudge} onChange={e=>setNewJudge(e.target.value)} placeholder="Judge Name"/>
        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j} style={styles.button} onClick={()=>{setSelectedJudge(j); setScreen("score");}}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={styles.container}>
        <h3>{selectedEvent?.name}</h3>
        <h4>{selectedJudge}</h4>

        <input style={styles.input} value={car} onChange={e=>setCar(e.target.value)} placeholder="Car No / Rego"/>

        <div style={styles.row}>
          <button style={{...styles.smallBtn,...(gender==="M"?styles.active:{})}} onClick={()=>setGender("M")}>Male</button>
          <button style={{...styles.smallBtn,...(gender==="F"?styles.active:{})}} onClick={()=>setGender("F")}>Female</button>
        </div>

        <div style={styles.row}>
          {classes.map(c=>(
            <button key={c} style={{...styles.smallBtn,...(carClass===c?styles.active:{})}} onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <div>{cat}</div>
            <div style={styles.scoreRow}>
              {[...Array(20)].map((_,i)=>(
                <button key={i} style={{...styles.scoreBtn,...(scores[cat]===i+1?styles.active:{})}} onClick={()=>setScore(cat,i+1)}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <h2>Total: {Object.values(scores).reduce((a,b)=>a+b,0)}</h2>

        <button style={styles.button} onClick={submitScore}>Submit</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    const data = sort(combineScores(results));

    return(
      <div style={styles.container}>
        <button style={styles.button} onClick={printPage}>Print</button>

        {data.map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
