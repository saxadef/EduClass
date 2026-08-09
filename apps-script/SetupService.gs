// SetupService.gs
// Bootstraps and provisions files, folder structures, and sheet schemas.

// Fallback jika Config belum dimuat oleh Apps Script
if (typeof Config === 'undefined') {
  var Config = {
    PROP_SPREADSHEET_ID: 'EDUCLASS_SPREADSHEET_ID',
    PROP_ROOT_FOLDER_ID: 'EDUCLASS_ROOT_FOLDER_ID',
    PROP_CLASSES_FOLDER_ID: 'EDUCLASS_CLASSES_FOLDER_ID',
    SHEET_ADMINS: 'Admins',
    SHEET_CLASSES: 'Classes',
    SHEET_STUDENTS: 'Students',
    SHEET_SECTIONS: 'Sections',
    SHEET_INSTRUCTIONS: 'Instructions',
    SHEET_SUBMISSIONS: 'Submissions',
    SHEET_SCORES: 'Scores',
    SHEET_SETTINGS: 'Settings'
  };
}

function initializeEduClass() {
  var props = PropertiesService.getScriptProperties();
  var existingSsId = props.getProperty(Config.PROP_SPREADSHEET_ID);
  var existingRootId = props.getProperty(Config.PROP_ROOT_FOLDER_ID);
  var existingClassesId = props.getProperty(Config.PROP_CLASSES_FOLDER_ID);

  if (existingSsId && existingRootId && existingClassesId) {
    return { initialized: true, message: 'EduClass already initialized.' };
  }

  var rootFolder = DriveApp.createFolder('EduClass');
  props.setProperty(Config.PROP_ROOT_FOLDER_ID, rootFolder.getId());

  var classesFolder = rootFolder.createFolder('Classes');
  props.setProperty(Config.PROP_CLASSES_FOLDER_ID, classesFolder.getId());

  var ss = SpreadsheetApp.create('EduClass Database');
  var file = DriveApp.getFileById(ss.getId());
  rootFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  props.setProperty(Config.PROP_SPREADSHEET_ID, ss.getId());

  var requiredSheets = [
    { name: Config.SHEET_ADMINS, headers: ['admin_id', 'username', 'password_hash', 'password_salt', 'display_name', 'status', 'created_at', 'updated_at', 'last_login_at'] },
    { name: Config.SHEET_CLASSES, headers: ['class_id', 'class_name', 'drive_folder_id', 'status', 'created_at', 'updated_at'] },
    { name: Config.SHEET_STUDENTS, headers: ['student_id', 'full_name', 'class_id', 'status', 'created_at', 'updated_at'] },
    { name: Config.SHEET_SECTIONS, headers: ['section_id', 'class_id', 'section_name', 'description', 'drive_folder_id', 'materials_folder_id', 'submissions_folder_id', 'publish_at', 'due_at', 'submission_enabled', 'status', 'created_at', 'updated_at'] },
    { name: Config.SHEET_INSTRUCTIONS, headers: ['instruction_id', 'section_id', 'title', 'content_html', 'attachment_file_id', 'attachment_name', 'attachment_mime_type', 'status', 'created_at', 'updated_at'] },
    { name: Config.SHEET_SUBMISSIONS, headers: ['submission_id', 'timestamp', 'student_name', 'class_id', 'class_name', 'section_id', 'section_name', 'original_filename', 'current_filename', 'mime_type', 'file_size_bytes', 'drive_file_id', 'drive_file_url', 'status'] },
    { name: Config.SHEET_SCORES, headers: ['score_id', 'submission_id', 'student_name', 'class_id', 'class_name', 'section_id', 'section_name', 'score', 'max_score', 'feedback', 'graded_at', 'graded_by'] },
    { name: Config.SHEET_SETTINGS, headers: ['setting_key', 'setting_value', 'updated_at'] }
  ];

  requiredSheets.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name) || ss.insertSheet(schema.name);
    sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  var settingsSheet = ss.getSheetByName(Config.SHEET_SETTINGS);
  settingsSheet.appendRow(['MAX_UPLOAD_SIZE_MB', '10', new Date().toISOString()]);
  settingsSheet.appendRow(['TELEGRAM_BOT_TOKEN', '', new Date().toISOString()]);
  settingsSheet.appendRow(['TELEGRAM_CHAT_ID', '', new Date().toISOString()]);
  settingsSheet.appendRow(['ADMIN_DISPLAY_NAME', 'EduClass Admin', new Date().toISOString()]);
  settingsSheet.appendRow(['PORTAL_HEADER_TEXT', 'Portal Pengumpulan EduClass', new Date().toISOString()]);
  settingsSheet.appendRow(['PORTAL_LOGO_TEXT', 'Edu', new Date().toISOString()]);
  settingsSheet.appendRow(['PORTAL_LOGO_IMAGE_URL', '', new Date().toISOString()]);
  settingsSheet.appendRow(['STUDENT_DESK_TITLE', 'Student Dashboard', new Date().toISOString()]);
  settingsSheet.appendRow(['STUDENT_DESK_DESC', 'Pilih Kelas Anda untuk memeriksa pelajaran, mengunduh panduan belajar atau templat yang dilampirkan, dan mengumpulkan tugas Anda dengan aman.', new Date().toISOString()]);
  settingsSheet.appendRow(['SUBMISSION_FORM_TITLE', 'Formulir Pengumpulan', new Date().toISOString()]);

  var adminsSheet = ss.getSheetByName(Config.SHEET_ADMINS);
  adminsSheet.appendRow(['ADM1', 'admin', 'admin123', 'salt', 'EduClass Admin', 'ACTIVE', new Date().toISOString(), new Date().toISOString(), '']);

  return { initialized: true, spreadsheetId: ss.getId(), message: 'EduClass initialized successfully!' };
}