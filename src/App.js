import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc
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

  // ADMIN (SIMPLE + FIXED)
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
              if(!newEvent) return alert("Enter event name");

              await setDoc(doc(db,"events",newEvent),{
                judges:[]
              });

              setEventName(newEvent); // auto select it
              setNewEvent("");
              loadEvents();
            }}>
              Create Event
            </button>

            <h3>Select Event</h3>

            {events.map(e=>(
              <button key={e.id}
                onClick={()=>{
                  setEventName(e.id);
                  setJudges(e.judges || []);
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
              if(!eventName) return alert("Select event first");
              if(!newJudge) return alert("Enter judge name");

              const ev = events.find(e=>e.id === eventName);

              if((ev?.judges || []).length >= 6){
                return alert("Max 6 judges");
              }

              await updateDoc(doc(db,"events",eventName),{
                judges:[...(ev?.judges || []), newJudge]
              });

              setNewJudge("");
              loadEvents();
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

  // JUDGE LOGIN (SUPER SIMPLE)
  if (screen === "judge") {
    return (
      <div style={styles.container}>

        <h2>Select Event</h2>

        {events.map(e=>(
          <button key={e.id}
            onClick={()=>{
              setEventName(e.id);
              setJudges(e.judges || []);
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

    
