// ClassService.gs
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
    
    // Temukan folder ID sebelum menghapus baris dari Google Sheet
    try {
      var rows = SpreadsheetService.readAllRows(Config.SHEET_CLASSES);
      var foundRow = rows.find(function(r) {
        return String(r['class_id']) === String(classId);
      });
      if (foundRow && foundRow['drive_folder_id']) {
        var folderId = foundRow['drive_folder_id'];
        var folder = DriveApp.getFolderById(folderId);
        folder.setTrashed(true);
      }
    } catch (e) {
      Logger.log('Gagal menghapus folder kelas dari Google Drive: ' + e.message);
    }

    SpreadsheetService.deleteRow(Config.SHEET_CLASSES, 'class_id', classId);
    return true;
  }
};