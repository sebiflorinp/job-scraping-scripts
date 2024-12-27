const axios = require('axios')
const cheerio = require('cheerio')

async function scrapeData() {
    // Extract the HTML from the juniors site
    let url = 'https://www.juniors.ro/jobs?page=1'
    let {data} = await axios.get(url)
    let $ = cheerio.load(data)
    
    // Find the number of pages to scrape
    let maxPage = 1
    $('.pagination').find('li').each((i, el) => {
        let pageNumberOrNothing = $(el).find('a').text()
        if (!isNaN(pageNumberOrNothing) && Number(pageNumberOrNothing) > maxPage) {
            maxPage = pageNumberOrNothing
        }
    })
    
    // Scrape the needed data from each page
    for(let i = 1; i <= maxPage; i++) {
        url = 'https://www.juniors.ro/jobs?page=' + i
        let {data} = await axios.get(url)
        $ = cheerio.load(data)
        
        $('.job_list').find('li.job').each((i, el) => {
            let name = $(el).find('h3')
                            .text()
                            .replace(/\n+/g, ' ')
            
            let locations = $(el).find('div.job_header_title strong')
                                 .text()
                                 .trim()
                                 .replace(/\s{2,}/g, ' ')
                                 .split('|')
                                 .slice(0, -1)
                                 .map(location => location.trim())
            
            let tags = []
            $(el).find('.job_tags li a').each((i, el) => {
                tags.push($(el).text())
            })
            
            let company = $(el).find('.job_requirements li')
                               .eq(0)
                               .text()
                               .trim()
                               .replace(/\s{2,}/g, ' ')
                               .replace('Companie: ', '')
            
            let experience = $(el).find('.ms-5 li')
                                  .eq(0)
                                  .text()
                                  .trim()
                                  .replace(/\s{2,}/g, ' ')
                                  .replace('Experiență solicitată: ', '') 
            
            let jobType = $(el).find('.ms-5 li')
                               .eq(1)
                               .text()
                               .trim()
                               .replace(/\s{2,}/g, ' ')
                               .replace('Tip ofertă: ', '') 
            
            console.log(name)
            console.log(locations);
            console.log(tags)
            console.log(company)
            console.log(experience)
            console.log(jobType)
            
        })
    }
}

scrapeData()