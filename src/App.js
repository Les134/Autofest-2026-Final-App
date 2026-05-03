import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState({});
  const [eventName, setEventName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [judges, setJudges] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [newJudge, setNewJudge] = useState("");

  // SCORING
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
    container: { background:"#000",color:"#fff",minHeight:"100vh",padding:"20px",fontFamily:"Arial" },
    button: { width:"100%",padding:"14px",margin:"6px 0",background:"#1c2333",color:"#fff",border:"1px solid #333" },
    active: { background:"red" },
    input: { width:"100%",padding:"10px",margin:"6px 0" },
    row: { display:"flex",flexWrap:"wrap",gap:"4px" },
    scoreBtn: { width:"38px",padding:"10px" }
  };

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d]
    );
  }

  function totalScore(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    return base + tyres - (deductions.length * 10);
  }

  function submitScore(){
    if(!car) return alert("Enter car number");

    alert("Score Submitted");

    setCar("");
    setGender("");
    setCarClass("");
    setScores({});
    setTyres(0);
    setDeductions([]);
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
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return(
      <div style={styles.container}>

        <h2>Setup Event</h2>

        <input style={styles.input} placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

        <button style={styles.button} onClick={()=>{
          const name = eventName.trim();
          if(!name) return alert("Enter event name");

          setEvents(prev=>({...prev,[name]:[]}));
          setSelectedEvent(name);
          setJudges([]);
          setEventName("");
        }}>
          Create Event
        </button>

        <h3>Select Event</h3>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button}
            onClick={()=>{setSelectedEvent(e);setJudges(events[e]);}}>
            {e}
          </button>
        ))}

        <h3>Add Judges (max 6)</h3>

        <input style={styles.input} placeholder="Judge Name"
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
        />

        <button style={styles.button} onClick={()=>{
          if(!selectedEvent) return alert("Select event first");

          const name = newJudge.trim();
          if(!name) return alert("Enter judge name");

          if(judges.length>=6) return alert("Max 6 judges");

          const updated=[...judges,name];

          setEvents(prev=>({...prev,[selectedEvent]:updated}));
          setJudges(updated);
          setNewJudge("");
        }}>
          Add Judge
        </button>

        <h4>Current Judges:</h4>
        {judges.map(j=><div key={j}>{j}</div>)}

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

  // SCORE SCREEN
  if(screen==="score"){
    return(
      <div style={styles.container}>

        <h2>{selectedEvent}</h2>
        <h3>{selectedJudge}</h3>

        <input style={styles.input}
          placeholder="Car # / Rego"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        {/* Gender */}
        <div style={styles.row}>
          <button style={{...styles.button,...(gender==="Male"?styles.active:{})}}
            onClick={()=>setGender("Male")}>Male</button>

          <button style={{...styles.button,...(gender==="Female"?styles.active:{})}}
            onClick={()=>setGender("Female")}>Female</button>
        </div>

        {/* Classes */}
        {classes.map(c=>(
          <button key={c}
            style={{...styles.button,...(carClass===c?styles.active:{})}}
            onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}

        {/* Scores */}
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

        {/* Tyres */}
        <div style={styles.row}>
          <button style={styles.button} onClick={()=>setTyres(t=>t+5)}>Left Tyre +5</button>
          <button style={styles.button} onClick={()=>setTyres(t=>t+5)}>Right Tyre +5</button>
        </div>

        {/* Deductions */}
        {deductionList.map(d=>(
          <button key={d}
            style={{...styles.button,...(deductions.includes(d)?styles.active:{})}}
            onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}

        <h2>Total: {totalScore()}</h2>

        <button style={styles.button} onClick={submitScore}>
          Submit
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Back
        </button>

      </div>
    );
  }

  return null;
}
    
