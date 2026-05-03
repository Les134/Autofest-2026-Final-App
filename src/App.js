import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [boardType, setBoardType] = useState("overall");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
  const [judges, setJudges] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [results, setResults] = useState([]);
  const [lockedEvents, setLockedEvents] = useState({});

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");
  const [scores, setScores] = useState({});
  const [tyres, setTyres] = useState({ left:false, right:false });
  const [deductions, setDeductions] = useState([]);

  const categories = [
    "Instant Smoke",
    "Volume of Smoke",
    "Constant Smoke",
    "Driver Skill & Control"
  ];

  const classes = [
    "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl Open/Rotary"
  ];

  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"},
    button:{padding:"16px",margin:"6px 0",background:"#2a2a2a",color:"#fff",border:"2px solid #555"},
    bigButton:{
      padding:"22px",
      margin:"10px 0",
      background:"#ff2a2a",
      color:"#fff",
      fontSize:"20px",
      border:"2px solid #ff0000"
    },
    active:{background:"#ff2a2a"},
    row:{display:"flex",flexWrap:"wrap",gap:"6px"},
    input:{padding:"14px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
    scoreBtn:{width:"44px",height:"44px",background:"#2a2a2a",border:"2px solid #555",color:"#fff"}
  };

  function selectEvent(e){
    setSelectedEvent(e);
    setJudges(events[e] || []);
  }

  function addJudge(){
    if(!selectedEvent) return;
    if(lockedEvents[selectedEvent]) return alert("Event locked");
    if(judges.length>=6) return;

    const updated=[...judges,newJudge];
    setEvents(prev=>({...prev,[selectedEvent]:updated}));
    setJudges(updated);
    setNewJudge("");
  }

  function lockEvent(){
    setLockedEvents(prev=>({...prev,[selectedEvent]:true}));
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
    setResults(prev=>[
      ...prev,
      { event:selectedEvent, car, gender, carClass, total: totalScore(), deductions }
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

        {/* BIG SCORE BUTTON */}
        <button style={styles.bigButton} onClick={()=>setScreen("score")}>
          SCORE SHEET
          <br/>
          {selectedEvent || "No Event"} | {selectedJudge || "No Judge"}
        </button>

        <h3>Leaderboards</h3>

        <button style={styles.button} onClick={()=>{setBoardType("top150");setScreen("leaderboard");}}>Top 150</button>
        <button style={styles.button} onClick={()=>{setBoardType("top30");setScreen("leaderboard");}}>Top 30</button>
        <button style={styles.button} onClick={()=>{setBoardType("female");setScreen("leaderboard");}}>Female</button>

        <h4>Leaders by Class</h4>
        {classes.map(c=>(
          <button key={c} style={styles.button}
            onClick={()=>{setBoardType(c);setScreen("leaderboard");}}>
            {c}
          </button>
        ))}

        {/* MOVED TO BOTTOM */}
        <button style={styles.button} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={styles.button} onClick={()=>setScreen("judge")}>Judge Login</button>
      </div>
    );
  }

  // ================= SETUP =================
  if(screen==="setup"){
    return(
      <div style={styles.container}>
        <h2>Create Event</h2>

        <input style={styles.input}
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
          placeholder="Event Name"
        />

        <button style={styles.button} onClick={()=>{
          if(!eventName) return;
          setEvents(prev=>({...prev,[eventName]:[]}));
          setEventName("");
        }}>
          Create
        </button>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button} onClick={()=>selectEvent(e)}>
            {e} {lockedEvents[e] ? "🔒" : ""}
          </button>
        ))}

        <input style={styles.input}
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
          placeholder="Judge Name"
        />

        <button style={styles.button} onClick={addJudge}>Add Judge</button>
        <button style={styles.button} onClick={lockEvent}>🔒 Lock Event</button>

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= SCORE =================
  if(screen==="score"){
    return(
      <div style={styles.container}>

        <h2>{selectedEvent}</h2>
        <h3>{selectedJudge}</h3>

        <input style={styles.input}
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Car No / Rego"
        />

        <div style={styles.row}>
          <button style={{...styles.button,...(gender==="M"?styles.active:{})}} onClick={()=>setGender("M")}>Male</button>
          <button style={{...styles.button,...(gender==="F"?styles.active:{})}} onClick={()=>setGender("F")}>Female</button>
        </div>

        <div style={styles.row}>
          {classes.map(c=>(
            <button key={c}
              style={{...styles.button,...(carClass===c?styles.active:{})}}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <p>{cat}</p>
            <div style={styles.row}>
              {[...Array(20)].map((_,i)=>(
                <button key={i}
                  style={{...styles.scoreBtn,...(scores[cat]===i+1?styles.active:{})}}
                  onClick={()=>setScore(cat,i+1)}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={styles.row}>
          <button style={{...styles.button,...(tyres.left?styles.active:{})}} onClick={()=>toggleTyre("left")}>Left Tyre +5</button>
          <button style={{...styles.button,...(tyres.right?styles.active:{})}} onClick={()=>toggleTyre("right")}>Right Tyre +5</button>
        </div>

        <div style={styles.row}>
          {deductionList.map(d=>(
            <button key={d}
              style={{...styles.button,...(deductions.includes(d)?styles.active:{})}}
              onClick={()=>toggleDeduction(d)}>
              {d}
            </button>
          ))}
        </div>

        <h2>Total: {totalScore()}</h2>

        <button style={styles.button} onClick={submitScore}>Submit</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  if(screen==="leaderboard"){

    let data = combineScores(getEventResults());

    if(boardType==="female") data = data.filter(r=>r.gender==="F");
    if(boardType==="top30") data = sort(data).slice(0,30);
    if(boardType==="top150") data = sort(data).slice(0,150);
    if(!["overall","female","top30","top150"].includes(boardType)){
      data = data.filter(r=>r.carClass===boardType);
    }

    return(
      <div style={styles.container}>
        <h2>{boardType} Leaderboard</h2>

        <button style={styles.button} onClick={printPage}>Print</button>

        {sort(data).map((r,i)=>(
          <div key={i}>#{i+1}{r.gender} | {r.car} | {r.carClass} | {r.total}</div>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
