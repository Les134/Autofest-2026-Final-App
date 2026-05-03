import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc
} from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [judges, setJudges] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judge, setJudge] = useState("");

  const [scoresDB, setScoresDB] = useState([]);

  const [newEvent, setNewEvent] = useState("");
  const [newJudges, setNewJudges] = useState("");

  const [car, setCar] = useState("");
  const [driverName, setDriverName] = useState("");

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

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];

  function goTo(screenName){
    setScreen(screenName);
  }

  async function loadEvents() {
    const snap = await getDocs(collection(db, "events"));
    const list = [];
    snap.forEach(d => {
      if (d.data().judges) {
        list.push({ id: d.id, judges: d.data().judges });
      }
    });
    setEvents(list);
  }

  async function loadScores() {
    const snap = await getDocs(collection(db, "scores"));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    setScoresDB(list);
  }

  useEffect(() => {
    if (screen === "judgeLogin") loadEvents();
    if (screen.includes("leaderboard") || screen.includes("top")) loadScores();
  }, [screen]);

  const styles = {
    container:{background:"#0b0f1a",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{width:"100%",padding:"14px",margin:"6px 0",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    active:{background:"#ff0000"},
    row:{display:"flex",gap:"6px"},
    scoreRow:{display:"flex",overflowX:"auto"},
    scoreBtn:{padding:"14px",margin:"3px",minWidth:"42px",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    input:{width:"100%",padding:"10px",margin:"6px 0",background:"#111827",border:"1px solid #2f3a55",color:"#fff"}
  };

  function buildLeaderboard(filterFn = () => true, limit = null) {
    let data = scoresDB
      .filter(s => s.event === eventName)
      .filter(filterFn);

    data.sort((a,b)=>b.total - a.total);

    if (limit) data = data.slice(0, limit);
    return data;
  }

  function formatRow(s, i){
    const g = s.gender === "Female" ? "F" : "M";

    const base =
      Object.values(s.scores || {}).reduce((a,b)=>a+b,0) + (s.tyres || 0);

    const deductionsText = s.deductions?.length
      ? " - (" + s.deductions.join(", ") + ")"
      : "";

    return `#${i+1}${g} | ${s.car} | ${s.carClass || ""} | ${base}${deductionsText} ${s.total}`;
  }

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>goTo("judgeLogin")}>Judge Login</button>
        <button style={styles.button} onClick={()=>goTo("score")}>Resume Judging</button>

        <button style={styles.button} onClick={()=>goTo("leaderboard")}>Leaderboard</button>
        <button style={styles.button} onClick={()=>goTo("classLeaderboard")}>Class Leaderboard</button>
        <button style={styles.button} onClick={()=>goTo("femaleLeaderboard")}>Female Overall</button>
        <button style={styles.button} onClick={()=>goTo("top150")}>Top 150</button>
        <button style={styles.button} onClick={()=>goTo("top30")}>Top 30 Finals</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>

        <h2>Add Event</h2>
        <input style={styles.input} value={newEvent} onChange={e=>setNewEvent(e.target.value)} placeholder="Event"/>
        <input style={styles.input} value={newJudges} onChange={e=>setNewJudges(e.target.value)} placeholder="Judges comma separated"/>

        <button style={styles.button} onClick={async ()=>{
          await setDoc(doc(db,"events",newEvent),{
            judges:newJudges.split(",").map(j=>j.trim())
          });
          loadEvents();
        }}>Add Event</button>

        <h2>Select Event</h2>

        {events.map((e,i)=>(
          <button key={i} style={styles.button} onClick={()=>{
            setEventName(e.id);
            setJudges(e.judges);
          }}>{e.id}</button>
        ))}

        <h3>Select Judge</h3>

        {judges.map((j,i)=>(
          <button key={i} style={styles.button} onClick={()=>{setJudge(j);goTo("score");}}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if (screen === "score") {
    return (
      <div style={styles.container}>

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input style={styles.input} value={car} onChange={e=>setCar(e.target.value)} placeholder="Car"/>
        <input style={styles.input} value={driverName} onChange={e=>setDriverName(e.target.value)} placeholder="Driver"/>

        <div style={styles.row}>
          <button style={{...styles.button,...(gender==="Male"?styles.active:{})}} onClick={()=>setGender("Male")}>Male</button>
          <button style={{...styles.button,...(gender==="Female"?styles.active:{})}} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c}
              style={{...styles.scoreBtn,...(carClass===c?styles.active:{})}}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <p>{cat}</p>
            <div style={styles.scoreRow}>
              {[...Array(20)].map((_,i)=>(
                <button key={i}
                  style={{...styles.scoreBtn,...(scores[cat]===i+1?styles.active:{})}}
                  onClick={()=>setScores(prev=>({...prev,[cat]:i+1}))}>
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        <p>Tyres</p>
        <div style={styles.row}>
          <button style={{...styles.button,...(tyres>=5?styles.active:{})}} onClick={()=>setTyres(prev=>prev>=5?prev-5:5)}>Left</button>
          <button style={{...styles.button,...(tyres===10?styles.active:{})}} onClick={()=>setTyres(prev=>prev===10?5:10)}>Right</button>
        </div>

        <p>Deductions</p>
        <div style={styles.row}>
          {["Reversing","Stopping","Barrier","Fire"].map(d=>(
            <button key={d}
              style={{...styles.button,...(deductions.includes(d)?styles.active:{})}}
              onClick={()=>setDeductions(prev =>
                prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
              )}>
              {d}
            </button>
          ))}
        </div>

        <h3>
          Total: {
            Object.values(scores).reduce((a,b)=>a+b,0)
            + tyres
            - deductions.length*10
          }
        </h3>

        <button style={styles.button} onClick={async ()=>{
          const base = Object.values(scores).reduce((a,b)=>a+b,0) + tyres;
          const total = base - deductions.length*10;

          await addDoc(collection(db,"scores"),{
            event:eventName,
            judge,
            car,
            driverName,
            gender,
            carClass,
            scores,
            tyres,
            deductions,
            total
          });

          setScores({});
          setTyres(0);
          setDeductions([]);
          setCar("");
          setDriverName("");
          setGender("");
          setCarClass("");
        }}>
          Submit
        </button>

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARDS (ALL)
  const renderBoard = (filter, title, limit=null) => {
    const data = buildLeaderboard(filter, limit);
    return (
      <div style={styles.container}>
        <h2>{title}</h2>
        {data.map((s,i)=>(<p key={i}>{formatRow(s,i)}</p>))}
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  };

  if (screen === "leaderboard") return renderBoard(()=>true,"Leaderboard");
  if (screen === "classLeaderboard") return renderBoard(()=>true,"Class Leaderboard");
  if (screen === "femaleLeaderboard") return renderBoard(s=>s.gender==="Female","Female");
  if (screen === "top150") return renderBoard(()=>true,"Top 150",150);
  if (screen === "top30") return renderBoard(()=>true,"Top 30",30);

  return null;
}
