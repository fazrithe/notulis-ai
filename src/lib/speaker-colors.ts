// Palet warna untuk membedakan pembicara secara visual di transkrip.
// Menggunakan token warna kategorikal yang sama dengan grafik dashboard.
export const SPEAKER_COLORS = [
  { dot: "bg-[oklch(0.55_0.22_292)]", text: "text-[oklch(0.55_0.22_292)]", bg: "bg-[oklch(0.55_0.22_292)]/10" },
  { dot: "bg-[oklch(0.6_0.15_220)]", text: "text-[oklch(0.6_0.15_220)]", bg: "bg-[oklch(0.6_0.15_220)]/10" },
  { dot: "bg-[oklch(0.65_0.16_155)]", text: "text-[oklch(0.65_0.16_155)]", bg: "bg-[oklch(0.65_0.16_155)]/10" },
  { dot: "bg-[oklch(0.75_0.16_80)]", text: "text-[oklch(0.75_0.16_80)]", bg: "bg-[oklch(0.75_0.16_80)]/10" },
  { dot: "bg-[oklch(0.62_0.2_20)]", text: "text-[oklch(0.62_0.2_20)]", bg: "bg-[oklch(0.62_0.2_20)]/10" },
];

export function speakerColor(colorIndex: number) {
  return SPEAKER_COLORS[colorIndex % SPEAKER_COLORS.length];
}
