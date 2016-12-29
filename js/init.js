// WARNUNG! Code below look little awful
// but we need all that hacks
// We should run script in page context
// because when upload image we need
// that data sent with needed cookies and referrer.
// Pull requests with cleaner solution are welcome
var _html2canvas_src = chrome.runtime.getURL('bower_components/html2canvas/build/html2canvas.min.js');
var _jquery_observe_src = chrome.runtime.getURL('bower_components/jquery-observe/jquery-observe.js');
var _strip_tags_src = chrome.runtime.getURL('js/strip_tags.js');
var _FatTweet_src = chrome.runtime.getURL('js/FatTweet.class.js');
var _extensionRoot = chrome.runtime.getURL('/');
var _initScript = '<script>$(document).ready(function(){$.getScript("'+_html2canvas_src+'",function(){$.getScript("'+_jquery_observe_src+'", function(){$.getScript("'+_strip_tags_src+'", function(){$.getScript("'+_FatTweet_src+'", function(){var FT = new FatTweet("'+_extensionRoot+'");$("body").observe("childlist", ".tweet-box", function(record) {FT.processTweetBoxes();});});});});});});</script>';

$(document).ready(function(){
    // Append some styles that we need
    // and init script
    $('head')
        .append('<link rel="stylesheet" type="text/css" href="'+chrome.runtime.getURL('css/content.css')+'">')
        .append(_initScript);
});
