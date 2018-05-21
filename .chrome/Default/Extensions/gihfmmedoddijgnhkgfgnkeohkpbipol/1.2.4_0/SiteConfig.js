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