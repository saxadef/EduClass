// StudentService.gs
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
};
