let itemValues;
let hasRoPro = false;

const local = {
    get: key => new Promise(resolve => {
        chrome.storage.local.get(key)
            .then(result => resolve(result[key]));
    }),
    set: (key, data) => new Promise(async resolve => {
        let json = {};
        json[key] = data;

        await chrome.storage.local.set(json);
        resolve();
    }),
}

const waitFor = selector => new Promise(resolve => {
    const waitForElementToDisplay = () => {
        let querySelector = document.querySelector(selector);
        if (querySelector !== null && !querySelector.classList.contains('ollie')) {
            querySelector.classList.add('ollie');
            return resolve(querySelector)
        } else setTimeout(waitForElementToDisplay, 100);
    }

    waitForElementToDisplay();
})

let tradeWindow = {
    givingTotalValue: "#trades-container > div > div.ng-scope > div > div > div.col-xs-12.col-sm-8.trades-list-detail > div > div.col-xs-12 > div:nth-child(1) > div:nth-child(4)",
    receivingTotalValue: "#trades-container > div > div.ng-scope > div > div > div.col-xs-12.col-sm-8.trades-list-detail > div > div.col-xs-12 > div:nth-child(2) > div:nth-child(4)",
    receivingText: "#trades-container > div > div.ng-scope > div > div > div.col-xs-12.col-sm-8.trades-list-detail > div > div.col-xs-12 > div:nth-child(2) > h3"
}

const ollieIconStyle = `style="background-image:url('https://ollie.fund/static/img/ollie.png');background-position:2px 2px;background-size:80%;"`;
const ollieIcon = `<span class="icon-robux-16x16 icon-ollie" ${ollieIconStyle}></span>`

const renderTradeWindowSide = async element => {
    const totalValueLine = element;
    const tradeHolder = element.parentElement;

    const itemHolder = tradeHolder.getElementsByClassName('hlist item-cards item-cards-stackable')[0];

    let totalValue = 0;

    // await new Promise(resolve => setTimeout(resolve, 500));
    for (const item of itemHolder.children) {
        const itemCaption = item.getElementsByClassName('item-card-caption')[0];
        const itemLinkElement = itemCaption.children[0];
        const itemId = itemLinkElement.href.split('log/')[1].split('/')[0];
        const thumbnailContainer = item.getElementsByClassName('item-card-thumb-container')[0];

        itemLinkElement.target = '_blank';

        // prevent against desync in actual rap and rap from the server
        let updatedRap = item.getElementsByClassName('text-overflow item-card-price')[0].innerText;
            updatedRap = Number(updatedRap.replace(/,/g, ''))
        let itemDetails = itemValues[itemId];
        if (!itemDetails) itemDetails = {
            demandScore: 0,
            id: itemId,
            lowestPrice: 0,
            rap: 0,
            value: null
        }

        itemDetails.rap = updatedRap;
        const actualItemValue = itemDetails.value || itemDetails.rap || 0
        totalValue += actualItemValue;

        let demandScore = itemDetails.demandScore || 0;
        if (demandScore > 10) demandScore = Math.round(demandScore);
        else if (demandScore > 1) demandScore = Math.round(demandScore * 10) / 10;
        

        
        const fancyDemandScore = demandScore.toLocaleString();

        const rolimonsLink = document.createElement('a');
        rolimonsLink.target = '_blank';
        rolimonsLink.href = `https://rolimons.com/item/${itemId}`;
        rolimonsLink.innerHTML = `<span style="right:8px;top:8px;bottom:initial;left:initial;" class="limited-icon-container tooltip-pastnames" data-toggle="tooltip" title="" data-original-title="view on rolimons"> <span class="font-caption-header text-subheader limited-number">${fancyDemandScore}</span> </span>`
        
        const demandHtml = `<span style="right:8px;left:auto;" class="limited-icon-container ng-isolate-scope" uib-tooltip="sellless" tooltip-placement="right" tooltip-append-to-body="true" limited-icon="" layout-options="userAsset.layoutOptions"> <span class="limited-number-container" ng-show="layoutOptions.isUnique"><span class="font-caption-header text-subheader limited-number" style="${demandScore > 10 ? '8px' : '10px'}">${fancyDemandScore}</span> </span></span>`
        // thumbnailContainer.innerHTML = demandHtml + thumbnailContainer.innerHTML;
        thumbnailContainer.appendChild(rolimonsLink);

        itemCaption.innerHTML += 
        `<div ng-class="{ 'invisible': !userAsset.recentAveragePrice }" class="text-overflow item-card-price">
            ${ollieIcon}
            <span class="text-robux ng-binding">${actualItemValue.toLocaleString()}</span>
        </div>`
    }

    totalValueLine.innerHTML += `<div class="robux-line ollie-margin">
    <span class="text-lead ng-binding" ng-bind="'Label.TotalValue' | translate">Ollie Value:</span>
    <span class="robux-line-amount"> ${ollieIcon}
    <span class="text-robux-lg robux-line-value ng-binding">${totalValue.toLocaleString()}</span> </span> </span>
    </div>`;

    return totalValue;
}
const renderTradeWindow = async () => {
    itemValues = await local.get('items');
    itemValues[151784526].value = 999999;

    let giving = await waitFor(tradeWindow.givingTotalValue);
    let receiving = await waitFor(tradeWindow.receivingTotalValue);

    const amountGiving = await renderTradeWindowSide(giving) || 0;
    const amountReceiving = await renderTradeWindowSide(receiving) || 0;

    const amountWin = amountReceiving - amountGiving;
    const percentWin = Math.round(amountWin / amountGiving * 10000) / 100;

    console.log(`Sending ${amountGiving} for ${amountReceiving}, ${percentWin}% win`)

    let winRatioHtml = `<div><div style="position:absolute;display:block;top:49%;left:159px;width:100%;text-align:center;width:250px;"><span class="robux-line-amount content"> <span class="icon icon-robux-16x16" style="background-image:url(https://ollie.fund/static/img/${amountWin > 0 ? 'win' : 'loss'}.png);background-position:0px 1px;background-size:100%;width:24px;margin-left:1px;margin-bottom:7px;margin-right:3px;"></span><span class="text-robux-lg robux-line-value ng-binding">${amountWin >= 0 ? '+' : ''}${amountWin.toLocaleString()}</span><span style="vertical-align:top;" class="text-robux robux-line-value ng-binding"> (${percentWin.toLocaleString()}%)</span></span></div></div>`

    const itemsYouWillReceiveText = document.querySelector(tradeWindow.receivingText);
    console.log(itemsYouWillReceiveText);

    if (!hasRoPro) 
        itemsYouWillReceiveText.innerHTML += winRatioHtml;

    renderTradeWindow();
}

const main = async () => {
    renderTradeWindow();
}

(async () => {
    await waitFor('.ropro-icon')
    hasRoPro = true;

    console.log('ropro is also installed !');
})()

main();