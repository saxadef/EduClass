// AuthService.gs
// Manages authentication validation and active cache session management.

var AuthService = {
  // Verifies admin username and password, registers session cache
  login: function(username, password) {
    var admins = SpreadsheetService.readAllRows(Config.SHEET_ADMINS);
    
    var matchedAdmin = admins.find(function(a) {
      return a.username === username && a.password_hash === password; // plain password comparison for v0.1 simplification
    });

    if (!matchedAdmin) {
      throw new Error('Invalid username or password.');
    }

    // Generate session token
    var sessionToken = Utils.generateId('SES');
    
    // Put session token in Script Cache for 6 hours (21600 seconds)
    var cache = CacheService.getScriptCache();
    cache.put(sessionToken, username, 21600);

    // Update last_login_at in database
    SpreadsheetService.updateRow(Config.SHEET_ADMINS, 'admin_id', matchedAdmin.admin_id, {
      'last_login_at': Utils.getTimestamp(),
      'updated_at': Utils.getTimestamp()
    });

    return {
      sessionToken: sessionToken,
      display_name: matchedAdmin.display_name
    };
  },

  // Validates session token
  validateSession: function(sessionToken) {
    if (!sessionToken) {
      throw new Error('Access Denied: Session token is missing.');
    }
    
    var cache = CacheService.getScriptCache();
    var cachedUser = cache.get(sessionToken);
    
    if (!cachedUser) {
      throw new Error('Access Denied: Invalid or expired session.');
    }
    
    return cachedUser; // returns username of authenticated admin
  }
};
