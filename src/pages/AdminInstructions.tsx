import React, { useEffect, useState } from 'react';
import { Plus, Check, Eye, Globe, FileUp, X, Clock, Trash2, FolderOpen, Loader2, HardDrive, ExternalLink } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import RichTextEditor from '../components/RichTextEditor';
import { ApiClient } from '../lib/api';
import { Class, Section, Instruction, DriveFile } from '../types';
import { sanitizeHtml, parseYoutubeLink, getYoutubeEmbedUrl } from '../lib/utils';
import { SectionActions, InstructionActions } from '../components/ActionButtons';
import ConfirmModal from '../components/ConfirmModal';
import { FileIcon } from '../components/FileIcon';

export default function AdminInstructions() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom alert & confirm states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Modals / forms state
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionForm, setSectionForm] = useState({
    class_id: '',
    section_name: '',
    description: '',
    publish_at: '',
    due_at: '',
    submission_enabled: true,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    youtube_link: ''
  });

  const [showInstForm, setShowInstForm] = useState(false);
  const [editingInst, setEditingInst] = useState<Instruction | null>(null);
  const [instSectionId, setInstSectionId] = useState('');
  const [instForm, setInstForm] = useState({
    title: '',
    content_html: '',
    attachment_name: '',
    attachment_mime_type: '',
    attachment_file_id: '',
    status: 'PUBLISHED',
    youtube_link: ''
  });

  // Base64 helper for attachment upload simulation
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);

  // Helper to parse attachments
  const parseAttachments = (fileId: string, name: string, mimeType: string): { id: string; name: string; mimeType: string }[] => {
    if (!fileId) return [];
    if (fileId.trim().startsWith('[')) {
      try {
        return JSON.parse(fileId);
      } catch (e) {
        console.error('Failed to parse attachments JSON, falling back to single:', e);
      }
    }
    return [{ id: fileId, name: name, mimeType: mimeType }];
  };

  const getAttachments = (): { id: string; name: string; mimeType: string }[] => {
    return parseAttachments(instForm.attachment_file_id, instForm.attachment_name, instForm.attachment_mime_type);
  };

  const setAttachments = (list: { id: string; name: string; mimeType: string }[]) => {
    if (list.length === 0) {
      setInstForm(prev => ({
        ...prev,
        attachment_file_id: '',
        attachment_name: '',
        attachment_mime_type: ''
      }));
    } else if (list.length === 1) {
      setInstForm(prev => ({
        ...prev,
        attachment_file_id: list[0].id,
        attachment_name: list[0].name,
        attachment_mime_type: list[0].mimeType
      }));
    } else {
      setInstForm(prev => ({
        ...prev,
        attachment_file_id: JSON.stringify(list),
        attachment_name: `${list.length} File Lampiran`,
        attachment_mime_type: 'application/json'
      }));
    }
  };

  const loadDriveFiles = async () => {
    setLoadingDriveFiles(true);
    try {
      const files = await ApiClient.listDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMessage('Gagal memuat daftar file dari Google Drive: ' + err.message);
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  const handleAttachFromDrive = (file: DriveFile) => {
    const current = getAttachments();
    if (current.some(f => f.id === file.id)) {
      setErrorMessage('File ini sudah dilampirkan.');
      return;
    }
    current.push({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType
    });
    setAttachments(current);
    setSuccessMessage(`Berhasil melampirkan "${file.name}" dari Drive.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingAttachment(true);
    setErrorMessage('');
    
    try {
      const currentAttachments = getAttachments();
      const filesToUpload = Array.from(e.target.files) as File[];
      
      for (const file of filesToUpload) {
        // Read file as Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
        });
        
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;
        
        // Upload via ApiClient
        const uploaded = await ApiClient.uploadDriveFile(
          file.name,
          file.type,
          base64Data,
          'Materials'
        );
        
        currentAttachments.push({
          id: uploaded.id,
          name: uploaded.name,
          mimeType: uploaded.mimeType
        });
      }
      
      setAttachments(currentAttachments);
      setSuccessMessage('Berhasil mengunggah dan melampirkan file ke instruksi.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal mengunggah file ke Google Drive: ' + err.message);
    } finally {
      setUploadingAttachment(false);
      // Reset input
      e.target.value = '';
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cls, sec, inst] = await Promise.all([
        ApiClient.getClasses(),
        ApiClient.getSections(),
        ApiClient.getInstructions()
      ]);
      setClasses(cls);
      setSections(sec);
      setInstructions(inst);

      if (cls.length > 0 && !sectionForm.class_id) {
        setSectionForm(prev => ({ ...prev, class_id: cls[0].class_id }));
      }
    } catch (err) {
      console.error('Failed to load instructions and sections:', err);
    } finally {
      setLoading(false);
    }
  }

  // Section handlers
  const handleOpenCreateSection = () => {
    setEditingSection(null);
    setSectionForm({
      class_id: classes[0]?.class_id || '',
      section_name: '',
      description: '',
      publish_at: new Date().toISOString().substring(0, 16),
      due_at: new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 16), // 7 days later
      submission_enabled: true,
      status: 'DRAFT',
      youtube_link: ''
    });
    setShowSectionForm(true);
  };

  const handleOpenEditSection = (sec: Section) => {
    setEditingSection(sec);
    const parsed = parseYoutubeLink(sec.description || '');
    setSectionForm({
      class_id: sec.class_id,
      section_name: sec.section_name,
      description: parsed.cleanText,
      publish_at: sec.publish_at ? new Date(sec.publish_at).toISOString().substring(0, 16) : '',
      due_at: sec.due_at ? new Date(sec.due_at).toISOString().substring(0, 16) : '',
      submission_enabled: sec.submission_enabled,
      status: sec.status,
      youtube_link: parsed.youtubeLink
    });
    setShowSectionForm(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Parse dates to ISO string
      const pubDate = sectionForm.publish_at ? new Date(sectionForm.publish_at).toISOString() : '';
      const dueDate = sectionForm.due_at ? new Date(sectionForm.due_at).toISOString() : '';

      // Append YouTube link if present
      let finalDescription = sectionForm.description;
      if (sectionForm.youtube_link && sectionForm.youtube_link.trim()) {
        finalDescription = `${sectionForm.description.trim()} ||YT_LINK:${sectionForm.youtube_link.trim()}||`;
      }

      const payload = {
        class_id: sectionForm.class_id,
        section_name: sectionForm.section_name,
        description: finalDescription,
        publish_at: pubDate,
        due_at: dueDate,
        submission_enabled: sectionForm.submission_enabled,
        status: sectionForm.status
      };

      if (editingSection) {
        await ApiClient.updateSection(editingSection.section_id, payload);
        setSuccessMessage(`Berhasil memperbarui pertemuan "${sectionForm.section_name}".`);
      } else {
        await ApiClient.createSection(payload);
        setSuccessMessage(`Berhasil membuat pertemuan baru "${sectionForm.section_name}".`);
      }
      setShowSectionForm(false);
      loadData();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan pertemuan: ' + (err.message || err));
    }
  };

  const handleArchiveSection = (id: string, currentStatus: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Arsipkan Pertemuan',
      message: 'Apakah Anda yakin ingin mengarsipkan pertemuan ini? Ini akan menyembunyikannya dari tampilan publik siswa.',
      onConfirm: async () => {
        try {
          setErrorMessage('');
          setSuccessMessage('');
          await ApiClient.updateSection(id, { status: 'ARCHIVED' });
          setSuccessMessage('Pertemuan berhasil diarsipkan.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setErrorMessage('Gagal mengarsipkan: ' + (err.message || err));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteSection = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pertemuan',
      message: 'Apakah Anda yakin ingin menghapus pertemuan ini secara permanen dari database?',
      onConfirm: async () => {
        try {
          setErrorMessage('');
          setSuccessMessage('');
          await ApiClient.deleteSection(id);
          setSuccessMessage('Pertemuan berhasil dihapus.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setErrorMessage('Gagal menghapus pertemuan: ' + (err.message || err));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Instruction handlers
  const handleOpenCreateInst = (sectionId: string) => {
    setEditingInst(null);
    setInstSectionId(sectionId);
    setInstForm({
      title: '',
      content_html: '',
      attachment_name: '',
      attachment_mime_type: '',
      attachment_file_id: '',
      status: 'PUBLISHED',
      youtube_link: ''
    });
    setAttachmentFile(null);
    setShowInstForm(true);
  };

  const handleOpenEditInst = (inst: Instruction) => {
    setEditingInst(inst);
    setInstSectionId(inst.section_id);
    const parsed = parseYoutubeLink(inst.content_html || '');
    setInstForm({
      title: inst.title,
      content_html: parsed.cleanText,
      attachment_name: inst.attachment_name,
      attachment_mime_type: inst.attachment_mime_type,
      attachment_file_id: inst.attachment_file_id,
      status: inst.status,
      youtube_link: parsed.youtubeLink
    });
    setAttachmentFile(null);
    setShowInstForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0]);
    }
  };

  const handleSaveInst = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setUploadingAttachment(true);
    try {
      let finalContentHtml = instForm.content_html;
      if (instForm.youtube_link && instForm.youtube_link.trim()) {
        finalContentHtml = `${instForm.content_html.trim()} ||YT_LINK:${instForm.youtube_link.trim()}||`;
      }

      const payload = {
        section_id: instSectionId,
        title: instForm.title,
        content_html: finalContentHtml,
        status: instForm.status,
        attachment_name: instForm.attachment_name,
        attachment_mime_type: instForm.attachment_mime_type,
        attachment_file_id: instForm.attachment_file_id
      };

      if (editingInst) {
        await ApiClient.updateInstruction(editingInst.instruction_id, payload);
        setSuccessMessage(`Berhasil memperbarui instruksi "${instForm.title}".`);
      } else {
        await ApiClient.createInstruction(payload);
        setSuccessMessage(`Berhasil membuat instruksi baru "${instForm.title}".`);
      }
      setShowInstForm(false);
      loadData();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan instruksi: ' + (err.message || err));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteInst = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Instruksi',
      message: 'Apakah Anda yakin ingin menghapus instruksi ini?',
      onConfirm: async () => {
        try {
          setErrorMessage('');
          setSuccessMessage('');
          await ApiClient.deleteInstruction(id);
          setSuccessMessage('Instruksi berhasil dihapus.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setErrorMessage('Gagal menghapus instruksi: ' + (err.message || err));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? cls.class_name : 'Tidak Diketahui';
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Instruksi & Materi</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Buat sesi pertemuan kelas dan lampirkan instruksi panduan dengan sumber daya yang dapat diunduh.
            </p>
          </div>
          <button
            onClick={handleOpenCreateSection}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition self-start shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Pertemuan
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Memuat struktur instruksi...</div>
        ) : (
          <div className="space-y-6">
            {sections.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-200 rounded-xl py-12 text-center text-neutral-500">
                Belum ada pertemuan kelas yang dibuat. Buat Pertemuan untuk menampung instruksi dan pelajaran!
              </div>
            ) : (
              sections.map((sec) => {
                const sectionInsts = instructions.filter(i => i.section_id === sec.section_id);
                const clsName = getClassName(sec.class_id);

                return (
                  <div key={sec.section_id} className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Section Header */}
                    <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-neutral-950 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
                            Kelas {clsName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            sec.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            sec.status === 'DRAFT' ? 'bg-neutral-100 text-neutral-600 border border-neutral-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {sec.status === 'PUBLISHED' ? 'PUBLIK' : sec.status === 'DRAFT' ? 'DRAFT' : 'DIARSIPKAN'}
                          </span>
                          {sec.submission_enabled && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
                              Pengiriman Diizinkan
                            </span>
                          )}
                          {sec.due_at && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Batas: {new Date(sec.due_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-neutral-950 mt-1">{sec.section_name}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{sec.description || 'Tidak ada deskripsi.'}</p>
                      </div>

                      <SectionActions
                        onAddInstruction={() => handleOpenCreateInst(sec.section_id)}
                        onEdit={() => handleOpenEditSection(sec)}
                        onArchive={sec.status !== 'ARCHIVED' ? () => handleArchiveSection(sec.section_id, sec.status) : undefined}
                        onDelete={() => handleDeleteSection(sec.section_id)}
                        isArchived={sec.status === 'ARCHIVED'}
                      />
                    </div>

                    {/* Instructions List under this Section */}
                    <div className="p-5 divide-y divide-neutral-100">
                      {sectionInsts.length === 0 ? (
                        <div className="text-sm text-neutral-400 py-2 text-center italic">
                          Belum ada materi atau instruksi yang dibuat untuk pertemuan ini. Klik ikon "+" untuk menulis instruksi panduan atau menambahkan lampiran dokumen.
                        </div>
                      ) : (
                        sectionInsts.map((inst) => (
                          <div key={inst.instruction_id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                                  {inst.title}
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    inst.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                                  }`}>
                                    {inst.status === 'PUBLISHED' ? 'PUBLIK' : 'DRAFT'}
                                  </span>
                                </h4>
                                <div
                                  className="text-xs text-neutral-600 prose max-w-none prose-sm"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(inst.content_html) }}
                                />
                                {(() => {
                                  const list = parseAttachments(inst.attachment_file_id, inst.attachment_name, inst.attachment_mime_type);
                                  if (list.length === 0) return null;
                                  return (
                                    <div className="mt-2.5">
                                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">File Lampiran:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {list.map((file, fIdx) => (
                                          <div key={file.id || fIdx} className="inline-flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-md px-2 py-1 text-[11px] text-neutral-700">
                                            <FileIcon mimeType={file.mimeType} className="w-3.5 h-3.5 text-neutral-500" />
                                            <span className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              <InstructionActions
                                onEdit={() => handleOpenEditInst(inst)}
                                onDelete={() => handleDeleteInst(inst.instruction_id)}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ==================== SECTION FORM MODAL ==================== */}
        {showSectionForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 overflow-y-auto">
            <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-950">{editingSection ? 'Ubah Sesi Pertemuan' : 'Buat Sesi Pertemuan'}</h3>
                <button onClick={() => setShowSectionForm(false)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSection} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Kelas Target</label>
                  <select
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={sectionForm.class_id}
                    onChange={(e) => setSectionForm({ ...sectionForm, class_id: e.target.value })}
                  >
                    {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Nama Pertemuan / Tugas</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Pertemuan 1 - Pengenalan"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={sectionForm.section_name}
                    onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Deskripsi</label>
                  <textarea
                    rows={3}
                    placeholder="Berikan tujuan singkat atau catatan ringkas tentang pertemuan ini."
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Link Video YouTube (Opsional)</label>
                  <input
                    type="url"
                    placeholder="contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={sectionForm.youtube_link}
                    onChange={(e) => setSectionForm({ ...sectionForm, youtube_link: e.target.value })}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Siswa dapat langsung menonton video instruksi ini di portal mereka.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Dipublikasikan Pada</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                      value={sectionForm.publish_at}
                      onChange={(e) => setSectionForm({ ...sectionForm, publish_at: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Tenggat Waktu</label>
                    <input
                      type="datetime-local"
                      required
                      className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                      value={sectionForm.due_at}
                      onChange={(e) => setSectionForm({ ...sectionForm, due_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="subEnabled"
                    className="rounded border-neutral-300"
                    checked={sectionForm.submission_enabled}
                    onChange={(e) => setSectionForm({ ...sectionForm, submission_enabled: e.target.checked })}
                  />
                  <label htmlFor="subEnabled" className="text-sm font-semibold text-neutral-700">
                    Aktifkan tombol unggah tugas bagi siswa
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Status</label>
                  <select
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={sectionForm.status}
                    onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value as any })}
                  >
                    <option value="DRAFT">DRAFT (Disembunyikan)</option>
                    <option value="PUBLISHED">PUBLIK (Terlihat setelah Tanggal Publikasi)</option>
                    <option value="ARCHIVED">DIARSIPKAN (Disembunyikan Permanen)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSectionForm(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    Simpan Pertemuan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== INSTRUCTION / ATTACHMENT FORM MODAL ==================== */}
        {showInstForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 overflow-y-auto">
            <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-950">{editingInst ? 'Ubah Instruksi/Pelajaran' : 'Buat Instruksi/Pelajaran'}</h3>
                <button onClick={() => setShowInstForm(false)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveInst} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Judul Instruksi</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Harap pelajari materi dan kerjakan soal berikut"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={instForm.title}
                    onChange={(e) => setInstForm({ ...instForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider mb-1">Konten Instruksi (Format Teks)</label>
                  <RichTextEditor
                    value={instForm.content_html}
                    onChange={(html) => setInstForm({ ...instForm, content_html: html })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Link Video YouTube (Opsional)</label>
                  <input
                    type="url"
                    placeholder="contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={instForm.youtube_link}
                    onChange={(e) => setInstForm({ ...instForm, youtube_link: e.target.value })}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Siswa dapat melihat/menonton video pendukung atau instruksi ini langsung di portal mereka.</p>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-neutral-500 tracking-wider flex items-center gap-1">
                      <FileUp className="w-4 h-4 text-neutral-400" />
                      File Lampiran (Tidak Terbatas)
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        loadDriveFiles();
                        setShowDrivePicker(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-bold px-2 py-1 rounded shadow-sm transition-colors"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                      Pilih dari Drive
                    </button>
                  </div>

                  {/* Attached List */}
                  {getAttachments().length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {getAttachments().map((file, idx) => (
                        <div key={file.id || idx} className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 truncate pr-4">
                            <FileIcon mimeType={file.mimeType} className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                            <span className="font-medium text-neutral-800 truncate" title={file.name}>{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const list = getAttachments().filter((_, i) => i !== idx);
                              setAttachments(list);
                            }}
                            className="p-1 hover:bg-red-50 text-red-500 rounded flex-shrink-0"
                            title="Hapus lampiran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed border-neutral-300 rounded-lg text-[11px] text-neutral-400 bg-white">
                      Belum ada file lampiran yang ditambahkan.
                    </div>
                  )}

                  {/* Local Upload */}
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Unggah File Baru</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingAttachment}
                      className="block w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 disabled:opacity-50"
                    />
                    <p className="text-[9px] text-neutral-400 mt-1">
                      Bisa memilih satu atau several file sekaligus. Ukuran dibatasi oleh limit di Pengaturan.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Status Visibilitas</label>
                  <select
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={instForm.status}
                    onChange={(e) => setInstForm({ ...instForm, status: e.target.value })}
                  >
                    <option value="PUBLISHED">PUBLIK (Segera terlihat)</option>
                    <option value="DRAFT">DRAFT (Disembunyikan)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInstForm(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingAttachment}
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    {uploadingAttachment ? 'Menyimpan dengan lampiran...' : 'Simpan Instruksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ==================== DRIVE PICKER SUB-MODAL ==================== */}
      {showDrivePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/50 p-4">
          <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h4 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-neutral-600" />
                Pilih File dari Google Drive
              </h4>
              <button onClick={() => setShowDrivePicker(false)} className="p-1 hover:bg-neutral-200 rounded text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <p className="text-[11px] text-neutral-500">
                Berikut adalah kumpulan file yang berada di folder Google Drive yang dibagikan untuk sistem ini. Klik file untuk melampirkannya ke instruksi ini.
              </p>

              {loadingDriveFiles ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                  Memuat berkas Google Drive...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 italic">
                  Belum ada file di folder Google Drive yang digunakan. Anda dapat mengunggah file di File Manager terlebih dahulu.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden bg-white">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => {
                        handleAttachFromDrive(file);
                        setShowDrivePicker(false);
                      }}
                      className="flex items-center justify-between p-2.5 hover:bg-neutral-50 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-3">
                        <FileIcon mimeType={file.mimeType} className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-neutral-800 truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{file.parentName} &bull; {(file.sizeBytes / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-[10px] text-neutral-900 font-bold hover:underline"
                      >
                        Pilih
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-neutral-100 flex justify-end bg-neutral-50">
              <button
                type="button"
                onClick={() => setShowDrivePicker(false)}
                className="px-3.5 py-1.5 border border-neutral-300 rounded-lg text-xs hover:bg-neutral-100 font-semibold text-neutral-700"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </AdminLayout>
  );
}
