// WARNUNG! Code below look little awful
// but we need all that hacks
// We should run script in page context
// because when upload image we need
// that data sent with needed cookies and referrer.
// Also twitter load javascript asynchronously
// so need wait until jQuery will be available
// Pull requests with cleaner solution are welcome
var _extensionRoot = chrome.runtime.getURL('/');
var _imagesloaded_src = _extensionRoot + 'bower_components/imagesloaded/imagesloaded.pkgd.min.js';
var _html2canvas_src = _extensionRoot + 'bower_components/html2canvas/build/html2canvas.min.js';
var _jquery_observe_src = _extensionRoot + 'bower_components/jquery-observe/jquery-observe.js';
var _strip_tags_src = _extensionRoot + 'js/strip_tags.js';
var _FatTweet_src = _extensionRoot + 'js/FatTweet.class.js';

$(document).ready(function(){
    // Get settings
    FatTweet
        .getSettingsFromStorage()
        .then(function(settings){
            if(1 == settings.enabled){
                // If enabled append some styles
                // that we need and init script
                var _initScript = '<script>var timerId = setInterval(function(){if(typeof $ != "function"){return;}clearInterval(timerId);$(document).ready(function(){$.getScript("'+_imagesloaded_src+'",function(){$.getScript("'+_html2canvas_src+'",function(){$.getScript("'+_strip_tags_src+'", function(){$.getScript("'+_FatTweet_src+'", function(){var FT = new FatTweet("'+_extensionRoot+'", '+JSON.stringify(settings)+');});});});});});}, 200);</script>';
                $('head')
                    .append('<link rel="stylesheet" type="text/css" href="' + chrome.runtime.getURL('css/content.css') + '">')
                    .append(_initScript);
            }
        }, function(reason){
            FatTweet.error(reason);
        });
});
