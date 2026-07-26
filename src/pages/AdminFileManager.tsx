import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Search, 
  HardDrive, 
  FileUp, 
  Loader2, 
  Grid, 
  List, 
  File, 
  FileText, 
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
  Database,
  Folder,
  FolderOpen,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { ApiClient } from '../lib/api';
import { DriveFile } from '../types';
import { FileIcon } from '../components/FileIcon';
import ConfirmModal from '../components/ConfirmModal';
import { DriveFileActions } from '../components/ActionButtons';

export default function AdminFileManager() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'PDF' | 'IMAGE' | 'DOC' | 'OTHER'>('ALL');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Separated sections states
  const [mainTab, setMainTab] = useState<'materi' | 'tugas'>('materi');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Status/Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete confirm modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    fileId: string;
    fileName: string;
  }>({
    isOpen: false,
    fileId: '',
    fileName: ''
  });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await ApiClient.listDriveFiles();
      setFiles(data);
    } catch (err: any) {
      setErrorMessage('Gagal memuat berkas dari Google Drive: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const targetFile = e.target.files[0];
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
      });
      
      reader.readAsDataURL(targetFile);
      const base64Data = await base64Promise;
      
      // Upload directly to General/Shared Main Folder
      await ApiClient.uploadDriveFile(
        targetFile.name,
        targetFile.type,
        base64Data,
        'Main Drive Folder'
      );
      
      setSuccessMessage(`Berhasil mengunggah "${targetFile.name}" ke Google Drive.`);
      loadFiles();
    } catch (err: any) {
      setErrorMessage('Gagal mengunggah berkas: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const openDeleteConfirm = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      fileId: id,
      fileName: name
    });
  };

  const handleDeleteFile = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await ApiClient.deleteDriveFile(deleteModal.fileId);
      setSuccessMessage(`Berkas "${deleteModal.fileName}" berhasil dihapus secara permanen.`);
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
      loadFiles();
    } catch (err: any) {
      setErrorMessage('Gagal menghapus berkas: ' + err.message);
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Helper to format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to parse file metadata (Materi vs Submission, Class, Section)
  const getFileMeta = (file: DriveFile) => {
    let className = 'Lainnya';
    let sectionName = 'Umum';
    let isSubmission = false;

    if (file.path && file.path.length >= 3) {
      const classesIdx = file.path.indexOf('Classes');
      if (classesIdx !== -1 && file.path.length > classesIdx + 1) {
        className = file.path[classesIdx + 1];
        if (file.path.length > classesIdx + 2) {
          sectionName = file.path[classesIdx + 2];
        }
      }
      // Check if path indicates Submissions folder
      isSubmission = file.path.some(p => p.toLowerCase().includes('submission') || p.toLowerCase().includes('pengumpulan'));
    } else {
      const pName = file.parentName || '';
      const pLower = pName.toLowerCase();
      if (pLower.includes('submissions') || pLower.includes('submission') || pLower.includes('pengumpulan') || pLower.includes('tugas')) {
        isSubmission = true;
      }
      if (pName.includes('Classes/')) {
        className = pName.split('Classes/')[1] || 'Lainnya';
      } else if (pLower.includes('materials of assignment') || pLower.includes('submissions of assignment') || pLower.includes('of assignment')) {
        sectionName = pName.replace('Materials of ', '').replace('Submissions of ', '');
      }
    }

    // Secondary heuristic checks
    const nameLower = file.name.toLowerCase();
    const parentLower = (file.parentName || '').toLowerCase();
    if (nameLower.startsWith('tugas') || nameLower.includes('pengumpulan') || parentLower.includes('submission') || parentLower.includes('pengumpulan') || parentLower.includes('tugas')) {
      isSubmission = true;
    }

    return { className, sectionName, isSubmission };
  };

  // Calculate statistics
  const totalFiles = files.length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const pdfCount = files.filter(f => f.mimeType?.toLowerCase().includes('pdf')).length;
  const imageCount = files.filter(f => f.mimeType?.toLowerCase().startsWith('image/')).length;
  const docCount = files.filter(f => {
    const mt = f.mimeType?.toLowerCase() || '';
    return mt.includes('word') || mt.includes('sheet') || mt.includes('excel') || mt.includes('presentation') || mt.includes('document');
  }).length;

  // Enhance all files with their parsed metadata
  const parsedFiles = files.map(file => ({
    ...file,
    meta: getFileMeta(file)
  }));

  // Group files into Materials (Materi) and Submissions (Tugas Siswa)
  const materiFiles = parsedFiles.filter(f => !f.meta.isSubmission);
  const submissionFiles = parsedFiles.filter(f => f.meta.isSubmission);

  // Filtered Materials (Materi) list based on search and other filters
  const filteredMateriFiles = materiFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          file.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = true;
    const mt = file.mimeType?.toLowerCase() || '';
    if (activeTypeFilter === 'PDF') {
      matchesType = mt.includes('pdf');
    } else if (activeTypeFilter === 'IMAGE') {
      matchesType = mt.startsWith('image/');
    } else if (activeTypeFilter === 'DOC') {
      matchesType = mt.includes('word') || mt.includes('sheet') || mt.includes('excel') || mt.includes('presentation') || mt.includes('document');
    } else if (activeTypeFilter === 'OTHER') {
      matchesType = !mt.includes('pdf') && !mt.startsWith('image/') && !mt.includes('word') && !mt.includes('sheet') && !mt.includes('excel') && !mt.includes('presentation') && !mt.includes('document');
    }

    let matchesFolder = true;
    if (activeFolderFilter !== 'ALL') {
      matchesFolder = file.parentName === activeFolderFilter;
    }

    return matchesSearch && matchesType && matchesFolder;
  });

  // Flat list of submissions when searching
  const searchedSubmissionFiles = submissionFiles.filter(file => {
    return file.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           file.meta.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
           file.meta.sectionName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Unique Classes and Sections for the folder view
  const submissionClasses = (Array.from(new Set(submissionFiles.map(f => f.meta.className))) as string[]).sort();
  const getClassFileCount = (cls: string) => submissionFiles.filter(f => f.meta.className === cls).length;

  const classSections = selectedClass 
    ? (Array.from(new Set(submissionFiles.filter(f => f.meta.className === selectedClass).map(f => f.meta.sectionName))) as string[]).sort()
    : [];
  const getSectionFileCount = (cls: string, sec: string) => 
    submissionFiles.filter(f => f.meta.className === cls && f.meta.sectionName === sec).length;

  const currentSectionFiles = submissionFiles.filter(
    f => f.meta.className === selectedClass && f.meta.sectionName === selectedSection
  );

  // Get distinct folders for filtering (mainly from materials for the dropdown list)
  const distinctFolders = Array.from(new Set(materiFiles.map(f => f.parentName)));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-neutral-950 flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-neutral-800" />
              File Manager Google Drive
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Hanya menampilkan dan mengelola berkas dalam lingkup folder utama aplikasi yang dibagikan. Aman dan terlokalisasi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all">
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <FileUp className="w-3.5 h-3.5" />
                  Unggah Berkas Baru
                </>
              )}
              <input 
                type="file" 
                disabled={uploading} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
            <button 
              onClick={loadFiles} 
              className="p-2 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
              title="Refresh Berkas"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start gap-2">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 bg-emerald-100 rounded-full p-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-neutral-150 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Berkas</p>
            <p className="text-2xl font-black text-neutral-950">{totalFiles} <span className="text-xs font-medium text-neutral-400">berkas</span></p>
          </div>
          <div className="p-4 bg-white border border-neutral-150 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Penyimpanan Terpakai</p>
            <p className="text-2xl font-black text-neutral-950">{formatSize(totalSizeBytes)}</p>
          </div>
          <div className="p-4 bg-white border border-neutral-150 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Dokumen & PDF</p>
            <p className="text-2xl font-black text-neutral-950">{pdfCount + docCount} <span className="text-xs font-medium text-neutral-400">files</span></p>
          </div>
          <div className="p-4 bg-white border border-neutral-150 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Gambar & Grafik</p>
            <p className="text-2xl font-black text-neutral-950">{imageCount} <span className="text-xs font-medium text-neutral-400">gambar</span></p>
          </div>
        </div>

        {/* Main Section Tabs */}
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => { setMainTab('materi'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 md:px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              mainTab === 'materi'
                ? 'border-neutral-950 text-neutral-950 bg-neutral-50/50'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Materi Pembelajaran
            <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold ml-1.5 border border-neutral-200">
              {materiFiles.length}
            </span>
          </button>
          <button
            onClick={() => { setMainTab('tugas'); setSearchQuery(''); setSelectedClass(null); setSelectedSection(null); }}
            className={`flex items-center gap-2 px-4 md:px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              mainTab === 'tugas'
                ? 'border-neutral-950 text-neutral-950 bg-neutral-50/50'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Tugas Siswa (Folder)
            <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full text-[10px] font-bold ml-1.5 border border-neutral-200">
              {submissionFiles.length}
            </span>
          </button>
        </div>

        {mainTab === 'materi' ? (
          <>
            {/* File Filter & Search Toolbar */}
            <div className="bg-white border border-neutral-150 rounded-xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari nama berkas materi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-xs focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 outline-none"
                  />
                </div>

                {/* Folder Dropdown Filter & View Toggles */}
                <div className="flex items-center gap-3">
                  <select
                    value={activeFolderFilter}
                    onChange={(e) => setActiveFolderFilter(e.target.value)}
                    className="p-2 border border-neutral-200 rounded-lg text-xs outline-none bg-white font-medium text-neutral-700"
                  >
                    <option value="ALL">Semua Folder Sumber</option>
                    {distinctFolders.map((folder, idx) => (
                      <option key={idx} value={folder}>{folder}</option>
                    ))}
                  </select>

                  <div className="border border-neutral-200 rounded-lg p-0.5 flex items-center bg-neutral-50 flex-shrink-0">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-neutral-950' : 'text-neutral-400 hover:text-neutral-600'}`}
                      title="Tampilan Grid"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-neutral-950' : 'text-neutral-400 hover:text-neutral-600'}`}
                      title="Tampilan Daftar"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Type Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3">
                {[
                  { id: 'ALL', label: 'Semua Berkas' },
                  { id: 'PDF', label: 'Portable Docs (PDF)' },
                  { id: 'IMAGE', label: 'Gambar / Visual' },
                  { id: 'DOC', label: 'Dokumen Kantor' },
                  { id: 'OTHER', label: 'Format Lainnya' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTypeFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      activeTypeFilter === tab.id
                        ? 'bg-neutral-950 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-150 text-neutral-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Files Display */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-neutral-400 text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
                <span>Memindai direktori folder Drive aplikasi...</span>
              </div>
            ) : filteredMateriFiles.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-neutral-300 bg-neutral-50 rounded-2xl">
                <HardDrive className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-neutral-700">Tidak ada berkas materi yang ditemukan</p>
                <p className="text-[11px] text-neutral-400 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda.</p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMateriFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="bg-white border border-neutral-150 hover:border-neutral-350 hover:shadow-md rounded-xl p-4 flex flex-col justify-between transition-all group relative"
                  >
                    <div className="space-y-2.5">
                      {/* Icon & Category */}
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-neutral-50 group-hover:bg-neutral-100 rounded-lg border border-neutral-150 transition-colors">
                          <FileIcon mimeType={file.mimeType} className="w-5 h-5 text-neutral-600" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.5">
                          {file.mimeType?.split('/')[1]?.substring(0, 8) || 'FILE'}
                        </span>
                      </div>

                      {/* File Info */}
                      <div className="space-y-1">
                        <p 
                          className="text-xs font-bold text-neutral-900 group-hover:text-neutral-950 truncate" 
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-semibold truncate flex items-center gap-1">
                          <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[120px]">
                            {file.parentName}
                          </span>
                          <span>&bull;</span>
                          <span>{formatSize(file.sizeBytes)}</span>
                        </p>
                      </div>
                    </div>

                    <DriveFileActions
                      onCopyId={() => handleCopyId(file.id)}
                      isCopied={copiedId === file.id}
                      downloadUrl={file.downloadUrl}
                      viewUrl={file.viewUrl}
                      onDelete={() => openDeleteConfirm(file.id, file.name)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white border border-neutral-150 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                        <th className="py-3 px-4">Nama Berkas</th>
                        <th className="py-3 px-4">Folder Sumber</th>
                        <th className="py-3 px-4">Tipe Data</th>
                        <th className="py-3 px-4">Ukuran</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {filteredMateriFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-neutral-50 transition-colors group">
                          <td className="py-3 px-4 font-semibold text-neutral-900 flex items-center gap-3 max-w-sm truncate">
                            <div className="p-1.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-600 flex-shrink-0">
                              <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
                            </div>
                            <span className="truncate" title={file.name}>{file.name}</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-500 font-medium">
                            <span className="bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded text-[10px] text-neutral-600">
                              {file.parentName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400 font-medium uppercase text-[10px] tracking-wider">
                            {file.mimeType?.split('/')[1]?.substring(0, 10) || 'FILE'}
                          </td>
                          <td className="py-3 px-4 text-neutral-500 font-semibold">
                            {formatSize(file.sizeBytes)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DriveFileActions
                              onCopyId={() => handleCopyId(file.id)}
                              isCopied={copiedId === file.id}
                              downloadUrl={file.downloadUrl}
                              viewUrl={file.viewUrl}
                              onDelete={() => openDeleteConfirm(file.id, file.name)}
                              isListView={true}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Tugas Tab - Folder Explorer / Search Results */
          <>
            <div className="bg-white border border-neutral-150 rounded-xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Cari nama berkas, kelas, atau tugas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-xs focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 outline-none"
                  />
                </div>

                {/* View Mode Toggle */}
                {((selectedClass && selectedSection) || searchQuery) && (
                  <div className="border border-neutral-200 rounded-lg p-0.5 flex items-center bg-neutral-50 flex-shrink-0 self-start md:self-auto">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-neutral-950' : 'text-neutral-400 hover:text-neutral-600'}`}
                      title="Tampilan Grid"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-neutral-950' : 'text-neutral-400 hover:text-neutral-600'}`}
                      title="Tampilan Daftar"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-neutral-400 text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
                <span>Memindai direktori folder Drive aplikasi...</span>
              </div>
            ) : searchQuery ? (
              /* Search Mode: Show flattened matching student submission files */
              searchedSubmissionFiles.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-neutral-300 bg-neutral-50 rounded-2xl">
                  <HardDrive className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-700">Tidak ada tugas yang ditemukan</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Coba gunakan kata kunci pencarian lainnya.</p>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchedSubmissionFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="bg-white border border-neutral-150 hover:border-neutral-350 hover:shadow-md rounded-xl p-4 flex flex-col justify-between transition-all group relative"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-neutral-50 group-hover:bg-neutral-100 rounded-lg border border-neutral-150 transition-colors">
                            <FileIcon mimeType={file.mimeType} className="w-5 h-5 text-neutral-600" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-150 rounded px-1.5 py-0.5">
                            Kelas {file.meta.className}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-neutral-900 group-hover:text-neutral-950 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-semibold truncate flex items-center gap-1">
                            <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[120px]">
                              {file.meta.sectionName}
                            </span>
                            <span>&bull;</span>
                            <span>{formatSize(file.sizeBytes)}</span>
                          </p>
                        </div>
                      </div>

                      <DriveFileActions
                        onCopyId={() => handleCopyId(file.id)}
                        isCopied={copiedId === file.id}
                        downloadUrl={file.downloadUrl}
                        viewUrl={file.viewUrl}
                        onDelete={() => openDeleteConfirm(file.id, file.name)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="bg-white border border-neutral-150 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          <th className="py-3 px-4">Nama Berkas</th>
                          <th className="py-3 px-4">Kelas</th>
                          <th className="py-3 px-4">Pertemuan / Tugas</th>
                          <th className="py-3 px-4">Ukuran</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs">
                        {searchedSubmissionFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-neutral-50 transition-colors group">
                            <td className="py-3 px-4 font-semibold text-neutral-900 flex items-center gap-3 max-w-sm truncate">
                              <div className="p-1.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-600 flex-shrink-0">
                                <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
                              </div>
                              <span className="truncate" title={file.name}>{file.name}</span>
                            </td>
                            <td className="py-3 px-4 text-neutral-600 font-bold">
                              Kelas {file.meta.className}
                            </td>
                            <td className="py-3 px-4 text-neutral-500 font-medium truncate max-w-[150px]">
                              {file.meta.sectionName}
                            </td>
                            <td className="py-3 px-4 text-neutral-500 font-semibold">
                              {formatSize(file.sizeBytes)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <DriveFileActions
                                onCopyId={() => handleCopyId(file.id)}
                                isCopied={copiedId === file.id}
                                downloadUrl={file.downloadUrl}
                                viewUrl={file.viewUrl}
                                onDelete={() => openDeleteConfirm(file.id, file.name)}
                                isListView={true}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              /* Folder Tree Navigation mode */
              <div className="space-y-4">
                {/* Navigation Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-150">
                  <button 
                    onClick={() => { setSelectedClass(null); setSelectedSection(null); }} 
                    className="hover:text-neutral-900 font-semibold flex items-center gap-1 text-neutral-600"
                  >
                    <HardDrive className="w-3.5 h-3.5" /> Semua Kelas
                  </button>
                  {selectedClass && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                      <button 
                        onClick={() => { setSelectedSection(null); }} 
                        className="hover:text-neutral-900 font-semibold text-neutral-600"
                      >
                        Kelas {selectedClass}
                      </button>
                    </>
                  )}
                  {selectedSection && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                      <span className="text-neutral-800 font-bold">{selectedSection}</span>
                    </>
                  )}
                </div>

                {/* Level 1: Classes Folders */}
                {selectedClass === null ? (
                  submissionClasses.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-neutral-300 bg-neutral-50 rounded-2xl">
                      <FolderOpen className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-neutral-700">Tidak ada folder kelas tugas</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Siswa belum mengunggah tugas apapun ke Drive.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {submissionClasses.map((cls) => {
                        const count = getClassFileCount(cls);
                        return (
                          <button
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className="bg-white border border-neutral-150 hover:border-neutral-300 hover:shadow-md rounded-xl p-5 flex items-center gap-4 text-left transition-all group animate-fade-in"
                          >
                            <div className="p-3.5 bg-amber-50 text-amber-600 group-hover:bg-amber-100 rounded-xl border border-amber-100 transition-colors">
                              <Folder className="w-6 h-6 fill-amber-500/20" />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="text-xs font-black text-neutral-900 group-hover:text-neutral-950 truncate">
                                Kelas {cls}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-bold">
                                {count} Berkas Pengumpulan
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : selectedSection === null ? (
                  /* Level 2: Section folders within selectedClass */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                        Folder Pertemuan / Tugas - Kelas {selectedClass}
                      </h3>
                      <button
                        onClick={() => setSelectedClass(null)}
                        className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors bg-white px-2.5 py-1 border border-neutral-200 rounded-lg shadow-sm"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                      </button>
                    </div>

                    {classSections.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                        <FolderOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-neutral-500">Tidak ada subfolder tugas untuk kelas ini.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {classSections.map((sec) => {
                          const count = getSectionFileCount(selectedClass, sec);
                          return (
                            <button
                              key={sec}
                              onClick={() => setSelectedSection(sec)}
                              className="bg-white border border-neutral-150 hover:border-neutral-300 hover:shadow-md rounded-xl p-5 flex items-center gap-4 text-left transition-all group"
                            >
                              <div className="p-3.5 bg-neutral-50 text-neutral-600 group-hover:bg-neutral-100 rounded-xl border border-neutral-150 transition-colors">
                                <FolderOpen className="w-6 h-6 text-neutral-500 fill-neutral-200/50" />
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <p className="text-xs font-black text-neutral-900 group-hover:text-neutral-950 truncate" title={sec}>
                                  {sec}
                                </p>
                                <p className="text-[10px] text-neutral-400 font-bold">
                                  {count} Berkas Pengumpulan
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Level 3: Files inside chosen selectedClass & selectedSection */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                        Berkas Pengumpulan - Kelas {selectedClass} &rsaquo; {selectedSection}
                      </h3>
                      <button
                        onClick={() => setSelectedSection(null)}
                        className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors bg-white px-2.5 py-1 border border-neutral-200 rounded-lg shadow-sm"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                      </button>
                    </div>

                    {currentSectionFiles.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                        <File className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-neutral-500">Tidak ada berkas pengumpulan di dalam folder ini.</p>
                      </div>
                    ) : viewMode === 'grid' ? (
                      /* Grid View */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentSectionFiles.map((file) => (
                          <div 
                            key={file.id} 
                            className="bg-white border border-neutral-150 hover:border-neutral-350 hover:shadow-md rounded-xl p-4 flex flex-col justify-between transition-all group relative"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="p-2 bg-neutral-50 group-hover:bg-neutral-100 rounded-lg border border-neutral-150 transition-colors">
                                  <FileIcon mimeType={file.mimeType} className="w-5 h-5 text-neutral-600" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.5">
                                  {file.mimeType?.split('/')[1]?.substring(0, 8) || 'FILE'}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-900 group-hover:text-neutral-950 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-neutral-400 font-semibold truncate flex items-center gap-1">
                                  <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[9px] truncate max-w-[120px]">
                                    {file.parentName}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{formatSize(file.sizeBytes)}</span>
                                </p>
                              </div>
                            </div>

                            <DriveFileActions
                              onCopyId={() => handleCopyId(file.id)}
                              isCopied={copiedId === file.id}
                              downloadUrl={file.downloadUrl}
                              viewUrl={file.viewUrl}
                              onDelete={() => openDeleteConfirm(file.id, file.name)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="bg-white border border-neutral-150 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                                <th className="py-3 px-4">Nama Berkas</th>
                                <th className="py-3 px-4">Folder Sumber</th>
                                <th className="py-3 px-4">Tipe Data</th>
                                <th className="py-3 px-4">Ukuran</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-xs">
                              {currentSectionFiles.map((file) => (
                                <tr key={file.id} className="hover:bg-neutral-50 transition-colors group">
                                  <td className="py-3 px-4 font-semibold text-neutral-900 flex items-center gap-3 max-w-sm truncate">
                                    <div className="p-1.5 bg-neutral-100 border border-neutral-200 rounded text-neutral-600 flex-shrink-0">
                                      <FileIcon mimeType={file.mimeType} className="w-4 h-4" />
                                    </div>
                                    <span className="truncate" title={file.name}>{file.name}</span>
                                  </td>
                                  <td className="py-3 px-4 text-neutral-500 font-medium">
                                    <span className="bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded text-[10px] text-neutral-600">
                                      {file.parentName}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-neutral-400 font-medium uppercase text-[10px] tracking-wider">
                                    {file.mimeType?.split('/')[1]?.substring(0, 10) || 'FILE'}
                                  </td>
                                  <td className="py-3 px-4 text-neutral-500 font-semibold">
                                    {formatSize(file.sizeBytes)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <DriveFileActions
                                      onCopyId={() => handleCopyId(file.id)}
                                      isCopied={copiedId === file.id}
                                      downloadUrl={file.downloadUrl}
                                      viewUrl={file.viewUrl}
                                      onDelete={() => openDeleteConfirm(file.id, file.name)}
                                      isListView={true}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Berkas dari Drive"
        message={`Apakah Anda yakin ingin menghapus berkas "${deleteModal.fileName}" secara permanen dari Google Drive? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDeleteFile}
        onCancel={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
      />
    </AdminLayout>
  );
}
