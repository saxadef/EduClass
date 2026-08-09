// SetupService.gs
// Bootstraps and provisions files, folder structures, and sheet schemas.

function initializeEduClass() {
  var props = PropertiesService.getScriptProperties();
  
  // Pre-seed user's custom Spreadsheet and Folder IDs if no property is currently set
  if (!props.getProperty(Config.PROP_SPREADSHEET_ID)) {
    props.setProperty(Config.PROP_SPREADSHEET_ID, '1Wkk3HkgOJMgb37Yl7Nqz-n9Nornwg718fXIN_bQ1DlE');
  }
  if (!props.getProperty(Config.PROP_ROOT_FOLDER_ID)) {
    props.setProperty(Config.PROP_ROOT_FOLDER_ID, '1eiKhEq13K_eGq1xFIiWOefPnlTUVFzf-');
  }

  // 1. Check if already initialized to preserve idempotency
  var existingSsId = props.getProperty(Config.PROP_SPREADSHEET_ID);
  var existingRootId = props.getProperty(Config.PROP_ROOT_FOLDER_ID);
  var existingClassesId = props.getProperty(Config.PROP_CLASSES_FOLDER_ID);

  if (existingSsId && existingRootId && existingClassesId) {
    return {
      initialized: true,
      spreadsheetId: existingSsId,
      rootFolderId: existingRootId,
      classesFolderId: existingClassesId,
      message: 'EduClass is already fully initialized. Preserving existing database and files.'
    };
  }

  // 2. Locate or Create the EduClass Root Folder in Google Drive
  var rootFolder;
  if (existingRootId) {
    try {
      rootFolder = DriveApp.getFolderById(existingRootId);
    } catch (e) {
      // If the provided ID fails (e.g. permission or deleted), create fallback
      rootFolder = DriveApp.createFolder('EduClass');
      props.setProperty(Config.PROP_ROOT_FOLDER_ID, rootFolder.getId());
    }
  } else {
    rootFolder = DriveApp.createFolder('EduClass');
    props.setProperty(Config.PROP_ROOT_FOLDER_ID, rootFolder.getId());
  }

  // 3. Create the Classes folder inside Root
  var classesFolder;
  if (existingClassesId) {
    try {
      classesFolder = DriveApp.getFolderById(existingClassesId);
    } catch (e) {
      // Fallback lookup or create
      var folders = rootFolder.getFoldersByName('Classes');
      if (folders.hasNext()) {
        classesFolder = folders.next();
      } else {
        classesFolder = rootFolder.createFolder('Classes');
      }
      props.setProperty(Config.PROP_CLASSES_FOLDER_ID, classesFolder.getId());
    }
  } else {
    var folders = rootFolder.getFoldersByName('Classes');
    if (folders.hasNext()) {
      classesFolder = folders.next();
    } else {
      classesFolder = rootFolder.createFolder('Classes');
    }
    props.setProperty(Config.PROP_CLASSES_FOLDER_ID, classesFolder.getId());
  }

  // 4. Open existing or Create "EduClass Database" Google Spreadsheet inside Root folder
  var ss;
  if (existingSsId) {
    try {
      ss = SpreadsheetApp.openById(existingSsId);
    } catch (e) {
      ss = SpreadsheetApp.create('EduClass Database');
      var file = DriveApp.getFileById(ss.getId());
      rootFolder.addFile(file);
      try { DriveApp.getRootFolder().removeFile(file); } catch(ex) {}
      props.setProperty(Config.PROP_SPREADSHEET_ID, ss.getId());
    }
  } else {
    ss = SpreadsheetApp.create('EduClass Database');
    // Move Spreadsheet to EduClass root folder
    var file = DriveApp.getFileById(ss.getId());
    rootFolder.addFile(file);
    try { DriveApp.getRootFolder().removeFile(file); } catch(ex) {}
    props.setProperty(Config.PROP_SPREADSHEET_ID, ss.getId());
  }

  // 5. Build exactly the 8 required sheets
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
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      if (schema.name === Config.SHEET_ADMINS && ss.getSheets().length === 1 && ss.getSheets()[0].getName() === 'Sheet1') {
        sheet = ss.getSheets()[0];
        sheet.setName(schema.name);
      } else {
        sheet = ss.insertSheet(schema.name);
      }
    }
    
    // Set headers
    sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
    sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1); // Freeze header row
  });

  // 6. Write default Settings
  var settingsSheet = ss.getSheetByName(Config.SHEET_SETTINGS);
  var settingsRows = settingsSheet.getDataRange().getValues();
  if (settingsRows.length <= 1) { // Only header
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
  }

  // 7. Write default administrator credentials (admin / admin123)
  var adminsSheet = ss.getSheetByName(Config.SHEET_ADMINS);
  var adminsRows = adminsSheet.getDataRange().getValues();
  if (adminsRows.length <= 1) { // Only header
    adminsSheet.appendRow([
      'ADM1',
      'admin',
      'admin123', // plain password for v0.1 simplification as requested
      'salt',
      'EduClass Admin',
      'ACTIVE',
      new Date().toISOString(),
      new Date().toISOString(),
      ''
    ]);
  }

  return {
    initialized: true,
    spreadsheetId: ss.getId(),
    rootFolderId: rootFolder.getId(),
    classesFolderId: classesFolder.getId(),
    message: 'EduClass was initialized successfully. Google Sheets created, frozen header columns populated, and default settings written!'
  };
}
