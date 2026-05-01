import React, { useState } from "react";

export default function App(){

  const [screen,setScreen] = useState("home");
  const [eventName,setEventName] = useState("");
  const [judges,setJudges] = useState(["","",""]);
  const [activeJudge,setActiveJudge] = useState("");

  const [car,setCar] = useState("");

  const big={padding:20,margin:10,width:"100%"};

  // HOME
  if(screen==="home"){
    return(
      <div style={{padding:20}}>
        <h1>AUTOFEST</h1>

        <button style={big} onClick={()=>setScreen("setup")}>Start Event</button>
        <button style={big} onClick={()=>setScreen("judge")}>Judge Login</button>
      </div>
    );
  }

  // SETUP
  if(screen==="setup"){
    return(
      <div style={{padding:20}}>
        <h2>Setup</h2>

        <input placeholder="Event Name"
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

        <button style={big} onClick={()=>setScreen("judge")}>
          Start Event
        </button>

        <button style={big} onClick={()=>setScreen("home")}>
          Back
        </button>
      </div>
    );
  }

  // JUDGE
  if(screen==="judge"){
    return(
      <div style={{padding:20}}>
        <h2>Select Judge</h2>

        {judges.map((j,i)=>(
          <button key={i} style={big}
            onClick={()=>{setActiveJudge(j);setScreen("score")}}>
            {j || `Judge ${i+1}`}
          </button>
        ))}

        <button style={big} onClick={()=>setScreen("home")}>Back</button>
      </div>
    );
  }

  // SCORE
  if(screen==="score"){
    return(
      <div style={{padding:20}}>
        <h3>{eventName} | {activeJudge}</h3>

        <input placeholder="Car #"
          value={car}
          onChange={(e)=>setCar(e.target.value)}
        />

        <button style={big}>Submit Score</button>

        <button style={big} onClick={()=>setScreen("judge")}>
          Next Judge
        </button>

        <button style={big} onClick={()=>setScreen("home")}>
          Home
        </button>
      </div>
    );
  }

  return <div>Loading...</div>;
}
