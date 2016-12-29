$(document).ready(function(){
    $('head').append('<link rel="stylesheet" type="text/css" href="'+chrome.runtime.getURL('css/content.css')+'">');
    var _FatTweet = new FatTweet();
    $('body').on('change', '[contenteditable]', function() {
        var $this = $(this);
        var $form = $this.closest('form');
        if(!$form.length){
            console.error('Can not find parent form.');
            return;
        }
        if(!_FatTweet.isTweetFormProcessed($form)){
            _FatTweet.processTweetForm($form);
        }
    })
    .on('click', '.fat-tweet-convert-text', function(e){
        _FatTweet.convertText($(this).closest('form'));
    });
});