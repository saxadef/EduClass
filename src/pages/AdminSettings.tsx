import React, { useEffect, useState, useRef } from 'react';
import { Save, CheckCircle, Copy, AlertTriangle, FileCode, Check, UserPlus, Settings, Code, Shield, Key, Image, UploadCloud, Eye, EyeOff, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { ApiClient } from '../lib/api';
import { Admin } from '../types';
import { GeneralSettingsActions, AdminActions } from '../components/ActionButtons';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    MAX_UPLOAD_SIZE_MB: '10',
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID: '',
    APPS_SCRIPT_URL: '',
    ADMIN_DISPLAY_NAME: 'EduClass Admin',
    PORTAL_HEADER_TEXT: 'Portal Pengumpulan EduClass',
    PORTAL_LOGO_TEXT: 'Edu',
    STUDENT_DESK_TITLE: 'Student Dashboard',
    STUDENT_DESK_DESC: 'Pilih Kelas Anda untuk memeriksa pelajaran, mengunduh panduan belajar atau templat yang dilampirkan, dan mengumpulkan tugas Anda dengan aman.',
    SUBMISSION_FORM_TITLE: 'Formulir Pengumpulan',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Preset size tracking
  const [sizePreset, setSizePreset] = useState<'5' | '10' | '20' | '30' | 'custom'>('10');
  const [customSize, setCustomSize] = useState('10');

  // Copyable Apps Script Code Section
  const [selectedFileCode, setSelectedFileCode] = useState<string>('SetupService.gs');
  const [copied, setCopied] = useState(false);

  const individualFiles: Record<string, string> = {
    'Config.gs': `// Config.gs
// Centrally manages all PropertiesService keys and configuration constraints.

var Config = {
  // PropertiesService keys
  PROP_SPREADSHEET_ID: 'EDUCLASS_SPREADSHEET_ID',
  PROP_ROOT_FOLDER_ID: 'EDUCLASS_ROOT_FOLDER_ID',
  PROP_CLASSES_FOLDER_ID: 'EDUCLASS_CLASSES_FOLDER_ID',
  
  // Sheet Names
  SHEET_ADMINS: 'Admins',
  SHEET_CLASSES: 'Classes',
  SHEET_STUDENTS: 'Students',
  SHEET_SECTIONS: 'Sections',
  SHEET_INSTRUCTIONS: 'Instructions',
  SHEET_SUBMISSIONS: 'Submissions',
  SHEET_SCORES: 'Scores',
  SHEET_SETTINGS: 'Settings',

  // Getters for stored IDs
  getSpreadsheetId: function() {
    var id = PropertiesService.getScriptProperties().getProperty(this.PROP_SPREADSHEET_ID);
    if (!id) {
      try {
        var files = DriveApp.getFilesByName('EduClass Database');
        if (files.hasNext()) {
          var f = files.next();
          id = f.getId();
          this.setSpreadsheetId(id);
        }
      } catch (e) {
        // Fallback silently if DriveApp is not accessible yet
      }
    }
    return id || '';
  },
  getRootFolderId: function() {
    var id = PropertiesService.getScriptProperties().getProperty(this.PROP_ROOT_FOLDER_ID);
    if (!id) {
      try {
        var folders = DriveApp.getFoldersByName('EduClass');
        if (folders.hasNext()) {
          var f = folders.next();
          id = f.getId();
          this.setRootFolderId(id);
        }
      } catch (e) {
        // Fallback silently
      }
    }
    return id || '';
  },
  getClassesFolderId: function() {
    var id = PropertiesService.getScriptProperties().getProperty(this.PROP_CLASSES_FOLDER_ID);
    if (!id) {
      try {
        var rootId = this.getRootFolderId();
        if (rootId) {
          var rootFolder = DriveApp.getFolderById(rootId);
          var folders = rootFolder.getFoldersByName('Classes');
          if (folders.hasNext()) {
            var f = folders.next();
            this.setClassesFolderId(f.getId());
            return f.getId();
          } else {
            var newClassesFolder = rootFolder.createFolder('Classes');
            this.setClassesFolderId(newClassesFolder.getId());
            return newClassesFolder.getId();
          }
        }
      } catch (e) {
        // Fallback silently if DriveApp fails
      }
    }
    return id;
  },

  // Setters
  setSpreadsheetId: function(id) {
    PropertiesService.getScriptProperties().setProperty(this.PROP_SPREADSHEET_ID, id);
  },
  setRootFolderId: function(id) {
    PropertiesService.getScriptProperties().setProperty(this.PROP_ROOT_FOLDER_ID, id);
  },
  setClassesFolderId: function(id) {
    PropertiesService.getScriptProperties().setProperty(this.PROP_CLASSES_FOLDER_ID, id);
  }
};`,

    'Utils.gs': `// Utils.gs
// Shared utility helpers for ID generation, dates, and response envelopes.

var Utils = {
  // Generate random unique IDs
  generateId: function(prefix) {
    var id = Math.random().toString(36).substring(2, 11).toUpperCase();
    return prefix ? prefix + '_' + id : id;
  },

  // Get current timestamp in ISO 8601 string
  getTimestamp: function() {
    return new Date().toISOString();
  },

  // Format response for JSON output
  jsonSuccess: function(data) {
    return { success: true, data: data };
  },

  jsonError: function(message) {
    return { success: false, error: message };
  },

  // Create text response object with CORS headers enabled
  createJsonResponse: function(obj) {
    var output = ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
    return output;
  }
};`,

    'SpreadsheetService.gs': `// SpreadsheetService.gs
// Handles core reading and writing operations on the Google Sheets database.

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
    SHEET_SETTINGS: 'Settings',
    getSpreadsheetId: function() {
      return PropertiesService.getScriptProperties().getProperty(this.PROP_SPREADSHEET_ID);
    },
    getRootFolderId: function() {
      return PropertiesService.getScriptProperties().getProperty(this.PROP_ROOT_FOLDER_ID);
    },
    getClassesFolderId: function() {
      return PropertiesService.getScriptProperties().getProperty(this.PROP_CLASSES_FOLDER_ID);
    }
  };
}

var SpreadsheetService = {
  // Open a specific sheet
  getSheet: function(sheetName) {
    var ssId = Config.getSpreadsheetId();
    if (!ssId) {
      throw new Error('Spreadsheet ID is missing in PropertiesService. Run Setup first.');
    }
    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" not found in Spreadsheet.');
    }
    return sheet;
  },

  // Read all rows of a sheet as objects mapped to headers
  readAllRows: function(sheetName) {
    var sheet = this.getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1) return []; // Only header row exists

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    var results = [];
    for (var i = 0; i < values.length; i++) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = values[i][j];
      }
      rowObj._rowIndex = i + 2;
      results.push(rowObj);
    }
    return results;
  },

  // Append a row object matching headers
  appendRow: function(sheetName, rowObj) {
    var sheet = this.getSheet(sheetName);
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    var newRowValues = [];
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = rowObj[key];
      newRowValues.push(val !== undefined ? val : '');
    }

    sheet.appendRow(newRowValues);
    return true;
  },

  // Update a row object based on primary key
  updateRow: function(sheetName, keyColumnName, keyValue, updateObj) {
    var sheet = this.getSheet(sheetName);
    var rows = this.readAllRows(sheetName);
    var foundRow = rows.find(function(r) {
      return String(r[keyColumnName]) === String(keyValue);
    });

    if (!foundRow) {
      throw new Error('Record with ' + keyColumnName + '=' + keyValue + ' not found in sheet ' + sheetName);
    }

    var rowIndex = foundRow._rowIndex;
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    for (var key in updateObj) {
      var colIndex = headers.indexOf(key) + 1;
      if (colIndex > 0) {
        sheet.getRange(rowIndex, colIndex).setValue(updateObj[key]);
      }
    }
    return true;
  },

  // Delete a row
  deleteRow: function(sheetName, keyColumnName, keyValue) {
    var sheet = this.getSheet(sheetName);
    var rows = this.readAllRows(sheetName);
    var foundRow = rows.find(function(r) {
      return String(r[keyColumnName]) === String(keyValue);
    });

    if (!foundRow) {
      throw new Error('Record with ' + keyColumnName + '=' + keyValue + ' not found in sheet ' + sheetName);
    }

    sheet.deleteRow(foundRow._rowIndex);
    return true;
  }
};`,

    'DriveService.gs': `// DriveService.gs
// Handles all interactions with Google Drive folder directories and document binaries.

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
    SHEET_SETTINGS: 'Settings',
    getSpreadsheetId: function() {
      return PropertiesService.getScriptProperties().getProperty(this.PROP_SPREADSHEET_ID);
    },
    getRootFolderId: function() {
      return PropertiesService.getScriptProperties().getProperty(this.PROP_ROOT_FOLDER_ID);
    },
    getClassesFolderId: function() {
      return PropertiesService.getScriptProperties().getProperty(this.PROP_CLASSES_FOLDER_ID);
    }
  };
}

var DriveService = {
  // === AMBIL FOLDER UTAMA 'EduClass' ===
  getRootFolder: function() {
    var id = Config.getRootFolderId();
    if (id) {
      try {
        var folder = DriveApp.getFolderById(id);
        if (!folder.isTrashed()) {
          return folder;
        }
      } catch (e) {
        // ID is invalid or folder was deleted. Clean it up.
        PropertiesService.getScriptProperties().deleteProperty(Config.PROP_ROOT_FOLDER_ID);
      }
    }
    
    // Try to search for existing non-trashed folder
    try {
      var folders = DriveApp.getFoldersByName('EduClass');
      while (folders.hasNext()) {
        var f = folders.next();
        if (!f.isTrashed()) {
          Config.setRootFolderId(f.getId());
          return f;
        }
      }
    } catch (e) {
      // Ignore search error
    }
    
    // If still not found, try to create it in the root of user's Drive
    try {
      var rootFolder = DriveApp.getRootFolder();
      var f = rootFolder.createFolder('EduClass');
      Config.setRootFolderId(f.getId());
      return f;
    } catch (e) {
      throw new Error('Gagal mengakses atau membuat folder utama "EduClass": ' + e.message);
    }
  },

  // === AMBIL FOLDER 'Classes' ===
  getClassesFolder: function() {
    var id = Config.getClassesFolderId();
    if (id) {
      try {
        var folder = DriveApp.getFolderById(id);
        if (!folder.isTrashed()) {
          return folder;
        }
      } catch (e) {
        // ID is invalid or folder was deleted. Clean it up.
        PropertiesService.getScriptProperties().deleteProperty(Config.PROP_CLASSES_FOLDER_ID);
      }
    }
    
    var rootFolder = this.getRootFolder();
    
    // Search for existing non-trashed folder under root folder
    try {
      var folders = rootFolder.getFoldersByName('Classes');
      while (folders.hasNext()) {
        var f = folders.next();
        if (!f.isTrashed()) {
          Config.setClassesFolderId(f.getId());
          return f;
        }
      }
    } catch (e) {
      // Ignore search error
    }
    
    // If still not found, create it under rootFolder
    try {
      var f = rootFolder.createFolder('Classes');
      Config.setClassesFolderId(f.getId());
      return f;
    } catch (e) {
      throw new Error('Gagal mengakses atau membuat folder "Classes": ' + e.message);
    }
  },

  // === FUNGSI AMBIL ATAU BUAT FOLDER (ANTI-DUPLIKAT) ===
  // Memeriksa apakah folder dengan nama tertentu sudah ada di dalam folder induk.
  // Jika sudah ada, ia akan memakai folder tersebut. Jika belum, ia akan membuatkannya baru secara otomatis.
  createFolder: function(parentFolder, folderName) {
    try {
      var subfolders = parentFolder.getFolders();
      while (subfolders.hasNext()) {
        var folder = subfolders.next();
        if (folder.getName().toLowerCase() === folderName.toLowerCase() && !folder.isTrashed()) {
          return folder; // Folder sudah ada, kembalikan objek folder untuk mencegah duplikasi nama
        }
      }
      return parentFolder.createFolder(folderName);
    } catch (e) {
      throw new Error('Gagal mencari atau membuat folder "' + folderName + '" di dalam "' + parentFolder.getName() + '": ' + e.message);
    }
  },

  // === BUAT FOLDER BARU UNTUK KELAS ===
  createClassFolder: function(className) {
    var classesFolder = this.getClassesFolder();
    var folder = this.createFolder(classesFolder, className);
    return folder.getId();
  },

  // === BUAT STRUKTUR FOLDER UNTUK PERTEMUAN (SECTION) ===
  // Membuat folder pertemuan di dalam folder kelas yang sesuai, lalu membuat folder sub-direktori 'Materials' (materi) dan 'Submissions' (pengumpulan tugas).
  createSectionFolderStructure: function(className, sectionName) {
    var classesFolder = this.getClassesFolder();
    var classFolder = this.createFolder(classesFolder, className);
    
    // 1. Buat folder untuk pertemuan (Section)
    var sectionFolder = this.createFolder(classFolder, sectionName);
    
    // 2. Buat folder materi 'Materials' dan folder pengumpulan siswa 'Submissions' di dalamnya
    var materialsFolder = this.createFolder(sectionFolder, 'Materials');
    var submissionsFolder = this.createFolder(sectionFolder, 'Submissions');

    return {
      sectionFolderId: sectionFolder.getId(),
      materialsFolderId: materialsFolder.getId(),
      submissionsFolderId: submissionsFolder.getId()
    };
  },

  // === DEKODE BASE64 DAN SIMPAN BERKAS DI GOOGLE DRIVE ===
  // Menerima file biner ter-encode Base64 dari browser siswa, melakukan dekode biner, lalu menyimpannya sebagai berkas fisik di Google Drive Anda.
  saveFile: function(base64Data, mimeType, fileName, folderId) {
    try {
      var folder = DriveApp.getFolderById(folderId);
      var fileBytes = Utilities.base64Decode(base64Data);
      
      // Sanitasi mimeType jika kosong atau tidak valid
      var resolvedMimeType = mimeType || 'application/octet-stream';
      if (typeof resolvedMimeType !== 'string' || resolvedMimeType.trim() === '') {
        resolvedMimeType = 'application/octet-stream';
      }
      
      var blob = Utilities.newBlob(fileBytes, resolvedMimeType, fileName);
      var file = folder.createFile(blob);
      
      // Setel izin berbagi menjadi publik agar tugas/materi dapat diakses langsung oleh siswa & admin
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        Logger.log('Gagal mengatur hak akses publik pada file: ' + e.message);
      }
      
      return file.getId();
    } catch (e) {
      throw new Error('Gagal menyimpan file "' + fileName + '": ' + e.message);
    }
  },

  // === FUNGSI UNGGAL LOGO KUSTOM PORTAL ===
  // Membuat struktur folder khusus "Setting/logo" di dalam folder utama Google Drive, lalu mengunggah berkas logo portal.
  // Hak akses file logo diatur otomatis menjadi publik ("ANYONE WITH LINK - VIEW") agar dapat dibaca di halaman utama portal siswa tanpa login ke Google Drive.
  saveLogoFile: function(base64Data, mimeType, fileName) {
    var root = this.getRootFolder();
    var settingFolder = this.createFolder(root, 'Setting');
    var logoFolder = this.createFolder(settingFolder, 'logo');
    
    // Dekode Base64 dan simpan berkas di folder logo
    var fileBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(fileBytes, mimeType, fileName);
    var file = logoFolder.createFile(blob);
    
    // Setel izin berbagi menjadi publik agar logo dapat diakses/dibaca oleh browser siswa langsung
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Gagal mengatur hak akses publik pada logo: ' + e.message);
    }
    
    return file.getId();
  },

  // === GANTI NAMA BERKAS DI GOOGLE DRIVE ===
  // Mengubah nama berkas fisik di Google Drive berdasarkan ID berkas yang ditargetkan.
  renameFile: function(fileId, newName) {
    var file = DriveApp.getFileById(fileId);
    file.setName(newName);
    return true;
  },

  // === DAFTAR SEMUA BERKAS SECARA REKURSIF ===
  listAllFilesRecursively: function() {
    var rootId = Config.getRootFolderId();
    if (!rootId) return [];
    var rootFolder = DriveApp.getFolderById(rootId);
    var allFiles = [];
    
    function traverse(folder, parentFolderName) {
      var files = folder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        allFiles.push({
          id: file.getId(),
          name: file.getName(),
          mimeType: file.getMimeType(),
          sizeBytes: file.getSize(),
          downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
          parentName: parentFolderName || folder.getName(),
          createdAt: file.getDateCreated().toISOString()
        });
      }
      
      var subfolders = folder.getFolders();
      while (subfolders.hasNext()) {
        var subfolder = subfolders.next();
        traverse(subfolder, subfolder.getName());
      }
    }
    
    traverse(rootFolder, rootFolder.getName());
    return allFiles;
  },

  // === UNGGAH BERKAS LANGSUNG KE DRIVE ===
  uploadFileDirectly: function(fileName, mimeType, base64Data, folderName) {
    var rootId = Config.getRootFolderId();
    if (!rootId) {
      throw new Error('Google Drive root folder is not configured.');
    }
    var rootFolder = DriveApp.getFolderById(rootId);
    var targetFolder = rootFolder;
    
    if (folderName && folderName !== 'Main Drive Folder' && folderName !== 'Main Folder' && folderName !== 'EduClass') {
      targetFolder = this.createFolder(rootFolder, folderName);
    }
    
    var fileId = this.saveFile(base64Data, mimeType, fileName, targetFolder.getId());
    var file = DriveApp.getFileById(fileId);
    
    return {
      id: fileId,
      name: file.getName(),
      mimeType: file.getMimeType(),
      sizeBytes: file.getSize(),
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
      parentName: targetFolder.getName(),
      createdAt: file.getDateCreated().toISOString()
    };
  },

  // === HAPUS BERKAS DARI DRIVE ===
  deleteFile: function(fileId) {
    if (!fileId) throw new Error('File ID is required.');
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return true;
  }
};`,

    'TelegramService.gs': `// TelegramService.gs
// Manages outgoing Telegram notification dispatches.

var TelegramService = {
  sendNotification: function(text) {
    try {
      var settings = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
      var botTokenSetting = settings.find(function(s) { return s.setting_key === 'TELEGRAM_BOT_TOKEN'; });
      var chatIdSetting = settings.find(function(s) { return s.setting_key === 'TELEGRAM_CHAT_ID'; });

      var token = botTokenSetting ? botTokenSetting.setting_value : '';
      var chatId = chatIdSetting ? chatIdSetting.setting_value : '';

      if (!token || !chatId) return;

      var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
      var payload = {
        'chat_id': chatId,
        'text': text,
        'parse_mode': 'HTML'
      };

      var options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true
      };

      UrlFetchApp.fetch(url, options);
    } catch (err) {
      Logger.log('Telegram failed silently: ' + err.message);
    }
  }
};`,

    'AuthService.gs': `// AuthService.gs
// Manages authentication validation and active cache session management.

var AuthService = {
  login: function(username, password) {
    var admins = SpreadsheetService.readAllRows(Config.SHEET_ADMINS);
    var matchedAdmin = admins.find(function(a) {
      return a.username === username && a.password_hash === password;
    });

    if (!matchedAdmin) {
      throw new Error('Invalid username or password.');
    }

    var sessionToken = Utils.generateId('SES');
    var cache = CacheService.getScriptCache();
    cache.put(sessionToken, username, 21600);

    SpreadsheetService.updateRow(Config.SHEET_ADMINS, 'admin_id', matchedAdmin.admin_id, {
      'last_login_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    });

    return {
      sessionToken: sessionToken,
      display_name: matchedAdmin.display_name
    };
  },

  validateSession: function(sessionToken) {
    if (!sessionToken) {
      throw new Error('Access Denied: Session token is missing.');
    }
    var cache = CacheService.getScriptCache();
    var cachedUser = cache.get(sessionToken);
    if (!cachedUser) {
      throw new Error('Access Denied: Invalid or expired session.');
    }
    return cachedUser;
  }
};`,

    'ClassService.gs': `// ClassService.gs
// Coordinates CRUD operations on Classes, connecting rows to Google Drive folders.

var ClassService = {
  getClasses: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_CLASSES);
  },

  createClass: function(className) {
    if (!className) throw new Error('Class name is required.');
    var driveFolderId = DriveService.createClassFolder(className);
    
    var newClass = {
      'class_id': Utils.generateId('CLS'),
      'class_name': className,
      'drive_folder_id': driveFolderId,
      'status': 'ACTIVE',
      'created_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    };

    SpreadsheetService.appendRow(Config.SHEET_CLASSES, newClass);
    return newClass;
  },

  updateClass: function(classId, className, driveFolderId) {
    if (!classId) throw new Error('Class ID is required.');
    var updateObj = {
      'class_name': className,
      'drive_folder_id': driveFolderId,
      'updated_at': Utils.getTimestamp()
    };
    SpreadsheetService.updateRow(Config.SHEET_CLASSES, 'class_id', classId, updateObj);
    return updateObj;
  },

  deleteClass: function(classId) {
    if (!classId) throw new Error('Class ID is required.');
    SpreadsheetService.deleteRow(Config.SHEET_CLASSES, 'class_id', classId);
    return true;
  }
};`,

    'StudentService.gs': `// StudentService.gs
// Manages Student profile rosters.

var StudentService = {
  getStudents: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_STUDENTS);
  },

  createStudent: function(fullName, classId) {
    if (!fullName || !classId) throw new Error('Full name and class ID are required.');
    var newStudent = {
      'student_id': Utils.generateId('STD'),
      'full_name': fullName,
      'class_id': classId,
      'status': 'ACTIVE',
      'created_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    };
    SpreadsheetService.appendRow(Config.SHEET_STUDENTS, newStudent);
    return newStudent;
  },

  updateStudent: function(studentId, fullName, classId) {
    if (!studentId) throw new Error('Student ID is required.');
    var updateObj = {
      'full_name': fullName,
      'class_id': classId,
      'updated_at': Utils.getTimestamp()
    };
    SpreadsheetService.updateRow(Config.SHEET_STUDENTS, 'student_id', studentId, updateObj);
    return updateObj;
  },

  deleteStudent: function(studentId) {
    if (!studentId) throw new Error('Student ID is required.');
    SpreadsheetService.deleteRow(Config.SHEET_STUDENTS, 'student_id', studentId);
    return true;
  }
};`,

    'SectionService.gs': `// SectionService.gs
// Manages lesson Assignments/Sections and establishes folder structures in Google Drive.

var SectionService = {
  getSections: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_SECTIONS);
  },

  createSection: function(data) {
    var classes = SpreadsheetService.readAllRows(Config.SHEET_CLASSES);
    var matchedClass = classes.find(function(c) { return c.class_id === data.class_id; });
    if (!matchedClass) throw new Error('Class not found.');

    var driveFolders = DriveService.createSectionFolderStructure(matchedClass.class_name, data.section_name);

    var newSection = {
      'section_id': Utils.generateId('SEC'),
      'class_id': data.class_id,
      'section_name': data.section_name,
      'description': data.description || '',
      'drive_folder_id': driveFolders.sectionFolderId,
      'materials_folder_id': driveFolders.materialsFolderId,
      'submissions_folder_id': driveFolders.submissionsFolderId,
      'publish_at': data.publish_at || '',
      'due_at': data.due_at || '',
      'submission_enabled': data.submission_enabled === true,
      'status': data.status || 'DRAFT',
      'created_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    };

    SpreadsheetService.appendRow(Config.SHEET_SECTIONS, newSection);
    return newSection;
  },

  updateSection: function(sectionId, data) {
    var updateObj = {
      'section_name': data.section_name,
      'description': data.description,
      'publish_at': data.publish_at,
      'due_at': data.due_at,
      'submission_enabled': data.submission_enabled,
      'status': data.status,
      'updated_at': Utils.getTimestamp()
    };
    SpreadsheetService.updateRow(Config.SHEET_SECTIONS, 'section_id', sectionId, updateObj);
    return updateObj;
  },

  deleteSection: function(sectionId) {
    if (!sectionId) throw new Error('Section ID is required.');
    SpreadsheetService.deleteRow(Config.SHEET_SECTIONS, 'section_id', sectionId);
    return true;
  }
};`,

    'SubmissionService.gs': `// SubmissionService.gs
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
  }
};`,

    'ScoreService.gs': `// ScoreService.gs
// Manages Grading, scoring, and feedback operations on student submissions.

var ScoreService = {
  getScores: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_SCORES);
  },

  saveScore: function(payload, gradedByUsername) {
    var subs = SpreadsheetService.readAllRows(Config.SHEET_SUBMISSIONS);
    var sub = subs.find(function(s) { return s.submission_id === payload.submissionId; });

    var scores = this.getScores();
    var existingIdx = scores.findIndex(function(s) { return s.submission_id === payload.submissionId; });

    var newScore = {
      'score_id': existingIdx > -1 ? scores[existingIdx].score_id : Utils.generateId('SC'),
      'submission_id': payload.submissionId,
      'student_name': sub.student_name,
      'class_id': sub.class_id,
      'class_name': sub.class_name,
      'section_id': sub.section_id,
      'section_name': sub.section_name,
      'score': parseFloat(payload.score),
      'max_score': parseFloat(payload.maxScore),
      'feedback': payload.feedback || '',
      'graded_at': Utils.getTimestamp(),
      'graded_by': gradedByUsername || 'Admin'
    };

    if (existingIdx > -1) {
      SpreadsheetService.updateRow(Config.SHEET_SCORES, 'score_id', newScore.score_id, newScore);
    } else {
      SpreadsheetService.appendRow(Config.SHEET_SCORES, newScore);
    }
    return newScore;
  }
};`,

    'SetupService.gs': `// SetupService.gs
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
}`,

    'ApiRouter.gs': `// ApiRouter.gs
// Main API Entrypoint router for handling doGet and doPost calls.

// CORS preflight and basic GET checking
function doGet(e) {
  var responseObj = {
    'status': 'EduClass API Live',
    'timestamp': Utils.getTimestamp(),
    'message': 'Connected to live Google Apps Script. Server is operating properly!'
  };
  return Utils.createJsonResponse(Utils.jsonSuccess(responseObj));
}

// Receives JSON-RPC requests to process public uploads and administrative controls
function doPost(e) {
  try {
    // Parse raw request body
    var requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return Utils.createJsonResponse(Utils.jsonError('Malformed request payload. Content-Type must be plain/text.'));
    }

    var action = requestData.action;
    var sessionToken = requestData.sessionToken;

    if (!action) {
      return Utils.createJsonResponse(Utils.jsonError('Missing parameter: action is required.'));
    }

    // Define public actions (can be called without admin session token)
    var publicActions = ['login', 'getPublicSettings', 'getPublicSections', 'getPublicInstructions', 'submitAssignment', 'getClasses'];

    var isPublic = publicActions.indexOf(action) > -1;
    var adminUser = null;

    if (!isPublic) {
      // Authenticate administrative session
      adminUser = AuthService.validateSession(sessionToken);
    }

    var result;

    switch (action) {
      // === AUTHENTICATION ===
      case 'login':
        result = AuthService.login(requestData.username, requestData.password_hash);
        break;

      case 'getAdmins':
        result = SpreadsheetService.readAllRows(Config.SHEET_ADMINS);
        break;

      case 'createAdmin':
        var adminsList = SpreadsheetService.readAllRows(Config.SHEET_ADMINS);
        var adminExists = adminsList.some(function(a) { return a.username === requestData.username; });
        if (adminExists) {
          throw new Error('Username sudah digunakan oleh administrator lain.');
        }
        var newAdminId = Utils.generateId('ADM');
        var newAdminRecord = {
          'admin_id': newAdminId,
          'username': requestData.username,
          'password_hash': requestData.password_hash,
          'password_salt': 'salt',
          'display_name': requestData.display_name,
          'status': 'ACTIVE',
          'created_at': Utils.getTimestamp(),
          'updated_at': Utils.getTimestamp(),
          'last_login_at': ''
        };
        SpreadsheetService.appendRow(Config.SHEET_ADMINS, newAdminRecord);
        result = newAdminRecord;
        break;

      case 'updateAdmin':
        var updateAdminData = {
          'username': requestData.username,
          'display_name': requestData.display_name,
          'updated_at': Utils.getTimestamp()
        };
        if (requestData.password_hash) {
          updateAdminData['password_hash'] = requestData.password_hash;
        }
        SpreadsheetService.updateRow(Config.SHEET_ADMINS, 'admin_id', requestData.adminId, updateAdminData);
        result = true;
        break;

      case 'deleteAdmin':
        var adminsForDeletionCheck = SpreadsheetService.readAllRows(Config.SHEET_ADMINS);
        if (adminsForDeletionCheck.length <= 1) {
          throw new Error('Tidak dapat menghapus admin terakhir.');
        }
        SpreadsheetService.deleteRow(Config.SHEET_ADMINS, 'admin_id', requestData.adminId);
        result = true;
        break;

      // === SETTINGS ===
      case 'getPublicSettings':
      case 'getSettings':
        var list = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
        var settingsMap = {};
        list.forEach(function(s) {
          settingsMap[s.setting_key] = s.setting_value;
        });
        result = settingsMap;
        break;

      case 'uploadLogo':
        var logoFileId = DriveService.saveLogoFile(requestData.base64Data, requestData.mimeType, requestData.fileName);
        var logoUrl = 'https://drive.google.com/uc?export=view&id=' + logoFileId;
        SpreadsheetService.updateRow(Config.SHEET_SETTINGS, 'setting_key', 'PORTAL_LOGO_IMAGE_URL', {
          'setting_value': logoUrl,
          'updated_at': Utils.getTimestamp()
        });
        result = { url: logoUrl };
        break;

      case 'saveSettings':
        result = ClassService.getClasses(); // Fetch classes just to check db integrity
        var inputSettings = requestData.settings;
        for (var key in inputSettings) {
          SpreadsheetService.updateRow(Config.SHEET_SETTINGS, 'setting_key', key, {
            'setting_value': String(inputSettings[key]),
            'updated_at': Utils.getTimestamp()
          });
        }
        result = true;
        break;

      // === CLASSES ===
      case 'getClasses':
        result = ClassService.getClasses();
        break;
      case 'createClass':
        result = ClassService.createClass(requestData.className);
        break;
      case 'updateClass':
        result = ClassService.updateClass(requestData.classId, requestData.className, requestData.driveFolderId);
        break;
      case 'deleteClass':
        result = ClassService.deleteClass(requestData.classId);
        break;

      // === STUDENTS ===
      case 'getStudents':
        result = StudentService.getStudents();
        break;
      case 'createStudent':
        result = StudentService.createStudent(requestData.fullName, requestData.classId);
        break;
      case 'updateStudent':
        result = StudentService.updateStudent(requestData.studentId, requestData.fullName, requestData.classId);
        break;
      case 'deleteStudent':
        result = StudentService.deleteStudent(requestData.studentId);
        break;

      // === SECTIONS ===
      case 'getPublicSections':
        var allSecs = SectionService.getSections();
        var nowStr = Utils.getTimestamp();
        // Public sections must be: PUBLISHED and (publish_at has passed or is empty)
        result = allSecs.filter(function(sec) {
          var isPublished = sec.status === 'PUBLISHED';
          var isReleased = !sec.publish_at || new Date(sec.publish_at) <= new Date(nowStr);
          return isPublished && isReleased;
        });
        break;
      case 'getSections':
        result = SectionService.getSections();
        break;
      case 'createSection':
        result = SectionService.createSection(requestData.data);
        break;
      case 'updateSection':
        result = SectionService.updateSection(requestData.sectionId, requestData.data);
        break;
      case 'deleteSection':
        result = SectionService.deleteSection(requestData.sectionId);
        break;

      // === INSTRUCTIONS ===
      case 'getPublicInstructions':
        var allInsts = InstructionService.getInstructions();
        result = allInsts.filter(function(inst) {
          return inst.status === 'PUBLISHED';
        });
        break;
      case 'getInstructions':
        result = InstructionService.getInstructions();
        break;
      case 'createInstruction':
        result = InstructionService.createInstruction(requestData.data);
        break;
      case 'updateInstruction':
        result = InstructionService.updateInstruction(requestData.instructionId, requestData.data);
        break;
      case 'deleteInstruction':
        result = InstructionService.deleteInstruction(requestData.instructionId);
        break;

      // === SUBMISSIONS ===
      case 'submitAssignment':
        result = SubmissionService.submitAssignment(requestData);
        break;
      case 'getSubmissions':
        result = SubmissionService.getSubmissions();
        break;
      case 'renameSubmissionFile':
        result = SubmissionService.renameSubmissionFile(requestData.submissionId, requestData.newFileName);
        break;

      // === SCORES ===
      case 'getScores':
        result = ScoreService.getScores();
        break;
      case 'saveScore':
        result = ScoreService.saveScore(requestData, adminUser);
        break;

      // === DRIVE FILE EXPLORER ===
      case 'listDriveFiles':
        result = DriveService.listAllFilesRecursively();
        break;
      case 'uploadDriveFile':
        result = DriveService.uploadFileDirectly(requestData.fileName, requestData.mimeType, requestData.base64Data, requestData.folderName);
        break;
      case 'deleteDriveFile':
        result = DriveService.deleteFile(requestData.fileId);
        break;

      default:
        return Utils.createJsonResponse(Utils.jsonError('Unsupported action routing: ' + action));
    }

    return Utils.createJsonResponse(Utils.jsonSuccess(result));

  } catch (globalErr) {
    Logger.log('Critical Endpoint Error: ' + globalErr.message);
    return Utils.createJsonResponse(Utils.jsonError(globalErr.message || 'An unexpected internal script error occurred.'));
  }
}`
  };

  const appsScriptFiles: Record<string, string> = individualFiles;

  const [activeTab, setActiveTab] = useState<'general' | 'admins' | 'appscript'>('general');

  // Admin list state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<'create' | 'update'>('create');
  const [adminForm, setAdminForm] = useState({
    adminId: '',
    username: '',
    password: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

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

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const raw = await ApiClient.getSettings();
        setSettings(raw);

        // Map preset
        const sz = raw.MAX_UPLOAD_SIZE_MB || '10';
        if (['5', '10', '20', '30'].includes(sz)) {
          setSizePreset(sz as any);
        } else {
          setSizePreset('custom');
          setCustomSize(sz);
        }
      } catch (err) {
        console.error('Failed to pull Settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const loadAdmins = async () => {
    setAdminsLoading(true);
    setAdminError(null);
    try {
      const list = await ApiClient.getAdmins();
      setAdmins(list);
    } catch (err: any) {
      setAdminError('Gagal memuat daftar administrator: ' + err.message);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins();
    }
  }, [activeTab]);

  const handlePresetChange = (preset: typeof sizePreset) => {
    setSizePreset(preset);
    if (preset !== 'custom') {
      setSettings(prev => ({ ...prev, MAX_UPLOAD_SIZE_MB: preset }));
    } else {
      setSettings(prev => ({ ...prev, MAX_UPLOAD_SIZE_MB: customSize }));
    }
  };

  const handleCustomSizeChange = (val: string) => {
    setCustomSize(val);
    setSettings(prev => ({ ...prev, MAX_UPLOAD_SIZE_MB: val }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await ApiClient.saveSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Gagal menyimpan konfigurasi: ' + err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    const code = appsScriptFiles[selectedFileCode];
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Ukuran file logo maksimal adalah 2 MB.');
      return;
    }

    setLogoUploading(true);
    setLogoError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const res = await ApiClient.uploadLogo(file.name, file.type, base64String);
        setSettings(prev => ({ ...prev, PORTAL_LOGO_IMAGE_URL: res.url }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setLogoError('Gagal mengunggah logo: ' + err.message);
      } finally {
        setLogoUploading(false);
      }
    };
    reader.onerror = () => {
      setLogoError('Gagal membaca file logo.');
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, PORTAL_LOGO_IMAGE_URL: '' }));
  };

  // Admin CRUD handlers
  const handleOpenCreateAdmin = () => {
    setAdminForm({ adminId: '', username: '', password: '', displayName: '' });
    setAdminModalMode('create');
    setAdminError(null);
    setAdminSuccess(null);
    setShowPassword(false);
    setShowAdminModal(true);
  };

  const handleOpenEditAdmin = (admin: Admin) => {
    setAdminForm({
      adminId: admin.admin_id,
      username: admin.username,
      password: '', // blank means no password update
      displayName: admin.display_name
    });
    setAdminModalMode('update');
    setAdminError(null);
    setAdminSuccess(null);
    setShowPassword(false);
    setShowAdminModal(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    if (!adminForm.username || !adminForm.displayName) {
      setAdminError('Username dan Nama Tampilan wajib diisi.');
      return;
    }

    if (adminModalMode === 'create' && !adminForm.password) {
      setAdminError('Password wajib diisi untuk administrator baru.');
      return;
    }

    try {
      if (adminModalMode === 'create') {
        await ApiClient.createAdmin(adminForm.username, adminForm.password, adminForm.displayName);
        setAdminSuccess('Berhasil menambahkan administrator baru!');
      } else {
        await ApiClient.updateAdmin(
          adminForm.adminId,
          adminForm.username,
          adminForm.password ? adminForm.password : null,
          adminForm.displayName
        );
        setAdminSuccess('Berhasil memperbarui data administrator!');
      }
      setShowAdminModal(false);
      loadAdmins();
    } catch (err: any) {
      setAdminError(err.message || 'Gagal menyimpan data admin.');
    }
  };

  const handleDeleteAdmin = (adminId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Administrator',
      message: 'Apakah Anda yakin ingin menghapus akun administrator ini secara permanen?',
      onConfirm: async () => {
        try {
          setAdminError(null);
          setAdminSuccess(null);
          await ApiClient.deleteAdmin(adminId);
          setAdminSuccess('Akun administrator berhasil dihapus!');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          loadAdmins();
        } catch (err: any) {
          setAdminError(err.message || 'Gagal menghapus admin.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Pengaturan Portal & Akun</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Kustomisasi halaman portal siswa, batas ukuran unggahan file, bot notifikasi, kelola akun administrator, dan konfigurasi skrip deployment.
          </p>
        </div>

        {/* Tab Navigation Menu */}
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                activeTab === 'general'
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              } flex items-center gap-2`}
            >
              <Settings className="w-4 h-4" />
              General (Umum)
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`pb-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                activeTab === 'admins'
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              } flex items-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              Kelola Admin
            </button>
          </nav>
        </div>

        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-sm text-emerald-800 flex items-center gap-2 rounded shadow-sm">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>Pengaturan EduClass berhasil disimpan! Semua parameter telah diperbarui.</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Memuat konfigurasi...</div>
        ) : (
          <div>
            {/* TAB 1: GENERAL (UMUM) */}
            {activeTab === 'general' && (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-6">
                    {/* Customizable Portal Text Section (Edit Halaman Utama) */}
                    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                      <h3 className="font-semibold text-neutral-950 flex items-center gap-2">
                        <span>Edit Halaman Utama Portal Siswa</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="header_text" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Teks Header / Judul Portal</label>
                          <input
                            id="header_text"
                            type="text"
                            placeholder="contoh: Portal Pengumpulan EduClass"
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                            value={settings.PORTAL_HEADER_TEXT || ''}
                            onChange={(e) => setSettings({ ...settings, PORTAL_HEADER_TEXT: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="desk_title" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Judul Kartu Student Dashboard</label>
                            <input
                              id="desk_title"
                              type="text"
                              placeholder="contoh: Student Dashboard"
                              className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                              value={settings.STUDENT_DESK_TITLE || ''}
                              onChange={(e) => setSettings({ ...settings, STUDENT_DESK_TITLE: e.target.value })}
                            />
                          </div>
                          <div>
                            <label htmlFor="form_title" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Judul Formulir Pengumpulan</label>
                            <input
                              id="form_title"
                              type="text"
                              placeholder="contoh: Formulir Pengumpulan"
                              className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                              value={settings.SUBMISSION_FORM_TITLE || ''}
                              onChange={(e) => setSettings({ ...settings, SUBMISSION_FORM_TITLE: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="desk_desc" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Deskripsi Student Dashboard</label>
                          <textarea
                            id="desk_desc"
                            rows={3}
                            placeholder="Masukkan deskripsi penjelasan untuk student dashboard..."
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm resize-none"
                            value={settings.STUDENT_DESK_DESC || ''}
                            onChange={(e) => setSettings({ ...settings, STUDENT_DESK_DESC: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Customization with Image Upload */}
                    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                      <h3 className="font-semibold text-neutral-950 flex items-center gap-2">
                        <Image className="w-4 h-4 text-neutral-900" />
                        Logo Portal Siswa
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="logo_text" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Logo Teks Portal (Default)</label>
                          <input
                            id="logo_text"
                            type="text"
                            placeholder="contoh: Edu"
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                            value={settings.PORTAL_LOGO_TEXT || ''}
                            onChange={(e) => setSettings({ ...settings, PORTAL_LOGO_TEXT: e.target.value })}
                          />
                          <p className="text-[10px] text-neutral-400 mt-1">
                            Digunakan sebagai fallback jika tidak ada gambar logo yang diunggah.
                          </p>
                        </div>

                        {/* Logo Image Upload with Google Drive Auto-Folder setting/logo */}
                        <div className="border-t border-neutral-100 pt-4 space-y-3">
                          <label className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Logo Gambar Portal (Google Drive)</label>
                          
                          {settings.PORTAL_LOGO_IMAGE_URL ? (
                            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={settings.PORTAL_LOGO_IMAGE_URL}
                                  alt="Portal Logo Preview"
                                  className="h-10 max-w-[140px] object-contain rounded bg-white p-1 border border-neutral-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-xs">
                                  <p className="font-semibold text-neutral-900">Logo Aktif</p>
                                  <p className="text-neutral-500 truncate max-w-[180px] font-mono text-[10px]">{settings.PORTAL_LOGO_IMAGE_URL}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="text-xs text-red-600 hover:text-red-700 font-semibold border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg bg-red-50/50 transition shrink-0"
                              >
                                Hapus Logo
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer transition"
                            >
                              <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                              <p className="text-xs font-semibold text-neutral-700">Klik untuk upload file gambar logo</p>
                              <p className="text-[10px] text-neutral-400 mt-1">Format PNG, JPG, JPEG, SVG, atau GIF (Maks. 2 MB)</p>
                              <p className="text-[9px] text-neutral-400/80 mt-1.5 italic">
                                File otomatis disimpan di dalam folder Google Drive Anda: <strong className="text-neutral-600">Setting/logo</strong>
                              </p>
                            </div>
                          )}

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />

                          {logoUploading && (
                            <div className="text-xs text-neutral-500 flex items-center gap-2 py-1">
                              <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></span>
                              <span>Mengunggah logo dan membuat folder Setting/logo di Google Drive...</span>
                            </div>
                          )}

                          {logoError && (
                            <p className="text-xs text-red-600 font-medium">{logoError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Upload Limit Config */}
                    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                      <h3 className="font-semibold text-neutral-950">Batas Ukuran Unggah File</h3>
                      
                      <div>
                        <span className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Preset</span>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {['5', '10', '20', '30'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handlePresetChange(preset as any)}
                              className={`px-3.5 py-1.5 border rounded-lg text-xs font-semibold transition ${
                                sizePreset === preset
                                  ? 'bg-neutral-950 text-white border-neutral-950'
                                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              {preset} MB
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handlePresetChange('custom')}
                            className={`px-3.5 py-1.5 border rounded-lg text-xs font-semibold transition ${
                              sizePreset === 'custom'
                                ? 'bg-neutral-950 text-white border-neutral-950'
                                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            Ukuran Kustom
                          </button>
                        </div>
                      </div>

                      {sizePreset === 'custom' && (
                        <div className="pt-2 animate-fade-in space-y-2">
                          <label htmlFor="custom_size_limit" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Batas MB Kustom</label>
                          <input
                            id="custom_size_limit"
                            type="number"
                            min="1"
                            className="mt-1 block w-40 p-2 border border-neutral-300 rounded-lg text-sm"
                            value={customSize}
                            onChange={(e) => handleCustomSizeChange(e.target.value)}
                          />
                          {parseInt(customSize, 10) > 30 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 flex gap-1.5 items-start">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span><strong>Peringatan:</strong> Ukuran di atas 30 MB tidak direkomendasikan karena limit payload eksekusi Google Apps Script Web App adalah 30 MB. File besar mungkin akan gagal diunggah atau mengalami timeout.</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Catatan: Batas maksimal yang didukung secara andal oleh Google Apps Script Web App adalah <strong>30 MB</strong>. Pengaturan batas lebih tinggi mungkin menyebabkan kegagalan transmisi payload dari browser ke Google Drive.
                      </p>
                    </div>

                    {/* Telegram Notifications Gateway */}
                    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                      <h3 className="font-semibold text-neutral-950">Bot Notifikasi Telegram</h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="tgtoken" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Token API Bot</label>
                          <input
                            id="tgtoken"
                            type="password"
                            placeholder="contoh: 123456:ABC-DEF1234ghIkl-zyx"
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm font-mono placeholder:font-sans"
                            value={settings.TELEGRAM_BOT_TOKEN}
                            onChange={(e) => setSettings({ ...settings, TELEGRAM_BOT_TOKEN: e.target.value })}
                          />
                        </div>

                        <div>
                          <label htmlFor="tgchat" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">ID Chat / Pengguna Tujuan</label>
                          <input
                            id="tgchat"
                            type="text"
                            placeholder="contoh: 987654321"
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm font-mono placeholder:font-sans"
                            value={settings.TELEGRAM_CHAT_ID}
                            onChange={(e) => setSettings({ ...settings, TELEGRAM_CHAT_ID: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-6 flex justify-end">
                  <GeneralSettingsActions
                    type="submit"
                    saving={saving}
                    label="Simpan Parameter Konfigurasi"
                  />
                </div>
              </form>
            )}

            {/* TAB 2: MANAGE ADMIN (KELOLA ADMIN) */}
            {activeTab === 'admins' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-950">Daftar Administrator</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Kelola kredensial login, hak akses, dan nama administrator sekolah.</p>
                  </div>
                  <button
                    onClick={handleOpenCreateAdmin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Administrator
                  </button>
                </div>

                {adminSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-semibold">
                    {adminSuccess}
                  </div>
                )}

                {adminsLoading ? (
                  <div className="py-12 text-center text-sm text-neutral-400">Memuat data administrator...</div>
                ) : (
                  <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                          <th className="px-6 py-3">Nama Tampilan</th>
                          <th className="px-6 py-3">Username</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-150 text-sm">
                        {admins.map((adm) => (
                          <tr key={adm.admin_id} className="hover:bg-neutral-50/50 transition">
                            <td className="px-6 py-4 font-semibold text-neutral-900">{adm.display_name}</td>
                            <td className="px-6 py-4 font-mono text-xs text-neutral-600">{adm.username}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {adm.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex justify-end">
                              <AdminActions
                                onEdit={() => handleOpenEditAdmin(adm)}
                                onDelete={() => handleDeleteAdmin(adm.admin_id)}
                                disabledDelete={admins.length <= 1}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ADMIN MODAL */}
                {showAdminModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm p-4">
                    <div className="bg-white border border-neutral-200 shadow-xl rounded-xl max-w-md w-full overflow-hidden animate-fade-in">
                      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                        <h3 className="font-bold text-neutral-950 text-base flex items-center gap-2">
                          <Shield className="w-4 h-4 text-neutral-950" />
                          {adminModalMode === 'create' ? 'Tambah Administrator Baru' : 'Edit Data Administrator'}
                        </h3>
                        <button
                          onClick={() => setShowAdminModal(false)}
                          className="text-neutral-400 hover:text-neutral-600 font-semibold text-lg"
                        >
                          &times;
                        </button>
                      </div>

                      <form onSubmit={handleSaveAdmin} className="p-6 space-y-4">
                        {adminError && (
                          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold">
                            {adminError}
                          </div>
                        )}

                        <div>
                          <label htmlFor="adm_name" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Nama Tampilan</label>
                          <input
                            id="adm_name"
                            type="text"
                            required
                            placeholder="contoh: Ibu Riska (Guru Matematika)"
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm"
                            value={adminForm.displayName}
                            onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label htmlFor="adm_user" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">Username Login</label>
                          <input
                            id="adm_user"
                            type="text"
                            required
                            placeholder="contoh: riskamtk"
                            className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm font-mono"
                            value={adminForm.username}
                            onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                          />
                        </div>

                        <div>
                          <label htmlFor="adm_pass" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">
                            Password {adminModalMode === 'update' && '(Kosongkan jika tidak diganti)'}
                          </label>
                          <div className="relative mt-1">
                            <input
                              id="adm_pass"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Ketik password rahasia..."
                              required={adminModalMode === 'create'}
                              className="block w-full p-2.5 border border-neutral-300 rounded-lg text-sm font-mono pr-10"
                              value={adminForm.password}
                              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAdminModal(false)}
                            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Simpan Admin
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SETTING APPSCRIPT */}
            {activeTab === 'appscript' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT: Connections Setup */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                    <h3 className="font-semibold text-neutral-950 flex items-center gap-2">
                      <span className="p-1 bg-neutral-950 text-white rounded text-[10px] font-bold">API</span>
                      URL Koneksi Langsung
                    </h3>
                    
                    <div>
                      <label htmlFor="apiurl" className="block text-xs font-bold uppercase text-neutral-500 tracking-wider">
                        URL Web App Google Apps Script
                      </label>
                      <input
                        id="apiurl"
                        type="url"
                        className="mt-1 block w-full p-2.5 border border-neutral-300 rounded-lg text-sm font-mono placeholder:font-sans"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={settings.APPS_SCRIPT_URL}
                        onChange={(e) => setSettings({ ...settings, APPS_SCRIPT_URL: e.target.value })}
                      />
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Tempel URL Web App Google Apps Script Anda yang telah dideploy di sini untuk beralih dari Mode Demo offline ke sistem Drive/Sheets langsung. Biarkan kosong untuk menggunakan penyimpanan lokal.
                      </p>
                    </div>

                    <GeneralSettingsActions
                      onSave={handleSaveSettings}
                      saving={saving}
                      label="Simpan URL Apps Script"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 flex gap-2 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Catatan Penghapusan Sub-Halaman Ini:</p>
                      <p className="mt-1 leading-relaxed">
                        Halaman "Setting AppScript" ini dirancang khusus untuk mempermudah Anda melakukan pengaturan inisiasi di awal. Ketika website ini sudah siap dipakai oleh guru dan siswa, sub-halaman ini bisa Anda sembunyikan atau hapus dari sidebar kode untuk alasan keamanan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Copyable code files system */}
                <div className="lg:col-span-6 border border-neutral-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                  <div>
                    <h3 className="font-semibold text-neutral-950 flex items-center gap-1.5">
                      <FileCode className="w-5 h-5 text-neutral-900" />
                      File Deploy Google Apps Script
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Salin dan tempel skrip ini ke dalam proyek Google Apps Script Anda di <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-neutral-800">script.google.com</a>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label htmlFor="gs_select" className="sr-only">Pilih File Skrip</label>
                      <select
                        id="gs_select"
                        className="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white"
                        value={selectedFileCode}
                        onChange={(e) => setSelectedFileCode(e.target.value)}
                      >
                        {Object.keys(appsScriptFiles).map(fn => (
                          <option key={fn} value={fn}>{fn}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-neutral-350 hover:bg-neutral-50 text-neutral-900 rounded-lg text-sm font-semibold transition shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Tersalin!' : 'Salin Kode Skrip'}
                    </button>
                  </div>

                  {/* Readonly code viewport */}
                  <div className="border border-neutral-200 rounded-lg bg-neutral-900 p-4 overflow-hidden relative">
                    <pre className="text-[11px] font-mono text-neutral-200 overflow-auto max-h-[340px] whitespace-pre select-text">
                      {appsScriptFiles[selectedFileCode]}
                    </pre>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-700 flex gap-2 items-start">
                    <CheckCircle className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Instruksi Deployment Penting:</p>
                      <ol className="list-decimal pl-4 space-y-1 mt-1">
                        <li>Buka proyek Google Apps Script baru di <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-neutral-850">script.google.com</a>.</li>
                        <li>Buat file skrip baru dengan nama yang sesuai di panel Google Apps Script untuk setiap file di atas (misalnya <code className="bg-neutral-150 px-1 py-0.5 rounded font-mono font-bold text-neutral-800">Config.gs</code>, <code className="bg-neutral-150 px-1 py-0.5 rounded font-mono font-bold text-neutral-800">SetupService.gs</code>, dll.).</li>
                        <li>Pilih masing-masing nama file dari dropdown pilihan di atas, klik tombol <strong className="text-neutral-900">Salin Kode Skrip</strong>, lalu tempelkan ke file yang bersesuaian di proyek Google Apps Script Anda.</li>
                        <li>Simpan proyek skrip tersebut.</li>
                        <li>Jalankan fungsi <code className="bg-neutral-150 px-1 py-0.5 rounded font-mono font-bold text-neutral-800">initializeEduClass()</code> satu kali melalui menu dropdown "Run" di editor Apps Script untuk inisiasi otomatis Spreadsheet & folder Drive Anda.</li>
                        <li>Deploy sebagai <strong className="text-neutral-900">Web App</strong>, atur akses "Execute as" ke <strong className="text-neutral-900">Saya (Me / Akun Pemilik)</strong>, dan "Who has access" ke <strong className="text-neutral-900">Semua Orang (Anyone)</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
