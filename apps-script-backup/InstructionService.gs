// InstructionService.gs
// Coordinates Instruction materials.

var InstructionService = {
  getInstructions: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_INSTRUCTIONS);
  },

  createInstruction: function(data) {
    if (!data.section_id || !data.title) {
      throw new Error('Section ID and title are required.');
    }

    var newInst = {
      'instruction_id': Utils.generateId('INS'),
      'section_id': data.section_id,
      'title': data.title,
      'content_html': data.content_html || '',
      'attachment_file_id': data.attachment_file_id || '',
      'attachment_name': data.attachment_name || '',
      'attachment_mime_type': data.attachment_mime_type || '',
      'status': data.status || 'PUBLISHED',
      'created_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    };

    SpreadsheetService.appendRow(Config.SHEET_INSTRUCTIONS, newInst);
    return newInst;
  },

  updateInstruction: function(instructionId, data) {
    if (!instructionId) throw new Error('Instruction ID is required.');

    var updateObj = {
      'title': data.title,
      'content_html': data.content_html,
      'attachment_file_id': data.attachment_file_id,
      'attachment_name': data.attachment_name,
      'attachment_mime_type': data.attachment_mime_type,
      'status': data.status,
      'updated_at': Utils.getTimestamp()
    };

    // Clean undefined keys
    for (var key in updateObj) {
      if (updateObj[key] === undefined) delete updateObj[key];
    }

    SpreadsheetService.updateRow(Config.SHEET_INSTRUCTIONS, 'instruction_id', instructionId, updateObj);
    return updateObj;
  },

  deleteInstruction: function(instructionId) {
    if (!instructionId) throw new Error('Instruction ID is required.');
    SpreadsheetService.deleteRow(Config.SHEET_INSTRUCTIONS, 'instruction_id', instructionId);
    return true;
  }
};
