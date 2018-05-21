function PhotoManager(unittest){ // jshint ignore: line
    var flickrPhotos = [], //flikr api response
        acceptedPhotos = [], //photos that meets the new tab specs
        bgPhotos = [],
        acceptedPhotosIdx,
        bgPhotosIdx = 0,
        page,
        maxPages = 1,
        localStoragePhotos,
        cacheThreshold = extGlobal.constants.cache_threshold_number,
        nextCachedSize = extGlobal.constants.next_cache_size;

    //get flickr photo links from a specified url
     function getFlickrPhotos(page, callback) {
        page++;
        if(page >= maxPages) {
            page = 1;
        }
         extGlobal.browserGap.localStorage.setItem("page",page);
        var url = extGlobal.constants.flickr_url + page;
        var result= function(responseText) {
            flickrPhotos = JSON.parse(responseText).photos.photo;
            var counter = flickrPhotos.length,
                randomIndex,
                temp;
            while (counter > 0) {
                randomIndex = Math.floor(Math.random()*counter);
                counter--;
                temp = flickrPhotos[counter];
                flickrPhotos[counter] = flickrPhotos[randomIndex];
                flickrPhotos[randomIndex] = temp;
            }

            callback(flickrPhotos);
        };
        var err = function(errCode) {
            console.log("api call failed :( ");
            if(errCode >= 500){
                console.log("server-side error... wait 3 minutes before trying again");
                setTimeout(function(){
                    extGlobal.browserGap.xhr(url,result,err);
                }, extGlobal.constants.timeout_serverError);
            } else if(!extGlobal.browserGap.isOnline() && extGlobal.browserGap.isChrome) {
                console.log("waiting for internet connection to try again.");
                extGlobal.browserGap.onceOnline(function(){
                    console.log("reconnected to the internet!");
                    extGlobal.browserGap.xhr(url,result,err);
                });
            } else if(errCode === 0 && (extGlobal.browserGap.isFirefox || extGlobal.browserGap.isWebExtension)){
                console.log("Firefox is most likely offline. timeout to try again in a minute.");
                setTimeout(function(){
                    extGlobal.browserGap.xhr(url,result,err);
                }, extGlobal.constants.timeout_ffOffline);
            }
        };
        extGlobal.browserGap.xhr(url, result, err);
     } 

     //check if retrieved photos can be accepted.If yes, put them in the acceptedPhotos list
     function prunePhotos(list) {
        var checkForRepeats = {};
        for (var p = 0; p < list.length; p++)
        {
            var photo = list[p];
            var ratio = photo.width_m/photo.height_m;

            if(photo.media === extGlobal.constants.video_media || ratio < extGlobal.constants.ratio_min || ratio > extGlobal.constants.ratio_max)
            {
               // console.log("Reject Photos");
            
            } else if (!checkForRepeats[photo.id] && ( typeof(photo.url_m) !== "undefined" || typeof(photo.url_l) !== "undefined" || typeof(photo.url_k) !== "undefined"))
            {
                acceptedPhotos.push(photo);
                checkForRepeats[photo.id] = true;
            }
        }
         extGlobal.browserGap.localStorage.removeItem("localStoragePhotos");
         extGlobal.browserGap.localStorage.setItem("localStoragePhotos", JSON.stringify(acceptedPhotos));
        cacheNextPhotos();
    }

    function cacheSinglePhoto(photo, callback) {
        var url = photo.url_k || photo.url_l || photo.url_m;
        extGlobal.browserGap.xhr(url, function(responseText){
            callback(photo);
        });
    }

    //cache next bunch of photos
     function cacheNextPhotos() {
        if(acceptedPhotos.length !== 0){
            if(acceptedPhotos.length - acceptedPhotosIdx <= extGlobal.constants.acceptedPhotosRemaining) {
                acceptedPhotos.splice(0,acceptedPhotosIdx-1);
                acceptedPhotosIdx = 0;
                 getFlickrPhotos(page, function(flickrPhotos) {
                    prunePhotos(flickrPhotos);
                });
            }
            if(acceptedPhotosIdx < acceptedPhotos.length-nextCachedSize) {
                var addToBgPhotos = function(cachedPhoto) {
                    bgPhotos.push(cachedPhoto);
                };
                for(var i = 0; i<nextCachedSize; i++) {
                    var photo = acceptedPhotos[acceptedPhotosIdx++];
                    cacheSinglePhoto(photo, addToBgPhotos);
                }
                 extGlobal.browserGap.localStorage.setItem(extGlobal.constants.accepted_photos_index, acceptedPhotosIdx);
            }
        }
    }

    function trimArray(arr, curIdx, maxLen, splicePercent, callback){
        if(arr.length >= maxLen){
            var removalAmt = Math.round(maxLen*splicePercent);
            arr.splice(0, removalAmt);
            curIdx -= removalAmt;
            if(curIdx < 0){
                curIdx = 0;
            }
            curIdx = (curIdx >= arr.length) ? arr.length-1 : curIdx;
        }
        callback(arr,curIdx);
    }

    //retrieve one photo from cached photo list 
     function getBackgroundPhoto() {
        if(bgPhotosIdx%nextCachedSize === cacheThreshold || bgPhotosIdx >= bgPhotos.length) {
            trimArray(bgPhotos, bgPhotosIdx, extGlobal.constants.maxBgPhotosStored, extGlobal.constants.splicePercent, function(arr, curIdx) {
                bgPhotos = arr;
                bgPhotosIdx = curIdx;
            });
             cacheNextPhotos();
        }

        if(extGlobal.browserGap.isOnline()) {
            var index = (bgPhotosIdx >= bgPhotos.length) ? bgPhotos.length-1 : bgPhotosIdx++;
            return bgPhotos[index];
        }
    }

     function init() {
        var photos =  extGlobal.browserGap.localStorage.getItem("localStoragePhotos");
        var localStoragePhotos = photos ? JSON.parse(photos) : [];
        acceptedPhotosIdx =  extGlobal.browserGap.localStorage.getItem(extGlobal.constants.accepted_photos_index) || 0;
        page =  extGlobal.browserGap.localStorage.getItem("page") || 0;
        if (localStoragePhotos.length === 0) {
             getFlickrPhotos(page, function(flickrPhotos) {
                prunePhotos(flickrPhotos);
            });
        }
        else {
           acceptedPhotos = localStoragePhotos;
           cacheNextPhotos();
        }
    }
    
    if (unittest) {
        this.acceptedPhotos = acceptedPhotos;
        this.bgPhotos = bgPhotos;
        this.acceptedPhotosIdx = acceptedPhotosIdx;
        this.bgPhotosIdx = bgPhotosIdx;
        this.getFlickrPhotos = getFlickrPhotos;
        this.prunePhotos = prunePhotos;
        this.cacheSinglePhoto = cacheSinglePhoto;
        this.cacheNextPhotos = cacheNextPhotos;
        this.cacheThreshold  = cacheThreshold;
        this.nextCachedSize = nextCachedSize;
        this.injectFunction = function (){
            acceptedPhotosIdx = this.acceptedPhotosIdx;
            localStoragePhotos = this.localStoragePhotos;
            getFlickrPhotos = this.getFlickrPhotos; // jshint ignore: line
            bgPhotosIdx = this.bgPhotosIdx;
            acceptedPhotos = this.acceptedPhotos;
        };
        this.syncData = function (){
            this.acceptedPhotos = acceptedPhotos;
            this.bgPhotos = bgPhotos;
            this.acceptedPhotosIdx = acceptedPhotosIdx;
            this.nextCachedSize = nextCachedSize;
        };
    }

    this.init = init;
    this.getBackgroundPhoto = getBackgroundPhoto;

    return this;
}





