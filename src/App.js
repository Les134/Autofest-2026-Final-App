import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function App() {

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [scores, setScores] = useState({});

  const categories = ["Smoke","Style","Control","Impact"];

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"20px"},
    button:{padding:"15px",margin:"6px 0",background:"#222",color:"#fff",border:"2px solid #555",width:"100%"},
    active:{background:"#ff2a2a"},
    input:{padding:"12px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
  };

  useEffect(()=>{ loadEvents(); },[]);

  async function loadEvents(){
    const snap = await getDocs(collection(db,"events"));
    setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  async function createEvent(){
    if(!eventName) return;
    await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[]
    });
    setEventName("");
    loadEvents();
  }

  async function addJudge(){
    if(!selectedEvent) return alert("Select Event first");
    if(!newJudge) return;

    await updateDoc(doc(db,"events",selectedEvent.id),{
      judges:[...(selectedEvent.judges||[]), newJudge]
    });

    setNewJudge("");
    loadEvents();
  }

  function selectEvent(e){
    setSelectedEvent(e);
    setSelectedJudge("");
  }

  function selectJudge(j){
    if(!selectedEvent) return alert("Select Event first");
    setSelectedJudge(j);
    setScreen("score");
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  async function submitScore(){
    if(!selectedEvent || !selectedJudge){
      alert("Login first");
      return;
    }

    await addDoc(collection(db,"scores"),{
      eventId:selectedEvent.id,
      judge:selectedJudge,
      car,
      gender,
      scores
    });

    setCar("");
    setGender("");
    setScores({});

    alert("Saved");
  }

  // HOME
  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>AUTOFEST</h1>

        <button style={{...styles.button,...styles.active}}
          onClick={()=>{
            if(!selectedEvent || !selectedJudge){
              alert("Login first");
              return;
            }
            setScreen("score");
          }}>
          SCORE SHEET<br/>
          {selectedEvent?.name || "NO EVENT"}<br/>
          {selectedJudge || "NO JUDGE"}
        </button>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Event / Judge Login
        </button>
      </div>
    );
  }

  // LOGIN
  if(screen==="judge"){
    return(
      <div style={styles.container}>

        <input style={styles.input}
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
          placeholder="Event Name"
        />

        <button style={styles.button} onClick={createEvent}>
          Create Event
        </button>

        {events.map(e=>(
          <button key={e.id}
            style={{...styles.button,...(selectedEvent?.id===e.id?styles.active:{})}}
            onClick={()=>selectEvent(e)}>
            {e.name}
          </button>
        ))}

        <input style={styles.input}
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
          placeholder="Judge Name"
        />

        <button style={styles.button} onClick={addJudge}>
          Add Judge
        </button>

        {selectedEvent?.judges?.map(j=>(
          <button key={j}
            style={styles.button}
            onClick={()=>selectJudge(j)}>
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

        <h2>{selectedEvent?.name}</h2>
        <h3>{selectedJudge}</h3>

        <input style={styles.input}
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Car"
        />

        <button style={styles.button} onClick={()=>setGender("M")}>Male</button>
        <button style={styles.button} onClick={()=>setGender("F")}>Female</button>

        {categories.map(cat=>(
          <div key={cat}>
            <div>{cat}</div>
            {[...Array(10)].map((_,i)=>(
              <button key={i}
                style={styles.button}
                onClick={()=>setScore(cat,i+1)}>
                {i+1}
              </button>
            ))}
          </div>
        ))}

        <button style={styles.button} onClick={submitScore}>
          Submit
        </button>

        <button style={styles.button} onClick={()=>setScreen("home")}>
          Home
        </button>

      </div>
    );
  }

  return null;
}
