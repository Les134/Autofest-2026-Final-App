import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

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

  const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl Open/Rotary"];
  const categories = ["Instant Smoke","Volume of Smoke","Constant Smoke","Driver Skill & Control"];
  const deductionList = ["Reversing","Stopping","Barrier","Fire"];

  const styles = {
    page:{background:"#000",color:"#fff",minHeight:"100vh",padding:10},
    button:{background:"#222",color:"#fff",border:"1px solid #555",padding:10,margin:5},
    red:{background:"#d60000",fontWeight:"bold"},
    row:{display:"flex",flexWrap:"wrap",gap:5},
    score:{width:32,height:32,fontSize:12,border:"1px solid #666",background:"#111",color:"#fff"},
    active:{background:"#d60000"},
    input:{padding:10,margin:5,width:"100%",background:"#111",color:"#fff",border:"1px solid #555"}
  };

  useEffect(()=>{ loadEvents(); },[]);

  async function loadEvents(){
    const snap = await getDocs(collection(db,"events"));
    setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  async function loadScores(){
    const q = query(collection(db,"scores"), where("eventId","==",selectedEvent.id));
    const snap = await getDocs(q);
    setResults(snap.docs.map(d=>d.data()));
  }

  async function createEvent(){
    const ref = await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[],
      locked:false
    });
    setSelectedEvent({id:ref.id,name:eventName,judges:[]});
    setEventName("");
    loadEvents();
  }

  async function addJudge(){
    const updated = [...(selectedEvent.judges||[]), newJudge];
    await updateDoc(doc(db,"events",selectedEvent.id),{judges:updated});
    setSelectedEvent({...selectedEvent,judges:updated});
    setNewJudge("");
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleTyre(side){
    setTyres(prev=>({...prev,[side]:!prev[side]}));
  }

  function toggleDeduction(d){
    setDeductions(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);
  }

  function calcTotal(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyre = (tyres.left?5:0)+(tyres.right?5:0);
    const deduct = deductions.length*10;
    return base + tyre - deduct;
  }

  async function submit(){
    await addDoc(collection(db,"scores"),{
      eventId:selectedEvent.id,
      car,
      gender,
      carClass,
      total:calcTotal(),
      deductions
    });

    setScores({});
    setTyres({left:false,right:false});
    setDeductions([]);
    setCar("");
    setGender("");
    setCarClass("");
  }

  function leaderboard(){
    const grouped={};
    results.forEach(r=>{
      if(!grouped[r.car]) grouped[r.car]={...r,total:0};
      grouped[r.car].total+=r.total;
    });
    return Object.values(grouped).sort((a,b)=>b.total-a.total);
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={styles.page}>
        <button style={{...styles.button,...styles.red,width:"100%",fontSize:20}}
          onClick={()=>setScreen("score")}>
          SCORE SHEET
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Event / Judge Login
        </button>

        <button style={styles.button} onClick={()=>setScreen("leaderboard")}>
          Leaderboards
        </button>
      </div>
    );
  }

  // ================= JUDGE =================
  if(screen==="judge"){
    return(
      <div style={styles.page}>
        <input style={styles.input} value={eventName} onChange={e=>setEventName(e.target.value)} placeholder="Event Name"/>
        <button style={styles.button} onClick={createEvent}>Create Event</button>

        {events.map(e=>(
          <button key={e.id} style={styles.button} onClick={()=>setSelectedEvent(e)}>
            {e.name}
          </button>
        ))}

        <input style={styles.input} value={newJudge} onChange={e=>setNewJudge(e.target.value)} placeholder="Judge Name"/>
        <button style={styles.button} onClick={addJudge}>Add Judge</button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j} style={styles.button} onClick={()=>{setSelectedJudge(j);setScreen("score");}}>
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
      <div style={styles.page}>
        <input style={styles.input} value={car} onChange={e=>setCar(e.target.value)} placeholder="Car No"/>

        <div style={styles.row}>
          <button style={styles.button} onClick={()=>setGender("Male")}>Male</button>
          <button style={styles.button} onClick={()=>setGender("Female")}>Female</button>
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
                  style={{...styles.score,...(scores[cat]===i+1?styles.active:{})}}
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

        <h3>Total: {calcTotal()}</h3>

        <button style={{...styles.button,...styles.red}} onClick={submit}>Submit</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // ================= LEADERBOARD =================
  if(screen==="leaderboard"){
    const data = leaderboard();

    return(
      <div style={styles.page}>
        <h2>Leaderboard</h2>

        {data.map((r,i)=>(
          <div key={i}>
            #{i+1} | {r.car} | {r.gender} | {r.carClass} = {r.total}
          </div>
        ))}

        <button style={styles.button} onClick={()=>window.print()}>Print</button>
        <button style={styles.button} onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
