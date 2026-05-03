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
  const [tyres, setTyres] = useState(0);
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
    active:{background:"#ff2a2a"},
    row:{display:"flex",flexWrap:"wrap",gap:"6px"},
    input:{padding:"14px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
    scoreBtn:{width:"44px",height:"44px",background:"#2a2a2a",border:"2px solid #555"}
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

    setCar("");
    setGender("");
    setCarClass("");
    setScores({});
    setTyres(0);
    setDeductions([]);
  }

  // 🔥 PRO COMBINE (DROP HIGH & LOW)
  function combineScores(list) {
    const grouped = {};

    list.forEach(r => {
      if (!grouped[r.car]) {
        grouped[r.car] = {
          car: r.car,
          gender: r.gender,
          carClass: r.carClass,
          totals: [],
          deductions: r.deductions || []
        };
      }
      grouped[r.car].totals.push(r.total);
    });

    return Object.values(grouped).map(g => {
      let scores = [...g.totals].sort((a,b)=>a-b);

      if (scores.length > 2) {
        scores = scores.slice(1, -1); // drop lowest & highest
      }

      const avg = scores.reduce((a,b)=>a+b,0) / scores.length;

      return {
        car:g.car,
        gender:g.gender,
        carClass:g.carClass,
        total:Math.round(avg),
        deductions:g.deductions
      };
    });
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

  function printPage(){
    window.print();
  }

  // HOME
  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>🔥 AUTOFEST PRO JUDGING 🔥</h1>

        <button style={styles.button} onClick={()=>setScreen("setup")}>New Event</button>
        <button style={styles.button} onClick={()=>setScreen("judge")}>Judge Login</button>
        <button style={styles.button} onClick={()=>setScreen("score")}>Score Sheet</button>

        <h3>Leaderboards</h3>

        <button style={styles.button}
          onClick={()=>{setBoardType("overall");setScreen("leaderboard");}}>
          Overall
        </button>

        <button style={styles.button}
          onClick={()=>{setBoardType("female");setScreen("leaderboard");}}>
          Female
        </button>

        {classes.map(c=>(
          <button key={c} style={styles.button}
            onClick={()=>{setBoardType(c);setScreen("leaderboard");}}>
            {c}
          </button>
        ))}
      </div>
    );
  }

  // SETUP
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
          setSelectedEvent(eventName);
          setJudges([]);
          setEventName("");
        }}>
          Create
        </button>

        {Object.keys(events).map(e=>(
          <button key={e} style={styles.button}
            onClick={()=>{setSelectedEvent(e);setJudges(events[e]);}}>
            {e}
          </button>
        ))}

        <input style={styles.input}
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
          placeholder="Judge Name"
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

  // SCORE
  if(screen==="score"){
    return(
      <div style={styles.container}>
        <h2>{selectedEvent}</h2>
        <h3>{selectedJudge}</h3>

        <input style={styles.input}
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Entrant No"
        />

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

          <button style={styles.button} onClick={()=>setTyres(t=>t+5)}>Tyre +5</button>

          {deductionList.map(d=>(
            <button key={d}
              style={{...styles.button,...(deductions.includes(d)?styles.active:{})}}
              onClick={()=>toggleDeduction(d)}>
              {d}
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

        <h2>Total: {totalScore()}</h2>

        <button style={styles.button} onClick={submitScore}>Submit</button>

        <button style={styles.button}
          onClick={()=>setLockedEvents(prev=>({...prev,[selectedEvent]:true}))}>
          🔒 Lock Event
        </button>

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){

    let data = combineScores(getEventResults());

    if(boardType==="female"){
      data = data.filter(r=>r.gender==="F");
    } else if(boardType!=="overall"){
      data = data.filter(r=>r.carClass===boardType);
    }

    return(
      <div style={styles.container}>
        <h2>{boardType} Leaderboard</h2>

        <button style={styles.button} onClick={printPage}>Print</button>

        {sort(data).map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return null;
}
