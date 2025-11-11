import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;
const WS_URL  = import.meta.env.VITE_WEBSOCKET_URL;

export default function App() {
  const [notes, setNotes] = useState([]);
  const [text, setText]   = useState("");
  const wsRef = useRef(null);

  // WS connect
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => console.log("WS OPEN");
    ws.onclose = () => console.log("WS CLOSED");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "note.created") {
          setNotes((prev) => {
            // منع التكرار إذا نفس الـ id
            if (prev.some(n => n.id === msg.note.id)) return prev;
            return [...prev, msg.note];
          });
        }
        if (msg.type === "notes.sync") {
          setNotes(msg.notes || []);
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  // load notes once
  useEffect(() => {
    axios.get(`${API_URL}/notes`).then(res => setNotes(res.data || []));
  }, []);

  const addNote = async () => {
    const value = text.trim();
    if (!value) return;

    // 1) خزّن في الـ backend
    const { data: saved } = await axios.post(`${API_URL}/notes`, { text: value });

    // 2) أرسل بثّ عبر WS
    wsRef.current?.send(JSON.stringify({ type: "note.created", note: saved }));

    // 3) تحديث متفائل محلي
    setNotes((prev) => [...prev, saved]);
    setText("");
  };

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={addNote}>Add</button>

      <ul>
        {notes.map((n) => (
          <li key={n.id || n.createdAt}>{n.text}</li>
        ))}
      </ul>
    </div>
  );
}
