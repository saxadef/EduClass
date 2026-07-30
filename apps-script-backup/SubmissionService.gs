// SubmissionService.gs
// Processes student assignment submissions with validation, storage, and Telegram logging.

var SubmissionService = {
  getSubmissions: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_SUBMISSIONS);
  },

  submitAssignment: function(payload) {
    // 1. Validate mandatory fields
    if (!payload.fullName || !payload.classId || !payload.sectionId || !payload.fileName || !payload.fileBase64) {
      throw new Error('All submission fields (name, class, section, file) are required.');
    }

    // Resolve Class and Section metadata
    var classes = SpreadsheetService.readAllRows(Config.SHEET_CLASSES);
    var matchedClass = classes.find(function(c) { return c.class_id === payload.classId; });
    if (!matchedClass) throw new Error('Target class not found.');

    var sections = SpreadsheetService.readAllRows(Config.SHEET_SECTIONS);
    var matchedSec = sections.find(function(s) { return s.section_id === payload.sectionId; });
    if (!matchedSec) throw new Error('Target section/assignment not found.');

    // 2. Validate upload size limit from Settings sheet
    var settings = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
    var maxMbSetting = settings.find(function(s) { return s.setting_key === 'MAX_UPLOAD_SIZE_MB'; });
    var maxMb = maxMbSetting ? parseFloat(maxMbSetting.setting_value) : 10;
    
    var fileSizeInBytes = payload.fileSize || 0;
    var maxBytes = maxMb * 1024 * 1024;
    
    if (fileSizeInBytes > maxBytes) {
      throw new Error('File exceeds active upload limit of ' + maxMb + ' MB. Please compress your file and try again.');
    }

    // Validate Extension / Mime Type
    var ext = payload.fileName.split('.').pop().toLowerCase();
    var allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (allowedExtensions.indexOf(ext) === -1) {
      throw new Error('Unsupported file format (. ' + ext + '). Supported formats are PDF, Word, Excel, PowerPoint, and Images.');
    }

    // 3. Save binary payload to Google Drive
    var submissionsFolderId = matchedSec.submissions_folder_id;
    if (!submissionsFolderId) {
      throw new Error('Configuration error: Submissions folder is not mapped in Section spreadsheet.');
    }

    var driveFileId = DriveService.saveFile(
      payload.fileBase64,
      payload.mimeType,
      payload.fileName,
      submissionsFolderId
    );

    // 4. Save metadata record to Spreadsheet
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

    // 5. Attempt Telegram notification (Fail-safe, async-simulated try/catch)
    var formattedTime = new Date(newSubmission.timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    var tgText = '<b>New Submission</b>\n\n' +
                 'Name:\n' + newSubmission.student_name + '\n\n' +
                 'Class:\n' + newSubmission.class_name + '\n\n' +
                 'Assignment:\n' + newSubmission.section_name + '\n\n' +
                 'File:\n' + newSubmission.original_filename + '\n\n' +
                 'Time:\n' + formattedTime;

    TelegramService.sendNotification(tgText);

    return newSubmission;
  },

  renameSubmissionFile: function(submissionId, newFileName) {
    if (!submissionId || !newFileName) throw new Error('Submission ID and new file name are required.');
    
    var subs = this.getSubmissions();
    var match = subs.find(function(s) { return s.submission_id === submissionId; });
    if (!match) throw new Error('Submission record not found.');

    // Rename on Google Drive
    DriveService.renameFile(match.drive_file_id, newFileName);

    // Update in spreadsheet
    SpreadsheetService.updateRow(Config.SHEET_SUBMISSIONS, 'submission_id', submissionId, {
      'current_filename': newFileName
    });

    return true;
  }
};
