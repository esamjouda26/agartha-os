"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DomainAuditTable from "@/components/DomainAuditTable";
import { fetchStaffUsersAction, updateUserRoleAction, toggleUserLockAction } from "../actions";

const ALL_STAFF_ROLES = [
  "it_admin", "business_admin",
  "fnb_manager", "merch_manager", "maintenance_manager", "inventory_manager",
  "marketing_manager", "human_resources_manager", "compliance_manager", "operations_manager",
  "fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew",
  "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew",
] as const;

interface StaffUser {
  id: string;
  display_name: string | null;
  app_role: string;
  staff_role: string | null;
  is_mfa_enabled: boolean;
  is_locked: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

export default function AccessControlPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchStaffUsersAction();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId: string) {
    const result = await updateUserRoleAction(userId, selectedRole);
    if (result.success) {
      setMessage({ type: "success", text: "Role updated and audit logged." });
      setEditingId(null);
      load();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleToggleLock(userId: string, lock: boolean) {
    const result = await toggleUserLockAction(userId, lock);
    if (result.success) {
      setMessage({ type: "success", text: lock ? "Account locked." : "Account unlocked." });
      load();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  const roleTier = (role: string | null): string => {
    if (!role) return "none";
    if (role.includes("admin")) return "admin";
    if (role.includes("manager")) return "management";
    return "crew";
  };

  const tierColor = (tier: string) => {
    switch (tier) {
      case "admin": return "destructive" as const;
      case "management": return "gold" as const;
      case "crew": return "outline" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Access Control (IAM)</h1>
        <p className="text-muted-foreground text-sm mt-1">Staff role provisioning, MFA status, and account management</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No staff accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["User", "Role", "Tier", "MFA", "Locked", "Last Sign In", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const tier = roleTier(u.staff_role);
                    const isEditing = editingId === u.id;
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium text-foreground">{u.display_name ?? "—"}</span>
                            <span className="block text-[10px] text-muted-foreground font-mono">{u.id.slice(0, 12)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="h-8 rounded border border-border bg-card px-2 text-xs text-foreground">
                              <option value="">Select...</option>
                              {ALL_STAFF_ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          ) : (
                            <Badge variant="outline">{u.staff_role ?? "unassigned"}</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4"><Badge variant={tierColor(tier)}>{tier}</Badge></td>
                        <td className="py-3 px-4">
                          {u.is_mfa_enabled ? (
                            <span className="text-emerald-400 text-xs font-bold">✓ Enabled</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Disabled</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {u.is_locked ? <Badge variant="destructive">Locked</Badge> : <span className="text-muted-foreground text-xs">Active</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {isEditing ? (
                              <>
                                <Button size="sm" variant="default" disabled={!selectedRole} onClick={() => handleRoleChange(u.id)}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>✕</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(u.id); setSelectedRole(u.staff_role ?? ""); }}>Role</Button>
                                <Button size="sm" variant="ghost" onClick={() => handleToggleLock(u.id, !u.is_locked)}>
                                  {u.is_locked ? "Unlock" : "Lock"}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DomainAuditTable entityTypes={["profile", "role", "device"]} title="Admin Audit Trail" />
    </div>
  );
}
