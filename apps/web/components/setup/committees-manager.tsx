'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { uuidv7 } from '@/store';
import { committees, members, type Committee } from '@/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/** Committees CRUD — chair + roster reference the SB members collection. */
export function CommitteesManager(): ReactNode {
  const list = committees.useItems();
  const roster = members.useItems();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Committee | null>(null);
  const [name, setName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [chairId, setChairId] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<Committee | null>(null);

  const reset = (): void => { setName(''); setJurisdiction(''); setChairId(''); setMemberIds([]); };
  const openAdd = (): void => { setEditing(null); reset(); setOpen(true); };
  const openEdit = (c: Committee): void => {
    setEditing(c); setName(c.name); setJurisdiction(c.jurisdiction); setChairId(c.chairId ?? '');
    setMemberIds(c.roster.map((r) => r.boardMemberId)); setOpen(true);
  };
  const toggleMember = (id: string): void =>
    setMemberIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const nameOf = (id?: string): string => roster.find((m) => m.id === id)?.name ?? '—';

  const valid = name.trim() !== '';
  const save = (): void => {
    if (!valid) return;
    const patch = {
      name: name.trim(), jurisdiction: jurisdiction.trim(),
      chairId: chairId || undefined, roster: memberIds.map((boardMemberId) => ({ boardMemberId })),
    };
    try {
      if (editing) { committees.update(editing.id, patch); toast.success('Saved.'); }
      else { committees.add({ id: uuidv7(), ...patch }); toast.success('Added.'); }
      setOpen(false);
    } catch { toast.error('Could not save.'); }
  };
  const remove = (): void => {
    if (!confirm) return;
    try { committees.remove(confirm.id); toast.success('Removed.'); } catch { toast.error('Could not remove.'); }
    setConfirm(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}><Plus className="size-4" />Add committee</Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No committees yet. {roster.length === 0 && 'Add SB members in the Roster tab first, then assign them here.'}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {c.jurisdiction || 'No jurisdiction'} · Chair: {nameOf(c.chairId)} · {c.roster.length} member(s)
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm(c)}><Trash2 className="size-3.5 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dark">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit committee' : 'Add committee'}</DialogTitle>
            <DialogDescription>Saved on this device and synced automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Committee on Appropriations" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-jur">Jurisdiction</Label>
              <Input id="c-jur" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="Budget &amp; finance" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-chair">Chair</Label>
              <select id="c-chair" value={chairId} onChange={(e) => setChairId(e.target.value)}
                className="w-full rounded-lg border border-border/70 bg-white/80 px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">—</option>
                {roster.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Members</Label>
              {roster.length === 0 ? (
                <p className="text-xs text-muted-foreground">No SB members yet — add them in the Roster tab.</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {roster.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
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
            <DialogTitle>Remove this committee?</DialogTitle>
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
