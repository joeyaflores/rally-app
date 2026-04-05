export type ContactCategory =
  | "pt"
  | "nutrition"
  | "apparel"
  | "local"
  | "media"
  | "venue"
  | "fitness"
  | "sponsor"
  | "other";

export type ContactRelationship =
  | "prospect"
  | "reached-out"
  | "active"
  | "invested"
  | "go-to"
  | "inactive";

export interface Contact {
  id: string;
  name: string;
  brand: string;
  email: string;
  phone: string;
  category: ContactCategory;
  relationship: ContactRelationship;
  notes: string;
  collab_count: number;
  last_collab: string | null;
  created_at: string;
  updated_at: string;
}
