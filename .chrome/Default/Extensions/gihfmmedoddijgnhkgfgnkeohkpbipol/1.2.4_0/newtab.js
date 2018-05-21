extGlobal = {}; //jshint ignore: line
extGlobal.browserGap = new BrowserGap(true);
extGlobal.constants = new Constants();
extGlobal.siteConfig = new SiteConfig();

var msg = {
    newTab: true,
    renderNewTab: true,
    isOnline: navigator.onLine
};

var retryAttempts = 10;

var initNewTab = function (newTabData) {
    if (!newTabData && retryAttempts > 0) {
        setTimeout(function() {
            retryAttempts = retryAttempts - 1;
            extGlobal.browserGap.emitToMain(msg, initNewTab);
        }, 200);
    } else {
        if (extGlobal.browserGap.isFirefox) {
            extGlobal.browserGap.setLocalizedStrings(newTabData.localizedStrings);
            extGlobal.browserGap.market = newTabData.market;
        }
        if(extGlobal.browserGap.isSafari) {
            extGlobal.browserGap.market = newTabData.market;
        }
        extGlobal.distributionChannel = newTabData.distributionChannel || extGlobal.constants.distributionDefaultChannel;
        var viewRenderer = new ViewRenderer(newTabData);
        viewRenderer.render();
        var title = document.createElement("title");
        title.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_tab_title");
        document.body.appendChild(title);

        var form = document.getElementById("submitSearchNew");

        var searchBox = form.getElementsByTagName("input").item(0);
        searchBox.setAttribute("placeholder", extGlobal.browserGap.getLocalizedString("newtab_extension_search_box_label"));
        var frInput = document.createElement("input");
        var frValue = ((extGlobal.browserGap.isFirefox || extGlobal.browserGap.isWebExtension) ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].frCodeFirefox : (extGlobal.browserGap.isSafari ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].frCodeSafari : extGlobal.constants.distributionChannels[extGlobal.distributionChannel].frCodeChrome));
        frInput.setAttribute("type", "hidden");
        frInput.setAttribute("id", "fr");
        frInput.setAttribute("name", "fr");
        frInput.setAttribute("value", frValue);

        var typeInput = document.createElement("input");
        var typeParam = extGlobal.constants.distributionChannels[extGlobal.distributionChannel].typeParam ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].typeParam : extGlobal.constants.typeParam;
        typeInput.setAttribute("type", "hidden");
        typeInput.setAttribute("id", "type");
        typeInput.setAttribute("name", "type");
        typeInput.setAttribute("value", typeParam);

        form.appendChild(frInput);
        form.appendChild(typeInput);

        var searchSuggest = new SearchSuggest(newTabData);
        searchSuggest.init();

        if(extGlobal.browserGap.isSafari) {
            document.getElementById('searchBoxNew').focus();
        }

    }
};

if(extGlobal.browserGap.isSafari) {
    // When 'back' button is clicked, you have to explcitiy render the new tab in Safari
    window.addEventListener("popstate", function(){ extGlobal.browserGap.emitToMain(msg, initNewTab); }, false);

    // For Safari, add in fade-in transition and speed the blur filter for performance improvemnts
    document.getElementById('bg').setAttribute("class", "flexContainer bgImage fade-in");
    document.getElementById('uiBlur').setAttribute("class", "speedBlur");
    document.getElementById('mainContainer').setAttribute("class", "speedBlur");
}

extGlobal.browserGap.emitToMain(msg, initNewTab);
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

function SearchSuggest(newTabData, unittests){ // jshint ignore: line
    var suggIndex = extGlobal.constants.initialSuggestIndex,
        originalSearch = "",
        displayCount = extGlobal.constants.suggestionDisplayCount,
        displaySiteCount = extGlobal.constants.suggestionSitesCount,
        viewUtils = new ViewUtils(),
        searchSuggPath =  extGlobal.browserGap.getLocalizedString("newtab_extension_search_suggest_path"),
        searchSuggPathPart1 = unittests ? "part1?command=" : searchSuggPath.split("{")[0],
        searchSuggPathPart2 = unittests ? "&part2=" : searchSuggPath.split("}")[1],
        url = "https://" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_suggest_domain") + "/" +
            searchSuggPathPart1 + "{searchTerms}" + searchSuggPathPart2 + displayCount,
        searchBox = document.getElementById("searchBoxNew"),
        searchSuggestContainer = document.querySelector(".searchSuggestContainerNew"),
        topSitesContainer = document.querySelector(".newTopSitesContainer"),
        submitSearch = document.getElementById("submitSearchNew"),
        uiBlurTop = document.getElementById("uiBlur"),
        previousInput = "",
        suggestWebSite = false,
        suggestWebSiteUrl = "",
        domainRegexp = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/,
        protocolRegexp = /^(https?|ftp):\/\//,
        ctrlEnterMap = {},
        isNavigate = false;
        ctrlEnterMap[extGlobal.constants.keycode_control] = false;
        ctrlEnterMap[extGlobal.constants.keycode_enter] = false;

    function init(){
        searchBox.onkeydown = handleKeyDown;
        searchBox.onkeyup = handleKeyUp;
        submitSearch.addEventListener('submit',submitForm,true);

        // handling resizing for blur effect on autosuggest box
        if (window.addEventListener) {
            window.addEventListener('resize', function() {
                viewUtils.clipToElement("#uiBlur", document.querySelector("#searchSuggestContainerNew"));
            });

            window.addEventListener('click', function(e) {
                if (searchBox.value !== "" && e.target.parentNode && e.target.parentNode.id !== "submitSearchNew" && (e.target.parentNode.className || "").indexOf("suggestion") === -1) {
                    // if user clicks out of search bar or autosuggest when there is a query, we want to hide the autosuggest
                    hideSuggestions();
                    uiBlurTop.style.visibility = "hidden";
                } else if (searchBox.value !== "") {
                    suggestResults(searchBox.value, 'click');
                }
            });
            window.addEventListener('mousedown', function(e) { //on any click in the window we need to apply any auto complete that was pending
                applyAutoComplete();
                if (e.target.getAttribute("id") && e.target.getAttribute("id").indexOf("searchBoxAutoComplete") > -1) {
                    setTimeout(function() {
                        searchBox.focus();
                    }, 50);
                }
            });
        }
    }

    function clearAutoComplete() {
        return autoComplete("", "");
    }

    function autoComplete(startString, endString) {
        var autoCompleteStart = document.getElementById("searchBoxAutoCompleteStart"),
            autoCompleteEnd = document.getElementById("searchBoxAutoCompleteEnd"),
            autoCompleteDiv = document.getElementById("searchBoxAutoComplete");
        if (endString !== "") {
            autoCompleteDiv.style.visibility = "visible";
        }

        if (autoCompleteStart && autoCompleteStart.textContent !== startString && autoCompleteEnd && autoCompleteEnd.textContent !== endString) {
            autoCompleteStart.textContent = startString;
            autoCompleteEnd.textContent = endString;
            return true;
        } else {
            return false;
        }
    }

    function applyAutoComplete() {
        var autoCompleteStart = document.getElementById("searchBoxAutoCompleteStart"),
            autoCompleteEnd = document.getElementById("searchBoxAutoCompleteEnd"),
            autoCompleteDiv = document.getElementById("searchBoxAutoComplete");
        if (autoCompleteStart && autoCompleteEnd && (autoCompleteStart.textContent.length > 0 || autoCompleteEnd.textContent.length > 0)) {
            searchBox.value = autoCompleteStart.textContent + autoCompleteEnd.textContent;
            clearAutoComplete();
            autoCompleteDiv.style.visibility = "hidden";
            return true;
        }
        return false;
    }


    function suggestResults(searchTerms, origin){
        var possibleWebSite = [],
            userSites = newTabData.topSites.concat(newTabData.history),
            urlMap = {};

        clearAutoComplete();
        isNavigate = false;
        searchBox.classList.remove("suggWebSite");

        var suggestions = [],
            suggestUrl = url.replace("{searchTerms}", encodeURIComponent(searchTerms)),
            self = this;
        self.searchTerms = searchTerms;
        var stateChange = (function (responseText){
            if(searchBox.value === ""){
                hideSuggestions();
            } else if(this.searchTerms === searchBox.value || this.searchTerms === previousInput) {
                suggIndex = extGlobal.constants.initialSuggestIndex;
                suggestions = formatResults(responseText);
                renderSuggestions(suggestions, possibleWebSite, searchSuggestContainer, displayCount);
            }
        }).bind(self);
        extGlobal.browserGap.xhr(suggestUrl, stateChange, null);
        previousInput = searchTerms;

    }

    function hideSuggestions() {
        viewUtils.hideElement(searchSuggestContainer);
        viewUtils.unhideElement(topSitesContainer);
        while (searchSuggestContainer.firstChild) { //removing all suggestions as event listeners are attached to them
            searchSuggestContainer.removeChild(searchSuggestContainer.firstChild);
        }
        uiBlurTop.style.visibility = "hidden";
    }

    function formatResults(responseText){
        var results = JSON.parse(responseText);
        var suggestions = [];
        if(results.r){
            //results are in the alt format
            for(var i = 0; i < results.r.length; i++){
                suggestions.push(results.r[i].k);
            }
        }else{
            //results are in standard format
            suggestions = results[1];
        }
        return suggestions;
    }

    function setMouseOver (div, i) {
        div.onmouseover = handleMouseHover.bind(null, i);
    }

    function renderSuggestions(suggestions, possibleSite, parentElement, displayCount) {
        var cssBlur = new CssGenerator("viewRenderer", true);
        var searchBox = document.getElementById("searchBoxNew") || {};
        var searchTerm = searchBox.value || "";
        if(suggestions.length > 0 || possibleSite.length > 0){
            viewUtils.unhideElement(searchSuggestContainer);
            viewUtils.clearInnerHTML(parentElement);

            var numberSites = possibleSite ? (possibleSite.length <= displaySiteCount ? possibleSite.length : displaySiteCount) : 0;
            for (var k=0;k<numberSites;k++) { //top site suggestions - only for new UI
                var siteSuggestDiv = document.createElement("div");
                var siteSuggestText = document.createElement("div");
                var siteSuggestTextBold = document.createElement("span");
                var siteSuggestTextNormal = document.createElement("span");
                var siteSuggestTextTitle = document.createElement("span"); //title of the URL, if any

                //if the mouse is already hovering we don't want the selection to be immediately selected
                //so we'll only bind the mouseover function 50ms after rendering to avoid such behavior
                setTimeout(setMouseOver.bind(null, siteSuggestDiv, k), 50);

                siteSuggestDiv.onmouseout = handleMouseOut.bind(null);
                siteSuggestDiv.addEventListener("click", navToUserSite.bind(null, possibleSite[k].url));

                siteSuggestDiv.setAttribute("class","suggestion userSite");
                siteSuggestText.setAttribute("class","suggestionText");
                siteSuggestTextNormal.setAttribute("class", "siteSuggestUrl");

                siteSuggestTextNormal.textContent = possibleSite[k].url.charAt(possibleSite[k].url.length -1) === "/" ? possibleSite[k].url.slice(0, -1) : possibleSite[k].url;
                siteSuggestText.appendChild(siteSuggestTextNormal);

                siteSuggestDiv.appendChild(siteSuggestText);
                parentElement.appendChild(siteSuggestDiv);

            }
            var numberOfSuggestions = (suggestions.length < displayCount ? suggestions.length : displayCount) - numberSites;
            for(var i=0; i<numberOfSuggestions; i++){
                var searchSuggestDiv = document.createElement("div");
                var searchSuggestText = document.createElement("div");
                var searchSuggestTextBold = document.createElement("span");
                var searchSuggestTextNormal = document.createElement("span");

                //if the mouse is already hovering we don't want the selection to be immediately selected
                //so we'll only bind the mouseover function 50ms after rendering to avoid such behavior
                setTimeout(setMouseOver.bind(null, searchSuggestDiv, i + numberSites), 50);
                searchSuggestDiv.onmouseout = handleMouseOut.bind(null);
                searchSuggestDiv.addEventListener("click", navToSearch.bind(null, suggestions[i]));
                searchSuggestDiv.setAttribute("class","suggestion");
                searchSuggestText.setAttribute("class","suggestionText");
                if (suggestions[i].substring(0, searchTerm.length).toLowerCase() === searchTerm.toLowerCase()) {
                    searchSuggestTextNormal.textContent = suggestions[i].substring(0, searchTerm.length);
                    searchSuggestTextBold.textContent = suggestions[i].substring(searchTerm.length, suggestions[i].length);
                    searchSuggestTextBold.setAttribute("class", "bold");
                    searchSuggestText.appendChild(searchSuggestTextNormal);
                    searchSuggestText.appendChild(searchSuggestTextBold);
                } else { //sometimes suggestion does not match query, ex: query=lalala and suggestion=la la la la - so no bolding in that case
                    searchSuggestTextNormal.textContent = suggestions[i];
                    searchSuggestText.appendChild(searchSuggestTextNormal);
                }

                searchSuggestDiv.appendChild(searchSuggestText);
                parentElement.appendChild(searchSuggestDiv);

            }
            searchSuggestContainer.onmouseout = restoreOriginalSearch.bind(null, searchTerm);
            var uiBlur = document.getElementById("uiBlur");
            var bgImage = document.getElementById("bg");
            document.getElementById("uiBlur").style.visibility = "visible";
            viewUtils.clipToElement("#uiBlur", document.querySelector("#searchSuggestContainerNew"));
            uiBlur.setAttribute("class", "bgImage");
        } else{
            hideSuggestions();
        }
    }

    function navToUserSite(url, event) { // called when user clicks on a user site suggestion.
        suggestWebSite = true;
        suggestWebSiteUrl = url;

        event.stopPropagation(); //we don't want this click to trigger a refresh of suggestions
        submitForm(document.createEvent('Event'));
    }

    function navToSearch(suggestion, event){
        var url = viewUtils.getSearchUrl(suggestion);
        /*Send a click tracking ping for a search submitted through the newtab page search suggestions*/
        var beaconConfig = {};
        var beaconParams = {};
        beaconParams.sec = searchSuggestContainer.getAttribute("id");
        beaconParams.slk = extGlobal.constants.tracker_searchArea_slk_search_suggestion;
        beaconParams.tar = url;
        beaconParams.gpos = extGlobal.constants.tracker_gpos_search_box;
        beaconParams._p = extGlobal.constants.tracker_searchArea_p_search_suggestion;
        beaconConfig.params = beaconParams;
        extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});

        event.stopPropagation(); //we don't want this click to trigger a refresh of suggestions
        navigate(url);
        if(unittests){
            return url;
        }
    }

    function submitForm(event){
        var beaconConfig = {};
        var beaconParams = {};
        var searchBox = document.getElementById("searchBoxNew");

        //block default submit behavior
        event.preventDefault();

        if (suggestWebSite && suggestWebSiteUrl.length > 0) {
            beaconParams.sec = searchBox.getAttribute("id");
            beaconParams.slk = extGlobal.constants.tracker_searchArea_slk_search_box;
            beaconParams.tar = suggestWebSiteUrl;
            beaconParams.gpos = extGlobal.constants.tracker_gpos_search_box;
            beaconParams._p = extGlobal.constants.tracker_searchArea_p_search_box;
            beaconConfig.params = beaconParams;
            extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
            navigate(suggestWebSiteUrl);
        } else if (searchBox.value.length > 0) {
            hideSuggestions();
            viewUtils.unhideElement(topSitesContainer);
            var url;
            if (/http(s)?:\/\//.test(searchBox.value)){
                url = searchBox.value;
            } else {
                url = viewUtils.getSearchUrl(searchBox.value);
            }
            /*Send a click tracking ping for a search submitted through the newtab page search box*/
            /*We need to send searchBox type of tracking ping here*/
            if(originalSearch === searchBox.value){
                beaconParams.sec = searchBox.getAttribute("id");
                beaconParams.slk = extGlobal.constants.tracker_searchArea_slk_search_box;
                beaconParams.tar = url;
                beaconParams.gpos = extGlobal.constants.tracker_gpos_search_box;
                beaconParams._p = extGlobal.constants.tracker_searchArea_p_search_box;
            }
            /*We need to send search suggest type of tracking ping here*/
            else{
                beaconParams.sec = searchSuggestContainer.getAttribute("id");
                beaconParams.slk = extGlobal.constants.tracker_searchArea_slk_search_suggestion;
                beaconParams.tar = url;
                beaconParams.gpos = extGlobal.constants.tracker_gpos_search_box;
                beaconParams._p = extGlobal.constants.tracker_searchArea_p_search_suggestion;
            }
            beaconConfig.params = beaconParams;
            extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});

            navigate(url);
            if(unittests){
                return url;
            }
        }
    }

    function handleMouseHover(index){
        var suggIndex = index;
        searchBox.classList.remove("suggWebSite");
        suggestWebSite = false; //suggest top site could be true immediately after the user types the beginning of a top site, but goes off when user hovers on a search suggestion
        highlightSuggestion(index);
        clearAutoComplete();
        if(unittests){
            return suggIndex;
        }
    }

    function handleMouseOut(e){
        suggIndex = -1;
        clearHighlightSuggestion();

        if(unittests){
            return suggIndex;
        }
    }

    function restoreOriginalSearch(originalValue, event) { //when user hovers out of the whole suggestions panel, we want to show back the original search
        var toElement = event.toElement ? event.toElement : (event.relatedTarget ? event.relatedTarget : null);
        if (!isNavigate && //when user is searching the suggestion panel is removed so  the mouse is throwing a "mouseout" event, but in that case we don't want to restore the original search
            toElement &&
            toElement.className !== "searchSuggestContainerNew" &&
            toElement.className !== "suggestionText" &&
            toElement.className !== "siteSuggestUrl") {

            searchBox.value = originalValue;
        }
    }

    function handleKeyDown(e){
        var len = this.value.length,
            cursorPos;
        if (e.which === extGlobal.constants.keycode_up || e.which === extGlobal.constants.keycode_down ||
            e.which === extGlobal.constants.keycode_enter || e.which === extGlobal.constants.keycode_control ||
            e.which === extGlobal.constants.keycode_command_l || e.which === extGlobal.constants.keycode_command_r ||
            e.which === extGlobal.constants.keycode_left || e.which === extGlobal.constants.keycode_right) {
            cursorPos = searchBox.value.length;
            if (applyAutoComplete() && e.which === extGlobal.constants.keycode_left) { //if user clicked left the focus should be exactly at the beginning of the previous selection
                this.setSelectionRange(cursorPos, cursorPos+1);
            }
        }
        switch(e.which){
            case extGlobal.constants.keycode_up:
                this.setSelectionRange(len, len);
                e.preventDefault();
                highlightSuggestion(changeHighlight(-1));
                searchBox.classList.remove("suggWebSite");
                suggestWebSite = false; //suggest top site could be true immediately after the user types the beginning of a top site, but goes off when user moves up or down to the search suggestions
                break;
            case extGlobal.constants.keycode_down:
                this.setSelectionRange(len, len);
                e.preventDefault();
                highlightSuggestion(changeHighlight(1));
                searchBox.classList.remove("suggWebSite");
                suggestWebSite = false; //suggest top site could be true immediately after the user types the beginning of a top site, but goes off when user moves up or down to the search suggestions
                break;
            case extGlobal.constants.keycode_control:
                ctrlEnterMap[e.which] = true;
                break;
            case extGlobal.constants.keycode_enter:
                ctrlEnterMap[e.which] = true;
                break;
            case extGlobal.constants.keycode_delete:
                if (clearAutoComplete()) {
                    searchBox.value = searchBox.value + searchBox.value.charAt(searchBox.value.length-1);
                }
        }
        if (ctrlEnterMap[extGlobal.constants.keycode_control] && ctrlEnterMap[extGlobal.constants.keycode_enter]) {
            document.getElementById("searchBoxNew").value = "http://" + document.getElementById("searchBoxNew").value + ".com";
        }
    }

    function handleKeyUp(e) {
        if (e.keyCode in ctrlEnterMap) {
            ctrlEnterMap[e.keyCode] = false;
        }
    }

    function highlightSuggestion(index){
        clearHighlightSuggestion();
        if(index >= 0){ //'highlighting' the search box is index -1
            var sugg = document.getElementsByClassName("suggestionText")[index];
            sugg.classList.add("suggSelNew");
            searchBox.value = sugg.getElementsByClassName("siteSuggestUrl")[0] ? sugg.getElementsByClassName("siteSuggestUrl")[0].textContent : sugg.textContent;
        }else{
            searchBox.focus();
        }
    }

    function clearHighlightSuggestion(){
        var suggestions = document.getElementsByClassName("suggSelNew"),
            i;
        for(i = 0; i < suggestions.length; i++){
            suggestions[i].classList.remove("suggSelNew");
        }
    }

    function changeHighlight(delta){
        var len = document.getElementsByClassName("suggestionText").length;
        suggIndex += delta;
        if(suggIndex < -1){
            suggIndex = len-1;
        }
        if(suggIndex >= len){
            suggIndex = -1;
        }
        if(suggIndex === -1){
            document.getElementById("searchBoxNew").value = originalSearch;
        }
        return suggIndex;
    }

    function navigate(url){
        isNavigate = true;
        viewUtils.hideElement(searchSuggestContainer);
        uiBlurTop.style.visibility = "hidden";
        window.location = url;
    }

    searchBox.oninput = function(e) {
        originalSearch = this.value;
        suggestResults(searchBox.value, 'input');
    };

    /* jshint ignore: start */
    if(unittests){
        this.suggestResults = suggestResults;
        this.formatResults = formatResults;
        this.renderSuggestions = renderSuggestions;
        this.navToSearch = navToSearch;
        this.submitForm = submitForm;
        this.highlightSuggestion = highlightSuggestion;
        this.clearHighlightSuggestion = clearHighlightSuggestion;
        this.changeHighlight = changeHighlight;
        this.handleMouseHover = handleMouseHover;
        this.handleMouseOut = handleMouseOut;
        this.handleKeyDown = handleKeyDown;
        this.handleKeyUp = handleKeyUp;
        this.suggIndex = suggIndex;
        this.navigate = navigate;

        this.injectFunctions = function(){
            highlightSuggestion = this.highlightSuggestion;
            clearHighlightSuggestion = this.clearHighlightSuggestion;
            changeHighlight = this.changeHighlight;
            navigate = this.navigate;
        }
    }
    /* jshint ignore: end */

    this.init = init;
    return this;
}
function CssGenerator(id, autoGenerate, unittests){ //jshint ignore: line
    var styleElement = document.getElementById(id);
    var css = {};

    function init(){
        if(!styleElement){
            styleElement = document.createElement("style");
            styleElement.setAttribute("id", id);

            document.querySelector("head").appendChild(styleElement);
        }
    }

    function addSelector(selector, keys){
        css[selector] = {
            keys: keys
        };
        if(autoGenerate){
            generateCss();
        }
    }

    function editSelectorKeyValue(selector, key, value){
        css[selector].keys[key] = value;
        if(autoGenerate){
            generateCss();
        }
    }

    function removeSelector(selector){
        delete css[selector];
        if(autoGenerate){
            generateCss();
        }
    }

    function generateCss(){
        var result ="";
        for(var selector in css){
            if (css.hasOwnProperty(selector)) {
                result += selector+"{";
                for(var key in css[selector].keys){
                    if (css[selector].keys.hasOwnProperty(key)) {
                        result += key+': '+css[selector].keys[key]+';';
                    }
                }
                result += "}";
            }
        }
        styleElement.innerHTML = result;
    }

    this.addSelector = addSelector;
    this.editSelectorKeyValue = editSelectorKeyValue;
    this.removeSelector = removeSelector;
    this.generateCss = generateCss;
    this.init = init;
    if(unittests){
        this.css = css;
        this.styleElement = styleElement;
        this.syncData = function(){
            css = this.css;
            styleElement = this.styleElement;
            console.log(css);
        };
    }
    return this;
}

function ViewRenderer(newTabData, unittest) { //jshint ignore: line
    var viewUtils = new ViewUtils();
    var currSitesPerRow = 0;
    var maxTitleLength = 20;
    var showFullImage = false;
    var maxSites = 9;
    var offlinePhotosIdx;

    var css = new CssGenerator("viewRenderer", true);
    css.init();
    var cssBlur = new CssGenerator("blur", true);
    var sitesBlackList;
    var editModeToggle = true;
    var isEditModeOn = false;
    cssBlur.init();
    var frValue = (extGlobal.browserGap.isFirefox || extGlobal.browserGap.isWebExtension ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].frCodeFirefox : (extGlobal.browserGap.isSafari ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].frCodeSafari : extGlobal.constants.distributionChannels[extGlobal.distributionChannel].frCodeChrome));
    var typeParam = extGlobal.constants.distributionChannels[extGlobal.distributionChannel].typeParam ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].typeParam : extGlobal.constants.typeParam;
    var partners = [
        {
            title: "Yahoo",
            url: "https://www.yahoo.com?fr=" + frValue + "&type=" + typeParam,
            position: "left"
        }
    ];

    var partnerUrls = [];
    var defaultUrls = [];
    var defaultSitesText = [];
    var subDomainBlackList = ["www","corp"];

    var colorList = ["#C77F24", "#CB5A5C", "#740919", "#632016", "#A53A14", "#BB6550", "#C6AA9B", "#9A9363", "#845E19"]; //Alice Through the Looking Glass palette

    //Navigate to a site
    function navToSite(site, siteDivId, siteTitle){
        //Track the click on the topsite
        if(!isEditModeOn)
        {
            //hideUrl();
            var beaconConfig = {};
            var beaconParams = {};
            if (site.indexOf("http://") === -1 && site.indexOf("https://") === -1) {
                site = "http://" + site;
            }
            beaconParams.sec = siteDivId;
            beaconParams.slk = siteTitle;
            beaconParams.tar = site;
            beaconParams.gpos = extGlobal.constants.tracker_gpos_topsites;
            beaconParams._p = siteDivId.split("_")[1];
            beaconConfig.params = beaconParams;
            console.log("Tracker: emitting to main");
            extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});

            redirectTo(site);
        }
    }

    //Redirect to a site
    function redirectTo(site){
        window.location = site;
    }

    function backgroundRedirectTo(site){
        extGlobal.browserGap.emitToMain({newTab: true, redirectTo: true, site: site});
    }

    //helper to trim a long string
    function shortenString(str, maxLength){
        if(str && str.length > maxLength) {
            str = str.slice(0, maxLength).trimRight();
            if (str[maxLength-1] !== ".") {
                str = str+"...";
            }
        }
        return str || "";
    }

    //If some argument newTabData misses some information, will set a default value for them
    async function populateMissingData(newTabData){
        offlinePhotosIdx = await extGlobal.browserGap.localStorage.getItem("offlinePhotosIdx") || 0;
        if(newTabData === null || typeof(newTabData) === "undefined") {
            newTabData = {};
        }
        if(typeof(newTabData.backgroundPhoto) === "undefined" && (extGlobal.browserGap.isChrome || extGlobal.browserGap.isSafari)) {
            newTabData.backgroundPhoto = extGlobal.constants.offlinePhotos[offlinePhotosIdx++];
            offlinePhotosIdx = offlinePhotosIdx%extGlobal.constants.offlinePhotos.length;
            extGlobal.browserGap.localStorage.setItem("offlinePhotosIdx", offlinePhotosIdx);
        }
        if(typeof(newTabData.topSites) === "undefined") {
            newTabData.topSites = [];
        }
        return newTabData;
    }

    function resizeRightPanelBlur(){
        /*clip finance panel*/
        var elmt;
        if(extGlobal.constants.financeUI){
            elmt = document.getElementById("financePanel");
        } else {
            elmt = document.getElementById("sportsPanel");
        }

        var blur = document.getElementById("rightPanelBlur");
        var crdts = elmt.offsetLeft-(elmt.offsetWidth/6)-7; /*-7 is for blur should be look like a layer behind the finance panel*/
        var params = [0, screen.width, screen.height, crdts];
        var clip = { clip: "rect("+params.join("px,")+")" };
        css.addSelector("#rightPanelBlur", clip);
    }

    //Render background image;
    function renderBackground(){
        var imageBackground = document.getElementById("bg");
        var source = "";
        if(newTabData.backgroundPhoto){
            source = newTabData.backgroundPhoto.url_k || newTabData.backgroundPhoto.url_l || newTabData.backgroundPhoto.url_m;
            var readyStateCheckInterval = setInterval(function() {
            if (document.readyState === "complete") {
                clearInterval(readyStateCheckInterval);
                css.addSelector(".bgImage", {"background-image": "url("+source+")"});
            }
        }, 10);
        }else {
            imageBackground.setAttribute("class", imageBackground.getAttribute("class")+" offlineBG");
        }
    }

    //display (and link) the owner of the background image
    function renderOwnerData(){
        if(newTabData.backgroundPhoto && newTabData.backgroundPhoto.ownername){
            var ownerLink = document.getElementById("ownerName");
            var onFlickr = document.getElementById("onFlickr");

            onFlickr.setAttribute("href", "https://flickr.com");
            ownerLink.setAttribute("href", "https://flickr.com/photos/"+newTabData.backgroundPhoto.owner);

            onFlickr.onclick = function(){
                var beaconConfig = {};
                var beaconParams = {};
                beaconParams.sec = onFlickr.getAttribute("id");
                beaconParams.slk = onFlickr.getAttribute("id"); // Ideally slk should contain the ui text, but we are doing this hack as FLickr is an svg here.
                beaconParams.tar = onFlickr.getAttribute("href");
                beaconParams.gpos = extGlobal.constants.tracker_gpos_flickr;
                beaconParams._p = extGlobal.constants.tracker_flickrArea_p_flickrlogo;
                beaconConfig.params = beaconParams;
                extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
            };
            ownerLink.onclick = function() {
                var beaconConfig = {};
                var beaconParams = {};
                beaconParams.sec = ownerLink.getAttribute("id");
                beaconParams.slk = "flickrOwnerLink";
                beaconParams.tar = ownerLink.getAttribute("href");
                beaconParams.gpos = extGlobal.constants.tracker_gpos_flickr;
                beaconParams._p = extGlobal.constants.tracker_flickrArea_p_owner;
                beaconConfig.params = beaconParams;
                extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
            };

            var photoLabel = newTabData.backgroundPhoto.ownername;
            ownerLink.textContent = photoLabel;
            onFlickr.textContent = " " + extGlobal.browserGap.getLocalizedString("newtab_extension_on_flickr") + " ";

            appendFlickrLogo(onFlickr);
        }
    }

    function toggleTN () {
        var aTN = document.getElementById("toggleTN"),
            trendingDiv = document.getElementById("searchTrendingNowContainer");
        if (trendingDiv.style.display !== "none") {
            trendingDiv.style.display = "none";
            extGlobal.browserGap.localStorage.setItem("trendingBar", "hidden");
            aTN.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_tn");
        } else {
            trendingDiv.style.display = "block";
            extGlobal.browserGap.localStorage.setItem("trendingBar", "visible");
            aTN.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_hide_tn");
        }
    }

    async function toggleBN () {
        var aBN = document.getElementById("toggleBN");
        var breakingNewsBar = await extGlobal.browserGap.localStorage.getItem("breakingNewsBar");
        if (breakingNewsBar !== "hidden") {
            extGlobal.browserGap.localStorage.setItem("breakingNewsBar", "hidden");
            aBN.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_bn");
            var breakingNewsDiv = document.getElementById("breakingNewsDiv");
            if (breakingNewsDiv) {
                breakingNewsDiv.parentNode.removeChild(breakingNewsDiv);
            }
        } else {
            extGlobal.browserGap.localStorage.setItem("breakingNewsBar", "visible");
            aBN.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_hide_bn");
            var trendingNowContainer = document.getElementById("searchTrendingNowContainer");
            while (trendingNowContainer && trendingNowContainer.hasChildNodes()) { //we want to display BN, but first need to remove any potential trending news (we just display 1 of them)
                trendingNowContainer.removeChild(trendingNowContainer.lastChild);
            }
            document.getElementById("tnDiv").classList.add("displayNone"); //hiding the trending now option also (it will be put back in renderTrendingNow() if needs to)
            document.getElementById("tnDivider").classList.add("displayNone");
        }
        //calling again both functions (which will sort out themselves which one to display based on new settings)
        renderBreakingNews();
        renderTrendingNow();
    }

    async function renderBreakingNews() {
        var breakingNewsBar = await extGlobal.browserGap.localStorage.getItem("breakingNewsBar");
        if (newTabData.breakingNews && breakingNewsBar !== "hidden") {
            var frCode = extGlobal.constants.distributionChannels[extGlobal.distributionChannel].breakingNewsFrCode ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].breakingNewsFrCode : extGlobal.constants.breakingNewsFrCode;
            var topBar = document.getElementById("topBar");
            var breakingNewsDiv = document.createElement("div");
            var breakingNewsLabel = document.createElement("span");
            var breakingNewsTitle = document.createElement("span");
            var breakingNewsUrl =  newTabData.breakingNews.url + (newTabData.breakingNews.url.indexOf("?") > -1 ? "&fr=" : "?fr=") + frCode;
            var bnAlreadyShownS = await extGlobal.browserGap.localStorage.getItem("bnAlreadyShown") || "{}";
            var bnAlreadyShown = JSON.parse(bnAlreadyShownS); //number of times that this specific news was displayed
            var uniqueId = viewUtils.getBNUniqueId(newTabData.breakingNews);

            breakingNewsDiv.setAttribute("id", "breakingNewsDiv");
            breakingNewsLabel.textContent = "BREAKING NEWS    ";
            breakingNewsTitle.textContent = viewUtils.stripHtml(newTabData.breakingNews.title);
            breakingNewsDiv.appendChild(breakingNewsLabel);
            breakingNewsDiv.appendChild(breakingNewsTitle);
            topBar.appendChild(breakingNewsDiv);
            bnAlreadyShown[uniqueId] = bnAlreadyShown[uniqueId] ? bnAlreadyShown[uniqueId] + 1 : 1;
            extGlobal.browserGap.localStorage.setItem("bnAlreadyShown", JSON.stringify(bnAlreadyShown));

            breakingNewsDiv.addEventListener("click", function(e) {
                sendBnClickBeacon(newTabData.breakingNews, breakingNewsUrl);
                extGlobal.browserGap.localStorage.setItem("bnAlreadyOpened", uniqueId);
                redirectTo(breakingNewsUrl);
            });
        }

        if (extGlobal.constants.breakingNewsUI) { //if the BN feature is enabled for this extension, we show the option to disable it
            var bnDiv = document.getElementById("bnDiv");
            var bnDivider = document.getElementById("bnDivider");

            bnDiv.classList.remove("displayNone");
            bnDivider.classList.remove("displayNone");

            //add Hide Breaking News option in menu
            if (breakingNewsBar === "hidden") {
                addBNMenu(extGlobal.browserGap.getLocalizedString("newtab_extension_show_bn"));
            } else {
                addBNMenu(extGlobal.browserGap.getLocalizedString("newtab_extension_hide_bn"));
            }
        }


    }

    async function renderTrendingNow() {
        var enableTN = newTabData.enableTN || false;
        var winWidth = window.innerWidth || 0;
        var tnLabelWidth = 0;
        var tnWrapperWidth = 0;
        var tnItems = [];
        var tnItemsWidth = [];
        var label, i, thisTerm, trendingNowContainer, tnWrapper, data, getTrendingNowUrl, itemTag;
        var breakingNewsBar = await extGlobal.browserGap.localStorage.getItem("breakingNewsBar");
        var trendingBar = await extGlobal.browserGap.localStorage.getItem("trendingBar");

        if (typeof newTabData.trendingNowData === "undefined" || !newTabData.trendingNowData || !enableTN || extGlobal.constants.financeUI || extGlobal.constants.sportsUI ||  (newTabData.breakingNews && breakingNewsBar !== "hidden")) {
            return;
        }

        trendingNowContainer = document.getElementById("searchTrendingNowContainer");
        data = JSON.parse(newTabData.trendingNowData);
        getTrendingNowUrl = viewUtils.getTrendingNowUrl;
        itemTag = getTrendingNowUrl ? "a" : "span";

        if (data && Array.isArray(data.items) && data.items.length > 0 && trendingNowContainer) {
            label = document.createElement("span");
            label.className = "tnLabel";
            label.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_trending_now_label");
            trendingNowContainer.appendChild(label);
            tnLabelWidth = parseInt(window.getComputedStyle(label).width || 0, 10);

            tnWrapper = document.createElement("div");
            tnWrapper.className = "tnWrapper";
            trendingNowContainer.appendChild(tnWrapper);

            for (i = 0; i < data.items.length; i++) {
                thisTerm = document.createElement(itemTag);
                thisTerm.className = "tnItem";
                if(extGlobal.browserGap.isSafari) {
                    thisTerm.className = thisTerm.className + " tnItemSafari";
                }
                thisTerm.textContent = data.items[i].search_term;
                thisTerm.setAttribute("data-pos", i + 1);
                if (getTrendingNowUrl) {
                    thisTerm.href = getTrendingNowUrl(thisTerm.textContent);
                }

                tnWrapper.appendChild(thisTerm);
                tnItemsWidth.push(parseFloat(window.getComputedStyle(thisTerm).width || 0) + (i > 0 ? tnItemsWidth[i-1] : 0) + 36);// margin-left = 36px
                tnItems.push(thisTerm);
            }

            setTnItemsPadding(tnWrapper, tnLabelWidth, tnItems, tnItemsWidth);
            window.onresize = function (e) {
                setTnItemsPadding(tnWrapper, tnLabelWidth, tnItems, tnItemsWidth);
            };

            // delegate for tnItem clicking
            tnWrapper.addEventListener("click", function(e) {
                if(e.target && e.target.nodeName === "A") {
                    sendTnClickBeacon(e.target);
                }
            });

            if(extGlobal.browserGap.isSafari) {
                document.getElementsByClassName("tnLabel")[0].style.fontWeight = 'lighter';
            }
            //add Hide Trending Now option in menu
            if (trendingBar === "hidden") {
                trendingNowContainer.style.display = "none";
                addTrendingMenu(extGlobal.browserGap.getLocalizedString("newtab_extension_show_tn"));
            } else {
                addTrendingMenu(extGlobal.browserGap.getLocalizedString("newtab_extension_hide_tn"));
            }
        }
    }

    function addTrendingMenu(tnMenu) {
        var aTN = document.getElementById("toggleTN");
        aTN.textContent = tnMenu;
        aTN.onclick = toggleTN.bind(null);
        document.getElementById("tnDiv").classList.remove("displayNone");
        document.getElementById("tnDivider").classList.remove("displayNone");
    }

    function addBNMenu(bnMenu) {
        var aBN = document.getElementById("toggleBN");
        aBN.textContent = bnMenu;
        aBN.onclick = toggleBN.bind(null);
        document.getElementById("bnDiv").classList.remove("displayNone");
        document.getElementById("bnDivider").classList.remove("displayNone");
    }

    function setTnItemsPadding (tnWrapper, tnLabelWidth, tnItems, tnItemsWidth) {
        if (!window.innerWidth || !tnWrapper || !tnLabelWidth || !Array.isArray(tnItems) || !Array.isArray(tnItemsWidth)) {
            return;
        }

        var winWidth = window.innerWidth || 0;
        var tnWrapperWidth = Math.max(winWidth - tnLabelWidth - (25 * 2) - 1, 0); // 1px offset
        var paddingLeft = 0;
        var tnNum = tnItems.length || 0;
        var lastIndex = 0;

        if (!tnWrapperWidth || !tnNum) {
            return;
        }

        tnWrapper.style.width = tnWrapperWidth + "px";
        tnItemsWidth.some(function (width, i) {
            // when the length of all tn items is small than the length of wrapper
            if (!paddingLeft && tnWrapperWidth < width) {
                paddingLeft = Math.floor((tnWrapperWidth - tnItemsWidth[i -1]) / i);
                lastIndex = i - 1;
                return true;
            }
            // when the total length of all tn items is small than the length of wrapper
            if (!paddingLeft && i === tnNum - 1 && tnWrapperWidth > width) {
                paddingLeft = Math.floor((tnWrapperWidth - width) / (i + 1));
                lastIndex = i;
                return true;
            }
            return false;
        });

        if (paddingLeft > 0) {
            tnItems.forEach(function (item, i) {
                if (i === lastIndex) {
                    item.style.paddingLeft = (tnWrapperWidth - (paddingLeft * lastIndex) - tnItemsWidth[lastIndex]) + "px";
                    item.style.display = "inline-block";
                } else if (i > lastIndex) {
                    item.style.display = "none";
                } else {
                    item.style.paddingLeft = paddingLeft + "px";
                    item.style.display = "inline-block";
                }
            });
        }
    }

    function sendTnClickBeacon (target) {
        var beaconConfig = {};
        var beaconParams = {};
        var url = target ? target.getAttribute("href") || "" : "";
        var regex = new RegExp("[?&]fr=([^&#]*)|&|#|$");
        var fr = "";

        if (!target || !url) {
            return;
        }

        fr = regex.exec(url);
        beaconParams.sec = "TrendingNow";
        beaconParams.slk = target.textContent || "";
        beaconParams.fr = fr[1] || "";
        beaconParams._p = target.getAttribute("data-pos") || 0;
        beaconParams.tar = target.getAttribute("href") || "";
        beaconConfig.params = beaconParams;

        extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
    }

    async function sendBnClickBeacon (breakingNews, finalBnUrl) {//Breaking News click beacon
        var beaconConfig = {};
        var beaconParams = {};
        var bnAlreadyShown = await extGlobal.browserGap.localStorage.getItem("bnAlreadyShown") || "{}";
        var shownTimes = JSON.parse(bnAlreadyShown);
        var uniqueId = viewUtils.getBNUniqueId(breakingNews);
        beaconParams.sec = "BreakingNews";
        beaconParams.slk = breakingNews.title || "";
        beaconParams.tar = finalBnUrl || "";
        beaconParams.aid = breakingNews.uuid;
        beaconParams.fr = frValue;
        console.error(shownTimes, uniqueId);
        if (shownTimes[uniqueId]) {
            beaconParams.cat = "" + shownTimes[uniqueId];
        }

        beaconConfig.params = beaconParams;

        extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
    }

    async function renderWeatherData(){
        var mapCodeToPosX = {
                        "0": 4, "1": -28, "2": -28, "3": -61, "4": -93, "5": -125, "6": -157, "7": -189, "8": -221, "9": -253, "10": -157,
                        "11": -285, "12": -285, "13": -317, "14": -317, "15": -349, "16": -349, "17": -381, "18": -221, "19": -830, "20": -445,
                        "21": -445, "22": -445, "23": -413, "24": -413, "25": -990, "26": -509, "27": -541, "28": -541, "29": -573, "30": -605,
                        "31": -637, "32": -477, "33": -670, "34": -702, "35": -381, "36": -477, "37": -61, "38": -734, "39": -766, "40": -798,
                        "41": -894, "42": -349, "43": -894, "44": -509, "45": -61, "46": -349, "47": -61, "3200":   -862
          };
        var weatherContainer = document.getElementById("weatherInfo"),
            degree = document.getElementById("degree"),
            city = document.getElementById("location"),
            wthrBlck = document.getElementById("wthrattr"),
            unitMenu =  document.getElementById("toggleUnit"),
            unitDivider = document.getElementById("unitDivider"),
            unitDiv = document.getElementById("unitDiv"),
            data = "",
            code = "",
            degSym = String.fromCharCode(176),
            localStorageWeather = await extGlobal.browserGap.localStorage.getItem("localStorageWeather"),
            unit = await extGlobal.browserGap.localStorage.getItem("unit");

        if (localStorageWeather) {
            data = JSON.parse(localStorageWeather);
            if (unit === "c") {
                degree.textContent = data.degreeC+degSym;
                unitMenu.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_fah");
            } else {
              degree.textContent = data.degree+degSym;
              extGlobal.browserGap.localStorage.setItem("unit", "f");
              unitMenu.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_cel");
            }

            code = data.code;
            if(code && code !== ""){
                document.getElementById("imgDesc").style.backgroundImage = "url(icons/weatherIcons/sprite-weathersmall.png)";
                var posX = mapCodeToPosX[code];
                document.getElementById("imgDesc").style.backgroundPosition = posX + "px 3px";
            }
            /*location added*/
            city.textContent = await extGlobal.browserGap.localStorage.getItem("location");
            wthrBlck.addEventListener("mouseenter", function( event ) {
                city.style.display = "block";
              });
              wthrBlck.addEventListener("mouseleave", function( event ) {
                  city.style.display = "none";
                });
            /*location added*/

            /*Unit Conversion*/
            unitDiv.onclick = async function() {
                var unit = extGlobal.browserGap.localStorage.getItem("unit");
                if (unit === "f") {
                    degree.textContent = data.degreeC+degSym;
                    extGlobal.browserGap.localStorage.setItem("unit", "c");
                    unitMenu.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_fah");
                } else {
                    degree.textContent = data.degree+degSym;
                    extGlobal.browserGap.localStorage.setItem("unit", "f");
                    unitMenu.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_cel");
                }
            };

            // delegate for degree clicking
           weatherContainer.addEventListener("click", function() {
              sendWeatherBeacon();
          });

          //add Hide Weather option in menu
          var weatherSec = await extGlobal.browserGap.localStorage.getItem("weatherSec");
          if (weatherSec === "hidden") {
              weatherContainer.classList.add("displayNone");
              addWeather(extGlobal.browserGap.getLocalizedString("newtab_extension_show_wthr"));
          } else {
              weatherContainer.classList.remove("displayNone");
              addWeather(extGlobal.browserGap.getLocalizedString("newtab_extension_hide_wthr"));
          }
        }
    }

    function toggleWeather () {
          var weather = document.getElementById("toggleWthr"),
             weatherDiv = document.getElementById("weatherInfo"),
             unitMenu = document.getElementById("unitDiv"),
             unitDivider = document.getElementById("unitDivider");

             if(weatherDiv.classList.contains("displayNone")){
               weatherDiv.classList.remove("displayNone");
               unitMenu.classList.remove("displayNone");
               unitDivider.classList.remove("displayNone");
               extGlobal.browserGap.localStorage.setItem("weatherSec", "visible");
               weather.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_hide_wthr");
             }else{
                weatherDiv.classList.add("displayNone");
                unitMenu.classList.add("displayNone");
                unitDivider.classList.add("displayNone");
                extGlobal.browserGap.localStorage.setItem("weatherSec", "hidden");
                weather.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_wthr");
             }
        }
        function addWeather(WeatherMenu) {
            var aWeather = document.getElementById("toggleWthr");
            aWeather.textContent = WeatherMenu;
            aWeather.onclick = toggleWeather.bind(null);
            document.getElementById("wthrDiv").classList.remove("displayNone");
            document.getElementById("wthrDivider").classList.remove("displayNone");
            document.getElementById("unitDiv").classList.remove("displayNone");
            document.getElementById("unitDivider").classList.remove("displayNone");
          }

          /*Tracking for the Weather */
          async function sendWeatherBeacon(){
              var beaconConfig = {};
              var beaconParams = {};
              beaconParams.sec = "Weather";
              beaconParams.slk = "Weather Site";
              beaconParams.tar = "https://www.yahoo.com/news/weather/";
              beaconParams.location = await extGlobal.browserGap.localStorage.getItem("location");
              beaconConfig.params = beaconParams;
              extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
          }

    function appendFlickrLogo(parent){
        var flickrLogo = document.createElement("img");
        flickrLogo.src = "icons/flickrLogo3.svg";
        flickrLogo.style.paddingBottom=4;
        parent.appendChild(flickrLogo);
    }

    function getTitle (site) {
        var title;
        if (site.isFavorite && site.title) { //as a favorite, always use the title field filled by user
            title = site.title;
        }
        else if (extGlobal.siteConfig.siteWhitelist[shortUrl(site.url)]) { //match on the domain+path, example yahoo.com/news
            title = extGlobal.siteConfig.siteWhitelist[shortUrl(site.url)].title;
        }
        else if (extGlobal.siteConfig.siteWhitelist[getFullDomainWithExtension(site.url)]) { //match on the domain only, example yahoo.com
            title = extGlobal.siteConfig.siteWhitelist[getFullDomainWithExtension(site.url)].title;
        } else {
            title = shortenString(site.title, extGlobal.constants.titleStringLength);
        }
        return title;
    }

    function isDoubleByte(str) {
        for (var i = 0, n = str.length; i < n; i++) {
            if (str.charCodeAt( i ) > 255) { return true; }
        }
        return false;
    }


    function generateSiteIcon(idx, site, icon, domain) {
        var customIconText = document.createElement("span");
        var filterTitle = site.title.replace(/[^\w\s ]/gi, '').replace(/  +/g, ' '); //keeps only letters and numbers and converts multiple spaces into unique space
        if (extGlobal.siteConfig.siteWhitelist[shortUrl(site.url)]) { //match on the domain+path, example yahoo.com/news
            customIconText.textContent = extGlobal.siteConfig.siteWhitelist[shortUrl(site.url)].shortTitle;
            icon.style.backgroundColor = extGlobal.siteConfig.siteWhitelist[shortUrl(site.url)].color;
        }
        else if (extGlobal.siteConfig.siteWhitelist[getFullDomainWithExtension(site.url)]) { //match on the domain only, example yahoo.com
            customIconText.textContent = extGlobal.siteConfig.siteWhitelist[getFullDomainWithExtension(site.url)].shortTitle;
            icon.style.backgroundColor = extGlobal.siteConfig.siteWhitelist[getFullDomainWithExtension(site.url)].color;
        } else {
            if (filterTitle.split(" ").length === 1 && filterTitle.split(" ")[0].length >= 2 && !isDoubleByte(site.title)) { //title is 1 word, >= 2 characters
                customIconText.textContent = site.title.split(" ")[0].substring(0, 1).toUpperCase() + filterTitle.split(" ")[0].substring(1, 2).toLowerCase();
            } else if (filterTitle.split(" ").length > 1 && filterTitle.split(" ")[0].length >= 1 && filterTitle.split(" ")[1].length >= 1 && !isDoubleByte(site.title)) {
                customIconText.textContent = filterTitle.split(" ")[0].substring(0, 1).toUpperCase() + filterTitle.split(" ")[1].substring(0, 1).toUpperCase();
            } else { //default is the first character of the title only
                customIconText.textContent = site.title.substring(0, 1).toUpperCase();
            }
            icon.style.backgroundColor = colorList[idx];
        }
        icon.setAttribute("class", "topSiteIcon customIcon");
        icon.appendChild(customIconText);
    }

    function getIcon(idx, site, icon, domain) {
        var customIcon,
            domainUrl = getSubDomain(site.url)+domain,
            pathDomainUrl = getPathSubDomain(site.url)+domain;

        icon.setAttribute("class", "topSiteIcon bc-background-"+domain);
        icon.setAttribute("id", "topSiteIcon_"+(idx+1).toString());

        // ** get default icon from whitelist ** //
        if ((typeof(extGlobal.siteConfig.topIcons[pathDomainUrl]) !== "undefined") && (pathDomainUrl !== domain)) {
            icon.style.backgroundImage = "url(icons/"+extGlobal.siteConfig.topIcons[pathDomainUrl]+".svg)";
        }
        else if(typeof(extGlobal.siteConfig.topIcons[domainUrl]) !== "undefined" ) {
            icon.style.backgroundImage = "url(icons/"+extGlobal.siteConfig.topIcons[domainUrl]+".svg)";
        }
        // we should not have the following, otherwise all sub-domain things will have the domain icon
        /*else if (typeof(extGlobal.siteConfig.topIcons[domain]) !== "undefined") {
            icon.style.backgroundImage = "url(icons/"+extGlobal.siteConfig.topIcons[domain]+".svg)";
        }*/
        // ** else generate icon ** //
        else
         if (site.title) {
            generateSiteIcon(idx, site, icon, domain);
        } else {
            icon.style.backgroundImage = "url(icons/website.svg)";
        }
    }

    function getPartnerInPosition(partners, position) {
        var posPartners = [],
            i;
        for (i = 0; i<partners.length; i++) {
            if (partners[i].position && partners[i].position === position) {
                posPartners.push(partners[i]);
            }
        }
        return posPartners;
    }

    async function renderNewTopSites(parent, newFav) {
        var sitesPerRow = getSitesPerRow();
        var max = sitesPerRow;
        var topSiteList = newTabData.topSites;
        var topSites = [];
        var allSites = [];
        var editButton = document.getElementById("editButton");
        var favoriteSites = await getFavoriteSites();
        var lastVisibleElement;
        var leftPartners = getPartnerInPosition(partners, "left");
        var rightPartners = getPartnerInPosition(partners, "right");
        var sitesBlackListStr = await extGlobal.browserGap.localStorage.getItem('sitesBlackList') || null;
        sitesBlackList = JSON.parse(sitesBlackListStr) || [];

        editButton.onclick = toggleEditMode.bind(null);
        populateUrlArrays();

        allSites = pruneSites(leftPartners.concat(rightPartners).concat(favoriteSites).concat(topSiteList).concat(extGlobal.siteConfig.defaultSites));
        var siteDivs = [];
        for(var i = 0; i<allSites.length && i < maxSites; i++){
            var siteDiv = document.createElement("div"),
                siteText = document.createElement("div"),
                siteTextTitle = document.createElement("div"),
                siteTextUrl = document.createElement("div"),
                manageSite = document.createElement("div"),
                removeSiteDiv = document.createElement("div"),
                pinSite = document.createElement("div"),
                icon = document.createElement("div");

            var siteDivId = "topsiteDiv_" + (i + 1).toString();
            siteDiv.setAttribute("id", siteDivId);
            var siteTitle = getTitle(allSites[i]);
            siteDiv.onclick = navToSite.bind(null, allSites[i].url, siteDivId, siteTitle);
            var siteTextId = "siteTextId_" + (i + 1).toString();
            siteText.setAttribute("id",siteTextId);

            siteTextTitle.textContent = siteTitle;
            siteTextTitle.setAttribute("class", "siteTextTitle");

            siteTextUrl.textContent = shortenString(shortUrl(allSites[i].url), extGlobal.constants.shortenStringLength);
            siteTextUrl.setAttribute("class", "siteTextUrl");
            siteText.appendChild(siteTextTitle);
            siteText.appendChild(siteTextUrl);

            manageSite.setAttribute("class","manageSite");
            pinSite.setAttribute("class","pinSite");
            removeSiteDiv.setAttribute("class","removeSite");
            removeSiteDiv.setAttribute("id","removeSite_"+(i+1).toString());
            siteText.setAttribute("class","siteTextContainer");
            if (newFav && favoriteSites && allSites[i] === favoriteSites[0]) {
                siteDiv.setAttribute("class","topSite newFav"); //for newly added favorite we'll have newFav css animation
            } else {
                siteDiv.setAttribute("class","topSite");
            }

            var domain = getDomain(allSites[i].url);
            getIcon(i, allSites[i], icon, domain);


            var siteURL = allSites[i].url;

            siteDiv.onmouseover = showUrl.bind(null, siteURL, i);
            siteDiv.onmouseout = hideUrl.bind(null, i);

            removeSiteDiv.style.backgroundImage = "url(icons/close_x.svg)";
            removeSiteDiv.onclick = removeSite.bind(null,siteURL);

            manageSite.appendChild(removeSiteDiv);
            manageSite.appendChild(pinSite);
            //Add back when we start adding and removing top sites
            siteDiv.appendChild(icon);
            siteDiv.appendChild(removeSiteDiv); //removeSiteDiv won't be a child of icon, so it won't have the moving effect
            siteDiv.appendChild(siteText);

            siteDivs.push(siteDiv);
        }
        viewUtils.clearInnerHTML(parent);

        var row = siteDivs;
        var topSitesDiv = document.getElementById("topSites");
        for(var rowItem = 0; rowItem<row.length; rowItem++){
            topSitesDiv.appendChild(row[rowItem]);
        }
        if(isEditModeOn){
            renderEditMode();
        }

        lastVisibleElement = viewUtils.resizeNewTab() + 1; //as in the DOM they start from 1
        handleRightPartners(lastVisibleElement); //take care of the right partner (beFrugal case)
        viewUtils.setActivePartnerSites(partners, sitesBlackList); //after render, store active partner list in local storage
    }

    function handleRightPartners(lastIndex) {
        var lastVisibleDiv = document.getElementById("topsiteDiv_" + lastIndex);
        var topSitesDiv = document.getElementById("topSites");
        var rightPartners = getPartnerInPosition(partners, "right");
        var rightPartnersIdx = [];
        if (rightPartners && rightPartners.length > 0) {
            for (var i = 0; i < topSitesDiv.childNodes.length; i ++) {
                if (isRightPartner(topSitesDiv.childNodes[i], rightPartners)) {
                    rightPartnersIdx.push(topSitesDiv.childNodes[i].getAttribute("id"));
                }
            }
            for (i = rightPartnersIdx.length-1; i >= 0; i--) { //we're going to put all the right partners at the last index of the topsite div, keeping the same order as in partner array
                topSitesDiv.insertBefore(document.getElementById(rightPartnersIdx[i]), lastVisibleDiv.nextSibling);
            }
        }
    }

    function isRightPartner(node, rightPartners) {
        var urlText = node.querySelector(".siteTextContainer .siteTextUrl"),
            titleText = node.querySelector(".siteTextContainer .siteTextTitle");
        for (var i = 0; i < rightPartners.length; i++) {
            if (shortenString(shortUrl(rightPartners[i].url), extGlobal.constants.shortenStringLength) === urlText.textContent && getTitle(rightPartners[i]) === titleText.textContent) {
                return true;
            }
        }
        return false;
    }

    // removes blacklisted sites and duplicates. input array is the concat of partners + topSites + defaultSites
    function pruneSites(allSites) {
        var prunedSites = [],
            blackListed,
            duplicate,
            mapUrls = {},
            blackListUrl = {},
            i,
            j;

        for (j = 0; j < sitesBlackList.length; j++) { //putting all blackList sites in a map
            blackListUrl[shortUrl(sitesBlackList[j])] = true;
        }
        for (i = 0; i < allSites.length; i++) {
            blackListed = false;
            duplicate = false;
            if (blackListUrl[shortUrl(allSites[i].url)]) {
                blackListed = true;
            }

            if (mapUrls[shortUrl(allSites[i].url)]) {
                duplicate = true;
            }
            mapUrls[shortUrl(allSites[i].url)] = true; //storing the url as key to identify duplicates

            if (!blackListed && !duplicate) {
                prunedSites.push(allSites[i]);
            }
        }
        return prunedSites;
    }

    async function removeSite(siteUrl) {
        sitesBlackList.push(siteUrl);
        extGlobal.browserGap.localStorage.setItem("sitesBlackList",JSON.stringify(sitesBlackList));

        try { // removing site from favorite sites if presents
            var favoriteSites = await getFavoriteSites();
            for (var i=0;i<favoriteSites.length;i++) {
                if (favoriteSites[i].url === siteUrl) {
                    favoriteSites.splice(i, 1);
                    break;
                }
            }
            extGlobal.browserGap.localStorage.setItem("favoriteSites", JSON.stringify(favoriteSites));
        } catch (e) {
            console.error(e);
        }

        if(!unittest){
            renderNewTopSites(document.querySelector(".newTopSitesContainer"));
        }
    }


    //Control how many site links are displayed in the new tab based on window size
    function getSitesPerRow(){
        return extGlobal.constants.iconsPerRow;
    }

    //www.yahoo.com -> yahoo, oracle.com/java -> oracle
    function getDomain(url){
        //assume they start with http and it's a real url
        if (url.indexOf("https://") === 0) {
            url = url.slice(8);
        } else if (url.indexOf("http://") === 0) {
            url = url.slice(7);
        }
        var endOfDomain = url.indexOf("/");
        if (endOfDomain > -1) {
            url = url.slice(0, endOfDomain);
        }
        url = url.split(".");
        return url[url.length-2];
    }

    //www.yahoo.com -> yahoo.com, oracle.com/java -> oracle.com, yahoo.co.jp/something -> yahoo.co.jp
    function getFullDomainWithExtension(url) {
        //assume they start with http and it's a real url
        if (url.indexOf("https://") === 0) {
            url = url.slice(8);
        } else if (url.indexOf("http://") === 0) {
            url = url.slice(7);
        }
        if (url.indexOf("www.") === 0) {
            url = url.slice(4);
        }
        var endOfDomain = url.indexOf("/");
        if (endOfDomain > -1) {
            url = url.slice(0,endOfDomain);
        }
        return url.split("?")[0];
    }

    //xyz.yahoo.com -> xyz, oracle.com -> ""
    function getSubDomain(url){
        url = url.indexOf("https://") === 0 ? url.slice(8) : (url.indexOf("http://") === 0 ? url.slice(7) : url);
        var endOfDomain = url.indexOf("/");
        url = url.slice(0,endOfDomain).split(".");
        if(url.length > 2)
        {
            var subDomain = url[url.length-3];
            if((subDomainBlackList.indexOf(subDomain) > -1))
            {
                return "";
            }
            else
            {
                return subDomain;
            }
        }
        else
        {
            return "";
        }
    }

    //http://www.yahoo.com/xyz/ -> xyz
    //todo: function acts wierd if no subdomain present
    function getPathSubDomain(url){
        url = url.indexOf("https://") === 0 ? url.slice(8) : url.slice(7);
        var startOfSubDomain = url.indexOf("/");
        var endOfSubDomain = url.indexOf("/",startOfSubDomain+1);
        if(endOfSubDomain === -1)
        {
            if(url.indexOf("?",startOfSubDomain+1) !== -1)
            {
                endOfSubDomain = url.indexOf("?",startOfSubDomain+1);
            }
            else
            {
                endOfSubDomain = url.length;
            }
        }
        var subDomain = url.slice(startOfSubDomain+1,endOfSubDomain);
        return subDomain;
    }

    //Render the blur image in the middle of the tab
    function renderBlur(){
        //var uiBlur = document.getElementById("uiBlur");
        var uiBlur = document.getElementById("searchSuggestContainerNew");
        uiBlur.setAttribute("class", "bgImage");
        resizeBlur();
    }

    function resizeBlur(){
        viewUtils.clipToElement("#searchSuggestContainerNew", document.querySelector("#uiContainer"));
    }

    //Search Protect Prompt asks user if they want to change default search engine to Yahoo!
    function renderSearchProtectPrompt()
    {
        if (document.getElementById("searchProtectDiv")){
            return;
        }
        var mainContainer = document.getElementById("mainContainer");

        var searchProtectDiv = document.createElement("div");
        searchProtectDiv.setAttribute("id", "searchProtectDiv");
        searchProtectDiv.setAttribute("name", "searchProtectDiv");
        searchProtectDiv.setAttribute("class", "searchProtectDiv uiBG");

        var yahooImgBgDiv = document.createElement("div");
        yahooImgBgDiv.setAttribute("id", "yahooImgBgDiv");
        yahooImgBgDiv.setAttribute("name", "yahooImgBgDiv");
        yahooImgBgDiv.setAttribute("class", "yahooSearchProtectIconBg");

        var yahooImgSvgDiv = document.createElement("div");
        yahooImgSvgDiv.setAttribute("id", "yahooImgSvgDiv");
        yahooImgSvgDiv.setAttribute("name", "yahooImgSvgDiv");
        yahooImgSvgDiv.setAttribute("class", "yahooSearchProtectIconSvg");
        yahooImgSvgDiv.style.backgroundImage = "url(icons/yahoologo.svg)";

        var textDiv = document.createElement("div");
        textDiv.setAttribute("id", "prompt");
        textDiv.setAttribute("name", "prompt");
        textDiv.setAttribute("class", "searchProtectPrompt");
        textDiv.textContent = extGlobal.browserGap.getLocalizedString("newtab_firefox_extension_search_protect_prompt_part1");

        var acceptDiv = document.createElement("div");
        acceptDiv.setAttribute("id", extGlobal.constants.search_protect_accept);
        acceptDiv.setAttribute("name", extGlobal.constants.search_protect_accept);
        acceptDiv.setAttribute("class", "searchProtectAcceptDiv");
        acceptDiv.textContent = extGlobal.browserGap.getLocalizedString("newtab_firefox_extension_search_protect_accept");
        acceptDiv.onclick = function(){
            newTabData.promptSearchProtect = false;
            hideSearchProtectPrompt();
            extGlobal.browserGap.emitToMain({searchProtect: true, setSearch: true});
        };

        var declineButton = document.createElement("input");
        declineButton.setAttribute("id", extGlobal.constants.search_protect_decline);
        declineButton.setAttribute("name", extGlobal.constants.search_protect_decline);
        declineButton.setAttribute("class", "searchProtectDeclineImg");
        declineButton.setAttribute("type", "image");
        declineButton.src = "icons/cross.svg";
        declineButton.onclick = function(){
            newTabData.promptSearchProtect = false;
            hideSearchProtectPrompt();
            extGlobal.browserGap.emitToMain({searchProtect: true, setSearch: false});
        };

        yahooImgBgDiv.appendChild(yahooImgSvgDiv);

        searchProtectDiv.appendChild(yahooImgBgDiv);
        searchProtectDiv.appendChild(textDiv);
        searchProtectDiv.appendChild(acceptDiv);
        searchProtectDiv.appendChild(declineButton);
        mainContainer.appendChild(searchProtectDiv);

    }

    function hideSearchProtectPrompt() {
        var searchProtectDiv = document.getElementById("searchProtectDiv");
        if(searchProtectDiv) {
            var mainContainer = document.getElementById("mainContainer");
            mainContainer.removeChild(searchProtectDiv);
        }
    }
    //show url in the url display block
    function showUrl(siteURL, index) {
        index++;
        var siteTextBlock = document.getElementById("siteTextId_" + index);
        var iconNode = document.getElementById("topSiteIcon_" + index);
        if (siteTextBlock.style.display !== "block") {
            siteTextBlock.style.visibility = "hidden";
            siteTextBlock.style.display = "block";
            var siteTextBlockHalf = siteTextBlock.offsetLeft + (siteTextBlock.offsetWidth / 2);
            var iconHalf = iconNode.offsetLeft + (iconNode.offsetWidth / 2);
            var moveToLeft = siteTextBlockHalf - iconHalf;

            if (Math.abs(siteTextBlockHalf - iconHalf) > 2) {
                siteTextBlock.style.left = siteTextBlock.offsetLeft - moveToLeft;
            }
            siteTextBlock.style.visibility = "visible";
            var tosPolicy = document.getElementById("tosPolicy");
            if (tosPolicy) {
                tosPolicy.style.display = "none";
            }
        }
    }

    function shortUrl(siteURL) {
        if (siteURL.startsWith("http://")) {
            siteURL = siteURL.replace("http://", "");
        } else if (siteURL.startsWith("https://")) {
            siteURL = siteURL.replace("https://", "");
        }
        if (siteURL.startsWith("www.")) {
            siteURL = siteURL.replace("www.", "");
        }
        if (siteURL.indexOf("?") > -1) {
            siteURL = siteURL.slice(0, siteURL.indexOf("?"));
        }
        if (siteURL.endsWith("/")) {
            siteURL = siteURL.slice(0, siteURL.length-1);
        }
        return siteURL;
    }

    //hide url display block
    function hideUrl(index) {
        index++;
        var siteTextBlock = document.getElementById("siteTextId_" + index);
        siteTextBlock.style.display = "none";
        var tosPolicy = document.getElementById("tosPolicy");
        if (tosPolicy) {
            tosPolicy.style.display = "block";
        }
    }

    function calculateIconDistance() {
        var showLength = document.createElement("div");
        showLength.setAttribute("id","showLength");
        showLength.style.position = "absolute";

        if(extGlobal.browserGap.isChrome)
        {
            showLength.style.fontFamily = "lato";
        }
        else
        {
            showLength.style.fontFamily = "Helvetica Neue";
        }

        showLength.style.fontSize = "14px";
        showLength.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_image");
        document.body.appendChild(showLength);
        var sLength = showLength.clientWidth;
        showLength.style.display = "none";

        var hideLength = document.createElement("div");
        hideLength.style.position = "absolute";
        hideLength.setAttribute("id","hideLength");

        if(extGlobal.browserGap.isChrome) {
            hideLength.style.fontFamily = "lato";
        } else{
            hideLength.style.fontFamily = "Helvetica Neue";
        }

        hideLength.style.fontSize = "14px";
        hideLength.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_topsites");
        document.body.appendChild(hideLength);
        var hLength = hideLength.clientWidth;
        hideLength.style.display = "none";

        return Math.max(hLength,sLength);
    }

    //Render the toggle (show/hide topsites) button
    function renderToggleView() {
        var toggleViewText = document.getElementById("toggleViewText");
        toggleViewText.onclick = switchView.bind(null);

        var iconDistance = extGlobal.constants.iconToggleDistance + extGlobal.constants.rightToggleViewDistance + calculateIconDistance();

        if(!showFullImage) {
            toggleViewText.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_image");
        }
        else {
            toggleViewText.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_topsites");
        }
    }

    function showAddSign(showBool) {
        var addSign = document.getElementById("addIcon");
        if (showBool) {
            addSign.style.visibility = "visible";
            addSign.classList.add("appear");
        } else {
            addSign.style.visibility = "hidden";
            addSign.classList.remove("appear");
        }
    }

    function initFavorites() {
        var inputFavoriteUrl = document.getElementById("favoriteUrl"),
            inputFavoriteTitle = document.getElementById("favoriteTitle");

        function handleFavUrlKey(e) { // url input listener
            showAddSign(inputFavoriteUrl.value !== "" && inputFavoriteTitle.value !== "");
            if (e.keyCode === 13 && inputFavoriteUrl.value !== "") {
                inputFavoriteTitle.focus();
            } else {
                inputFavoriteUrl.placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_enter_url");
            }
        }


        // ***** title input handling ****** //
        document.getElementById("addIcon").onclick = function() {
            if (inputFavoriteUrl.value !== "" && inputFavoriteTitle.value !== "") {
                addSiteToFavorite(inputFavoriteUrl.value, inputFavoriteTitle.value); //if all is ok we add the URL
            } else {
                if (inputFavoriteUrl.value === "") {
                    inputFavoriteUrl.placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_enter_url");
                    inputFavoriteUrl.focus();
                }
                if (inputFavoriteTitle.value === "") {
                    inputFavoriteTitle.placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_enter_title");
                    inputFavoriteTitle.focus();
                }
            }
        };
        function handleFavTitleKey(e) { // title input listener

            showAddSign(inputFavoriteUrl.value !== "" && inputFavoriteTitle.value !== "");
            if (e.keyCode === 13 && inputFavoriteUrl.value !== "" && inputFavoriteTitle.value !== "") {
                addSiteToFavorite(inputFavoriteUrl.value, inputFavoriteTitle.value); //if all is ok we add the URL
            } else if (e.keyCode === 13) {
                if (inputFavoriteUrl.value === "") {
                    inputFavoriteUrl.placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_enter_url");
                }
                if (inputFavoriteTitle.value === "") {
                    inputFavoriteTitle.placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_enter_title");
                }
            }
        }
        // *********************************** //

        inputFavoriteUrl.addEventListener("keyup", handleFavUrlKey);
        inputFavoriteTitle.addEventListener("keyup", handleFavTitleKey);
    }

    async function addSiteToFavorite(siteUrl, siteTitle) {
        try {
            siteUrl = viewUtils.stripHtml(siteUrl);
            siteTitle = viewUtils.stripHtml(siteTitle);
            var favoriteSites = await getFavoriteSites(),
                i;
            for (i=0;i<favoriteSites.length;i++) { //if favorite already exists, we will splice it and add it again on top of the list
                if (shortUrl(favoriteSites[i].url) === shortUrl(siteUrl)) {
                    favoriteSites.splice(i, 1);
                    break;
                }
            }
            var newFav = [{"url": siteUrl, "title": siteTitle, "isFavorite": true}];

            favoriteSites.unshift(newFav[0]);
            await extGlobal.browserGap.localStorage.setItem("favoriteSites", JSON.stringify(favoriteSites));
            removeFromBlacklist(siteUrl); // If user adds a favorite that was in the blacklist, we need to remove that site from blacklist
            renderNewTopSites(document.querySelector(".newTopSitesContainer"), true);

            document.getElementById("favoriteUrl").value = ""; //after adding favorite remove input text
            document.getElementById("favoriteTitle").value = ""; //after adding favorite remove input text
            showAddSign(false);
        } catch (e) {
            console.error(e);
        }
    }

    async function removeFromBlacklist(siteUrl) { //removes site from blackList if it exists.
        for(var i=0;i<sitesBlackList.length;i++) {
            if (shortUrl(sitesBlackList[i]) === shortUrl(siteUrl)) {
                sitesBlackList.splice(i, 1);
                break;
            }
        }
        await extGlobal.browserGap.localStorage.setItem("sitesBlackList", JSON.stringify(sitesBlackList));
    }

    async function getFavoriteSites() {
        try {
            var favoriteSitesS = await extGlobal.browserGap.localStorage.getItem("favoriteSites") || null;
            var favoriteSites = JSON.parse(favoriteSitesS);
            if (!Array.isArray(favoriteSites)) {
                favoriteSites = [];
            }
            for (var i = 0; i < favoriteSites.length; i++) {
                favoriteSites[i].url = viewUtils.stripHtml(favoriteSites[i].url);
                favoriteSites[i].title = viewUtils.stripHtml(favoriteSites[i].title);
            }
            return favoriteSites;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    function renderEditView() {
        if(extGlobal.browserGap.isSafari) { //should only have 'Hide Trending Now' and 'Feedback' buttons
            document.getElementsByClassName('divider')[0].style.display = 'none';
            document.getElementsByClassName('divider')[1].style.display = 'none';
            document.getElementById('editButton').parentNode.style.display = 'none';
            document.getElementById('toggleViewText').parentNode.style.display = 'none';
        }
        else {
            //var editViewIcon = document.getElementById("editIcon");
            var editViewButton = document.getElementById("editButton");
            //editViewIcon.style.display = "block";
            editViewButton.style.display = "flex";
            editViewButton.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_edit_settings_label");
        }

    }
    //Handle the click of toggle button - hides the Search bar + auto suggest
    function switchView() {
        var toggleViewText = document.getElementById("toggleViewText");
        var searchBox = document.getElementById("searchBoxNew");
        //var panelIcon = document.getElementById("panelIcon");
        if(showFullImage) {
            toggleViewText.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_image");
            document.getElementById("uiContainer").style.visibility = "visible";
            if (searchBox.value !== "") { //we only put blur back when there is an autosuggest (when there is a query)
                document.getElementById("uiBlur").style.visibility = "visible";
            }
            extGlobal.browserGap.localStorage.setItem("searchBar", "visible");
            showFullImage = false;
        }
        else {
            toggleViewText.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_show_topsites");
            document.getElementById("uiContainer").style.visibility = "hidden";
            document.getElementById("uiBlur").style.visibility = "hidden";
            showFullImage = true;
            extGlobal.browserGap.localStorage.setItem("searchBar", "hidden");
        }
    }

    async function renderSearchBar() {
        var searchBar = await extGlobal.browserGap.localStorage.getItem("searchBar");
        if ((searchBar || "visible") === "hidden") {
            switchView(); //initial switchView will set different items to "hidden" and change the toggle view text
        } else {
            document.getElementById("uiContainer").style.visibility = "visible"; //by default the search bar is hidden in html file, to avoid showing it for a few ms. We make it visible as soon as javascript is run here
        }
    }

    async function toggleEditMode() {
        var beaconConfig = {};
        var beaconParams = {};
        var sitesLength = (document.querySelectorAll("#topSites div.topSite") || []).length;
        if(editModeToggle) {
            isEditModeOn = true;
            document.getElementById("bg").style.cursor = "pointer";
            if (sitesLength === 0) { // when sites are all empty and user clicks on "Edit Favorites" we'll delete the blacklist to bring back all sites
                await extGlobal.browserGap.localStorage.removeItem("sitesBlackList");
                sitesBlackList = [];
                renderNewTopSites(document.querySelector(".newTopSitesContainer"));
            }
            renderEditMode();

            document.getElementById("editButton").textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_done_settings_label");
            editModeToggle = false;
            beaconParams.sec = "TopSitesEditButton";
            beaconParams.slk = "topSiteEditSettingsLabel";
            beaconParams.gpos = extGlobal.constants.tracker_gpos_topsites;
            beaconParams._p = extGlobal.constants.tracker_topSitesArea_p_edit;
            beaconConfig.params = beaconParams;
            extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
        } else {
            isEditModeOn = false;
            document.getElementById("bg").style.cursor = "default";
            for(var i = 1; i <= sitesLength; i++) {
                var siteBlock = document.getElementById("topSiteIcon_"+i);
                var removeIcon = document.getElementById('removeSite_'+i);
                removeIcon.style.display = "none";
                siteBlock.classList.remove("animated","wiggle", "wiggle_delay_"+i);
            }
            document.getElementById("editButton").textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_edit_settings_label");
            viewUtils.hideElement(document.getElementById("addFavoriteUrl"));
            viewUtils.hideElement(document.getElementById("addFavoriteTitle"));

            editModeToggle = true;
            beaconParams.sec = "TopSitesDoneButton";
            beaconParams.slk = "topsiteDoneSettingsLabel";
            beaconParams.gpos = extGlobal.constants.tracker_gpos_topsites;
            beaconParams._p = extGlobal.constants.tracker_topSitesArea_p_done;
            beaconConfig.params = beaconParams;
            extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
        }
    }

    function renderEditMode()
    {
        var topSitesLength = (document.querySelectorAll("#topSites div.topSite") || []).length,
            siteTextId,
            siteBlock,
            removeIcon;
        for(var i = 1; i <= topSitesLength; i++)
        {
            siteTextId = document.getElementById("siteTextId_"+i);
            siteBlock = document.getElementById("topSiteIcon_"+i);
            removeIcon = document.getElementById('removeSite_'+i);
            removeIcon.style.display = "block";
            siteBlock.classList.add("animated","wiggle");
            //removeIcon.classList.add("animated", "animateCross"); //uncomment to make the arrow move
        }
        document.getElementById("favoriteUrl").placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_add_url");
        document.getElementById("favoriteTitle").placeholder = extGlobal.browserGap.getLocalizedString("newtab_extension_add_title");
        viewUtils.unhideElement(document.getElementById("addFavoriteUrl"));
        viewUtils.unhideElement(document.getElementById("addFavoriteTitle"));
        document.getElementById("favoriteUrl").focus(); //focus on input text to add favorite

    }


    //populate partnerUrls
    function populateUrlArrays()
    {
        for(var j=0; j<partners.length; j++)
        {
            partnerUrls[j] = partners[j].url;
        }

        for(var l=0; l<extGlobal.siteConfig.defaultSites.length; l++)
        {
            defaultUrls.push(extGlobal.siteConfig.defaultSites[l].url);
            defaultSitesText.push(extGlobal.siteConfig.defaultSites[l].title);
        }
    }

    function ffRender(){
        //hover url box shadow
        css.addSelector(".urlShow",{"box-shadow": "inset 0 -55px 50px -25px rgba(0,0,0,0.8)"});

        //Search Protect rendering
        if(newTabData.promptSearchProtect){
            renderSearchProtectPrompt();
        }
    }

    function renderFeedBack() {
        var feedBack = document.getElementById("feedBack");
        var feedbackLink = extGlobal.browserGap.getLocalizedString("newtab_extension_feedback_link");

        if (feedbackLink) {
            feedBack.style.display = "flex";
            feedBack.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_feedback_link_label");
            feedBack.onclick = sendFeedback.bind(null, "feedBack", feedbackLink);
        } else {
            feedBack.style.display = "none";
        }
    }
    function renderToSPolicy() {
        var tos = document.getElementById("gdprTos");
        var policy = document.getElementById("gdprPolicy");
        if (tos) {
            var tos_1 = document.createElement("span"),
                tos_2 = document.createElement("span");
            tos_1.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_terms_updated_1");
            tos_2.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_terms_updated_2");
            tos_2.className = "updated";
            tos.appendChild(tos_1);
            tos.appendChild(tos_2);
            tos.setAttribute("href", extGlobal.browserGap.getLocalizedString("newtab_gdpr_popup_tos_url"));
        }
        if (policy) {
            var policy_1 = document.createElement("span"),
                policy_2 = document.createElement("span");
            policy_1.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_privacy_updated_1");
            policy_2.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_privacy_updated_2");
            policy_2.className = "updated";
            policy.appendChild(policy_1);
            policy.appendChild(policy_2);
            policy.setAttribute("href", extGlobal.browserGap.getLocalizedString("newtab_gdpr_popup_privacy_url"));
        }
    }

    function sendFeedback(id,link) {
        var beaconConfig = {};
        var beaconParams = {};
        var feedBack = document.getElementById(id);
        beaconParams.sec = id;
        beaconParams.slk = "feedbackLabel";
        beaconParams.tar = link;
        beaconParams.gpos = extGlobal.constants.tracker_gpos_feedback;
        beaconParams._p = extGlobal.constants.tracker_feedbackArea_p_feedback;
        beaconConfig.params = beaconParams;
        extGlobal.browserGap.emitToMain({newTab: true, tracker: true, beaconConfig: beaconConfig});
        redirectTo(link);
    }

    async function sendPageViewBeacon(spaceId) {
        var beaconConfig = {};
        var beaconParams = {};
        beaconParams.pt = "newtab_page";
        viewUtils.setTnViewParams(newTabData, beaconParams);
        viewUtils.setPartnerSiteFlag(beaconParams);
        beaconConfig.params = beaconParams;
        if (extGlobal.constants.financeUI) {
            if (newTabData.financeData && newTabData.financeData.financeQuotes && newTabData.financeData.financeQuotes.type) {
                beaconConfig.params.login = newTabData.financeData.financeQuotes.type === "offline" ? "0" : "1";
            }
        }
        if (extGlobal.constants.weatherUI) {
            var weatherSec = extGlobal.browserGap.localStorage.getItem("weatherSec");
            if (newTabData.weatherData && weatherSec !== "hidden") {
              beaconConfig.params.ttype ="weather_1";
            } else {
              beaconConfig.params.ttype ="weather_0";
            }
        }
        extGlobal.browserGap.emitToMain({pageInfo:true, newTab: true, tracker: true, beaconConfig: beaconConfig});
    }

    function renderFeaturePanelTopImage()
    {
        var container = document.getElementById("financePanel"),
            imagePanel = document.createElement("div");

        imagePanel.setAttribute("id", "imagePanel");
        container.insertBefore(imagePanel, container.childNodes[0]);

        var imageLogo = document.createElement("img");
        imageLogo.setAttribute("class", "financeLogo");

        imagePanel.appendChild(imageLogo);
    }

    //render everything
    async function render() {
        newTabData = await populateMissingData(newTabData);
        renderBackground();
        renderOwnerData();
        renderToggleView();
        if(extGlobal.constants.weatherUI) {
            var localStorageWeather = await extGlobal.browserGap.localStorage.getItem("localStorageWeather");
            if(localStorageWeather) {
                renderWeatherData();
                setInterval(function() {
                  renderWeatherData();
                }, 1800000);
            } else {
              setTimeout(function() {
                renderWeatherData();
              }, 6000);
            }
        }
        if(extGlobal.constants.financeUI || extGlobal.constants.sportsUI){
            if (extGlobal.constants.financeUI && FinanceRenderer) {
                var financeRenderer = new FinanceRenderer(newTabData).renderFinance(frValue,typeParam);
                renderFeaturePanelTopImage();
            }
            if (extGlobal.constants.sportsUI && SportsRenderer) {
                var sportsRenderer = new SportsRenderer(newTabData).renderSports(frValue,typeParam);
            }
            var addFavoriteUrl = document.getElementById("addFavoriteUrl");
            var addFavoriteTitle = document.getElementById("addFavoriteTitle");
            if (addFavoriteUrl && addFavoriteTitle) {
                addFavoriteUrl.classList.add("width75");
                addFavoriteTitle.classList.add("width75");
            }

            if(window.innerWidth <= 1023) {
                document.getElementById("rightPanelBlur").style.display = "none";
            }
            else {
                document.getElementById("rightPanelBlur").style.display = "block";
                resizeRightPanelBlur();
            }
        }
        if(extGlobal.browserGap.isSafari !== true) {
            renderNewTopSites(document.querySelector(".newTopSitesContainer"));
        }

        renderSearchBar();
        renderBreakingNews();
        renderTrendingNow();
        renderFeedBack();
        renderToSPolicy();
        renderEditView();

        if(extGlobal.browserGap.isChrome){
            // renderBookmarks(document.getElementById("bookmarksFlex"));
            /* if(bookmarksState)
             showBookmarks();
             else
             hideBookmarks(); */
        } else {
            ffRender();
        }

        // handling resizing for blur effect on autosuggest box
        if (window.addEventListener) {
            window.addEventListener('resize', function() {
                var lastVisibleElement = viewUtils.resizeNewTab() + 1; //as in the DOM they start from 1
                handleRightPartners(lastVisibleElement);
                if (extGlobal.constants.financeUI && FinanceRenderer || (extGlobal.constants.sportsUI)) {
                    if(window.innerWidth <= 1023) {
                        document.getElementById("rightPanelBlur").style.display = "none";
                    }
                    else {
                        document.getElementById("rightPanelBlur").style.display = "block";
                        resizeRightPanelBlur();
                    }
                }
            });
            //remove edit mode when clicking anywhere in window
            window.addEventListener('click', function(e) {
                if (isEditModeOn &&
                    (e.target.className || "").indexOf("removeSite") === -1 &&
                    (e.target.id || "") !== "editButton" &&
                    (e.target.id || "") !== "favoriteUrl" &&
                    (e.target.id || "") !== "favoriteTitle" &&
                    (e.target.className || "").indexOf("addSign") === -1) {
                    toggleEditMode();
                }
            });
        }

        initFavorites();

        if (newTabData.promptCE) { //interstitial prompting to add content enhancer
            var promptCEDiv = document.createElement("div");
            var promptCEText = document.createElement("div");
            var CEOptions = document.createElement("div");
            var choiceBodyDiv = document.createElement("div");
            var smallerNoteDiv = document.createElement("div");
            var userConfirmSpan = document.createElement("span");
            var userConfirmInput = document.createElement("input");
            var description1Span = document.createElement("span");

            var noticeUserDiv = document.createElement("div");
            var yahooLogoDiv = document.createElement("div");
            noticeUserDiv.setAttribute("class", "noticeUserDiv");
            noticeUserDiv.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_quick_search_prompt");
            yahooLogoDiv.setAttribute("class", "yahoologo");
            yahooLogoDiv.textContent = " ";
            promptCEText.appendChild(noticeUserDiv).parentNode.appendChild(yahooLogoDiv);

            choiceBodyDiv.setAttribute("class", "choiceBody");
            smallerNoteDiv.setAttribute("class", "smallerNote");
            smallerNoteDiv.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_quick_search_description_2");

            userConfirmSpan.setAttribute("class", "userConfirm");
            userConfirmInput.setAttribute("type", "button");
            userConfirmInput.setAttribute("id", "enableCEOK");
            userConfirmInput.setAttribute("class", "promptOK");
            userConfirmInput.setAttribute("value", extGlobal.browserGap.getLocalizedString("newtab_extension_ok"));

            description1Span.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_quick_search_description_1") + "\n\n";

            userConfirmSpan.appendChild(userConfirmInput);
            choiceBodyDiv.appendChild(description1Span);
            choiceBodyDiv.appendChild(smallerNoteDiv);
            choiceBodyDiv.appendChild(userConfirmSpan);
            CEOptions.appendChild(choiceBodyDiv);

            promptCEDiv.appendChild(promptCEText);
            promptCEDiv.appendChild(CEOptions);
            promptCEDiv.className = "interstitial";
            promptCEDiv.setAttribute("id", "promptCEDiv");

            document.body.appendChild(promptCEDiv);

            userConfirmInput.onclick = function() {
                extGlobal.browserGap.emitToMain({newTab: true, prefPromptCE: true});
                document.getElementById("promptCEDiv").style.display = "none";
            };
        }

        if (newTabData.firstTab) {
            var firstTabDiv = document.createElement("div");
            var middleRailDiv = document.createElement("div");
            var firstTabTitleDiv = document.createElement("div");
            var firstTabDetailsDiv = document.createElement("div");
            var rightRailDiv = document.createElement("div");
            var arrowLogoDiv = document.createElement("div");

            middleRailDiv.setAttribute("class", "middlerail");
            firstTabTitleDiv.setAttribute("class", "firstTabTitle");
            firstTabTitleDiv.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_chrome_protect_1");
            firstTabDetailsDiv.setAttribute("class", "firstTabDetails");
            firstTabDetailsDiv.textContent = extGlobal.browserGap.getLocalizedString("newtab_extension_chrome_protect_2");
            rightRailDiv.setAttribute("class", "rightrail");
            arrowLogoDiv.setAttribute("class", "arrowlogo");
            arrowLogoDiv.textContent = " ";
            firstTabDiv.className = "interstitial";
            firstTabDiv.setAttribute("id", "firstTabPrompt");

            middleRailDiv.appendChild(firstTabTitleDiv).parentNode.appendChild(firstTabDetailsDiv);
            rightRailDiv.appendChild(arrowLogoDiv);
            firstTabDiv.appendChild(middleRailDiv).parentNode.appendChild(rightRailDiv);

            setTimeout(function() {
               $("#firstTabPrompt").fadeOut("slow", function () {});
            }, 8000);

            document.body.appendChild(firstTabDiv);
        }

        if (newTabData.semPostInstall) {
            var semImg = document.createElement("img");
            semImg.setAttribute("src", newTabData.semPostInstall.url);
            semImg.width = "1";
            semImg.height = "1";
            semImg.setAttribute("id", "testSem");
            document.body.appendChild(semImg);
        }

        if(extGlobal.browserGap.isChrome)
        {
            sendPageViewBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].chrome_space_id || extGlobal.constants.chrome_space_id);
        }
        else if(extGlobal.browserGap.isFirefox || extGlobal.browserGap.isWebExtension) {
            sendPageViewBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].firefox_space_id || extGlobal.constants.firefox_space_id);
        }
        else if(extGlobal.browserGap.isSafari)
        {
            sendPageViewBeacon(extGlobal.constants.distributionChannels[extGlobal.distributionChannel].safari_space_id || extGlobal.constants.safari_space_id);
        }
        //put focus on the search bar (will only work for tabs opened using tabs.open) >> normal use case
        document.getElementById("searchBoxNew").focus();
    }

    this.css = css;
    this.render = render;
    /* jshint ignore: start */
    if (unittest) {
        this.showFullImage = showFullImage;
        this.partners = partners;
        //this.partnersLastSlots = partnersLastSlots;
        this.partnerUrls = partnerUrls;
        this.sitesBlackList = sitesBlackList;

        this.navToSite = navToSite;
        this.redirectTo = redirectTo;
        this.shortenString = shortenString;
        this.renderBackground =  renderBackground;
        this.populateMissingData = populateMissingData;
        this.renderOwnerData = renderOwnerData;
        this.renderTrendingNow = renderTrendingNow;
        this.renderWeatherData = renderWeatherData;
        this.getSitesPerRow = getSitesPerRow;
        this.getDomain = getDomain;
        this.getSubDomain = getSubDomain;
        this.getPathSubDomain = getPathSubDomain;
        this.renderBlur = renderBlur;
        this.resizeBlur = resizeBlur;
        this.renderSearchProtectPrompt = renderSearchProtectPrompt;
        this.showUrl = showUrl;
        this.hideUrl = hideUrl;
        this.renderToggleView = renderToggleView;
        this.initFavorites = initFavorites;
        this.getFavoriteSites = getFavoriteSites;
        this.switchView = switchView;
        this.populateUrlArrays = populateUrlArrays;
        this.removeSite = removeSite;
        this.toggleEditMode = toggleEditMode;
        this.renderEditMode = renderEditMode;
        this.renderFeedBack = renderFeedBack;
        this.calculateIconDistance = calculateIconDistance;
        //workaround due to scope issues
        this.injectFunction = function (){
            redirectTo = this.redirectTo;
            showFullImage = this.showFullImage;
            resizeBlur = this.resizeBlur;
        }
        this.syncData = function (){
            this.partnerUrls = partnerUrls;
        }
    }
    /* jshint ignore: end */
    return this;
}

function ViewUtils() { // jshint ignore: line
    // the css generator needs to be unique so different future uses of viewutils don't clash with each other
    var uid = Math.round( Math.random() * 1000) + "" + Math.round( Math.random() * 1000);
    var css = new CssGenerator("viewUtils"+uid, true);
    css.init();
    function clipToElement(selector, element){
        var params = [element.offsetTop, element.offsetLeft+element.offsetWidth, element.offsetTop+element.offsetHeight, element.offsetLeft];
        if(extGlobal.browserGap.isSafari) {
            params = [0, element.offsetLeft+element.offsetWidth, element.offsetTop+element.offsetHeight, element.offsetLeft];
        }
        var clip = { clip: "rect("+params.join("px,")+")" };
        css.addSelector(selector, clip);
    }

    function clearInnerHTML(element){
        while (element.hasChildNodes()){
            element.removeChild(element.firstChild);
        }
    }

    function hideElement(element){
        element.classList.add("displayNone");
    }

    function unhideElement(element){
        element.classList.remove("displayNone");
    }

    /*
        resizeNewTab will center the page elements upon resize, in particular top sites
        It is position:absolute where we only show what is available for the user screen.
        Each topSite has a fixed padding left+right=30px, topSites that can't be shown are going to a 2nd line which is
        under the viewport (not visible to the user).
    */
    function resizeNewTab() {
        var topSites = document.querySelectorAll("#topSites div.topSite"),
            topSitesContainer = document.getElementById("topSites"),
            financePanel = document.getElementById("financePanel"),
            sportsPanel = document.getElementById("sportsPanel"),
            lastVisibleElement = 0,
            lastRightPos,
            clientWidth,
            availableRight,
            availableLeft,
            leftPaddingForCenter;
        if (topSites.length > 0) {
            topSitesContainer.style.padding = '0 30px 0 30px'; //before resizing we reinit padding to 30px left and right
            for (var i = 0; i < topSites.length && isElementVisible(topSites[i]); i++) {
                lastVisibleElement = i;
            }

            lastRightPos = topSites[lastVisibleElement].offsetLeft + topSites[lastVisibleElement].offsetWidth;
            clientWidth = document.documentElement.clientWidth;
            availableRight = clientWidth - lastRightPos;
            if (extGlobal.constants.financeUI && financePanel) { //centering the top sites when we have a right panel
                topSitesContainer.classList.add("financeTopSites"); //this class is used in the css stylesheet
                availableRight = availableRight - financePanel.offsetWidth;

                var dropupMenu = document.getElementById("dropupMenu");
                dropupMenu.style.marginRight = financePanel.offsetWidth;
            }
            if (extGlobal.constants.sportsUI && sportsPanel) { //centering the top sites when we have a right panel
                 topSitesContainer.classList.add("sportsTopSites"); //this class is used in the css stylesheet
                 availableRight = availableRight - sportsPanel.offsetWidth;

                 var dropupMenuSports = document.getElementById("dropupMenu");
                 dropupMenuSports.style.marginRight = sportsPanel.offsetWidth;
             }
            availableLeft = topSites[0].offsetLeft;
            leftPaddingForCenter = Math.round((availableLeft + availableRight) / 2);
            topSitesContainer.style.padding = '0 30px 0 ' + leftPaddingForCenter + 'px';
        }
        return lastVisibleElement;
    }

    function isElementVisible(el) {
        var rect     = el.getBoundingClientRect(),
            vWidth   = window.innerWidth || document.documentElement.clientWidth,
            vHeight  = window.innerHeight || document.documentElement.clientHeight,
            efp      = function (x, y) { return document.elementFromPoint(x, y); };
        // Return false if it's not in the viewport - when window is too smal the icons will fall to next line which is below viewport (last condition)
        if ((rect.right < 0 || rect.bottom < 0) || rect.left > vWidth || rect.top > vHeight) {
            return false;
        } else {
            return true;
        }
    }

    function getSearchUrl(queryString){
        var url = "",
            distribChannel = extGlobal.constants.distributionChannels[extGlobal.distributionChannel],
            isFirefox = extGlobal.browserGap.isFirefox || extGlobal.browserGap.isWebExtension,
            isSafari = extGlobal.browserGap.isSafari,
            typeParam = extGlobal.constants.distributionChannels[extGlobal.distributionChannel].typeParam ? extGlobal.constants.distributionChannels[extGlobal.distributionChannel].typeParam : extGlobal.constants.typeParam;
        if(isFirefox){
            url = "https://" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_domain") +
                (distribChannel.hsimp ? "/yhs" : "") +
                "/" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_path") +
                "?p=" + encodeURIComponent(queryString) +
                (distribChannel.hspart ? "&hspart=" + distribChannel.hspart : "") +
                (distribChannel.hsimp ? "&hsimp=" + distribChannel.hsimp : "") +
                (distribChannel.frCodeFirefox && !distribChannel.hsimp ? "&fr=" + distribChannel.frCodeFirefox : "") +
                "&type=" + typeParam;
        }
        else if(isSafari){
            var searchParamSf = distribChannel.searchType === "fr" ? "&fr=" + distribChannel.frCodeSafari : "&hspart=" + distribChannel.hspart + "&hsimp=" + distribChannel.hsimp;
            url = "https://" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_domain") +
                (distribChannel.searchType === "hsimp" ? "/yhs" : "") +
                "/" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_path") +
                "?p=" + encodeURIComponent(queryString) +
                searchParamSf + //for chrome it may be fr code OR hsimp+hspart, depending on config
                "&type=" + typeParam;
        }
        else{
            var searchParam = distribChannel.searchType === "fr" ? "&fr=" + distribChannel.frCodeChrome : "&hspart=" + distribChannel.hspart + "&hsimp=" + distribChannel.hsimp;
            url = "https://" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_domain") +
                (distribChannel.searchType === "hsimp" ? "/yhs" : "") +
                "/" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_path") +
                "?p=" + encodeURIComponent(queryString) +
                searchParam + //for chrome it may be fr code OR hsimp+hspart, depending on config
                "&type=" + typeParam;
        }
        return url;
    }

    // TODO: need fr2 code and urls on FF and partners
    function getTrendingNowUrl(queryString){
        if (!queryString) {
            return "";
        }

        var distribChannel = extGlobal.constants.distributionChannels[extGlobal.distributionChannel],
            type = distribChannel.trendingNow && distribChannel.trendingNow.type ? distribChannel.trendingNow.type : "",
            url = "",
            tnFrCode = extGlobal.constants.tnFrCode;

        url = "https://" + extGlobal.browserGap.getLocalizedString("newtab_extension_search_prov_domain") +
            "/search" +
            "?p=" + encodeURIComponent(queryString) +
            "&fr=" + tnFrCode +
            (type ? "&type=" + type : "");

        return url;
    }

    function setTnViewParams (newTabData, beaconParams) {
        var enableTN = newTabData.enableTN || false;
        var tnData = newTabData.trendingNowData || null;
        var tnItems;

        if (newTabData.breakingNews) {
            beaconParams.tn_enable = extGlobal.constants.tn_enable_value; //breaking news
            beaconParams.aid = newTabData.breakingNews.uuid;
            var uniqueId = getBNUniqueId(newTabData.breakingNews);
            var shownTimes = JSON.parse(localStorage.getItem("bnAlreadyShown") || "{}");
            if (shownTimes[uniqueId]) {
                beaconParams.cat = "" + shownTimes[uniqueId];
            }

        } else if (enableTN) {
            beaconParams.tn_enable = "1";

            if (tnData) {
                tnData = JSON.parse(tnData);
                tnItems = tnData.items || [];
                beaconParams.tn_num = (tnItems.length || 0).toString();
            } else {
                beaconParams.tn_num = "0";
            }
        } else {
            beaconParams.tn_enable = "0";
            beaconParams.tn_num = "0";
        }
    }

    function getBNUniqueId(breakingNews) {
        return breakingNews ? (breakingNews.uuid + "_" + breakingNews.published_time) : "";
    }

    function setPartnerSiteFlag (beaconParams) {
        var partnerSites = localStorage.getItem("partnerSites") || "";
        beaconParams.partner_sites = partnerSites;
    }

    function setActivePartnerSites (partners, blackList) {
        var partnerSites = [],
            isBlacklist;
        if (extGlobal.browserGap.isChrome) {
            Object.keys(partners).forEach(function (key) {
                isBlacklist = false;
                for (var i = 0; i < blackList.length; i++) {
                    if (blackList[i] === partners[key].url) {
                        isBlacklist = true;
                    }
                }
                if (!isBlacklist) {
                    partnerSites.push(partners[key].title);
                }
            });
            localStorage.setItem("partnerSites", partnerSites.join(","));
        }
    }

    function stripHtml(str) {
        var tmp = document.implementation.createHTMLDocument().body;
        tmp.innerHTML = str;
        return tmp.textContent || tmp.innerText || "";
    }

    this.hideElement = hideElement;
    this.unhideElement = unhideElement;
    this.clearInnerHTML = clearInnerHTML;
    this.clipToElement = clipToElement;
    this.resizeNewTab = resizeNewTab;
    this.getSearchUrl = getSearchUrl;
    this.getTrendingNowUrl = getTrendingNowUrl;
    this.setTnViewParams = setTnViewParams;
    this.setPartnerSiteFlag = setPartnerSiteFlag;
    this.setActivePartnerSites = setActivePartnerSites;
    this.stripHtml = stripHtml;
    this.getBNUniqueId = getBNUniqueId;
    return this;
}

/* globals exports */
function Constants() { //jshint ignore : line
    //Common constants
    this.accepted_photos_index = "acceptedPhotosIdx";
    this.cache_threshold_number = 5;
    this.next_cache_size = 10;
    this.flickr_url = "https://api.flickr.com/services/rest/?method=flickr.groups.pools.getPhotos&api_key=3ae7651ec514a2d3550c3afbc962a733&group_id=2768627@N24&format=json&nojsoncallback=1&extras=owner_name,url_k,url_l,url_m,media&per_page=500&page=";
    this.tn_url = "https://search.yahoo.com/trending/us_general.json";
    this.tnFrCode = "yset_chr_syc_tn";
    this.bn_url = "https://s.yimg.com/os/fp_gondor_breaking_news/news_us_en-us.json";
    this.bnTimeLimit = 14400;
    this.befrugal_url = "http://www.befrugal.com/lp/yahoo";
    this.weather_url = "https://query.yahooapis.com/v1/public/yql?q=";
    this.weatherUI = false;
    this.tn_interval = 300000; //Trending Now stories will be updated every 5 mins
    this.tn_enable_value = "2";
    this.bn_interval = 600000; //Breaking news will be polled every 10 mins
    this.finance_interval = 1200000; //Finance stories will be updated every 20 minutes
    this.twoWeeks = 14*24*3600*1000;
    this.aWeek = 7*24*3600*1000;
    this.footerUpdatedStart = 1523289600000; //april 3rd 2018
    this.footerUpdatedEnd = 1543104000000; //november 25th 2018
    this.video_media = "video";
    this.ratio_min = 1.0;//1.4;
    this.ratio_max = 1.85;
    this.width5 = 1175;
    this.width4 = 920;
    this.width3 = 580;
    this.timeout_serverError = 1800000;
    this.timeout_ffOffline = 60000;
    this.uiContainerWidth = 360;
    this.uiContainerWithSearchProtectWidth = 420;
    this.topSitesRefreshTime = 3600000; //1 hour
    this.historyRefreshTime = 600000; //10 minutes
    this.titleStringLength = 18;
    this.ffTopSites = 20;
    this.tracker_page_info = "page_info";
    this.tracker_click_info = "click_info";
    this.tracker_link_view = "link_view";
    this.tracker_install = 'install';
    this.tracker_upgrade = 'upgrade';
    this.tracker_uninstall = 'uninstall';
    this.tracker_alive = 'live';
    this.tracker_search_modified = 'modified';
    this.tracker_alive_ping_interval = 28800000 ;// 8 hrs = 8 * 60 * 60 * 1000 milli sec.
    this.tracker_alive_ping_interval_we = 86400000;
    this.tracker_gpos_topsites = 1;
    this.tracker_gpos_search_protect_panel = 2;
    this.tracker_gpos_flickr = 3;
    this.tracker_gpos_feedback = 5;
    this.tracker_gpos_search_box = 4;
    this.tracker_flickrArea_p_owner = 1;
    this.tracker_flickrArea_p_flickrlogo =2;
    this.tracker_searchArea_p_search_box = 1;
    this.tracker_searchArea_p_search_suggestion = 2;
    this.tracker_feedbackArea_p_feedback = 1;
    this.tracker_topSitesArea_p_edit = 11;
    this.tracker_topSitesArea_p_done = 12;
    this.tracker_searchArea_slk_search_box = "newtab_search_box";
    this.tracker_searchArea_slk_search_suggestion = "newtab_search_suggestion";
    this.tracker_vtestid = "default";
    this.keycode_up = 38;
    this.keycode_down = 40;
    this.keycode_left = 37;
    this.keycode_right = 39;
    this.keycode_enter = 13;
    this.keycode_control = 17;
    this.keycode_command_l = 91;
    this.keycode_command_r = 93;
    this.keycode_delete = 8;
    this.suggestionDisplayCount = 6;
    this.suggestionSitesCount = 2;
    this.initialSuggestIndex = -1;
    this.tracker_browser_chr = "chr";
    this.tracker_browser_ff = "ff";
    this.tracker_browser_sf = "sf";
    this.maxBgPhotosStored = 50;
    this.splicePercent = 0.5;
    this.acceptedPhotosRemaining = 20;
    this.feedBackDistance = 24;
    this.rightToggleViewDistance = 25;
    this.iconToggleDistance = 4;
    this.iconsPerRow = 9;
    this.shortenStringLength = 25;
    this.isToolbar = "yahoo-newtab-toolbar";
    this.toolbarEdition = "toolbar";
    this.toolbarInstallDate = "yahoo-newtab-toolbar-install-date";
    this.distributionChannelPrefKey = "yahoo-newtab-distribution-channel";
    this.userSearchSetChoice = "yahoo-newtab-user-searchset";
    this.toolbarDistribution = "external-tb";
    this.breakingNewsFrCode = "yset_chr_newtab_brkg";

    this.distributionDefaultChannel = "external-oracle";
    this.contentEnhancerFF = false;
    this.distributionChannels = {
        "external-oracle": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle"
        },
        "external-oracle-intl": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle"
        },
        "external-oracle-v1": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle"
        },
        "external-bundled": {
            "hsimp": "yhs-009",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle"
        },
        "external-oo": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "oo"
        },
        "external-finance": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "fin",
            "typeDefault": "fin",
            "amp_desc_dist": "finance"
        },
        "external-oo-guide-dialog": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "newtab_v2",
            "typeDefault": "default_v2",
            "amp_desc_dist": "oo-guide-dialog"
        },
        "external-oo-nosearch": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab2",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "oo-nosearch"
        },
        "external-oracle-befrugal": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle-befrugal"
        },
        "external-tb": {
            "hsimp": "yhs-100",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "tb"
        },
        "external-oo-win-installer": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_syc_oo",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "win-installer"
        },
        "external-amo": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "amo"
        },
        "external-medianet": {
            "hsimp": "yhs-001",
            "hspart": "mnet",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "amp_desc_dist": "medianet"
        },
        "external-ddc": {
            "hsimp": "yhs-domaindev_pdfonline",
            "hspart": "domaindev",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "amp_desc_dist": "ddc"
        },
        "external-comodo": {
            "hsimp": "yhs-ccs",
            "hspart": "comodo",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "amp_desc_dist": "comodo"
        },
        "external-adco": {
            "hsimp": "yhs-ambe_newtab_ff",
            "hspart": "ambe",
            "frCodeChrome": "amb_ext",
            "frCodeFirefox": "amb_ext",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "adco"
        },
        "external-marketing": {
            "frCodeChrome": "yset_win_extmktg",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "mrkt_newtab",
            "typeDefault": "mrkt_default",
            "amp_desc_dist": "marketing"
        },
        "external-mediafire": {
            "hsimp": "yhs-mdf_yep",
            "hspart": "mdf",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "mediafire"
        },
        "external-adssquared": {
            "hsimp": "yhs-dom_yep",
            "hspart": "dom",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "adssquared"
        },
        "external-ironsource": {
            "frCodeChrome": "chrf-iryus",
            "frCodeFirefox": "chrf-iryus",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "ypi_znlrm_00_00_chr",
            "typeDefault": "ypi_znlrm_00_00_chr",
            "amp_desc_dist": "ironsource"
        },
        "external-ironsource-chr": {
            "frCodeChrome": "chrf-iryus",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "ypi_znlrm_00_00_chr",
            "typeDefault": "ypi_znlrm_00_00_chr",
            "amp_desc_dist": "ironsource"
        },
        "external-ironsource-ff": {
            "frCodeFirefox": "chrf-iryus",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "ypi_znlrm_00_00_ff",
            "typeHomePage": "ypi_znlrm_00_00_ff",
            "typeDefault": "ypi_znlrm_00_00_ff",
            "amp_desc_dist": "ironsource"
        },
        "external-aztec": {
            "hsimp": "yhs-flickrnewtab",
            "hspart": "aztec",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "aztec"
        },
        "external-visicom": {
            "hsimp": "yhs-burnaware",
            "hspart": "visicom",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "visicom"
        },
        "external-bndl-week1": {
            "hsimp": "yhs-204",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustwk1",
            "frCodeFirefox": "mozcustwk1",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustwk1",
            "amp_desc_dist": "bndl-week1",
            "hpYhsParam": "10011",
            "typeParam": "yhs-mozilla-204",
            "typeDefault": "yhs-mozilla-204"
        },
        "external-bndl-day8": {
            "hsimp": "yhs-224",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustd8",
            "frCodeFirefox": "mozcustd8",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustd8",
            "amp_desc_dist": "bndl-day8",
            "hpYhsParam": "10013",
            "typeParam": "yhs-mozilla-224",
            "typeDefault": "yhs-mozilla-224"
        },
        "external-bndl-main": {
            "hsimp": "yhs-244",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustmain",
            "frCodeFirefox": "mozcustmain",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustmain",
            "amp_desc_dist": "bndl-main",
            "hpYhsParam": "10015",
            "typeParam": "yhs-mozilla-244",
            "typeDefault": "yhs-mozilla-244"
        },
        "external-bndl-backup": {
            "hsimp": "yhs-264",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustbkup",
            "frCodeFirefox": "mozcustbkup",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustbkup",
            "amp_desc_dist": "bndl-backup",
            "hpYhsParam": "10017",
            "typeParam": "yhs-mozilla-264",
            "typeDefault": "yhs-mozilla-264"
        },
        "external-bndl-foxload-de": {
            "frCodeChrome": "foxload",
            "frCodeFirefox": "foxload",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle",
            "ffHomepageURL": "https://de.search.yahoo.com/firefox/?fr=foxload-sfp"
        },
        "external-bndl-foxload-fr": {
            "frCodeChrome": "foxload",
            "frCodeFirefox": "foxload",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle",
            "ffHomepageURL": "https://fr.search.yahoo.com/firefox/?fr=foxload-sfp"
        },
        "external-bndl-foxload-uk": {
            "frCodeChrome": "foxload",
            "frCodeFirefox": "foxload",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle",
            "ffHomepageURL": "https://uk.search.yahoo.com/firefox/?fr=foxload-sfp"
        },
        "external-oracle-newtab-offer": {
            "frCodeChrome": "yset_control_chr_oracle",
            "frCodeFirefox": "yset_control_ff_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "amp_desc_dist": "oracle-offer"
        },
        "external-oo-srp-promo-chr": {
            "frCodeChrome": "yset_chr_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_chrnewtabsrp",
            "typeHomePage": "bnr_chrnewtabsrp",
            "typeDefault": "bnr_chrnewtabsrp",
            "amp_desc_dist": "oo-srp-promo-chr"
        },
        "external-oo-srp-promo-ff": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_ffnewtabsrp",
            "typeHomePage": "bnr_ffnewtabsrp",
            "typeDefault": "bnr_ffnewtabsrp",
            "amp_desc_dist": "oo-srp-promo-ff"
        },
        "external-oo-syc-promo-chr": {
            "frCodeChrome": "yset_chr_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_chrnewtabsyc",
            "typeHomePage": "bnr_chrnewtabsyc",
            "typeDefault": "bnr_chrnewtabsyc",
            "amp_desc_dist": "oo-syc-promo-chr"
        },
        "external-oo-syc-promo-ff": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_ffnewtabsyc",
            "typeHomePage": "bnr_ffnewtabsyc",
            "typeDefault": "bnr_ffnewtabsyc",
            "amp_desc_dist": "oo-syc-promo-ff"
        },
        "external-mktgsem": {
            "frCodeChrome": "yset_chr_nt_mktgsem",
            "frCodeFirefox": "yset_ff_nt_mktgsem",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "mktgsem"
        },
        "external-sports": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "sports",
            "typeDefault": "sports",
            "amp_desc_dist": "sports"
        },
        "external-befrugal-chr": {
            "frCodeChrome": "dss_befrugal",
            "partnerCode": "befrugal",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "breakingNewsFrCode": "yset_chr_newtab_brkg",
            "amp_desc_dist": "befrugal"
        },
        "external-kingsoft-chr": {
            "frCodeChrome": "dss_kingsoft",
            "partnerCode": "kingsoft",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "breakingNewsFrCode": "yset_chr_newtab_brkg",
            "amp_desc_dist": "kingsoft"
        }
    };

    this.amp_desc_type = "newtab";
    this.amp_desc_dist_default = "oo";

    //Common distribution variables
    this.typeParam = "newtab";
    this.typeDefault = "default";
    this.typeIcon = "icon";
    this.typeHomePage = "hpset";
    this.chrome_space_id = 151340124;
    this.firefox_space_id = 151340125;
    this.safari_space_id = 151340134;

    this.mktg_external = "external-mktgsem";
    this.mktg_url = "https://6824905.fls.doubleclick.net/activityi;src=6824905;type=nwtb;cat=nwtbconf;u1={GUID};u2={USERTYPE};u4={BROWSER};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord=1?";

    //Firefox Specific Constants
    this.amo_addon_url_regexp = "addons\.mozilla\.org\/.*\/firefox\/addon\/.*new-tab-by-yahoo"; // .* is for language, which could be en-US, fr, etc.
    this.yahoo_url_regexp = ".*.yahoo.*";
    this.amo_addon_toolbar_url_regexp = "addons\.mozilla\.org\/.*\/firefox\/addon\/yahoo-toolbar-and-new-tab"; // .* is for language, which could be en-US, fr, etc.
    this.chrome_ext_url_pattern = "*://chrome.google.com/webstore/detail/search-and-new-tab-by-yah*";
    this.amo_pattern_url = "*://addons.mozilla.org/*/firefox/addon/search-and-new-tab-by-yahoo*"; //used by webExtension
    this.yahoo_pattern_url = "https://*.yahoo.com/*"; //used by webExtension
    this.browser_newtab_url = "browser.yahoo.newtab.url";
    this.extensions_newtab_oldnewtab_url = "extensions.yahoo.newtab.oldnewtab.url";
    this.yahoo_content_enhancer = "yahoo-content-enhancer";
    this.yahoo_content_enhancer_prompt = "yahoo-content-enhancer-prompt";
    this.searchbox_newtab_focus = "yahoo_newtab_search";
    this.privacy_url = "https://policies.yahoo.com/us/en/yahoo/privacy/index.htm";
    this.terms_url = "https://policies.yahoo.com/us/en/yahoo/terms/utos/index.htm";
    this.protect_interval = 1296000000; // = 15 days = 15 * 24 * 60 * 60 * 1000 milli sec.
    this.tag_url = "Url";
    this.tag_param = "Param";
    this.attribute_name = "name";
    this.attribute_value = "value";
    this.attribute_template = "template";
    this.text_xml = "text/xml";
    this.general_useragent_locale = "general.useragent.locale";
    this.search_protect_accept = "acceptDiv";
    this.search_protect_decline = "declineButton";
    this.tracker_searchProtectArea_p_accept = 1;
    this.tracker_searchProtectArea_p_decline = 2;
    this.tracker_gpos_searchSetDialog = 5;
    this.tracker_searchSetDialog_p_okay = 1;
    this.tracker_searchSetDialog_p_cancel = 2;
    this.tracker_searchSetDialog_sec_okay = "ff_searchset_dialog_okay";
    this.tracker_searchSetDialog_sec_cancel = "ff_searchset_dialog_cancel";
    this.tracker_searchSetDialog_slk_okay = "okay";
    this.tracker_searchSetDialog_slk_cancel = "cancel";
    this.tracker_searchSet_delc = "ext_ss";
    this.tracker_reject = "reject";
    this.old_home_page = "old_home_page_url";
    this.old_search_provider = "old_search_provider_name";
    this.browser_homepage_pref = "browser.startup.homepage";
    this.search_hspart_val = "mozilla";
    this.localized_strings_keys_ff = [
        "newtab_extension_search_box_label",
        "newtab_extension_photo_label",
        "newtab_extension_on_flickr",
        "newtab_extension_tab_title",
        "newtab_firefox_extension_search_protect_prompt_part1",
        "newtab_firefox_extension_search_protect_prompt_part2",
        "newtab_firefox_extension_search_protect_accept",
        "newtab_firefox_extension_search_protect_decline",
        "newtab_extension_show_image",
        "newtab_extension_show_topsites",
        "newtab_extension_feedback_link_label",
        "newtab_extension_feedback_link",
        "newtab_extension_trending_now_label",
        "newtab_extension_add_url",
        "newtab_extension_add_title",
        "newtab_extension_enter_url",
        "newtab_extension_enter_title",
        "newtab_extension_edit_settings_label",
        "newtab_extension_done_settings_label",
		    "newtab_extension_homepage_url",
        "newtab_extension_hide_tn",
        "newtab_extension_show_tn",
        "newtab_extension_show_wthr",
        "newtab_extension_hide_wthr",
        "newtab_extension_show_fah",
        "newtab_extension_show_Cel",
        "newtab_extension_prompt_search",
        "newtab_extension_keep_current",
        "newtab_extension_ok",
        "newtab_extension_cancel",
        "newtab_extension_quick_search_prompt",
        "newtab_extension_quick_search_description_1",
        "newtab_extension_quick_search_description_2",
        "newtab_extension_options",
        "newtab_extension_page_focus_label",
        "newtab_extension_page_focus_address_bar",
        "newtab_extension_page_focus_search_box",
        "newtab_extension_quick_search_label",
        "newtab_extension_quick_search_checkbox",
        "newtab_extension_quick_search_checkbox_details",
        "newtab_extension_feedback",
        "newtab_extension_privacy",
        "newtab_extension_first_tab_prompt_title",
        "newtab_extension_first_tab_prompt_details"
    ];
    this.localized_search_strings_keys_ff = [
        "newtab_extension_search_prov_domain",
        "newtab_extension_search_prov_path",
        "newtab_extension_search_suggest_domain",
        "newtab_extension_search_suggest_path"
    ];
    this.localized_weather_strings_keys_ff = [
        "tornado_label",
        "tropical_storm_label",
        "hurricane_label",
        "severe_thunderstorms_label",
        "thunderstorms_label",
        "mixed_rain_and_snow_label",
        "mixed_rain_and_sleet_label",
        "mixed_snow_and_sleet_label",
        "freezing_drizzle_label",
        "drizzle_label",
        "freezing_rain_label",
        "showers_label",
        "snow_flurries_label",
        "light_snow_showers_label",
        "blowing_snow_label",
        "snow_label",
        "hail_label",
        "sleet_label",
        "dust_label",
        "foggy_label",
        "haze_label",
        "smoky_label",
        "blustery_label",
        "windy_label",
        "cold_label",
        "cloudy_label",
        "mostly_cloudy_label",
        "partly_cloudy_label",
        "clear_label",
        "sunny_label",
        "fair_label",
        "mixed_rain_and_hail_label",
        "hot_label",
        "isolated_thunderstorms_label",
        "scattered_thunderstorms_label",
        "scattered_thunderstorms_label",
        "scattered_showers_label",
        "heavy_snow_label",
        "scattered_snow_showers_label",
        "thundershowers_label",
        "snow_showers_label",
        "isolated_thundershowers_label"
    ];
    this.ff_newtab_localization = {
        "New Tab": true, //en-US, en-GB
        "Nova aba": true, //pt-BR
        "Neuer Tab": true, //de
        "Nueva pestaña": true, //es-ES, es-MX, es-AR, es-CL
        "Nouvel onglet": true, //fr
        "新分頁": true, //zh-TW
        "Nuova scheda": true, //it
        "Ny flik": true, //sv-SE
        "Tab mới": true, //vi
        "แท็บใหม่": true, //th
        "Tab Baru": true, //id
        "Novo separador": true, //pt-PT
        "Nieuw tabblad": true, //nl
        "Новая вкладка": true, //ru
        "Uusi välilehti": true, //fi
        "Nowa karta": true, //pl
        "Nyt faneblad": true, //da
        "Pestanya nova": true, //ca
        "Ny fane": true, //nb-NO
        "Filă nouă": true, //ro
        "لسان جديد": true, //ar
        "Yeni sekme": true, //tr
        "新規タブ": true, //jp
        "新标签页": true //zh-CN
    };

    this.offlinePhotos = [
        {
            title: "New Mexico Sands",
            owner: "126360766@N06",
            url_l: "offlinephotos/newmexico.JPG",
            dataURL: "offlinephotos/newmexico.JPG",
            ownername: "Suraj Saripalli"
        }
    ];

    this.finance_quotes_url = "http://partner-query.finance.yahoo.com/v6/finance/quote/?symbols={QUOTES}&formatted=true&lang=en-US&region=US&modules=quoteType,summaryDetail,description,quoteDetail,price";
    this.finance_basic_quotes_url = "https://partner-query.finance.yahoo.com/v6/finance/basicQuote/?symbols={QUOTES}&formatted=true&lang=en-US&region=US&debug=true&crumb={CRUMB}";
    //this.finance_trending_url = "http://finance-yql.v1.production.manhattan.gq1.yahoo.com/v1/finance/trending/us?debug=true";
    this.finance_news_url = "https://partner-query.finance.yahoo.com/v2/finance/quotefeeds?count=20&symbols={QUOTES}";
    //this.finance_top_news_url = "https://finance.mobile.yahoo.com/dp/v2/newsfeed?category=generalnews&count=20";
    this.finance_autosuggest_quote = 'https://partner-query.finance.yahoo.com/v6/finance/autocomplete?query={QUERY}&region=us&lang=en-us';
    this.finance_watchlist_url = "https://partner-query.finance.yahoo.com/v6/finance/portfolio";
    this.finance_crumb_url = "https://partner-query.finance.yahoo.com/v1/test/getcrumb";
    this.finance_property_url = "https://finance.yahoo.com";
    this.finance_quote_page = "https://finance.yahoo.com/quote/";
    this.defaultQuotes = ["^DJI", "^GSPC", "^IXIC", "FB", "AAPL", "VZ"];
    this.finance_add_new_quote = "addNewQuote";
    this.finance_add_symbol_button = "addSymbolBtn";
    this.finance_log_out_button = "logOutBtn";
    this.finance_more_news_button = "moreNewsBtn";
    this.finance_news_article = "newsArticle";
    this.finance_quote_link = "quoteLink";
    this.finance_delete_quote_btn = "deleteQuoteBtn";
    this.finance_portfolio_link = "portfolioLink";
    this.finance_portfolio_url = "https://finance.yahoo.com/portfolio/{p_id}/view/v1";
    this.normalAnimation = 400;
    this.slowAnimation = 600;
    this.financeUI = false;
    this.breakingNewsUI = true;
    this.financeQuotesShowMax = 6;
    this.financeNewsShowMax = 8;
    this.financeQuotesSuggestMax = 6;

    //Chrome Specific Contstants
    this.clueAttemptCount = 5;
    this.clueAttemptTimeout = 5 * 1000;
    this.extensionUninstallUrl = "https://downloads.yahoo.com/goodbye";

    //Bucket Tracking
    this.bucket_freshInstall = "freshInstall";
    this.bucket_permissions = {};
    this.bucket_upgradePath = {};

    //sports specific constant for Chrome
    this.sportsUI = false;
    this.sports_home = "https://sports.yahoo.com";
    this.sports_trendingID_url = "https://api-secure.sports.yahoo.com/v1/editorial/s/trending_game_ids?trending_config=new_tab&ysp_new_tab=1";//works on IP address
    this.default_gameType= "mlb";
    //sports scoreBoard
    this.scoreBoard_url = "https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?lang=en-US&region=US&tz=America%2FLos_Angeles&ysp_redesign=1&leagues={GAME}&date=current&v=2&ysp_enable_last_update=1&ssl=true&ysp_new_tab=1";

    this.sports_interval = 900000;// 15 mins
    this.mlb_standing = {
        'conference_abbr': 'AL',
        'conference': 'American League',
        'division': 'East'
    };
    this.nfl_standing = {
        'conference_abbr': 'AFC',
        'conference': 'American',
        'division': 'East'
    };
    this.nhl_standing = {
        'conference_abbr': '',
        'conference': 'Eastern',
        'division': 'Atlantic'
    };
    this.nba_standing = {
        'conference_abbr': '',
        'conference': 'Eastern',
        'division': 'Atlantic'
    };

    //sports standings
    this.standings_url = "https://api-secure.sports.yahoo.com/v1/editorial/league/{STANDINGS};enable_structure=1;out=seasons;season=standings/teams;season=;division=;top_division_only=;conf_id=;out=images:only_type=image.type.team_logo_sportacular_white_bg,standings/stat_categories;alias=full_standings;season=;season_period=/stat_types/stats?lang=en-US&region=US&tz=America%2FLos_Angeles&ysp_grand_slam=1&ysp_redesign=1&format=json&ssl=true&ysp_new_tab=1";
    this.more_standings_url = "https://sports.yahoo.com/{GAME}/standings/";

    //trendingPlayers
    this.player_part1 = "https://api-secure.sports.yahoo.com/v1/editorial/team/";
    this.player_part2 = "/players;out=bio,positions,depth_chart_positions/images;width=124;height=172;type=large_cutout_hd?ysp_grand_slam=1&lang=en-US&format=json&ysp_new_tab=1";

    //trendingNews
    this.news_part1 = "https://api-secure.sports.yahoo.com/v1/editorial/article_index;use_top_headlines=1;out=text;count=4;content_types=lgns;leagues=";
    this.news_part2 = "?ssl=1&lang=&format=json&ysp_new_tab=1";

    //For the beacon
    this.sports_standings_link = 'standings';
    this.sports_live_link = 'live';
    this.sports_upcoming = 'upcoming';
    
}


/* globals exports */
function SiteConfig(){ //jshint ignore : line
    this.siteWhitelist = {
        "facebook.com": {
            "color": "#3B5998",
            "title": "Facebook",
            "shortTitle": "Fb"
        },
        "news.yahoo.com": {
            "color": "#400090",
            "title": "Yahoo News",
            "shortTitle": "YN"
        },
        "spotify.com": {
            "color": "#8DC100",
            "title": "Spotify",
            "shortTitle": "Sp"
        },
        "github.com": {
            "color": "#000000",
            "title": "GitHub",
            "shortTitle": "Gh"
        },
        "yahoo.monday.com.tw": {
            "color": "#400090",
            "title": "Yahoo!奇摩購物中心",
            "shortTitle": "購"
        },
        "search.yahoo.com": {
            "color": "#400090",
            "title": "Yahoo Search",
            "shortTitle": "YS"
        },
        "yahoo.com": {
            "color": "#400090",
            "title": "Yahoo",
            "shortTitle": "Ya"
        },
        "google.com": {
            "color": "#4583EC",
            "title": "Google",
            "shortTitle": "Go"
        },
        "youtube.com": {
            "color": "#CC181E",
            "title": "YouTube",
            "shortTitle": "YT"
        },
        "gmail.com": {
            "color": "#4583EC",
            "title": "Gmail",
            "shortTitle": "Gm"
        },
        "mail.yahoo.com": {
            "color": "#400090",
            "title": "Yahoo Mail",
            "shortTitle": "YM"
        },
        "mail.google.com": {
            "color": "#4583EC",
            "title": "Gmail",
            "shortTitle": "Gm"
        },
        "netflix.com": {
            "color": "#E50914",
            "title": "Netflix",
            "shortTitle": "Ne"
        },
        "google.ca": {
            "color": "#4583EC",
            "title": "Google",
            "shortTitle": "Go"
        },
        "google.co.th": {
            "color": "#4583EC",
            "title": "Google",
            "shortTitle": "Go"
        },
        "google.co.in": {
            "color": "#4583EC",
            "title": "Google",
            "shortTitle": "Go"
        },
        "google.co.uk": {
            "color": "#4583EC",
            "title": "Google",
            "shortTitle": "Go"
        },
        "amazon.com": {
            "color": "#242F41",
            "title": "Amazon",
            "shortTitle": "Am"
        },
        "cnn.com": {
            "color": "#CB0000",
            "title": "CNN",
            "shortTitle": "CN"
        },
        "edition.cnn.com": {
            "color": "#CB0000",
            "title": "CNN",
            "shortTitle": "CN"
        },
        "tumblr.com": {
            "color": "#36465D",
            "title": "Tumblr",
            "shortTitle": "Tu"
        },
        "twitter.com": {
            "color": "#1DA1F2",
            "title": "Twitter",
            "shortTitle": "YS"
        },
        "ebay.com": {
            "color": "#85B716",
            "title": "eBay",
            "shortTitle": "eB"
        },
        "msn.com": {
            "color": "#F4F4F2",
            "title": "msn",
            "shortTitle": "ms"
        },
        "wellsfargo.com": {
            "color": "#BE191D",
            "title": "Wells Fargo",
            "shortTitle": "WF"
        },
        "aol.com": {
            "color": "#457CB5",
            "title": "AOL",
            "shortTitle": "AO"
        },
        "apps.facebook.com": {
            "color": "#3B5998",
            "title": "Facebook",
            "shortTitle": "Fb"
        },
        "flickr.com": {
            "color": "#161617",
            "title": "Flickr",
            "shortTitle": "Fl"
        },
        "chrome.google.com": {
            "color": "#4583EC",
            "title": "Chrome",
            "shortTitle": "Ch"
        },
        "instagram.com": {
            "color": "#8A3BBB",
            "title": "Yahoo",
            "shortTitle": "YS"
        },
        "linkedin.com": {
            "color": "#1D87BE",
            "title": "LinkedIn",
            "shortTitle": "Li"
        },
        "bing.com": {
            "color": "#www.bing.com",
            "title": "Bing",
            "shortTitle": "Bi"
        },
        "pandora.com": {
            "color": "#005484",
            "title": "Bing",
            "shortTitle": "Bi"
        },
         "ups.com": {
            "color": "#351C15",
            "title": "UPS",
            "shortTitle": "UP"
        },
        "fedex.com": {
            "color": "#FB661F",
            "title": "Fedex",
            "shortTitle": "FX"
        },
        "macworld.com": {
            "color": "#2699CD",
            "title": "Macworld",
            "shortTitle": "MW"
        }
    };

    this.mapSearchToSite = {
        "amazon": "https://amazon.com",
        "aol": "https://www.aol.com",
        "bing": "https://bing.com",
        "chrome": "https://chrome.google.com",
        "cnn": "http://www.cnn.com",
        "ebay": "https://ebay.com",
        "facebook": "https://facebook.com",
        "flickr": "https://flickr.com",
        "github": "https://github.com",
        "gmail": "https://gmail.com",
        "google": "https://google.com",
        "instagram": "https://instagram.com",
        "linkedin": "https://linkedin.com",
        "msn": "https://msn.com",
        "netflix": "https://netflix.com",
        "pandora": "https://pandora.com",
        "spotify": "https://spotify.com",
        "tumblr": "https://tumblr.com",
        "twitter": "https://twitter.com",
        "verizon": "https://www.verizonwireless.com",
        "wellsfargo": "https://wellsfargo.com",
        "yahoo": "https://yahoo.com",
        "ymail": "https://mail.yahoo.com",
        "youtube": "https://youtube.com"
    };

    this.topIcons = {
        adobe : "adobe",
        airbnb : "airbnb",
        amazon : "amazon",
        aol : "aol",
        apple : "apple",
        bankofamerica : "bankofamerica",
        bbc : "bbc",
        behance : "behance",
        bestbuy : "bestbuy",
        bing : "bing",
        careersyahoo : "careersyahoo",
        chase : "chase",
        cnn : "cnn",
        codepen : "codepen",
        craigslist : "craigslist",
        dailymotion : "dailymotion",
        dribbble : "dribbble",
        dropbox : "dropbox",
        ebay : "ebay",
        espn : "espn",
        evernote : "evernote",
        facebook : "facebook",
        financeyahoo : "financeyahoo",
        flickr : "flickr",
        foxnews : "foxnews",
        gamesyahoo : "gamesyahoo",
        gettyimages : "gettyimages",
        github: "github",
        gmail : "gmail",
        google : "google",
        googledocs : "googledocs",
        docsgoogle : "googledocs",
        googledrive : "googledrive",
        drivegoogle : "googledrive",
        googleinbox : "googleinbox",
        inboxgoogle : "googleinbox",
        googlemaps : "googlemaps",
        mapsgoogle : "googlemaps",
        googleplay : "googleplay",
        playgoogle: "googleplay",
        googlesheets : "googlesheets",
        sheetsgoogle: "googlesheets",
        googlewebstore : "googlewebstore",
        webstoregoogle : "googlewebstore",
        grooveshark : "grooveshark",
        homedepot : "homedepot",
        homesyahoo : "homesyahoo",
        imdb: "imdb",
        instagram : "instagram",
        java : "java",
        jsfiddle : "jsfiddle",
        kickstarter : "kickstarter",
        linkedin : "linkedin",
        magnifier : "magnifier",
        mailyahoo : "mailyahoo",
        mapquest : "mapquest",
        mashable : "mashable",
        medium : "medium",
        metacafe : "metacafe",
        mixbit: "mixbit",
        msn : "msn",
        nationalgeographic : "nationalgeographic",
        netflix : "netflix",
        newsyahoo : "newsyahoo",
        oracle : "oracle",
        oracleapp : "oracleapp",
        pandora : "pandora",
        paypal : "paypal",
        pintrest : "pintrest",
        rdio : "rdio",
        screenyahoo : "screenyahoo",
        shoppingyahoo : "shoppingyahoo",
        slideshare: "slideshare",
        soundcloud : "soundcloud",
        sportsyahoo : "sportsyahoo",
        spotify : "spotify",
        target : "target",
        techcrunch : "techcrunch",
        ted : "ted",
        theverge : "theverge",
        time : "time",
        tumblr : "tumblr",
        turbotax : "turbotax",
        twitch : "twitch",
        twitter : "twitter",
        vimeo : "vimeo",
        vine : "vine",
        walmart : "walmart",
        weatherchannel : "weatherchannel",
        weatheryahoo : "weatheryahoo",
        wellsfargo : "wellsfargo",
        wikipedia : "wikipedia",
        wordpress : "wordpress",
        yahoo : "yahoo",
        yahooautos : "yahooautos",
        autosyahoo : "yahooautos",
        yahoofood : "yahoofood",
        foodyahoo : "yahoofood",
        yahoomatch : "yahoomatch",
        matchyahoo : "yahoomatch",
        yahootech : "yahootech",
        techyahoo : "yahootech",
        yahootravel : "yahootravel",
        travelyahoo : "yahootravel",
        youtube : "youtube",
        befrugal: "befrugal"
    };

    this.defaultSites = [
        {
            title: "Flickr",
            url: "https://www.flickr.com"
        },
        {
            title: "Tumblr",
            url: "https://www.tumblr.com"
        },
        {
            title: "Yahoo Mail",
            url: "https://mail.yahoo.com"
        },
        {
            title: "Amazon",
            url: "https://www.amazon.com"
        },
        {
            title: "CNN",
            url: "http://www.cnn.com"
        },
        {
            title: "Facebook",
            url: "https://www.facebook.com"
        },
        {
            title:"Wikipedia",
            url: "https://www.wikipedia.org"
        },
        {
            title: "Walmart",
            url: "https://www.walmart.com"
        }
    ];


    return this;
}