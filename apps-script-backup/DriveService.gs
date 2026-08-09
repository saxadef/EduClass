// DriveService.gs
// Handles all interactions with Google Drive folder directories and document binaries.

var DriveService = {
  // Get Root folder of EduClass
  getRootFolder: function() {
    var id = Config.getRootFolderId();
    if (!id) {
      throw new Error('Root folder is not configured. Run initializeEduClass().');
    }
    return DriveApp.getFolderById(id);
  },

  // Get Classes subfolder
  getClassesFolder: function() {
    var id = Config.getClassesFolderId();
    if (!id) {
      throw new Error('Classes folder is not configured. Run initializeEduClass().');
    }
    return DriveApp.getFolderById(id);
  },

  // Create folder inside parent
  createFolder: function(parentFolder, folderName) {
    var subfolders = parentFolder.getFolders();
    while (subfolders.hasNext()) {
      var folder = subfolders.next();
      if (folder.getName().toLowerCase() === folderName.toLowerCase()) {
        return folder; // Already exists, return to prevent duplicates
      }
    }
    return parentFolder.createFolder(folderName);
  },

  // Create a new Class folder in Google Drive
  createClassFolder: function(className) {
    var classesFolder = this.getClassesFolder();
    var folder = this.createFolder(classesFolder, className);
    return folder.getId();
  },

  // Create Section folder structure: Class/Section/Subfolders
  createSectionFolderStructure: function(className, sectionName) {
    var classesFolder = this.getClassesFolder();
    var classFolder = this.createFolder(classesFolder, className);
    
    // Create Section Folder
    var sectionFolder = this.createFolder(classFolder, sectionName);
    
    // Create Materials & Submissions Subfolders
    var materialsFolder = this.createFolder(sectionFolder, 'Materials');
    var submissionsFolder = this.createFolder(sectionFolder, 'Submissions');

    return {
      sectionFolderId: sectionFolder.getId(),
      materialsFolderId: materialsFolder.getId(),
      submissionsFolderId: submissionsFolder.getId()
    };
  },

  // Decode Base64 and write file to specified folderId
  saveFile: function(base64Data, mimeType, fileName, folderId) {
    var folder = DriveApp.getFolderById(folderId);
    var fileBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(fileBytes, mimeType, fileName);
    var file = folder.createFile(blob);
    return file.getId();
  },

  // Get or create Setting/logo structure and save logo file
  saveLogoFile: function(base64Data, mimeType, fileName) {
    var root = this.getRootFolder();
    var settingFolder = this.createFolder(root, 'Setting');
    var logoFolder = this.createFolder(settingFolder, 'logo');
    
    // Decode Base64 and write file to logo folder
    var fileBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(fileBytes, mimeType, fileName);
    var file = logoFolder.createFile(blob);
    
    // Set view permissions so anyone can view the logo without logging in
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Could not set logo file sharing: ' + e.message);
    }
    
    return file.getId();
  },

  // Rename an existing file on Google Drive
  renameFile: function(fileId, newName) {
    var file = DriveApp.getFileById(fileId);
    file.setName(newName);
    return true;
  }
};
