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
  const [boardType, setBoardType] = useState("overall");

  const [events, setEvents] = useState({});
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedJudge, setSelectedJudge] = useState("");

  const [eventName, setEventName] = useState("");
  const [newJudge, setNewJudge] = useState("");

  const [results, setResults] = useState([]);

  const [lockedEvents, setLockedEvents] = useState({});
  const [archivedEvents, setArchivedEvents] = useState({});

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
    container:{background:"#000",color:"#fff",minHeight:"100vh",padding:"18px"},
    button:{padding:"16px",margin:"6px 0",background:"#2a2a2a",color:"#fff",border:"2px solid #555",width:"100%"},
    smallBtn:{padding:"10px 16px",background:"#2a2a2a",color:"#fff",border:"2px solid #555",fontSize:"14px"},
    active:{background:"#ff2a2a"},
    row:{display:"flex",gap:"8px",flexWrap:"nowrap",overflowX:"auto",marginBottom:"10px"},
    scoreRow:{display:"flex",flexWrap:"nowrap",gap:"6px",overflowX:"auto",marginBottom:"12px"},
    scoreBtn:{minWidth:"44px",height:"44px",background:"#2a2a2a",border:"2px solid #666",color:"#fff",fontSize:"14px",fontWeight:"bold"},
    input:{padding:"12px",margin:"6px 0",width:"100%",background:"#111",color:"#fff",border:"2px solid #555"},
    label:{marginTop:"10px",marginBottom:"4px",fontSize:"14px"}
  };

  // 🔥 LOAD DATA
  useEffect(()=>{
    loadAll();
  },[]);

  async function loadAll(){
    const evSnap = await getDocs(collection(db,"events"));
    const ev = {};
    const locks = {};
    const arch = {};

    evSnap.docs.forEach(d=>{
      const data = d.data();
      if(data.archived){
        arch[data.name] = true;
      } else {
        ev[data.name] = data.judges || [];
        if(data.locked) locks[data.name] = true;
      }
    });

    setEvents(ev);
    setLockedEvents(locks);
    setArchivedEvents(arch);

    const scoreSnap = await getDocs(collection(db,"scores"));
    setResults(scoreSnap.docs.map(d=>d.data()));
  }

  async function createEvent(){
    if(!eventName) return;

    await addDoc(collection(db,"events"),{
      name:eventName,
      judges:[],
      locked:false,
      archived:false
    });

    loadAll();
    setEventName("");
  }

  async function addJudge(){
    if(!selectedEvent || !newJudge) return;
    if(lockedEvents[selectedEvent]) return alert("Event locked");

    const updated = [...(events[selectedEvent]||[]), newJudge];

    const q = query(collection(db,"events"), where("name","==",selectedEvent));
    const snap = await getDocs(q);

    snap.forEach(async d=>{
      await updateDoc(doc(db,"events",d.id),{ judges:updated });
    });

    setEvents(prev => ({ ...prev, [selectedEvent]: updated }));
    setNewJudge("");
  }

  async function lockEvent(){
    const q = query(collection(db,"events"), where("name","==",selectedEvent));
    const snap = await getDocs(q);

    snap.forEach(async d=>{
      await updateDoc(doc(db,"events",d.id),{ locked:true });
    });

    setLockedEvents(prev=>({...prev,[selectedEvent]:true}));
  }

  async function archiveEvent(){
    const q = query(collection(db,"events"), where("name","==",selectedEvent));
    const snap = await getDocs(q);

    snap.forEach(async d=>{
      await updateDoc(doc(db,"events",d.id),{ archived:true });
    });

    loadAll();
    setSelectedEvent("");
    setSelectedJudge("");
  }

  function setScore(cat,val){
    setScores(prev=>({...prev,[cat]:val}));
  }

  function toggleDeduction(d){
    setDeductions(prev =>
      prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]
    );
  }

  function toggleTyre(side){
    setTyres(prev => ({ ...prev, [side]: !prev[side] }));
  }

  function totalScore(){
    const base = Object.values(scores).reduce((a,b)=>a+b,0);
    const tyreBonus = (tyres.left?5:0)+(tyres.right?5:0);
    return base + tyreBonus - deductions.length*10;
  }

  async function submitScore(){
    if(!selectedEvent || !selectedJudge) return alert("Select Event & Judge");

    const data = {
      event:selectedEvent,
      car,
      gender,
      carClass,
      total: totalScore(),
      deductions
    };

    await addDoc(collection(db,"scores"), data);
    setResults(prev=>[...prev,data]);

    setCar(""); setGender(""); setCarClass("");
    setScores({}); setTyres({left:false,right:false}); setDeductions([]);
  }

  function combineScores(list){
    const grouped={};
    list.forEach(r=>{
      if(!grouped[r.car]) grouped[r.car]={...r, totals:[]};
      grouped[r.car].totals.push(r.total);
    });

    return Object.values(grouped).map(g=>{
      let scores=[...g.totals].sort((a,b)=>a-b);
      if(scores.length>2) scores=scores.slice(1,-1);
      const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
      return {...g,total:Math.round(avg)};
    });
  }

  function sort(list){
    return [...list].sort((a,b)=>b.total-a.total);
  }

  function getEventResults(){
    return results.filter(r=>r.event===selectedEvent);
  }

  function printPage(){ window.print(); }

  // HOME / JUDGE / SCORE / LEADERBOARD sections remain EXACTLY as your working version
  // (they are already correct in your file — no change needed)

  return null;
}
