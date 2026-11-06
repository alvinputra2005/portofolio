import { localized, type Publication, type Data } from "./model";
import type { Profile, Experience, SoftwareProject, Achievement, Credential } from "../../data/portfolio";

export type ManagedProfile = Profile & { fullName: string; cardArtwork: string; university: string; universityLogo: string };
export type ManagedExperience = Experience & { caption: string; cropY: number };
export type ManagedCredential = Credential & { document?: string };
export type ManagedProject = SoftwareProject & { url?: string; repository?: string };
export type SkillGroup = { id: string; title: string; icon: "frontend"|"backend"|"aiml"; description: string; skills: {name:string;icon:string;months:number}[] };
export type Settings = {title:string;description:string;footerTitle:string;footerDescription:string;footerNote:string;skillsNote:string};
export function contentFromRows(rows: Publication[], locale: "id"|"en") {
  const sorted = [...rows].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
  const records = (kind: string): (Data & {id:string})[] => sorted.filter(r=>r.kind===kind).map(r=>({...localized(r.payload,locale),id:r.id}));
  const p = records("profile")[0];
  const profile = { name:"",initials:"",fullName:"",role:"",portrait:"",heroPortrait:"",aboutPortrait:"",cardArtwork:"",university:"",universityLogo:"",statistics:{projects:null,competitions:null,experience:null},email:null,available:false,location:"",bio:"",about:[],socialLinks:[],cvUrl:null, ...p, ...(p ? {statistics:{projects:p.projects||null,competitions:p.competitions||null,experience:p.experience??null},portrait:p.heroPortrait} : {}) } as ManagedProfile;
  return {
    profilePresent: Boolean(p), profile,
    experiences: records("experience").map(e=>({...e,type:e.role,photos:[e.photo||null]})) as unknown as ManagedExperience[],
    softwareProjects: records("project") as unknown as ManagedProject[],
    achievements: records("achievement") as unknown as Achievement[],
    credentials: records("credential") as unknown as ManagedCredential[],
    skillGroups: records("skill_group") as unknown as SkillGroup[],
    techItems: records("tech_item") as unknown as {id:string;name:string;icon:string}[],
    settings: {title:"Portofolio",description:"",footerTitle:"",footerDescription:"",footerNote:"",skillsNote:"",...records("site_settings")[0]} as Settings,
  };
}
