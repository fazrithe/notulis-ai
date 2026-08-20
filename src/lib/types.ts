// Tipe data inti aplikasi Notulis AI.
// Struktur ini didesain agar 1:1 dengan model di prisma/schema.prisma,
// sehingga migrasi dari data dummy (JSON) ke database MySQL/PostgreSQL
// tinggal mengganti implementasi di src/lib/db/*.ts tanpa mengubah UI.

export type AdminRole = "superadmin" | "admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /** Dummy: plain text. Produksi: WAJIB di-hash (bcrypt/argon2) di layer database. */
  password: string;
  role: AdminRole;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string; // ISO datetime
}

export type SpeakerGender = "male" | "female" | "unknown";

export interface Speaker {
  id: string;
  /** Label mentah dari hasil diarization, mis. "Speaker A" */
  rawLabel: string;
  /** Nama tampilan default: "Bapak" / "Ibu" berdasar deteksi gender suara, bisa diubah manual */
  displayName: string;
  gender: SpeakerGender;
  /** Tingkat keyakinan deteksi gender 0-1 (dari model klasifikasi gender suara) */
  genderConfidence?: number;
  talkTimeSec: number;
  colorIndex: number;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  text: string;
  startSec: number;
  endSec: number;
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  due?: string | null;
  done: boolean;
}

export interface MeetingSummary {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  generatedAt: string; // ISO datetime
  generatedBy: AiProvider;
}

export type MeetingStatus = "terjadwal" | "berlangsung" | "diproses" | "selesai";

/**
 * Kedua provider dipakai bersamaan dengan peran tetap — AssemblyAI untuk
 * transkripsi + diarization, Gemini untuk ringkasan. Lihat src/lib/ai/roles.ts.
 */
export type AiProvider = "assemblyai" | "gemini";

export interface Meeting {
  id: string;
  title: string;
  /** Tanggal agenda (YYYY-MM-DD), dipakai untuk kalender */
  date: string;
  /** Waktu mulai rekaman sebenarnya (ISO datetime), diisi otomatis saat klik "Mulai" */
  startTime: string | null;
  endTime: string | null;
  durationSec: number;
  status: MeetingStatus;
  location?: string;
  speakers: Speaker[];
  transcript: TranscriptSegment[];
  summary: MeetingSummary | null;
  /** ID transkrip AssemblyAI, disimpan untuk penelusuran/audit hasil diarization. */
  assemblyaiTranscriptId?: string | null;
  createdBy: string; // AdminUser id
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyConfig {
  provider: AiProvider;
  label: string;
  apiKey: string;
  isConfigured: boolean;
  lastTestedAt: string | null;
  lastTestStatus: "belum_diuji" | "berhasil" | "gagal";
  updatedAt: string;
}
