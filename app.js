var TelegramBot = require('node-telegram-bot-api');
var tokens = require('./cfg/tokens');
var bot = new TelegramBot(tokens.telegram, {polling: true});
require('./commands')(bot);

require('riot-lol-api')(tokens.riot)
.then(function(api) {
	console.log("Initialized");
	
});
