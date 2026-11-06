import type {Metadata} from "next";
import "./admin.css";
export const metadata:Metadata={title:"Alvin Studio — Pengelolaan",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default function Layout({children}:{children:React.ReactNode}){return children;}
