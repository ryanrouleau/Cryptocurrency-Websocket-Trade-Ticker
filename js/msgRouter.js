// The msgRouter object's main responsibility is to handle incoming websocket
// messages and to send them to the corresponding currencyPair instance for DOM updates.
// It is also responsible for UI events for adding new currency pairs and changing
// base currency from bitcoin to USD

// It holds initial ticker data to create new currencyPair objects,
// data about all the currencies currently listed on Poloniex's exchange,
// a sorted list of these currencies from highest to lowest volume,
// and it is also holds a variable for the number of default currencies to show

var msgRouter = function() {
    // Array of the active currencyPair objects
    this.activePairs = [];

    // Object of initial data of all currencies.
    // e.g. this.initialTickerData['BTC_ETH'] returns ticker data for BTC_ETH pair
    this.initialTickerData;

    // Array holding objects with pairId and 24hr vol attributes sorted from
    // higest to lowest 24hr volume
    this.currenciesByVol = [];

    // Holds non-trading related information about currencies
    // E.g. this.currencyData['ETH']['name'] returns 'Ethereum'
    this.currencyData;

    // Finding DOM object of the select menu to add any currently listed
    // currency pair on Poloniex
    this.selectMenuEl = $('#selectMenu');

    // The number of default pairs to show from hghest to lowest volume
    this.numDefaultPairs = 5;
}

msgRouter.prototype.initTickerData = function(initialData) {
    this.tickerReady = true;
    this.initialTickerData = initialData;

    // Checking to see if this.currencyData is set before intializing the
    // currencyPair objects. Both this.initialTickerData & this.currencyData
    // need to be set before those objects are created.
    if (this.currencyData != null) {
        this.createSortedByVol();
        this.createDefaultPairs();
        this.createSelectMenu();
    }
}

msgRouter.prototype.initCurrencyData = function(currencyData) {
    this.currencyDataReady = true;
    this.currencyData = currencyData;

    // Checking to see if this.currencyData is set before intializing the
    // currencyPair objects. Both this.initialTickerData & this.currencyData
    // need to be set before those objects are created.
    if (this.initialTickerData != null) {
        this.createSortedByVol();
        this.createDefaultPairs();
        this.createSelectMenu();
    }
}

msgRouter.prototype.createSortedByVol = function() {
    // Here we loop through all the keys in this.initialTickerData and get its
    // respective volume to pass into a new array (this.sortedByVol) containing
    // objects that hold the pairId of the currency and its 24hr vol

    // Yes, key in x is super slow, but it only executes once.
    var tempArry = [];
    for (key in this.initialTickerData) {
        // Were only interested in currency pairs with the base voluem of Bitcoin
        // so we only grab the pairs who's pairId starts with 'B' (denoting BTC)
        // in for example 'BTC_ETH'
        if (key[0] === 'B') {
            var tempObj = {pairId:key, volume:parseFloat(this.initialTickerData[key].baseVolume)};
            tempArry.push(tempObj);
        }
    }

    // Sorting currencies from greatest volume to lowest volume for this.currenciesByVol
    function sortByVol(a,b) {
        if (a.volume < b.volume) {
            return 1;
        }
        else if (a.volume > b.volume) {
            return -1;
        }
        else {
            return 0;
        }
    }
    this.currenciesByVol = tempArry.sort(sortByVol);
}

msgRouter.prototype.createDefaultPairs = function() {
    // Creating the corresponding currencPair objects and pushing them into
    // this.activePairs[] for the number of default pairs specified above
    for (var i = 0; i < this.numDefaultPairs; i++) {
        var newPair = new currencyPair(this.currenciesByVol[i].pairId);
        newPair.init(this.initialTickerData, this.currencyData);
        this.activePairs.push(newPair);
    }
}

msgRouter.prototype.updatePair = function(msg) {
    // Looping through this.activePairs to find which currencyPair object to
    // update, and then sending the message object to the corresponding
    // currencyPair object to update it and the DOM
    var found = false;
    var i = 0;
    var pairId = msg[0];
    var length = this.activePairs.length
    while (!found && i < length) {
        if (this.activePairs[i].isId(pairId)) {
            this.activePairs[i].update(msg);
        }
        i++;
    }
}

msgRouter.prototype.createSelectMenu = function() {
    // Creating the currency select menu at the bottom of the page
    var optionHtml = '<option value="default" id="default">+ Add Currency From List</option>';
    var lengthArry = this.currenciesByVol.length;
    for (var i = 0; i < lengthArry; i++) {
        var currency = this.currenciesByVol[i];

        // Checking if the currency is already an actice pair.
        var j = 0;
        var numActivePairs = this.activePairs.length;
        var isActive = false;
        while (!found && j < numActivePairs) {
            if (this.activePairs[j].isId(currency.pairId)) {
                isActive = true;
            }
            j++;
        }

        // If it is not an active pair, we add it to the select menu so the user
        // cna add it
        if (!isActive) {
            // slicing the pairId of the respective currency so we can pass it to
            // this.currencyData[] and get the currency's full name
            j = 0;
            var found = false;
            var pairId = currency.pairId;
            var pairIdLength = pairId.length;
            while (!found) {
                if (pairId[j] === '_') {
                    pairId = pairId.slice(j+1,pairIdLength);
                    found = true;
                }
                j++
            }
            optionHtml += '<option value="'+currency.pairId+'">'+this.currencyData[pairId]['name']+' (24hr Vol: '+currency.volume+')</option>';
        }
    }
    $('#selectMenu').html(optionHtml);
}

msgRouter.prototype.addPair = function(pairId) {
    // add new currency pair
}

msgRouter.prototype.deletePair = function(pairId) {
    // delete currency pair
}
