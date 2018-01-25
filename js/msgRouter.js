// // // // // //
// The msgRouter object's main responsibility is to handle incoming websocket
// messages and to send them to the corresponding currencyPair instance for DOM updates.
// It is also responsible for adding new currency pairs and changing the base
// currency from either USD or BTC to USD or BTC
// // // // // //

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

    // Finding DOM object of the 'add new currency' select menu
    this.selectMenuEl = $('#selectMenu');

    // The number of default pairs to show: sorted from highest to lowest volume
    this.numDefaultPairs = 5;

    // The pairId for the current currency being updated in the page title
    this.currentTab = null;

    // The current base currency.
    this.baseCurrency = 'btc';

    // BTC price in USD
    this.btcPrice = 0;

    // Keeping track of # of currency updates
    this.numUpdates = 0;
    this.numUpdatesEl = document.getElementById('num-updates');
    this.numUpdatesEl.textContent = '0';

    // Disable splash screen
    this.disableSplash = false;
    if (this.disableSplash) {
        removeSplashScreen();
    }
}

// // // // // //
// initTickerData()
//
// Stores the initial ticker data in this.initialTickerData which is then passed
// to currencyPair object's on initialization so they can grab their respective
// data and show on DOM before websocket messages arrive.
// It also parses and sets this.btcPrice
// // // // // //

msgRouter.prototype.initTickerData = function(initialData) {
    this.tickerReady = true;
    this.initialTickerData = initialData;

    this.currencyPairIds = {};
    const keys = Object.keys(initialData);
    keys.forEach(currencyPair => {
      const currency = initialData[currencyPair];
      this.currencyPairIds[currency.id] = currencyPair;
    });
    console.log(this.currencyPairIds);
    console.log(initialData);
    // Getting the current BTC-USD price to pass to our currencyPair objects
    // and updating the price under the page title in the dom
    this.btcPrice = parseFloat(this.initialTickerData['USDT_BTC'].last);
    document.getElementById('btc-price').innerHTML = '1 BTC = $' + this.btcPrice.toFixed(2).toString();

    // Checking to see if this.currencyData is set before intializing the
    // currencyPair objects. Both this.initialTickerData & this.currencyData
    // need to be set before those objects are created.
    if (this.currencyData != null) {
        this.createSortedByVol();
        this.createDefaultPairs();
        this.createSelectMenu();
        // Remove splash screen
        removeSplashScreen();
    }
}


// // // // // //
// initCurrencyData()
//
// Stores the non-trading related data for all the currencys currently listed
// on the exchange
// // // // // //

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
        // Remove splash screen
        removeSplashScreen();
    }
}


// // // // // //
// createSortedByVol()
//
// Sets this.sortedByVol[] to an array of objects containing each currency
// currently listed on the exchange (found in this.currencyData) sorted from
// highest to lowest 24 hour volume.
// This arrray is used in adding new currency to the page.
// // // // // //

msgRouter.prototype.createSortedByVol = function() {
    // Here we loop through all the keys in this.initialTickerData and get its
    // respective volume to pass into a new array (this.sortedByVol) containing
    // objects that hold the pairId of the currency and its 24hr vol

    // Yes, key in x is super slow, but it only executes once.
    var tempArry = [];
    for (key in this.initialTickerData) {
        // Were only interested in currency pairs with the base voluem of Bitcoin
        // so we only grab the pairs who's pairId starts with 'B' (denoting BTC),
        // for example 'BTC_ETH'
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


// // // // // //
// createDefaultPairs()
//
// Creates the currencyPair objects for the respective number of default pairs
// defined in this.numDefaultPairs and stores them in this.activePairs[]
// // // // // //

msgRouter.prototype.createDefaultPairs = function() {
    // Creating the corresponding currencPair objects and pushing them into
    // this.activePairs[] for the number of default pairs specified above
    for (var i = 0; i < this.numDefaultPairs; i++) {
        var newPair = new currencyPair(this.currenciesByVol[i].pairId);
        newPair.init(this.initialTickerData, this.currencyData, this.btcPrice);
        this.activePairs.push(newPair);
    }
    //this.activePairs[0].updatePageTitle(true);
}


// // // // // //
// updatePair()
//
// Called in msgRouter object on the arrival of a new websocket message.
// It finds the correpsonding currencyPair object in this.activePairs[] and sends
// the JSON message to that currencyPair object for DOM updates.
// // // // // //

msgRouter.prototype.updatePair = function(msg) {
    // Looping through this.activePairs to find which currencyPair object to
    // update, and then sending the message object to the corresponding
    // currencyPair object to update it and the DOM
    var found = false;
    var i = 0;
    var pairId = this.currencyPairIds[msg[0]];

    var length = this.activePairs.length;
    while (!found && i < length) {
        if (this.activePairs[i].isId(pairId)) {
            this.activePairs[i].update(msg);
            found = true;
        }
        i++;
    }
    if (found) {
        this.numUpdates++;
        this.numUpdatesEl.innerHTML = this.numUpdates;
    }
}


// // // // // //
// createSelectMenu()
//
// Creates the select menu for adding new currencies. These are listed from
// highest to lowest volume by using this.sortedByVol[] in the menu
// // // // // //

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
        // can add it
        if (!isActive) {
            // slicing the pairId of the respective currency so we can pass it to
            // this.currencyData[] and get the currency's full name (e.g. Ethereum from ETH)
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
            optionHtml += '<option id="'+currency.pairId+'" value="'+currency.pairId+'">'+this.currencyData[pairId]['name']+' (24hr Vol: '+currency.volume+')</option>';
        }
    }
    $('#selectMenu').html(optionHtml);
}


// // // // // //
// addPair()
//
// Creates a new currencyPair obj, initializes it, and adds it to this.activePairs[]
// // // // // //

msgRouter.prototype.addPair = function(pairId) {
    // If the passed pairId is null, then the user didn't select a currency from
    // the select menu and instead clicked 'add next highest vol currency'
    if (pairId != null) {
        var newPair = new currencyPair(pairId);
        newPair.init(this.initialTickerData, this.currencyData, this.btcPrice);

        // By default new currency pairs show their base curreny in BTC
        if (this.baseCurrency !== 'btc') {
            newPair.updateBaseCurrency(this.baseCurrency);
        }

        this.activePairs.push(newPair);
    }
    else {
        // We loop though sortedByVol[] pairs from highest to lowest vol and we
        // activate the first pair that is not in activePairs[] as this will be the
        // next highest unactive currency
        var lengthVol = this.currenciesByVol.length;
        var lengthActive = this.activePairs.length;
        var i = 0;
        var finished = false;
        while (i < lengthVol && !finished) {
            var found = false;
            pairId = this.currenciesByVol[i].pairId;
            var j = 0;
            while (j < lengthActive && !found) {
                if (this.activePairs[j].isId(pairId)) {
                    found = true;
                }
                j++;
            }
            if (!found) {
                var newPair = new currencyPair(pairId);
                newPair.init(this.initialTickerData, this.currencyData, this.btcPrice);
                if (this.baseCurrency !== 'btc') {
                    newPair.updateBaseCurrency(this.baseCurrency);
                }
                this.activePairs.push(newPair);
                finished = true;
            }
            i++;
        }
    }
    // We remove the added pair from the select menu
    document.getElementById(pairId).remove();
}


// // // // // //
// tabTitleUpdate()
//
// Finds the respective currencyPair object that the user wishes to add updates
// to the tab title for and enables it while disabling the current currency
// being updated
// // // // // //

msgRouter.prototype.tabTitleUpdate = function(pairId, type) {
    var i = 0;
    var length = this.activePairs.length;
    while (i < length) {
        if (this.activePairs[i].isId(pairId)) {
            this.activePairs[i].updatePageTitle(true);
        }
        if (this.activePairs[i].isId(this.currentTab)) {
            this.activePairs[i].updatePageTitle(false);
        }
        i++;
    }
    this.currentTab = pairId;
    if (type === 'default') {
        document.title = 'The Crypto Ticker';
        this.currentTab = null;
    }

}


// // // // // //
// updateBaseCurrency()
//
// Called when the user selects a new base currency (either BTC or USD) in the
// small menu underneath the header 'The Crypto Ticker.'
// It loops through each active currencyPair object and calls their function
// to update the DOM so it displays the desired currency
// // // // // //

msgRouter.prototype.updateBaseCurrency = function(currency) {
    if (this.baseCurrency != currency) {
        var length = this.activePairs.length;
        for (var i = 0; i < length; i++) {
            this.activePairs[i].updateBaseCurrency(currency);
        }
        this.baseCurrency = currency;
        return true;
    }
    return false;
}
