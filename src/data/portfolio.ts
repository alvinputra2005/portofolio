// Narasi profil mengikuti CV Putu Alvin Mahendra Putra yang diberikan pengguna.
// Konten proyek dan layanan yang ditandai sebagai contoh masih perlu disesuaikan.
// Ubah isPlaceholder menjadi false saat karya asli siap. Isi image dengan
// path gambar lokal dari public (mis. /images/karya.jpg), atau null untuk kartu konsep.
export type SocialLink = {
  label: string;
  href: string | null;
  icon: "whatsapp" | "instagram" | "email" | "github" | "linkedin";
};

export type Profile = {
  name: string;
  initials: string;
  role: string;
  portrait: string;
  heroPortrait: string;
  aboutPortrait: string;
  statistics: { projects: string | null; competitions: string | null; experience: number | null };
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
  role: "Software Engineer & Full Stack Developer",
  portrait: "/images/alvin-profile.webp",
  heroPortrait: "/images/alvin-hero-framed.webp",
  aboutPortrait: "/images/alvin-about-seated-v2.webp",
  // Angka dari pengguna; pengalaman dalam tahun. Null menampilkan tanda —.
  statistics: { projects: "10+", competitions: "5+", experience: 1.5 },
  email: "bosalvin360@gmail.com",
  available: true,
  location: "Indonesia",
  bio: "Ayo wujudkan idemu menjadi produk web berbasis AI yang membantu bisnis bekerja lebih cerdas.",
  about: [
    "Aku mahasiswa Teknik Informatika Universitas Negeri Malang dengan fokus Software Engineering. Pengalaman teknisku mencakup elisitasi kebutuhan, pengembangan antarmuka dan logika backend, serta integrasi basis data untuk sistem layanan desa, pariwisata, dan operasional usaha. Sebagai asisten praktikum, aku juga mendampingi implementasi rancangan basis data menjadi aplikasi.",
  ],
  socialLinks: [
    { label: "WhatsApp", href: "https://wa.me/6285337236836", icon: "whatsapp" },
    { label: "Instagram", href: "https://www.instagram.com/alvinmahendrra/", icon: "instagram" },
    { label: "Email", href: "mailto:bosalvin360@gmail.com", icon: "email" },
    { label: "GitHub", href: "https://github.com/alvinputra2005", icon: "github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/putu-alvin-mahendra-putra/", icon: "linkedin" },
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
  logo: string | null;
  photos: (string | null)[];
  isPlaceholder: boolean;
};

export const experiences: Experience[] = [
  {
    id: "experience-01",
    period: "4 bulan",
    role: "Asisten Praktikum Sistem Informasi",
    company: "Universitas Negeri Malang",
    description:
      "Mendampingi praktikum Sistem Informasi dan membantu mahasiswa mengimplementasikan rancangan basis data menjadi sistem informasi untuk menyelesaikan permasalahan nyata.",
    type: "Asisten Praktikum Sistem Informasi",
    logo: "/images/logo-um.webp",
    photos: [
      "/images/experience/sistem-informasi/asprak-si-1.jpeg",
      "/images/experience/sistem-informasi/asprak-si-2.jpeg",
      "/images/experience/sistem-informasi/asprak-si-3.jpeg",
      "/images/experience/sistem-informasi/asprak-si-4.jpeg",
    ],
    isPlaceholder: false,
  },
  {
    id: "experience-02",
    period: "4 bulan",
    role: "Asisten Praktikum Basis Data",
    company: "Universitas Negeri Malang",
    description:
      "Mendampingi praktikum Basis Data dan membantu mahasiswa memahami materi serta menyelesaikan latihan basis data.",
    type: "Asisten Praktikum Basis Data",
    logo: "/images/logo-um.webp",
    photos: [null, null, null, null],
    isPlaceholder: false,
  },
  {
    id: "experience-03",
    period: "4 bulan",
    role: "Asisten Praktikum Algoritma Pemrograman",
    company: "Universitas Negeri Malang",
    description:
      "Mendampingi praktikum Algoritma Pemrograman dan membantu mahasiswa memahami alur logika serta menerapkannya dalam latihan pemrograman.",
    type: "Asisten Praktikum Algoritma Pemrograman",
    logo: "/images/logo-um.webp",
    photos: [null, null, null, null],
    isPlaceholder: false,
  },
];

export type Service = {
  number: string;
  title: string;
  description: string;
  icon: "pen" | "video" | "camera" | "code";
};

export type Achievement = {
  id: string;
  category: string;
  title: string;
  year: string;
  role: string;
  description: string;
  logo: string | null;
  photos: (string | null)[];
  isPlaceholder: boolean;
};

export const achievements: Achievement[] = [
  {
    id: "achievement-01",
    category: "Hak Cipta",
    title: "Nama karya terdaftar",
    year: "Tahun pencatatan",
    role: "Nomor pencatatan / peran Anda",
    description: "Ruang untuk karya yang telah tercatat hak ciptanya. Tambahkan nama karya, nomor pencatatan, peran Anda, dan dokumentasi pendukung.",
    logo: "/images/logo-aptikom-fest.png",
    photos: [null, null, null, null],
    isPlaceholder: true,
  },
  {
    id: "achievement-02",
    category: "Kompetensi",
    title: "Nama kompetensi atau sertifikasi",
    year: "Tahun perolehan",
    role: "Bidang / tingkat kompetensi Anda",
    description: "Ruang untuk kompetensi dan sertifikasi. Bagikan keahlian yang dikuasai, proses pengembangan, dan dokumentasi pendukung.",
    logo: "/images/logo-garuda-hacks-7.png",
    photos: [null, null, null, null],
    isPlaceholder: true,
  },
  {
    id: "achievement-03",
    category: "Organisasi",
    title: "Nama organisasi atau kegiatan",
    year: "Tahun kegiatan",
    role: "Peran / kontribusi Anda",
    description: "Ruang untuk pencapaian organisasi. Ceritakan kontribusi, tanggung jawab, dan dampak yang dihasilkan bersama tim.",
    logo: "/images/logo-uthm.png",
    photos: [null, null, null, null],
    isPlaceholder: true,
  },
];

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

export type SoftwareProject = {
  id: string;
  category: "SaaS" | "SCM" | "ERP";
  title: string;
  year: string;
  role: string;
  description: string;
  logo: string | null;
  photos: (string | null)[];
  isPlaceholder: boolean;
};

export const softwareProjects: SoftwareProject[] = [
  {
    id: "project-saas",
    category: "SaaS",
    title: "Nama aplikasi SaaS",
    year: "Tahun pengembangan",
    role: "Peran Anda dalam proyek",
    description: "Ruang untuk proyek Software as a Service. Ceritakan kebutuhan pengguna, fitur utama, teknologi yang digunakan, dan kontribusi Anda dalam pengembangan aplikasi.",
    logo: "/images/logo-nolla.jpg",
    photos: [null, null, null, null],
    isPlaceholder: true,
  },
  {
    id: "project-scm",
    category: "SCM",
    title: "Nama sistem SCM",
    year: "Tahun pengembangan",
    role: "Peran Anda dalam proyek",
    description: "Ruang untuk proyek Supply Chain Management. Bagikan solusi pengelolaan rantai pasok, alur persediaan atau distribusi, dan kontribusi Anda dalam pengembangan sistem.",
    logo: "/images/logo-waspadai-v2.png",
    photos: [null, null, null, null],
    isPlaceholder: true,
  },
  {
    id: "project-erp",
    category: "ERP",
    title: "Nama sistem ERP",
    year: "Tahun pengembangan",
    role: "Peran Anda dalam proyek",
    description: "Ruang untuk proyek Enterprise Resource Planning. Ceritakan integrasi proses bisnis, modul yang dikembangkan, dan kontribusi Anda dalam membangun sistem.",
    logo: "/images/logo-sukomulyo-v2.png",
    photos: [null, null, null, null],
    isPlaceholder: true,
  },
];

export type Credential = {
  id: string;
  kind: "certificate" | "award";
  title: string;
  issuer: string;
  year: string;
  description: string;
  logo: string | null;
  photos: (string | null)[];
  isPlaceholder: boolean;
};

export const credentials: Credential[] = [
  {
    id: "credential-certificate", kind: "certificate", title: "Nama sertifikat atau pelatihan",
    issuer: "Lembaga penerbit", year: "Tahun perolehan",
    description: "Ruang untuk sertifikat pembelajaran dan pelatihan. Tambahkan bidang yang dipelajari, lembaga penerbit, dan dokumentasi sertifikat Anda.",
    logo: null, photos: [null, null, null, null], isPlaceholder: true,
  },
  {
    id: "credential-award", kind: "award", title: "Nama penghargaan",
    issuer: "Penyelenggara penghargaan", year: "Tahun perolehan",
    description: "Ruang untuk penghargaan yang Anda raih. Ceritakan kategori penghargaan, karya atau kontribusi yang dinilai, dan dokumentasi momennya.",
    logo: null, photos: [null, null, null, null], isPlaceholder: true,
  },
];

export const skillGroups = [
  { id: "frontend", title: "Front End", skills: [
    { name: "React", icon: "react", months: 18 },
    { name: "Next.js", icon: "nextjs", months: 12 },
    { name: "Bootstrap", icon: "bootstrap", months: 10 },
  ] },
  { id: "backend", title: "Back End", skills: [
    { name: "Laravel", icon: "laravel", months: 14 },
    { name: "Node.js", icon: "nodejs", months: 12 },
    { name: "Flask", icon: "flask", months: 8 },
  ] },
  { id: "aiml", title: "AI/ML", skills: [
    { name: "Python", icon: "python", months: 18 },
    { name: "PyTorch", icon: "pytorch", months: 10 },
    { name: "TensorFlow", icon: "tensorflow", months: 8 },
    { name: "scikit-learn", icon: "scikitlearn", months: 12 },
  ] },
] as const;

export const navigation = [
  { label: "About", href: "#tentang" },
  { label: "Experience", href: "#pengalaman" },
  { label: "Projects", href: "#proyek" },
  { label: "Achievements", href: "#pencapaian" },
  { label: "Certificates", href: "#sertifikat" },
  { label: "Tech Stack", href: "#tech-stack" },
  { label: "Contact", href: "#kontak" },
];

export const siteSettings = {
  title: "Alvin — Software Engineer & Full Stack Developer",
  description:
    "Portofolio Putu Alvin Mahendra Putra, mahasiswa Teknik Informatika Universitas Negeri Malang dengan fokus pengembangan web serta minat pada intelligent systems dan solusi B2B.",
  year: 2026,
};
