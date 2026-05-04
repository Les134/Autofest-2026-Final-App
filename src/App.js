import React, { useState } from "react";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
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

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"},

    button:{
      padding:"16px",
      margin:"6px 0",
      background:"#2a2a2a",
      color:"#fff",
      border:"2px solid #555",
      width:"100%"
    },

    smallBtn:{
      padding:"8px 12px",
      background:"#2a2a2a",
      color:"#fff",
      border:"1px solid #666"
    },

    active:{background:"#ff2a2a"},

    row:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"},

    scoreRow:{
      display:"flex",
      flexWrap:"nowrap",
      gap:"4px",
      overflowX:"auto",
      marginBottom:"10px"
    },

    scoreBtn:{
      minWidth:"32px",
      height:"32px",
      background:"#2a2a2a",
      border:"1px solid #666",
      color:"#fff",
      fontSize:"12px"
    },

    input:{
      padding:"12px",
      margin:"6px 0",
      width:"100%",
      background:"#111",
      color:"#fff",
      border:"2px solid #555"
    },

    label:{
      marginTop:"10px",
      marginBottom:"4px",
      fontSize:"13px"
    }
  };

  function createEvent(){
    if(!eventName) return;
    setEvents(prev => ({ ...prev, [eventName]: [] }));
    setSelectedEvent(eventName);
    setEventName("");
  }

  function addJudge(){
    if(!selectedEvent || !newJudge) return;
    setEvents(prev => ({
      ...prev,
      [selectedEvent]: [...(prev[selectedEvent] || []), newJudge]
    }));
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

  function submitScore(){
    if(!selectedEvent || !selectedJudge) return alert("Select Event & Judge");

    setResults(prev=>[
      ...prev,
      { event:selectedEvent, car, gender, carClass, total: totalScore(), deductions }
    ]);

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

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
          {selectedEvent || "NO EVENT"}
          <br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Event / Judge Login
        </button>

        <button style={styles.button} onClick={()=>setScreen("score")}>
          Resume Judging
        </button>

        <button style={styles.button}>Leaderboard</button>
        <button style={styles.button}>Class Leaderboard</button>
        <button style={styles.button}>Female Overall</button>
        <button style={styles.button}>Top 150</button>
        <button style={styles.button}>Top 30 Finals</button>
      </div>
    );
  }

  // ================= EVENT / JUDGE =================
  if(screen==="judge"){
    return(
      <div style={styles.container}>
        <h2>Create / Select Event</h2>

        <input style={styles.input}
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
          placeholder="Event Name"
        />

        <button style={styles.button} onClick={createEvent}>Create Event</button>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button}
            onClick={()=>setSelectedEvent(e)}>
            {e}
          </button>
        ))}

        <h3>Add Judges</h3>

        <input style={styles.input}
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
          placeholder="Judge Name"
        />

        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {events[selectedEvent]?.map(j=>(
          <button key={j} style={styles.button}
            onClick={()=>{
              setSelectedJudge(j);
              setScreen("score");
            }}>
            {j}
          </button>
        ))}

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

        {/* INLINE GENDER */}
        <div style={styles.row}>
          <button style={{...styles.smallBtn,...(gender==="M"?styles.active:{})}} onClick={()=>setGender("M")}>Male</button>
          <button style={{...styles.smallBtn,...(gender==="F"?styles.active:{})}} onClick={()=>setGender("F")}>Female</button>
        </div>

        {/* INLINE CLASS */}
        <div style={styles.row}>
          {classes.map(c=>(
            <button key={c}
              style={{...styles.smallBtn,...(carClass===c?styles.active:{})}}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* SCORE ROWS */}
        {categories.map(cat=>(
          <div key={cat}>
            <div style={styles.label}>{cat}</div>
            <div style={styles.scoreRow}>
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

        {/* TYRES */}
        <div style={styles.row}>
          <button style={{...styles.smallBtn,...(tyres.left?styles.active:{})}} onClick={()=>toggleTyre("left")}>Left +5</button>
          <button style={{...styles.smallBtn,...(tyres.right?styles.active:{})}} onClick={()=>toggleTyre("right")}>Right +5</button>
        </div>

        {/* DEDUCTIONS */}
        <div style={styles.row}>
          {deductionList.map(d=>(
            <button key={d}
              style={{...styles.smallBtn,...(deductions.includes(d)?styles.active:{})}}
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

  return null;
}
