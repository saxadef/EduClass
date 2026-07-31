// ApiRouter.gs
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
    var publicActions = ['login', 'getPublicSettings', 'getPublicSections', 'getPublicInstructions', 'submitAssignment', 'getClasses', 'getStudents'];

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
      case 'deleteSubmission':
        result = SubmissionService.deleteSubmission(requestData.submissionId);
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
}