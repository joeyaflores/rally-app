"use server";

import { getDb } from "./db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireAuth } from "./require-auth";
import type {
  Contact,
  ContactCategory,
  ContactRelationship,
} from "./contact-types";

export async function getContacts(): Promise<Contact[]> {
  await requireAuth();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM contacts ORDER BY brand ASC, name ASC"
    )
    .all() as Contact[];
}

export async function createContact(data: {
  name: string;
  brand: string;
  category: ContactCategory;
  email?: string;
  phone?: string;
  relationship?: ContactRelationship;
  notes?: string;
}): Promise<Contact> {
  await requireAuth();
  const db = getDb();
  const id = crypto.randomUUID();

  const contact = db.prepare(
    `INSERT INTO contacts (id, name, brand, email, phone, category, relationship, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
  ).get(
    id,
    data.name,
    data.brand,
    data.email ?? "",
    data.phone ?? "",
    data.category,
    data.relationship ?? "prospect",
    data.notes ?? ""
  ) as Contact;

  revalidatePath("/partners");
  return contact;
}

export async function updateContact(
  id: string,
  data: Partial<
    Pick<
      Contact,
      | "name"
      | "brand"
      | "email"
      | "phone"
      | "category"
      | "relationship"
      | "notes"
      | "collab_count"
      | "last_collab"
    >
  >
): Promise<void> {
  await requireAuth();
  const db = getDb();
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  const fields = [
    "name",
    "brand",
    "email",
    "phone",
    "category",
    "relationship",
    "notes",
    "collab_count",
    "last_collab",
  ] as const;

  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  values.push(id);
  db.prepare(`UPDATE contacts SET ${sets.join(", ")} WHERE id = ?`).run(
    ...values
  );
  revalidatePath("/partners");
}

export async function deleteContact(id: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  revalidatePath("/partners");
}

export async function incrementCollab(id: string): Promise<void> {
  await requireAuth();
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(
    `UPDATE contacts SET collab_count = collab_count + 1, last_collab = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(today, id);
  revalidatePath("/partners");
}
