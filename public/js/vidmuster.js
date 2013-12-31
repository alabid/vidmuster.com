/* 
 * vidmuster.js -> 
 *   JavaScript logic for VidMuster
 */

var $scope;

var currentSearch = '',
    currentVideoId = '',
    playlistShowing = false,
    playlistArr = [],
    currentPlaylistPos = 0,
    currentPlaylistPage = 0,
    xhrWorking = false,
    pendingSearch = false,
    pendingDoneWorking = false,
    playerState = -1,
    hashTimeout = false,
    MAX_VIDS = 6,
    ytplayer; 

function getQuery() {
    return $(".search-query").val().trim();
}

function setQuery(to) {
    $(".search-query").val(to).select().focus();
}

function selectVideo(pos) {
    console.log("selecting..." + pos);
    $("li[id^=play-]").removeClass("selectedThumb playing paused");
    $("li[id^=play-" + pos + "]").addClass("selectedThumb playing");
}

function updateHash(hash) {
    var timeDelay = 1000;
    if (hashTimeout) {
        clearTimeout (hashTimeout);
    }
    hashTimeout = setTimeout(
        function() {
            if (hash) {
                window.location.replace("#" + encodeURI(hash));
                document.title =  "'" + hash.toTitleCase() +"' playing on Vidmuster!";
            }
        }
        , timeDelay);
}

function doneWorking() {
    xhrWorking = false;
    if (pendingSearch) {
        pendingSearch = false;
        doInstantSearch();
    }
}

function getTopSearchResult(keyword){
    var searchURI= 'http://gdata.youtube.com/feeds/api/videos?q=' + 
            encodeURIComponent(keyword) +
            '&format=5&max-results=' + MAX_VIDS +'&v=2&alt=jsonc';
    
    $.ajax({
        type: "GET",
        url: searchURI,
        dataType: "jsonp",
        success: function(responseData,textStatus,XMLHttpRequest){
            if (responseData.data.items) {
                var videos = responseData.data.items;
                playlistArr = [];
                playlistArr.push(videos); 

                $scope.videos = videos;
                $scope.$apply();

                if (currentVideoId != videos[0].id) {
                    ytplayer.loadVideoById(videos[0].id);
                    currentPlaylistPos = 0;
                    selectVideo(0);
                }

                pendingDoneWorking = true;
            } else {
                doneWorking();
            }
        }
    });
}

var yt = {};
yt.www = {};
yt.www.suggest = {};
yt.www.suggest.handleResponse = function(suggestions){
    var searchTerm = (suggestions[1][0] ? suggestions[1][0][0] : null); 
    updateHash(searchTerm);

    if (!searchTerm){
        searchTerm = getQuery();
    } else {
        if (searchTerm == $scope.currentSuggestion){
            doneWorking();
            return;
        } 
    }
    getTopSearchResult(searchTerm);
    $scope.currentSuggestion = searchTerm;

    $.ajax({
        type: "GET",
        url: "/google/"+encodeURIComponent(searchTerm),
        success: function(responseData,textStatus,XMLHttpRequest){
            $("#news-search-trunk").html(responseData);
        }
    });
}; 

function _run() {       
    var ytPlayerHeight = 450;
    var ytPlayerWidth = 600;
    
    currentVideoId = 'nVMN2t96Xjw';
    
    var params = {
        allowScriptAccess : "always"
    };
    var attrs = {
        id : "ytPlayer",
        allowFullScreen : "true"
    };
    swfobject.embedSWF(
        "http://www.youtube.com/v/" + 
            currentVideoId +
            "&enablejsapi=1&playerapiid=ytplayer" + 
            "&rel=0&autoplay=0&egm=0&loop=0&fs=1&hd=0&showsearch=0&showinfo=0&iv_load_policy=3&cc_load_policy=1",
        "current-video",
        ytPlayerWidth,
        ytPlayerHeight,
        "8",
        null, null, params, attrs
    );  
}

/*
 * onYoutubePlayerReady -- callback for player api
 */
function onYouTubePlayerReady(playerId){
    ytplayer = document.getElementById("ytPlayer"); // get the player object
    
    ytplayer.addEventListener("onStateChange","onPlayerStateChange"); // add events listener(s) 
    $(document.documentElement).keydown(onKeyDown); // also do onKeyDown to document on keydown
    if(window.location.hash){
        setQuery(getHash());
    } else {
        var defaultSearches = [
            "Adorable", "Autotune news", "Bob Marely", "Carleton is", "Def Poetry",
            "Beyonce" , "Jay z - young forever", "Lmfao - Party Rock Anthem", 
            "Wings", "One Republic", "Baby", "Rebecca Black",
            "Stevie Wonder", "Taylor Swift", "Pink fucking perfect",
            "The fray - How to save a life", "Katy Perry - Last Friday Night",
            "Eminem", "Shakira", "kesha", "Taylor Swift", "kanye west",
            "The killers", "Baba O Riley", "Billy Joel", "Elton John", 
            "Fallout Boy", "Michael Jackson", "8-bit", "Guns N Roses",
            "Justin Bieber", "Selena Gomez", "Lady Gagaa", "Basshunter",
            "Ludacris", "Still Alive", "Carleton College"
        ];
        var randomNumber = Math.floor(Math.random()*defaultSearches.length);
        setQuery(defaultSearches[randomNumber]);
    }
    onBodyLoad();
    doInstantSearch();
} 

/*
 * onBodyLoad
 */
function onBodyLoad(){
    currentSearch = '';
    currentVideoId = '';
    playlistShowing = false;
    playlistArr = [];
    currentPlaylistPos = 0;
    currentPlaylistPage = 0;
    xhrWorking = false;
    pendingSearch = false;
    pendingDoneWorking = false;
    playerState = -1;
    hashTimeout = false;
}

function onPlayerStateChange(newState){
    playerState = newState;
    if (pendingDoneWorking && playerState == 1){
        doneWorking();
        pendingDoneWorking = false;
    } else if (playerState == 0){
        goNextVideo();
    }
}

function onKeyDown(e){
     if (e.keyCode == 13){ 
        playPause();
    }
}

function goNextVideo(){
    if (currentPlaylistPos == MAX_VIDS-1) {
        goVid(0, currentPlaylistPage);
        return;
    }
    goVid(currentPlaylistPos + 1, currentPlaylistPage);
}

function goPrevVideo(){
    if (currentPlaylistPos == 0) {
        return;
    }
    goVid(currentPlaylistPos-1, currentPlaylistPage);
}  

function goVid(playlistPos, playlistPage){
    if (playlistPage != currentPlaylistPage){
        currentPlaylistPage = playlistPage;
        return;
    }
    loadAndPlayVideo(playlistArr[playlistPage][playlistPos].id,playlistPos);
}

function doInstantSearch(){
    if (xhrWorking){
        pendingSearch = true;
        return;
    }
    var query = getQuery();
    if (query == currentSearch) {
        return;
    }
    currentSearch = query;
    if (!query.length) {
        playlistShowing = false;
        pauseVideo();
        clearVideo();
        updateHash('');
        return;
    }
    var searchURI = "http://suggestqueries.google.com/complete/search" + 
            "?hl=en&ds=yt&client=youtube&hjson=t" + 
            "&jsonp=window.yt.www.suggest.handleResponse&q=" +
            encodeURIComponent(query) + '&cp=1';
    
    $.ajax({
        type : "GET",
        url : searchURI,
        dataType:"script"
    });
    xhrWorking=true;
}

function getHash() {
    return decodeURIComponent(window.location.hash.substring(1));
}


function setVideoVolume() {
    var volume = parseInt(document.getElementById("volumeSetting").value);
    if (isNaN(volume) || volume < 0|| volume>100){
        alert("Please enter a valid volume between 0 and 100.");
    }
    else if (ytplayer) {
        ytplayer.setVolume(volume);
    }
}

function loadVideo (videoId){
    if (ytplayer) {
        ytplayer.cueVideoById(videoId);
        currentVideoId = videoId;
    }
}

function loadAndPlayVideo (videoId, playlistPos, bypassXhrWorkingCheck) {
    if (playlistPos != undefined) {
        selectVideo(playlistPos);
    }

    if (currentPlaylistPos == playlistPos) {
        playPause();
        return;
    }
    if (!bypassXhrWorkingCheck && xhrWorking) {
        return;
    }
    if (ytplayer) {
        xhrWorking = true;
        ytplayer.loadVideoById(videoId);
        currentVideoId = videoId;
        pendingDoneWorking = true; 
        playVideo();
    }

    if (playlistPos != undefined) {
        currentPlaylistPos = playlistPos;
    }
}

function setPlaybackQuality(quality) {
    if (ytplayer) {
        ytplayer.setPlaybackQuality(quality);        
    }
}

function pauseVideo(){
    if (ytplayer) {
        ytplayer.pauseVideo();
    }
    $(".selectedThumb").removeClass("playing")
        .addClass("paused");
}

function playVideo() {
    if (ytplayer) {
        ytplayer.playVideo();
    }
    $(".selectedThumb").removeClass("paused")
        .addClass("playing");
}

function muteVideo() { 
    if (ytplayer) {
        ytplayer.mute();
    }
}

function unMuteVideo(){
    if (ytplayer){
        ytplayer.unMute();
    }
}

function clearVideo() { 
    if (ytplayer) {
        ytplayer.clearVideo();
    }
}

function getEmbedCode() {
    alert (ytplayer.getVideoEmbedCode());
}

function getVideoUrl(){
    alert(ytplayer.getVideoUrl());
}

function setVolume(newVolume) {
    if(ytplayer) {
        ytplayer.setVolume(newVolume);
    }
}

function getVolume(){
    if (ytplayer) { 
        return ytplayer.getVolume();
    }
}

function playPause() {
    if (ytplayer) {
        if (playerState == 1) {
            pauseVideo();
        } else if (playerState == 2) {
            playVideo();
        }
    }
}

// function to convert to title case, thanks feross!
String.prototype.toTitleCase = function() {
    return this.replace (/([\w&`'‘’"“.@:\/\{\(\[<>_]+-? *)/g, 
        function (match, p1, index, title) {
            if (index > 0 && title.charAt(index - 2) !== ":" && 
                match.search(/^(a(nd?|s|t)?|b(ut|y)|en|for|i[fn]|o[fnr]|t(he|o)|vs?\.?|via)[ \-]/i) > -1)
                return match.toLowerCase();
            if (title.substring(index - 1 , index + 1).search(/['"_{(\[]/) > -1)
                return match.charAt(0) + match.charAt(1).toUpperCase() + match.substr(2);
            if(match.substr(1).search(/[A-Z]+|&|[\w]+[._][\w]+/) > -1 || 
                title.substring(index - 1, index + 1).search(/[\])}]/)>-1)
                return match;
            return match.charAt(0).toUpperCase() + match.substr(1);
        }
    );
};

function liLoadAndPlayVideo(elem) {
    var a = $(elem).find("a");
    loadAndPlayVideo(a.attr("video-id"), parseInt(a.attr("index")));
    return false;
}


$(document).ready(function() {
    $scope = angular.element(document).scope();
    $scope.videos = [];
    
    $(".search-query").keyup(doInstantSearch);

    _run();
});

/** END OF SCRIPT BLOCK **/
