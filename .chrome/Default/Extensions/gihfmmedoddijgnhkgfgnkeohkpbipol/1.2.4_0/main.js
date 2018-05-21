chrome.runtime.onMessage.addListener(preInit);
var extGlobal = {}; //jshint ignore: line
extGlobal.constants = new Constants();
extGlobal.browserGap = new BrowserGap();
extGlobal.photoManager = new PhotoManager();
extGlobal.trendingNow = new TrendingNow();
extGlobal.tracker = new Tracker();
extGlobal.tabs = chrome.tabs;
extGlobal.photoManager.init();

if (extGlobal.constants.weatherUI) {
    extGlobal.weather = new Weather();
    extGlobal.weather.init();
}
if (extGlobal.constants.sportsUI) {
    extGlobal.sports = new Sports();
    extGlobal.sports.init();
}
extGlobal.browserGap.loadTrackingParams();

chrome.runtime.setUninstallURL(extGlobal.constants.extensionUninstallUrl);

chrome.runtime.onSuspend.addListener(function() {
    if (extGlobal.constants.financeUI) {
        extGlobal.browserGap.localStorage.removeItem("financeWatchList");
    }
});

chrome.runtime.getPlatformInfo(function (platformInfo) { //setting the platform in extGlobal for further access
    extGlobal.platform = platformInfo ? platformInfo.os : "win"; //windows by default
});
initFirstRun();
fetchDistributionChannel();
extGlobal.trendingNow.init();

if (extGlobal.constants.breakingNewsUI) {
    extGlobal.breakingNews = new BreakingNews();
    extGlobal.breakingNews.init();
}

if (extGlobal.constants.financeUI) {
    extGlobal.finance = new Finance();
    extGlobal.finance.init();
}

extGlobal.browserGap.addNewTabListener(function(msg, response){
    if(msg.renderNewTab) {
        var newTabData = {};
        if (extGlobal.constants.weatherUI) {
            extGlobal.weather.refreshWeatherDataCache();
        }
        if (extGlobal.constants.sportsUI) {
            newTabData.sportsData = extGlobal.sports.loadSportsData();
            extGlobal.sports.refreshgameIDDataCache(true);
        }
        newTabData.backgroundPhoto = extGlobal.photoManager.getBackgroundPhoto();
        newTabData.topSites = extGlobal.browserGap.getTopSites();
        chrome.history ? newTabData.history = extGlobal.browserGap.getHistory() : null;
        newTabData.bookmarks = extGlobal.browserGap.getBookmarks();
        newTabData.otherBookmarks = extGlobal.browserGap.getOtherBookmarks();
        newTabData.distributionChannel = extGlobal.distributionChannel;
        newTabData.trendingNowData = extGlobal.browserGap.localStorage.getItem("trendingStories");
        if (extGlobal.constants.breakingNewsUI) {
            newTabData.breakingNews = extGlobal.breakingNews.loadBreakingNews();
        }
        newTabData.enableTN = extGlobal.enableTN; //breaking news takes over TN

        if (extGlobal.constants.financeUI) {
            newTabData.financeData = extGlobal.finance.loadFinanceData(); //shows last quote data from local storage
            extGlobal.finance.refreshFinanceData(true); //will refresh quotes shortly after tab opens ()
        }
        if (!extGlobal.browserGap.localStorage.getItem("firstTabCompleted") && extGlobal.platform === "win") {
            var now = new Date().getTime();
            var installTime = extGlobal.browserGap.localStorage.getItem("firstRunCompletedTime");
            if ((installTime && (now - installTime) / 86400000) < 1) {
                //in an update scenario, user doesn't have firstTabCompleted but firstRunCompletedTime is already old.
                //let's say that if firstRunCompletedTime is more than 1 day old, we don't display the first tab interstitial
                newTabData.firstTab = true;
            }
            extGlobal.browserGap.localStorage.setItem("firstTabCompleted", true);
        }

        response(newTabData);

    }
    if(msg.tracker){
        msg.beaconConfig.params.browser = extGlobal.constants.tracker_browser_chr;
        if(msg.pageInfo) {
            extGlobal.tracker.sendBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].chrome_space_id || extGlobal.constants.chrome_space_id, extGlobal.constants.tracker_page_info, msg.beaconConfig);
        }
        else if(msg.linkView){
              extGlobal.tracker.sendBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].chrome_space_id || extGlobal.constants.chrome_space_id, extGlobal.constants.tracker_link_view, msg.beaconConfig);
        }
        else {
            extGlobal.tracker.sendBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].chrome_space_id || extGlobal.constants.chrome_space_id, extGlobal.constants.tracker_click_info, msg.beaconConfig);
        }
    }

    if (msg.redirectTo && msg.site) {
        extGlobal.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0] && tabs[0].url === "chrome://newtab/") {
                chrome.tabs.update(tabs[0].id, {url: msg.site});
            }
        });
    }
    if (msg.addQuote && msg.symbol) {
        extGlobal.finance.addQuote(msg.symbol);
    }
    if (msg.deleteQuote && msg.symbol) {
        extGlobal.finance.deleteQuote(msg.symbol);
    }
    if (msg.watchListView) {
        extGlobal.finance.setView(msg.watchListView);
    }
    if (msg.logOut) {
        extGlobal.finance.logOut();
    }
}, preInit);


function preInit( msg, sender, response) {
    if(msg.newTab) {
        response(null);
    }
}

function setDistributionChannel() {
    var re = new RegExp(extGlobal.constants.chrome_ext_url_regexp),
        distribution_channel,
        distribution = {};
    extGlobal.tabs.query({"url": extGlobal.constants.chrome_ext_url_pattern}, function (tabs) {
        if (tabs && tabs[0] && tabs[0].url) {
            if (tabs[0].url.indexOf("?") > -1 && tabs[0].url.indexOf("src=") > -1) {
                distribution_channel = tabs[0].url.substring(tabs[0].url.indexOf("src=")+4, tabs[0].url.length).split("&")[0];
            }
        }
        distribution_channel = distribution_channel || extGlobal.constants.distributionDefaultChannel;
        distribution[extGlobal.constants.distributionChannelPrefKey] = distribution_channel;
        extGlobal.distributionChannel = distribution_channel;
        chrome.storage.sync.set(distribution, function() {
            return;
        });
    });
}

function fetchDistributionChannel() {
    extGlobal.distributionChannel = extGlobal.constants.distributionDefaultChannel;
    console.log(extGlobal.distributionChannel);
}

function isFirstRunCompleted()
{
    return JSON.parse(extGlobal.browserGap.localStorage.getItem("firstRunCompleted"));
}

function initFirstRun(){
    if(!isFirstRunCompleted()) {
        var now = new Date();
        extGlobal.browserGap.localStorage.setItem("firstRunCompleted", JSON.stringify(true));
        extGlobal.browserGap.localStorage.setItem("firstRunCompletedTime", JSON.stringify(now.getTime()));
        if(!extGlobal.browserGap.isOnline()) {
            extGlobal.browserGap.onceOnline(sendInstallPing);
        }else {
            sendInstallPing();
        }
    }
}

function sendInstallPing(){
    var beaconConfig = {};
    var beaconParams = {};
    beaconParams.itype = extGlobal.constants.tracker_install;
    beaconParams.browser = extGlobal.constants.tracker_browser_chr;
    beaconConfig.params = beaconParams;
    if (extGlobal.constants.breakingNewsUI) { //the breaking news
        beaconConfig.params.tn_enable = extGlobal.constants.tn_enable_value;
    }
    setTimeout(function() {
        extGlobal.tracker.sendBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].chrome_space_id || extGlobal.constants.chrome_space_id, extGlobal.constants.tracker_page_info, beaconConfig);
    }, 1000);
}

setTimeout(function() {
    extGlobal.tracker.initAlivePing(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].chrome_space_id || extGlobal.constants.chrome_space_id, extGlobal.constants.tracker_browser_chr);
}, 1000);


chrome.runtime.onConnect.addListener(function(port) {
    port.postMessage(extGlobal.browserGap.getGDPRprivacyObject());
    /*port.onMessage.addListener(function(msg) {
        // See other examples for sample onMessage handlers.
        console.log('onConnect->onMessage', msg);
    });*/
});

chrome.runtime.onConnectExternal.addListener(function(port) {
    port.postMessage(extGlobal.browserGap.getGDPRprivacyObject());
    /*port.onMessage.addListener(function(msg) {
      // See other examples for sample onMessage handlers.
      console.log('onConnectExternal->onMessage', msg);
    });*/
});


chrome.browserAction.onClicked.addListener(function(activeTab) {
    window.open('newtab.html','_blank');
});
