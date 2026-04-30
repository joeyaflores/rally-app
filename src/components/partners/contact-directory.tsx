"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  Phone,
  Mail,
  ChevronDown,
  Handshake,
  Trash2,
  Check,
  Users,
} from "lucide-react";
import {
  createContact,
  updateContact,
  deleteContact,
  incrementCollab,
} from "@/lib/contacts";
import type {
  Contact,
  ContactCategory,
  ContactRelationship,
} from "@/lib/contact-types";
import { formatPhone } from "@/lib/format";

/* ─── Config ─── */

const CATEGORIES: {
  id: ContactCategory;
  label: string;
  color: string;
}[] = [
  { id: "pt", label: "PT / recovery", color: "#059669" },
  { id: "nutrition", label: "nutrition", color: "#D97706" },
  { id: "apparel", label: "apparel / gear", color: "#29741d" },
  { id: "local", label: "local biz", color: "#FF6B35" },
  { id: "media", label: "media / photo", color: "#E1306C" },
  { id: "venue", label: "venue / space", color: "#0891B2" },
  { id: "fitness", label: "fitness", color: "#8B5CF6" },
  { id: "sponsor", label: "sponsor", color: "#475569" },
  { id: "other", label: "other", color: "#6B7280" },
];

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

const RELATIONSHIPS: { id: ContactRelationship; label: string; bg: string }[] = [
  { id: "prospect", label: "prospect", bg: "bg-amber-100 text-amber-700" },
  { id: "reached-out", label: "reached out", bg: "bg-blue-100 text-blue-700" },
  { id: "active", label: "active", bg: "bg-emerald-100 text-emerald-700" },
  { id: "invested", label: "invested", bg: "bg-purple-100 text-purple-700" },
  { id: "go-to", label: "go-to", bg: "bg-navy/10 text-navy" },
  { id: "inactive", label: "inactive", bg: "bg-secondary text-muted-foreground" },
];

const RELATIONSHIP_MAP = new Map(RELATIONSHIPS.map((r) => [r.id, r]));

/* ─── Delete confirm (reusable pattern) ─── */

function DeleteConfirm({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    setConfirming(true);
    timerRef.current = setTimeout(() => setConfirming(false), 3000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!confirming) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          start();
        }}
        className="rounded-md p-1 text-muted-foreground/30 transition-colors hover:bg-secondary hover:text-muted-foreground"
        title="Delete contact"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] font-medium text-rose-500/80">delete?</span>
      <button
        onClick={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          onConfirm();
        }}
        className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/10 text-rose-500 transition-colors hover:bg-rose-500/20"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={() => {
          setConfirming(false);
          if (timerRef.current) clearTimeout(timerRef.current);
        }}
        className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─── Shared styles ─── */

const INPUT_CLS =
  "w-full rounded-lg border border-border/50 px-3 py-1.5 text-sm outline-none focus:border-navy/30";
const SELECT_CLS = `${INPUT_CLS} bg-white`;
const LABEL_CLS =
  "mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50";

type ContactUpdate = Partial<
  Pick<Contact, "name" | "brand" | "email" | "phone" | "category" | "relationship" | "notes">
>;

const EDITABLE_FIELDS: (keyof ContactUpdate)[] = [
  "name", "brand", "email", "phone", "category", "relationship", "notes",
];

/* ─── Contact card ─── */

function ContactCard({
  contact,
  onUpdate,
  onDelete,
  onCollab,
}: {
  contact: Contact;
  onUpdate: (id: string, data: ContactUpdate) => void;
  onDelete: (id: string) => void;
  onCollab: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ContactUpdate | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function startEditing() {
    setForm({
      name: contact.name,
      brand: contact.brand,
      email: contact.email,
      phone: contact.phone,
      category: contact.category,
      relationship: contact.relationship,
      notes: contact.notes,
    });
    setEditing(true);
  }

  const cat = CATEGORY_MAP.get(contact.category);
  const rel = RELATIONSHIP_MAP.get(contact.relationship);

  function commit() {
    if (!form) { setEditing(false); return; }
    const updates: ContactUpdate = {};
    for (const f of EDITABLE_FIELDS) {
      if (form[f] !== contact[f]) {
        (updates as Record<string, unknown>)[f] = form[f];
      }
    }
    if (Object.keys(updates).length > 0) onUpdate(contact.id, updates);
    setEditing(false);
    setForm(null);
  }

  function handleBlur(e: React.FocusEvent) {
    if (
      editing &&
      containerRef.current &&
      !containerRef.current.contains(e.relatedTarget as Node)
    ) {
      commit();
    }
  }

  if (editing && form) {
    return (
      <div
        ref={containerRef}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Escape") commit();
        }}
        className="animate-fade-up rounded-2xl border border-navy/20 bg-white p-4 shadow-sm ring-2 ring-navy/10"
      >
        <div className="space-y-3">
          {/* Row 1: brand + name */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>brand / company</label>
              <input
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                autoFocus
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>contact name</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Row 2: phone + email */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>phone</label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                type="tel"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>email</label>
              <input
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                type="email"
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Row 3: category + relationship */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ContactCategory,
                  }))
                }
                className={SELECT_CLS}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>relationship</label>
              <select
                value={form.relationship}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    relationship: e.target.value as ContactRelationship,
                  }))
                }
                className={SELECT_CLS}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL_CLS}>notes</label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={commit}
              className="rounded-lg bg-navy px-4 py-1.5 font-display text-xs font-medium uppercase text-white transition-opacity hover:opacity-90"
            >
              done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer rounded-2xl border border-border/50 bg-white p-4 shadow-sm transition-all hover:border-navy/15 hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Category dot */}
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: cat?.color || CATEGORY_MAP.get("other")!.color }}
          title={cat?.label}
        />

        {/* Brand + name */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate font-display text-base tracking-tight text-navy">
              {contact.brand || contact.name || "unnamed"}
            </p>
            {contact.brand && contact.name && (
              <span className="hidden shrink-0 text-xs text-muted-foreground/50 sm:inline">
                {contact.name}
              </span>
            )}
          </div>
        </div>

        {/* Collab count */}
        {contact.collab_count > 0 && (
          <div
            className="flex items-center gap-1 rounded-full bg-navy/8 px-2 py-0.5"
            title={`${contact.collab_count} collaboration${contact.collab_count !== 1 ? "s" : ""}`}
          >
            <Handshake className="h-3 w-3 text-navy/50" />
            <span className="text-[11px] font-medium text-navy/70">
              {contact.collab_count}
            </span>
          </div>
        )}

        {/* Relationship badge */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${rel?.bg || ""}`}
        >
          {rel?.label || contact.relationship}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Expanded details */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3" onClick={(e) => e.stopPropagation()}>
            {/* Mobile name row */}
            {contact.brand && contact.name && (
              <p className="mb-2 text-sm text-muted-foreground sm:hidden">
                {contact.name}
              </p>
            )}

            {/* Contact actions */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1.5 rounded-lg bg-secondary/70 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-secondary"
                >
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="tabular-nums">{formatPhone(contact.phone)}</span>
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 rounded-lg bg-secondary/70 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-secondary"
                >
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {contact.email}
                </a>
              )}
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: cat?.color }}>
                {cat?.label}
              </span>
            </div>

            {/* Notes */}
            {contact.notes && (
              <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {contact.notes}
              </p>
            )}

            {/* Last collab */}
            {contact.last_collab && (
              <p className="mb-3 text-[11px] text-muted-foreground/40">
                last collab:{" "}
                {new Date(contact.last_collab + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-border/30 pt-3">
              <button
                onClick={startEditing}
                className="rounded-lg bg-secondary px-3 py-1.5 font-display text-xs font-medium uppercase text-foreground transition-colors hover:bg-secondary/80"
              >
                edit
              </button>
              <button
                onClick={() => onCollab(contact.id)}
                className="flex items-center gap-1.5 rounded-lg bg-navy/8 px-3 py-1.5 font-display text-xs font-medium uppercase text-navy transition-colors hover:bg-navy/15"
              >
                <Handshake className="h-3 w-3" />
                log collab
              </button>
              <div className="ml-auto">
                <DeleteConfirm onConfirm={() => onDelete(contact.id)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Add form ─── */

function AddContactForm({
  onAdd,
  onCancel,
}: {
  onAdd: (contact: Contact) => void;
  onCancel: () => void;
}) {
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ContactCategory>("other");
  const [relationship, setRelationship] = useState<ContactRelationship>("prospect");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit() {
    if (!brand.trim() && !name.trim()) return;
    setCreating(true);
    try {
      const contact = await createContact({
        name: name.trim(),
        brand: brand.trim(),
        phone: phone.trim(),
        email: email.trim(),
        category,
        relationship,
        notes: notes.trim(),
      });
      onAdd(contact);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="animate-fade-up rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {/* Brand + name */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLS}>brand / company</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Fleet Feet, PT..."
              autoFocus
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>contact person</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="name"
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Phone + email */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLS}>phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              type="tel"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              type="email"
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Category pills */}
        <div>
          <label className={LABEL_CLS}>category</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-full px-2.5 py-1 font-display text-[11px] font-medium uppercase transition-all ${
                  category === c.id
                    ? "text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                style={
                  category === c.id
                    ? { backgroundColor: c.color }
                    : undefined
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Relationship */}
        <div>
          <label className={LABEL_CLS}>relationship</label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as ContactRelationship)}
            className={SELECT_CLS}
          >
            {RELATIONSHIPS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={LABEL_CLS}>notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="how you know them, what they offer..."
            rows={2}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={(!brand.trim() && !name.trim()) || creating}
            className="rounded-lg bg-navy px-4 py-1.5 font-display text-xs font-medium uppercase text-white transition-opacity disabled:opacity-30"
          >
            {creating ? "adding..." : "add contact"}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 font-display text-xs uppercase text-muted-foreground transition-colors hover:text-foreground"
          >
            cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main directory ─── */

export function ContactDirectory({
  initialContacts,
}: {
  initialContacts: Contact[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] =
    useState<ContactCategory | null>(null);
  const [adding, setAdding] = useState(false);

  // Single-pass: filter, group, and count
  const { filtered, grouped, sortedCategories, categoryCounts } = useMemo(() => {
    const q = search.toLowerCase();
    const _filtered: Contact[] = [];
    const _grouped = new Map<ContactCategory, Contact[]>();
    const _counts = new Map<ContactCategory, number>();

    for (const c of contacts) {
      _counts.set(c.category, (_counts.get(c.category) || 0) + 1);

      if (filterCategory && c.category !== filterCategory) continue;
      if (q && !(
        c.brand.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        (CATEGORY_MAP.get(c.category)?.label || "").includes(q)
      )) continue;

      _filtered.push(c);
      const arr = _grouped.get(c.category) || [];
      arr.push(c);
      _grouped.set(c.category, arr);
    }

    const _sorted = CATEGORIES.filter((cat) => _grouped.has(cat.id));
    return { filtered: _filtered, grouped: _grouped, sortedCategories: _sorted, categoryCounts: _counts };
  }, [contacts, search, filterCategory]);

  async function handleUpdate(id: string, data: ContactUpdate) {
    const prev = contacts;
    setContacts((p) =>
      p.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    try { await updateContact(id, data); }
    catch { setContacts(prev); }
  }

  async function handleDelete(id: string) {
    const prev = contacts;
    setContacts((p) => p.filter((c) => c.id !== id));
    try { await deleteContact(id); }
    catch { setContacts(prev); }
  }

  async function handleCollab(id: string) {
    const prev = contacts;
    const today = new Date().toISOString().slice(0, 10);
    setContacts((p) =>
      p.map((c) =>
        c.id === id
          ? { ...c, collab_count: c.collab_count + 1, last_collab: today }
          : c
      )
    );
    try { await incrementCollab(id); }
    catch { setContacts(prev); }
  }

  function handleAdd(contact: Contact) {
    setContacts((prev) => [...prev, contact]);
    setAdding(false);
  }

  return (
    <div className="space-y-6">
      {/* Helper text */}
      <p className="text-center font-display text-sm uppercase text-muted-foreground">
        partners, sponsors, and contacts you&apos;ve worked with or want to.
        <br className="hidden sm:block" />
        {" "}filter by category, track collaborations, and find the right people
        for every event.
      </p>

      {/* Search + add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search contacts..."
            className="w-full rounded-xl border border-border/50 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition-colors focus:border-navy/30"
          />
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-xs font-medium uppercase transition-all ${
            adding
              ? "bg-secondary text-muted-foreground"
              : "bg-navy text-white"
          }`}
        >
          {adding ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {adding ? "cancel" : "add"}
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterCategory(null)}
          className={`rounded-full px-3 py-1 font-display text-[11px] font-medium uppercase transition-all ${
            filterCategory === null
              ? "bg-navy text-white"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          all
          <span className="ml-1 opacity-60">{contacts.length}</span>
        </button>
        {CATEGORIES.map((c) => {
          const count = categoryCounts.get(c.id) || 0;
          if (count === 0) return null;
          return (
            <button
              key={c.id}
              onClick={() =>
                setFilterCategory(filterCategory === c.id ? null : c.id)
              }
              className={`rounded-full px-3 py-1 font-display text-[11px] font-medium uppercase transition-all ${
                filterCategory === c.id
                  ? "text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              style={
                filterCategory === c.id
                  ? { backgroundColor: c.color }
                  : undefined
              }
            >
              {c.label}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {adding && <AddContactForm onAdd={handleAdd} onCancel={() => setAdding(false)} />}

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display text-sm uppercase text-muted-foreground">
            {contacts.length === 0
              ? "no contacts yet — add your first partner above"
              : "no contacts match your search"}
          </p>
        </div>
      ) : filterCategory || search ? (
        // Flat list when filtering/searching
        <div className="space-y-2">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onCollab={handleCollab}
            />
          ))}
        </div>
      ) : (
        // Grouped by category when showing all
        <div className="space-y-6">
          {sortedCategories.map((cat) => {
            const catContacts = grouped.get(cat.id)!;
            return (
              <div key={cat.id}>
                <h3 className="mb-2 flex items-center gap-2 px-1 font-display text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                  <span className="normal-case tracking-normal text-muted-foreground/40">
                    {catContacts.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {catContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onCollab={handleCollab}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
