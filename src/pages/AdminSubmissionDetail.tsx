import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Edit2, CheckCircle, FileText, AlertCircle, Image, Save, Trash2, AlertTriangle, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { ApiClient } from '../lib/api';
import { Submission, Score } from '../types';

export default function AdminSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [scoreData, setScoreData] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Fields
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [score, setScore] = useState<string>('100');
  const [maxScore, setMaxScore] = useState<string>('100');
  const [feedback, setFeedback] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    loadSubmissionData();
  }, [id]);

  async function loadSubmissionData() {
    setLoading(true);
    try {
      const [subs, scrs] = await Promise.all([
        ApiClient.getSubmissions(),
        ApiClient.getScores()
      ]);
      const foundSub = subs.find(s => s.submission_id === id);
      if (!foundSub) {
        setError('Data pengumpulan tugas tidak ditemukan.');
        return;
      }
      setSubmission(foundSub);
      setNewFileName(foundSub.current_filename);

      const foundScore = scrs.find(s => s.submission_id === id);
      if (foundScore) {
        setScoreData(foundScore);
        setScore(foundScore.score.toString());
        setMaxScore(foundScore.max_score.toString());
        setFeedback(foundScore.feedback);
      }
    } catch (err) {
      console.error('Failed to load submission details:', err);
      setError('Terjadi kesalahan saat mengambil detail.');
    } finally {
      setLoading(false);
    }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    try {
      await ApiClient.renameSubmissionFile(submission.submission_id, newFileName);
      setIsRenaming(false);
      // Reload to reflect changes
      loadSubmissionData();
    } catch (err) {
      alert('Gagal mengubah nama file: ' + err);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submission) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteSubmission(submission.submission_id);
      setIsConfirmingDelete(false);
      alert('Pengumpulan tugas berhasil dihapus secara permanen.');
      navigate('/admin/submissions');
    } catch (err) {
      alert('Gagal menghapus tugas: ' + err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;

    setSavingScore(true);
    try {
      await ApiClient.saveScore({
        submissionId: submission.submission_id,
        score: parseFloat(score),
        maxScore: parseFloat(maxScore),
        feedback: feedback
      });
      alert('Nilai dan umpan balik berhasil disimpan!');
      loadSubmissionData();
    } catch (err) {
      alert('Gagal menyimpan nilai: ' + err);
    } finally {
      setSavingScore(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  };

  const isImageFile = (mime: string, ext: string) => {
    return mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isPdfFile = (mime: string, ext: string) => {
    return mime === 'application/pdf' || ext === 'pdf';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-sm text-neutral-500">Memuat kredensial folder pengiriman...</div>
      </AdminLayout>
    );
  }

  if (error || !submission) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 flex items-start gap-2 rounded">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error || 'Gagal memuat konteks pengiriman.'}</span>
        </div>
        <div className="mt-4">
          <Link to="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 underline">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const ext = getFileExtension(submission.current_filename);
  const imagePreviewable = isImageFile(submission.mime_type, ext);
  const pdfPreviewable = isPdfFile(submission.mime_type, ext);

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Navigation back link */}
        <div>
          <Link to="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-950 transition font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Evaluasi & Nilai Tugas
          </Link>
        </div>

        {/* Title */}
        <div className="border-b border-neutral-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Detail Penilaian & Evaluasi</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tinjau tugas rumah {submission.student_name} untuk kelas {submission.class_name} — {submission.section_name}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Student / File info + Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <h3 className="font-semibold text-neutral-950">Informasi File</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs font-bold uppercase text-neutral-400">Nama Siswa</span>
                  <span className="font-bold text-neutral-900 mt-0.5 block">{submission.student_name}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-neutral-400">Kelas & Sesi</span>
                  <span className="font-bold text-neutral-900 mt-0.5 block">{submission.class_name} — {submission.section_name}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-neutral-400">Waktu Unggah</span>
                  <span className="text-neutral-700 mt-0.5 block">{new Date(submission.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-neutral-400">Ukuran File</span>
                  <span className="text-neutral-700 mt-0.5 block">{formatBytes(submission.file_size_bytes)}</span>
                </div>
              </div>

              {/* Original Name Check */}
              <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-xs space-y-1">
                <div>
                  <span className="font-bold text-neutral-500">Nama File Asli:</span>{' '}
                  <span className="font-mono text-neutral-700">{submission.original_filename}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500">Nama File Sekarang:</span>{' '}
                  <span className="font-mono text-neutral-700">{submission.current_filename}</span>
                </div>
              </div>

              {/* Rename File Trigger */}
              {isRenaming ? (
                <form onSubmit={handleRename} className="flex gap-2 items-center pt-2">
                  <input
                    type="text"
                    required
                    className="flex-1 p-2 border border-neutral-300 rounded-lg text-sm"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                  <button type="submit" className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition">
                    Simpan
                  </button>
                  <button type="button" onClick={() => setIsRenaming(false)} className="px-3 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition">
                    Batal
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsRenaming(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 hover:underline font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Ubah Nama File Tugas
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <a
                  href={`https://drive.google.com/open?id=${submission.drive_file_id}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Buka di Google Drive
                </a>
                <a
                  href={`https://drive.google.com/uc?export=download&id=${submission.drive_file_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 hover:bg-neutral-50 rounded-lg text-sm font-semibold text-neutral-800 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh File
                </a>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Evaluasi & Tugas Ini Permanen
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <h3 className="font-semibold text-neutral-950">Pratinjau Dokumen</h3>
              
              {imagePreviewable ? (
                <div className="border border-neutral-150 rounded-lg overflow-hidden bg-neutral-100 flex justify-center p-4">
                  {/* Mock beautiful generic image placeholder since drive preview inside iframe requires oauth */}
                  <div className="text-center space-y-2 py-4">
                    <Image className="w-12 h-12 text-neutral-400 mx-auto" />
                    <p className="text-xs text-neutral-500 font-semibold">{submission.current_filename}</p>
                    <p className="text-[10px] text-neutral-400">Pratinjau gambar langsung di-host secara aman di folder Google Drive Terbatas.</p>
                  </div>
                </div>
              ) : pdfPreviewable ? (
                <div className="border border-neutral-150 rounded-lg overflow-hidden bg-neutral-100 p-4 text-center">
                  <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 font-semibold">{submission.current_filename}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Dokumen PDF dilindungi di bawah izin Terbatas Google Workspace. Klik "Buka di Google Drive" untuk melihat langsung.
                  </p>
                </div>
              ) : (
                <div className="border border-dashed border-neutral-200 rounded-lg p-6 text-center text-neutral-400 text-xs italic">
                  Pratinjau tidak didukung untuk dokumen Office (.{ext}). Unduh file atau Buka di Google Drive untuk memeriksa.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Grade Submission Form */}
          <div className="lg:col-span-5 border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h3 className="font-semibold text-neutral-950 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-neutral-900" />
              Input Nilai & Skor
            </h3>

            {scoreData && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800">
                <span className="font-bold">Dinilai pada:</span>{' '}
                <span>{new Date(scoreData.graded_at).toLocaleDateString('id-ID')}</span>{' '}
                <span className="font-bold ml-2">oleh:</span>{' '}
                <span>{scoreData.graded_by}</span>
              </div>
            )}

            <form onSubmit={handleSaveScore} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="score" className="block text-xs font-bold uppercase text-neutral-500">
                    Nilai Diberikan
                  </label>
                  <input
                    id="score"
                    type="number"
                    required
                    min="0"
                    step="0.1"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="maxScore" className="block text-xs font-bold uppercase text-neutral-500">
                    Nilai Maksimum
                  </label>
                  <input
                    id="maxScore"
                    type="number"
                    required
                    min="1"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-xs font-bold uppercase text-neutral-500">
                  Catatan Umpan Balik
                </label>
                <textarea
                  id="feedback"
                  rows={5}
                  placeholder="Berikan komentar penilaian konstruktif untuk siswa."
                  className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={savingScore}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                {savingScore ? 'Menyimpan nilai...' : 'Simpan Entri Penilaian'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
          <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-neutral-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Konfirmasi Hapus Tugas Siswa
              </h3>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600">
                Apakah Anda yakin ingin menghapus pengumpulan tugas dari <strong className="text-neutral-950">{submission.student_name}</strong>?
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800 space-y-1">
                <p className="font-bold">Peringatan:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Data pengumpulan tugas ini akan dihapus dari Google Sheets secara permanen.</li>
                  <li>Berkas biner tugas juga akan dipindahkan ke Sampah Google Drive.</li>
                  <li>Semua skor dan nilai yang telah diberikan untuk tugas ini akan ikut dihapus.</li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition disabled:opacity-55"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmission}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-55"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
