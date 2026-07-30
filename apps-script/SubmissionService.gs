// SubmissionService.gs
// Memproses pengiriman (submission) tugas dari siswa, memvalidasi ukuran file batas maksimal, ekstensi dokumen, menyimpan biner file ke Google Drive, dan mengirim notifikasi telegram otomatis.

var SubmissionService = {
  // === AMBIL DAFTAR SEMUA PENGIRIMAN TUGAS ===
  getSubmissions: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_SUBMISSIONS);
  },

  // === PROSES PENGIRIMAN TUGAS SISWA (SUBMIT ASSIGNMENT) ===
  // Fungsi utama saat siswa mengklik tombol "Kirim Tugas" di portal mereka.
  submitAssignment: function(payload) {
    // 1. Validasi kolom wajib pengiriman tugas
    if (!payload.fullName || !payload.classId || !payload.sectionId || !payload.fileName || !payload.fileBase64) {
      throw new Error('Semua formulir pengumpulan wajib diisi.');
    }

    // Ambil data metadata kelas siswa untuk validasi
    var classes = SpreadsheetService.readAllRows(Config.SHEET_CLASSES);
    var matchedClass = classes.find(function(c) { return c.class_id === payload.classId; });
    if (!matchedClass) throw new Error('Kelas tujuan siswa tidak ditemukan.');

    // Ambil metadata pertemuan / tugas
    var sections = SpreadsheetService.readAllRows(Config.SHEET_SECTIONS);
    var matchedSec = sections.find(function(s) { return s.section_id === payload.sectionId; });
    if (!matchedSec) throw new Error('Data pertemuan / tugas tujuan tidak ditemukan.');

    // Check if deadline has passed
    if (matchedSec.due_at) {
      var dueDate = new Date(matchedSec.due_at);
      var currentDate = new Date();
      if (currentDate > dueDate) {
        throw new Error('Maaf, batas waktu pengumpulan untuk tugas ini telah terlewati (' + new Date(matchedSec.due_at).toLocaleString('id-ID') + '). Anda tidak dapat mengumpulkan tugas lagi.');
      }
    }

    // 2. VALIDASI BATAS MAKSIMAL UKURAN BERKAS (FILE SIZE LIMIT)
    var settings = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
    var maxMbSetting = settings.find(function(s) { return s.setting_key === 'MAX_UPLOAD_SIZE_MB'; });
    var maxMb = maxMbSetting ? parseFloat(maxMbSetting.setting_value) : 10;
    
    var fileSizeInBytes = payload.fileSize || 0;
    var maxBytes = maxMb * 1024 * 1024;
    
    if (fileSizeInBytes > maxBytes) {
      throw new Error('Ukuran berkas melebihi batas pengumpulan yang diizinkan sebesar ' + maxMb + ' MB. Silakan kompres berkas Anda.');
    }

    // 3. VALIDASI EKSTENSI BERKAS YANG DIIZINKAN
    var ext = payload.fileName.split('.').pop().toLowerCase();
    var allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (allowedExtensions.indexOf(ext) === -1) {
      throw new Error('Format berkas (. ' + ext + ') tidak didukung.');
    }

    // 4. SIMPAN BERKAS KE GOOGLE DRIVE
    var submissionsFolderId = matchedSec.submissions_folder_id;
    if (!submissionsFolderId) {
      throw new Error('Kesalahan Konfigurasi: Folder Google Drive untuk menampung tugas belum dibuat.');
    }

    var driveFileId = DriveService.saveFile(
      payload.fileBase64,
      payload.mimeType,
      payload.fileName,
      submissionsFolderId
    );

    // 5. SIMPAN RECORD METADATA KE SPREADSHEET
    var newSubmission = {
      'submission_id': Utils.generateId('SUB'),
      'timestamp': Utils.getTimestamp(),
      'student_name': payload.fullName,
      'class_id': payload.classId,
      'class_name': matchedClass.class_name,
      'section_id': payload.sectionId,
      'section_name': matchedSec.section_name,
      'original_filename': payload.fileName,
      'current_filename': payload.fileName,
      'mime_type': payload.mimeType,
      'file_size_bytes': fileSizeInBytes,
      'drive_file_id': driveFileId,
      'drive_file_url': 'https://drive.google.com/open?id=' + driveFileId,
      'status': 'SUBMITTED'
    };

    SpreadsheetService.appendRow(Config.SHEET_SUBMISSIONS, newSubmission);

    // 6. KIRIM NOTIFIKASI TELEGRAM OTOMATIS (FAIL-SAFE)
    var formattedTime = new Date(newSubmission.timestamp).toLocaleString('id-ID');
    var tgText = '<b>Tugas Siswa Baru Dikirim</b>\\n\\n' +
                 'Siswa:\\n' + newSubmission.student_name + '\\n\\n' +
                 'Kelas:\\n' + newSubmission.class_name + '\\n\\n' +
                 'Pertemuan/Tugas:\\n' + newSubmission.section_name + '\\n\\n' +
                 'Nama Berkas:\\n' + newSubmission.original_filename + '\\n\\n' +
                 'Waktu:\\n' + formattedTime;

    TelegramService.sendNotification(tgText);

    return newSubmission;
  },

  renameSubmissionFile: function(submissionId, newFileName) {
    if (!submissionId || !newFileName) throw new Error('ID Pengumpulan dan nama berkas baru wajib disertakan.');
    var subs = this.getSubmissions();
    var match = subs.find(function(s) { return s.submission_id === submissionId; });
    if (!match) throw new Error('Data pengumpulan tugas tidak ditemukan.');
    DriveService.renameFile(match.drive_file_id, newFileName);
    SpreadsheetService.updateRow(Config.SHEET_SUBMISSIONS, 'submission_id', submissionId, {
      'current_filename': newFileName
    });
    return true;
  },

  deleteSubmission: function(submissionId) {
    if (!submissionId) throw new Error('ID Pengumpulan wajib disertakan.');
    var subs = this.getSubmissions();
    var match = subs.find(function(s) { return s.submission_id === submissionId; });
    if (!match) throw new Error('Data pengumpulan tugas tidak ditemukan.');

    // 1. Coba hapus berkas dari Google Drive jika ada
    if (match.drive_file_id) {
      try {
        var file = DriveApp.getFileById(match.drive_file_id);
        file.setTrashed(true);
      } catch (e) {
        Logger.log('Berkas tidak ditemukan atau sudah dihapus di Drive: ' + e.message);
      }
    }

    // 2. Hapus nilai yang bersangkutan jika ada
    try {
      SpreadsheetService.deleteRow(Config.SHEET_SCORES, 'submission_id', submissionId);
    } catch (e) {
      Logger.log('Gagal menghapus nilai pengumpulan: ' + e.message);
    }

    // 3. Hapus data pengumpulan dari Google Sheet
    SpreadsheetService.deleteRow(Config.SHEET_SUBMISSIONS, 'submission_id', submissionId);
    return true;
  }
};