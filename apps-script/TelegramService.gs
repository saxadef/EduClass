// TelegramService.gs
// Manages outgoing Telegram notification dispatches.

var TelegramService = {
  escapeHtml: function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  sendNotification: function(text) {
    try {
      var settings = SpreadsheetService.readAllRows(Config.SHEET_SETTINGS);
      var botTokenSetting = settings.find(function(s) { 
        return s.setting_key && String(s.setting_key).trim() === 'TELEGRAM_BOT_TOKEN'; 
      });
      var chatIdSetting = settings.find(function(s) { 
        return s.setting_key && String(s.setting_key).trim() === 'TELEGRAM_CHAT_ID'; 
      });

      var token = botTokenSetting && botTokenSetting.setting_value ? String(botTokenSetting.setting_value).trim() : '';
      var chatId = chatIdSetting && chatIdSetting.setting_value ? String(chatIdSetting.setting_value).replace(/\.0+$/, '').trim() : '';

      if (!token || !chatId) {
        Logger.log('Telegram notice: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in Settings.');
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
      var code = response.getResponseCode();
      var responseText = response.getContentText();
      Logger.log('Telegram dispatch status [' + code + ']: ' + responseText);
    } catch (err) {
      Logger.log('Telegram Service Error: ' + err.message);
    }
  }
};