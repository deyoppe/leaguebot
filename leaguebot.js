/* global bot */
/* global api */
var TelegramBot = require('node-telegram-bot-api');
var tokens = require('./cfg/tokens');
var emoji = require('node-emoji').emoji;
var _ = require('lodash');
var moment = require('moment');
var lol = require('riot-lol-api');
bot = new TelegramBot(tokens.telegram, {polling: true});
api = lol.client(tokens.riot)

require('./commands')(bot);

bot.onText(/\/recent (.*)/, function(msg, match) {
	var fromId = msg.chat.id;
	bot.sendChatAction(fromId, 'typing');
	
	var summonerName = match[1];
	api.summoner.getByName('euw', summonerName)
	.then(function(res) { 
		api.game.getRecentBySummoner('euw', res[summonerName.replace(/ /g, '')].id)
		.then(function(res) { 
			var reply = '';
			res.games.forEach(function(match) {
				var stats = match.stats;
				var str = '['+moment(match.createDate).fromNow()+'] ';
				str += stats.win ? emoji.tada : emoji.sob;
				str += ' ('+(stats.championsKilled || 0)+'-'+(stats.numDeaths || 0)+'-'+(stats.assists || 0)+') ';
				str += lol.champions[match.championId].name + ' ';
				str += '\n';
				reply += str;
			});
			bot.sendMessage(fromId, reply);
		});
	});
});

bot.onText(/\/matches (.*)/, function(msg, match) {
	var fromId = msg.chat.id;
	bot.sendChatAction(fromId, 'typing');
	
	var summonerName = match[1];
	api.summoner.getByName('euw', summonerName)
	.then(function(res) { 
		api.game.getRecentBySummoner('euw', res[summonerName.replace(/ /g, '')].id)
		.then(function(res) { 
			var keyboard = [];
			res.games.forEach(function(match) {
				var stats = match.stats;
				var str = '/match '+match.gameId+' '; 
				str += stats.win ? emoji.tada : emoji.sob;
				str += ' ('+(stats.championsKilled || 0)+'-'+(stats.numDeaths || 0)+'-'+(stats.assists || 0)+') ';
				str += lol.champions[match.championId].name + ' ';
				str += '\n';
				keyboard.push([str]);
			});
			bot.sendMessage(fromId, "Which match?", {
				reply_markup : JSON.stringify({
					keyboard : keyboard,
					resize_keyboard : true,
					selective : true
				})
			});
		});
	});
});

bot.onText(/\/match ([0-9]+)[ ]?(.*)?/, function(msg, match) {
	var fromId = msg.chat.id;
	bot.sendChatAction(fromId, 'typing');
	
	var matchId = match[1];
	api.match.get('euw', matchId)
	.then(function(res) { 
		console.log(res);
	});
});
