class FatTweet {
    constructor(){
        this.init();
    }
    init(){
        // http://stackoverflow.com/questions/1391278/contenteditable-change-events
        $('body:not(.fat-tweet-init)')
        .addClass('fat-tweet-init')
        .each(function(){
            $(this).on('focus', '[contenteditable]', function() {
                var $this = $(this);
                $this.data('before', $this.html());
                return $this;
            }).on('blur keyup paste input', '[contenteditable]', function() {
                var $this = $(this);
                var $newHtml = $this.html();
                if ($this.data('before') !== $newHtml) {
                    $this.data('before', $newHtml);
                    $this.trigger('change');
                }
                return $this;
            });
        });
    }
    processTweetForm($form){
        var $button = $('<button class="btn fat-tweet-convert-text js-tooltip" data-delay="150" data-original-title="Convert text into image" type="button"><img src="'+chrome.runtime.getURL('img/32.png')+'"></button>');
        $form
            .addClass('fat-tweet-processed')
            .find('.btn.tweet-btn')
            .before($button);
        return $form;
    }
    isTweetFormProcessed($form){
        return $form.hasClass('fat-tweet-processed');
    }
    convertText($form){
        var _FatTweet = this;
        var $area = $form.find('.tweet-box[name="tweet"]');
        $area.addClass('screenshot-process');
        html2canvas($area.get(0), {
            onrendered: function(canvas) {
                $area.after(canvas);
                $area
                    .removeClass('screenshot-process')
                    .html(_FatTweet.getLinksClean($area.children('div')));
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