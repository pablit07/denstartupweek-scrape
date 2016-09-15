"use strict"

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var Promise = require('promise');

var domain = 'https://www.denverstartupweek.org';
var url = domain + '/schedule/thursday';
var links = [];
var matches = [];
var keywords = ['beverage', 'refreshment', 'food', 'drink']

var regexp = new RegExp('^('+keywords.join('|')+')', 'i');

// main execution

var thursLinksRequest = new Promise(function(resolve, reject) {

	request(url, function(error, response, html){
	    if(!error){
	        var $ = cheerio.load(html);

	        $('.schedule-container .session-title').each(function(){
	            var data = $(this);
	            var link = data.attr('href');

	            links.push(domain + link);
	        });

	        resolve();

	    } else {
	    	reject();
	    }
	});
});

thursLinksRequest.then(function() {
	var eventRequests = [];
	for (let link of links) {
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
							console.info([title, matchText, link, address].join(','));
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