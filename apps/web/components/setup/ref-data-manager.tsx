'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { uuidv7, type Collection, type Identified } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export type Field =
  | { key: string; label: string; type: 'text' | 'number'; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[]; required?: boolean }
  | { key: string; label: string; type: 'checkbox' };

type Row = Record<string, unknown>;

/** Generic create/edit/delete for a sync-client reference collection (offline-first).
 *  Writes go through the collection (local_only → syncs to this node's api/DB). */
export function RefDataManager<T extends Identified>({
  collection, fields, defaults, renderRow, addLabel, emptyText,
}: {
  collection: Collection<T>;
  fields: Field[];
  defaults: Row;
  renderRow: (item: T) => ReactNode;
  addLabel: string;
  emptyText: string;
}): ReactNode {
  const items = collection.useItems();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Row>(defaults);
  const [confirm, setConfirm] = useState<T | null>(null);

  const openAdd = (): void => { setEditing(null); setForm({ ...defaults }); setOpen(true); };
  const openEdit = (item: T): void => { setEditing(item); setForm({ ...(item as unknown as Row) }); setOpen(true); };

  const set = (k: string, v: unknown): void => setForm((f) => ({ ...f, [k]: v }));

  const valid = fields.every((f) => {
    if (f.type === 'checkbox') return true;
    const v = form[f.key];
    return !('required' in f && f.required) || (v != null && String(v).trim() !== '');
  });

  const save = (): void => {
    if (!valid) return;
    const built: Row = {};
    for (const f of fields) {
      const v = form[f.key];
      built[f.key] = f.type === 'number' ? Number(v ?? 0) : f.type === 'checkbox' ? Boolean(v) : String(v ?? '');
    }
    try {
      if (editing) {
        collection.update(editing.id, built as Partial<T>);
        toast.success('Saved.');
      } else {
        collection.add({ id: uuidv7(), ...built } as unknown as T);
        toast.success('Added.');
      }
      setOpen(false);
    } catch {
      toast.error('Could not save.');
    }
  };

  const remove = (): void => {
    if (!confirm) return;
    try { collection.remove(confirm.id); toast.success('Removed.'); } catch { toast.error('Could not remove.'); }
    setConfirm(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}><Plus className="size-4" />{addLabel}</Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">{renderRow(item)}</div>
              <Button size="sm" variant="outline" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm(item)}><Trash2 className="size-3.5 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dark">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : addLabel}</DialogTitle>
            <DialogDescription>Saved on this device and synced automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                {f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={Boolean(form[f.key])} onChange={(e) => set(f.key, e.target.checked)} />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
                    {f.type === 'select' ? (
                      <select
                        id={`f-${f.key}`}
                        value={String(form[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                        className="w-full rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="">—</option>
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <Input
                        id={`f-${f.key}`}
                        type={f.type === 'number' ? 'number' : 'text'}
                        placeholder={f.placeholder}
                        value={String(form[f.key] ?? '')}
                        onChange={(e) => set(f.key, e.target.value)}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={save} disabled={!valid}>{editing ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm != null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="dark">
          <DialogHeader>
            <DialogTitle>Remove this entry?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={remove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
