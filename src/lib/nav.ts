import {
  BookOpenText,
  CalendarDays,
  FileText,
  KeyRound,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Ringkasan aktivitas rapat Anda",
  },
  {
    href: "/agenda",
    label: "Agenda Rapat",
    icon: CalendarDays,
    description: "Kalender & rekaman rapat baru",
  },
  {
    href: "/hasil-rapat",
    label: "Hasil Rapat",
    icon: FileText,
    description: "Notulen, ringkasan & unduh PDF",
  },
  {
    href: "/admin",
    label: "CRUD Admin",
    icon: Users,
    description: "Kelola pengguna admin",
  },
  {
    href: "/api-key",
    label: "API Key",
    icon: KeyRound,
    description: "AssemblyAI & Gemini",
  },
  {
    href: "/panduan",
    label: "Cara Pemakaian",
    icon: BookOpenText,
    description: "Panduan penggunaan aplikasi",
  },
];
