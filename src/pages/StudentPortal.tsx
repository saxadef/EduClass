import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle, ArrowRight, ShieldCheck, Download, AlertCircle, Info, RefreshCw, LogIn } from 'lucide-react';
import { ApiClient } from '../lib/api';
import { Class, Section, Instruction } from '../types';
import { sanitizeHtml, sanitizeFileName, isSafeFileExtension, sanitizeStudentName } from '../lib/utils';
import { FileIcon } from '../components/FileIcon';

export default function StudentPortal() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Form states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [fullName, setFullName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Status and submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{
    submissionId: string;
    fileName: string;
    timestamp: string;
  } | null>(null);

  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load public data on mount
  useEffect(() => {
    async function loadPortalData() {
      try {
        const [cls, secs, insts] = await Promise.all([
          ApiClient.getClasses(),
          ApiClient.getPublicSections(),
          ApiClient.getPublicInstructions()
        ]);
        setClasses(cls);
        setSections(secs);
        setInstructions(insts);

        if (cls.length > 0) {
          setSelectedClassId(cls[0].class_id);
        }
      } catch (err) {
        console.error('Failed to load student portal catalogs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPortalData();
  }, []);

  // Track size upload limit and customizable text values in real time
  const [uploadLimitMb, setUploadLimitMb] = useState(10);
  const [portalSettings, setPortalSettings] = useState({
    PORTAL_HEADER_TEXT: 'Portal Pengumpulan EduClass',
    PORTAL_LOGO_TEXT: 'Edu',
    PORTAL_LOGO_IMAGE_URL: '',
    STUDENT_DESK_TITLE: 'Student Dashboard',
    STUDENT_DESK_DESC: 'Pilih Kelas Anda untuk memeriksa pelajaran, mengunduh panduan belajar atau templat yang dilampirkan, dan mengumpulkan tugas Anda dengan aman.',
    SUBMISSION_FORM_TITLE: 'Formulir Pengumpulan',
  });

  useEffect(() => {
    async function fetchPortalSettings() {
      try {
        const s = await ApiClient.getPublicSettings();
        if (s.MAX_UPLOAD_SIZE_MB) {
          setUploadLimitMb(parseFloat(s.MAX_UPLOAD_SIZE_MB));
        }
        setPortalSettings({
          PORTAL_HEADER_TEXT: s.PORTAL_HEADER_TEXT || 'Portal Pengumpulan EduClass',
          PORTAL_LOGO_TEXT: s.PORTAL_LOGO_TEXT || 'Edu',
          PORTAL_LOGO_IMAGE_URL: s.PORTAL_LOGO_IMAGE_URL || '',
          STUDENT_DESK_TITLE: s.STUDENT_DESK_TITLE || 'Student Dashboard',
          STUDENT_DESK_DESC: s.STUDENT_DESK_DESC || 'Pilih Kelas Anda untuk memeriksa pelajaran, mengunduh panduan belajar atau templat yang dilampirkan, dan mengumpulkan tugas Anda dengan aman.',
          SUBMISSION_FORM_TITLE: s.SUBMISSION_FORM_TITLE || 'Formulir Pengumpulan',
        });
      } catch (err) {
        console.error('Failed to load portal configuration:', err);
      }
    }
    fetchPortalSettings();
  }, []);

  // Filter sections matching currently selected Class
  const activeClassSections = sections.filter(s => s.class_id === selectedClassId && s.status === 'PUBLISHED');

  // Trigger default selection when Class changes
  useEffect(() => {
    if (activeClassSections.length > 0) {
      setSelectedSectionId(activeClassSections[0].section_id);
    } else {
      setSelectedSectionId('');
    }
  }, [selectedClassId, sections]);

  // Find active assignment instructions
  const activeSectionObj = sections.find(s => s.section_id === selectedSectionId);
  const activeSectionInstructions = instructions.filter(i => i.section_id === selectedSectionId);

  // Drag & drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setErrorMessage('');
    
    // 1. Security Check: Validate safe file extensions
    if (!isSafeFileExtension(selectedFile.name)) {
      setErrorMessage('Peringatan Keamanan: Ekstensi file ini dilarang. Silakan unggah format yang aman seperti PDF, DOCX, XLSX, PPTX, TXT, ZIP, atau file gambar.');
      setFile(null);
      return;
    }

    const maxBytes = uploadLimitMb * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setErrorMessage(`File yang dipilih melebihi batas ${uploadLimitMb} MB yang ditentukan oleh administrator. Silakan kompres atau pilih file yang lebih kecil.`);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  // Convert binary file to Base64
  const fileToBase64 = (blob: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip out the data url scheme prefix (e.g. "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      setErrorMessage('Silakan pilih Kelas Anda.');
      return;
    }
    if (!selectedSectionId) {
      setErrorMessage('Silakan pilih tugas mana yang ingin Anda kumpulkan.');
      return;
    }

    // Pastikan pertemuan terpilih memiliki pengumpulan aktif
    if (!activeSectionObj || !activeSectionObj.submission_enabled) {
      setErrorMessage('Pertemuan terpilih tidak menerima pengumpulan tugas.');
      return;
    }

    // Check if deadline has passed
    if (activeSectionObj.due_at) {
      const dueDate = new Date(activeSectionObj.due_at);
      const currentDate = new Date();
      if (currentDate > dueDate) {
        setErrorMessage(`Maaf, batas waktu pengumpulan untuk tugas ini telah terlewati (${new Date(activeSectionObj.due_at).toLocaleString('id-ID')}). Anda tidak dapat mengumpulkan tugas lagi.`);
        return;
      }
    }
    
    // 2. Security Check: Sanitize student full name inputs
    const cleanFullName = sanitizeStudentName(fullName);
    if (!cleanFullName) {
      setErrorMessage('Silakan masukkan nama siswa yang valid (hanya menggunakan huruf, spasi, tanda hubung, dan titik).');
      return;
    }
    
    if (!file) {
      setErrorMessage('Silakan pilih atau letakkan file tugas Anda.');
      return;
    }

    // 3. Security Check: Sanitize and validate final filename
    const cleanFileName = sanitizeFileName(file.name);
    if (!isSafeFileExtension(cleanFileName)) {
      setErrorMessage('Peringatan Keamanan: Ekstensi file dilarang.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const base64Data = await fileToBase64(file);
      
      const res = await ApiClient.submitAssignment({
        classId: selectedClassId,
        sectionId: selectedSectionId,
        fullName: cleanFullName,
        fileName: cleanFileName,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileBase64: base64Data
      });

      setSuccessData({
        submissionId: res.submission_id,
        fileName: res.current_filename,
        timestamp: res.timestamp
      });

      // Reset fields
      setFullName('');
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengunggah. Silakan periksa koneksi atau hubungi guru.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-indigo-50/10 to-neutral-50 flex flex-col font-sans select-none antialiased relative">
      {/* Decorative premium top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 z-50" />

      {/* Header navbar */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {portalSettings.PORTAL_LOGO_IMAGE_URL ? (
              <img 
                src={portalSettings.PORTAL_LOGO_IMAGE_URL} 
                alt="Logo" 
                className="h-9 max-w-[130px] object-contain rounded-lg shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="px-2 py-1.5 bg-neutral-950 text-white rounded-xl text-xs font-black tracking-widest select-none uppercase shadow-sm">
                {portalSettings.PORTAL_LOGO_TEXT}
              </span>
            )}
            <span className="font-extrabold text-neutral-950 text-base tracking-tight">{portalSettings.PORTAL_HEADER_TEXT}</span>
          </div>
          
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-950 rounded-xl bg-white shadow-sm/5 hover:shadow transition-all duration-200"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login Guru
          </Link>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="py-24 text-center text-sm font-semibold text-neutral-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-neutral-500" />
            <span>Memuat file pelajaran dan tugas aktif...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unified Class Selector card */}
            <div className="bg-white border border-neutral-200/70 rounded-2xl p-6 shadow-sm hover:shadow transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-400 to-indigo-600" />
              <div className="space-y-1 pl-2">
                <h2 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Langkah 1: Pilih Kelas Anda</h2>
                <p className="text-xs text-neutral-600">Pilih kelas Anda untuk melihat daftar pertemuan, materi pembelajaran, dan mengumpulkan tugas.</p>
              </div>
              <div className="shrink-0 w-full sm:w-64">
                <select
                  id="classSel"
                  required
                  className="block w-full p-2.5 border border-neutral-300 rounded-xl text-sm bg-white font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-950 transition-all cursor-pointer shadow-sm"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="" disabled>-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>Kelas {c.class_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Classes and Sections List */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Introduction Card */}
                <div className="border border-neutral-200/70 rounded-2xl p-6 bg-white shadow-sm hover:shadow transition-all duration-300 space-y-4">
                  <h2 className="text-base font-extrabold text-neutral-950">{portalSettings.STUDENT_DESK_TITLE}</h2>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {portalSettings.STUDENT_DESK_DESC}
                  </p>
                  <div className="flex items-start gap-2 text-[10px] text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Pengunggahan dilindungi secara aman. Pengumpulan disimpan di folder kelas terenkripsi.</span>
                  </div>
                </div>

                {/* List of Sections for Selected Class */}
                <div className="border border-neutral-200/70 rounded-2xl p-6 bg-white shadow-sm hover:shadow transition-all duration-300 space-y-4">
                  <h3 className="font-bold text-neutral-950 text-sm flex items-center gap-1.5 border-b border-neutral-100 pb-3">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    Daftar Pertemuan & Tugas
                  </h3>
                  {activeClassSections.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-6 text-center">Belum ada pertemuan atau tugas yang diterbitkan untuk kelas ini.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {activeClassSections.map((sec) => {
                        const isActive = sec.section_id === selectedSectionId;
                        return (
                          <button
                            key={sec.section_id}
                            type="button"
                            onClick={() => {
                              setSelectedSectionId(sec.section_id);
                              setSuccessData(null); // Reset success state when switching section
                              setErrorMessage('');
                              setFullName('');
                              setFile(null);
                            }}
                            className={`w-full text-left p-3 rounded-xl text-xs transition-all duration-200 border flex items-center justify-between gap-2.5 ${
                              isActive
                                ? 'bg-neutral-950 text-white border-neutral-950 font-semibold shadow-md translate-x-1'
                                : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="truncate pr-1 flex items-center gap-2">
                              <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                isActive 
                                  ? sec.submission_enabled ? 'bg-white/20 text-white' : 'bg-white/10 text-white/90'
                                  : sec.submission_enabled ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-700'
                              }`}>
                                {sec.submission_enabled ? 'Tugas' : 'Materi'}
                              </span>
                              <span className="text-xs truncate font-medium">{sec.section_name}</span>
                            </div>
                            {sec.due_at && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                                isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                Selesai: {new Date(sec.due_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Active Section Viewer & Nested Submission Form */}
              <div className="lg:col-span-8">
                {!selectedSectionId ? (
                  <div className="border border-neutral-200/70 bg-white rounded-2xl p-12 text-center space-y-4 shadow-sm hover:shadow transition-all duration-300">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto border border-neutral-100">
                      <FileText className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="font-bold text-neutral-800 text-sm">Pilih Pertemuan & Tugas</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                      Silakan pilih salah satu pertemuan atau tugas aktif dari daftar di sebelah kiri untuk melihat materi panduan dan mengumpulkan tugas Anda.
                    </p>
                  </div>
                ) : (
                  <div className="border border-neutral-200/70 bg-white rounded-2xl p-8 shadow-sm hover:shadow transition-all duration-300 space-y-6 relative overflow-hidden">
                    {/* Section Header */}
                    <div className="border-b border-neutral-150 pb-5">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                          activeSectionObj?.submission_enabled ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {activeSectionObj?.submission_enabled ? 'Tugas Terjadwal' : 'Materi Pembelajaran'}
                        </span>
                        {activeSectionObj?.due_at && (
                          <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2.5 py-0.5 rounded font-bold">
                            Batas Waktu: {new Date(activeSectionObj.due_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-neutral-900 text-xl tracking-tight">{activeSectionObj?.section_name}</h3>
                      {activeSectionObj?.description && (
                        <p className="text-xs text-neutral-600 mt-2.5 whitespace-pre-wrap leading-relaxed">
                          {activeSectionObj.description}
                        </p>
                      )}
                    </div>

                    {/* Instructions Content */}
                    {activeSectionInstructions.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-xs uppercase tracking-widest text-neutral-400">Instruksi & Panduan Belajar</h4>
                        <div className="space-y-4">
                          {activeSectionInstructions.map((inst) => (
                            <div key={inst.instruction_id} className="p-5 border border-neutral-200/80 rounded-xl bg-neutral-50/30 space-y-4 hover:bg-neutral-50/50 transition duration-200">
                              <h5 className="font-extrabold text-neutral-800 text-sm">{inst.title}</h5>
                              {inst.content_html && (
                                <div
                                  className="text-xs text-neutral-600 leading-relaxed max-h-48 overflow-y-auto select-text prose prose-sm pr-1 border-l-2 border-neutral-300 pl-3 py-1"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(inst.content_html) }}
                                />
                              )}

                              {(() => {
                                const list = parseAttachments(inst.attachment_file_id, inst.attachment_name, inst.attachment_mime_type);
                                if (list.length === 0) return null;
                                return (
                                  <div className="mt-3 pt-3 border-t border-neutral-200/60 space-y-2">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Berkas Lampiran Pendukung:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {list.map((attFile, fIdx) => (
                                        <a
                                          key={attFile.id || fIdx}
                                          href={`https://drive.google.com/file/d/${attFile.id}/view?usp=drivesdk`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-800 font-medium transition-colors cursor-pointer shadow-sm"
                                        >
                                          <FileIcon mimeType={attFile.mimeType} className="w-4 h-4 text-neutral-600" />
                                          <span className="font-semibold truncate max-w-[240px]">{attFile.name}</span>
                                          <Download className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nested Submission Form / Success State (ONLY IF SUBMISSION IS ENABLED) */}
                    {activeSectionObj?.submission_enabled && (
                      <div className="mt-8 pt-6 border-t border-neutral-200 space-y-4">
                        {successData ? (
                          /* SUCCESS VIEW INSIDE SECTION */
                          <div className="border border-emerald-200/80 bg-emerald-50/20 rounded-2xl p-6 text-center space-y-5 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-base font-extrabold text-neutral-900">Tugas Anda Berhasil Dikumpulkan!</h4>
                              <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                                File tugas telah disimpan dengan aman di Google Drive Anda dan notifikasi terkirim ke Telegram Guru.
                              </p>
                            </div>

                            <div className="border border-emerald-100 bg-white rounded-xl p-4 text-left text-xs space-y-2.5 max-w-sm mx-auto shadow-sm">
                              <div className="flex justify-between gap-2 border-b border-neutral-100 pb-2">
                                <span className="font-bold text-neutral-400">ID Pengumpulan:</span>
                                <span className="font-mono text-neutral-800 text-[10px] font-bold break-all">{successData.submissionId}</span>
                              </div>
                              <div className="flex justify-between gap-2 border-b border-neutral-100 pb-2">
                                <span className="font-bold text-neutral-400">Nama File:</span>
                                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{successData.fileName}</span>
                              </div>
                              <div className="flex justify-between gap-2">
                                <span className="font-bold text-neutral-400">Waktu Kirim:</span>
                                <span className="text-neutral-600 font-semibold">{new Date(successData.timestamp).toLocaleString('id-ID')}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSuccessData(null)}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md hover:-translate-y-0.5"
                            >
                              Kirim Ulang / Kirim File Lain
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* FORM VIEW INSIDE SECTION */
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                              <Upload className="w-4 h-4 text-amber-500" />
                              <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Upload {activeSectionObj?.section_name || 'Tugas'}</h4>
                            </div>

                            {errorMessage && (
                              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-xs text-red-700 flex items-start gap-2 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <span>{errorMessage}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                              <div className="md:col-span-4">
                                <label htmlFor="studentName" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                  Nama Lengkap Anda
                                </label>
                                <input
                                  id="studentName"
                                  type="text"
                                  required
                                  placeholder="contoh: Setiawan"
                                  className="mt-2 block w-full p-2.5 border border-neutral-300 rounded-xl text-xs bg-neutral-50/20 focus:outline-none focus:ring-2 focus:ring-neutral-950 transition-all shadow-sm font-semibold text-neutral-800"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                />
                              </div>

                              <div className="md:col-span-5">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                  Unggah File Tugas (Maks {uploadLimitMb} MB)
                                </label>
                                <div
                                  onDragEnter={handleDrag}
                                  onDragOver={handleDrag}
                                  onDragLeave={handleDrag}
                                  onDrop={handleDrop}
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`mt-2 border-2 border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                                    dragActive
                                      ? 'border-neutral-950 bg-neutral-50'
                                      : file
                                      ? 'border-emerald-500 bg-emerald-50/10'
                                      : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/10 hover:bg-neutral-50/30'
                                  }`}
                                >
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
                                    onChange={handleFileInputChange}
                                  />
                                  {file ? (
                                    <div className="flex items-center gap-1.5 truncate text-left">
                                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="font-extrabold text-neutral-950 text-xs truncate max-w-[150px]">{file.name}</span>
                                      <span className="text-[9px] text-neutral-400 font-bold whitespace-nowrap">({formatBytes(file.size)})</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-neutral-500">
                                      <Upload className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                      <span className="text-xs font-medium">Klik / seret file tugas Anda</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-3">
                                <button
                                  type="submit"
                                  disabled={submitting}
                                  className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  {submitting ? 'Mengirim...' : 'Kumpulkan'}
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer credits */}
      <footer className="border-t border-neutral-200/80 bg-white py-8 text-center text-xs text-neutral-400 mt-12 shadow-sm/5">
        <p className="max-w-2xl mx-auto px-4 font-medium leading-relaxed">&copy; {new Date().getFullYear()} EduClass</p>
      </footer>
    </div>
  );
}
