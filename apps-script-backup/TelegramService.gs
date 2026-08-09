// TelegramService.gs
// Manages outgoing Telegram notification dispatches.

var TelegramService = {
  // Dispatches a message to Telegram Bot
  sendNotification: function(text) {
    try {
      // Fetch telegram keys from the Settings sheet
      var settings = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
      
      var botTokenSetting = settings.find(function(s) { return s.setting_key === 'TELEGRAM_BOT_TOKEN'; });
      var chatIdSetting = settings.find(function(s) { return s.setting_key === 'TELEGRAM_CHAT_ID'; });

      var token = botTokenSetting ? botTokenSetting.setting_value : '';
      var chatId = chatIdSetting ? chatIdSetting.setting_value : '';

      if (!token || !chatId) {
        Logger.log('Telegram credentials not configured. Skipping dispatch.');
        return;
      }

      var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
      var payload = {
        'chat_id': chatId,
        'text': text,
        'parse_mode': 'HTML'
      };

      var options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true
      };

      var response = UrlFetchApp.fetch(url, options);
      Logger.log('Telegram dispatch status: ' + response.getContentText());
    } catch (err) {
      // Fail-silent constraint: Failure on Telegram must NOT disrupt the core transaction
      Logger.log('Telegram Service Warning: ' + err.message);
    }
  }
};
