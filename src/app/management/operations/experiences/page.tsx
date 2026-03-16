"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchTierTemplatesAction,
  fetchExperiencesWithTiersAction,
  createTierTemplateAction,
  updateTierTemplateAction,
  deleteTierTemplateAction,
  createExperienceAction,
  updateExperienceAction,
  deleteExperienceAction,
} from "../actions";

// ── Types ───────────────────────────────────────────────────────────────────

interface TierTemplate {
  id: string;
  name: string;
  base_price: number;
  base_duration_minutes: number;
  base_perks: string[];
}

interface ExperienceTier {
  id: string;
  experience_id: string;
  tier_name: string;
  price: number;
  duration_minutes: number;
  perks: string[];
}

interface Experience {
  id: string;
  name: string;
  description: string | null;
  capacity_per_slot: number | null;
  max_facility_capacity: number;
  arrival_window_minutes: number;
  is_active: boolean;
  experience_tiers: ExperienceTier[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const TIER_COLORS = ["#6c5ce7", "#00cec9", "#fd79a8", "#fdcb6e", "#00b894", "#e17055", "#74b9ff", "#a29bfe", "#55efc4", "#fab1a0"];

function getTierColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TIER_COLORS[Math.abs(hash) % TIER_COLORS.length];
}

// ── Page Component ──────────────────────────────────────────────────────────

export default function ExperienceConfigPage() {
  const [tab, setTab] = useState<"experiences" | "templates">("experiences");
  const [templates, setTemplates] = useState<TierTemplate[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [templateModal, setTemplateModal] = useState<{ open: boolean; editing: TierTemplate | null }>({ open: false, editing: null });
  const [expModal, setExpModal] = useState<{ open: boolean; editing: Experience | null }>({ open: false, editing: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: "template" | "experience"; id: string; name: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    const [tpl, exp] = await Promise.all([fetchTierTemplatesAction(), fetchExperiencesWithTiersAction()]);
    setTemplates(tpl as TierTemplate[]);
    setExperiences(exp as Experience[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const selectedExp = experiences.find((e) => e.id === selectedExpId) ?? null;

  // ── Template Modal Logic ────────────────────────────────────────────────

  async function handleSaveTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get("name") as string).trim();
    const base_price = parseFloat(fd.get("base_price") as string);
    const base_duration_minutes = parseInt(fd.get("base_duration_minutes") as string);
    const perksRaw = (fd.get("base_perks") as string).trim();
    const base_perks = perksRaw ? perksRaw.split(",").map((p) => p.trim()).filter(Boolean) : [];

    if (templateModal.editing) {
      const res = await updateTierTemplateAction(templateModal.editing.id, { base_price, base_duration_minutes, base_perks });
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      showToast("Template updated");
    } else {
      const res = await createTierTemplateAction({ name, base_price, base_duration_minutes, base_perks });
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      showToast("Template created");
    }
    setTemplateModal({ open: false, editing: null });
    refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteModal) return;
    if (deleteModal.type === "template") {
      const res = await deleteTierTemplateAction(deleteModal.id);
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      showToast("Template deleted");
    } else {
      const res = await deleteExperienceAction(deleteModal.id);
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      if (selectedExpId === deleteModal.id) setSelectedExpId(null);
      showToast("Experience deleted");
    }
    setDeleteModal(null);
    refresh();
  }

  // ── Experience Modal Logic ──────────────────────────────────────────────

  async function handleSaveExperience(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get("name") as string).trim();
    const description = (fd.get("description") as string).trim();
    const capacity_per_slot = parseInt(fd.get("capacity_per_slot") as string);
    const max_facility_capacity = parseInt(fd.get("max_facility_capacity") as string);
    const arrival_window_minutes = parseInt(fd.get("arrival_window_minutes") as string);
    const is_active = fd.get("is_active") === "on";

    // Gather selected tiers with overrides
    const tiers: { tier_name: string; price: number; duration_minutes: number; perks: string[] }[] = [];
    templates.forEach((tpl, i) => {
      const checked = fd.get(`tier_checked_${i}`) === "on";
      if (checked) {
        const price = parseFloat(fd.get(`tier_price_${i}`) as string) || tpl.base_price;
        const duration = parseInt(fd.get(`tier_duration_${i}`) as string) || tpl.base_duration_minutes;
        const perksStr = (fd.get(`tier_perks_${i}`) as string) || "";
        const perks = perksStr ? perksStr.split(",").map((p) => p.trim()).filter(Boolean) : tpl.base_perks;
        tiers.push({ tier_name: tpl.name, price, duration_minutes: duration, perks });
      }
    });

    if (expModal.editing) {
      const res = await updateExperienceAction(expModal.editing.id, {
        name, description: description || undefined, capacity_per_slot, max_facility_capacity, arrival_window_minutes, is_active,
      });
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      showToast("Experience updated");
    } else {
      const res = await createExperienceAction({
        name, description, capacity_per_slot, max_facility_capacity, arrival_window_minutes, is_active, tiers,
      });
      if (!res.success) { showToast(`Error: ${res.error}`); return; }
      showToast("Experience created");
    }
    setExpModal({ open: false, editing: null });
    refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Loading configuration…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gradient">Master Experience Configuration</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Define tier templates, experiences, capacity limits & arrival windows
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        <button
          onClick={() => setTab("experiences")}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${tab === "experiences" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
        >
          Experiences
        </button>
        <button
          onClick={() => setTab("templates")}
          className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${tab === "templates" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
        >
          Master Tier Templates
        </button>
      </div>

      {/* ═══ TAB 1: EXPERIENCES ═══ */}
      {tab === "experiences" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setExpModal({ open: true, editing: null })}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold py-2 px-5 rounded-lg transition-all text-xs uppercase tracking-widest"
            >
              + New Experience
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: List */}
            <div className="lg:col-span-2 space-y-3">
              {experiences.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center opacity-50">
                  <p className="text-sm text-muted-foreground">No experiences configured</p>
                </div>
              ) : (
                experiences.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedExpId(exp.id)}
                    className={`w-full text-left rounded-xl p-4 border transition-all ${selectedExpId === exp.id ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(108,92,231,0.08)]" : "border-border bg-card/30 hover:border-primary/25"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-foreground truncate pr-4">{exp.name}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${exp.is_active ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
                        {exp.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3 line-clamp-1">{exp.description || "—"}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{exp.capacity_per_slot}/slot</span>
                        <span>{exp.max_facility_capacity} max</span>
                        <span>{exp.arrival_window_minutes}min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {exp.experience_tiers.map((t) => (
                          <span key={t.id} className="w-2.5 h-2.5 rounded-full" style={{ background: getTierColor(t.tier_name) }} title={t.tier_name} />
                        ))}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Right: Detail */}
            <div className="lg:col-span-3">
              <div className="glass rounded-xl p-6 min-h-[60vh]">
                {!selectedExp ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-40 py-20">
                    <p className="text-lg text-muted-foreground/50 font-semibold">Select an Experience</p>
                    <p className="text-[10px] text-muted-foreground/30 tracking-widest mt-1 uppercase">Click a row to view & edit tier rules</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
                      <div>
                        <h2 className="text-lg font-bold tracking-wide">{selectedExp.name}</h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">{selectedExp.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpModal({ open: true, editing: selectedExp })} className="text-[10px] text-muted-foreground hover:text-primary transition uppercase tracking-widest font-bold bg-muted/50 hover:bg-muted border border-border px-3 py-2 rounded">
                          Edit
                        </button>
                        <button onClick={() => setDeleteModal({ open: true, type: "experience", id: selectedExp.id, name: selectedExp.name })} className="text-[10px] text-destructive hover:text-destructive/80 transition uppercase tracking-widest font-bold bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 px-3 py-2 rounded">
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: "Slot Capacity", value: selectedExp.capacity_per_slot },
                        { label: "Max Facility", value: selectedExp.max_facility_capacity, accent: true },
                        { label: "Arrival Window", value: `${selectedExp.arrival_window_minutes}min` },
                        { label: "Status", badge: true },
                      ].map((s, i) => (
                        <div key={i} className="bg-background/30 rounded-lg p-3 border border-border/50">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                          {s.badge ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedExp.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                              {selectedExp.is_active ? "Active" : "Inactive"}
                            </span>
                          ) : (
                            <p className={`text-lg font-bold ${s.accent ? "text-primary" : "text-foreground"}`}>{s.value}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tier Rules */}
                    <h3 className="text-sm font-bold tracking-wider flex items-center gap-2 mb-4 text-primary">
                      TIER RULES
                    </h3>
                    <div className="space-y-3">
                      {selectedExp.experience_tiers.length === 0 ? (
                        <div className="text-center py-8 opacity-40"><p className="text-sm text-muted-foreground">No tiers assigned</p></div>
                      ) : (
                        selectedExp.experience_tiers.map((tier) => {
                          const color = getTierColor(tier.tier_name);
                          const tpl = templates.find((t) => t.name === tier.tier_name);
                          const isOverridden = tpl && (tier.price !== tpl.base_price || tier.duration_minutes !== tpl.base_duration_minutes);
                          return (
                            <div key={tier.id} className="bg-background/30 rounded-lg p-4 border border-border/50 hover:border-primary/25 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                                  <span className="text-sm font-bold uppercase tracking-wider">{tier.tier_name}</span>
                                  <span className="text-lg font-bold">MYR {Number(tier.price).toFixed(2)}</span>
                                  {isOverridden && (
                                    <span className="text-[9px] text-warning font-bold uppercase tracking-widest border border-warning/20 bg-warning/10 px-1.5 py-0.5 rounded">
                                      Overridden
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3">
                                <span>{tier.duration_minutes} min duration</span>
                                {tpl && <span className="text-[10px] text-muted-foreground/50">(template: MYR {Number(tpl.base_price).toFixed(2)}, {tpl.base_duration_minutes}min)</span>}
                              </div>
                              {tier.perks && tier.perks.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {tier.perks.map((p, i) => (
                                    <span key={i} className="inline-flex items-center bg-muted/50 border border-border px-2 py-0.5 rounded text-[11px] text-muted-foreground">{p}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 2: MASTER TIER TEMPLATES ═══ */}
      {tab === "templates" && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Pre-fabricated tier definitions. Experiences inherit defaults from these templates.
            </p>
            <button
              onClick={() => setTemplateModal({ open: true, editing: null })}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold py-2 px-5 rounded-lg transition-all text-xs uppercase tracking-widest"
            >
              + New Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center opacity-50 col-span-full">
                <p className="text-sm text-muted-foreground">No tier templates defined</p>
              </div>
            ) : (
              templates.map((tpl) => {
                const color = getTierColor(tpl.name);
                const usedByCount = experiences.filter((e) => e.experience_tiers.some((t) => t.tier_name === tpl.name)).length;
                return (
                  <div key={tpl.id} className="glass rounded-xl p-4 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-bold uppercase tracking-wider">{tpl.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setTemplateModal({ open: true, editing: tpl })} className="text-muted-foreground hover:text-primary transition p-1 text-xs">✏️</button>
                        <button onClick={() => setDeleteModal({ open: true, type: "template", id: tpl.id, name: tpl.name })} className="text-muted-foreground hover:text-destructive transition p-1 text-xs">🗑</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Base Price</p>
                        <p className="text-sm font-bold">MYR {Number(tpl.base_price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Base Duration</p>
                        <p className="text-sm font-bold">{tpl.base_duration_minutes} min</p>
                      </div>
                    </div>
                    {tpl.base_perks && tpl.base_perks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {tpl.base_perks.map((p, i) => (
                          <span key={i} className="inline-flex items-center bg-muted/50 border border-border px-2 py-0.5 rounded text-[11px] text-muted-foreground">{p}</span>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/50">
                      Used by {usedByCount} experience{usedByCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══ TEMPLATE MODAL ═══ */}
      {templateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm" onClick={() => setTemplateModal({ open: false, editing: null })}>
          <div className="glass rounded-xl p-8 max-w-lg w-full mx-4 border-primary/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-wider">{templateModal.editing ? "Edit Tier Template" : "New Tier Template"}</h3>
              <button onClick={() => setTemplateModal({ open: false, editing: null })} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Tier Name</label>
                <input name="name" defaultValue={templateModal.editing?.name ?? ""} disabled={!!templateModal.editing} required placeholder="e.g. Explorer, VIP, Odyssey" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Base Price (MYR)</label>
                  <input name="base_price" type="number" step="0.01" min="0" defaultValue={templateModal.editing?.base_price ?? ""} required placeholder="89.00" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Base Duration (min)</label>
                  <input name="base_duration_minutes" type="number" min="1" defaultValue={templateModal.editing?.base_duration_minutes ?? ""} required placeholder="60" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Base Perks (comma-separated)</label>
                <input name="base_perks" defaultValue={templateModal.editing?.base_perks?.join(", ") ?? ""} placeholder="Express lane, Free drink, Photo package" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setTemplateModal({ open: false, editing: null })} className="flex-1 py-3 text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-md hover:opacity-90 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EXPERIENCE MODAL ═══ */}
      {expModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm overflow-y-auto py-8" onClick={() => setExpModal({ open: false, editing: null })}>
          <div className="glass rounded-xl p-8 max-w-2xl w-full mx-4 border-primary/20 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-wider">{expModal.editing ? "Edit Experience" : "New Experience"}</h3>
              <button onClick={() => setExpModal({ open: false, editing: null })} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <form onSubmit={handleSaveExperience} className="space-y-5">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Experience Name</label>
                <input name="name" defaultValue={expModal.editing?.name ?? ""} required placeholder="e.g. Agartha World Main" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</label>
                <textarea name="description" defaultValue={expModal.editing?.description ?? ""} placeholder="Brief operational description…" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none resize-none h-16" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Slot Capacity</label>
                  <input name="capacity_per_slot" type="number" min="1" defaultValue={expModal.editing?.capacity_per_slot ?? ""} required placeholder="120" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Max Facility</label>
                  <input name="max_facility_capacity" type="number" min="1" defaultValue={expModal.editing?.max_facility_capacity ?? ""} required placeholder="300" className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Arrival Window (min)</label>
                  <input name="arrival_window_minutes" type="number" min="1" defaultValue={expModal.editing?.arrival_window_minutes ?? 15} required className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Active</label>
                <input name="is_active" type="checkbox" defaultChecked={expModal.editing?.is_active ?? true} className="w-4 h-4 accent-primary cursor-pointer" />
              </div>

              {/* Tier Selection from Templates */}
              {!expModal.editing && (
                <div className="border-t border-border pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] text-primary uppercase tracking-widest font-bold flex items-center gap-2">
                      Assign Tier Templates
                    </h4>
                    <p className="text-[10px] text-muted-foreground">Check tiers, then override values if needed</p>
                  </div>
                  <div className="space-y-3">
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No tier templates available. Create one in the Master Tier Templates tab first.</p>
                    ) : (
                      templates.map((tpl, i) => {
                        const color = getTierColor(tpl.name);
                        return (
                          <TierCheckboxRow key={tpl.id} tpl={tpl} index={i} color={color} />
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setExpModal({ open: false, editing: null })} className="flex-1 py-3 text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest rounded-md hover:opacity-90 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DELETE MODAL ═══ */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm" onClick={() => setDeleteModal(null)}>
          <div className="glass rounded-xl p-8 max-w-sm w-full mx-4 border-destructive/20 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold tracking-wider mb-2">Confirm Deletion</h3>
            <p className="text-sm text-muted-foreground mb-6">Delete &ldquo;{deleteModal.name}&rdquo;? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-3 text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest transition border border-border rounded-md">Cancel</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest rounded-md hover:opacity-90 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-success/90 border border-success text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-[60] animate-in">
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Sub-Component: Tier Checkbox Row ──────────────────────────────────────

function TierCheckboxRow({ tpl, index, color }: { tpl: TierTemplate; index: number; color: string }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className={`rounded-lg p-3 border transition-all ${checked ? "border-primary/40 bg-primary/5" : "border-border bg-background/25 hover:border-primary/20"}`}>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name={`tier_checked_${index}`}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="w-4 h-4 accent-primary cursor-pointer flex-shrink-0"
        />
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-sm font-bold uppercase tracking-wider flex-grow">{tpl.name}</span>
        <span className="text-[10px] text-muted-foreground">MYR {Number(tpl.base_price).toFixed(2)} · {tpl.base_duration_minutes}min</span>
      </label>

      {checked && (
        <div className="pt-3 mt-3 border-t border-border/50 space-y-3 animate-in">
          <p className="text-[9px] text-primary/60 uppercase tracking-widest font-bold">Override for this experience</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Price (MYR)</label>
              <input name={`tier_price_${index}`} type="number" step="0.01" min="0" defaultValue={Number(tpl.base_price).toFixed(2)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Duration (min)</label>
              <input name={`tier_duration_${index}`} type="number" min="1" defaultValue={tpl.base_duration_minutes} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Perks (comma-separated)</label>
            <input name={`tier_perks_${index}`} type="text" defaultValue={tpl.base_perks?.join(", ") ?? ""} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
