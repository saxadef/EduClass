// InstructionService.gs
// Mengelola materi pelajaran (instruksi/lesson) di dalam setiap pertemuan, mendukung penyuntingan editor teks kaya (Rich Text Editor HTML), serta pengelolaan file lampiran.

var InstructionService = {
  // === AMBIL DAFTAR SEMUA INSTRUKSI/MATERI ===
  getInstructions: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_INSTRUCTIONS);
  },

  // === BUAT INSTRUKSI/MATERI PELAJARAN BARU ===
  createInstruction: function(data) {
    if (!data.section_id || !data.title) {
      throw new Error('ID Pertemuan dan judul materi wajib diisi.');
    }

    var newInst = {
      'instruction_id': Utils.generateId('INS'),
      'section_id': data.section_id,
      'title': data.title,
      'content_html': data.content_html || '',                  // Konten teks kaya HTML dari editor portal
      'attachment_file_id': data.attachment_file_id || '',      // ID file biner Google Drive jika admin menyertakan lampiran
      'attachment_name': data.attachment_name || '',            // Nama asli file lampiran (misal: "modul-belajar.pdf")
      'attachment_mime_type': data.attachment_mime_type || '',  // Format MIME file lampiran
      'status': data.status || 'PUBLISHED',                     // Status tayang: PUBLISHED atau DRAFT
      'created_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    };

    SpreadsheetService.appendRow(Config.SHEET_INSTRUCTIONS, newInst);
    return newInst;
  },

  // === PERBARUI DATA INSTRUKSI/MATERI ===
  updateInstruction: function(instructionId, data) {
    if (!instructionId) throw new Error('ID Instruksi wajib disertakan.');

    var updateObj = {
      'title': data.title,
      'content_html': data.content_html,
      'attachment_file_id': data.attachment_file_id,
      'attachment_name': data.attachment_name,
      'attachment_mime_type': data.attachment_mime_type,
      'status': data.status,
      'updated_at': Utils.getTimestamp()
    };

    // Bersihkan properti undefined agar tidak menimpa data kosong di spreadsheet
    for (var key in updateObj) {
      if (updateObj[key] === undefined) delete updateObj[key];
    }

    SpreadsheetService.updateRow(Config.SHEET_INSTRUCTIONS, 'instruction_id', instructionId, updateObj);
    return updateObj;
  },

  // === HAPUS MATERI PELAJARAN ===
  deleteInstruction: function(instructionId) {
    if (!instructionId) throw new Error('ID Instruksi wajib disertakan.');
    SpreadsheetService.deleteRow(Config.SHEET_INSTRUCTIONS, 'instruction_id', instructionId);
    return true;
  }
};
