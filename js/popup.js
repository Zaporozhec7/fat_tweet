$(document).ready(function(){
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
                .append('<label><input name="font_size" type="number" required value="'
                        + settings.font_size
                        + '">'
                        + FatTweet.t('Font size on screenshot (in pixels)') + '</label>')
                .append('<label><input name="screenshot_timeout" type="number" required value="'
                        + settings.screenshot_timeout
                        + '">'
                        + FatTweet.t('Timeout before make screenshot (ms)')
                        + '<div class="description">' + FatTweet.t('Need to have all styles applied before screenshot maked.') + '</div>'
                        + '</label>')
                .on('change', 'input', function(){
                    var newSettings = {};
                    $('#settings input').each(function(){
                        var type = $(this).attr('type');
                        var name = $(this).attr('name');
                        if('checkbox' == type){
                            var value = $(this).is(':checked') ? 1 : 0;
                        } else {
                            var value = $(this).val();
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
