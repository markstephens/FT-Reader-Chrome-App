var ftreader;

$(document).ready(function(){

	chrome.storage.sync.get(null, function(data){
		$('#updated').text('Last updated: ' + data.lastUpdate);
	});

	$('#updated').ajaxStart(function(){ $(this).text('Updating...'); });
	$('#updated').ajaxError(function(){
		var elem = $(this);
		chrome.storage.sync.get(null, function(data){
			elem.text('Unable to update, using last version: ' + data.lastUpdate);
		});
	});

	ftreader = new FTReader();

	ftreader.init(function(){
		ftreader.refreshData(function(){
			chrome.storage.sync.get(null, function(data){
				$('#updated').text('Last updated: ' + data.lastUpdate);
			});

			ftreader.render();
		});	
	});
});
