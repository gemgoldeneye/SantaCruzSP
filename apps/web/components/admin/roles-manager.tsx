"use client";

import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/api";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FEATURE_PERMISSIONS, PAGE_PERMISSIONS } from "@/lib/permissions";

export interface RoleRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isStaff: boolean;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

interface FormState {
  key: string;
  name: string;
  description: string;
  isStaff: boolean;
  permissions: string[];
}

const EMPTY: FormState = {
  key: "",
  name: "",
  description: "",
  isStaff: false,
  permissions: [],
};

export function RolesManager({ initialRoles }: { initialRoles: RoleRow[] }) {
  const [roles, setRoles] = useState<RoleRow[]>(initialRoles);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pending, setPending] = useState(false);
  const [toDelete, setToDelete] = useState<RoleRow | null>(null);

  const load = async () => {
    const res = await adminFetch("/api/admin/roles");
    if (res.ok) setRoles(await res.json());
  };

  const openCreate = () => {
    setForm(EMPTY);
    setCreating(true);
  };

  const openEdit = (role: RoleRow) => {
    setForm({
      key: role.key,
      name: role.name,
      description: role.description ?? "",
      isStaff: role.isStaff,
      permissions: role.permissions,
    });
    setEditing(role);
  };

  const togglePermission = (key: string) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const submit = async () => {
    setPending(true);
    try {
      const res = creating
        ? await adminFetch("/api/admin/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await adminFetch(`/api/admin/roles/${editing!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              description: form.description,
              isStaff: form.isStaff,
              permissions: form.permissions,
            }),
          });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not save the role.");
        return;
      }
      toast.success(creating ? "Role created." : "Role updated.");
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
      const res = await adminFetch(`/api/admin/roles/${toDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not delete the role.");
        return;
      }
      toast.success("Role deleted.");
      setToDelete(null);
      await load();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New role
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Key</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="text-center">Accounts</TableHead>
              <TableHead className="w-px text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No roles yet.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-muted-foreground" />
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px]">
                          built-in
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                    {role.key}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Badge variant={role.isStaff ? "default" : "secondary"}>
                        {role.isStaff ? "Staff" : "Standard"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {role.permissions.length} perms
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {role.userCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit role"
                        onClick={() => openEdit(role)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={
                          role.isSystem
                            ? "Built-in roles cannot be deleted"
                            : role.userCount > 0
                              ? "Reassign accounts before deleting"
                              : "Delete role"
                        }
                        disabled={role.isSystem || role.userCount > 0}
                        onClick={() => setToDelete(role)}
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

      {/* Create / edit dialog */}
      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => !open && closeForm()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creating ? "New role" : "Edit role"}</DialogTitle>
            <DialogDescription>
              {creating
                ? "Define a role and the access it grants."
                : "Update the role's label, description, and access."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="role-key">Key</Label>
              <Input
                id="role-key"
                value={form.key}
                disabled={!creating}
                placeholder="COMMITTEE_CHAIR"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Stable code (UPPER_SNAKE_CASE). Cannot be changed later.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Display name</Label>
              <Input
                id="role-name"
                value={form.name}
                placeholder="Committee Chair"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={form.description}
                placeholder="What this role is for"
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={form.isStaff}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isStaff: e.target.checked }))
                }
              />
              Mark as a staff role (shows the &ldquo;Staff&rdquo; badge)
            </label>

            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Pages this role can open
              </p>
              <p className="text-[11px] text-muted-foreground">
                The Executive Dashboard is always available.
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {PAGE_PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={form.permissions.includes(p.key)}
                      onChange={() => togglePermission(p.key)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Functionalities this role can use
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {FEATURE_PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={form.permissions.includes(p.key)}
                      onChange={() => togglePermission(p.key)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button
              onClick={submit}
              disabled={pending || !form.name || (creating && !form.key)}
            >
              {pending ? "Saving…" : creating ? "Create role" : "Save changes"}
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
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              Delete the <strong>{toDelete?.name}</strong> role. This cannot be
              undone.
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
              {pending ? "Deleting…" : "Delete role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
