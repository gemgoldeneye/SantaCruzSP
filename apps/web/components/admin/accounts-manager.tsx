"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/api";
import { members, type BoardMember } from "@/data";

import { Badge } from "@/components/ui/badge";
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
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";

export interface AccountRow {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isDemo: boolean;
}

export interface RoleOption {
  id: string;
  name: string;
  roleKey: string;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  roleId: string;
  district: string;
}

// A Sanggunian board member IS an account whose role is legislative.
const LEGISLATIVE_ROLE_KEYS = ["presiding_officer", "member"];

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export function AccountsManager({
  initialAccounts,
  initialRoles,
}: {
  initialAccounts: AccountRow[];
  initialRoles: RoleOption[];
}) {
  const [accounts, setAccounts] = useState<AccountRow[]>(initialAccounts);
  const [roles, setRoles] = useState<RoleOption[]>(initialRoles);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    roleId: "",
    district: "",
  });
  const [pending, setPending] = useState(false);
  const [toDelete, setToDelete] = useState<AccountRow | null>(null);

  // The synced council roster — mirrors legislative accounts (keyed by user id) so
  // committees / authorship / dashboard resolve members without a separate Roster.
  const memberList = members.useItems();
  const roleOf = (roleId: string) => roles.find((r) => r.id === roleId);
  const isLegislative = (roleId: string) => {
    const r = roleOf(roleId);
    return !!r && LEGISLATIVE_ROLE_KEYS.includes(r.roleKey);
  };

  const load = async () => {
    const [accRes, roleRes] = await Promise.all([
      adminFetch("/api/admin/accounts"),
      adminFetch("/api/admin/roles"),
    ]);
    if (accRes.ok) setAccounts(await accRes.json());
    if (roleRes.ok) {
      const data = (await roleRes.json()) as RoleOption[];
      setRoles(data.map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey })));
    }
  };

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", roleId: roles[0]?.id ?? "", district: "" });
    setCreating(true);
  };

  const openEdit = (acc: AccountRow) => {
    setForm({
      name: acc.name, email: acc.email, password: "", roleId: acc.roleId,
      district: memberList.find((m) => m.id === acc.id)?.district ?? "",
    });
    setEditing(acc);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const submit = async () => {
    setPending(true);
    try {
      const res = creating
        ? await adminFetch("/api/admin/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await adminFetch(`/api/admin/accounts/${editing!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              roleId: form.roleId,
              // Only send a password when the admin typed a new one.
              ...(form.password ? { password: form.password } : {}),
            }),
          });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not save the account.");
        return;
      }
      // Mirror this account into the synced council roster: upsert if its role is
      // legislative (presiding_officer / member), else drop any stale roster entry.
      const userId = creating
        ? ((await res.json().catch(() => ({}))) as { id?: string }).id
        : editing!.id;
      if (userId) {
        const role = roleOf(form.roleId);
        if (role && LEGISLATIVE_ROLE_KEYS.includes(role.roleKey)) {
          const entry: BoardMember = { id: userId, name: form.name, district: form.district, role: role.name };
          if (memberList.some((m) => m.id === userId)) members.update(userId, { name: entry.name, district: entry.district, role: entry.role });
          else members.add(entry);
        } else if (memberList.some((m) => m.id === userId)) {
          members.remove(userId);
        }
      }
      toast.success(creating ? "Account created." : "Account updated.");
      closeForm();
      await load();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setPending(true);
    try {
      const res = await adminFetch(`/api/admin/accounts/${toDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not delete the account.");
        return;
      }
      toast.success("Account deleted.");
      if (memberList.some((m) => m.id === toDelete.id)) members.remove(toDelete.id);
      setToDelete(null);
      await load();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const pager = usePagination(accounts, 10);

  const canSubmit =
    form.name &&
    form.email &&
    form.roleId &&
    (creating ? form.password.length >= 6 : true);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={roles.length === 0}>
          <Plus className="size-4" />
          New account
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-px text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No accounts yet.
                </TableCell>
              </TableRow>
            ) : (
              pager.pageItems.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <UserRound className="size-4 text-muted-foreground" />
                      {acc.name}
                      {acc.isDemo && (
                        <Badge variant="secondary" className="text-[10px]">
                          demo
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {acc.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{acc.roleName}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit account"
                        onClick={() => openEdit(acc)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete account"
                        onClick={() => setToDelete(acc)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={pager.page}
        pageCount={pager.pageCount}
        total={pager.total}
        from={pager.from}
        to={pager.to}
        onPageChange={pager.setPage}
        noun="account"
      />

      {/* Create / edit dialog */}
      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => !open && closeForm()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creating ? "New account" : "Edit account"}</DialogTitle>
            <DialogDescription>
              {creating
                ? "Create a sign-in account and assign it a role."
                : "Update the account's details, role, or password."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Full name</Label>
              <Input
                id="acc-name"
                value={form.name}
                placeholder="Hon. Juan dela Cruz"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-email">Email</Label>
              <Input
                id="acc-email"
                type="email"
                value={form.email}
                placeholder="juan.delacruz@santacruz.gov.ph"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-role">Role</Label>
              <select
                id="acc-role"
                className={selectClass}
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {isLegislative(form.roleId) && (
              <div className="space-y-1.5">
                <Label htmlFor="acc-district">Position / Designation</Label>
                <Input
                  id="acc-district"
                  value={form.district}
                  placeholder="e.g. Majority Floor Leader · District 1 · At-large"
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  This account is a Sanggunian member — shown in the council roster &amp; committees.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="acc-password">
                {creating ? "Password" : "New password"}
              </Label>
              <Input
                id="acc-password"
                type="password"
                value={form.password}
                autoComplete="new-password"
                placeholder={creating ? "At least 6 characters" : "Leave blank to keep current"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button onClick={submit} disabled={pending || !canSubmit}>
              {pending ? "Saving…" : creating ? "Create account" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              Delete <strong>{toDelete?.name}</strong> ({toDelete?.email}). They
              will no longer be able to sign in. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
