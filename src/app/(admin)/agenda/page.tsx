import { listApiKeys, listMeetings } from "@/lib/db/store";
import { missingProviders } from "@/lib/ai/roles";
import { AgendaBoard } from "@/components/agenda/agenda-board";

export default async function AgendaPage() {
  const meetings = await listMeetings();
  const missingApiKeys = missingProviders(await listApiKeys());

  return <AgendaBoard meetings={meetings} missingApiKeys={missingApiKeys} />;
}
