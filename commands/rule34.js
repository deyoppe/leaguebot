/* global Promise */
var request = require('request');
var _ = require('lodash');
var baseUrl = "https://danbooru.donmai.us",
	searchUrl = "/posts.json",
	countUrl = "/counts"+searchUrl;
	
function getSmut(champs) {
	if(!champs) champs = [];
	
	var promise = new Promise(function(resolve, reject) {
		var tags = _(champs).map(function(tag) {
			return tag+"*";
		}).concat(["league_of_legends"]).join(' ');
		
		request({
			baseUrl : baseUrl,
			url : countUrl,
			qs : {
				tags : tags
			},
			qsStringifyOptions : {
				encode: false
			}
		}, function(error, response, bodyCounts) {
			var postcount = JSON.parse(bodyCounts).counts.posts;
			if(postcount === 0) {
				reject("Nothing found");
				return;
			}
			
			var page = Math.round(Math.random()*Math.min(postcount/100, 1000));
			
			request({
				baseUrl : baseUrl,
				url : searchUrl,
				qs : {
					tags : tags,
					limit : 100,
					page : page
				},
				qsStringifyOptions : {
					encode: false
				}
			}, function(error, response, bodySmut) {
				var json = JSON.parse(bodySmut);
				var post = _(json).reject({rating : 's'}).sortByAll(['fav_count', 'score']).takeRight(5).sample();
				var postUrl = post.file_url;
				var smut = request({
					baseUrl : baseUrl,
					url : postUrl
				}, resolve);
				console.log("Sending", postUrl, 'score:', post.score, 'fav:', post.fav_count);
				resolve(smut);
			});
		});
	});
	
	return promise;
}

module.exports = function(bot) {
	var sendSmut = function(msg, match) {
		var chatId = msg.chat.id;
		bot.sendChatAction(chatId, 'typing');
		
		var searchTerms = match.length > 1 ? match[1].split(',') : [];
		getSmut(searchTerms)
		.then(function(smut) {
			bot.sendChatAction(chatId, 'upload_photo');
			bot.sendPhoto(chatId, smut);
		}, function(err) {
			bot.sendMessage(chatId, err);
		});
	}
	
	bot.onText(/\/rule34$/, sendSmut);
	bot.onText(/\/rule34 (.*)/, sendSmut);
	bot.onText(/tette/ig, sendSmut);
}