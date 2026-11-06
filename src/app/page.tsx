import { Portfolio } from "@/components/portfolio";
import { ContentProvider } from "@/components/content-provider";
import { readPublications } from "@/lib/cms/queries";
import { contentFromRows } from "@/lib/cms/content";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const {settings}=contentFromRows(await readPublications(),"id");
  return {title:settings.title,description:settings.description,openGraph:{title:settings.title,description:settings.description}};
}

export default async function Home() {
  return <ContentProvider rows={await readPublications()}><Portfolio /></ContentProvider>;
}
