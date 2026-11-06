import { z } from "zod";

export const kinds = ["profile", "experience", "project", "achievement", "credential", "skill_group", "tech_item", "site_settings"] as const;
export type ContentKind = typeof kinds[number];
export type Data = Record<string, unknown>;
export type Payload = { id: Data; en: Data };
export type ContentEntry = { id: string; kind: ContentKind; position: number; draft: Payload; updated_at: string; published_at?: string | null };
export type Publication = { id: string; kind: ContentKind; position: number; payload: Payload; published_at?: string };
export type Field = { key: string; label: string; type?: "text" | "textarea" | "lines" | "number" | "boolean" | "select" | "image" | "pdf" | "gallery" | "socials" | "skills"; required?: boolean; translate?: boolean; options?: string[] };
const text = (key: string, label: string, required = false): Field => ({ key, label, required, translate: true });
const description: Field = { ...text("description", "Deskripsi", true), type: "textarea" };
const logo: Field = { key: "logo", label: "Logo", type: "image" };
const gallery: Field = { key: "photos", label: "Dokumentasi (maksimal 4)", type: "gallery" };
const placeholder: Field = { key: "isPlaceholder", label: "Konten masih berupa contoh", type: "boolean" };
export const definitions: Record<ContentKind, { label: string; singleton?: boolean; fields: Field[] }> = {
  profile: { label: "Profil", singleton: true, fields: [text("name", "Nama tampilan", true), text("fullName", "Nama lengkap", true), text("initials", "Inisial"), text("role", "Peran / profesi", true), { ...text("bio", "Bio", true), type: "textarea" }, { ...text("about", "Tentang (satu paragraf per baris)", true), type: "lines" }, { key: "heroPortrait", label: "Foto hero", type: "image" }, { key: "aboutPortrait", label: "Foto kartu profil", type: "image" }, { key: "cardArtwork", label: "Latar kartu profil", type: "image" }, text("university", "Instansi kartu profil"), { key: "universityLogo", label: "Logo instansi kartu", type: "image" }, text("email", "Email"), text("location", "Lokasi"), { key: "available", label: "Terbuka untuk proyek", type: "boolean" }, text("projects", "Statistik proyek (mis. 10+)"), text("competitions", "Statistik kompetisi"), { key: "experience", label: "Tahun pengalaman", type: "number" }, { key: "socialLinks", label: "Tautan sosial", type: "socials" }, { key: "cvUrl", label: "CV (PDF)", type: "pdf" }] },
  experience: { label: "Pengalaman", fields: [text("company", "Instansi", true), text("role", "Peran", true), text("period", "Durasi / periode", true), description, logo, { key: "photo", label: "Foto dokumentasi", type: "image" }, { ...text("caption", "Keterangan saat hover"), type: "textarea" }, { key: "cropY", label: "Posisi crop vertikal (0–100; naikkan angka untuk menaikkan foto)", type: "number" }, placeholder] },
  project: { label: "Proyek", fields: [text("title", "Nama aplikasi", true), { key: "category", label: "Kategori", type: "select", options: ["SaaS", "SCM", "ERP", "Web", "Mobile", "Lainnya"], required: true }, text("year", "Tahun", true), text("role", "Peran", true), description, logo, text("url", "Tautan aplikasi"), text("repository", "Tautan repositori"), gallery, placeholder] },
  achievement: { label: "Pencapaian", fields: [text("title", "Judul", true), text("category", "Kategori", true), text("year", "Tahun", true), text("role", "Penyelenggara / peran", true), description, logo, gallery, placeholder] },
  credential: { label: "Sertifikat & Penghargaan", fields: [{ key: "kind", label: "Jenis", type: "select", options: ["certificate", "award"], required: true }, text("title", "Judul", true), text("issuer", "Penerbit", true), text("year", "Tahun", true), description, gallery, { key: "document", label: "Dokumen PDF", type: "pdf" }, placeholder] },
  skill_group: { label: "Grup Keahlian", fields: [text("title", "Nama grup", true), { key: "icon", label: "Ikon grup", type: "select", options: ["frontend", "backend", "aiml"], required: true }, description, { key: "skills", label: "Teknologi dan durasi", type: "skills" }] },
  tech_item: { label: "Teknologi & Alat", fields: [text("name", "Nama teknologi", true), { key: "icon", label: "Ikon", type: "image" }] },
  site_settings: { label: "Pengaturan", singleton: true, fields: [text("title", "Judul situs", true), description, text("footerTitle", "Judul footer", true), text("footerDescription", "Deskripsi footer", true), text("footerNote", "Catatan footer"), text("skillsNote", "Catatan durasi keahlian")] },
};
const safeLink = z.string().max(2000).refine(s => !s || /^(https?:\/\/|mailto:|tel:)/i.test(s), "Gunakan tautan http/https, mailto, atau tel yang valid.");
export const assetSchema = z.string().max(2048).refine(s => !s || /^media:[0-9a-f-]{36}$/.test(s) || /^\/images\/[\w./-]+$/.test(s) || /^\/documents\/[\w./-]+$/.test(s), "Pilih berkas dari media.");
function fieldSchema(field: Field, english: boolean): z.ZodType {
  let schema: z.ZodType;
  switch (field.type) {
    case "number": schema = field.key === "cropY" ? z.number().finite().min(0).max(100) : z.number().finite().min(0).max(1000).nullable(); break;
    case "boolean": schema = z.boolean(); break;
    case "select": schema = z.enum(field.options as [string, ...string[]]); break;
    case "image": case "pdf": schema = assetSchema; break;
    case "gallery": schema = z.array(assetSchema.nullable()).max(4); break;
    case "lines": schema = z.array(z.string().trim().max(10000)).max(20).transform(lines=>lines.filter(Boolean)).pipe(z.array(z.string()).min(!english&&field.required?1:0)); break;
    case "socials": schema = z.array(z.object({ label: z.string().min(1).max(100), icon: z.enum(["whatsapp", "instagram", "email", "github", "linkedin"]), href: safeLink.nullable() })).max(10); break;
    case "skills": schema = z.array(z.object({ name: z.string().trim().min(1).max(100), icon: assetSchema, months: z.number().int().min(0).max(1200) })).max(50); break;
    default: schema = ["url", "repository"].includes(field.key) ? safeLink : field.key==="email" ? z.union([z.email(),z.literal("")]) : z.string().trim().max(20000).min(!english && field.required ? 1 : 0);
  }
  return schema;
}
export function payloadSchema(kind: ContentKind) {
  const fields = definitions[kind].fields;
  return z.object({ id: z.object(Object.fromEntries(fields.map(f => [f.key, fieldSchema(f, false)]))).strict(), en: z.object(Object.fromEntries(fields.filter(f => f.translate).map(f => [f.key, fieldSchema(f, true).optional()]))).strict() });
}
export function emptyPayload(kind: ContentKind): Payload {
  return { id: Object.fromEntries(definitions[kind].fields.map(f => [f.key, f.type === "number" ? (f.key === "cropY" ? 50 : null) : f.type === "boolean" ? false : ["lines", "gallery", "socials", "skills"].includes(f.type || "") ? [] : f.type === "select" ? f.options![0] : ""])), en: {} };
}
export function localized(payload: Payload, locale: "id" | "en"): Data {
  if (locale === "id") return payload.id;
  return { ...payload.id, ...Object.fromEntries(Object.entries(payload.en).filter(([, v]) => v !== "" && v != null && (!Array.isArray(v) || v.length > 0))) };
}
export function entryTitle(entry: Pick<ContentEntry, "draft" | "kind">) { return String(entry.draft.id.title || entry.draft.id.name || entry.draft.id.role || definitions[entry.kind].label); }
export function mediaIds(value: unknown): string[] {
  const found = new Set<string>();
  function walk(v: unknown) { if (typeof v === "string" && /^media:[0-9a-f-]{36}$/.test(v)) found.add(v.slice(6)); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); }
  walk(value); return [...found];
}
export function mapStrings<T>(value: T, fn: (v: string) => string): T {
  if (typeof value === "string") return fn(value) as T;
  if (Array.isArray(value)) return value.map(v => mapStrings(v, fn)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,mapStrings(v,fn)])) as T;
  return value;
}
