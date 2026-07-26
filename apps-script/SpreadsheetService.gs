// SpreadsheetService.gs
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
};