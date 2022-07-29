const Apify = require('apify');

const {
    utils: { log },
} = Apify;
const { applyFunction } = require('./utils');

exports.SEARCH_PAGE = async (page, request, query, requestQueue, maxPostCount, evaledFunc) => {
    // CHECK FOR SELECTOR
    let { savedItems, pageNumber } = request.userData;
    const { hostname } = request.userData;

    await page.waitForSelector('div.sh-pr__product-results');

    const resultsLength = await page.evaluate(() => {
        return document.querySelector('div.sh-pr__product-results').children.length;
    });


    // check HTML if page has no results
    if (resultsLength === 0) {
        log.warning('The page has no results. Check dataset for more info.');

        await Apify.pushData({
            '#debug': Apify.utils.createRequestDebugInfo(request),
        });
    }


    log.info(`Found ${resultsLength} products on the page.`);
    // eslint-disable-next-line no-shadow
    const data = await page.evaluate(
        (maxPostCount, query, savedItems) => {

            // nodes with items
            let results = Array.from(document.querySelectorAll('.sh-dlr__list-result'));
            if (results.length === 0) results = Array.from(document.querySelectorAll('.sh-dlr__content'));
            // limit the results to be scraped, if maxPostCount exists
            if (maxPostCount) {
                results = results.slice(0, maxPostCount - savedItems);
            }

            // eslint-disable-next-line no-shadow
            const data = [];
            // ITERATING NODES TO GET RESULTS
            for (let i = 0; i < results.length; i++) {
                // Please pay attention that "merchantMetrics" and "reviewsLink" were removed from the  "SEARCH" page.
                const item = results[i];
                // KEYS OF OUTPUT OBJ

                // console.log("Product", i)

                const type = 'result'

                const title = item.querySelector('h3') ? item.querySelector('h3') : null;

                const productName = title?.textContent ?? null;

                // const productLinkAnchor = item.querySelector('a[href*="shopping/product/"]')
                //     ? item.querySelector('a[href*="shopping/product/"]')
                //     : null;
                // const productLink = productLinkAnchor ? productLinkAnchor.href : null;

                // const price = item.querySelector('div[data-sh-or="price"] div > span > span')?.textContent ?? null;

                const description = item.querySelectorAll('div.hBUZL')[1]?.textContent ?? null;

                // const merchantName = item.querySelector('div[data-sh-or="price"]')?.nextSibling?.textContent ?? null;

                // const merchantLink = item.querySelector('div[data-sh-or="price"]')?.parentElement?.parentElement?.href ?? null;

                // const idArray = productLink ? productLink.split('?')[0].split('/') : null;
                // const shoppingId = idArray ? idArray[idArray.length - 1] : null;

                console.log("Item ;", item)
                console.log("Item div ;", item.querySelector('div.tDoYpc div'))

                let reviewsScore = 0
                let reviewsCount = 0

                if (item.querySelector('div.tDoYpc div')) {

                    const reviewStr = item.querySelector('div.tDoYpc div').getAttribute('aria-label').replace(/,/g, '.')
                    const numbers = reviewStr.match(/\d+\.?\d*/g)
                    const n1 = parseFloat(numbers[0])
                    const n2 = parseFloat(numbers[1])

                    if (n1 > 5 && n2 <= 5) {

                        reviewsScore = n2
                        reviewsCount = n1

                    } else if (n2 > 5 && n1 <= 5) {

                        reviewsScore = n1
                        reviewsCount = n2

                    } else {
                        // L'un des 2 n'est pas < 5 ... donc doute ...
                        // Seule possibilité : Les 2 sont < 5, puisque la note sur 5 ... ne peut être > 5 ... genious

                        // Le nb reviews est le 
                        const elemText = item.querySelector('div.tDoYpc div div').textContent.replace(/\s+/g, '')
                        if (elemText.indexOf(n1) > -1) {
                            reviewsScore = n2
                            reviewsCount = n1
                        } else {
                            reviewsScore = n1
                            reviewsCount = n2
                        }
                    }

                }

                // FINAL OUTPUT OBJ
                const output = {
                    query,
                    type,
                    productName,
                    // productLink,
                    // price,
                    description,
                    // merchantName,
                    // merchantLink,
                    // shoppingId,
                    reviewsScore,
                    reviewsCount,
                    positionOnSearchPage: i + 1,
                    productDetails: item.querySelectorAll('.translate-content')[1]?.textContent.trim(),
                };

                data.push(output);
            }


            // Ads :
            // nodes with items
            let adContainer = document.querySelector('.GhTN2e')
            let ads = Array.from(adContainer.querySelectorAll('.KZmu8e'));

            // ITERATING NODES TO GET ADS
            for (let i = 0; i < ads.length; i++) {
                // Please pay attention that "merchantMetrics" and "reviewsLink" were removed from the  "SEARCH" page.
                const item = ads[i];
                // KEYS OF OUTPUT OBJ

                // console.log("Ad", i)

                const type = 'ad'

                const title = item.querySelector('.sh-np__product-title') ? item.querySelector('.sh-np__product-title') : null;

                const productName = title?.textContent ?? null;

                // const productLinkAnchor = item.querySelector('a[href*="shopping/product/"]')
                //     ? item.querySelector('a[href*="shopping/product/"]')
                //     : null;
                // const productLink = productLinkAnchor ? productLinkAnchor.href : null;

                // const price = item.querySelector('div[data-sh-or="price"] div > span > span')?.textContent ?? null;

                // const description = item.querySelectorAll('div.hBUZL')[1]?.textContent ?? null;

                // const merchantName = item.querySelector('div[data-sh-or="price"]')?.nextSibling?.textContent ?? null;

                // const merchantLink = item.querySelector('div[data-sh-or="price"]')?.parentElement?.parentElement?.href ?? null;

                // const idArray = productLink ? productLink.split('?')[0].split('/') : null;
                // const shoppingId = idArray ? idArray[idArray.length - 1] : null;

                let reviewsScore = 0
                let reviewsCount = 0

                console.log("Ad ;", item)
                console.log("Ad div ;", item.querySelector('div.U6puSd div'))

                if (item.querySelector('div.U6puSd div')) {

                    const reviewStr = item.querySelector('div.U6puSd div').getAttribute('aria-label')
                    const numbers = reviewStr.match(/\d+\.?\d*/g)
                    const n1 = parseFloat(numbers[0])
                    const n2 = parseFloat(numbers[1])

                    if (n1 > 5 && n2 <= 5) {

                        reviewsScore = n2
                        reviewsCount = n1

                    } else if (n2 > 5 && n1 <= 5) {

                        reviewsScore = n1
                        reviewsCount = n2

                    } else {
                        // L'un des 2 n'est pas < 5 ... donc doute ...
                        // Seule possibilité : Les 2 sont < 5, puisque la note sur 5 ... ne peut être > 5 ... genious

                        // Le nb reviews est le 
                        const elemText = item.querySelector('div.U6puSd div span').textContent.replace(/\s+/g, '')
                        if (elemText.indexOf(n1) > -1) {
                            reviewsScore = n2
                            reviewsCount = n1
                        } else {
                            reviewsScore = n1
                            reviewsCount = n2
                        }
                    }
                }

                // const reviewsScore = item.querySelector('div[aria-label*="product reviews"] span')?.textContent ?? null;
                // const reviewsCount = item.querySelector('div[aria-label*="product reviews"]')
                //     ? item.querySelector('div[aria-label*="product reviews"]').getAttribute('aria-label').split(' ')[0]
                //     : null;

                // FINAL OUTPUT OBJ
                const output = {
                    query,
                    type,
                    productName,
                    // productLink,
                    // price,
                    description: '',
                    // merchantName,
                    // merchantLink,
                    // shoppingId,
                    reviewsScore,
                    reviewsCount,
                    positionOnSearchPage: i + 1,
                    productDetails: item.querySelectorAll('.translate-content')[1]?.textContent.trim(),
                };

                data.push(output);
            }

            return data;
        },
        maxPostCount,
        query,
        savedItems,
    );
    // ITERATING ITEMS TO EXTEND WITH USERS FUNCTION
    for (let item of data) {
        if (evaledFunc) {
            item = await applyFunction(page, evaledFunc, item);
        }

        await Apify.pushData(item);
        savedItems++;
    }
    log.info(`${Math.min(maxPostCount, resultsLength)} items on the page were successfully scraped.`);
};
