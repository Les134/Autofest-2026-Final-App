import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5NhDJMBwhMpUUL3XIHUnISTuCeQkXKS8",
  authDomain: "autofest-burnout-judging-848fd.firebaseapp.com",
  projectId: "autofest-burnout-judging-848fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
  "Instant Smoke",
  "Volume",
  "Consistency",
  "Driver Control"
];

const classes = ["V8 Pro","V8 N/A","6 Cyl Pro","6 Cyl N/A","4 Cyl / Rotary"];
const deductionsList = ["Reversing","Stopping","Barrier","Fire"];

export default function App(){

  const [screen,setScreen] = useState("home");

  const [eventName,setEventName] = useState("");
  const [eventLocked,setEventLocked] = useState(false);
  const [judgeNames,setJudgeNames] = useState(["","","","","",""]);
  const [judge,setJudge] = useState("");

  const [car,setCar] = useState("");
  const [gender,setGender] = useState("");
  const [carClass,setCarClass] = useState("");
  const [tyres,setTyres] = useState("");

  const [scores,setScores] = useState({});
  const [deductions,setDeductions] = useState({});
  const [data,setData] = useState([]);

  useEffect(()=>{
    if(!eventName) return;
    async function load(){
      const q = query(collection(db,"scores"), where("event","==",eventName));
      const res = await getDocs(q);
      setData(res.docs.map(d=>d.data()));
    }
    load();
  },[eventName]);

  function setScore(cat,val){
    setScores(prev => ({ ...prev, [cat]: val }));
  }

  function toggleDeduction(d){
    setDeductions(prev => ({ ...prev, [d]: !prev[d] }));
  }

  async function submit(){
    let total = Object.values(scores).reduce((a,b)=>a+b,0);
    let deductionCount = Object.values(deductions).filter(Boolean).length;
    let tyreBonus = tyres ? 5 : 0;

    let finalScore = total - (deductionCount * 10) + tyreBonus;

    await addDoc(collection(db,"scores"), {
      event:eventName,
      judge,
      car,
      gender,
      carClass,
      finalScore
    });

    setScores({});
    setDeductions({});
    setCar("");
    setGender("");
    setCarClass("");
    setTyres("");
  }

  const row = {
    display:"flex",
    flexWrap:"nowrap",
    overflowX:"auto",
    gap:"6px",
    marginBottom:"10px"
  };

  const btn = {
    minWidth:"60px",
    height:"60px",
    fontSize:"16px",
    background:"#333",
    color:"#fff",
    border:"none"
  };

  const activeBtn = (active)=>({
    ...btn,
    background: active ? "red" : "#333"
  });

  // SCORE SCREEN ONLY (focus fix)
  return (
    <div style={{padding:20,background:"#111",color:"#fff"}}>

      <h2>{eventName}</h2>
      <h3>{judge}</h3>

      {/* ENTRANT */}
      <input
        placeholder="Entrant No / Rego"
        value={car}
        onChange={e=>setCar(e.target.value)}
        style={{width:"100%",padding:14,fontSize:20,marginBottom:15}}
      />

      {/* GENDER */}
      <div style={row}>
        <button style={activeBtn(gender==="Male")} onClick={()=>setGender("Male")}>Male</button>
        <button style={activeBtn(gender==="Female")} onClick={()=>setGender("Female")}>Female</button>
      </div>

      {/* CLASS */}
      <div style={row}>
        {classes.map(c=>(
          <button key={c} style={activeBtn(carClass===c)} onClick={()=>setCarClass(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* SCORES */}
      {categories.map(cat=>(
        <div key={cat}>
          <div style={{marginBottom:5}}>{cat}</div>
          <div style={row}>
            {[...Array(21)].map((_,i)=>(
              <button
                key={i}
                style={activeBtn(scores[cat]===i)}
                onClick={()=>setScore(cat,i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* TYRES */}
      <div style={row}>
        <button style={activeBtn(tyres==="Left")} onClick={()=>setTyres("Left")}>Left</button>
        <button style={activeBtn(tyres==="Right")} onClick={()=>setTyres("Right")}>Right</button>
      </div>

      {/* DEDUCTIONS */}
      <div style={row}>
        {deductionsList.map(d=>(
          <button key={d} style={activeBtn(deductions[d])} onClick={()=>toggleDeduction(d)}>
            {d}
          </button>
        ))}
      </div>

      <button onClick={submit} style={{width:"100%",padding:15}}>Submit</button>

    </div>
  );
}
