require('dotenv').config({path: '../.env'})

const axios = require('axios')
const cheerio = require('cheerio')
const convertRomanianSpecialChars = require('./convertRomanianSpecialChars.js')
const puppeteer = require('puppeteer');
const {createClient} = require("@supabase/supabase-js");

async function scrapeData() {
    // Supabase credentials
    const supabaseKey = process.env.SUPABASE_KEY
    const supabseUrl = process.env.SUPABASE_URL
    const supabase = createClient(supabseUrl, supabaseKey)
    
    // Extract the HTML from ejobs
    let url = process.env.EJOBS_LINK
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto(url)
        
    await page.evaluate(() => {
        window.scrollBy(0, 3100)
    })
        
    await new Promise(resolve => setTimeout(resolve, 12000));
        
    let html = await page.content()
    let $ = cheerio.load(html) 
    let jobCards = $('div.job-card-content-middle');
    for (let i = 0; i < jobCards.length; i++) {
        let el = jobCards[i]
            
        let jobName = $(el).find('a').eq(0).text()
        let company = $(el).find('a').eq(1).text()
        let locations = $(el).find('div.job-card-content-middle__info').eq(0).text()
        let detailsLink ='https://www.ejobs.ro' + $(el).find('a').eq(0).attr('href')
            
        let {data: dataDetailsLink} = await axios.get(detailsLink)
        let $1 = cheerio.load(dataDetailsLink)
        let experience = $1('div.jobs-show-main-summaries__summary--border-double a.jobs-show-main-summaries__summary-link').eq(0).text()

        let newJobListing = createNewJobListing(jobName, company, locations, detailsLink, experience, "Job")
        console.log(newJobListing)
        
        // Check if the job exists already
        const formattedLocations = `{${newJobListing.location.map(item => `"${item}"`).join(",")}}`;

        const {data, error} = await supabase
            .from("Jobs")
            .select()
            .eq('name', newJobListing.name)
            .eq('location', formattedLocations)
            .eq('experience', newJobListing.experience)
            .eq('job_type', newJobListing.job_type)
        
        if (data.length === 0) {
            const {error} = await supabase.from("Jobs").insert(newJobListing)
        }
    }
}

function createNewJobListing(jobName, company, locations, detailsLink, experience, jobType) {
    // format the locations to be an array
    let formattedLocations = locations.split(',')
    formattedLocations = formattedLocations.map(location => {
        let locationToFormat = location.trim()
        locationToFormat = locationToFormat.replace("și alte  orașe", "").trim();
        locationToFormat = locationToFormat.replace("și alte orașe", "").trim();
        locationToFormat = locationToFormat.replace(" (de acasă)", "").trim()
        return convertRomanianSpecialChars(locationToFormat)
    })
    formattedLocations = formattedLocations.filter(location => location !== "Strainatate")
    
    experience = experience.replace(',', "")
    experience = experience.replace("Entry-Level (< 2 ani)", "< 2 ani")
    experience = experience.replace("Mid-Level (2-5 ani)", "2-5 ani")
    experience = experience.replace("Senior-Level (> 5 ani)", "> 5 ani")

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const formattedDate = `${year}-${month}-${day}`;

    return {
        name: jobName,
        location: formattedLocations,
        company: company,
        experience: experience,
        source: "ejobs.ro",
        found_at: formattedDate,
        details: detailsLink,
        job_type: jobType
    }
}

scrapeData()