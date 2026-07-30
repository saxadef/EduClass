// Config.gs
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
};