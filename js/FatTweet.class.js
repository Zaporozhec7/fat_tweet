class FatTweet {
    constructor(extensionRoot, settings){
        this._settings = settings;
        // Can be image/jpeg, image/jpg, image/png
        this._screenshotImageTypeDefault = 'image/png';
        // Should be float or integer from 0 to 1
        // mean screenshot quality
        this._screenshotImageQualityDefault = 1;
        this._extensionRoot = extensionRoot;
        this._mediaIds = [];
        this._$currentForm = null;
        this._currentStatusText = null;
        this.processTweetBoxes();
        var FT = this;
        console.error(FatTweet.t('Fat tweet extension: For now after sent "Fat tweet" caused exception (Uncaught TypeError: Cannot read property \'tweetboxId\' of undefined). That is not very good, but I do not found way yet how to catch it or prevent. Also there are no "log" or "warn" methods in console here (seems it unset somewhere) so used "error" method to show this message.'));
        $('body').on('click', '.fat-tweet-convert-text', function(e){
            e.preventDefault();
            var $form = $(this).closest('form');
            FT._$currentForm = $form;
            try {
                FT._currentStatusText = FT.getTweetTextClean($form);
                FT.getScreenshot($form)
                  .then(function(blobData){
                      FT.uploadScreenshot(blobData)
                      .then(function(screenshotMediaId){
                          try {
                             FT.sendTweet(screenshotMediaId);
                          } catch(error){
                              // @TODO: appropriate error handling
                              console.error(error);
                          }
                      },
                      FatTweet.error);
                  },
                  FatTweet.error);
            } catch(error){
                // @TODO: appropriate error handling
                console.error(error);
            }
        });
        $(document).on('uiTweetSent', function(e){
            FT.resetTemporaryData();
        }).on('uiSendTweet', function(e, data){
            console.error(e);
            console.error(data);
        });
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var $addedNodes = $(mutation.addedNodes);
                if($addedNodes.length && $addedNodes.hasClass('tweet-box')){
                    FT.processTweetBoxes();
                }
            });
        });
        observer.observe(document.body, {attributes: false, childList: true, characterData: false});
    }
    resetTemporaryData(){
        this._mediaIds = [];
        this._$currentForm = null;
        this._currentStatusText = null;
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
    areaCleanup($area){
        $area
            .removeAttr('style')
            .attr('contenteditable', true);
        $(document).trigger('uiComposerResetAndFocus');
    }
    prepareAreaForScreenshot($area){
        $area.attr('contenteditable', false);
        if(1 == this._settings.insert_nickname){
            this.appendUserName($area);
        }
        $area.css({'font-size': this._settings.font_size + 'px'});
//        this.prepareSmiles($area);
    }
    // @TODO: Make that smiles rensdered in screenshot too
    prepareSmiles($area){

    }
    appendUserName($area){
        var username = this.getUserName();
        if(!$area.find('.username').length){
            $area.append('<div class="username">' + username.fullName + ' (@' + username.screenName + ')</div>');
        }
    }
    getTweetTextClean($form){
        var $area = $form.find('.tweet-box[name="tweet"]');
        var text = $area.text();
        if(text.length > 140){
            text = text.substring(0, 137) + '...';
        }
        return text;
    }
    getScreenshot($form){
        var FT = this;
        return new Promise(function(resolve, reject) {
            var $area = $form.find('.tweet-box[name="tweet"]');
            $area.addClass('screenshot-process');
            FT.prepareAreaForScreenshot($area);
            $area.imagesLoaded( function() {
                html2canvas($area.get(0), {
                    onrendered: function(canvas) {
                        $area.removeClass('screenshot-process');
                        resolve(FT.getBlobFromCanvas(canvas));
                        FT.areaCleanup($area);
                    },
                    onerror: function(){
                        $area.removeClass('screenshot-process');
                        reject(FatTweet.t('Error when try make screenshot.'));
                        FT.areaCleanup($area);
                    },
                    allowTaint: true,
                    letterRendering: true,
                });
            });
        });
    }
    getBlobFromCanvas(canvas, type = this._screenshotImageTypeDefault, quality = this._screenshotImageQualityDefault){
        var dataURL = canvas.toDataURL(type, quality);
        return this.dataURItoBlob(dataURL);
    }
    uploadScreenshot(blobData){
        var FT = this;
        return new Promise(function(resolve, reject) {
            FT.initUpload(blobData)
            .then(
                function(data){
                    FT.appendUpload(data)
                    .then(function(){
                        FT.finalizeUpload(data.screenshotMediaId)
                        .then(
                            function(){
                                resolve(data.screenshotMediaId);
                            },
                            function(text){
                                reject(text);
                            });
                    }, function(text){
                        reject(text);
                    });
                },
                function(text){
                    reject(text);
                }
            );
        });
    }
    initUpload(blobData){
        var FT = this;
        return new Promise(function(resolve, reject) {
            var url = 'https://upload.twitter.com/i/media/upload.json?command=INIT&total_bytes='
            + blobData.size
            + '&media_type='
            + FT._screenshotImageTypeDefault
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
                        resolve({
                            blobData: blobData,
                            screenshotMediaId: data.media_id_string,
                        });
                    } else {
                        reject(FatTweet.t('Fat Tweet: Something went wrong on media INIT stage'));
                    }
                }
            };
            xmlHttp.send();
        });
    }
    appendUpload(data){
        var FT = this;
        return new Promise(function(resolve, reject) {
            var url = 'https://upload.twitter.com/i/media/upload.json?command=APPEND&media_id='
            + data.screenshotMediaId
            + '&segment_index=0';
            var fd = new FormData();
            fd.append('media', data.blobData, 'blob');
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
                    resolve();
                })
                .fail(function(){
                    reject(FatTweet.t('Fat Tweet: Something went wrong on media APPEND stage'));
                });
        });
    }
    finalizeUpload(mediaId){
        var FT = this;
        return new Promise(function(resolve, reject) {
            var url = 'https://upload.twitter.com/i/media/upload.json?command=FINALIZE&media_id='
            + mediaId;
            $.ajax(
                url,
                {
                    type: 'POST',
                    xhrFields: {
                        withCredentials: true,
                    }
                })
                .done(function(){
                    resolve();
                })
                .fail(function(){
                    reject(FatTweet.t('Fat Tweet: Something went wrong on media FINALIZE stage'));
                });
        });
    }
    getCurrentTweetBoxId(){
        if(typeof this._$currentForm == 'object' && this._$currentForm.length)
            return this._$currentForm.attr('id');
        return false;
    }
    // I do not found where Twitter store ids of
    // media files that attached to tweet and from
    // where it get where compose data that post
    // to server when tweet created.
    // So we should send tweet programmatically.
    // @TODO: Find a way how to inject our uploaded image id into tweet form data
    sendTweet(screenshotMediaId){
        var FT = this;
        var $form = this._$currentForm;
        var token = this.getFormAuthenticityToken();
        var data = {
            tweetboxId: FT.getCurrentTweetBoxId(),
            tweetData: {
                is_permalink_page: false,
                media_ids: screenshotMediaId.toString(),
                place_id: '',
                status: FT._currentStatusText,
                tagged_users: '',
            },
        };
        // Trigger tweet sendind with help of twitter API
        // Also trigger message showing
        // because for now there are caused uncaught
        // exception by method "tweetSent" that called after
        // uiSendTweet event processed successfully,
        // and success message do not shown
        $(document)
            .trigger('uiSendTweet', data)
            .trigger('uiShowMessage', {
                message: FatTweet.t('Fat tweet was successfully sent'),
            })
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
    getFormAuthenticityToken(){
        return JSON.parse($('.json-data').val()).formAuthenticityToken;
    }
    getUserName(){
        var data = JSON.parse($('.json-data').val());
        return {
            screenName: data.screenName,
            fullName: data.fullName,
        };
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
    static error(text){
        if(FatTweet.isTwitterPageContext()){
            var data = {
                message: text,
            };
            $(document).trigger('uiShowError', data);
        } else {
            alert(text);
        }
    }
    /**
     * For now this is just placeholder for translate function
     * @param  string text String that should be translated
     * @returns string Translated string
     */
    static t(string){
        return string;
    }
    static isTwitterPageContext(){
        return typeof $ == 'function' && window.location.host.search('/twitter\.com/') !== -1;
    }
    // Warning: methods "getSettingsFromStorage"
    // and "saveSettingsToStorage" below WILL NOT work
    // in twitter page context,
    // because there are not available property
    // "sync" of chrome.storage
    static getSettingsFromStorage(){
        return new Promise(function(resolve, reject) {
             if(typeof chrome.storage.sync == 'undefined'){
                 reject(FatTweet.t('Chrome storage unavailable.'));
                 return;
             }
             chrome.storage.sync.get('FatTweet', function(s){
                if(typeof chrome.runtime.lastError == 'string'){
                    reject(FatTweet.t(chrome.runtime.lastError));
                    return;
                }
                if(typeof s.FatTweet == 'object'){
                    resolve(s.FatTweet);
                } else {
                    resolve({
                        enabled: 1,
                        insert_nickname: 1,
                        font_size: 16,
                    });
                }
            });
        });
    }
    static saveSettingsToStorage(settings){
        return new Promise(function(resolve, reject){
            if(typeof chrome.storage.sync == 'undefined'){
                reject(FatTweet.t('Chrome storage unavailable.'));
                return;
            }
            chrome.storage.sync.set({'FatTweet': settings}, function() {
                resolve();
            });
        });
    }
}
