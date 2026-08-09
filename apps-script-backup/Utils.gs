// Utils.gs
// Shared utility helpers for ID generation, dates, and response envelopes.

var Utils = {
  // Generate random unique IDs
  generateId: function(prefix) {
    var id = Math.random().toString(36).substring(2, 11).toUpperCase();
    return prefix ? prefix + '_' + id : id;
  },

  // Get current timestamp in ISO 8601 string
  getTimestamp: function() {
    return new Date().toISOString();
  },

  // Format response for JSON output
  jsonSuccess: function(data) {
    return { success: true, data: data };
  },

  jsonError: function(message) {
    return { success: false, error: message };
  },

  // Create text response object with CORS headers enabled
  createJsonResponse: function(obj) {
    var output = ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
    return output;
  }
};
