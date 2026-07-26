import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, CheckCircle, Clock, Trash2, AlertTriangle, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { ApiClient } from '../lib/api';
import { Class, Section, Submission, Score } from '../types';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchName, setSearchName] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    submissionId: string;
    studentName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    submissionId: '',
    studentName: '',
    isDeleting: false
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [subs, scr, cls, sec] = await Promise.all([
          ApiClient.getSubmissions(),
          ApiClient.getScores(),
          ApiClient.getClasses(),
          ApiClient.getSections()
        ]);
        setSubmissions(subs);
        setScores(scr);
        setClasses(cls);
        setSections(sec);
      } catch (err) {
        console.error('Failed to load submissions list:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteSubmission = async () => {
    if (!deleteModal.submissionId) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await ApiClient.deleteSubmission(deleteModal.submissionId);
      setSubmissions(prev => prev.filter(s => s.submission_id !== deleteModal.submissionId));
      setDeleteModal({ isOpen: false, submissionId: '', studentName: '', isDeleting: false });
    } catch (err) {
      alert('Gagal menghapus pengiriman: ' + err);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Filtering logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesName = sub.student_name.toLowerCase().includes(searchName.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || sub.class_id === selectedClass;
    const matchesSection = selectedSection === 'ALL' || sub.section_id === selectedSection;
    return matchesName && matchesClass && matchesSection;
  });

  const getScoreForSubmission = (subId: string) => {
    const found = scores.find(s => s.submission_id === subId);
    return found ? `${found.score} / ${found.max_score}` : 'Tertunda';
  };

  const getScoreStatusBadge = (subId: string) => {
    const found = scores.find(s => s.submission_id === subId);
    if (found) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">
          <CheckCircle className="w-3 h-3" /> Dinilai
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded">
        <Clock className="w-3 h-3" /> Belum Dinilai
      </span>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Evaluasi & Nilai Tugas</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Tinjau file yang diunggah, buka file drive pribadi, ubah nama, dan beri nilai tugas rumah siswa.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="border border-neutral-200 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Cari siswa berdasarkan nama..."
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                className="p-2 border border-neutral-300 rounded-lg text-sm bg-white"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                className="p-2 border border-neutral-300 rounded-lg text-sm bg-white"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="ALL">Semua Pertemuan</option>
                {sections.map(s => (
                  <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Grid Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Memuat data evaluasi & nilai tugas...</div>
        ) : (
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              {filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center text-sm text-neutral-500">Tidak ada pengumpulan tugas yang sesuai dengan kriteria filter saat ini.</div>
              ) : (
                <table className="min-w-full text-left text-sm text-neutral-700">
                  <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="py-3.5 px-5">Waktu Pengumpulan</th>
                      <th className="py-3.5 px-5">Nama Siswa</th>
                      <th className="py-3.5 px-5">Kelas</th>
                      <th className="py-3.5 px-5">Pertemuan / Tugas</th>
                      <th className="py-3.5 px-5">File</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Nilai</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.submission_id} className="hover:bg-neutral-50/50 transition">
                        <td className="py-4 px-5 text-xs text-neutral-500">
                          {new Date(sub.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-5 font-bold text-neutral-900">{sub.student_name}</td>
                        <td className="py-4 px-5">{sub.class_name}</td>
                        <td className="py-4 px-5 font-medium">{sub.section_name}</td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col max-w-[200px]">
                            <span className="font-semibold text-neutral-800 truncate" title={sub.current_filename}>
                              {sub.current_filename}
                            </span>
                            <span className="text-[10px] text-neutral-400">{formatBytes(sub.file_size_bytes)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">{getScoreStatusBadge(sub.submission_id)}</td>
                        <td className="py-4 px-5 font-bold text-neutral-900">{getScoreForSubmission(sub.submission_id)}</td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/admin/submissions/${sub.submission_id}`}
                              className="inline-flex items-center gap-1 font-semibold text-neutral-950 hover:text-neutral-700 hover:underline text-xs"
                            >
                              Buka Detail
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => setDeleteModal({
                                isOpen: true,
                                submissionId: sub.submission_id,
                                studentName: sub.student_name,
                                isDeleting: false
                              })}
                              className="p-1 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded transition-colors"
                              title="Hapus Pengiriman"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Table Footer / Summary */}
            <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
              Menampilkan {filteredSubmissions.length} dari {submissions.length} total pengumpulan tugas
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
            <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Konfirmasi Hapus Tugas Siswa
                </h3>
                <button
                  onClick={() => setDeleteModal({ isOpen: false, submissionId: '', studentName: '', isDeleting: false })}
                  className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-neutral-600">
                  Apakah Anda yakin ingin menghapus pengumpulan tugas dari <strong className="text-neutral-950">{deleteModal.studentName}</strong>?
                </p>
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800 space-y-1">
                  <p className="font-bold">Peringatan:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Data pengumpulan tugas ini akan dihapus dari Google Sheets.</li>
                    <li>Berkas biner tugas juga akan dipindahkan ke Sampah Google Drive.</li>
                    <li>Semua skor dan nilai yang telah diberikan untuk tugas ini akan ikut dihapus.</li>
                  </ul>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, submissionId: '', studentName: '', isDeleting: false })}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-100 transition disabled:opacity-55"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmission}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-55"
                >
                  {deleteModal.isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
