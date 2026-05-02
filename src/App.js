import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

// ================= CONFIG =================
const categories = [
  "Instant Smoke",
  "Volume of Smoke",
  "Constant Smoke",
  "Driver Skill & Control"
];

const classes = [
  "V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"
];

const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

// ================= STYLES =================
const page = {
  background:"#111",
  color:"#fff",
  minHeight:"100vh",
  padding:20
};

const scoreBtn = {
  background:"#222",
  color:"#fff",
  border:"1px solid #555",
  padding:"8px",
  margin:"2px",
  minWidth:"36px"
};

const activeScore = {
  ...scoreBtn,
  background:"red"
};

const smallBtn = {
  background:"#222",
  color:"#fff",
  border:"1px solid #555",
  padding:"8px 12px",
  margin:"2px"
};

const activeSmall = {
  ...smallBtn,
  background:"red"
};

const bigBtn = {
  width:"100%",
  padding:"16px",
  marginTop:10,
  background:"#222",
  color:"#fff",
  border:"1px solid #555"
};

// ================= APP =================
export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("Autofest Event");

  const [judges,setJudges] = useState([
    {name:""},
    {name:""},
    {name:""},
    {name:""},
    {name:""},
    {name:""}
  ]);

  const [activeJudge,setActiveJudge] = useState("");

  const [entries,setEntries] = useState([]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"scores"),snap=>{
      setEntries(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[]);

  // ================= SCORE =================
  function ScoreScreen(){

    const [car,setCar] = useState("");
    const [gender,setGender] = useState("");
    const [carClass,setCarClass] = useState("");
    const [scores,setScores] = useState({});
    const [tyres,setTyres] = useState({left:false,right:false});
    const [deductions,setDeductions] = useState({});
    const [saving,setSaving] = useState(false);

    const submit = async () => {

      if (saving) return;
      if (!car) return alert("Enter Car #");

      setSaving(true);

      const base = Object.values(scores).reduce((a,b)=>a+b,0);
      const tyreScore = (tyres.left?5:0)+(tyres.right?5:0);
      const activeDeds = Object.keys(deductions).filter(d=>deductions[d]);
      const deductionTotal = activeDeds.length * 10;

      const total = base + tyreScore - deductionTotal;

      await addDoc(collection(db,"scores"),{
        eventName,
        car,
        gender,
        carClass,
        judge: activeJudge,
        total,
        deductions: activeDeds,
        createdAt: new Date()
      });

      // RESET CLEAN
      setCar("");
      setGender("");
      setCarClass("");
      setScores({});
      setTyres({left:false,right:false});
      setDeductions({});
      setSaving(false);
    };

    return(
      <div style={page}>

        <h2>{eventName}</h2>
        <h3>{activeJudge}</h3>

        <input
          style={{width:"100%",padding:10}}
          placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        {/* MALE FEMALE */}
        <div>
          <button style={gender==="Male"?activeSmall:smallBtn}
            onClick={()=>setGender("Male")}>Male</button>

          <button style={gender==="Female"?activeSmall:smallBtn}
            onClick={()=>setGender("Female")}>Female</button>
        </div>

        {/* CLASSES */}
        <div>
          {classes.map(c=>(
            <button key={c}
              style={carClass===c?activeSmall:smallBtn}
              onClick={()=>setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* SCORES */}
        {categories.map(cat=>(
          <div key={cat}>
            <div>{cat}</div>
            {Array.from({length:21},(_,i)=>(
              <button key={i}
                style={scores[cat]===i?activeScore:scoreBtn}
                onClick={()=>setScores(prev=>({...prev,[cat]:i}))}>
                {i}
              </button>
            ))}
          </div>
        ))}

        {/* TYRES */}
        <div>
          Tyres (+5)
          <button style={tyres.left?activeSmall:smallBtn}
            onClick={()=>setTyres(prev=>({...prev,left:!prev.left}))}>
            Left
          </button>

          <button style={tyres.right?activeSmall:smallBtn}
            onClick={()=>setTyres(prev=>({...prev,right:!prev.right}))}>
            Right
          </button>
        </div>

        {/* DEDUCTIONS */}
        <div>
          Deductions (-10)
          {deductionsList.map(d=>(
            <button key={d}
              style={deductions[d]?activeSmall:smallBtn}
              onClick={()=>setDeductions(prev=>({...prev,[d]:!prev[d]}))}>
              {d}
            </button>
          ))}
        </div>

        <button style={bigBtn} onClick={submit}>
          {saving ? "Saving..." : "Submit"}
        </button>

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  // ================= HOME =================
  if(screen==="home"){
    return(
      <div style={page}>
        <h1>🔥 AUTOFEST LIVE SYNC 🔥</h1>

        <button style={bigBtn} onClick={()=>setScreen("judge")}>
          Judge Login
        </button>

        <button style={bigBtn} onClick={()=>setScreen("leader")}>
          Leaderboard
        </button>
      </div>
    );
  }

  // ================= JUDGE LOGIN =================
  if(screen==="judge"){
    return(
      <div style={page}>
        <h2>Judge Login</h2>

        {judges.map((j,i)=>(
          <div key={i}>
            <input
              placeholder={`Judge ${i+1} Name`}
              value={judges[i].name}
              onChange={(e)=>{
                const copy=[...judges];
                copy[i].name=e.target.value;
                setJudges(copy);
              }}
            />

            <button
              style={bigBtn}
              onClick={()=>{
                if(!judges[i].name) return alert("Enter name");
                setActiveJudge(judges[i].name);
                setScreen("score");
              }}
            >
              Start Judging
            </button>
          </div>
        ))}

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Home
        </button>
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
      <div style={page}>
        <h2>Leaderboard</h2>

        {entries
          .filter(e=>e.eventName===eventName)
          .sort((a,b)=>b.total-a.total)
          .map((e,i)=>(
            <div key={i}>
              #{i+1} | {e.car} | {e.carClass} | {e.total} ({e.judge})
            </div>
          ))}

        <button style={bigBtn} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return <div style={page}>Loading...</div>;
}
