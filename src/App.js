import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

// ================= CONFIG =================
const categories = ["Instant Smoke","Volume","Consistency","Driver Skill"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","","","","",""]);
  const [activeJudge,setActiveJudge] = useState("");
  const [eventLocked,setEventLocked] = useState(false);

  const [entries,setEntries] = useState([]);

  // 🔥 LIVE DATA
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  // ================= SCORE SCREEN =================
  function ScoreScreen(){

    const [car,setCar] = useState("");
    const [scores,setScores] = useState({});
    const [saving,setSaving] = useState(false);

    const submit = async () => {

      if (saving) return;

      if (!car) return alert("Enter Car #");

      setSaving(true);

      const total = Object.values(scores).reduce((a,b)=>a+b,0);

      await addDoc(collection(db,"scores"),{
        eventName,
        car,
        judge: activeJudge,
        total,
        createdAt: new Date()
      });

      // 🔥 HARD RESET (THIS FIXES YOUR ISSUE)
      setCar("");
      setScores({});
      setSaving(false);
    };

    return(
      <div style={{padding:20}}>
        <h2>{eventName}</h2>
        <h3>{activeJudge}</h3>

        <input
          placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        {categories.map(cat=>(
          <div key={cat}>
            <strong>{cat}</strong><br/>
            {Array.from({length:11},(_,i)=>(
              <button key={i}
                onClick={()=>setScores({...scores,[cat]:i})}
              >
                {i}
              </button>
            ))}
          </div>
        ))}

        <button onClick={submit}>
          {saving ? "Saving..." : "Submit"}
        </button>

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button onClick={()=>setScreen("admin")}>New Event</button>
        <button onClick={()=>setScreen("judgeLogin")}>Judge Login</button>
        <button onClick={()=>setScreen("leader")}>Leaderboard</button>
        <button>Class Leaderboard</button>
        <button>Female Overall</button>
        <button>Top 150</button>
        <button>Top 30 Finals</button>
        <button>Archived Events</button>
      </div>
    );
  }

  // ================= ADMIN SETUP =================
  if(screen==="admin"){
    return(
      <div style={{padding:20}}>
        <h2>Admin Setup</h2>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
        />

        {judges.map((j,i)=>(
          <input key={i}
            placeholder={`Judge ${i+1}`}
            value={judges[i]}
            onChange={(e)=>{
              const copy=[...judges];
              copy[i]=e.target.value;
              setJudges(copy);
            }}
          />
        ))}

        <button onClick={()=>{
          if(!eventName) return alert("Add event");
          setEventLocked(true);
          setScreen("home");
        }}>
          LOCK EVENT
        </button>

        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judgeLogin"){
    return(
      <div style={{padding:20}}>
        <h2>Judge Login</h2>

        {judges.filter(j=>j).map((j,i)=>(
          <button key={i}
            onClick={()=>{
              setActiveJudge(j);
              setScreen("score");
            }}>
            {j}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // ================= SCORE =================
  if(screen==="score"){
    return <ScoreScreen />;
  }

  // ================= LEADERBOARD =================
  if(screen==="leader"){
    return(
      <div style={{padding:20}}>
        <h2>Leaderboard</h2>

        {entries
          .filter(e=>e.eventName===eventName)
          .sort((a,b)=>b.total-a.total)
          .map((e,i)=>(
            <div key={i}>
              #{i+1} | Car {e.car} | {e.total}
            </div>
          ))}

        <button onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
