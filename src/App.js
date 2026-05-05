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
  const [eventId, setEventId] = useState("");
  const [judge, setJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"20px"},
    button:{padding:"16px",margin:"6px 0",background:"#222",color:"#fff",border:"2px solid #555",width:"100%"},
    active:{background:"#ff2a2a"},
    input:{padding:"12px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
  };

  // LOAD EVENTS
  useEffect(()=>{ loadEvents(); },[]);

  async function loadEvents(){
    const snap = await getDocs(collection(db,"events"));
    const list = snap.docs.map(d=>({id:d.id,...d.data()}));
    setEvents(list);
  }

  // CREATE EVENT
  async function createEvent(){
    if(!eventName) return;

    const ref = await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[]
    });

    setEventId(ref.id);
    setEventName("");
    loadEvents();
  }

  // ADD JUDGE
  async function addJudge(){
    if(!eventId) return alert("Select event first");
    if(!newJudge) return;

    const event = events.find(e=>e.id===eventId);
    const judges = [...(event?.judges || []), newJudge];

    await updateDoc(doc(db,"events",eventId),{ judges });

    setJudge(newJudge);
    setNewJudge("");
    loadEvents();
  }

  // SELECT EVENT
  function selectEvent(id){
    setEventId(id);
    setJudge("");
  }

  // SELECT JUDGE
  function selectJudge(j){
    setJudge(j);
    setScreen("score");
  }

  // SUBMIT SCORE
  async function submitScore(){
    if(!eventId || !judge){
      alert("Select event and judge");
      return;
    }

    if(!car || !gender){
      alert("Fill car + gender");
      return;
    }

    await addDoc(collection(db,"scores"),{
      eventId,
      judge,
      car,
      gender
    });

    setCar("");
    setGender("");

    alert("Saved");
  }

  // HOME
  if(screen==="home"){
    return(
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button
          style={{...styles.button,...styles.active}}
          onClick={()=>{
            if(!eventId || !judge){
              alert("Login first");
              return;
            }
            setScreen("score");
          }}
        >
          SCORE SHEET<br/>
          {events.find(e=>e.id===eventId)?.name || "NO EVENT"}<br/>
          {judge || "NO JUDGE"}
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

        <input
          style={styles.input}
          value={eventName}
          onChange={(e)=>setEventName(e.target.value)}
          placeholder="Event Name"
        />

        <button style={styles.button} onClick={createEvent}>
          Create Event
        </button>

        {events.map(e=>(
          <button
            key={e.id}
            style={{
              ...styles.button,
              ...(eventId===e.id ? styles.active : {})
            }}
            onClick={()=>selectEvent(e.id)}
          >
            {e.name}
          </button>
        ))}

        <input
          style={styles.input}
          value={newJudge}
          onChange={(e)=>setNewJudge(e.target.value)}
          placeholder="Judge Name"
        />

        <button style={styles.button} onClick={addJudge}>
          Add Judge
        </button>

        {events.find(e=>e.id===eventId)?.judges?.map(j=>(
          <button
            key={j}
            style={styles.button}
            onClick={()=>selectJudge(j)}
          >
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
        <h2>{events.find(e=>e.id===eventId)?.name}</h2>
        <h3>{judge}</h3>

        <input
          style={styles.input}
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          placeholder="Car"
        />

        <button style={styles.button} onClick={()=>setGender("M")}>
          Male
        </button>
        <button style={styles.button} onClick={()=>setGender("F")}>
          Female
        </button>

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
