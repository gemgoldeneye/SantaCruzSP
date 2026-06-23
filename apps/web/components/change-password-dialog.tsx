'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/** Self-service change-password dialog — any signed-in user rotates their OWN
 *  password (POST /auth/password). Admin-initiated resets use the Accounts page. */
export function ChangePasswordDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }): ReactNode {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);

  const reset = (): void => { setCurrent(''); setNext(''); setConfirm(''); };
  const mismatch = confirm.length > 0 && next !== confirm;
  const valid = current.length >= 1 && next.length >= 8 && next === confirm;

  const submit = async (): Promise<void> => {
    if (!valid) return;
    setPending(true);
    try {
      await api.changePassword(current, next);
      toast.success('Password changed.');
      reset();
      onOpenChange(false);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      toast.error(err.status === 403 ? 'Current password is incorrect.' : (err.message ?? 'Failed to change password.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="dark">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Set a new password for your account. Minimum 8 characters.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cp-current">Current password</Label>
            <Input id="cp-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-new">New password</Label>
            <Input id="cp-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-confirm">Confirm new password</Label>
            <Input id="cp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {mismatch && <p className="text-xs text-destructive">Passwords don&apos;t match.</p>}
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
          <Button onClick={submit} disabled={!valid || pending}>{pending ? 'Saving…' : 'Change password'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
