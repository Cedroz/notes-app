import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors({
  origin: "https://frontendnotes-seven.vercel.app", // your deployed frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// GET all notes
app.get("/notes", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({ orderBy: { id: "desc" } });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST create a note
app.post("/notes", async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await prisma.note.create({ data: { title, content } });
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// PUT update a note
app.put("/notes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content } = req.body;
    const note = await prisma.note.update({ where: { id }, data: { title, content } });
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE a note
app.delete("/notes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Check if note exists first
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    await prisma.note.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});



const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
