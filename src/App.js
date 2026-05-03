import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
  const [judges, setJudges] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [lockedEvents, setLockedEvents] = useState({});
  const [results, setResults] = useState([]);

  // SCORE STATE
  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");
  const [scores, setScores] = useState({});
  const [tyres, setTyres] = useState(0);
  const [deductions, setDeductions] = useState([]);

  const categories = [
    "Instant Smoke",
    "Volume of Smoke",
    "Constant Smoke",
    "Driver Skill & Control"
  ];

  const classes = [
    "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"
  ];

  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{padding:"10px",margin:"4px",background:"#1c2333",color:"#fff"},
    active:{background:"red"},
    row:{display:"flex",flexWrap:"wrap",gap:"4px"},
    input:{padding:"10px",margin:"6px 0",width:"100%"},
    scoreBtn:{width:"36px",margin:"2px"}
  };

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  function totalScore(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    return base + tyres - deductions.length*10;
  }

  function submitScore(){
    if(lockedEvents[selectedEvent]) return alert("Event Locked");

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

    // RESET
    setCar("");
    setGender("");
    setCarClass("");
    setScores({});
    setTyres(0);
    setDeductions([]);
  }

  function printPage(){
    window.print();
  }

  function formatRow(r,i){
    const d = r.deductions.length ? ` - (${r.deductions.join(", ")})` : "";
    return `#${i+1}${r.gender} | ${r.car} | ${r.carClass} | ${r.total}${d}`;
  }

  function getEventResults(){
    return results.filter(r=>r.event===selectedEvent);
  }

  function sort(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  // HOME
  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Judge Login
        </button>

        <button style={styles.button} onClick={()=>setScreen("setup")}>
          Setup Event
        </button>

        <button style={styles.button} onClick={()=>setScreen("leaderboard")}>
          Leaderboards
        </button>
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return(
      <div style={styles.container}>
        <h2>Setup Event</h2>

        <input style={styles.input}
          placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

        <button style={styles.button} onClick={()=>{
          const name = eventName.trim();
          if(!name) return;
          setEvents(prev=>({...prev,[name]:[]}));
          setSelectedEvent(name);
          setJudges([]);
          setEventName("");
        }}>
          Create Event
        </button>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button}
            onClick={()=>{setSelectedEvent(e);setJudges(events[e]);}}>
            {e}
          </button>
        ))}

        <input style={styles.input}
          placeholder="Judge Name"
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
        />

        <button style={styles.button} onClick={()=>{
          if(!selectedEvent) return;
          if(judges.length>=6) return;

          const updated=[...judges,newJudge];

          setEvents(prev=>({...prev,[selectedEvent]:updated}));
          setJudges(updated);
          setNewJudge("");
        }}>
          Add Judge
        </button>

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if(screen==="judge"){
    return(
      <div style={styles.container}>
        <h2>Select Event</h2>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button}
            onClick={()=>{setSelectedEvent(e);setJudges(events[e]);}}>
            {e}
          </button>
        ))}

        <h3>Select Judge</h3>

        {judges.map(j=>(
          <button key={j} style={styles.button}
            onClick={()=>{setSelectedJudge(j);setScreen("score");}}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // SCORE SHEET
  if(screen==="score"){
    return(
      <div style={styles.container}>
        <h2>{selectedEvent}</h2>
        <h3>{selectedJudge}</h3>

        <input style={styles.input}
          placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        {/* ONE ROW */}
        <div style={styles.row}>

          <button style={{...styles.button,...(gender==="M"?styles.active:{})}}
            onClick={()=>setGender("M")}>M</button>

          <button style={{...styles.button,...(gender==="F"?styles.active:{})}}
            onClick={()=>setGender("F")}>F</button>

          {classes.map(c=>(
            <button key={c}
              style={{...styles.button,...(carClass===c?styles.active:{})}}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}

          <button style={styles.button} onClick={()=>setTyres(t=>t+5)}>
            Tyre +5
          </button>

          {deductionList.map(d=>(
            <button key={d}
              style={{...styles.button,...(deductions.includes(d)?styles.active:{})}}
              onClick={()=>toggleDeduction(d)}>
              {d}
            </button>
          ))}
        </div>

        {/* CATEGORY SCORES */}
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

        <h2>Total: {totalScore()}</h2>

        <button style={styles.button} onClick={submitScore}>
          Submit
        </button>

        <button style={styles.button}
          onClick={()=>setLockedEvents(prev=>({...prev,[selectedEvent]:true}))}>
          🔒 Lock Event
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Back
        </button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    const data = getEventResults();

    return(
      <div style={styles.container}>
        <h2>Leaderboards</h2>

        <button style={styles.button} onClick={printPage}>Print</button>

        <h3>Overall</h3>
        {sort(data).map((r,i)=><div key={i}>{formatRow(r,i)}</div>)}

        <h3>Female</h3>
        {sort(data.filter(r=>r.gender==="F")).map((r,i)=><div key={i}>{formatRow(r,i)}</div>)}

        {classes.map(c=>(
          <div key={c}>
            <h3>{c}</h3>
            {sort(data.filter(r=>r.carClass===c)).map((r,i)=><div key={i}>{formatRow(r,i)}</div>)}
          </div>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return null;
}
