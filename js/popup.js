$(document).ready(function(){
    $('.about-link-wrapper a')
        .on('click', function(e){
            e.preventDefault();
            if($(this).hasClass('about-link')){
                $('body')
                    .removeClass('current-page-main')
                    .addClass('current-page-about');
            } else {
                 $('body')
                    .removeClass('current-page-about')
                    .addClass('current-page-main');
            }
        });
    // For links in "About" section
    $('body').on('click', '.links a', function(){
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });
    FatTweet
        .getSettingsFromStorage()
        .then(function(settings){
            // Create settings controls dynamically
            // in order to fill them with current settings
            $('#settings')
                .append('<label><input name="enabled" type="checkbox"'
                        + (1==settings.enabled ? ' checked' : '')
                        + '>'
                        + FatTweet.t('Enabled') + '</label>')
                .append('<label><input name="insert_nickname" type="checkbox"'
                        + (1==settings.insert_nickname ? ' checked' : '')
                        + '>'
                        + FatTweet.t('Insert nickname to screenshot') + '</label>')
                .append('<label><input name="attachment_confirmation" type="checkbox"'
                        + (1==settings.attachment_confirmation ? ' checked' : '')
                        + '>'
                        + FatTweet.t('Ask confirmation when tweet has attachments')
                        + '<div class="description">' + FatTweet.t('Attachments will be lost when send "Fat tweet" if them present.') + '</div>'
                        + '</label>')
                .append('<label><input name="font_size" type="number" min="10" max="100" step="1" required value="'
                        + settings.font_size
                        + '">'
                        + FatTweet.t('Font size on screenshot (in pixels)') + '</label>')
                .append('<label><input name="screenshot_timeout" min="0" max="3000" step="50" type="number" required value="'
                        + settings.screenshot_timeout
                        + '">'
                        + FatTweet.t('Timeout before make screenshot (ms)')
                        + '<div class="description">' + FatTweet.t('Need to have all styles applied before screenshot maked.') + '</div>'
                        + '</label>')
                .on('change', 'input', function(){
                    var newSettings = {};
                    $('#settings input').each(function(){
                        var type = $(this).attr('type'),
                            name = $(this).attr('name'),
                            minNum, maxNum, numStep;
                        if('checkbox' == type){
                            var value = $(this).is(':checked') ? 1 : 0;
                        } else if('number' == type){
                            minNum = $(this).attr('min');
                            maxNum = $(this).attr('max');
//                            numStep = $(this).attr('step');
                            var value = parseInt($(this).val());
                            if(value < minNum){
                                $(this).val(minNum);
                                value = minNum;
                            }
                            if(value > maxNum){
                                $(this).val(maxNum);
                                value = maxNum;
                            }
                        }
                        newSettings[name] = value;
                    });
                    FatTweet.saveSettingsToStorage(newSettings);
                });
                $('.note').text(FatTweet.t('Note: When you change settings, please reload page to have them applied.'));
        },
        function(reason){
            FatTweet.error(reason);
        });
});
