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
    return id || '1Wkk3HkgOJMgb37Yl7Nqz-n9Nornwg718fXIN_bQ1DlE';
  },
  getRootFolderId: function() {
    var id = PropertiesService.getScriptProperties().getProperty(this.PROP_ROOT_FOLDER_ID);
    return id || '1eiKhEq13K_eGq1xFIiWOefPnlTUVFzf-';
  },
  getClassesFolderId: function() {
    return PropertiesService.getScriptProperties().getProperty(this.PROP_CLASSES_FOLDER_ID);
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
