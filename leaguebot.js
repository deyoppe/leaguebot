/* global bot */
/* global api */
var fs = require('fs');
var TelegramBot = require('node-telegram-bot-api');
var tokens = require('./cfg/tokens');
var emoji = require('node-emoji').emoji;
var _ = require('lodash');
var moment = require('moment');
var handlebars = require('handlebars');
var webshot = require('webshot');
var lol = require('riot-lol-api');
bot = new TelegramBot(tokens.telegram, {polling: true});
api = lol.client(tokens.riot)

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

bot.onText(/\/match (.*)/, function(msg, match) {
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
				var str = '/matchid '+match.gameId+' ['; 
				str += stats.win ? 'W' : 'L';
				str += ' ('+(stats.championsKilled || 0)+'-'+(stats.numDeaths || 0)+'-'+(stats.assists || 0)+') ';
				str += lol.champions[match.championId].name + ']';
				str += '\n';
				keyboard.push([str]);
			});
			keyboard.push(['/cancel']);
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

bot.onText(/\/matchid ([0-9]+) \[([WL]) \(([0-9]+)-([0-9]+)-([0-9]+)\) (.*)+\]/, function(msg, params) {
	var fromId = msg.chat.id;
	bot.sendChatAction(fromId, 'typing');
	
	var matchId = params[1],
		matchOutcome = params[2],
		matchKills = parseInt(params[3]),
		matchDeaths = parseInt(params[4]),
		matchAssists = parseInt(params[5]),
		matchChamp = params[6];
	
	api.match.get('euw', matchId)
	.then(function(match) {
		var matchTeamId =  _(match.teams).filter({winner: matchOutcome === 'W'}).first().teamId,
			main = _(match.participants).filter({
				stats : {
					kills: matchKills !== 0 ? matchKills : undefined,
					deaths: matchDeaths !== 0 ? matchDeaths : undefined,
					assists: matchAssists !== 0 ? matchAssists : undefined
				},
				championId : _(lol.champions).filter({name : matchChamp}).first().id
			}).first(),
			participants = _(match.participants).map(function(v, k) {
				return {
					team : v.teamId, 
					champion : v.championId, 
					score : v.stats.kills+'-'+v.stats.deaths+'-'+v.stats.assists 
				}})
			.partition({ team : matchTeamId}).value(),
			duration = moment.duration(match.matchDuration, 'seconds'),
			multikillType = {
				2 : "double",
				3 : "triple",
				4 : "quadra",
				5 : "penta"
			}[main.stats.largestMultikill];
			
		var data = {
			match : {
				date : moment(match.matchCreation).fromNow(),
				type : _(_(match.queueType.toLowerCase()).replace(/g_/g, ' ')).startCase(),
				duration : duration.minutes() + ":" +duration.seconds(),
				outcome : matchOutcome === 'W' ? "WIN" : "LOSS"
			},
			score : {
				kills : main.stats.kills,
				deaths : main.stats.deaths,
				assists : main.stats.assists
			},
			champion : matchChamp,
			multikill : multikillType ? {
				type : multikillType,
				quantity : main.stats[multikillType+"s"]
			} : false,
			spells : [lol.spells[main.spell1Id].key, lol.spells[main.spell2Id].key],
			items : _(main.stats).pick((v, k) => /^item[0-5]/.test(k)).values().value(),
			trinket : main.stats.item6,
			wards :  main.stats.wardsPlaced,
			minions : main.stats.minionsKilled,
			teams : {
				allies : participants[0],
				enemies : participants[1]
			},
			version : match.matchVersion.replace(/^([0-9]+\.[0-9]+\.)(.*?)$/g, '$11')
		}
	});
});

bot.onText(/\/cancel/, function(msg, match) {
	var fromId = msg.chat.id;
	bot.sendMessage(fromId, "Ok", {
		reply_markup : JSON.stringify({
			hide_keyboard: true
		})
	});
});

console.log("Bot is running");