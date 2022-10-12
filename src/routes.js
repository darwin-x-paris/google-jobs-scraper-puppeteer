const Apify = require('apify');

const {
    utils: { log },
} = Apify;
const { applyFunction, saveScreenshot } = require('./utils');


async function autoScroll(page) {

    let lstJob = await page.evaluate(() => { return document.querySelectorAll('.gws-plugins-horizon-jobs__li-ed') })
    console.log("Nb jobs loaded :", lstJob.length)
    console.log("Scrolling ...")

    for (let i = 0; i < 20; i++) {

        await page.evaluate(async () => {

            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            let lastHeight = 0


            async function scrollThat() {

                // console.log("scrollThat 1")
                await sleep(500)
                // console.log("scrollThat 2")
                var totalHeight = 0;
                var distance = 20000;
                let elementScrolled = document.querySelector('.gws-plugins-horizon-jobs__tl-no-filters')
                var scrollHeight = elementScrolled.scrollHeight
                document.querySelector('.zxU94d.gws-plugins-horizon-jobs__tl-lvc').scrollBy(0, distance);
                totalHeight += distance;

                await sleep(1500)
                // console.log("scrollThat 3", lastHeight, elementScrolled.clientHeight)
                // if (lastHeight < elementScrolled.clientHeight) {
                // lastHeight = elementScrolled.clientHeight
                // return scrollThat()
                // } else {
                //     return
                // }
            }

            await scrollThat()
        });
    }

    let lstJob2 = await page.evaluate(() => { return document.querySelectorAll('.gws-plugins-horizon-jobs__li-ed') })
    console.log("Nb jobs loaded 2 :", lstJob2.length)

}


exports.SEARCH_PAGE = async (countryCode, page, request, query, requestQueue, maxPostCount, evaledFunc) => {
    // CHECK FOR SELECTOR
    let { savedItems, pageNumber } = request.userData;
    const { hostname } = request.userData;

    await page.waitForSelector('div.KzzVYe');

    await autoScroll(page);

    let lstJob = await page.evaluate(() => { return document.querySelectorAll('.gws-plugins-horizon-jobs__li-ed') })
    let nbResults = lstJob.length

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

                if (!jobContentElement.querySelector('.sH3zFd .KLsYvd')) continue

                const title = jobContentElement.querySelector('.sH3zFd .KLsYvd').innerText

                let content = ''
                if (jobContentElement.querySelector('.HBvzbc'))
                    content = jobContentElement.querySelector('.HBvzbc').innerText
                else
                    content = jobContentElement.querySelector('.JvOW3e')?.innerText

                if (content) {
                    content = content.replace(/\s+/g, ' ')
                }

                // console.log("Job", title)

                const elemEmployerLocation = jobContentElement.querySelector('.tJ9zfc')
                const elemsDiv = elemEmployerLocation.querySelectorAll(':scope > div')

                // console.log("Employer location : ", elemEmployerLocation)

                const employer = elemsDiv[0]?.innerText
                const location = elemsDiv[1]?.innerText

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

    await saveScreenshot(page)

    // ITERATING ITEMS TO EXTEND WITH USERS FUNCTION
    for (let item of data) {
        if (evaledFunc) {
            item = await applyFunction(page, evaledFunc, item);
        }

        await Apify.pushData(item);
        savedItems++;
    }
    log.info(`${Math.min(maxPostCount, nbResults)} items on the page were successfully scraped.`);
};
