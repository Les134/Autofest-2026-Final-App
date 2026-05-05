import React, { useState } from "react";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [scores, setScores] = useState([]);

  const [car, setCar] = useState("");
  const [gender, setGender] = useState("");
  const [carClass, setCarClass] = useState("");

  const [scoresData, setScoresData] = useState({
    instant: 0,
    volume: 0,
    constant: 0,
    skill: 0
  });

  const [tyres, setTyres] = useState({ left: false, right: false });
  const [deductions, setDeductions] = useState([]);

  const classes = ["V8 Pro", "V8 N/A", "6 Cyl Pro", "6 Cyl N/A", "4 Cyl Open/Rotary"];

  const toggleDeduction = (name) => {
    setDeductions(deductions.includes(name)
      ? deductions.filter(d => d !== name)
      : [...deductions, name]);
  };

  const toggleTyre = (side) => {
    setTyres({ ...tyres, [side]: !tyres[side] });
  };

  const baseScore =
    scoresData.instant +
    scoresData.volume +
    scoresData.constant +
    scoresData.skill;

  const tyreBonus = (tyres.left ? 5 : 0) + (tyres.right ? 5 : 0);
  const deductionTotal = deductions.length * 10;

  const totalScore = baseScore + tyreBonus - deductionTotal;

  const submitScore = () => {
    if (!car || !gender) return alert("Complete all fields");

    setScores([
      ...scores,
      {
        car,
        gender,
        carClass,
        base: baseScore,
        tyreBonus,
        deductions,
        total: totalScore
      }
    ]);

    setCar("");
    setGender("");
    setCarClass("");
    setScoresData({ instant: 0, volume: 0, constant: 0, skill: 0 });
    setTyres({ left: false, right: false });
    setDeductions([]);
  };

  const grouped = {};
  scores.forEach(s => {
    if (!grouped[s.car]) grouped[s.car] = { ...s, total: 0 };
    grouped[s.car].total += s.total;
  });

  const leaderboard = Object.values(grouped).sort((a, b) => b.total - a.total);
  const females = leaderboard.filter(x => x.gender === "F");

  const button = { margin: 3, padding: 6, border: "1px solid #555", background: "#111", color: "#fff" };
  const active = { ...button, background: "red" };

  function row(r, i) {
    const d = r.deductions.length ? " - " + r.deductions.join(", ") : "";
    return `#${i + 1} | Car ${r.car} | ${r.gender} ${r.base + r.tyreBonus}${d} = ${r.total}`;
  }

  // HOME
  if (screen === "home") {
    return (
      <div style={{ padding: 20, background: "#000", color: "#fff", minHeight: "100vh" }}>
        <h1 style={{ background: "red", padding: 10 }}>AUTOFEST</h1>

        <button style={button} onClick={() => setScreen("score")}>Score Sheet</button>
        <button style={button} onClick={() => setScreen("leaderboard")}>Leaderboards</button>
      </div>
    );
  }

  // SCORE
  if (screen === "score") {
    return (
      <div style={{ padding: 20, background: "#000", color: "#fff" }}>
        <input value={car} onChange={e => setCar(e.target.value)} placeholder="Car No" />

        <div>
          <button style={gender === "M" ? active : button} onClick={() => setGender("M")}>M</button>
          <button style={gender === "F" ? active : button} onClick={() => setGender("F")}>F</button>
        </div>

        <div>
          {classes.map(c => (
            <button key={c} style={carClass === c ? active : button} onClick={() => setCarClass(c)}>
              {c}
            </button>
          ))}
        </div>

        {["instant", "volume", "constant", "skill"].map(type => (
          <div key={type}>
            <p>{type}</p>
            {[...Array(20)].map((_, i) => (
              <button key={i} style={scoresData[type] === i + 1 ? active : button}
                onClick={() => setScoresData({ ...scoresData, [type]: i + 1 })}>
                {i + 1}
              </button>
            ))}
          </div>
        ))}

        <div>
          <button style={tyres.left ? active : button} onClick={() => toggleTyre("left")}>Left +5</button>
          <button style={tyres.right ? active : button} onClick={() => toggleTyre("right")}>Right +5</button>
        </div>

        <div>
          {["fire", "reverse", "barrier", "stop"].map(d => (
            <button key={d} style={deductions.includes(d) ? active : button}
              onClick={() => toggleDeduction(d)}>
              {d}
            </button>
          ))}
        </div>

        <h3>Total: {totalScore}</h3>

        <button style={button} onClick={submitScore}>Submit</button>
        <button style={button} onClick={() => setScreen("home")}>Home</button>
      </div>
    );
  }

  // LEADERBOARD
  if (screen === "leaderboard") {
    return (
      <div style={{ padding: 20, background: "#000", color: "#fff" }}>
        <h2>Overall</h2>
        {leaderboard.map((r, i) => <div key={i}>{row(r, i)}</div>)}

        <h2>Female</h2>
        {females.map((r, i) => <div key={i}>{row(r, i)}</div>)}

        <button onClick={() => window.print()}>Print</button>
        <button onClick={() => setScreen("home")}>Home</button>
      </div>
    );
  }

  return null;
}
