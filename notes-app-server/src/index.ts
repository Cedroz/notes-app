import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

interface CustomRequest extends Request {
  anonId?: string;
}

// Warm up Prisma
(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Prisma warmed up");
  } catch (e) {
    console.error("Prisma warmup failed", e);
  }
})();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-ANON-ID"],
  })
);

// Cache Control Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Anonymous ID Middleware
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
  const anonId = req.header("X-ANON-ID");
  
  res.set("Vary", "X-ANON-ID");

  if (anonId) {
    req.anonId = anonId;
  }
  next();
});

// GET notes
app.get("/notes", async (req: CustomRequest, res: Response) => {
  try {
    const anonId = req.anonId;
    if (!anonId) return res.json([]);

    const notes = await prisma.note.findMany({
      where: { anonId },
      orderBy: { createdAt: "desc" },
    });
    res.json(notes);
  } catch (err) {
    console.error("GET /notes error:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST note
app.post("/notes", async (req: CustomRequest, res: Response) => {
  try {
    const anonId = req.anonId;
    if (!anonId) return res.status(400).json({ error: "Missing anonymous ID" });

    const { title, content } = req.body;
    const note = await prisma.note.create({
      data: { title, content, anonId },
    });

    res.status(201).json(note);
  } catch (err) {
    console.error("POST /notes error:", err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// PUT note
app.put("/notes/:id", async (req: CustomRequest, res: Response) => {
  try {
    const anonId = req.anonId;
    if (!anonId) return res.status(400).json({ error: "Missing anonymous ID" });

    const id = Number(req.params.id);
    const { title, content } = req.body;

    const updated = await prisma.note.updateMany({
      where: { id, anonId },
      data: { title, content },
    });

    if (updated.count === 0) return res.status(404).json({ error: "Note not found" });

    const note = await prisma.note.findFirst({ where: { id, anonId } });
    res.json(note);
  } catch (err) {
    console.error("PUT /notes/:id error:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE note
app.delete("/notes/:id", async (req: CustomRequest, res: Response) => {
  try {
    const anonId = req.anonId;
    if (!anonId) return res.status(400).json({ error: "Missing anonymous ID" });

    const id = Number(req.params.id);

    const deleted = await prisma.note.deleteMany({
      where: { id, anonId },
    });

    if (deleted.count === 0) return res.status(404).json({ error: "Note not found" });

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /notes/:id error:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});