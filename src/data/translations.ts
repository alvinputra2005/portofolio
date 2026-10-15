import { experiences, profile, projects, services, type ProjectCategory } from "./portfolio";

export type Locale = "id" | "en";

export const messages = {
  id: {
    home: "Kembali ke beranda", mainNav: "Navigasi utama", mobileNav: "Navigasi mobile", openMenu: "Buka menu", closeMenu: "Tutup menu", switchLanguage: "Ganti bahasa ke Inggris", skip: "Langsung ke konten", closeDialog: "Tutup dialog",
    hello: "Halo, aku", viewProfile: "Lihat Profilku", hire: "Hubungi Aku", portraitAlt: "Foto profil", all: "Semua", disciplines: "Bidang kreatif",
    workLabel: "KARYA PILIHAN", workTitle: "Ide yang menjadi", workTitleMuted: "karya bermakna.", workIntro: "Ruang untuk ide, eksplorasi, dan karya.", workIntroSecond: "Setiap detail punya ceritanya sendiri.", filterLabel: "Filter kategori karya", explorations: "EKSPLORASI", viewProject: "Lihat detail", placeholderCaption: "Pilihan konsep sementara. Karya asli akan hadir di sini.",
    aboutLabel: "SEKILAS TENTANG AKU", aboutTitle: "Seorang pribadi.", aboutTitleSecond: "Sudut pandang.", aboutTitleAccent: "Sedikit berbeda.", photoLabel: "SOSOK DI BALIK KARYA", curiousNote: "Selalu ingin tahu.", designThinker: "Pemikir desain", curiousCreator: "Kreator penuh rasa ingin tahu", viewCv: "Lihat CV", getToKnow: "Kenalan lebih jauh",
    servicesLabel: "PENCAPAIAN & KEAHLIAN", servicesTitle: "Beragam keahlian.", servicesTitleMuted: "Satu arah kreatif.", servicesIntro: "Dari ide pertama sampai sentuhan akhir.", servicesIntroSecond: "Mari buat sesuatu yang berarti.", ideaToExpression: "DARI IDE MENJADI KARYA",
    journeyLabel: "PERJALANAN KREATIF", journeyFirst: "Belajar.", journeySecond: "Berkarya.", journeyThird: "Bertumbuh.", journeyIntro: "Setiap kesempatan menjadi ruang", journeyIntroSecond: "untuk belajar dan berkembang.", experiencePlaceholder: "Ruang untuk perjalanan dan pengalamanmu.",
    socialLabel: "DI BALIK PORTOFOLIO", socialTitle: "Mari tetap", socialTitleMuted: "terhubung.", socialIntro: "Ide, proses, dan hal menarik lainnya.", socialFollow: "Ikuti perjalanan kreatifku", socialComing: "Profil akan segera hadir", socialUnavailable: "profil belum ditambahkan",
    contactEyebrow: "HAL BAIK DIMULAI DARI SEBUAH PERCAKAPAN", contactIdea: "PUNYA IDE MENARIK?", contactFirst: "Yuk, buat", contactSecond: "sesuatu yang", contactAccent: "berarti.", openContact: "Buka informasi kontak", contactIntro: "Proyek baru, ide menarik, atau sekadar menyapa.", contactIntroSecond: "Aku senang mendengar ceritamu.", startConversation: "Mulai percakapan", footer: "Dibuat dengan sepenuh hati.", backTop: "Kembali ke atas",
    projectDetails: "Detail proyek", projectNote: "Ini adalah kartu konsep sementara. Visual dan cerita proyek asli akan ditambahkan di sini.", discussProject: "Diskusikan ide serupa", sayHello: "SAPA AKU", contactTitle: "Mari berkenalan", contactDialogIntro: "Kolaborasi yang baik dimulai dari percakapan yang sederhana.", sendEmail: "Kirim email", copyEmail: "Salin email", copied: "Tersalin", copiedAnnouncement: "Alamat email berhasil disalin.", contactComing: "Kontak segera tersedia", contactComingDescription: "Alamat email dan profil sosial akan ditambahkan. Sampai jumpa di percakapan berikutnya!", intention: "BERKARYA DENGAN TUJUAN.", artExploration: "EKSPLORASI KREATIF", artPlaceholder: "KONSEP SEMENTARA",
  },
  en: {
    home: "Back to home", mainNav: "Main navigation", mobileNav: "Mobile navigation", openMenu: "Open menu", closeMenu: "Close menu", switchLanguage: "Switch to Indonesian", skip: "Skip to content", closeDialog: "Close dialog",
    hello: "Hi, I'm", viewProfile: "See My Profile", hire: "Hire Me", portraitAlt: "Portrait of", all: "All", disciplines: "Creative disciplines",
    workLabel: "SELECTED WORK", workTitle: "Ideas made", workTitleMuted: "into something.", workIntro: "A space for ideas, exploration, and creativity.", workIntroSecond: "Every detail has a story to tell.", filterLabel: "Filter projects by category", explorations: "EXPLORATIONS", viewProject: "View details", placeholderCaption: "Concept placeholders for now. Original work is coming soon.",
    aboutLabel: "A LITTLE ABOUT ME", aboutTitle: "A person.", aboutTitleSecond: "A perspective.", aboutTitleAccent: "A little different.", photoLabel: "THE PERSON BEHIND THE WORK", curiousNote: "Always curious.", designThinker: "Design thinker", curiousCreator: "Curious creator", viewCv: "View CV", getToKnow: "Get to know me",
    servicesLabel: "ACHIEVEMENTS & SKILLS", servicesTitle: "Different skills.", servicesTitleMuted: "One creative direction.", servicesIntro: "From the first idea to the finishing touches.", servicesIntroSecond: "Let's make something meaningful.", ideaToExpression: "IDEA TO EXPRESSION",
    journeyLabel: "THE JOURNEY", journeyFirst: "Learning.", journeySecond: "Making.", journeyThird: "Growing.", journeyIntro: "Every opportunity is a space", journeyIntroSecond: "to learn and grow.", experiencePlaceholder: "A space for your journey and experience.",
    socialLabel: "BEYOND THE PORTFOLIO", socialTitle: "Let's stay", socialTitleMuted: "connected.", socialIntro: "Ideas, process, and other interesting things.", socialFollow: "Follow my creative journey", socialComing: "Profile coming soon", socialUnavailable: "profile not added yet",
    contactEyebrow: "GOOD THINGS START WITH A CONVERSATION", contactIdea: "HAVE AN IDEA IN MIND?", contactFirst: "Let's make", contactSecond: "something", contactAccent: "great.", openContact: "Open contact information", contactIntro: "A new project, an interesting idea, or just a hello.", contactIntroSecond: "I'd love to hear your story.", startConversation: "Start a conversation", footer: "Crafted with intention.", backTop: "Back to top",
    projectDetails: "Project details", projectNote: "This is a concept placeholder. Original visuals and the project story will be added here.", discussProject: "Discuss a similar idea", sayHello: "SAY HELLO", contactTitle: "Let's get acquainted", contactDialogIntro: "A great collaboration starts with a simple conversation.", sendEmail: "Send email", copyEmail: "Copy email", copied: "Copied", copiedAnnouncement: "Email address copied.", contactComing: "Contact details coming soon", contactComingDescription: "Email and social profiles will be added soon. Looking forward to our next conversation!", intention: "DESIGNING WITH INTENTION.", artExploration: "CREATIVE EXPLORATION", artPlaceholder: "CONCEPT PLACEHOLDER",
  },
} as const;

export const navigationLabels = {
  id: { "#tentang": "Tentang", "#karya": "Proyek", "#pengalaman": "Pengalaman", "#pencapaian": "Pencapaian", "#kontak": "Kontak" },
  en: { "#tentang": "About", "#karya": "Projects", "#pengalaman": "Experience", "#pencapaian": "Achievements", "#kontak": "Contact" },
} as const;

export function categoryLabel(category: ProjectCategory | "Semua", locale: Locale): string {
  if (locale === "id") return category;
  return { Semua: "All", "Desain Grafis": "Graphic Design", Video: "Video", Fotografi: "Photography", Digital: "Digital" }[category];
}

const englishDescriptions: Record<string, string> = {
  "brand-identity": "A visual identity concept with simple shapes, bold colors, and a consistent character. A placeholder for your branding work.",
  "editorial-design": "Exploring typography, composition, and rhythm in editorial design. A placeholder for your posters or publications.",
  "visual-storytelling": "A visual story told through movement, sound, and detail. A placeholder for your showreel or video projects.",
  photography: "A space to capture atmosphere, light, and meaningful little moments. A placeholder for your photography collection.",
  "digital-experience": "A digital experience concept connecting visuals and functionality. A placeholder for your websites or interface designs.",
  "social-content": "A social content concept with a recognizable visual language. A placeholder for your campaigns or digital content.",
};

const englishServices = [
  { title: "Graphic Design", description: "Visual identities, posters, and compositions that give every idea its own character." },
  { title: "Content & Video", description: "Stories shaped through visual content, editing, and purposeful motion." },
  { title: "Photography", description: "Exploring light, perspective, and detail to tell stories through images." },
  { title: "Digital Experiences", description: "Interfaces and web experiences designed to be intuitive and memorable." },
];

const englishExperiences = [
  { period: "Experience period", role: "Your position / role", company: "Company or studio name", description: "Work experience placeholder. Add your key responsibilities, contributions, and what you learned here.", type: "Work Experience" },
  { period: "Collaboration period", role: "Your role in the project", company: "Project or collaboration name", description: "Creative collaboration placeholder. Describe the project context, your role, and the process of working with the team.", type: "Collaboration" },
  { period: "Activity period", role: "Your role in the activity", company: "Organization or community name", description: "Organization or activity placeholder. Add relevant experience and the contributions you would like to highlight.", type: "Organization" },
];

export function getLocalizedPortfolio(locale: Locale) {
  return {
    profile: locale === "id" ? profile : {
      ...profile,
      role: "Creative Designer & Digital Creator",
      bio: "Turning ideas into memorable visual experiences. A space for design, stories, and creative exploration.",
      about: [
        `Hi, I'm ${profile.name}. I'm interested in the intersection of purposeful design, strong stories, and delightful digital experiences.`,
        "This portfolio is a space to introduce my creative approach. My profile, experience, and collection of work will grow along the journey.",
      ],
    },
    projects: locale === "id" ? projects : projects.map(project => ({ ...project, description: englishDescriptions[project.id] ?? project.description })),
    services: locale === "id" ? services : services.map((service, index) => ({ ...service, ...englishServices[index] })),
    experiences: locale === "id" ? experiences : experiences.map((experience, index) => ({ ...experience, ...englishExperiences[index] })),
  };
}
