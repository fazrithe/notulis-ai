import { notFound } from "next/navigation";

import { getMeeting } from "@/lib/db/store";
import { MeetingDetail } from "@/components/hasil-rapat/meeting-detail";

export default async function HasilRapatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  return <MeetingDetail meeting={meeting} />;
}
