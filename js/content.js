$(document).ready(function(){
    // Some styles that we need
    $('head').append('<link rel="stylesheet" type="text/css" href="'+chrome.runtime.getURL('css/content.css')+'">');
    // File js/FatTweet.class.js
    var FT = new FatTweet();
    /**
    * We should process new tweet forms when them added.
    * But Twitter very actively use Ajax and other DOM
    * manipulations that can be performed without Ajax.
    * So let's use Mutations observer for this,
    * because this is Chrome and we can:)
    * Call FatTweet.processTweetBoxes() when
    * new boxes added.
    */
    $('body').observe('childlist', '.tweet-box[name="tweet"]', function(record) {
        FT.processTweetBoxes();
    });
});
