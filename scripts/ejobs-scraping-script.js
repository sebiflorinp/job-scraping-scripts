const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer');

async function scrapeData() {
    // Extract the HTML from the juniors site
    let url = 'https://www.ejobs.ro/locuri-de-munca/software-developer/pagina'
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    for (let pageNumber = 1; pageNumber <= 10; pageNumber++) {
        await page.goto(url + pageNumber)
        
       await page.evaluate(() => {
            window.scrollBy(0, 3100)
       })
        
        await new Promise(resolve => setTimeout(resolve, 12000));
        
        let html = await page.content()
        let $ = cheerio.load(html) 
        let jobCards = $('div.job-card-content-middle');
        for (let i = 0; i < jobCards.length; i++) {
            let el = jobCards[i]
            console.log($(el).find('a').eq(0).text())
            console.log($(el).find('a').eq(1).text())
            console.log($(el).find('div.job-card-content-middle__info').eq(0).text())
            console.log($(el).find('a').eq(0).attr('href'))
            let url2 ='https://www.ejobs.ro' + $(el).find('a').eq(0).attr('href')
            console.log(url2)
            let {data} = await axios.get(url2)
            let $1 = cheerio.load(data)
            console.log($1('div.jobs-show-main-summaries__summary--border-double a.jobs-show-main-summaries__summary-link').eq(0).text())
        }
        
    }
}

scrapeData()