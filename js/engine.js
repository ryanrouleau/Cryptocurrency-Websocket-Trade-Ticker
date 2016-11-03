// Creating our message router object
router = new msgRouter();

// AJAX request to get initial market conditions and pass to our router object to initialize
$.get("https://poloniex.com/public?command=returnTicker", function(data) {
    router.initTickerData(data);
});
$.get("https://poloniex.com/public?command=returnCurrencies", function(data) {
    router.initCurrencyData(data);
});

// Creating new websocket connection with autobahnJS to poloniex
var connection = new autobahn.Connection({
    url: 'wss://api.poloniex.com',
    realm: 'realm1'
});

connection.onopen = function (session) {
    function onevent(args) {
        // Passing the JSON message object to our router and updating respective currency pair
        router.updatePair(args);
    }
    session.subscribe('ticker', onevent);
};

connection.open();
