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
      if (data.judges && Array.isArray(data.judges)) {
        list.push({
          id: d.id,
          judges: data.judges
        });
      }
    });

    setEvents(list);
  }

  useEffect(() => {
    if (screen === "judgeLogin") loadEvents();
  }, [screen]);

  const styles = {
    container:{background:"#0b0f1a",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{width:"100%",padding:"14px",margin:"6px 0",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    active:{background:"#ff0000"}, // 🔥 ONLY ACTIVE IS RED
    row:{display:"flex",gap:"6px"},
    scoreRow:{display:"flex",overflowX:"auto"},
    scoreBtn:{padding:"14px",margin:"3px",minWidth:"42px",background:"#1c2333",border:"1px solid #2f3a55",color:"#fff"},
    input:{width:"100%",padding:"10px",margin:"6px 0",background:"#111827",border:"1px solid #2f3a55",color:"#fff"}
  };

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>goTo("judgeLogin")}>
          Judge Login
        </button>

        <button
          style={styles.button}
          onClick={()=>{
            if (!eventName || !judge) {
              alert("No active judging session");
              return;
            }
            goTo("score");
          }}
        >
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

  // JUDGE LOGIN
  if (screen === "judgeLogin") {
    return (
      <div style={styles.container}>

        <h2>Add Event</h2>
        <input style={styles.input} placeholder="Event Name" value={newEvent} onChange={e=>setNewEvent(e.target.value)} />
        <input style={styles.input} placeholder="Judges (comma separated)" value={newJudges} onChange={e=>setNewJudges(e.target.value)} />

        <button style={styles.button} onClick={async ()=>{
          if(!newEvent || !newJudges) return alert("Enter event + judges");

          await setDoc(doc(db,"events",newEvent),{
            judges:newJudges.split(",").map(j=>j.trim())
          });

          setNewEvent("");
          setNewJudges("");
          loadEvents();
        }}>
          Add Event
        </button>

        <h2>Select Event</h2>

        {events.map((e,i)=>(
          <div key={i}>
            <button style={styles.button} onClick={()=>{
              setEventName(e.id);
              setJudges([...e.judges]);
            }}>
              {e.id}
            </button>

            <button
              type="button"
              onClick={async (ev)=>{
                ev.stopPropagation();
                if(window.confirm("Delete event?")){
                  await deleteDoc(doc(db,"events",e.id));
                  loadEvents();
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}

        {eventName && <h3>Select Judge</h3>}

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

        <input style={styles.input} placeholder="Car # / Rego" value={car} onChange={e=>setCar(e.target.value)} />
        <input style={styles.input} placeholder="Driver Name" value={driverName} onChange={e=>setDriverName(e.target.value)} />

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

        <p>Tyres (+5)</p>
        <div style={styles.row}>
          <button style={{...styles.button,...(tyres>=5?styles.active:{})}}
            onClick={()=>setTyres(prev=>prev>=5?prev-5:5)}>Left</button>
          <button style={{...styles.button,...(tyres===10?styles.active:{})}}
            onClick={()=>setTyres(prev=>prev===10?5:10)}>Right</button>
        </div>

        <p>Deductions (-10)</p>
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

        <button
          type="button"
          style={styles.button}
          onClick={async (e) => {

            e.stopPropagation();

            if (!eventName) return alert("Missing event");
            if (!judge) return alert("Missing judge");
            if (!car) return alert("Enter car number");
            if (Object.keys(scores).length !== 4) return alert("Complete all scoring categories");

            try {
              const base = Object.values(scores).reduce((a,b)=>a+b,0);
              const total = base + tyres - (deductions.length * 10);

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

              alert("Score saved");

              setScores({});
              setTyres(0);
              setDeductions([]);
              setCar("");
              setDriverName("");
              setGender("");
              setCarClass("");

            } catch (err) {
              console.error(err);
              alert("Submit failed");
            }

          }}
        >
          Submit
        </button>

        <button style={styles.button} onClick={()=>goTo("home")}>Home</button>

      </div>
    );
  }

  return null;
}
