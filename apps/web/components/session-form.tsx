"use client";

import { useEffect, useState } from "react";
import { GripVertical, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  documents as documentsCol,
  sessions as sessionsCol,
  type SpSession,
} from "@/data";
import { todayISO, uuidv7 } from "@/store";

const MODE_OPTIONS: { value: SpSession["mode"]; label: string }[] = [
  { value: "in_person", label: "In-person" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
];

const STATUS_OPTIONS: { value: SpSession["status"]; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In session" },
  { value: "adjourned", label: "Adjourned" },
];

const AGENDA_TYPES = [
  "Call to Order",
  "Roll Call",
  "Approval of Minutes",
  "First Reading",
  "Committee Report",
  "Second Reading",
  "Third Reading",
  "Unfinished Business",
  "Other Matters",
  "Adjournment",
];

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

type SessionAgendaItem = SpSession["agenda"][number];

interface AgendaRow {
  id: string;
  type: string;
  title: string;
  documentRef: string;
}

interface FormState {
  title: string;
  date: string;
  mode: SpSession["mode"];
  status: SpSession["status"];
  /** Existing items (edit mode only) — append-only on the server, so locked. */
  locked: SessionAgendaItem[];
  /** New items the user is adding now (fully editable). */
  added: AgendaRow[];
}

function emptyForm(): FormState {
  return {
    title: "",
    date: todayISO(),
    mode: "in_person",
    status: "scheduled",
    locked: [],
    added: [{ id: uuidv7(), type: "Call to Order", title: "Call to Order", documentRef: "" }],
  };
}

function formFrom(session: SpSession): FormState {
  return {
    title: session.title,
    date: session.date.slice(0, 10),
    mode: session.mode,
    status: session.status,
    locked: session.agenda.slice().sort((a, b) => a.order - b.order),
    added: [],
  };
}

/** Create / edit a paperless session and its order of business. Writes to the
 *  offline-first `sessions` collection (enqueues a sync mutation). */
export function SessionForm({
  open,
  onOpenChange,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → edit mode; absent → create mode. */
  session?: SpSession;
}) {
  const docs = documentsCol.useItems();
  const [form, setForm] = useState<FormState>(emptyForm);

  // Reset the form whenever the dialog opens (fresh for create, prefilled for edit).
  useEffect(() => {
    if (open) setForm(session ? formFrom(session) : emptyForm());
  }, [open, session]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setRow = (id: string, patch: Partial<AgendaRow>) =>
    setForm((f) => ({
      ...f,
      added: f.added.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const addRow = () =>
    setForm((f) => ({
      ...f,
      added: [...f.added, { id: uuidv7(), type: "Other Matters", title: "", documentRef: "" }],
    }));

  const removeRow = (id: string) =>
    setForm((f) => ({ ...f, added: f.added.filter((r) => r.id !== id) }));

  const submit = () => {
    const title = form.title.trim();
    if (!title) {
      toast.error("Give the session a title.");
      return;
    }
    // Locked items are sent back byte-identical so the server's append-only
    // union-merge dedupes them; new items continue the order sequence.
    const startOrder = form.locked.reduce((max, a) => Math.max(max, a.order), 0);
    const newItems = form.added
      .filter((r) => r.title.trim() || r.type.trim())
      .map((r, i): SessionAgendaItem => ({
        id: r.id,
        order: startOrder + i + 1,
        type: r.type.trim() || "Other Matters",
        title: r.title.trim() || r.type.trim(),
        ...(r.documentRef ? { documentRef: r.documentRef } : {}),
      }));
    const agenda = [...form.locked, ...newItems];

    if (session) {
      sessionsCol.update(session.id, {
        title,
        date: form.date,
        mode: form.mode,
        status: form.status,
        ...(newItems.length > 0 ? { agenda } : {}),
      });
      toast.success("Session updated.");
    } else {
      sessionsCol.add({
        id: uuidv7(),
        title,
        date: form.date,
        mode: form.mode,
        status: form.status,
        agenda,
      });
      toast.success("Session created.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{session ? "Edit session" : "New session"}</DialogTitle>
          <DialogDescription>
            {session
              ? "Update the session details and order of business."
              : "Schedule a session and build its order of business."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              value={form.title}
              placeholder="Regular Session No. 12, Series of 2026"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                value={form.date.slice(0, 10)}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-mode">Mode</Label>
              <select
                id="session-mode"
                className={SELECT_CLASS}
                value={form.mode}
                onChange={(e) => set("mode", e.target.value as SpSession["mode"])}
              >
                {MODE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-status">Status</Label>
              <select
                id="session-status"
                className={SELECT_CLASS}
                value={form.status}
                onChange={(e) => set("status", e.target.value as SpSession["status"])}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Order of business</p>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-4" /> Add item
              </Button>
            </div>

            {/* Existing items are append-only on the server, so they're locked here. */}
            {form.locked.length > 0 ? (
              <div className="space-y-1">
                {form.locked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
                  >
                    <span className="text-xs text-muted-foreground tabular-nums">{item.order}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-muted-foreground">{item.type}</span> — {item.title}
                    </span>
                    {item.documentRef ? (
                      <span className="font-mono text-[11px] text-muted-foreground">{item.documentRef}</span>
                    ) : null}
                    <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : null}

            {form.locked.length === 0 && form.added.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No agenda items yet. Add the first one.
              </p>
            ) : null}

            {form.added.map((row, i) => (
              <div
                key={row.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md border bg-card/50 p-2"
              >
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <GripVertical className="size-3.5" />
                  {form.locked.length + i + 1}
                </span>
                <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                  <select
                    aria-label="Agenda item type"
                    className={cn(SELECT_CLASS, "sm:col-span-1")}
                    value={AGENDA_TYPES.includes(row.type) ? row.type : ""}
                    onChange={(e) => setRow(row.id, { type: e.target.value })}
                  >
                    <option value="">Custom…</option>
                    {AGENDA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label="Agenda item title"
                    className="sm:col-span-2"
                    value={row.title}
                    placeholder="Item title"
                    onChange={(e) => setRow(row.id, { title: e.target.value })}
                  />
                  <select
                    aria-label="Linked document"
                    className={cn(SELECT_CLASS, "sm:col-span-3")}
                    value={row.documentRef}
                    onChange={(e) => setRow(row.id, { documentRef: e.target.value })}
                  >
                    <option value="">No linked document</option>
                    {docs.map((d) => (
                      <option key={d.id} value={d.ref}>
                        {d.ref} — {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Remove item"
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit} disabled={!form.title.trim()}>
            {session ? "Save changes" : "Create session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
