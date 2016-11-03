// The currencyPair object corresponds to each card in the page.

// It holds data about that currency (last prices, real name (e.g. Ethereum), DOM elements to update)

// It holds methods to
// 1) .init() -> create the HTML for the card and add it to the DOM on initialization
// 2) .update(msg) -> handle JSON objects containing new ticker data for the respective instance of currencyPair sent from msgRouter
// 3) .updateDOM(node, className, newText) -> update the respective DOM element with new ticker data and trigger respective animations
// 4) .isId(pairId) -> returns true if the passed pairId matches the object's pairId (this.pairId) e.g. 'BTC_ETH'

function currencyPair(pairId) {
    // Currency pair e.g. 'BTC_ETH' of the instance of this object
    this.pairId = pairId;
    // Full name of currency, e.g. 'Ethereum' -> set in this.init();
    this.name = '';

    // Last ticker data for checking for changes
    this.lastTrade = 0;
    this.lastAsk = 0;
    this.lastBid = 0;
    this.lastMid = 0;
    this.volume = 0;
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

currencyPair.prototype.init = function(initialData, currencyData) {
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

    // setting this.name to name of matching currency
    this.name = currencyData[searchStr]['name'];

    // saving initial market data
    var data = initialData[this.pairId];
    this.lastTrade = data['last'];
    this.lastAsk = data['lowestAsk'];
    this.lastBid = data['highestBid'];
    this.lastMid = ((parseFloat(this.lastBid)+parseFloat(this.lastAsk))/2);
    this.volume = data['baseVolume'];
    this.change = data['percentChange'];

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
    // Creating & adding new currency pair HTML to DOM
    var addToDom = '<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12"><div class="pair-name-container"><div class="tradePop" id="tradePop'+this.pairId+'">New Trade!</div><div class="pair-name" id="pairId'+this.pairId+'">'+prettyPairId+'</div><div class="pair-subname" id="pairName'+this.pairId+'">'+this.name+'</div></div><div class="volume"><span class="opacity">24hr Vol:</span><div class="value" id="vol'+this.pairId+'"> '+parseFloat(this.volume).toFixed(8)+'</div></div><div class="pair-box"><div class="top-data-containter"><div class="top-data no-show"><div class="price">0.00019923</div><div class="label">Last Trade Price</div></div><div class="top-data percnt-chnge"><div class="price" id="prcnt'+this.pairId+'">'+(parseFloat(this.change)*100).toFixed(2)+'%</div><div class="label">24hr Change</div></div><div class="top-data last-trade"><div class="price" id="trade'+this.pairId+'">'+parseFloat(this.lastTrade).toFixed(8)+'</div><div class="label">Last Trade</div></div></div><div class="bottom-data-container"><div class="bidask ask"><div class="price" id="bid'+this.pairId+'">'+parseFloat(this.lastBid).toFixed(8)+'</div><div class="label">Highest Bid</div></div><div class="bidask mid"><div class="price" id="mid'+this.pairId+'">'+this.lastMid.toFixed(8)+'</div><div class="label">Mid - Market</div></div><div class="bidask bid"><div class="price" id="ask'+this.pairId+'">'+parseFloat(this.lastAsk).toFixed(8)+'</div><div class="label">Lowest Ask</div></div></div></div></div>';
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

currencyPair.prototype.update = function(msg) {
    // Checking if new trade price
    if (msg[1] != this.lastTrade) {
        var price = parseFloat(msg[1]);

        if (price > this.lastTrade) {
            this.tradeEl = this.updateDOM(this.tradeEl, 'triggerPositive', (price.toFixed(8)).toString());
            this.tradePopEl = this.updateDOM(this.tradePopEl, 'triggerTradePop', 'New Trade!');
        }
        else if (price < this.lastTrade) {
            this.tradeEl = this.updateDOM(this.tradeEl, 'triggerNegative', (price.toFixed(8)).toString());
            this.tradePopEl = this.updateDOM(this.tradePopEl, 'triggerTradePop', 'New Trade!');
        }
        this.lastTrade = price;
    }

    // Chekcing if new ask price
    if (msg[2] != this.lastAsk) {
        var askFlt = parseFloat(msg[2]);
        var bidFlt = parseFloat(msg[3]);
        var midFlt = ((askFlt+bidFlt)/2).toFixed(8);

        if (midFlt > this.lastMid) {
            this.askEl = this.updateDOM(this.askEl, 'triggerPositive', (askFlt.toFixed(8)).toString());
            this.midEl = this.updateDOM(this.midEl, 'triggerPositive', (midFlt).toString());
        }
        else if (midFlt < this.lastMid) {
            this.askEl = this.updateDOM(this.askEl, 'triggerNegative', (askFlt.toFixed(8)).toString());
            this.midEl = this.updateDOM(this.midEl, 'triggerNegative', (midFlt).toString());
        }
        this.lastMid = midFlt;
        this.lastAsk = askFlt;
    }

    // Checking if new bid price
    if (msg[3] != this.lastBid) {
        var askFlt = parseFloat(msg[2]);
        var bidFlt = parseFloat(msg[3]);
        var midFlt = ((askFlt+bidFlt)/2).toFixed(8);

        if (midFlt > this.lastMid) {
            console.log('mid ' + midFlt);
            console.log('lastmid ' + this.lastMid);
            this.bidEl = this.updateDOM(this.bidEl, 'triggerPositive', (bidFlt.toFixed(8)).toString());
            this.midEl = this.updateDOM(this.midEl, 'triggerPositive', (midFlt).toString());
        }
        else if (midFlt < this.lastMid) {
            this.bidEl = this.updateDOM(this.bidEl, 'triggerNegative', (bidFlt.toFixed(8)).toString());
            this.midEl = this.updateDOM(this.midEl, 'triggerNegative', (midFlt).toString());
        }
        this.lastMid = midFlt;
        this.lastBid = bidFlt;
    }

    // Checking if volume has changed
    if (msg[5] != this.volume) {
        var vol = parseFloat(msg[5]);

        if (vol > this.lastVol) {
            this.volumeEl = this.updateDOM(this.volumeEl, 'triggerPositive', (vol.toFixed(8)).toString());
        }
        else if (vol < this.lastVol) {
            this.volumeEl = this.updateDOM(this.volumeEl, 'triggerNegative', (vol.toFixed(8)).toString());
        }
        this.volume = vol;
    }

    // Checking if 24hr percent change has updated
    if (msg[4] != this.change) {
        var change = parseFloat(msg[4]);

        if (change > this.lastChange) {
            this.changeEl = this.updateDOM(this.changeEl, 'triggerPositive', ((change*100).toFixed(2)).toString()+'%');
        }
        else if (change < this.lastChange){
            this.changeEl = this.updateDOM(this.changeEl, 'triggerNegative', ((change*100).toFixed(2)).toString()+'%');
        }
        this.change = change;
    }
}

currencyPair.prototype.httpRequest = function() {

}

currencyPair.prototype.updateDOM = function(node, className, newText) {
    // To force reflow and restart the animation, we remove all animation classes,
    // clone the node, delete the original node, and replace it with the clone
    // where we add the animation class we want triggered

    node.classList.remove('triggerNegative');
    node.classList.remove('triggerPositive');
    node.classList.remove('triggerTradePop');

    var clone = node.cloneNode(true);
    clone.classList.add(className);
    node.parentNode.replaceChild(clone, node);
    clone.textContent = newText;

    return clone;
}

currencyPair.prototype.isId = function(Id) {
    // Checks if the object instance is the one we desire
    if (this.pairId === Id) {
        return true;
    }
    return false;
}
