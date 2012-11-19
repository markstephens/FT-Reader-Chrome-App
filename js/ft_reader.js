function FTReader(){

	this.api_key = "718b18d599d32fdfaa7f6619747d403e";
	this.api_url = "http://api.ft.com";
	this.articleHTML = [
		'<li data-id="**ID**">',
			'<h1><a href="**URL**">**TITLE**</a> <img src="images/speak.png" alt="" /></h1>',
			'<h2>**SUBHEAD**</h2>',
			'<p>**TEASER**</p>',
		'</li>'
	].join('');
	this.db = null;
}

FTReader.prototype.init = function(callback){
	if(typeof callback === "undefined") callback = function(){};

	var self = this,
		request = indexedDB.open("ftreader", 3);

	request.onerror = function(evt) {
	  console.log("Database error code: " + evt.target.errorCode);
	};

	request.onupgradeneeded = function(e) {
            console.log('onupgradeneeded', e);

            self.db = e.target.result;
            var db = self.db;

            if(!db.objectStoreNames.contains('articles')){
                    db.createObjectStore('articles', {keyPath: 'url', autoIncrement: true});
            }
    };

	request.onsuccess = function(e) {
            console.log('onsuccess', e);
            self.db = e.target.result;
            var db = self.db;

        	self.render();
        	callback();
    };
};

FTReader.prototype.refreshData = function(callback){
	if(typeof callback === "undefined") callback = function(){};

	var self = this;

	$.ajax({
		url: this.api_url + "/site/v1/pages/4c499f12-4e94-11de-8d4c-00144feabdc0/main-content?apiKey=" + this.api_key,
		cache: false,
		success: function(data){
			$.each(data.pageItems,function(i,article){
				self.addArticle(article);
			});

			chrome.storage.sync.set({ 'lastUpdate': (new Date()).toLocaleString() });
			callback();
		}
	});
};

FTReader.prototype.clearArticles = function() {
	var db = this.db;
	  var trans = db.transaction(["articles"], "readwrite");
	  var store = trans.objectStore("articles");

	  // Get everything in the store;
	  var keyRange = IDBKeyRange.lowerBound(0);
	  var cursorRequest = store.openCursor(keyRange);

	  cursorRequest.onsuccess = function(e) {
	    var result = e.target.result;
	    if(!!result == false)
	      return;

	  	store.delete(result.key);

	    result.continue();
	  };
};

FTReader.prototype.addArticle = function(article) {
	var transaction = this.db.transaction(["articles"], "readwrite");
	var objectStore = transaction.objectStore("articles");   

	var request = objectStore.get(article.location.uri);	

	// Article doesn't exist
	request.onsuccess = function(e){

		console.log(e.target.result);

		if(typeof e.target.result === "undefined"){
			console.log("undefined", e.target.result);

			objectStore.add({
			    "title": article.title.title,
			    "subhead": article.editorial.subheading,
			    "teaser": article.editorial.leadBody,
			    "url": article.location.uri,
			   	"timeStamp" : article.lifecycle.lastPublishDateTime
			  });
	}
	}
};

// Get saved data for display.
FTReader.prototype.render = function(){
	var self = this;
	var articles = [];

	$('section').html('<ul></ul>');

	$('section ul li a').live('click',function(event){
		event.preventDefault();
		document.querySelector('#webview').setAttribute('src', $(this).attr('href'));
		$('body webview').show();
	});

	$('section ul li img').live('click',function(event){
		var text = $(this).parent().parent().text();

		chrome.tts.isSpeaking(function(speaking){
			console.log('SPEAKING', speaking);

			if(speaking){
				chrome.tts.stop();
			}
			else {
				chrome.tts.speak(text, {'lang': 'en-GB' });
			}
		});
	});

	var db = self.db;
	  var trans = db.transaction(["articles"], "readwrite");
	  var store = trans.objectStore("articles");

	  // Get everything in the store;
	  var keyRange = IDBKeyRange.lowerBound(0);
	  var cursorRequest = store.openCursor(keyRange);

	  cursorRequest.onsuccess = function(e) {
	    var result = e.target.result;
	    if(!!result == false)
	      return;

	  var article = result.value;

	  	if($('section ul li[data-id='+article.url.replace(/\W+/g,'')+']').length === 0){
		    $('section ul').append(self.articleHTML
		    	.replace('**ID**',article.url.replace(/\W+/g,''))
		    	.replace('**URL**',article.url)
		    	.replace('**TITLE**',article.title)
		    	.replace('**SUBHEAD**',article.subhead)
		    	.replace('**TEASER**',article.teaser)
		    );
		}

	    result.continue();
	  };
};
