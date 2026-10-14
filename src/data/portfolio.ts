// Nama Alvin disimpulkan dari nama file foto. Profil, biografi, dan layanan
// masih berupa contoh; sesuaikan seluruh informasi dengan identitas asli Anda.
// Ubah isPlaceholder menjadi false saat karya asli siap. Isi image dengan
// path gambar lokal dari public (mis. /images/karya.jpg), atau null untuk kartu konsep.
export type SocialLink = {
  label: string;
  href: string | null;
  icon: "instagram" | "linkedin" | "github";
};

export type Profile = {
  name: string;
  initials: string;
  role: string;
  portrait: string;
  email: string | null;
  available: boolean;
  location: string;
  bio: string;
  about: string[];
  socialLinks: SocialLink[];
  cvUrl: string | null;
};

export const profile: Profile = {
  name: "Alvin",
  initials: "A",
  role: "Creative Designer & Digital Creator",
  portrait: "/images/alvin-profile.webp",
  email: null, // Isi alamat email Anda untuk mengaktifkan tautan kontak.
  available: true,
  location: "Indonesia",
  bio: "Mengubah ide menjadi pengalaman visual yang berkesan. Sebuah ruang untuk desain, cerita, dan eksplorasi kreatif.",
  about: [
    "Halo, saya Alvin. Saya tertarik pada pertemuan antara desain yang terarah, cerita yang kuat, dan pengalaman digital yang menyenangkan.",
    "Portofolio ini menjadi ruang untuk memperkenalkan pendekatan kreatif saya. Profil, pengalaman, dan koleksi karya dapat disesuaikan seiring perjalanan berikutnya.",
  ],
  socialLinks: [
    { label: "Instagram", href: null, icon: "instagram" },
    { label: "LinkedIn", href: null, icon: "linkedin" },
    { label: "GitHub", href: null, icon: "github" },
  ],
  cvUrl: null, // Isi path PDF CV, misalnya /documents/cv-alvin.pdf.
};

export const projectCategories = [
  "Semua",
  "Desain Grafis",
  "Video",
  "Fotografi",
  "Digital",
] as const;

export type ProjectCategory = Exclude<
  (typeof projectCategories)[number],
  "Semua"
>;

export type Project = {
  id: string;
  number: string;
  title: string;
  category: ProjectCategory;
  description: string;
  year: string;
  variant: "identity" | "editorial" | "film" | "photo" | "digital" | "social";
  image: string | null;
  tags: string[];
  featured: boolean;
  isPlaceholder: boolean;
};

export const projects: Project[] = [
  {
    id: "brand-identity",
    number: "01",
    title: "Identity, with purpose.",
    category: "Desain Grafis",
    description:
      "Konsep identitas visual dengan bentuk yang sederhana, warna yang berani, dan karakter yang konsisten. Placeholder untuk karya branding Anda.",
    year: "2026",
    variant: "identity",
    image: null,
    tags: ["Brand Identity", "Art Direction"],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: "editorial-design",
    number: "02",
    title: "A different perspective.",
    category: "Desain Grafis",
    description:
      "Eksplorasi tipografi, komposisi, dan ritme dalam desain editorial. Placeholder untuk poster atau publikasi Anda.",
    year: "2026",
    variant: "editorial",
    image: null,
    tags: ["Editorial", "Typography"],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: "visual-storytelling",
    number: "03",
    title: "Stories in motion.",
    category: "Video",
    description:
      "Konsep cerita visual yang dirangkai melalui gerak, suara, dan detail. Placeholder untuk showreel atau proyek video Anda.",
    year: "2026",
    variant: "film",
    image: null,
    tags: ["Video Editing", "Storytelling"],
    featured: true,
    isPlaceholder: true,
  },
  {
    id: "photography",
    number: "04",
    title: "Between the moments.",
    category: "Fotografi",
    description:
      "Ruang untuk menangkap suasana, cahaya, dan momen kecil yang bermakna. Placeholder untuk koleksi fotografi Anda.",
    year: "2026",
    variant: "photo",
    image: null,
    tags: ["Photography", "Visual Exploration"],
    featured: false,
    isPlaceholder: true,
  },
  {
    id: "digital-experience",
    number: "05",
    title: "Designed to connect.",
    category: "Digital",
    description:
      "Konsep pengalaman digital yang menghubungkan visual dan fungsi. Placeholder untuk website atau desain antarmuka Anda.",
    year: "2026",
    variant: "digital",
    image: null,
    tags: ["UI Design", "Web Experience"],
    featured: false,
    isPlaceholder: true,
  },
  {
    id: "social-content",
    number: "06",
    title: "Make an impression.",
    category: "Digital",
    description:
      "Konsep konten sosial dengan bahasa visual yang mudah dikenali. Placeholder untuk kampanye atau konten digital Anda.",
    year: "2026",
    variant: "social",
    image: null,
    tags: ["Social Content", "Creative Direction"],
    featured: false,
    isPlaceholder: true,
  },
];

export type Experience = {
  id: string;
  period: string;
  role: string;
  company: string;
  description: string;
  type: string;
};

export const experiences: Experience[] = [
  {
    id: "experience-01",
    period: "Periode pengalaman",
    role: "Posisi / peran Anda",
    company: "Nama perusahaan atau studio",
    description:
      "Placeholder pengalaman kerja. Tambahkan tanggung jawab utama, kontribusi, dan hal yang Anda pelajari di sini.",
    type: "Pengalaman Kerja",
  },
  {
    id: "experience-02",
    period: "Periode kolaborasi",
    role: "Peran dalam proyek",
    company: "Nama proyek atau kolaborasi",
    description:
      "Placeholder kolaborasi kreatif. Ceritakan konteks proyek, peran Anda, dan proses bekerja bersama tim.",
    type: "Kolaborasi",
  },
  {
    id: "experience-03",
    period: "Periode kegiatan",
    role: "Peran dalam kegiatan",
    company: "Nama organisasi atau komunitas",
    description:
      "Placeholder organisasi atau kegiatan. Tambahkan pengalaman relevan dan kontribusi yang ingin Anda tampilkan.",
    type: "Organisasi",
  },
];

export type Service = {
  number: string;
  title: string;
  description: string;
  icon: "pen" | "video" | "camera" | "code";
};

export const services: Service[] = [
  {
    number: "01",
    title: "Desain Grafis",
    description:
      "Identitas visual, poster, dan komposisi yang memberi karakter pada setiap ide.",
    icon: "pen",
  },
  {
    number: "02",
    title: "Konten & Video",
    description:
      "Cerita yang dibentuk melalui konten visual, editing, dan gerak yang terarah.",
    icon: "video",
  },
  {
    number: "03",
    title: "Fotografi",
    description:
      "Eksplorasi cahaya, perspektif, dan detail untuk menghadirkan cerita dalam gambar.",
    icon: "camera",
  },
  {
    number: "04",
    title: "Pengalaman Digital",
    description:
      "Antarmuka dan pengalaman web yang dirancang agar mudah digunakan dan berkesan.",
    icon: "code",
  },
];

export const navigation = [
  { label: "Karya", href: "#karya" },
  { label: "Tentang", href: "#tentang" },
  { label: "Pengalaman", href: "#pengalaman" },
  { label: "Kontak", href: "#kontak" },
];

export const siteSettings = {
  title: "Alvin — Creative Designer & Digital Creator",
  description:
    "Portofolio kreatif Alvin: desain grafis, video, fotografi, dan pengalaman digital. Jelajahi konsep karya dan kenali pendekatan kreatifnya.",
  year: 2026,
};
