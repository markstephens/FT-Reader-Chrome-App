chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'width': 940,
    'height': 600
  });
});

var ft_reader = new FTReader();

// Get data on install
chrome.runtime.onInstalled.addListener(function() { 
	ft_reader.init(function(){
		ft_reader.refreshData();
	});
});


var sixAM = new Date();
sixAM.setHours(6);
sixAM.setMinutes(0);

// Update data every morning
chrome.alarms.create("morning", {
	when: sixAM.getTime(),
	periodInMinutes: (60 * 24)
});

chrome.alarms.onAlarm.addListener(function() {
	ft_reader.refreshData();
});

/*
 * Clean up when the app is closing
 chrome.runtime.onSuspend.addListener(function() { 
  // Do some simple clean-up tasks.
});
*/