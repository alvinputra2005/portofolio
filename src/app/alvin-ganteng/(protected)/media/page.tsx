import {requireAdmin} from "@/lib/supabase/server";
import {MediaLibrary} from "@/components/admin/media-library";
export default async function Page(){await requireAdmin();return <><MediaLibrary/></>;}
