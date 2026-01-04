import { useState, useEffect } from "react";
import "./App.css";

type Note = {
  id: number;
  title: string;
  content: string;
};

const BACKEND_URL = process.env.REACT_APP_API_URL!;

const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  // Clear form
  const clearForm = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };

  // Fetch notes from backend
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/notes`);
      if (!res.ok) throw new Error("Failed to load notes");
      const data: Note[] = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Select note for editing
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  // Add a new note
  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const note: Note = await res.json();
      setNotes([note, ...notes]);
      clearForm();
    } catch (err) {
      console.error(err);
    }
  };

  // Update existing note
  const handleUpdateNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedNote) return;
    try {
      const res = await fetch(`${BACKEND_URL}/notes/${selectedNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const updatedNote: Note = await res.json();
      setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      clearForm();
    } catch (err) {
      console.error(err);
    }
  };




  // Delete a note
  const deleteNote = async (event: React.MouseEvent, noteId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/notes/${noteId}`, { method: "DELETE" });
      if (res.status === 204) {
        setNotes(notes.filter((n) => n.id !== noteId));
        if (selectedNote?.id === noteId) clearForm();
        return;
      }
      const body = await res.text();
      console.error('Delete failed', res.status, body);
      alert(`Delete failed: ${res.status} ${body}`);
    } catch (err) {
      console.error(err);
      alert(`Delete failed: ${String(err)}`);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Notes</h1>
        <p className="subtitle">Manage your notes below</p>
      </header>

      <aside className="sidebar">
        <form
          className="note-form card"
          onSubmit={(e) => (selectedNote ? handleUpdateNote(e) : handleAddNote(e))}
        >
          <label className="visually-hidden" htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
          />

          <label className="visually-hidden" htmlFor="content">Content</label>
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
                className={`note-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
                onClick={() => handleNoteClick(note)}
              >
                <div className="notes-header">
                  <button
                    aria-label={`Delete note ${note.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteNote(event, note.id);
                    }}
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
