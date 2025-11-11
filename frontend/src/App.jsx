const API_URL = "https://devops-backend-kuqq.onrender.com";
const WS_URL  = import.meta.env.VITE_WS_URL  || "ws://localhost:3002";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // 1) Fetch notes
    axios.get("http://localhost:3001/notes")
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]));

    // 2) Stable single WS connection
    const ws = new WebSocket("wss://devops-realtime-sha.onrender.com");
    wsRef.current = ws;

    ws.onopen = () => setWsReady(true);
    ws.onclose = () => setWsReady(false);
    
    ws.onmessage = (e) => {
      try {
        const newNote = JSON.parse(e.data);
        setNotes(prev => [...prev, newNote]);
      } catch (_) {}
    };

    return () => ws.close();
  }, []);

  const addNote = async () => {
  
  
    const payload = { text };
    const localNote = { text, time: new Date().toISOString() };
    setText("");

    // 1) Optimistic UI
    setNotes(prev => [...prev, localNote]);

    try {
      // 2) Persist on backend
      await axios.post("http://localhost:3001/notes", payload);
    } catch (e) {
      console.error("POST /notes failed", e);
    }

    // 3) Broadcast via WS (if open)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(localNote));
    }
  
  };

  return (
    <div style={{ padding: 20, color: "#fff", background: "#121212", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 64, marginBottom: 12 }}>Real-Time Notes</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note"
          style={{ padding: 8, flex: 1 }}
        />
        <button onClick={addNote} style={{ padding: "8px 16px" }}>
          Add
        </button>
      </div>

      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        WS status: {wsReady ? "OPEN ✅" : "CLOSED ⛔"}
      </div>

      <ul>
        {notes.map((n, i) => (
          <li key={i}>
            {n.text} — {n.time ? new Date(n.time).toLocaleTimeString() : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
