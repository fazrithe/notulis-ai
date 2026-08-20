"use client";

import { jsPDF } from "jspdf";

import { formatDateID, formatDuration, formatTimeID } from "@/lib/utils";
import type { Meeting } from "@/lib/types";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function generateMeetingPdf(meeting: Meeting) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  function ensureSpace(height: number) {
    if (y + height > 285) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function heading(text: string) {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(70, 40, 160);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 5;
    doc.setDrawColor(220, 220, 230);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 6;
    doc.setTextColor(20, 20, 20);
  }

  function paragraph(text: string, size = 10, lineHeight = 5) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
  }

  function bullet(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 6) as string[];
    lines.forEach((line, i) => {
      ensureSpace(5.5);
      if (i === 0) doc.text("-", MARGIN, y);
      doc.text(line, MARGIN + 5, y);
      y += 5.5;
    });
  }

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, PAGE_WIDTH, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Notulis AI", MARGIN, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Notulen & Kesimpulan Rapat Otomatis", MARGIN, 19);
  y = 38;
  doc.setTextColor(20, 20, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(meeting.title, CONTENT_WIDTH) as string[];
  titleLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 7;
  });
  y += 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  const metaParts = [
    formatDateID(meeting.date),
    meeting.startTime ? `Mulai ${formatTimeID(meeting.startTime)}` : null,
    meeting.durationSec ? `Durasi ${formatDuration(meeting.durationSec)}` : null,
    meeting.location || null,
  ].filter(Boolean);
  doc.text(metaParts.join("  •  "), MARGIN, y);
  y += 8;
  doc.setTextColor(20, 20, 20);

  if (meeting.speakers.length) {
    heading("Peserta Terdeteksi");
    paragraph(meeting.speakers.map((s) => `${s.displayName}`).join(", "));
    y += 2;
  }

  if (meeting.summary) {
    heading("Ringkasan Rapat");
    paragraph(meeting.summary.overview);
    y += 2;

    if (meeting.summary.keyPoints.length) {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Poin Penting", MARGIN, y);
      y += 5.5;
      meeting.summary.keyPoints.forEach((p) => bullet(p));
      y += 2;
    }

    if (meeting.summary.decisions.length) {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Keputusan", MARGIN, y);
      y += 5.5;
      meeting.summary.decisions.forEach((d) => bullet(d));
      y += 2;
    }

    if (meeting.summary.actionItems.length) {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Tindak Lanjut (Action Items)", MARGIN, y);
      y += 5.5;
      meeting.summary.actionItems.forEach((a) => {
        bullet(`${a.task} — PIC: ${a.owner}${a.due ? `, tenggat ${formatDateID(a.due)}` : ""}`);
      });
      y += 2;
    }
  }

  if (meeting.transcript.length) {
    heading("Transkrip Percakapan");
    const speakerById = new Map(meeting.speakers.map((s) => [s.id, s.displayName]));
    meeting.transcript.forEach((seg) => {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text(`${speakerById.get(seg.speakerId) ?? "Peserta"}:`, MARGIN, y);
      doc.setTextColor(20, 20, 20);
      const label = `${speakerById.get(seg.speakerId) ?? "Peserta"}:`;
      const labelWidth = doc.getTextWidth(label) + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(seg.text, CONTENT_WIDTH - labelWidth) as string[];
      lines.forEach((line, i) => {
        if (i > 0) ensureSpace(5);
        doc.text(line, MARGIN + labelWidth, y);
        y += 5;
      });
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dibuat otomatis oleh Notulis AI — Halaman ${i} dari ${pageCount}`, MARGIN, 292);
  }

  const safeTitle = meeting.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`notulen-${safeTitle}-${meeting.date}.pdf`);
}
