import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [boardType, setBoardType] = useState("overall");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [results, setResults] = useState([]);

  // ✅ NEW (SAFE)
  const [lockedEvents, setLockedEvents] = useState({});
  const [archivedEvents, setArchivedEvents] = useState({});

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
    smallBtn:{padding:"10px 16px",background:"#2a2a2a",color:"#fff",border:"2px solid #555",fontSize:"14px"},
    active:{background:"#ff2a2a"},
    row:{display:"flex",gap:"8px",flexWrap:"nowrap",overflowX:"auto",marginBottom:"10px"},
    scoreRow:{display:"flex",flexWrap:"nowrap",gap:"6px",overflowX:"auto",marginBottom:"12px"},
    scoreBtn:{minWidth:"44px",height:"44px",background:"#2a2a2a",border:"2px solid #666",color:"#fff",fontSize:"14px",fontWeight:"bold"},
    input:{padding:"12px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
    label:{marginTop:"10px",marginBottom:"4px",fontSize:"14px"}
  };

  function createEvent(){
    if(!eventName) return;
    setEvents(prev => ({ ...prev, [eventName]: [] }));
    setSelectedEvent(eventName);
    setEventName("");
  }

  function addJudge(){
    if(!selectedEvent || !newJudge) return;

    // ✅ LOCK CHECK
    if(lockedEvents[selectedEvent]) {
      alert("Event is locked");
      return;
    }

    setEvents(prev => ({
      ...prev,
      [selectedEvent]: [...(prev[selectedEvent] || []), newJudge]
    }));
    setNewJudge("");
  }

  // ✅ NEW LOCK FUNCTION
  function lockEvent(){
    if(!selectedEvent) return;
    setLockedEvents(prev => ({ ...prev, [selectedEvent]: true }));
  }

  // ✅ NEW ARCHIVE FUNCTION
  function archiveEvent(){
    if(!selectedEvent) return;

    setArchivedEvents(prev => ({ ...prev, [selectedEvent]: true }));

    // remove from active list
    setEvents(prev => {
      const copy = { ...prev };
      delete copy[selectedEvent];
      return copy;
    });

    setSelectedEvent("");
    setSelectedJudge("");
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

  function submitScore(){
    if(!selectedEvent || !selectedJudge) return alert("Select Event & Judge");

    setResults(prev=>[
      ...prev,
      {
        event:selectedEvent,
        car,
        gender,
        carClass,
        total: totalScore(),
        deductions
      }
    ]);

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
    return results.filter(r=>r.event===selectedEvent);
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
          SCORE SHEET<br/>
          {selectedEvent || "NO EVENT"}<br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button style={styles.button} onClick={()=>setScreen("score")}>Resume Judging</button>
        <button style={styles.button} onClick={()=>{setBoardType("overall");setScreen("leaderboard");}}>Leaderboard</button>
      </div>
    );
  }

  // ================= JUDGE =================
  if(screen==="judge"){
    return(
      <div style={styles.container}>

        <input style={styles.input} value={eventName} onChange={(e)=>setEventName(e.target.value)} placeholder="Event Name"/>
        <button style={styles.button} onClick={createEvent}>Create Event</button>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button} onClick={()=>setSelectedEvent(e)}>
            {e} {lockedEvents[e] ? "🔒" : ""}
          </button>
        ))}

        <input style={styles.input} value={newJudge} onChange={(e)=>setNewJudge(e.target.value)} placeholder="Judge Name"/>
        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {events[selectedEvent]?.map(j=>(
          <button key={j} style={styles.button} onClick={()=>{ setSelectedJudge(j); setScreen("score"); }}>
            {j}
          </button>
        ))}

        {/* NEW BUTTONS */}
        <button style={styles.button} onClick={lockEvent}>Lock Event</button>
        <button style={styles.button} onClick={archiveEvent}>Archive Event</button>

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= SCORE + LEADERBOARD REMAIN UNCHANGED =================

  return null;
}
