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
      const data = d.data();
      if (data.judges) {
        list.push({
          id: d.id,
          judges: data.judges
        });
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
    if (screen.includes("leaderboard")) loadScores();
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

    const grouped = {};

    scoresDB
      .filter(s => s.event === eventName)
      .filter(filterFn)
      .forEach(s => {

        if (!grouped[s.car]) {
          grouped[s.car] = {
            car: s.car,
            driverName: s.driverName,
            carClass: s.carClass,
            gender: s.gender,
            total: 0,
            runs: 0
          };
        }

        grouped[s.car].total += s.total;
        grouped[s.car].runs += 1;
      });

    let result = Object.values(grouped).map(r => ({
      ...r,
      avg: r.total / r.runs
    }));

    result.sort((a,b) => b.avg - a.avg);

    if (limit) result = result.slice(0, limit);

    return result;
  }

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>goTo("judgeLogin")}>
          Judge Login
        </button>

        <button style={styles.button} onClick={()=>goTo("score")}>
          Resume Judging
        </button>

        <button style={styles.button} onClick={()=>goTo("leaderboard")}>
          Leaderboard
        </button>

        <button style={styles.button} onClick={()=>goTo("classLeaderboard")}>
          Class Leaderboard
        </button>

        <button style={styles.button} onClick={()=>goTo("femaleLeaderboard")}>
          Female Overall
        </button>

        <button style={styles.button} onClick={()=>goTo("top150")}>
          Top 150
        </button>

        <button style={styles.button} onClick={()=>goTo("top30")}>
          Top 30 Finals
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>

        <h2>Add Event</h2>

        <input style={styles.input} placeholder="Event Name" value={newEvent} onChange={e=>setNewEvent(e.target.value)} />
        <input style={styles.input} placeholder="Judges (comma separated)" value={newJudges} onChange={e=>setNewJudges(e.target.value)} />

        <button style={styles.button} onClick={async ()=>{
          await setDoc(doc(db,"events",newEvent),{
            judges:newJudges.split(",").map(j=>j.trim())
          });
          loadEvents();
        }}>
          Add Event
        </button>

        <h2>Select Event</h2>

        {events.map((e,i)=>(
          <button key={i} style={styles.button} onClick={()=>{
            setEventName(e.id);
            setJudges(e.judges);
          }}>
            {e.id}
          </button>
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

  // SCORE (unchanged logic)
  if (screen === "score") {
    return (
      <div style={styles.container}>

        <h2>{eventName}</h2>
        <h3>{judge}</h3>

        <input style={styles.input} placeholder="Car # / Rego" value={car} onChange={e=>setCar(e.target.value)} />
        <input style={styles.input} placeholder="Driver Name" value={driverName} onChange={e=>setDriverName(e.target.value)} />

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

        <button style={styles.button} onClick={async ()=>{
          const total =
            Object.values(scores).reduce((a,b)=>a+b,0)
            + tyres
            - deductions.length*10;

          await addDoc(collection(db,"scores"),{
            event:eventName,
            judge,
            car,
            driverName,
            gender,
            carClass,
            total
          });

          setScores({});
          setCar("");
          setDriverName("");
        }}>
          Submit
        </button>

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if (screen === "leaderboard") {
    const data = buildLeaderboard();
    return (
      <div style={styles.container}>
        <h2>Overall Leaderboard</h2>
        {data.map((r,i)=>(
          <p key={i}>
            {i+1}. {r.car} - {r.avg.toFixed(1)}
          </p>
        ))}
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // CLASS
  if (screen === "classLeaderboard") {
    return (
      <div style={styles.container}>
        <h2>Class Leaderboard</h2>
        {classes.map(cls=>{
          const data = buildLeaderboard(s => s.carClass === cls);
          return (
            <div key={cls}>
              <h3>{cls}</h3>
              {data.map((r,i)=>(
                <p key={i}>{i+1}. {r.car} - {r.avg.toFixed(1)}</p>
              ))}
            </div>
          );
        })}
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // FEMALE
  if (screen === "femaleLeaderboard") {
    const data = buildLeaderboard(s => s.gender === "Female");
    return (
      <div style={styles.container}>
        <h2>Female Leaderboard</h2>
        {data.map((r,i)=>(
          <p key={i}>{i+1}. {r.car} - {r.avg.toFixed(1)}</p>
        ))}
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // TOP 150
  if (screen === "top150") {
    const data = buildLeaderboard(()=>true,150);
    return (
      <div style={styles.container}>
        <h2>Top 150</h2>
        {data.map((r,i)=>(
          <p key={i}>{i+1}. {r.car} - {r.avg.toFixed(1)}</p>
        ))}
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // TOP 30
  if (screen === "top30") {
    const data = buildLeaderboard(()=>true,30);
    return (
      <div style={styles.container}>
        <h2>Top 30 Finals</h2>
        {data.map((r,i)=>(
          <p key={i}>{i+1}. {r.car} - {r.avg.toFixed(1)}</p>
        ))}
        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  return null;
}
