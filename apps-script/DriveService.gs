// DriveService.gs
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
    
    function traverse(folder, parentFolderName, currentPath) {
      var newPath = currentPath.concat([folder.getName()]);
      var files = folder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        allFiles.push({
          id: file.getId(),
          name: file.getName(),
          mimeType: file.getMimeType(),
          sizeBytes: file.getSize(),
          downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
          viewUrl: file.getUrl(),
          parentName: parentFolderName || folder.getName(),
          path: newPath,
          createdAt: file.getDateCreated().toISOString()
        });
      }
      
      var subfolders = folder.getFolders();
      while (subfolders.hasNext()) {
        var subfolder = subfolders.next();
        traverse(subfolder, subfolder.getName(), newPath);
      }
    }
    
    traverse(rootFolder, rootFolder.getName(), []);
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
      viewUrl: file.getUrl(),
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
};