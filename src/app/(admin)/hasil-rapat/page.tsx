import { listMeetings } from "@/lib/db/store";
import { HasilRapatList } from "@/components/hasil-rapat/hasil-rapat-list";

export default async function HasilRapatPage() {
  const meetings = (await listMeetings()).filter((m) => m.status === "selesai" || m.status === "diproses");
  return <HasilRapatList meetings={meetings} />;
}
