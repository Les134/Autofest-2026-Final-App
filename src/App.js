import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  deleteDoc
} from "firebase/firestore";

const ADMIN_PASSWORD = "admin123";

export default function App() {

  const [screen, setScreen] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
  const categories = ["Instant Smoke","Volume","Constant","Driver Skill"];
  const deductionList = ["Fire","Reversing","Barrier","Stopping"];

  const styles = {
    page:{background:"#000",color:"#fff",minHeight:"100vh",padding:15},
    button:{background:"#222",color:"#fff",border:"2px solid #555",padding:12,margin:5},
    red:{background:"#d60000",fontWeight:"bold"},
    row:{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10},
    scoreBtn:{width:35,height:35,fontSize:12,background:"#222",color:"#fff",border:"1px solid #666"},
    active:{background:"#d60000"},
    input:{padding:10,margin:5,width:"100%",background:"#111",color:"#fff",border:"2px solid #555"}
  };

  useEffect(()=>{ loadEvents(); },[]);

  async function loadEvents(){
    const snap = await getDocs(collection(db,"events"));
    setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  async function loadScores(){
    if(!selectedEvent) return;
    const q = query(collection(db,"scores"), where("eventId","==",selectedEvent.id));
    const snap = await getDocs(q);
    setResults(snap.docs.map(d=>d.data()));
  }

  async function createEvent(){
    if(!eventName) return;

    const ref = await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[],
      locked:false,
      archived:false
    });

    setSelectedEvent({ id: ref.id, name:eventName, judges:[] });
    setEventName("");
    loadEvents();
  }

  async function addJudge(){
    if(!selectedEvent || !newJudge) return;

    const updated = [...(selectedEvent.judges || []), newJudge];

    await updateDoc(doc(db,"events",selectedEvent.id),{
      judges: updated
    });

    setSelectedEvent({...selectedEvent, judges: updated});
    setNewJudge("");
  }

  async function lockEvent(){
    if(!isAdmin) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{locked:true});
    loadEvents();
  }

  async function unlockEvent(){
    if(!isAdmin) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{locked:false});
    loadEvents();
  }

  async function archiveEvent(){
    if(!isAdmin) return;
    await updateDoc(doc(db,"events",selectedEvent.id),{archived:true});
    setSelectedEvent(null);
    loadEvents();
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleTyre(side){
    setTyres(prev => ({ ...prev, [side]: !prev[side] }));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  async function submitScore(){
    if(selectedEvent?.locked) return alert("Event Locked");

    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreBonus = (tyres.left?5:0)+(tyres.right?5:0);
    const total = base + tyreBonus - deductions.length*10;

    await addDoc(collection(db,"scores"),{
      eventId:selectedEvent.id,
      car,
      gender,
      carClass,
      base,
      tyreBonus,
      deductions,
      total
    });

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

  function buildLeaderboard(){
    const grouped={};
    results.forEach(r=>{
      if(!grouped[r.car]) grouped[r.car]={...r,total:0};
      grouped[r.car].total += r.total;
    });
    return Object.values(grouped).sort((a,b)=>b.total-a.total);
  }

  function formatRow(r,i){
    const d = r.deductions?.length ? " - "+r.deductions.join(", ").toLowerCase() : "";
    return `#${i+1} | Car ${r.car} | ${r.gender} ${r.base+r.tyreBonus}${d} = ${r.total}`;
  }

  function adminLogin(){
    const pass = prompt("Admin Password");
    if(pass===ADMIN_PASSWORD) setIsAdmin(true);
  }

  // HOME
  if(screen==="home"){
    return(
      <div style={styles.page}>
        <button style={{...styles.button,...styles.red,width:"100%",fontSize:20}}
          onClick={()=>setScreen("score")}>
          SCORE SHEET
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>Event / Judge Login</button>
        <button style={styles.button} onClick={()=>{loadScores(); setScreen("leaderboard");}}>Leaderboards</button>
        <button style={styles.button} onClick={adminLogin}>Admin</button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={styles.page}>
        <input style={styles.input} value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="Event"/>
        <button style={styles.button} onClick={createEvent}>Create</button>

        {events.map(e=>(
          <button key={e.id} style={styles.button} onClick={()=>setSelectedEvent(e)}>
            {e.name} {e.locked && "(LOCKED)"}
          </button>
        ))}

        {isAdmin && (
          <>
            <button style={styles.button} onClick={lockEvent}>Lock</button>
            <button style={styles.button} onClick={unlockEvent}>Unlock</button>
            <button style={styles.button} onClick={archiveEvent}>Archive</button>
          </>
        )}

        <input style={styles.input} value={newJudge} onChange={e=>setNewJudge(e.target.value)} placeholder="Judge"/>
        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j} style={styles.button} onClick={()=>{setSelectedJudge(j); setScreen("score");}}>
            {j}
          </button>
        ))}

        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={styles.page}>
        <h3>{selectedEvent?.name}</h3>

        <input style={styles.input} value={car} onChange={e=>setCar(e.target.value)} placeholder="Car No"/>
        
        <div style={styles.row}>
          <button style={styles.button} onClick={()=>setGender("M")}>M</button>
          <button style={styles.button} onClick={()=>setGender("F")}>F</button>
        </div>

        <div style={styles.row}>
          {classes.map(c=>(
            <button key={c} style={styles.button} onClick={()=>setCarClass(c)}>{c}</button>
          ))}
        </div>

        {categories.map(cat=>(
          <div key={cat}>
            <div>{cat}</div>
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

        <div style={styles.row}>
          <button style={styles.button} onClick={()=>toggleTyre("left")}>Left +5</button>
          <button style={styles.button} onClick={()=>toggleTyre("right")}>Right +5</button>
        </div>

        <div style={styles.row}>
          {deductionList.map(d=>(
            <button key={d} style={styles.button} onClick={()=>toggleDeduction(d)}>{d}</button>
          ))}
        </div>

        <button style={{...styles.button,...styles.red}} onClick={submitScore}>Submit</button>
      </div>
    );
  }

  // LEADERBOARD
  if(screen==="leaderboard"){
    const data = buildLeaderboard();

    return(
      <div style={styles.page}>
        <h2>Leaderboard</h2>

        {data.map((r,i)=>(
          <div key={i}>{formatRow(r,i)}</div>
        ))}

        <button style={styles.button} onClick={()=>window.print()}>Print</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
