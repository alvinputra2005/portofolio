import { getLocalizedPortfolio, messages } from "../../data/translations";
import { skillGroups, siteSettings } from "../../data/portfolio";
import { emptyPayload, type ContentKind, type Data, type Publication } from "./model";

export function initialPublications(): Publication[] {
  const id = getLocalizedPortfolio("id"), en = getLocalizedPortfolio("en");
  const rows: Publication[] = [];
  function add(key: string, kind: ContentKind, data: Data, english: Data = {}) {
    const base = emptyPayload(kind);
    rows.push({ id: key, kind, position: rows.filter(r => r.kind === kind).length, payload: { id: { ...base.id, ...data }, en: english } });
  }
  add("profile", "profile", { ...id.profile, fullName: "Putu Alvin Mahendra Putra", ...id.profile.statistics, cardArtwork: "/images/alvin-id-artwork.webp", university: "Universitas Negeri Malang", universityLogo: "/images/logo-um.webp", cvUrl: id.profile.cvUrl || "" }, { bio: en.profile.bio, about: en.profile.about, role: en.profile.role });
  // Remove fields not editable in the CMS schema.
  delete rows[0].payload.id.statistics; delete rows[0].payload.id.portrait;
  const captions = ["Mendampingi mahasiswa membangun sistem informasi dalam sesi praktikum.", "Membantu mahasiswa memahami dan menerapkan konsep basis data.", "Mendampingi mahasiswa menyusun logika dan latihan pemrograman."];
  const captionsEn = ["Guiding students in building information systems during practical sessions.", "Helping students understand and apply database concepts.", "Guiding students through programming logic and exercises."];
  id.experiences.forEach((e,i) => add(e.id, "experience", { company:e.company,role:e.role,period:e.period,description:e.description,logo:e.logo||"",photo:e.photos[0]||"",caption:captions[i],cropY:i===2?72:50,isPlaceholder:e.isPlaceholder }, { company:en.experiences[i].company,role:en.experiences[i].role,period:en.experiences[i].period,description:en.experiences[i].description,caption:captionsEn[i] }));
  id.softwareProjects.forEach((p,i) => { const { id: key, ...data } = p; const { id: unused, logo, photos, isPlaceholder, category, ...english } = en.softwareProjects[i]; void unused; void logo; void photos; void isPlaceholder; void category; add(key,"project", {...data,logo:p.logo||"",url:"",repository:""},english); });
  id.achievements.forEach((p,i) => { const { id:key,...data }=p; const { title,category,year,role,description }=en.achievements[i]; add(key,"achievement",{...data,logo:p.logo||""},{title,category,year,role,description}); });
  id.credentials.forEach((p,i) => { const {title,issuer,year,description}=en.credentials[i]; add(p.id,"credential",{kind:p.kind,title:p.title,issuer:p.issuer,year:p.year,description:p.description,photos:p.photos,document:"",isPlaceholder:p.isPlaceholder},{title,issuer,year,description}); });
  skillGroups.forEach(g => {
    const descKey = `${g.id}Description` === "aimlDescription" ? "aimlDescription" : g.id === "frontend" ? "frontendDescription" : "backendDescription";
    add(g.id,"skill_group",{title:g.title,icon:g.id,description:messages.id[descKey],skills:g.skills.map(s=>({...s,icon:`/images/tech/${s.icon}.svg`}))},{description:messages.en[descKey]});
  });
  const tools = [["Laravel","laravel"],["React","react"],["Bootstrap","bootstrap"],["Next.js","nextjs"],["Node.js","nodejs"],["Flask","flask"],["Python","python"],["PyTorch","pytorch"],["scikit-learn","scikitlearn"],["TensorFlow","tensorflow"],["Jupyter","jupyter"],["Matplotlib","matplotlib"],["VS Code","vscode"],["Google Colab","googlecolab"],["Figma","figma"],["Canva","canva"]];
  tools.forEach(([name,icon])=>add(`tech-${icon}`,"tech_item",{name,icon:`/images/tech/${icon}.svg`}));
  add("site_settings","site_settings",{title:siteSettings.title,description:siteSettings.description,footerTitle:messages.id.footerInviteTitle,footerDescription:messages.id.footerInviteDescription,footerNote:messages.id.footerInviteNote,skillsNote:messages.id.skillsDummy},{footerTitle:messages.en.footerInviteTitle,footerDescription:messages.en.footerInviteDescription,footerNote:messages.en.footerInviteNote,skillsNote:messages.en.skillsDummy});
  return rows;
}
