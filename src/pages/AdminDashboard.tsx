import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Folder, FileText, UploadCloud, CheckCircle, Clock } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { ApiClient } from '../lib/api';
import { Class, Student, Section, Submission, Score } from '../types';

export default function AdminDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cls, std, sec, sub, scr] = await Promise.all([
          ApiClient.getClasses(),
          ApiClient.getStudents(),
          ApiClient.getSections(),
          ApiClient.getSubmissions(),
          ApiClient.getScores()
        ]);
        setClasses(cls);
        setStudents(std);
        setSections(sec);
        setSubmissions(sub);
        setScores(scr);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalSections = sections.length;
  const totalSubmissions = submissions.length;

  const gradedCount = submissions.filter(sub => 
    scores.some(score => score.submission_id === sub.submission_id)
  ).length;

  const ungradedCount = totalSubmissions - gradedCount;

  // Get 5 most recent submissions
  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Ringkasan Dasbor</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Ringkasan operasi real-time untuk pembelajaran dan tugas EduClass.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Memuat statistik...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="border border-neutral-200/80 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-neutral-300 transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-neutral-950">{totalClasses}</div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Kelas</div>
                </div>
              </div>

              <div className="border border-neutral-200/80 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-neutral-300 transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-neutral-950">{totalStudents}</div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Siswa Aktif</div>
                </div>
              </div>

              <div className="border border-neutral-200/80 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-neutral-300 transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-neutral-950">{totalSections}</div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Pertemuan</div>
                </div>
              </div>

              <div className="border border-neutral-200/80 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-neutral-300 transition-all duration-300 flex items-center gap-4 relative overflow-hidden">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-neutral-950">{totalSubmissions}</div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tugas Dikumpul</div>
                </div>
              </div>
            </div>

            {/* Grading Summary Callout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 border border-neutral-200/80 rounded-2xl p-6 bg-white shadow-sm hover:shadow transition-all duration-300 space-y-5">
                <h3 className="font-extrabold text-neutral-950 text-sm tracking-tight uppercase tracking-wider text-neutral-400">Status Penilaian</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs py-3 px-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-emerald-800">
                    <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Dinilai
                    </span>
                    <span className="font-black text-sm">{gradedCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-3 px-4 bg-amber-50/50 border border-amber-100/50 rounded-xl text-amber-800">
                    <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-amber-600" /> Belum Dinilai
                    </span>
                    <span className="font-black text-sm">{ungradedCount}</span>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 pt-1 leading-relaxed border-t border-neutral-100 pt-4">
                  Untuk menilai atau memberikan umpan balik, klik pengumpulan tugas siswa dari <Link to="/admin/submissions" className="text-neutral-900 font-bold underline hover:text-neutral-950">tab Evaluasi & Nilai Tugas</Link>.
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="lg:col-span-2 border border-neutral-200/80 rounded-2xl p-6 bg-white shadow-sm hover:shadow transition-all duration-300 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="font-extrabold text-neutral-950 text-sm uppercase tracking-wider text-neutral-400">Pengumpulan Tugas Terbaru</h3>
                  <Link to="/admin/submissions" className="text-xs font-bold text-neutral-600 hover:text-neutral-950 underline decoration-2 underline-offset-4">
                    Lihat Semua
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {recentSubmissions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-neutral-500">Belum ada tugas yang dikumpulkan.</div>
                  ) : (
                    <table className="min-w-full text-left text-xs text-neutral-700">
                      <thead>
                        <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Siswa</th>
                          <th className="pb-3">Kelas</th>
                          <th className="pb-3">Pertemuan / Tugas</th>
                          <th className="pb-3">Tanggal</th>
                          <th className="pb-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {recentSubmissions.map((sub) => {
                          const isGraded = scores.some(s => s.submission_id === sub.submission_id);
                          return (
                            <tr key={sub.submission_id} className="hover:bg-neutral-50/50 transition-colors duration-150">
                              <td className="py-3.5 font-bold text-neutral-900">{sub.student_name}</td>
                              <td className="py-3.5 text-neutral-600">{sub.class_name}</td>
                              <td className="py-3.5 text-neutral-600 max-w-[150px] truncate font-medium">{sub.section_name}</td>
                              <td className="py-3.5 text-neutral-400 font-semibold">
                                {new Date(sub.timestamp).toLocaleDateString('id-ID')}
                              </td>
                              <td className="py-3.5 text-right">
                                <Link
                                  to={`/admin/submissions/${sub.submission_id}`}
                                  className={`inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold border rounded-xl transition-all duration-200 ${
                                    isGraded 
                                      ? 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                      : 'bg-neutral-950 text-white border-neutral-950 hover:bg-neutral-800'
                                  }`}
                                >
                                  {isGraded ? 'Lihat Nilai' : 'Beri Nilai'}
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
