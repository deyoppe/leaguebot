/* global Promise */
var request = require('request');
var _ = require('lodash');
var baseUrl = "https://danbooru.donmai.us",
	searchUrl = "/posts.json",
	countUrl = "/counts"+searchUrl;

function getSmut(champs) {
	if(!champs) champs = [];
	
	var promise = new Promise(function(resolve, reject) {
		var tags = _(["league_of_legends"]).concat(champs).value();
		
		request({
			baseUrl : baseUrl,
			url : countUrl,
			qs : {
				tags : tags.join('+')
			}
		}, function(error, response, bodyCounts) {
			var pages = JSON.parse(bodyCounts).counts.posts;
			if(pages > 1000) pages = 1000;
			
			var page = Math.round(Math.random()*pages);
			
			request({
				baseUrl : baseUrl,
				url : searchUrl,
				qs : {
					tags : tags.join('+'),
					limit : 1,
					page : page
				}
			}, function(error, response, bodySmut) {
				var json = JSON.parse(bodySmut);
				var post = json[0];
				var smut = request({
					baseUrl : baseUrl,
					url : post['file_url']
				});
				resolve(smut);
			});
		});
	});
	
	return promise;
}

module.exports = function(bot) {
	bot.onText(/\/rule34$/, function(msg) {
		var chatId = msg.chat.id;
		bot.sendChatAction(chatId, 'upload_photo');
		
		getSmut()
		.then(function(smut) {
			bot.sendPhoto(chatId, smut);
		});
	});
	
	bot.onText(/\/rule34 (.*)/, function(msg, match) {
		var chatId = msg.chat.id;
		
		getSmut(match[1].split(','))
		.then(function(smut) {
			bot.sendPhoto(chatId, smut);
		});
	});
	
	bot.onText(/tette/ig, function(msg) {
		var chatId = msg.chat.id;
		
		getSmut()
		.then(function(smut) {
			bot.sendPhoto(chatId, smut);
		});
	});
}