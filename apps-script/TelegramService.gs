// TelegramService.gs
// Manages outgoing Telegram notification dispatches.

var TelegramService = {
  sendNotification: function(text) {
    try {
      var settings = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
      var botTokenSetting = settings.find(function(s) { return s.setting_key === 'TELEGRAM_BOT_TOKEN'; });
      var chatIdSetting = settings.find(function(s) { return s.setting_key === 'TELEGRAM_CHAT_ID'; });

      var token = botTokenSetting ? botTokenSetting.setting_value : '';
      var chatId = chatIdSetting ? chatIdSetting.setting_value : '';

      if (!token || !chatId) return;

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

      UrlFetchApp.fetch(url, options);
    } catch (err) {
      Logger.log('Telegram failed silently: ' + err.message);
    }
  }
};