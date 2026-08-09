// SpreadsheetService.gs
// Handles core reading and writing operations on the Google Sheets database.

var SpreadsheetService = {
  // Get active spreadsheet object
  getSpreadsheet: function() {
    var id = Config.getSpreadsheetId();
    if (!id) {
      throw new Error('Spreadsheet ID is not configured. Please run initializeEduClass() first.');
    }
    return Spreadsheet;
  },

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
      // Add row index helper (2-indexed to match spreadsheet row index)
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

  // Update a row object based on its primary key matching field Name
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

    // For each field in updateObj, set cell
    for (var key in updateObj) {
      var colIndex = headers.indexOf(key) + 1;
      if (colIndex > 0) {
        sheet.getRange(rowIndex, colIndex).setValue(updateObj[key]);
      }
    }
    return true;
  },

  // Delete a row based on key column match
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
