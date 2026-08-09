// SectionService.gs
// Manages lesson Assignments/Sections and establishes folder structures in Google Drive.

var SectionService = {
  getSections: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_SECTIONS);
  },

  createSection: function(data) {
    if (!data.class_id || !data.section_name) {
      throw new Error('Class ID and section name are required.');
    }

    // Resolve Class Name
    var classes = SpreadsheetService.readAllRows(Config.SHEET_CLASSES);
    var matchedClass = classes.find(function(c) { return c.class_id === data.class_id; });
    if (!matchedClass) throw new Error('Class not found.');

    // Provision Drive directories
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
    if (!sectionId) throw new Error('Section ID is required.');

    var updateObj = {
      'section_name': data.section_name,
      'description': data.description,
      'publish_at': data.publish_at,
      'due_at': data.due_at,
      'submission_enabled': data.submission_enabled,
      'status': data.status,
      'updated_at': Utils.getTimestamp()
    };

    // Clean undefined keys
    for (var key in updateObj) {
      if (updateObj[key] === undefined) delete updateObj[key];
    }

    SpreadsheetService.updateRow(Config.SHEET_SECTIONS, 'section_id', sectionId, updateObj);
    return updateObj;
  },

  deleteSection: function(sectionId) {
    if (!sectionId) throw new Error('Section ID is required.');
    SpreadsheetService.deleteRow(Config.SHEET_SECTIONS, 'section_id', sectionId);
    return true;
  }
};
