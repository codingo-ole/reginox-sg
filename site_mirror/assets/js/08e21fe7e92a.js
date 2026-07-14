
		function formValidateform1152 () {
		var previousClicked=false;
		var	validateInlineClass = "inlineValidated";
		var lastActiveElement = null;
		var jquery = jQuery.noConflict();
		var formId = "form1152";
		jquery(".previousPageButton", "#"+formId).on('click', function() {
		  previousClicked=true;return true;
		});

		function updateAriaDescribedByForErrors() {
  			jquery("[data-errid]").each(function () {
    			const input = jquery(this);

				// data-errid attribute can contain one or more error label ids, such as "field23-error field23-mm-error"
				// Find first existing error label in DOM
    			const errorIds = String(input.data("errid") || "").split(" ");
				const errorId = errorIds.find(id => jquery("#" + id).length);

				// Remove errorIds from current aria-describedby
				var descBy = String(input.attr("aria-describedby") || "");
				errorIds.forEach(id => {
  					descBy = descBy.replace(id, "").trim();
				});

				// If error is shown, add it to aria-describedby
    			const errorLabel = jquery("#" + errorId);
				if (errorLabel.length && errorLabel.is(":visible")) {
					descBy = (descBy + " " + errorId).trim();
				}
				descBy ? input.attr("aria-describedby", descBy) : input.removeAttr("aria-describedby");
  			});
		}

	
	var tlds = ['sohu', 'wme', 'dubai', 'thd', 'sandvikcoromant', 'vivo', 'xxx', 'northwesternmutual', 'games', 'horse', 'bet', 'soccer', 'kpn', 'helsinki', 'support', 'tirol', 'office', 'pfizer', 'me', 'shoes', 'forex', 'lawyer', 'vision', 'how', 'talk', 'wolterskluwer', 'everbank', 'datsun', 'sr', 'org', 'dental', 'trust', 'bayern', 'chat', 'viking', 'wine', 'nikon', 'br', 'ferrari', 'loans', 'mitsubishi', 'bentley', 'biz', 'trv', 'za', 'mopar', 'sanofi', 'st', 'ads', 'ltda', 'xfinity', 'ss', 'vistaprint', 'life', 'ubs', 'mg', 'rwe', 'network', 'ricoh', 'luxe', 'mtn', 'jetzt', 'yun', 'icbc', 'firmdale', 'lds', 'neustar', 'construction', 'su', 'uy', 'bcn', 'beauty', 'dad', 'expert', 'maif', 'guardian', 'mh', 'hot', 'commbank', 'bs', 'woodside', 'lotte', 'mobily', 'mint', 'reit', 'sca', 'fit', 'jot', 'read', 'uz', 'soy', 'auto', 'nationwide', 'tiaa', 'sv', 'om', 'madrid', 'rocher', 'ke', 'memorial', 'observer', 'bt', 'netbank', 'xerox', 'google', 'moto', 'iveco', 'clinic', 'estate', 'fitness', 'scb', 'accenture', 'calvinklein', 'map', 'lipsy', 'doctor', 'fire', 'tmall', 'jmp', 'stc', 'akdn', 'george', 'imamat', 'bike', 'partners', 'team', 'website', 'homes', 'capitalone', 'sakura', 'weibo', 'aol', 'prime', 'rocks', 'vacations', 'hgtv', 'sx', 'prof', 'productions', 'mk', 'mlb', 'swiftcover', 'band', 'dunlop', 'kg', 'tax', 'dz', 'komatsu', 'microsoft', 'mtr', 'catering', 'kuokgroup', 'bv', 'catholic', 'int', 'sy', 'site', 'weatherchannel', 'cbn', 'softbank', 'man', 'diy', 'kh', 'ml', 'solar', 'id', 'bw', 'fans', 'dvr', 'earth', 'sexy', 'lol', 'pharmacy', 'travelersinsurance', 'ninja', 'toys', 'chase', 'sz', 'cars', 'mn', 'sony', 'dev', 'cbs', 'homedepot', 'ki', 'kiwi', 'deals', 'mm', 'ga', 'cityeats', 'ie', 'photography', 'macys', 'ott', 'itau', 'prudential', 'money', 'church', 'joy', 'mo', 'town', 'author', 'target', 'secure', 'download', 'gb', 'university', 'sncf', 'com', 'by', 'xbox', 'aig', 'careers', 'eus', 'ong', 'wedding', 'bananarepublic', 'metlife', 'hoteles', 'spiegel', 'cleaning', 'va', 'newholland', 'bar', 'deal', 'discount', 'help', 'hkt', 'mp', 'duns', 'dabur', 'olayangroup', 'cloud', 'markets', 'trade', 'axa', 'sarl', 'insure', 'bz', 'garden', 'shouji', 'tatar', 'blackfriday', 'events', 'finance', 'jpmorgan', 'shaw', 'bloomberg', 'km', 'mq', 'gd', 'one', 'locker', 'stockholm', 'maison', 'bnl', 'abogado', 'kaufen', 'passagens', 'vc', 'vuelos', 'cards', 'statefarm', 'direct', 'ifm', 'mr', 'florist', 'meme', 'edu', 'kn', 'wien', 'hiv', 'ge', 'select', 'jewelry', 'tech', 'pohl', 'sky', 'bible', 'tui', 'haus', 'kitchen', 'condos', 'ms', 'autos', 'engineer', 'brother', 'redstone', 'gf', 'viajes', 'seven', 'flowers', 'bank', 'forsale', 'ftr', 'loan', 've', 'hisamitsu', 'moscow', 'alipay', 'kp', 'fedex', 'mt', 'cymru', 'gh', 'il', 'museum', 'ec', 'aarp', 'gg', 'active', 'gent', 'exchange', 'alstom', 'watches', 'dclk', 'pramerica', 'zm', 'democrat', 'glade', 'booking', 'gdn', 'jio', 'mu', 'alibaba', 'gi', 'call', 'im', 'lancia', 'spa', 'stada', 'travel', 'jcb', 'associates', 'cheap', 'philips', 'africa', 'okinawa', 'sale', 'run', 'seek', 'info', 'actor', 'frl', 'dtv', 'esq', 'williamhill', 'rich', 'walter', 'tc', 'cool', 'mv', 'asda', 'in', 'goodyear', 'kr', 'tours', 'kinder', 'vip', 'edeka', 'beer', 'ca', 'cuisinella', 'ee', 'ferrero', 'bms', 'dodge', 'vg', 'pru', 'work', 'eat', 'frogans', 'td', 'kpmg', 'insurance', 'mw', 'mil', 'arte', 'io', 'durban', 'cern', 'eg', 'box', 'career', 'music', 'hockey', 'nadex', 'mx', 'ooo', 'gl', 'tel', 'pars', 'cd', 'lighting', 'cafe', 'sbi', 'vin', 'honda', 'cc', 'citi', 'college', 'club', 'allstate', 'clinique', 'lgbt', 'vi', 'nissay', 'nexus', 'moda', 'mov', 'lasalle', 'plumbing', 'cfa', 'my', 'nike', 'erni', 'gal', 'gm', 'cruise', 'realty', 'iq', 'photos', 'tci', 'sfr', 'grocery', 'ruhr', 'trading', 'army', 'tf', 'hyatt', 'mz', 'black', 'dell', 'ir', 'coop', 'gn', 'barclays', 'lidl', 'xin', 'cf', 'build', 'bmw', 'rentals', 'afl', 'bio', 'hitachi', 'sydney', 'verisign', 'arab', 'casa', 'mormon', 'baseball', 'foo', 'tg', 'versicherung', 'cricket', 'nhk', 'osaka', 'is', 'arpa', 'kw', 'circle', 'emerck', 'boats', 'voto', 'ac', 'cg', 'chrome', 'lacaixa', 'book', 'charity', 'fiat', 'americanexpress', 'lotto', 'lancaster', 'place', 'spreadbetting', 'movie', 'phd', 'fresenius', 'extraspace', 'th', 'mckinsey', 'shia', 'gp', 'it', 'krd', 'ch', 'game', 'ad', 'hospital', 'schule', 'anz', 'diet', 'fujixerox', 'bargains', 'cfd', 'makeup', 'credit', 'med', 'latrobe', 'frontdoor', 'pa', 'abb', 'christmas', 're', 'ky', 'tvs', 'gq', 'inc', 'tjmaxx', 'broadway', 'ci', 'tiffany', 'gap', 'java', 'ae', 'hbo', 'dot', 'gbiz', 'bbva', 'storage', 'gle', 'zara', 'dance', 'tj', 'vn', 'abc', 'kz', 'photo', 'ericsson', 'toyota', 'gr', 'film', 'next', 'protection', 'af', 'suzuki', 'aero', 'technology', 'scjohnson', 'zw', 'sbs', 'scholarships', 'gives', 'nba', 'like', 'tk', 'bcg', 'creditcard', 'ismaili', 'smart', 'case', 'gratis', 'zappos', 'organic', 'aws', 'gs', 'ag', 'ck', 'epson', 'post', 'pub', 'mit', 'bestbuy', 'kids', 'showtime', 'tl', 'airforce', 'gt', 'domains', 'kindle', 'xihuan', 'cl', 'aigo', 'play', 'pwc', 'crown', 'zone', 'oracle', 'abbvie', 'boehringer', 'tm', 'party', 'pe', 'bugatti', 'ford', 'norton', 'rogers', 'godaddy', 'na', 'fidelity', 'gu', 'blue', 'claims', 'cm', 'abudhabi', 'gucci', 'progressive', 'training', 'ai', 'aramco', 'dvag', 'csc', 'promo', 'tn', 'politie', 'cba', 'imdb', 'land', 'pf', 'ing', 'tube', 'pccw', 'safe', 'pay', 'phone', 'er', 'lamer', 'safety', 'miami', 'cn', 'ski', 'toshiba', 'statebank', 'fox', 'abarth', 'lefrak', 'open', 'study', 'exposed', 'hotmail', 'parts', 'skin', 'telefonica', 'zip', 'skype', 'vet', 'to', 'camera', 'nc', 'gay', 'pg', 'rodeo', 'hughes', 'unicom', 'attorney', 'cash', 'uol', 'es', 'navy', 'gw', 'compare', 'barefoot', 'co', 'financial', 'nissan', 'store', 'yandex', 'watch', 'mattel', 'tp', 'ventures', 'works', 'banamex', 'ph', 'bradesco', 'airbus', 'enterprises', 'shangrila', 'dating', 'et', 'nfl', 'icu', 'al', 'tools', 'lifeinsurance', 'surgery', 'schmidt', 'weber', 'vu', 'itv', 'ovh', 'hosting', 'la', 'ne', 'auspost', 'fast', 'samsclub', 'audi', 'onyourside', 'cbre', 'men', 'report', 'software', 'eurovision', 'room', 'eu', 'infiniti', 'flights', 'tushu', 'faith', 'sina', 'am', 'glass', 'consulting', 'qvc', 'seat', 'graphics', 'tr', 'americanfamily', 'vote', 'coach', 'lb', 'uconnect', 'guge', 'nf', 'gy', 'ink', 'an', 'cr', 'apple', 'bing', 'business', 'ril', 'red', 'xyz', 'holiday', 'staples', 'auction', 'ro', 'show', 'hotels', 'llc', 'ng', 'pk', 'express', 'lc', 'kddi', 'ao', 'ipiranga', 'kerrylogistics', 'computer', 'tt', 'goldpoint', 'melbourne', 'sling', 'market', 'pl', 'country', 'dealer', 'netflix', 'tokyo', 'kia', 'design', 'lpl', 'top', 'live', 'meet', 'studio', 'security', 'voyage', 'tv', 'pm', 'golf', 'foundation', 'gov', 'ni', 'athleta', 'global', 'nowruz', 'coffee', 'loft', 'yamaxun', 'budapest', 'olayan', 'aq', 'city', 'barclaycard', 'equipment', 'gold', 'racing', 'rs', 'tw', 'symantec', 'pn', 'flickr', 'moe', 'bostik', 'ceo', 'mma', 'nextdirect', 'cruises', 'intel', 'kred', 'cu', 'ally', 'origins', 'smile', 'net', 'cam', 'lixil', 'rip', 'tkmaxx', 'cal', 'desi', 'lexus', 'art', 'ollo', 'ar', 'shriram', 'app', 'cv', 'click', 'playstation', 'digital', 'casino', 'vegas', 'salon', 'ru', 'rugby', 'starhub', 'holdings', 'yodobashi', 'nl', 'ubank', 'hdfc', 'voting', 'property', 'repair', 'ryukyu', 'school', 'otsuka', 'warman', 'as', 'today', 'theater', 'cw', 'obi', 'uno', 'samsung', 'tz', 'hair', 'ups', 'tattoo', 'pr', 'asia', 'li', 'limo', 'je', 'mobi', 'cx', 'reliance', 'blog', 'windows', 'weather', 'at', 'services', 'iselect', 'international', 'rw', 'gmx', 'quest', 'no', 'rio', 'courses', 'fly', 'ps', 'amsterdam', 'lego', 'cologne', 'jll', 'bingo', 'comcast', 'cy', 'nokia', 'berlin', 'landrover', 'song', 'au', 'fage', 'moi', 'visa', 'rehab', 'chintai', 'realestate', 'ye', 'eco', 'tips', 'deloitte', 'np', 'clothing', 'pt', 'mango', 'lk', 'pnc', 'solutions', 'nico', 'review', 'singles', 'lincoln', 'cz', 'academy', 'apartments', 'latino', 'builders', 'boo', 'fashion', 'broker', 'cooking', 'bid', 'green', 'sucks', 'limited', 'afamilycompany', 'car', 'delta', 'homesense', 'house', 'hyundai', 'gmail', 'law', 'physio', 'capetown', 'shop', 'aw', 'bridgestone', 'crs', 'group', 'pink', 'rent', 'dog', 'chrysler', 'bbt', 'nr', 'radio', 'fish', 'sharp', 'immobilien', 'pictures', 'lat', 'amica', 'gift', 'locus', 'star', 'ax', 'fail', 'tunes', 'buy', 'hiphop', 'merck', 'bom', 'paris', 'koeln', 'kerryhotels', 'tires', 'firestone', 'villas', 'vig', 'jeep', 'adac', 'pw', 'dds', 'theatre', 'new', 'vodka', 'ntt', 'foodnetwork', 'fun', 'media', 'mom', 'rmit', 'education', 'forum', 'bharti', 'oldnavy', 'stream', 'tab', 'juniper', 'gallo', 'llp', 'ua', 'kim', 'hangout', 'flir', 'nyc', 'saarland', 'az', 'archi', 'healthcare', 'pro', 'social', 'airtel', 'giving', 'systems', 'ieee', 'nrw', 'wf', 'py', 'nu', 'feedback', 'jm', 'quebec', 'bot', 'contact', 'guitars', 'silk', 'coupons', 'rightathome', 'yachts', 'pics', 'lanxess', 'taobao', 'webcam', 'ping', 'docs', 'fido', 'lr', 'ren', 'world', 'data', 'shopping', 'boutique', 'camp', 'pet', 'azure', 'search', 'bond', 'yahoo', 'ikano', 'codes', 'lamborghini', 'science', 'aquarelle', 'jo', 'ls', 'mobile', 'cat', 'bzh', 'hk', 'genting', 'ice', 'reise', 'family', 'nagoya', 'health', 'sa', 'wanggou', 'here', 'volkswagen', 'futbol', 'swiss', 'leclerc', 'jp', 'taipei', 'lt', 'rsvp', 'rest', 'citadel', 'surf', 'tjx', 'teva', 'audible', 'sb', 'lu', 'esurance', 'intuit', 'hm', 'republican', 'ltd', 'schwarz', 'de', 'fi', 'win', 'vlaanderen', 'saxo', 'cisco', 'ladbrokes', 'tienda', 'wtc', 'marshalls', 'panasonic', 'aeg', 'dish', 'properties', 'pictet', 'capital', 'dnp', 'swatch', 'istanbul', 'realtor', 'sc', 'lv', 'nz', 'reviews', 'hn', 'toray', 'anquan', 'engineering', 'date', 'fan', 'irish', 'fj', 'ba', 'pioneer', 'wow', 'wales', 'able', 'luxury', 'baby', 'kfh', 'mini', 'onl', 'walmart', 'clubmed', 'fund', 'analytics', 'jobs', 'menu', 'ug', 'gmbh', 'supplies', 'wed', 'juegos', 'fk', 'legal', 'tdk', 'zuerich', 'bb', 'android', 'amex', 'football', 'sd', 'cartier', 'cookingchannel', 'duck', 'qa', 'amazon', 'orange', 'travelers', 'institute', 'ggee', 'spot', 'maserati', 'ibm', 'bd', 'boston', 'style', 'wtf', 'avianca', 'yoga', 'joburg', 'nec', 'contractors', 'se', 'chanel', 'tennis', 'center', 'amfam', 'guru', 'ly', 'tickets', 'schaeffler', 'allfinanz', 'lundbeck', 'fm', 'agency', 'be', 'alfaromeo', 'rexroth', 'canon', 'farm', 'lifestyle', 'aetna', 'homegoods', 'poker', 'travelchannel', 'mba', 'liaison', 'fishing', 'viva', 'audio', 'bnpparibas', 'mls', 'adult', 'hr', 'accountants', 'cancerresearch', 'dj', 'caravan', 'hamburg', 'kosher', 'bf', 'you', 'agakhan', 'delivery', 'whoswho', 'online', 'lancome', 'ses', 'uk', 'brussels', 'ceb', 'srl', 'company', 'coupon', 'living', 'basketball', 'best', 'stcgroup', 'sg', 'investments', 'discover', 'now', 'vanguard', 'fo', 'day', 'gifts', 'bg', 'dk', 'guide', 'drive', 'plus', 'lease', 'reisen', 'alsace', 'diamonds', 'yt', 'sh', 'pid', 'directory', 'restaurant', 'aaa', 'jcp', 'energy', 'prod', 'comsec', 'ht', 'nra', 'bh', 'redumbrella', 'tatamotors', 'dentist', 'globo', 'gop', 'blockbuster', 'kyoto', 'link', 'raid', 'mutual', 'si', 'qpon', 'kerryproperties', 'london', 'total', 'taxi', 'hu', 'lupin', 'srt', 'dm', 'linde', 'news', 'hsbc', 'motorcycles', 'bi', 'nowtv', 'free', 'dhl', 'sener', 'beats', 'sj', 'hdfcbank', 'cyou', 'recipes', 'care', 'final', 'fr', 'msd', 'bj', 'marketing', 'fairwinds', 'gallup', 'sew', 'merckmsd', 'gripe', 'page', 'ws', 'bbc', 'sk', 'bosch', 'space', 'omega', 'virgin', 'youtube', 'do', 'off', 'email', 'lilly', 'richardli', 'goo', 'sex', 'sl', 'sap', 'channel', 'community', 'volvo', 'jaguar', 'weir', 'mortgage', 'pin', 'sandvik', 'baidu', 'furniture', 'natura', 'dupont', 'monash', 'press', 'save', 'temasek', 'hermes', 'gallery', 'got', 'management', 'sm', 'marriott', 'video', 'praxi', 'food', 'love', 'scor', 'ma', 'grainger', 'degree', 'frontier', 'bm', 'citic', 'piaget', 'jprs', 'porn', 'lplfinancial', 'aco', 'pizza', 'sport', 'sn', 'corsica', 'fujitsu', 'shiksha', 'vana', 'bofa', 'gea', 'cipriani', 'jnj', 'host', 'industries', 'winners', 'buzz', 'nab', 'bn', 'farmers', 'zero', 'goog', 'fyi', 'yokohama', 'caseih', 'supply', 'us', 'creditunion', 'sas', 'ist', 'monster', 'movistar', 'so', 'mc', 'scot', 'immo', 'cab', 'bo', 'ngo', 'etisalat', 'shell', 'bauhaus', 'abbott', 'cpa', 'accountant', 'barcelona', 'gmo', 'md', 'wang', 'wiki', 'name'];
	var validator = jquery("#form1152").validate({ 
	
		invalidHandler: function(form, validator) {
		var matrixMessages = new Object();
	

			var errorSummaryElement = jquery(".mpErrorSummary", "#"+formId );
			if ( errorSummaryElement.length == 0 ) {
				jquery("#"+formId).prepend("<div role='alert' class='mpErrorSummary'></div>");
			} else {
				errorSummaryElement.empty();
			}
			errorSummaryElement.append( "<label>" + jquery("input[name='errorText']","#"+formId ).val() + "</label><ul></ul>");
			errorSummaryElement.show();

			var errorElements = validator.errorList;
			var len = errorElements.length;
			var matrixQuestions = new Object();
			for(var i=0; i<len; i++) {
				var message = errorElements[i].message || "";
				var element = errorElements[i].element;
				var container = getContainer(element);
				if (container.is('tr')) {
					container = container.parents('.mpMatrixTable');
					var matrixId = container.attr("id");
					if (typeof matrixQuestions[matrixId] == "undefined") {
						matrixQuestions[matrixId] = matrixId;
						message = matrixMessages[matrixId];
						var topContainer = getTopContainer(element);
						topContainerId = topContainer.attr("id");
						var errorId = "errorfield-" + topContainerId;
						jquery(".mpErrorSummary ul", "#"+formId).append( "<li id=" + errorId + ">"+message+"</li>");
					}
				} else {
					var label = getLabel(element);
					message = message +" ("+label.text()+")";
					var errorId = "errorfield-" + container.attr("id");
					jquery(".mpErrorSummary ul", "#"+formId).append( "<li id=" + errorId + ">"+message+"</li>" );
				}
			}
		},
		errorPlacement: function(error, element) {
		    var container = getContainer(element);
		    if (container.is('table')) {
		       var errorRow = jquery(".mpErrorRow", container);
			   if (errorRow.length == 0) {
			      if (jquery("input[name='formLayout']","#"+formId).val() == 'N') {
			      	 errorRow = jquery('<tr class="mpErrorRow"><td colspan="2"></td></tr>');
			      } else {
			          errorRow = jquery('<tr class="mpErrorRow"><td></td></tr>');
			      }
			      container.append(errorRow);
			   }else {
			   	jquery("td", errorRow).empty();	
			   }			   
			   jquery("td", errorRow).append(error);
			} else if (container.is('li')) {
			   var errorDiv = jquery("div.mpErrorRow", container);
			   if (errorDiv.length == 0) {
					errorDiv = jquery('<div class="mpErrorRow"></div>');
					container.append(errorDiv);
			   } else {
					errorDiv.empty();
			   }
			   jquery(errorDiv).append(error);
			} else if (container.is('tr')) {
		       var errorRow = container.next(".mpErrorRow");
			   if (errorRow.length == 0) {
			   	  var colCount = jquery("td", container).length;
		      	  errorRow = jquery('<tr class="mpErrorRow"><td colspan="'+colCount+'"></td></tr>');
			      container.after(errorRow);
			   }else {
			   	jquery("td", errorRow).empty();	
			   }			   
			   jquery("td", errorRow).append(error);
			}
			updateAriaDescribedByForErrors();
		},
		highlight: function(element, errorClass, validClass) {
		    var container = getContainer(element);
		    if (container.is('tr')) {
		    	container = container.parents('.mpQuestionTable');
		    }
		    container.removeClass(errorClass).addClass(errorClass);
		    updateAriaDescribedByForErrors();
		},
		unhighlight: function(element, errorClass, validClass) {
			var hasError = false;
		    var container = getContainer(element);
		    var questionId = getQuestionId(element);
		    var errorBlock;
		    if (container.is('table') || container.is('div')) {
		    	var errorBlock = jquery(".mpErrorRow", container);
				if (errorBlock.length > 0) {
					var errorFor = getQuestionIdFromString( jquery("label", errorBlock).attr("for") );
					if (errorFor == questionId) {
						errorBlock.remove();
					} else {
						hasError = true;
					}
				}
			} else if (container.is('tr')) {
				errorBlock = container.next(".mpErrorRow");
				if (errorBlock.length > 0) {
					errorBlock.remove();
				}			
		    	container = container.parents('.mpQuestionTable');
		    	hasError = jquery('.mpErrorRow', container).length > 0;
		    };
		    if (!hasError) {		    
		    	container.removeClass(errorClass);
		    };
		    updateAriaDescribedByForErrors();
  		},		
		debug: false,
		onkeyup: false,
		onfocusout: false,
		onclick: false,			
		ignore: ":hidden",
		errorElement: "label",
			
		
			
 		rules: {
		field1154: {
			customRequired:true,
			customEmail:true
			},
		field1155: {
			customRequired:false
			},
		field1153: {
			customRequired:false
			},
		field1152: {
			customRequired:true
			},
		field1156: {
			customRequired:false
			},
		field1157: {
			customRequired:false
			},
		field1204: {
			customRequired:false
			},
		field1254: {
			customRequired:false
			},
		field1160: {
			customRequired:false
			}
		},
		messages: {
		field1154: {
			customRequired: "Vul een e-mailadres in.",
			customEmail: "Je hebt een ongeldig e-mailadres ingevuld."
			},
		field1155: {
			customRequired: "Vul een voornaam in."
			},
		field1153: {
			customRequired: ""
			},
		field1152: {
			customRequired: ""
			},
		field1156: {
			customRequired: "Vul een tussenvoegsel in."
			},
		field1157: {
			customRequired: "Vul een achternaam in."
			},
		field1204: {
			customRequired: "Vul in."
			},
		field1254: {
			customRequired: "Je hebt je geslacht nog niet opgegeven."
			},
		field1160: {
			customRequired: ""
			}
		}
		
			
		});
		jquery.validator.addMethod("customDate",  function(value, element) { 
		    var parent = jquery(element).parent();
		    var date = '';
		    jquery('.mpDateField', parent).each(function() {
		    	date = date + jquery(this).val() + '-';
		    });
		    if (date == '---') { // empty date is ok
		      date = '';
		      return true;
		    }
		    date = date.substring(0, date.length-1);
		    var pattern = jquery('.dateFieldPattern', parent).val();
		    
		    return isValidDate(date, pattern);
		});
		
		jquery.validator.addMethod("maxAnswers",  function(value, element, parms) {
			if (previousClicked) { // No required validations when previous is clicked
		       return true;
		    };		 
		    var ul = jquery(element).parents('ul')[0];
		    var checked = jquery('input:checked', ul).length;
		    return checked <= parms;
		});
		
		jquery.validator.addMethod("minAnswers",  function(value, element, parms) {
			if (previousClicked) { // No required validations when previous is clicked
		       return true;
		    };
		    var ul = jquery(element).parents('ul')[0];
		    var checked = jquery('input:checked', ul).length;
		    return checked >= parms;
		});
		
		jquery.validator.addMethod("money", function(value, element, parms) {
		    var matches = /^\d+([\.,]\d{0,2})*$/.exec(value);
		    return (value == '' || matches != null);
		});
		
		jquery.validator.addMethod("customRequired", function(value, element) {
		    if (previousClicked) { // No required validations when previous is clicked
		       return true;
		    };
		    return jquery.validator.methods.required.call(this, value, element);
		});
		
		jquery.validator.addMethod("customMin", function(value, element, parms) {
		    valueToCheck = Number(value.replace(",", "."));
		    minValue = Number(parms.replace(",", "."));
		    return (value == '' || valueToCheck >= minValue);
		});
		
		jquery.validator.addMethod("customMax", function(value, element, parms) {
		    valueToCheck = Number(value.replace(",", "."));
		    maxValue = Number(parms.replace(",", "."));
		    return (value == '' || valueToCheck <= maxValue);
		});
		
		jquery.validator.addMethod("customNumber", function(value, element, parms) {
		    var matches = /^-?\d+$/.exec(value);
		    return (value == '' || matches != null);
		});

		jquery.validator.addMethod("customEmail", function(value, element, parms) {
		  if (value == '') {
		    return true;
		  }
		  var matches = /^[^\s@]+@[^\s@]+\.[^\s\.@]+$/.exec(value);
          if (matches != null) {
             var tld = value.substr(value.lastIndexOf(".")+1);
             return tlds.indexOf(tld) > -1;
          }
		  return false;
		});

		jQuery.validator.addMethod("regexp", function(value, element, param) {
			var re;
			try {
				var caseSensitive = '';
				if ( param[1] == 'N' ) {
					caseSensitive = 'i';
				}
				re = new RegExp(param[0], caseSensitive);
    			return this.optional(element) || re.test(value);
    		} catch(e) {
    			return true;
    		}
		});

		    
	   function isValidDate(date, pattern) {
	   		var matches = /^(\d{2})[-](\d{2})[-](\d{4})$/.exec(date);
    		if (matches == null) return false;
	        if (pattern == 'dd-MM-yyyy') {
    			var d = matches[1];
    			var m = matches[2] - 1;
    			var y = matches[3];
	        } else if (pattern == 'MM-dd-yyyy') {
    			var d = matches[2];
    			var m = matches[1] - 1;
    			var y = matches[3];
	        }
	        
	        var composedDate = new Date(y, m, d);
    		return composedDate.getDate() == d && composedDate.getMonth() == m && composedDate.getFullYear() == y;
    		
		}
		
		function getContainer(element) {
			var jqElement = jquery(element);
			if (jqElement.hasClass("mpOtherCustomInput")) {
				jqElement = jqElement.parent().children(".mpMultipleInput");
			}
		    var id = jqElement.attr("id");
		    if (id.indexOf("prevbtn-") == 0) {
		      id = id.substr(8);
		    }
		    var pos = id.indexOf("-");
		    if (pos < 0) {
		       pos = id.length;
		    }
		    var cntId;
		    if (id.substring(0,3) == "fld") {
		    	cntId = "#CNTT" + id.substring(3, pos);
		    } else {
		    	cntId = "#CNT" + id.substring(5, pos);
		    }
		    return jquery(cntId);
		}
		
		function getQuestionId(element) {
			var jqElement = jquery(element);
		    var id = jqElement.attr("id");
		    return getQuestionIdFromString(id);
		}

		function getQuestionIdFromString(idString) {
		    var pos = idString.indexOf("-");
		    if (pos < 0) {
		       pos = idString.length;
		    }	
		    return idString.substring(0, pos);		
		}
				
		function getLabel(element) {
		    var container = getContainer(element);
		    var label = jquery(".mpFormLabel label", container);
		    
		    return label;
		}
		
		function getTopContainer(element) {
			var container = getContainer(element);
		    if (container.is('tr')) {
		    	container = container.parents('.mpQuestionTable');
		    }
		    return container;		
		}
		
		function doFocusin(element) {
			if (!lastActiveElement) {
				lastActiveElement = element;
				return;
			}
			var containerId = null;
			var containerLastActiveId = null;
			if (element.id) {			
				var container = getTopContainer(element);
				containerId = container.attr("id");
			}
			if (lastActiveElement.id) {
				var containerLastActive = getTopContainer(lastActiveElement);	
				containerLastActiveId = containerLastActive.attr("id");		
			}
			if (containerId != containerLastActiveId && containerLastActiveId) {
				jquery("input, textarea, select", containerLastActive).filter(":visible").each(function(index, element) {
					doFocusout(element);
				});
			}
			lastActiveElement = element;			
		}

		function doFocusout(element) {
			if (getValidateInline()) {
				var check = validator.check(element);
				var empty = validator.getLength(element.value, element) == 0;
				var container = getTopContainer(element);
				var hasError = jquery(container).hasClass('error');
				if (hasError || check == false || empty == false) {
					validator.element(element);
					var containerId = container.attr("id");
					hasError = jquery(container).hasClass('error');						
					if ( !hasError) {
						jquery("#errorfield-" + containerId).remove();
						if (jquery(".mpErrorSummary ul li", "#"+formId).length == 0) {
							var errorSummaryElement = jquery(".mpErrorSummary", "#"+formId);
							errorSummaryElement.empty();
							errorSummaryElement.hide();
						}
		    			if (getValidateElementInline(element)) {
							container.removeClass(validateInlineClass).addClass(validateInlineClass);		    
		    			} else {
							container.removeClass(validateInlineClass)		    
		    			}										
					} else {
						container.removeClass(validateInlineClass).addClass(validateInlineClass);		    
					}
					updateAriaDescribedByForErrors();
				}
			}
		}		
		

		
		jquery("input, textarea, select", "#"+formId).on('focusin', focusIn);
				

		function focusIn() {
			var element = this;
			if (element.type && element.type == 'submit') {
				setTimeout(function(){doFocusin(element);}, 1000);
			} else {
				doFocusin(element);
			}
			return true;
		};
		
		function getValidateInline() {
			return true;
		}
		
		var validateInlineSettings = new Object();
		validateInlineSettings["field1154"] = "N"
		validateInlineSettings["field1155"] = "N"
		validateInlineSettings["field1153"] = ""
		validateInlineSettings["field1152"] = ""
		validateInlineSettings["field1156"] = "N"
		validateInlineSettings["field1157"] = "N"
		validateInlineSettings["field1204"] = "N"
		validateInlineSettings["field1254"] = "N"
		validateInlineSettings["field1160"] = "N"
			
		
		function getValidateElementInline(element) {
		return validateInlineSettings[getQuestionId(element)] == "Y";
				

		}		
	};

   
		function FormABform1152() {
			var abQuestions = new Array();
			var jquery = jQuery.noConflict();
			var myself = this;	
			this.init = function(){	
				var abQuestion;
		
			abQuestion = new Object();
		abQuestion.questionId="field1153";
		abQuestion.containerId="CNT1153";
		abQuestion.isHoneyPot="true";
		
			abQuestions.push(abQuestion);
		
			abQuestion = new Object();
		abQuestion.questionId="field1152";
		abQuestion.containerId="CNT1152";
		abQuestion.isHoneyPot="false";
		
			abQuestions.push(abQuestion);
		
		
				for(var i=0; i<abQuestions.length; i++) {
					abQuestion = abQuestions[i];
					if (abQuestion.isHoneyPot == 'false') {
                        var abElem = jquery("#form1152 #"+abQuestion.questionId);
                        var description = jquery("#form1152 #"+abQuestion.containerId + " label[for='" + abQuestion.questionId + "']");
                        var result = myself.calcSum(description.text());
                        abElem.attr("value", result);
					}
					var abContainer = jquery("#form1152 #"+abQuestion.containerId);
					abContainer.hide();
				}					
			}
			
					
			this.calcSum = function(s) {
	    		var regex = /(\d+)\s[+]\s(\d+)\s[=]/g;
	    		var match = regex.exec(s);
	    		if (match) {
	    		   return parseInt(match[1]) + parseInt(match[2]);
	    		}
	    		return "";
	    	}
		}
		
		function initFormABform1152() {
			var fab = new FormABform1152();
			fab.init();	
		}


	
		
		function ShowHideform1152() {
			var concealedQuestions = new Array();
			var jquery = jQuery.noConflict();
			var myself = this;	
			var form = jquery('#form1152');			
			this.init = function(){	
				var concealedQuestion;
		
		
				for(var i=0; i<concealedQuestions.length; i++) {
					concealedQuestion = concealedQuestions[i];
					var triggerElem;				
					if (myself.isMultipleAnswer(concealedQuestion.questionType)) {
						triggerElem = jquery("#"+concealedQuestion.answerId);
						triggerElem.off('click');
						triggerElem.on('click', myself.updateShowHide);
					} else {
						triggerElem = jquery("#"+concealedQuestion.questionId);
						triggerElem.off('change');
						triggerElem.on('change', myself.updateShowHide);
					}					
					myself.doShowHide(triggerElem);						
				}
				jquery('input:not("input[type=submit]"),select,textarea',form).on('focus', myself.highlightContainer);
				jquery('input.mpMultipleInputOther', form).each(function() {
					var checked = jquery(this).prop("checked")
					jquery(this).parent().children(".mpOtherCustomInput").attr("disabled", !checked);				
				});				
				jquery('input[type=checkbox].mpMultipleInputOther', form).on('click', function() {
					var checked = jquery(this).prop("checked");
					jquery(this).parent().children(".mpOtherCustomInput").attr("disabled", !checked);
				});		
				jquery('input[type=radio].mpMultipleInputOther', form).each(function() {
					var container = jquery(this).parents(".mpQuestionTable");
					var radioId = jquery(this).attr("id");
					var inputId = jquery(this).parent().children(".mpOtherCustomInput").attr("id");
					jquery('input[type=radio]', container).on('click', function() {					
						if (radioId == jquery(this).attr("id")) {
							jquery("#"+inputId).attr("disabled", false);
						} else {
							jquery("#"+inputId).attr("disabled", true);					
						}
					});
				});
			
			
			
	
			}
			
			this.highlightContainer = function() {	
				jquery('.mpHighlight',form).removeClass('mpHighlight');			
				jquery(this).parents('.mpQuestionTable').addClass('mpHighlight');
			}
			
			this.isMultipleAnswer = function(questionType) {
				return myself.isRadioType(questionType) || myself.isCheckboxType(questionType);
			}
			
			this.isRadioType = function(questionType) {
				var pattern = /radioButton|radioButtonOther|rating4|rating5|rating10|gender|monitor/;
				return pattern.test(questionType);
			}
			
			this.isCheckboxType = function(questionType) {
				var pattern = /yesNo|checkBox|checkBoxOther/;
				return pattern.test(questionType);
			}			

			this.isSelectType = function(questionType) {
				var pattern = /dropDown/;
				return pattern.test(questionType);
			}

			this.doShowHide = function(elem) {
				var elemId = elem.attr("id");
				var elemQuestionId = elem.attr("name");
				var containersToHide=new Object();
				var containersToShow=new Object();						 													
				for(var i=0; i<concealedQuestions.length; i++) {
					var concealedQuestion = concealedQuestions[i];
					var concealedId;
					var questionId = concealedQuestion.questionId;
					if (myself.isMultipleAnswer(concealedQuestion.questionType)) {
						concealedId = concealedQuestion.answerId;
					} else {
						concealedId = questionId;					
					}		
					if (elemQuestionId == questionId) {
						if (concealedQuestion.showContainerId.length > 0) {
							var concealedElement=jquery("#" + concealedId);
							if (myself.isMultipleAnswer(concealedQuestion.questionType)) {
								if (concealedElement.prop("checked")) {
									containersToShow[concealedQuestion.showContainerId]=concealedQuestion.showContainerId;
									jquery("#"+concealedQuestion.showContainerId).show();
								} else {
									containersToHide[concealedQuestion.showContainerId]=concealedQuestion.showContainerId;
								}														
							} else  {
								if ( concealedElement.val() == concealedQuestion.answerValue ) {
									containersToShow[concealedQuestion.showContainerId]=concealedQuestion.showContainerId;
									jquery("#"+concealedQuestion.showContainerId).show();
								} else {
									containersToHide[concealedQuestion.showContainerId]=concealedQuestion.showContainerId;
								}
							}
						}
					}
				}
				for (containerHideId in containersToHide) {
					var shouldBeShown=false;
					if ( containersToShow[containerHideId] == null ) {
						jquery("#"+containerHideId).hide();
					}
				};						
			}
			
			this.updateShowHide = function() {
				var elem = jquery(this);
				myself.doShowHide(elem);
			}
			
		}
		
		function initShowHideform1152() {
			function loadjq(head) {
				script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = 'https://static.mailplus.nl/jq/jquery-3.6.0.min.js';
				head.appendChild(script);
			}
			
			function loadjqValidate(head) {
				script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = 'https://static.mailplus.nl/jq/jquery.validate.1.19.5.min.js';
				head.appendChild(script);
			}
			
			function loadjqUI(head) {
			 	script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = 'https://static.mailplus.nl/jq/ui/jquery-ui-1.13.2.custom.min.js';
				head.appendChild(script);
				  
				script = document.createElement('link');
				script.rel="stylesheet";
				script.href="https://static.mailplus.nl/jq/ui/jquery-ui-1.13.2.custom.min.css";
				script.type="text/css";
				head.appendChild(script);
			}
			
			var head = document.getElementsByTagName("head")[0];
			if (typeof jQuery == 'undefined') {
				loadjq(head);
				loadjqValidate(head);
				loadjqUI(head);
				setTimeout(function() {initShowHideform1152()}, 50);
				return;
			}

			if (!jQuery().validate) {
				loadjqValidate(head);
				setTimeout(function() {initShowHideform1152()}, 50);
			}
						
			

			function setFormLocationUrl() {
				try {
					var formLocationUrlElement = document.getElementById('formLocationUrl-form1152');
					if(formLocationUrlElement) {
						formLocationUrlElement.value = window.location.href;
					}
				} catch(e) {
					// do nothing
				}
			}
			
					jQuery.getJSON('https://m16.mailplus.nl/genericservice/code/servlet/React?callback=?', {
						command: 'getFormHtml',
						uid: '31300470',
						feid: 'Btc35nQVKx5ETCXGdP6C',
						p: 'https',
						om: 'd',
						of: 'h'
						
												
						
						 		 
					},
					function(data) {
						jQuery.each(data.html, function(i, item) {
							jQuery('#mpform1152').replaceWith(item);
							formValidateform1152();
							initFormABform1152();
							var sh = new ShowHideform1152();
							sh.init();
							setFormLocationUrl();
						});
					});
				
				
		}
		
		if (window.addEventListener) {
					window.addEventListener("load",initShowHideform1152,false);
				} else if (window.attachEvent) {
					window.attachEvent("onload",initShowHideform1152);
				}		
	
		