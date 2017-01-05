# Fat tweet
Chrome (Opera/Chromium) extension that allow by one button click convert tweet to screenshot, attach that screenshot to tweet and send.

It do not use any external services, all operations performed directly on page by javascript.

[Video on YouTube](https://www.youtube.com/watch?v=3JRXCljOE7k&feature=youtu.be)

# Warning

Due this bug - [Screenshot totally white, without text on it](https://github.com/Zaporozhec7/fat_tweet/issues/7), that appear rare but randomly, please copy tweet text to clipboard before submit tweet, if you submit tweet throught extension button.

##For now exists some limitations:

1. To tweet can not be attached other images, gifs or polls
2. Smiles are not shown on screenshot
3. It quite buggy for now

##Installation
Extension can be installed from Chrome webstore - https://chrome.google.com/webstore/detail/fat-tweet/jaafhefkahfplcmdmmojbpcapekcpapm

If someone want use latest extension version, if that version not uploaded to webstore yet, he can download extension .crx file in "releases" section here:

1. Download .crx file
2. Open extensions page in your browser 
    - Chrome/Chromium - chrome://extensions/
    - Opera - opera://startpage/extensions 
3. Drag extension file to that page

This app became possible thanks to the authors of library `html2canvas` (https://github.com/niklasvh/html2canvas), which used in this extension to make screenshots.
