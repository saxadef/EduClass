import { Edit2, Trash2, FilePlus, Archive, Save, Copy, Check, ExternalLink, Download } from 'lucide-react';

// ==========================================
// // action pada general setting
// ==========================================
interface GeneralSettingsActionsProps {
  onSave?: (e?: any) => void | Promise<void>;
  saving: boolean;
  disabled?: boolean;
  label?: string;
  type?: 'button' | 'submit';
}

export function GeneralSettingsActions({ onSave, saving, disabled, label, type = 'button' }: GeneralSettingsActionsProps) {
  return (
    <button
      onClick={onSave}
      type={type}
      disabled={saving || disabled}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 hover:scale-[1.02] text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
    >
      <Save className="w-4 h-4" />
      {saving ? 'Menyimpan...' : (label || 'Simpan Pengaturan')}
    </button>
  );
}

// ==========================================
// // action daftar administrator
// ==========================================
interface AdminActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  disabledDelete?: boolean;
}

export function AdminActions({ onEdit, onDelete, disabledDelete }: AdminActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onEdit}
        className="p-1.5 hover:bg-neutral-100 hover:text-neutral-900 rounded-md text-neutral-500 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Ubah Administrator"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDelete}
        disabled={disabledDelete}
        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-red-500 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-40 cursor-pointer"
        title="Hapus Administrator"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ==========================================
// // action daftar kelas
// ==========================================
interface ClassActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ClassActions({ onEdit, onDelete }: ClassActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="p-2 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg text-neutral-500 hover:scale-105 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Ubah Kelas"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-red-500 hover:scale-105 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Hapus Kelas"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ==========================================
// // action daftar siswa
// ==========================================
interface StudentActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentActions({ onEdit, onDelete }: StudentActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="p-2 hover:bg-neutral-100 hover:text-neutral-900 rounded-lg text-neutral-500 hover:scale-105 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Ubah Data Siswa"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-red-500 hover:scale-105 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Hapus Siswa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ==========================================
// // action daftar pertemuan / section
// ==========================================
interface SectionActionsProps {
  onAddInstruction: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isArchived: boolean;
}

export function SectionActions({ onAddInstruction, onEdit, onDelete, onArchive, isArchived }: SectionActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onAddInstruction}
        className="p-1.5 hover:bg-neutral-100 hover:text-neutral-900 rounded-md text-neutral-600 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Tambah Instruksi / Lampiran"
      >
        <FilePlus className="w-4 h-4" />
      </button>
      <button
        onClick={onEdit}
        className="p-1.5 hover:bg-neutral-100 hover:text-neutral-900 rounded-md text-neutral-600 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Ubah Detail Pertemuan"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      {!isArchived && onArchive && (
        <button
          onClick={onArchive}
          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-red-600 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          title="Arsipkan Pertemuan"
        >
          <Archive className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-red-500 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          title="Hapus Pertemuan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ==========================================
// // action daftar instruksi
// ==========================================
interface InstructionActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function InstructionActions({ onEdit, onDelete }: InstructionActionsProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={onEdit}
        className="p-1.5 hover:bg-neutral-100 hover:text-neutral-900 rounded-md text-neutral-500 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Ubah Pelajaran / Instruksi"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-red-500 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        title="Hapus Pelajaran"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ==========================================
// // action berkas Google Drive / File Manager
// // ==========================================
interface DriveFileActionsProps {
  onCopyId: () => void;
  isCopied: boolean;
  downloadUrl: string;
  viewUrl?: string;
  onDelete: () => void;
  isListView?: boolean;
}

export function DriveFileActions({ onCopyId, isCopied, downloadUrl, viewUrl, onDelete, isListView = false }: DriveFileActionsProps) {
  const getOpenUrl = () => {
    if (viewUrl) return viewUrl;
    if (downloadUrl && downloadUrl.includes('id=')) {
      const match = downloadUrl.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/view`;
      }
    }
    return downloadUrl;
  };

  const openUrl = getOpenUrl();

  if (isListView) {
    return (
      <div className="inline-flex items-center gap-1">
        <button
          onClick={onCopyId}
          className="p-1 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 rounded transition-colors cursor-pointer"
          title="Salin ID"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 rounded transition-colors inline-flex items-center justify-center"
          title="Buka"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="p-1 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 rounded transition-colors inline-flex items-center justify-center"
          title="Unduh"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-50 text-red-400 hover:text-red-500 rounded transition-colors cursor-pointer"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-100 mt-4 pt-3 flex items-center justify-between gap-1 w-full">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onCopyId}
          className="p-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 rounded transition-colors cursor-pointer"
          title="Salin ID File"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 rounded transition-colors inline-flex items-center justify-center"
          title="Buka Berkas di Drive"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="p-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 rounded transition-colors inline-flex items-center justify-center"
          title="Unduh Berkas"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>

      <button
        onClick={onDelete}
        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors cursor-pointer"
        title="Hapus Permanen"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
