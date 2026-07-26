import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, FolderPlus, UserCheck, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { ApiClient } from '../lib/api';
import { Class, Student } from '../types';
import { StudentActions, ClassActions } from '../components/ActionButtons';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminStudentData() {
  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
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

  // Search & Filter
  const [searchName, setSearchName] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Modal / forms state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    class_id: ''
  });

  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classForm, setClassForm] = useState({
    class_name: '',
    drive_folder_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cls, std] = await Promise.all([
        ApiClient.getClasses(),
        ApiClient.getStudents()
      ]);
      setClasses(cls);
      setStudents(std);
      if (cls.length > 0 && !studentForm.class_id) {
        setStudentForm(prev => ({ ...prev, class_id: cls[0].class_id }));
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Student CRUD handlers
  const handleOpenCreateStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      full_name: '',
      class_id: classes[0]?.class_id || ''
    });
    setShowStudentForm(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      full_name: student.full_name,
      class_id: student.class_id
    });
    setShowStudentForm(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!studentForm.class_id) {
      setErrorMessage('Silakan buat Kelas terlebih dahulu sebelum menambahkan siswa.');
      return;
    }
    try {
      if (editingStudent) {
        await ApiClient.updateStudent(editingStudent.student_id, studentForm.full_name, studentForm.class_id);
        setSuccessMessage(`Berhasil memperbarui data siswa "${studentForm.full_name}".`);
      } else {
        await ApiClient.createStudent(studentForm.full_name, studentForm.class_id);
        setSuccessMessage(`Berhasil menambahkan siswa baru "${studentForm.full_name}".`);
      }
      setShowStudentForm(false);
      loadData();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan siswa: ' + (err.message || err));
    }
  };

  const handleDeleteStudent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Siswa',
      message: 'Apakah Anda yakin ingin menghapus catatan data siswa ini secara permanen?',
      onConfirm: async () => {
        try {
          setErrorMessage('');
          setSuccessMessage('');
          await ApiClient.deleteStudent(id);
          setSuccessMessage('Berhasil menghapus data siswa.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setErrorMessage('Gagal menghapus siswa: ' + (err.message || err));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Class CRUD handlers
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassForm({
      class_name: '',
      drive_folder_id: ''
    });
    setShowClassForm(true);
  };

  const handleOpenEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassForm({
      class_name: cls.class_name,
      drive_folder_id: cls.drive_folder_id
    });
    setShowClassForm(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (editingClass) {
        await ApiClient.updateClass(editingClass.class_id, classForm.class_name, classForm.drive_folder_id);
        setSuccessMessage(`Berhasil memperbarui kelas "${classForm.class_name}".`);
      } else {
        await ApiClient.createClass(classForm.class_name);
        setSuccessMessage(`Berhasil membuat kelas baru "${classForm.class_name}".`);
      }
      setShowClassForm(false);
      loadData();
    } catch (err: any) {
      setErrorMessage('Gagal menyimpan kelas: ' + (err.message || err));
    }
  };

  const handleDeleteClass = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kelas',
      message: 'Apakah Anda yakin ingin menghapus Kelas ini? Pengiriman tugas dari siswa kelas ini mungkin tetap ada tetapi referensi kelas dapat terpisah.',
      onConfirm: async () => {
        try {
          setErrorMessage('');
          setSuccessMessage('');
          await ApiClient.deleteClass(id);
          setSuccessMessage('Berhasil menghapus kelas.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setErrorMessage('Gagal menghapus kelas: ' + (err.message || err));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? cls.class_name : 'Tidak Diketahui';
  };

  // Filter lists
  const filteredStudents = students.filter(s => {
    const matchesName = s.full_name.toLowerCase().includes(searchName.toLowerCase());
    const matchesClass = selectedClass === 'ALL' || s.class_id === selectedClass;
    return matchesName && matchesClass;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Data Siswa</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Kelola daftar hadir kelas dan profil siswa yang aktif secara resmi.
          </p>
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

        {/* Tab Headers */}
        <div className="border-b border-neutral-200 flex gap-4">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 text-sm font-semibold border-b-2 transition ${
              activeTab === 'students'
                ? 'border-neutral-950 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Tab Siswa ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`py-2 px-1 text-sm font-semibold border-b-2 transition ${
              activeTab === 'classes'
                ? 'border-neutral-950 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Tab Kelas ({classes.length})
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Memuat profil siswa...</div>
        ) : (
          <div>
            {/* ==================== STUDENTS PANEL ==================== */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Student Search Filters */}
                  <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari siswa..."
                        className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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
                  </div>

                  <button
                    onClick={handleOpenCreateStudent}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Siswa
                  </button>
                </div>

                {/* Students List Grid/Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm text-neutral-700">
                    <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-5">ID Siswa</th>
                        <th className="py-3 px-5">Nama Lengkap</th>
                        <th className="py-3 px-5">Kelas</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-neutral-400">
                            Tidak ada profil siswa yang cocok atau telah diunggah.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((std) => (
                          <tr key={std.student_id}>
                            <td className="py-3.5 px-5 font-mono text-xs text-neutral-500">{std.student_id}</td>
                            <td className="py-3.5 px-5 font-bold text-neutral-900">{std.full_name}</td>
                            <td className="py-3.5 px-5">{getClassName(std.class_id)}</td>
                            <td className="py-3.5 px-5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <UserCheck className="w-3 h-3" /> {std.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right flex justify-end">
                              <StudentActions
                                onEdit={() => handleOpenEditStudent(std)}
                                onDelete={() => handleDeleteStudent(std.student_id)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== CLASSES PANEL ==================== */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleOpenCreateClass}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Kelas
                  </button>
                </div>

                {/* Classes List */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm text-neutral-700">
                    <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-5">ID Kelas</th>
                        <th className="py-3 px-5">Nama Kelas</th>
                        <th className="py-3 px-5">ID Folder Google Drive</th>
                        <th className="py-3 px-5 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {classes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-neutral-400">
                            Belum ada kelas yang dikonfigurasi. Klik "Buat Kelas" untuk menambahkannya.
                          </td>
                        </tr>
                      ) : (
                        classes.map((cls) => (
                          <tr key={cls.class_id}>
                            <td className="py-3.5 px-5 font-mono text-xs text-neutral-500">{cls.class_id}</td>
                            <td className="py-3.5 px-5 font-bold text-neutral-900">{cls.class_name}</td>
                            <td className="py-3.5 px-5 font-mono text-xs text-neutral-400 max-w-[200px] truncate" title={cls.drive_folder_id}>
                              {cls.drive_folder_id}
                            </td>
                            <td className="py-3.5 px-5 text-right flex justify-end">
                              <ClassActions
                                onEdit={() => handleOpenEditClass(cls)}
                                onDelete={() => handleDeleteClass(cls.class_id)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== STUDENT FORM MODAL ==================== */}
        {showStudentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
            <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-950">{editingStudent ? 'Ubah Siswa' : 'Tambah Siswa'}</h3>
                <button onClick={() => setShowStudentForm(false)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                <div>
                  <label htmlFor="fullname" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Nama Lengkap</label>
                  <input
                    id="fullname"
                    type="text"
                    required
                    placeholder="contoh: Setiawan"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="classDropdown" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Penempatan Daftar Kelas</label>
                  <select
                    id="classDropdown"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    value={studentForm.class_id}
                    onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                  >
                    {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowStudentForm(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    Simpan Siswa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== CLASS FORM MODAL ==================== */}
        {showClassForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4">
            <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-950">{editingClass ? 'Ubah Detail Kelas' : 'Buat Kelas'}</h3>
                <button onClick={() => setShowClassForm(false)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="p-6 space-y-4">
                <div>
                  <label htmlFor="classname" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Nama Kelas</label>
                  <input
                    id="classname"
                    type="text"
                    required
                    placeholder="contoh: 8A"
                    className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm"
                    value={classForm.class_name}
                    onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                  />
                </div>

                {editingClass && (
                  <div>
                    <label htmlFor="folderid" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">ID Folder Google Drive</label>
                    <input
                      id="folderid"
                      type="text"
                      className="mt-1 block w-full p-2 border border-neutral-300 rounded-lg text-sm font-mono text-xs"
                      value={classForm.drive_folder_id}
                      onChange={(e) => setClassForm({ ...classForm, drive_folder_id: e.target.value })}
                    />
                  </div>
                )}

                <div className="bg-neutral-50 border border-neutral-150 rounded-lg p-3 text-xs text-neutral-500 flex gap-2 items-start">
                  <FolderPlus className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    {editingClass ? (
                      <p>Dalam mode Terhubung, memodifikasi bagian ini akan menghubungkan tabel database kelas ke folder fisik yang berbeda di Google Drive.</p>
                    ) : (
                      <p>Membuat Kelas ini akan secara otomatis memerintahkan Apps Script untuk membuat folder khusus di Google Drive di bawah <code className="bg-neutral-150 px-1 rounded">EduClass/Classes/</code>.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowClassForm(false)}
                    className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    {editingClass ? 'Simpan Perubahan' : 'Buat Folder Kelas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

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
