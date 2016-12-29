class FatTweet {
    constructor(){
        this.processTweetBoxes();
        var FT = this;
        $('body').on('click', '.fat-tweet-convert-text', function(e){
            e.preventDefault();
            var $form = $(this).closest('form');
            FT.convertText($form);
        });
    }
    processTweetBoxes(){
        var FT = this;
        var $tweetBoxes = $('.tweet-box[name="tweet"]:not(.fat-tweet-processed)');
        if(!$tweetBoxes.length) return;
        $tweetBoxes
            .addClass('fat-tweet-processed')
            .each(function(){
                var $tweetBox = $(this);
                var $form = $tweetBox.closest('form');
                FT.processTweetForm($form);
        });
    }
    processTweetForm($form){
        var $button = $('<button class="btn fat-tweet-convert-text js-tooltip" data-delay="150" data-original-title="Convert text into image" type="button"><img src="'+chrome.runtime.getURL('img/32.png')+'"></button>');
        $form
            .addClass('fat-tweet-processed-form')
            .find('.btn.tweet-btn')
            .before($button);
        return $form;
    }
    isTweetFormProcessed($form){
        return $form.hasClass('fat-tweet-processed-form');
    }
    convertText($form){
        var FT = this;
        var $area = $form.find('.tweet-box[name="tweet"]');
        $area.addClass('screenshot-process');
        html2canvas($area.get(0), {
            onrendered: function(canvas) {
                $area.after(canvas);
                $area
                    .removeClass('screenshot-process')
                    .html(FT.getLinksClean($area.children('div')));
                $area.focus();
            }
        });
    }
    getLinksClean($content){
        var $links = $content.find('a');
        var $newContent = $('<div></div>');
        var contentLength = 0;
        $links.each(function(){
            var linkTextLength = $(this).text().toString().length;
            if(contentLength + linkTextLength > 140){
                return false;
            }
            contentLength = contentLength + linkTextLength;
            $newContent.append($(this)).append(' ');
        });
        return $newContent;
    }
}
