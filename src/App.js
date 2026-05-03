import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function App() {

  const ADMIN_PASSWORD = "admin123";

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState([]);
  const [judge, setJudge] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");

  const [newEvent, setNewEvent] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [scoresDB, setScoresDB] = useState([]);

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

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];

  function goTo(s){ setScreen(s); }

  async function loadEvents() {
    const snap = await getDocs(collection(db, "events"));
    const list = [];
    snap.forEach(d => list.push({ id:d.id, ...d.data() }));
    setEvents(list);
  }

  async function loadScores() {
    const snap = await getDocs(collection(db, "scores"));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    setScoresDB(list);
  }

  useEffect(() => {
    loadEvents();
    if (screen === "leaderboard") loadScores();
  }, [screen]);

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{width:"100%",padding:"14px",margin:"6px 0",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    active:{background:"#ff0000"},
    row:{display:"flex",gap:"6px"},
    scoreRow:{display:"flex",overflowX:"auto"},
    scoreBtn:{padding:"14px",margin:"3px",minWidth:"42px",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    input:{width:"100%",padding:"10px",margin:"6px 0",background:"#111827",border:"1px solid #2f3a55",color:"#fff"}
  };

  function printPage(){ window.print(); }

  function formatRow(s, i){
    const g = s.gender === "Female" ? "F" : "M";
    const base = Object.values(s.scores||{}).reduce((a,b)=>a+b,0) + (s.tyres||0);
    const d = s.deductions?.length ? ` - (${s.deductions.join(", ")})` : "";
    return `#${i+1}${g} | ${s.car} | ${s.carClass} | ${base}${d} ${s.total}`;
  }

  function buildLeaderboard(){
    return scoresDB
      .filter(s => s.event === eventName)
      .sort((a,b)=>b.total - a.total);
  }

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>goTo("judgeLogin")}>
          Judge Login
        </button>

        <button style={styles.button} onClick={()=>goTo("admin")}>
          Admin Setup
        </button>

        <button style={styles.button} onClick={()=>goTo("leaderboard")}>
          Leaderboard
        </button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>

        <h2>Select Event</h2>

        {events.filter(e=>!e.archived).map(e=>(
          <button key={e.id} style={styles.button} onClick={()=>{
            setEventName(e.id);
            setJudges(e.judges || []);
          }}>
            {e.id}
          </button>
        ))}

        <h3>Select Judge</h3>

        {judges.map(j=>(
          <button key={j} style={styles.button}
            onClick={()=>{setJudge(j);goTo("score");}}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>

      </div>
    );
  }

  // ADMIN
  if (screen === "admin") {
    return (
      <div style={styles.container}>

        <h2>Admin Setup</h2>

        <input
          style={styles.input}
          placeholder="Password"
          value={adminPass}
          onChange={(e)=>setAdminPass(e.target.value)}
        />

        <button style={styles.button} onClick={()=>{
          if(adminPass === ADMIN_PASSWORD){
            setIsAdmin(true);
          } else alert("Wrong password");
        }}>
          Login
        </button>

        {isAdmin && (
          <>
            <h3>Create Event</h3>
            <input style={styles.input}
              value={newEvent}
              onChange={(e)=>setNewEvent(e.target.value)} />

            <button style={styles.button} onClick={async ()=>{
              await setDoc(doc(db,"events",newEvent),{
                judges:[],
                locked:false,
                archived:false
              });
              setNewEvent("");
              loadEvents();
            }}>
              Create
            </button>

            <h3>Select Event</h3>
            {events.map(e=>(
              <button key={e.id} style={styles.button} onClick={()=>{
                setEventName(e.id);
                setJudges(e.judges||[]);
              }}>
                {e.id} {e.locked?"🔒":""}
              </button>
            ))}

            <h3>Add Judge</h3>
            <input style={styles.input}
              value={newJudge}
              onChange={(e)=>setNewJudge(e.target.value)} />

            <button style={styles.button} onClick={async ()=>{
              const ev = events.find(e=>e.id===eventName);
              if(ev.locked) return alert("Locked");
              if(ev.judges.length>=6) return alert("Max 6");

              await updateDoc(doc(db,"events",eventName),{
                judges:[...ev.judges,newJudge]
              });

              setNewJudge("");
              loadEvents();
            }}>
              Add Judge
            </button>

            <button style={styles.button}
              onClick={()=>updateDoc(doc(db,"events",eventName),{locked:true})}>
              🔒 Lock
            </button>

            <button style={styles.button}
              onClick={()=>updateDoc(doc(db,"events",eventName),{archived:true})}>
              📦 Archive
            </button>

            <button style={styles.button}
              onClick={()=>deleteDoc(doc(db,"events",eventName))}>
              Delete
            </button>
          </>
        )}

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

        <input style={styles.input} placeholder="Car"
          value={car} onChange={(e)=>setCar(e.target.value)} />

        <div style={styles.row}>
          <button style={{...styles.button,...(gender==="Male"?styles.active:{})}} onClick={()=>setGender("Male")}>Male</button>
          <button style={{...styles.button,...(gender==="Female"?styles.active:{})}} onClick={()=>setGender("Female")}>Female</button>
        </div>

        {classes.map(c=>(
          <button key={c}
            style={{...styles.scoreBtn,...(carClass===c?styles.active:{})}}
            onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}

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

        <div style={styles.row}>
          <button onClick={()=>setTyres(t=>t>=5?t-5:5)}>Left +5</button>
          <button onClick={()=>setTyres(t=>t===10?5:10)}>Right +5</button>
        </div>

        {["Reversing","Stopping","Barrier","Fire"].map(d=>(
          <button key={d} onClick={()=>setDeductions(prev =>
            prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
          )}>
            {d}
          </button>
        ))}

        <h3>Total: {Object.values(scores).reduce((a,b)=>a+b,0)+tyres-deductions.length*10}</h3>

        <button onClick={async ()=>{
          const total = Object.values(scores).reduce((a,b)=>a+b,0)+tyres-deductions.length*10;

          await addDoc(collection(db,"scores"),{
            event:eventName,
            judge,
            car,
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
          setGender("");
          setCarClass("");
        }}>
          Submit
        </button>

        <button onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if (screen === "leaderboard") {
    const data = buildLeaderboard();

    return (
      <div style={styles.container}>
        <h2>Leaderboard</h2>
        <button onClick={printPage}>Print</button>

        {data.map((s,i)=>(
          <p key={i}>{formatRow(s,i)}</p>
        ))}

        <button onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  return null;
}

    
