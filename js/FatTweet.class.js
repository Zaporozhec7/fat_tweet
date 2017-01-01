class FatTweet {
    constructor(extensionRoot, settings){
        this._settings = settings;
        this._uploadsAPIDomain = 'https://upload.twitter.com';
        this._tweetAPIDomain = 'https://twitter.com';
        // Can be image/jpeg, image/jpg, image/png
        this._screenshotImageTypeDefault = 'image/png';
        // Should be float or integer from 0 to 1
        // mean screenshot quality
        this._screenshotImageQualityDefault = 1;
        this._ajaxDefaultSettings = {
            type: 'POST',
            global: false,
            crossDomain: true,
            // I do not really know why such timeout,
            // just seen that twitter use such value
            // for requests that we made
            timeout: 45000,
            xhrFields: {
                withCredentials: true,
            }
        };
        this._extensionRoot = extensionRoot;
        this._mediaIds = [];
        this._mediaCount = 0;
        this._$currentForm = null;
        this._currentStatusText = null;
        this.processTweetBoxes();
        var FT = this;
        $('body').on('click', '.fat-tweet-convert-text', function(e){
            e.preventDefault();
            var $form = $(this).closest('form');
            FT._$currentForm = $form;
            function _sendFatTweet(){
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
            }
            var hasAttachments = FT.formHasAttachments($form);
            if(!hasAttachments || !FT._settings.attachment_confirmation){
                _sendFatTweet();
            } else {
                var confirmMessage;
                switch(hasAttachments){
                    case 'image':
                        confirmMessage = FatTweet.t('Tweet has image(s) attached that will be lost if you will continue.\n Continue?');
                        break;
                    case 'gif':
                        confirmMessage = FatTweet.t('Tweet has GIF attached that will be lost if you will continue.\n Continue?');
                        break;
                    case 'poll':
                        confirmMessage = FatTweet.t('Tweet has poll attached that will be lost if you will continue.\n Continue?');
                        break;
                }
                if(window.confirm(confirmMessage)) {
                    _sendFatTweet();
                }
            }
        });
        $(document).on('uiImagePickerAdd uiImagePickerRemove', function(e, data = {}){
            if(typeof data.scribeContext != 'object'
               || typeof data.scribeContext.component == 'undefined'
               || data.scribeContext.component != 'tweet_box') return;
            if(e.type == 'uiImagePickerAdd'){
                FT._mediaCount++;
            } else {
                FT._mediaCount--;
            }
        })
        // Try to catch all possible cases
        // when can be added new tweet form
        $(document).on('uiInitTweetbox uiLoadDynamicContent uiOpenReplyDialog uiOpenTweetDialog', function(e, data){
            FT.processTweetBoxes();
        }).on('uiTweetSent dataTweetSuccess', function(){
            FT.resetTemporaryData();
        }).ajaxStop(function() {
            FT.processTweetBoxes();
        });
        // Mutation observer should be enough to achieve
        // task above, but by some cause that i do not found yet
        // it do not always work, so use events bindings above too
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
    formHasAttachments($form){
        if($form.find('.ComposerThumbnail:not(.ComposerThumbnail--gif)').length){
            return 'image';
        } else if($form.find('.ComposerThumbnail--gif').length){
            return 'gif';
        } else if($form.find('.PollingCardComposer').length){
            return 'poll';
        }
        return false;
    }
    resetTemporaryData(){
        this._mediaIds = [];
        this._mediaCount = 0;
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
        var $button = $('<button class="btn fat-tweet-convert-text js-tooltip" data-delay="150" data-original-title="'
                        + FatTweet.t('Convert text into image, attach it to tweet and send')
                        + '" type="button"><img src="'
                        + this._extensionRoot
                        + 'img/32.png"></button>');
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
                        resolve(FT.getBlobFromCanvas(canvas, FT._screenshotImageTypeDefault, FT._screenshotImageQualityDefault));
                        FT.areaCleanup($area);
                    },
                    onerror: function(){
                        $area.removeClass('screenshot-process');
                        reject(FatTweet.t('Error when try make screenshot.'));
                        FT.areaCleanup($area);
                    },
                    allowTaint: true,
                    letterRendering: true,
                    timeout: FT._settings.screenshot_timeout,
                });
            });
        });
    }
    getBlobFromCanvas(canvas, type = 'image/png', quality = 1){
        var dataURL = canvas.toDataURL(type, quality);
        return this.dataURItoBlob(dataURL);
    }

    // Was have issue like this https://bugs.chromium.org/p/chromium/issues/detail?id=243080
    // when ajax requests canceled by chrome
    // but little different, and do not found cause
    // This solution seems work
    ajax(url, settings, successCallback, failCallback, initTimeout = 200, retryTimeout = 400, maxAttempts = 3, attemptsDone = 0, retryTimeoutGrowth = 200){
        var FT = this;
        if(!attemptsDone){
            settings = $.extend(true, {}, this._ajaxDefaultSettings, settings);
        }
        function _ajax(){
            var isDone = false;
            var isFail = false;
            function _retry(){
                if(retryTimeoutGrowth){
                    retryTimeout += retryTimeoutGrowth;
                }
                setTimeout(function(){
                    FT.ajax(url, settings, successCallback, failCallback, 0, retryTimeout, maxAttempts, attemptsDone + 1, retryTimeoutGrowth);
                }, retryTimeout);
            }
            $.ajax(url, settings)
                .done(function(a, b, c){
                    isDone = true;
                    successCallback(a, b, c);
                })
                .fail(function(a, b, c){
                    isFail = true;
                    if(attemptsDone + 1 < maxAttempts){
                        _retry();
                    } else {
                        failCallback(a, b, c);
                    }
                })
                .always(function(a, b, c){
                    // Workaround for some HTTP headers
                    // that twitter sometimes sent on which
                    // not called .done() or .fail()
                    if(b != 'success' && !isDone && !isFail){
                        if(attemptsDone + 1 < maxAttempts){
                            _retry();
                        } else {
                            failCallback(a, b, c);
                        }
                    } else if(b == 'success'){
                        successCallback(a, b, c);
                    }
                });
        }
        if(initTimeout){
            setTimeout(_ajax, initTimeout);
        } else {
            _ajax();
        }
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
            var url = FT._uploadsAPIDomain + '/i/media/upload.json?command=INIT&total_bytes='
            + blobData.size
            + '&media_type='
            + encodeURIComponent(FT._screenshotImageTypeDefault)
            + '&media_category=tweet_image';
            FT.ajax(
                url,
                {
                    dataType: 'json',
                },
                function(a){
                    resolve({
                            blobData: blobData,
                            screenshotMediaId: a.media_id_string,
                        });
                },
                function(){
                    reject(FatTweet.t('Fat Tweet: Something went wrong on media INIT stage'));
                });
        });
    }
    appendUpload(data){
        var FT = this;
        return new Promise(function(resolve, reject) {
            var url = FT._uploadsAPIDomain + '/i/media/upload.json?command=APPEND&media_id='
            + data.screenshotMediaId
            + '&segment_index=0';
            var fd = new FormData();
            fd.append('media', data.blobData, 'blob');
            FT.ajax(
                url,
                {
                    data: fd,
                    contentType: false,
                    processData: false,
                },
                function(a){
                    resolve();
                },
                function(){
                    reject(FatTweet.t('Fat Tweet: Something went wrong on media APPEND stage'));
                });
        });
    }
    finalizeUpload(mediaId){
        var FT = this;
        return new Promise(function(resolve, reject) {
            var url = FT._uploadsAPIDomain + '/i/media/upload.json?command=FINALIZE&media_id='
            + mediaId;
            FT.ajax(
                url,
                {},
                function(a){
                    resolve();
                },
                function(){
                    reject(FatTweet.t('Fat Tweet: Something went wrong on media FINALIZE stage'));
                });
        });
    }
    getCurrentTweetBoxId(){
        if(typeof this._$currentForm != null && this._$currentForm.length)
            return this._$currentForm.attr('id');
        return false;
    }
    getInReplyStatusId($form){
        var $area = $form.find('.tweet-box[name="tweet"]');
        var areaId = $area.attr('id');
        var matches = areaId.match(/reply\-to\-([0-9]+)/);
        if(matches !== null){
            return matches[1].toString();
        }
        return false;
    }
    isPermalinkPage($form){
        if($form.closest('.permalink').length){
            return true;
        }
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
        var url = FT._tweetAPIDomain + '/i/tweet/create';
        var data = {
            authenticity_token: token,
            is_permalink_page: FT.isPermalinkPage($form),
            media_ids: screenshotMediaId.toString(),
            place_id: '',
            status: FT._currentStatusText,
            tagged_users: '',
        };
        var inReplyToId = FT.getInReplyStatusId($form);
        if(inReplyToId){
            data.in_reply_to_status_id = inReplyToId;
        }
        FT.ajax(
            url,
            {
                data: data,
                dataType: 'json',
            },
            function(response){
                $(document)
                     .trigger('uiShowMessage', {
                         message: response.message,
                     })
                     .trigger('dataTweetSuccess', {
                        tweetboxId: FT.getCurrentTweetBoxId(),
                        message: response.message,
                        tweet_id: response.tweet_id,
                        sourceEventData: {
                            tweetboxId: FT.getCurrentTweetBoxId(),
                        },
                    });
                 $form.trigger('uiComposerResetAndFocus');
            },
            function(jqXHR, textStatus, errorThrown){
                FatTweet.error(textStatus);
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
                        attachment_confirmation: 1,
                        font_size: 16,
                        screenshot_timeout: 500,
                    });
                }
            });
        });
    }
    static saveSettingsToStorage(settings){
        return new Promise(function(resolve, reject){
            if(typeof chrome.storage.sync == 'undefined'){
                reject(FatTweet.t('Chrome sync storage unavailable.'));
                return;
            }
            chrome.storage.sync.set({'FatTweet': settings}, function() {
                resolve();
            });
        });
    }
}
