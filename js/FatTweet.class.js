class FatTweet {
    constructor(extensionRoot){
        this._extensionRoot = extensionRoot;
        this.setCurrentData();
        this.processTweetBoxes();
        var FT = this;
        $('body').on('click', '.fat-tweet-convert-text', function(e){
            e.preventDefault();
            var $form = $(this).closest('form');
            FT.convertTextToCanvas($form);
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
        var $button = $('<button class="btn fat-tweet-convert-text js-tooltip" data-delay="150" data-original-title="Convert text into image" type="button"><img src="'+this._extensionRoot+'img/32.png"></button>');
        $form
            .addClass('fat-tweet-processed-form')
            .find('.btn.tweet-btn')
            .before($button);
        return $form;
    }
    isTweetFormProcessed($form){
        return $form.hasClass('fat-tweet-processed-form');
    }
    convertTextToCanvas($form){
        var FT = this;
        FT.setCurrentData();
        var $area = $form.find('.tweet-box[name="tweet"]');
        $area.addClass('screenshot-process');
        html2canvas($area.get(0), {
            onrendered: function(canvas) {
                FT.setCurrentData($form, FT.getBlobFromCanvas(canvas), 'image/jpeg');
                $area.after(canvas);
                $area
                    .removeClass('screenshot-process')
                    .html(FT.getLinksClean($area.children('div')));
                $area.focus();
                FT.initUpload();
            }
        });
    }
    setCurrentData($form = null, imageBlob = null, imageType = null){
        this._$currentForm = $form;
        this._currentImageBlob = imageBlob;
        this._currentImageType = imageType;
    }
    getBlobFromCanvas(canvas, type = 'image/jpeg', quality = 0.75){
        var dataURL = canvas.toDataURL(type, quality);
        return this.dataURItoBlob(dataURL);
    }
    initUpload(){
        var FT = this;
        var url = 'https://upload.twitter.com/i/media/upload.json?command=INIT&total_bytes='
        + this._currentImageBlob.size
        + '&media_type='
        + this._currentImageType
        + '&media_category=tweet_image';
        // Can't use $.ajax here, because
        // Twitter return HTTP status 202 here
        // and jQuery.ajax do not fire "success"
        // or .done() for that response
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('POST', url, true);
        xmlHttp.withCredentials = true;
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 202) {
                    var data = JSON.parse(xmlHttp.responseText);
                    FT.appendUpload(data.media_id_string);
                } else {
                    console.error('Fat Tweet: Something went wrong on media INIT stage');
                }
            }
        };
        xmlHttp.send();
    }
    appendUpload(mediaId){
        var FT = this;
        var url = 'https://upload.twitter.com/i/media/upload.json?command=APPEND&media_id='
        + mediaId
        + '&segment_index=0';
        var fd = new FormData();
        fd.append('media', this._currentImageBlob, 'blob');
        $.ajax(
            url,
            {
                type: 'POST',
                data: fd,
                contentType: false,
                processData: false,
                xhrFields: {
                    withCredentials: true,
                }
            })
            .done(function(){
                FT.finalizeUpload(mediaId);
            })
            .fail(function(){
                console.error('Fat Tweet: Something went wrong on media APPEND stage');
            });
    }
    finalizeUpload(mediaId){
        var FT = this;
        var url = 'https://upload.twitter.com/i/media/upload.json?command=FINALIZE&media_id='
        + mediaId;
        var fd = new FormData();
        fd.append('media', this._currentImageBlob, 'blob');
        $.ajax(
            url,
            {
                type: 'POST',
                xhrFields: {
                    withCredentials: true,
                }
            })
            .done(function(){

            })
            .fail(function(){
                console.error('Fat Tweet: Something went wrong on media FINALIZE stage');
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
    appendAlert(text, type = 'status'){

    }
    /**
    * This great function was taken here:
    * https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata/5100158#5100158
    */
    dataURItoBlob(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
    }
    /**
     * For now this is just placeholder for translate function
     * @param  string text String that should be translated
     * @returns string Translated string
     */
    t(string){
        return string;
    }
}
