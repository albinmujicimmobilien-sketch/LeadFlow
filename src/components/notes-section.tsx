"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Note = { id: string; body: string; createdAt: string | Date };

export function NotesSection({ leadId, notes }: { leadId: string; notes: Note[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!text.trim()) return;
    setSaving(true);
    await fetch(`/api/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setText("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          rows={2}
          placeholder="Notiz hinzufügen (z.B. Telefonat, Besichtigungstermin)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div>
          <Button type="button" size="sm" variant="secondary" onClick={addNote} disabled={saving}>
            Notiz speichern
          </Button>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {notes.map((note) => (
          <li key={note.id} className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p className="whitespace-pre-wrap">{note.body}</p>
            <p className="mt-1 text-xs text-neutral-400">
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(note.createdAt),
              )}
            </p>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-neutral-400">Noch keine Notizen.</p>}
      </ul>
    </div>
  );
}
