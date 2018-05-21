function BrowserGap(isContentScript, unittest) { //jshint ignore: line
    var isChrome = true; //jshint ignore: line
    var topSites = [];
    var history = [];
    var bookmarks;
    var otherBookmarks;

    function getTopSites(){
        return topSites;
    }

    function getBookmarks(){
        return bookmarks;
    }

    function getOtherBookmarks() {
        return otherBookmarks;
    }

    function refreshTopSites(){
        chrome.topSites.get(function(siteArr){
            topSites = siteArr;
        });
    }

    function getHistory() {
        return history;
    }
    function loadHistory() {
        var sinceMonthAgo = new Date().getTime() - 3024000000; //epoch of 35 days ago
        chrome.history.search({text: "", startTime: sinceMonthAgo, maxResults: 5000}, function(items) {
            history = items;
        });
    }

    function addNewTabListener(listener, preInit){
        chrome.runtime.onMessage.addListener(function ( msg, sender, response) {
            if(msg.newTab) {
                listener(msg, response);
            }
        });
        chrome.runtime.onMessage.removeListener(preInit);
    }

    function emitToMain(msg, callback){
        chrome.runtime.sendMessage(msg, callback);
    }

    function xhr(url, callback, err){
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function()
        {
          if(this.readyState === XMLHttpRequest.DONE )
          {
            if(this.status === 200){
                callback(this.responseText);
            } else {
                err(this.responseText);
            }
          }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

    function getLocalizedString(key, params)
    {
        return chrome.i18n.getMessage(key);
    }

    function onceOnline(callback) {
        if(!navigator.onLine){
            window.addEventListener("online", function(callback){
                window.removeEventListener("online", this);
                callback();
            }.bind(null,callback));
        }else {
            callback();
        }
    }

    function isOnline(){
        return navigator.onLine;
    }

    function getUILanguage(){
        return chrome.i18n.getUILanguage();
    }

    function getVer(){
        return chrome.runtime.getManifest().version;
    }

    function getStoreId(){
        return chrome.runtime.id || "";
    }

    function loadTrackingParams()
    {
        //TODO: move this logic to tracking js
        if(!localStorage.getItem('ctid'))
        {
            getInstallerClue("ctid", 0, function(ctid){
                localStorage.setItem('ctid', ctid);
            });
        }
        if(!localStorage.getItem('defbrows'))
        {
            getInstallerClue("defbrows", 0, function(defbrows){
                localStorage.setItem('defbrows', defbrows);
            });
        }
    }

    function getInstallerClue(clue, attempt, callback){
        var self = this;
        if(attempt >= extGlobal.constants.clueAttemptCount){
            console.log("giving up trying to find a clue");
            if(clue === "ctid"){
                callback(generateCTID());
            }
            if(clue === "defbrows"){
                callback("unk");
            }
            return false;
        }
        chrome.runtime.getPackageDirectoryEntry(function(directoryEntry) {
            var directoryReader = directoryEntry.createReader();
            // List of DirectoryEntry and/or FileEntry objects.
            var filenames = [];
            (function readNext() {
                directoryReader.readEntries(function(entries) {
                    if (entries.length) {
                        for (var i = 0; i < entries.length; ++i) {
                            filenames.push(entries[i].name);
                        }
                        readNext();
                    } else {
                        var clueFound = false;
                        var regexClue = new RegExp(clue);
                        for(var item = 0; item < filenames.length; item++){
                            if(regexClue.test(filenames[item])){
                                clueFound = true;
                                callback(filenames[item].replace(clue+"-", ""));
                            }
                        }
                        if(!clueFound){
                            console.log("no clue found. trying again: "+attempt+"/"+extGlobal.constants.clueAttemptCount);
                            setTimeout(getInstallerClue.bind(self, clue,  ++attempt, callback), extGlobal.constants.clueAttemptTimeout);
                        }
                    }
                });
            })();
        });
    }

    function generateCTID()
    {
        var strUUID= "";
        try
        {
            var timeSeed= ((new Date()).getTime()).toString();
            timeSeed= timeSeed.substr(timeSeed.length - 3);
            for (var seedOn= 0; seedOn < timeSeed; seedOn++){
                Math.random();
            }

            for (var charOn= 0; charOn < 32; charOn++)
            {
                var charCur= Math.floor(Math.random() * 36);
                if (charCur > 25){
                    charCur= String.fromCharCode(48 + charCur - 26);
                } else{
                    charCur= String.fromCharCode(65 + charCur);
                }

                strUUID += charCur;

                switch (charOn)
                {
                    case 7:
                    case 11:
                    case 15:
                    case 19:
                        strUUID += '-';
                        break;
                }
            }
        }
        catch (e)
        {
            console.log('BrowserGap.generateCTID error: ' + e.message);
        }
        return strUUID;
    }

    function getGDPRprivacyObject(){
        var rawBlacklist = extGlobal.browserGap.localStorage.getItem('sitesBlackList');
        var rawFavoriteSites = extGlobal.browserGap.localStorage.getItem('favoriteSites');
        var blacklist = [];
        var favoriteSites = [];
        var gdprObject = {};

        if (rawBlacklist !== null ){
            blacklist = JSON.parse(rawBlacklist);
        }
        gdprObject.sitesBlackList = blacklist;

        if (rawFavoriteSites !== null) {
            favoriteSites = JSON.parse(rawFavoriteSites);
            for (var i = 0; i < favoriteSites.length; i++) {
                delete favoriteSites[i].isFavorite;
            }
        }
        gdprObject.favoriteSites = favoriteSites;

        return gdprObject;
    }
    
    function init()
    {
        if (!chrome.topSites) { //when going to a URL then clicking back quickly, sometimes Chrome has a bug and does not have the topSites json object
            location.reload();
        } else {
            refreshTopSites();
            isContentScript? true: window.setInterval(refreshTopSites,extGlobal.constants.topSitesRefreshTime);
        }

        if (chrome.history) {
            loadHistory();
            isContentScript? true: window.setInterval(loadHistory, extGlobal.constants.historyRefreshTime);
        }
    }
    if(unittest){
        this.topSites = topSites;
        this.getTopSites = getTopSites;
        this.refreshTopSites = refreshTopSites;
        this.addNewTabListener = addNewTabListener;
        this.emitToMain = emitToMain;
        this.xhr = xhr;
        this.getLocalizedString = getLocalizedString;
        this.onceOnline = onceOnline;
        this.isOnline = isOnline;
        this.getUILanguage = getUILanguage;
        this.getVer = getVer;
        this.loadTrackingParams = loadTrackingParams;
        this.generateCTID = generateCTID;
        this.init = init;
        this.syncDataBrowserGapToUnitTestCase = function(){
            this.topSites = topSites;
        };
        this.syncDataUnitTestCaseToBrowserGap = function(){
            topSites = this.topSites;
            refreshTopSites = this.refreshTopSites; // jshint ignore: line
        };
        return this;
    }

    init();
    this.getTopSites = getTopSites;
    this.getHistory = getHistory;
    this.getBookmarks = getBookmarks;
    this.getOtherBookmarks = getOtherBookmarks;
    this.addNewTabListener = addNewTabListener;
    this.emitToMain = emitToMain;
    this.getLocalizedString = getLocalizedString;
    this.localStorage = window.localStorage;
    this.xhr = xhr;
    this.onceOnline = onceOnline;
    this.setTimeout = setTimeout;
    this.isOnline = isOnline;
    this.isChrome = true;
    this.getMarket = getUILanguage;
    this.getIntl = getUILanguage;
    this.getVer = getVer;
    this.getStoreId = getStoreId;
    this.loadTrackingParams = loadTrackingParams;
    this.getGDPRprivacyObject = getGDPRprivacyObject;
    return this;
}
