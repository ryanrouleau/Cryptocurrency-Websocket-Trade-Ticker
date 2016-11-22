// // // // // //
// For each currency card on the page, there is a respective currencyPair
// object.
//
// This object contains data to store general information about the
// currency (e.g. full name -> 'Ethereum') and  trade data.
//
// It holds methods to create the html for the card and add it to the DOM on
// initialization, to take in new ticker data and update the respective DOM
// elements and trigger respective animations, to add or remove last trade prices
// to the tab title, and to change the base currency from BTC to USD and vice-versa.
// The currencyPair objects are created and kept track of in msgRouter.js
// /// // // // //


function currencyPair(pairId) {
    // Currency pair e.g. 'BTC_ETH' of the instance of this object
    this.pairId = pairId;

    // Full name of currency, e.g. 'Ethereum' -> set in this.init();
    this.name = '';

    // E.g. ETH if the pairId is BTC_ETH -> set in this.init();
    this.currencyCode = '';

    this.updateTitle = false;

    this.baseCurrency = 'btc';

    this.btcPrice = 0;

    // Last ticker data for checking for changes
    this.lastTrade = 0;
    this.lastAsk = 0;
    this.lastBid = 0;
    this.lastMid = 0;
    this.lastVol = 0;
    this.change = 0;

    // HTML DOM objects that will be updated. We set them with getElementById()
    // only once on the initial currency div creation in this.init();
    this.tradeEl;
    this.askEl;
    this.bidEl;
    this.midEl;
    this.volumeEl;
    this.changeEl;
}


// // // // // //
// init()
//
// Takes data (ticker, and general) for all currencies, and the current BTC price
// as arguments and grabs the relevant the data for it's instance
// (defined by this.pairId) and stores it.
// It also creates the initial HTML for the card and adds it to the DOM.
// // // // // //

currencyPair.prototype.init = function(initialData, currencyData, btcPrice) {
    this.btcPrice = btcPrice;
    // To get real name of currency e.g. Ethereum from BTC_ETH, we search the currencyData object
    // which lists currencies by the symbol e.g. ETH. So we have to split the seocnd currency from the pairId to search
    var i = 0;
    var found = false;
    var searchStr;
    while (!found) {
        if (this.pairId[i] === '_') {
            searchStr = this.pairId.slice(i+1,this.pairId.length);
            found = true;
        }
        i++
    }

    this.currencyCode = searchStr;

    // setting this.name to name of matching currency
    this.name = currencyData[searchStr]['name'];

    // saving initial market data
    var data = initialData[this.pairId];
    this.lastTrade = parseFloat(data['last']);
    this.lastAsk = parseFloat(data['lowestAsk']);
    this.lastBid = parseFloat(data['highestBid']);
    this.lastMid = ((parseFloat(this.lastBid)+parseFloat(this.lastAsk))/2);
    this.lastVol = parseFloat(data['baseVolume']);
    this.change = parseFloat(data['percentChange']);

    // Making the pairId from form 'BTC_XMR' to 'BTC - XMR'
    var prettyPairId = '';
    var length = this.pairId.length;
    for (var i = 0; i < length; i++) {
        if (this.pairId[i] != '_') {
            prettyPairId += this.pairId[i];
        }
        else {
            prettyPairId += ' - ';
        }
    }
    //console.log(this.name);
    // Creating & adding new currency pair HTML to DOM
    var addToDom = '<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12"><div class="pair-name-container"><div class="tradePop" id="tradePop'+this.pairId+'">New Trade!</div><div class="pair-name" id="pairId'+this.pairId+'">'+prettyPairId+'</div><div class="pair-subname" id="pairName'+this.pairId+'">'+this.name+'</div></div><div class="volume"><span class="opacity">24hr Vol:</span><div class="value" id="vol'+this.pairId+'"> '+this.lastVol.toFixed(2)+'</div></div><div class="pair-box"><div class="top-data-containter"><div class="top-data no-show"><div class="price">0.00019923</div><div class="label">Last Trade Price</div></div><div class="top-data percnt-chnge"><div class="price" id="prcnt'+this.pairId+'">'+(this.change*100).toFixed(2)+'%</div><div class="label">24hr Change</div></div><div class="top-data last-trade"><div class="price" id="trade'+this.pairId+'">'+this.lastTrade.toFixed(8)+'</div><div class="label">Last Trade</div></div></div><div class="bottom-data-container"><div class="bidask ask"><div class="price" id="bid'+this.pairId+'">'+this.lastBid.toFixed(8)+'</div><div class="label">Highest Bid</div></div><div class="bidask mid"><div class="price" id="mid'+this.pairId+'">'+this.lastMid.toFixed(8)+'</div><div class="label">Mid - Market</div></div><div class="bidask bid"><div class="price" id="ask'+this.pairId+'">'+this.lastAsk.toFixed(8)+'</div><div class="label">Lowest Ask</div></div></div><div class="add-to-tab" id="tab'+this.pairId+'">Add '+this.name+' updates to tab title</div></div></div>';
    document.getElementById('addNew').insertAdjacentHTML('beforebegin', addToDom);

    // We now store the element for later DOM updates
    this.tradeEl = document.getElementById('trade'+this.pairId);
    this.askEl = document.getElementById('ask'+this.pairId);
    this.bidEl = document.getElementById('bid'+this.pairId);
    this.midEl = document.getElementById('mid'+this.pairId);
    this.volumeEl = document.getElementById('vol'+this.pairId);
    this.changeEl = document.getElementById('prcnt'+this.pairId);
    this.tradePopEl = document.getElementById('tradePop'+this.pairId);
}


// // // // // //
// update(msg)
//
// Takes a JSON object sent from msgRouter.js and finds what data has changed
// that triggered a new ticker message for the currency. It then updates the DOM
// for the respective fields and stores the new data.
//
// Generally for each data item we keep track of:
//      - last trade price, highest ask, lowest bid, mid market price,
//        24hr volume, and 24hr percent change
// we check if the last value we stored is different than the value in the passed
// JSON object, and if it is, then we parse it to a float, determine if the value
// has increased or decreased, then update the DOM and trigger the respective
// green (good) or red (bad) animation
// // // // // //

currencyPair.prototype.update = function(msg) {
    // Parsing and storing values of msg obj
    var price = parseFloat(msg[1]);
    var askFlt = parseFloat(msg[2]);
    var bidFlt = parseFloat(msg[3]);
    var vol = parseFloat(msg[5]);
    var change = parseFloat(msg[4]);

    // Checking if new trade price
    if (price != this.lastTrade) {
        var tradeArrow = '';

        if (price > this.lastTrade) {
            this.tradeEl = this.updateDOM(this.tradeEl, 'triggerPositive', price, -1, '');
            this.tradePopEl = this.updateDOM(this.tradePopEl, 'triggerTradePop', 'New Trade!', -1, '');
            tradeArrow = '▴';
        }
        else if (price < this.lastTrade) {
            this.tradeEl = this.updateDOM(this.tradeEl, 'triggerNegative', price, -1, '');
            this.tradePopEl = this.updateDOM(this.tradePopEl, 'triggerTradePop', 'New Trade!', -1, '');
            tradeArrow = '▾';
        }
        // If the user has requested tab title updates for this currency, then
        // we do that
        if (this.updateTitle) {
            if (this.baseCurrency === 'btc') {
                document.title = this.currencyCode + ': ' + (price.toFixed(8)).toString() + ' ' + tradeArrow;
            }
            else {
                document.title = this.currencyCode + ': $' + ((price*this.btcPrice).toFixed(4)).toString() + ' ' + tradeArrow;
            }
        }
        this.lastTrade = price;
    }

    // Chekcing if new ask price
    if (askFlt != this.lastAsk) {
        var midFlt = ((askFlt+bidFlt)/2);

        if (midFlt > this.lastMid) {
            this.askEl = this.updateDOM(this.askEl, 'triggerPositive', askFlt, -1, '');
            this.midEl = this.updateDOM(this.midEl, 'triggerPositive', midFlt, -1, '');
        }
        else if (midFlt < this.lastMid) {
            this.askEl = this.updateDOM(this.askEl, 'triggerNegative', askFlt, -1, '');
            this.midEl = this.updateDOM(this.midEl, 'triggerNegative', midFlt, -1, '');
        }
        this.lastMid = midFlt;
        this.lastAsk = askFlt;
    }

    // Checking if new bid price
    if (bidFlt != this.lastBid) {
        var midFlt = ((askFlt+bidFlt)/2);

        if (midFlt > this.lastMid) {
            this.bidEl = this.updateDOM(this.bidEl, 'triggerPositive', bidFlt, -1, '');
            this.midEl = this.updateDOM(this.midEl, 'triggerPositive', midFlt, -1, '');
        }
        else if (midFlt < this.lastMid) {
            this.bidEl = this.updateDOM(this.bidEl, 'triggerNegative', bidFlt, -1, '');
            this.midEl = this.updateDOM(this.midEl, 'triggerNegative', midFlt, -1, '');
        }
        this.lastMid = midFlt;
        this.lastBid = bidFlt;
    }

    // Checking if volume has changed
    if (vol != this.lastVol) {
        var sigFigs = 2;
        if (this.baseCurrency === 'usd') {
            sigFigs = 0;
        }

        if (vol > this.lastVol) {
            this.volumeEl = this.updateDOM(this.volumeEl, 'triggerPositive', vol, sigFigs, '');
        }
        else if (vol < this.lastVol) {
            this.volumeEl = this.updateDOM(this.volumeEl, 'triggerNegative', vol, sigFigs, '');
        }
        this.lastVol = vol;
    }

    // Checking if 24hr percent change has updated
    if (change != this.change) {
        if (change > this.lastChange) {
            this.changeEl = this.updateDOM(this.changeEl, 'triggerPositive', (change*100), 2, '%');
        }
        else if (change < this.lastChange){
            this.changeEl = this.updateDOM(this.changeEl, 'triggerNegative', (change*100), 2, '%');
        }
        this.change = change;
    }
}


// // // // // //
// updateDOM()
//
// Takes necessary arguments to determine what to and how to update an element
// in the DOM corresponding to a data item (e.g. last trade price), updates
// the text of that element with the new data and adds/removes classes to
// trigger animations.
// // // // // //

currencyPair.prototype.updateDOM = function(node, className, value, overrideSigFigs, percentSign) {
    // To force reflow and restart the animation, we remove all animation classes,
    // clone the node, delete the original node, and replace it with the clone
    // where we add the animation class we want triggered.
    // If we just remove and add back the class, the browser won't reflow
    // and the animation won't be triggered after the first time
    //
    // If overrideSigFigs = -1 then we assume default significant figures for
    // respective base currency (8 for btc and 4 for usd), otherwise we use the
    // value of overrideSigFigs

    console.log('Updating DOM for: ');
    console.log(node);
    node.classList.remove('triggerNegative');
    node.classList.remove('triggerPositive');
    node.classList.remove('triggerTradePop');

    var clone = node.cloneNode(true);
    clone.classList.add(className);
    node.parentNode.replaceChild(clone, node);

    var sigFigs = 8; // default # of significant figures for BTC base currency
    if (overrideSigFigs === -1 && this.baseCurrency === 'usd') {
        sigFigs = 4; // default # of significant figures for USD base currency
    }
    else if (overrideSigFigs !== -1) {
        sigFigs = overrideSigFigs;
    }

    var insertText = '';
    if (typeof value === 'string') {
        insertText = value;
        // e.g. 'New Trade!'
    }
    else if (percentSign !== '') {
        insertText = value.toFixed(sigFigs).toString() + percentSign;
    }
    else if (this.baseCurrency === 'btc') {
        insertText = value.toFixed(sigFigs).toString();
        // e.g. 3.43% or 0.00946678
    }
    else if (this.baseCurrency === 'usd') {
        insertText = '$' + (value*this.btcPrice).toFixed(sigFigs).toString();
        // e.g. $3.409
    }
    clone.textContent = insertText;

    return clone;
}


// // // // // //
// isId()
//
// Takes a pairId (e.g. BTC_ETH) and returns true if the current instance is the
// the piarId passed. This used in msgRouter.js to determine where to send new
// new messages and other methods where a specific currencyPair object needs
// to be updated
// // // // // //

currencyPair.prototype.isId = function(Id) {
    // Checks if the object instance is the one we desire
    if (this.pairId === Id) {
        return true;
    }
    return false;
}


// // // // // //
// updatePageTitle()
//
// If the argument is true, then the method updates the page title with the last
// trade price and sets this.updatePageTitle to true for updating the title
// whenever a new trade price is found in the JSON object passed to update()
//
// If the arugment is false, then then method disables title updates for this
// currency.
//
// It also updates the button in the card to show either 'Add' or 'Remove'
// // // // // //

currencyPair.prototype.updatePageTitle = function(update) {
    if (update) {
        this.updateTitle = true;
        if (this.baseCurrency === 'btc') {
            document.title = this.currencyCode + ': ' + this.lastTrade;
        }
        else {
            document.title = this.currencyCode + ': $' + (this.lastTrade*this.btcPrice).toFixed(4);
        }
        document.getElementById('tab'+this.pairId).innerHTML = 'Remove ' + this.name + ' updates from tab title';
    }
    else {
        this.updateTitle = false;
        document.getElementById('tab'+this.pairId).innerHTML = 'Add ' + this.name + ' updates to tab title';
    }
}


// // // // // //
// updateBaseCurrency()
//
// Takes either 'btc' or 'usd' as the argument and updates the base currency
// and respective DOM elements to that base currency for the instance
// // // // // //

currencyPair.prototype.updateBaseCurrency = function(currency) {
    this.baseCurrency = currency;

    // These three variables by default are set to the respective values for BTC
    // base currency. If the update is to switch to USD, then the vars get the
    // respective values for USD base currency
    var multiplier = 1;
    var currencySign = '';
    var sigFigs = 8;
    if (currency === 'usd') {
        multiplier = this.btcPrice;
        currencySign = '$';
        sigFigs = 4;
    }

    // Calculating prices in USD and updating DOM
    this.tradeEl.innerHTML = currencySign + (this.lastTrade*multiplier).toFixed(sigFigs).toString();
    this.askEl.innerHTML = currencySign + (this.lastAsk*multiplier).toFixed(sigFigs).toString();
    this.bidEl.innerHTML = currencySign + (this.lastBid*multiplier).toFixed(sigFigs).toString();
    this.midEl.innerHTML = currencySign + (this.lastMid*multiplier).toFixed(sigFigs).toString();
    this.volumeEl.innerHTML = currencySign + (this.lastVol*multiplier).toFixed(0).toString();
    if (this.updateTitle) {
        document.title = this.currencyCode + ': ' + currencySign + (this.lastTrade*multiplier).toFixed(sigFigs).toString();
    }
}
