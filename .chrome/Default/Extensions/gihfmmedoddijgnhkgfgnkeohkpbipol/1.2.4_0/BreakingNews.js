function BreakingNews(unittest){ // jshint ignore: line
    var breakingNews = {};

    //get breaking news from specified url
    function getBreakingNews(callback) {
        var url = extGlobal.constants.bn_url;
        var result = function(responseText) {
            try {
                breakingNews = JSON.parse(responseText).gcm;
                callback(breakingNews);
            } catch (e) {
                console.error("Breaking News could not be parsed", e);
                callback({});
            }
        };
        var err = function(errCode){
            console.log("api call failed :( ");
            if(errCode >= 500) {
                console.error("server-side error...", errCode);
            }
            callback({});
        };
        if (url) {
            extGlobal.browserGap.xhr(url, result, err);
        }
     }

     function updateBreakingNews(breakingNews) {
        var currentBN = JSON.parse(extGlobal.browserGap.localStorage.getItem("breakingNews") || "{}");
        if (breakingNews) {
            breakingNews.receivedTime = parseInt(Date.now() / 1000);
            if (isBreaking(breakingNews) && (currentBN.uuid + "_" + currentBN.published_time) !== (breakingNews.uuid + "_" + breakingNews.published_time)) {
                extGlobal.browserGap.localStorage.setItem("breakingNews", JSON.stringify(breakingNews));
                extGlobal.browserGap.localStorage.removeItem("bnAlreadyShown");
            }
        }
    }

    function alreadyOpened(breakingNews) {
        var bnAlreadyOpened = extGlobal.browserGap.localStorage.getItem("bnAlreadyOpened") || "";
        return bnAlreadyOpened === (breakingNews.uuid + "_" + breakingNews.published_time);
    }

    /* isBreaking(breakingNews)
    *  is considered as breaking if the following conditions are met:
    *  - news contains the required fields
    *  - news is not older than the bnTimeLimit time limit (checks both on server and on browser)
    *  - news has not previously been opened
    */
    function isBreaking(breakingNews) {
        var timeOnBrowser = 0; //for a news we just received
        var timeOnServer = 0;
        var validNews = (breakingNews && breakingNews.title && breakingNews.summary && breakingNews.url && breakingNews.published_time && breakingNews.timestamp && breakingNews.uuid);
        if (breakingNews.published_time && breakingNews.timestamp) {
            timeOnServer = breakingNews.timestamp - breakingNews.published_time;
        }
        if (breakingNews.receivedTime) {
            timeOnBrowser = parseInt(Date.now() / 1000) - breakingNews.receivedTime;
        }
        return validNews && (timeOnServer < extGlobal.constants.bnTimeLimit && timeOnBrowser < extGlobal.constants.bnTimeLimit && !alreadyOpened(breakingNews));
    }

    function loadBreakingNews() {
        var breakingNews = JSON.parse(extGlobal.browserGap.localStorage.getItem("breakingNews") || "{}");
        if (!isBreaking(breakingNews)) {
            extGlobal.browserGap.localStorage.removeItem("breakingNews");
            breakingNews = null;
        }
        return breakingNews;
    }

    function init() {
        var distributionChannel;
        if (extGlobal.prefService) { //firefox
            distributionChannel = extGlobal.prefService.get(extGlobal.constants.distributionChannelPrefKey);
        } else if (extGlobal.distributionChannel) { //chrome
            distributionChannel = extGlobal.distributionChannel;
        } else {
            distributionChannel = extGlobal.constants.distributionDefaultChannel;
        }

        extGlobal.enableBN = typeof extGlobal.constants.bn_url !== "undefined" &&
                             typeof extGlobal.constants.distributionChannels[distributionChannel].breakingNewsFrCode !== "undefined" &&
                             extGlobal.constants.breakingNewsUI;

        if (!extGlobal.constants.bn_interval || !extGlobal.constants.bn_url || !extGlobal.enableBN) {
            return;
        }

        getBreakingNews(updateBreakingNews);
        if (extGlobal.bnInterval) {
            clearInterval(extGlobal.bnInterval);
        }
        extGlobal.bnInterval = setInterval(function() {
            getBreakingNews(updateBreakingNews);
        }, extGlobal.constants.bn_interval);
    }

    this.loadBreakingNews = loadBreakingNews;
    this.init = init;
    this.getBreakingNews = getBreakingNews;
    this.breakingNews = breakingNews;

    return this;
}