"use strict"

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var handlebars = require('handlebars');
var Promise = require('promise');

var domain = 'https://www.denverstartupweek.org';
var url = domain + '/schedule/friday';
var links = {};
var matches = [];
var keywords = ['beverage', 'refreshment', 'breakfast', 'lunch', 'waffle', 'pizza', 'burger', 'dinner', 'cocktail']

var regexp = new RegExp('('+keywords.join('|')+')', 'i');

// get template file

var templateSource = fs.readFileSync('template.html', 'utf-8');
var template = handlebars.compile(templateSource);

// main execution

var dayLinksRequest = new Promise(function(resolve, reject) {

	request(url, function(error, response, html){
	    if(!error){
	        var $ = cheerio.load(html);

	        $('.schedule-container .session-title').each(function(){
	            var data = $(this);
	            var link = data.attr('href');

	            links[domain + link] = true;
	        });

	        resolve();

	    } else {
	    	reject();
	    }
	});
});

dayLinksRequest.then(function() {
	var eventRequests = [];
	for (let link in links) {
		var eventRequest = new Promise(function(resolveInner, rejectInner) {
			// begin inner request
			request(link, function(error, response, html){
				if (!error) {
					resolveInner();

					var $ = cheerio.load(html);

					$('.description p').filter(function() {
						var p = $(this);

						if (regexp.test(p.text())) {
							var matchText = p.text().replace(/\n/g, '    ');
							matchText = matchText.replace(/,/g, '');
							var title = $('.title').text();
							var address = $('.location-details p').toArray().reduce(function(prev, e) {
								return prev + ' ' + $(e).text();
							}, '');
							address = address.replace(/,/g, '');
							var time = $('.names h6').eq(1).text();
							var data = {title: title, matchText: matchText, url: link, address: address, time: time};
							console.info(template(data));
							return true;
						}
					});

				} else {
					rejectInner();
				}
			});
			// end inner request
		});
	}
});