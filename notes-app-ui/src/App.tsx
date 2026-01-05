import { useState, useEffect } from "react";
import "./App.css";

// Anonymous ID generator
function getAnonId(): string {
  const storedId = localStorage.getItem("anon_id");
  if (storedId) return storedId;

  const newId =
    window.crypto && (window.crypto as any).randomUUID
      ? (window.crypto as any).randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

  localStorage.setItem("anon_id", newId);
  return newId;
}

type Note = {
  id: number;
  title: string;
  content: string;
};

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [anonId, setAnonId] = useState<string>("");
  
  // Initialize anonId and fetch notes
  useEffect(() => {
    const id = getAnonId();
    setAnonId(id);

    const fetchNotes = async () => {
      setLoading(true);
      try {
        // Add cache-busting timestamp
        const res = await fetch(`${BACKEND_URL}/notes?_=${Date.now()}`, {
          headers: { "X-ANON-ID": id },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load notes");
        const data: Note[] = await res.json();
        setNotes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Clear form
  const clearForm = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };
  
  // Select note for editing
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/notes?_=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-ANON-ID": anonId },
        body: JSON.stringify({ title, content }),
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to create note");

      const note: Note = await res.json();
      setNotes([note, ...notes]);
      clearForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !anonId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/notes/${selectedNote.id}?_=${Date.now()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-ANON-ID": anonId },
        body: JSON.stringify({ title, content }),
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to update note");

      const updatedNote: Note = await res.json();
      setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      clearForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: number) => {
    e.stopPropagation();
    if (!anonId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/notes/${noteId}?_=${Date.now()}`, {
        method: "DELETE",
        headers: { "X-ANON-ID": anonId },
        cache: "no-store",
      });

      if (res.status === 204) {
        setNotes(notes.filter((n) => n.id !== noteId));
        if (selectedNote?.id === noteId) clearForm();
        return;
      }

      const body = await res.text();
      console.error("Delete failed", res.status, body);
      alert(`Delete failed: ${res.status} ${body}`);
    } catch (err) {
      console.error(err);
      alert(`Delete failed: ${String(err)}`);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="title-row">
          <h1>Notes</h1>
          <div className="anon-id">
            <small className="muted">Guest: {anonId}</small>
            <button
              className="btn-reset"
              onClick={async () => {
                try {
                  localStorage.removeItem("anon_id");

                  const newId = getAnonId();
                  setAnonId(newId);
                  setNotes([]);
                  clearForm();

                  setLoading(true);
                  const res = await fetch(`${BACKEND_URL}/notes?_=${Date.now()}`, {
                    headers: { "X-ANON-ID": newId },
                    cache: "no-store",
                  });

                  if (!res.ok) throw new Error("Failed to load notes");

                  const data: Note[] = await res.json();
                  setNotes(data);
                } catch (err) {
                  console.error(err);
                  setNotes([]);
                } finally {
                  setLoading(false);
                }
              }}
              title="Reset guest ID and start fresh"
            >
              Reset
            </button>
          </div>
        </div>
        <p className="subtitle">Manage your notes below</p>
      </header>

      <aside className="sidebar">
        <form
          className="note-form card"
          onSubmit={(e) => (selectedNote ? handleUpdateNote(e) : handleAddNote(e))}
        >
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            rows={8}
            required
          />
          {selectedNote ? (
            <div className="edit-buttons">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={clearForm} className="btn-cancel">Cancel</button>
            </div>
          ) : (
            <button type="submit" className="btn-primary">Add Note</button>
          )}
        </form>
      </aside>

      <main className="notes-area">
        <div className="notes-grid">
          {loading ? (
            <p>Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="muted">No notes yet — add one!</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? "selected" : ""}`}
                onClick={() => handleNoteClick(note)}
              >
                <div className="notes-header">
                  <button
                    aria-label={`Delete note ${note.title}`}
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    className="delete-btn"
                  >
                    ×
                  </button>
                </div>
                <h2>{note.title}</h2>
                <p className="note-content">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default App;