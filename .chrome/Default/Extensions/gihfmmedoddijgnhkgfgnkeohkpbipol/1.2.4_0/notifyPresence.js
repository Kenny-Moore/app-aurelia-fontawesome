document.body.classList.add("yahoo_chrome_newtab_ext_installed");

if (location.host === 'downloads.yahoo.com' && location.pathname === '/gdpr/extensions'){
    var port = chrome.runtime.connect();
    port.onDisconnect.addListener(function(port) {
        console.log('content script :: disconnected');
    }); 
    port.onMessage.addListener(function(message, sender, sendResponse) {
        console.log('content script :: message from extension:', message);
        var wrapped = {
            type: 'FROM_CONTENT_SCRIPT',
            privacyObj: message
        };
        window.postMessage(wrapped, 'https://downloads.yahoo.com');
    });
}