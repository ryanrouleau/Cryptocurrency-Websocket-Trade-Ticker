// Creating our message router object
router = new msgRouter();

// AJAX request to get initial market conditions and pass to our router object for initialization
$.get("https://poloniex.com/public?command=returnTicker", function(data) {
    router.initTickerData(data);
});
$.get("https://poloniex.com/public?command=returnCurrencies", function(data) {
    router.initCurrencyData(data);
});

// Creating new websocket connection with autobahn to poloniex crypto exchange api
var connection = new autobahn.Connection({
    url: 'wss://api.poloniex.com',
    realm: 'realm1'
});

connection.onopen = function (session) {
    var numReceived = 0;
    var numReceivedEl = document.getElementById('num-received');

    // Callback function run on the arrival of every websocket message
    function onevent(args) {
        // Passing the JSON message object to our router and updating respective currency pair
        router.updatePair(args);
        numReceived++;
        numReceivedEl.textContent = numReceived;
        console.log(args);
    }
    session.subscribe('ticker', onevent);
};

connection.open();

// Called in msgRouter.js once all the currency objects have been created and
// added to the DOM. We have a timeout so the splash screen doesn't disappear
// right away on a fast conenction and confuses the user
function removeSplashScreen() {
    setTimeout(function() {
        $('#loading-text').html('Successfully Connected');
        $('.spinner').css('animation', 'none');
        $('.splash-screen').addClass('fade-out');
    }, 700);
}

// jQuery UI interactions
$(function () {
    // Add new currency handlers
    $('#selectMenu').bind('change', function() {
        router.addPair(this.value);
    });
    $('#addNext').click(function () {
        router.addPair(null);
    });

    // Add currency updates to tab title handler
    $('.main-container').on('click', '.add-to-tab', function () {
        var pairId = $(this).attr('id').slice(3);
        if ($(this).text()[0] === 'R') { // button is showing 'Remove' so we set the title back to default
            router.tabTitleUpdate(pairId, 'default');
        }
        else {
            router.tabTitleUpdate(pairId, 'replace');
        }
    });

    // Select BTC/USD base currency handlers
    $('td').click(function () {
        var currencySelected = $(this).attr('id');
        if (router.updateBaseCurrency(currencySelected)) {
            $(this).addClass('current');
            $(this).siblings().removeClass('current');
        }
    });

    // Learn more popup
    $('#learn-more').click(function() {
        $('#learn-more-popup').addClass('showPopUp');
    });
});
