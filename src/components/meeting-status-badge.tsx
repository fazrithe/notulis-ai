import { CalendarClock, CheckCircle2, CircleDot, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { MeetingStatus } from "@/lib/types";

const STATUS_MAP: Record<MeetingStatus, { label: string; variant: "secondary" | "success" | "warning" | "default"; icon: typeof CheckCircle2 }> = {
  terjadwal: { label: "Terjadwal", variant: "secondary", icon: CalendarClock },
  berlangsung: { label: "Berlangsung", variant: "warning", icon: CircleDot },
  diproses: { label: "Diproses", variant: "default", icon: Loader2 },
  selesai: { label: "Selesai", variant: "success", icon: CheckCircle2 },
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const meta = STATUS_MAP[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon className={status === "diproses" ? "size-3 animate-spin" : "size-3"} />
      {meta.label}
    </Badge>
  );
}
