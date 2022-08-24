const Apify = require('apify');

const {
    utils: { log },
} = Apify;
const { applyFunction } = require('./utils');


async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {

            console.log("Scrolling ...")
            var totalHeight = 0;
            var distance = 20000;
            let elementScrolled = document.querySelector('.gws-plugins-horizon-jobs__tl-no-filters')

            var timer = setInterval(() => {
                var scrollHeight = elementScrolled.scrollHeight
                document.querySelector('.zxU94d.gws-plugins-horizon-jobs__tl-lvc').scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - elementScrolled.clientHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}


exports.SEARCH_PAGE = async (countryCode, page, request, query, requestQueue, maxPostCount, evaledFunc) => {
    // CHECK FOR SELECTOR
    let { savedItems, pageNumber } = request.userData;
    const { hostname } = request.userData;

    await page.waitForSelector('div.KzzVYe');

    // check HTML if page has no results
    // if (resultsLength === 0) {
    //     log.warning('The page has no results. Check dataset for more info.');

    //     await Apify.pushData({
    //         '#debug': Apify.utils.createRequestDebugInfo(request),
    //     });
    // }

    await autoScroll(page);

    // log.info(`Found ${resultsLength} products on the page.`);
    // eslint-disable-next-line no-shadow
    const data = await page.evaluate(
        async (countryCode, maxPostCount, query, savedItems) => {

            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            let data = []
            let lstJob = Array.from(document.querySelectorAll('.gws-plugins-horizon-jobs__li-ed'))
            for (let jobElement of lstJob) {

                jobElement.querySelector('.Fol1qc').click()

                await sleep(1000)

                // Wait ? 0.8 sec ?
                const jobContentElement = document.querySelector('.whazf.bD1FPe .pE8vnd.avtvi')
                
                const title = jobContentElement.querySelector('.sH3zFd .KLsYvd').innerText
                let content = ''
                if (jobContentElement.querySelector('.YgLbBe.YRi0le .HBvzbc'))
                    jobContentElement.querySelector('.YgLbBe.YRi0le .HBvzbc').innerText
                else
                    jobContentElement.querySelector('.JvOW3e').innerText
        

                const elemEmployerLocation = jobContentElement.querySelector('.tJ9zfc')
                const elemsDiv = elemEmployerLocation.querySelectorAll(':scope > div')
                const employer = elemsDiv[0].innerText
                const location = elemsDiv[1].innerText

                // Get infos from job :
                data.push({
                    countryCode, 
                    query,
                    title,
                    content,
                    employer,
                    location,
                })
            }

            return data;
        },
        countryCode,
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
