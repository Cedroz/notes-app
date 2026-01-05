import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient(); // Prisma client

// Warm up Prisma to avoid first-request latency
(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Prisma warmed up");
  } catch (e) {
    console.error("Prisma warmup failed", e);
  }
})();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-ANON-ID"],
  })
);

// Anonymous ID middleware
app.use((req, res, next) => {
  const anonId = req.header("X-ANON-ID");
  if (anonId) {
    (req as any).anonId = anonId;
  } else {
    console.warn("Request without X-ANON-ID header");
  }
  next();
});

// GET notes
app.get("/notes", async (req, res) => {
  try {
    const anonId = (req as any).anonId;
    if (!anonId) return res.json([]);

    const notes = await prisma.note.findMany({
      where: { anonId } as any,
      orderBy: { createdAt: "desc" } as any,
    });
    res.json(notes);
  } catch (err) {
    console.error("GET /notes error:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST note
app.post("/notes", async (req, res) => {
  try {
    const anonId = (req as any).anonId;
    if (!anonId) return res.status(400).json({ error: "Missing anonymous ID" });

    const { title, content } = req.body;
    const note = await prisma.note.create({
      data: { title, content, anonId } as any,
    });

    res.status(201).json(note);
  } catch (err) {
    console.error("POST /notes error:", err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// PUT note
app.put("/notes/:id", async (req, res) => {
  try {
    const anonId = (req as any).anonId;
    if (!anonId) return res.status(400).json({ error: "Missing anonymous ID" });

    const id = Number(req.params.id);
    const { title, content } = req.body;

    const updated = await prisma.note.updateMany({
      where: { id, anonId } as any,
      data: { title, content },
    });

    if (updated.count === 0) return res.status(404).json({ error: "Note not found" });

    const note = await prisma.note.findFirst({ where: { id, anonId } as any });
    res.json(note);
  } catch (err) {
    console.error("PUT /notes/:id error:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE note
app.delete("/notes/:id", async (req, res) => {
  try {
    const anonId = (req as any).anonId;
    if (!anonId) return res.status(400).json({ error: "Missing anonymous ID" });

    const id = Number(req.params.id);

    const deleted = await prisma.note.deleteMany({
      where: { id, anonId } as any,
    });

    if (deleted.count === 0) return res.status(404).json({ error: "Note not found" });

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /notes/:id error:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Start server
const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Disconnecting Prisma and shutting down server...");
  await prisma.$disconnect();
  process.exit();
});
