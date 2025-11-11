import express, { json } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(json());

let notes = [];

app.get("/notes", (req, res) => {
  res.json(notes);
});

app.post("/notes", (req, res) => {
  const { text } = req.body;
  notes.push({ text, time: new Date() });npm
  res.json({ success: true });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
