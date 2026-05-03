import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [judges, setJudges] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judge, setJudge] = useState("");

  const [car, setCar] = useState("");
  const [driverName, setDriverName] = useState("");

  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");

  const [scores, setScores] = useState({});
  const [tyres, setTyres] = useState(0);
  const [deductions, setDeductions] = useState([]);

  const [locked, setLocked] = useState(false);

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
      list.push({
        id: d.id,
        judges: d.data().judges || [],
        locked: d.data().locked || false
      });
    });

    setEvents(list);
  }

  useEffect(() => {
    if (screen === "judgeLogin") loadEvents();
  }, [screen]);

  const styles = {
    container: { background:"#0b0f1a", color:"#fff", minHeight:"100vh", padding:"15px" },
    button: { width:"100%", padding:"14px", margin:"6px 0", background:"#1c2333", border:"1px solid #2f3a55", color:"#fff" },
    active: { background:"#ff6b00" },
    row: { display:"flex", gap:"6px" },
    scoreRow: { display:"flex", overflowX:"auto" },
    scoreBtn: { padding:"14px", margin:"3px", minWidth:"42px", background:"#1c2333", border:"1px solid #2f3a55", color:"#fff" },
    input: { width:"100%", padding:"12px", margin:"8px 0", background:"#111827", border:"1px solid #2f3a55", color:"#fff" }
  };

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>
        <button style={styles.button} onClick={() => goTo("judgeLogin")}>Judge Login</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>
        <h2>Select Event</h2>

        {events.map((e,i)=>(
          <div key={i}>
            <button style={styles.button} onClick={()=>{
              setEventName(e.id);
              setJudges(e.judges);
              setLocked(e.locked);
            }}>
              {e.id} {e.locked && "🔒"}
            </button>

            {/* EDIT / DELETE */}
            {!e.locked && (
              <div style={styles.row}>
                <button onClick={async ()=>{
                  const newName = prompt("Rename Event", e.id);
                  if(!newName) return;
                  await updateDoc(doc(db,"events",e.id),{});
                  alert("Rename manually in Firebase for now");
                }}>Edit</button>

                <button onClick={async ()=>{
                  if(window.confirm("Delete event?")){
                    await deleteDoc(doc(db,"events",e.id));
                    loadEvents();
                  }
                }}>Delete</button>
              </div>
            )}
          </div>
        ))}

        <h3>Select Judge</h3>
        {judges.map((j,i)=>(
          <button key={i} style={styles.button} onClick={()=>{
            setJudge(j);
            goTo("score");
          }}>{j}</button>
        ))}

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if (screen === "score") {
    return (
      <div style={styles.container}>

        <h2>{eventName} {locked && "🔒 LOCKED"}</h2>
        <h3>{judge}</h3>

        <input style={styles.input} placeholder="Car # / Rego" value={car} onChange={(e)=>setCar(e.target.value)} />
        <input style={styles.input} placeholder="Driver Name" value={driverName} onChange={(e)=>setDriverName(e.target.value)} />

        <div style={styles.row}>
          <button style={{...styles.button,...(gender==="Male"?styles.active:{})}} onClick={()=>setGender("Male")}>Male</button>
          <button style={{...styles.button,...(gender==="Female"?styles.active:{})}} onClick={()=>setGender("Female")}>Female</button>
        </div>

        <div>
          {classes.map(c=>(
            <button key={c} style={{...styles.scoreBtn,...(carClass===c?styles.active:{})}} onClick={()=>setCarClass(c)}>
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
                  onClick={()=>setScores(prev=>({...prev,[cat]:i+1}))}
                >
                  {i+1}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* TYRES */}
        <p>Tyres</p>
        <div style={styles.row}>
          <button
            style={{...styles.button,...(tyres>=5?styles.active:{})}}
            onClick={()=>setTyres(prev=>prev>=5?prev-5:prev)}
          >Left +5</button>

          <button
            style={{...styles.button,...(tyres===10?styles.active:{})}}
            onClick={()=>setTyres(prev=>prev===10?5:10)}
          >Right +5</button>
        </div>

        {/* DEDUCTIONS */}
        <p>Deductions</p>
        <div style={styles.row}>
          {["Reversing","Stopping","Barrier","Fire"].map(d=>(
            <button key={d}
              style={{...styles.button,...(deductions.includes(d)?styles.active:{})}}
              onClick={()=>{
                setDeductions(prev =>
                  prev.includes(d)
                    ? prev.filter(x=>x!==d)
                    : [...prev,d]
                );
              }}
            >
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

        {/* SUBMIT */}
        <button style={styles.button} onClick={async ()=>{
          if(locked) return alert("Event locked");

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
            total:
              Object.values(scores).reduce((a,b)=>a+b,0)
              + tyres
              - deductions.length*10
          });

          alert("Saved");

          setScores({});
          setTyres(0);
          setDeductions([]);
          setCar("");
          setDriverName("");

        }}>Submit</button>

        {/* LOCK EVENT */}
        {!locked && (
          <button style={styles.button} onClick={async ()=>{
            await updateDoc(doc(db,"events",eventName),{locked:true});
            setLocked(true);
          }}>
            🔒 Lock Event
          </button>
        )}

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>

      </div>
    );
  }

  return null;
}

