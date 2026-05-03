import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";

export default function App() {

  const ADMIN_PASSWORD = "admin123";

  const [screen, setScreen] = useState("home");

  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState("");
  const [judges, setJudges] = useState([]);

  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [newEvent, setNewEvent] = useState("");
  const [newJudge, setNewJudge] = useState("");

  async function loadEvents() {
    const snap = await getDocs(collection(db, "events"));
    const list = [];
    snap.forEach(d => list.push({ id:d.id, ...d.data() }));
    setEvents(list);
  }

  async function loadJudges(eventId){
    if(!eventId) return;
    const ref = doc(db,"events",eventId);
    const snap = await getDoc(ref);
    if(snap.exists()){
      setJudges(snap.data().judges || []);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const styles = {
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"15px"},
    button:{width:"100%",padding:"14px",margin:"6px 0"},
    input:{width:"100%",padding:"10px",margin:"6px 0"}
  };

  // HOME
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <h1>🔥 AUTOFEST 🔥</h1>

        <button style={styles.button} onClick={()=>setScreen("judge")}>
          Judge Login
        </button>

        <button style={styles.button} onClick={()=>setScreen("admin")}>
          Admin Setup
        </button>
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

        <button onClick={()=>{
          if(adminPass === ADMIN_PASSWORD){
            setIsAdmin(true);
          } else alert("Wrong password");
        }}>
          Login
        </button>

        {isAdmin && (
          <>
            <h3>Create Event</h3>

            <input
              style={styles.input}
              placeholder="Event Name"
              value={newEvent}
              onChange={(e)=>setNewEvent(e.target.value)}
            />

            <button onClick={async ()=>{
              const clean = newEvent.trim();

              if(!clean) return alert("Enter event name");

              await setDoc(doc(db,"events",clean),{
                judges:[]
              });

              setEventName(clean);
              setNewEvent("");
              loadEvents();
              loadJudges(clean);
            }}>
              Create Event
            </button>

            <h3>Select Event</h3>

            {events.map(e=>(
              <button key={e.id}
                onClick={()=>{
                  setEventName(e.id);
                  loadJudges(e.id);
                }}>
                {e.id}
              </button>
            ))}

            <h3>Add Judges (max 6)</h3>

            <input
              style={styles.input}
              placeholder="Judge Name"
              value={newJudge}
              onChange={(e)=>setNewJudge(e.target.value)}
            />

            <button onClick={async ()=>{
              const cleanEvent = eventName.trim();
              const cleanJudge = newJudge.trim();

              if(!cleanEvent) return alert("Select event first");
              if(!cleanJudge) return alert("Enter judge name");

              const ref = doc(db,"events",cleanEvent);
              const snap = await getDoc(ref);

              if(!snap.exists()) return alert("Event not found");

              const current = snap.data().judges || [];

              if(current.length >= 6){
                return alert("Max 6 judges");
              }

              await updateDoc(ref,{
                judges:[...current, cleanJudge]
              });

              setNewJudge("");
              loadJudges(cleanEvent); // 🔥 FORCE REFRESH
            }}>
              Add Judge
            </button>

            <h4>Current Judges:</h4>
            {judges.map(j => <div key={j}>{j}</div>)}
          </>
        )}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  // JUDGE LOGIN
  if (screen === "judge") {
    return (
      <div style={styles.container}>

        <h2>Select Event</h2>

        {events.map(e=>(
          <button key={e.id}
            onClick={()=>{
              setEventName(e.id);
              loadJudges(e.id);
            }}>
            {e.id}
          </button>
        ))}

        <h3>Select Judge</h3>

        {judges.map(j=>(
          <button key={j}>
            {j}
          </button>
        ))}

        <button onClick={()=>setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}

    
