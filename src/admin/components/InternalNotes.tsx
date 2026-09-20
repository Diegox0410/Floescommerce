import { useState } from "react";
export function InternalNotes({
  notes,
  onAdd,
}: {
  notes: string[];
  onAdd: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <section className="admin-card admin-form-section">
      <h2>Notas internas</h2>
      <ul className="admin-notes">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
      {!notes.length && (
        <p className="admin-footnote">Aún no hay notas internas.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim()) {
            onAdd(note);
            setNote("");
          }
        }}
      >
        <label className="admin-field">
          <span>Nueva nota interna</span>
          <textarea
            required
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="submit" className="admin-button">
          Añadir nota
        </button>
      </form>
    </section>
  );
}
