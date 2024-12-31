require('dotenv').config({path: '../.env'})

const axios = require('axios')
const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js');
const convertRomanianSpecialChars = require('./convertRomanianSpecialChars.js')

async function scrapeData() {
    // Supabase credentials
    const supabaseKey = process.env.SUPABASE_KEY
    const supabseUrl = process.env.SUPABASE_URL
    const supabase = createClient(supabseUrl, supabaseKey)
    
    // Extract the HTML from the juniors site
    let url = 'https://www.juniors.ro/jobs'
    let {data} = await axios.get(url)
    let $ = cheerio.load(data)
    
    let jobs = $('.job_list').find('li.job')
    for (let i = 0; i < jobs.length; i++) {
        let el = jobs[i]
            
        let name = $(el)
            .find('h3')
            .text()
            .trim()
            .replace(/\n+/g, ' ')

        let locations = $(el)
            .find('div.job_header_title strong')
            .text()
            .trim()
            .replace(/\s{2,}/g, ' ')
            .replace(/\s*\|\s*/g, ', ')
            .split(', ')
            .slice(0, -1)
            .map(location => convertRomanianSpecialChars(location.trim()))

        let company = $(el)
            .find('.job_requirements li')
            .eq(0)
            .text()
            .trim()
            .replace(/\s{2,}/g, ' ')
            .replace('Companie: ', '')

        let experience = $(el)
            .find('.ms-5 li')
            .eq(0)
            .text()
            .trim()
            .replace(/\s{2,}/g, ' ')
            .replace('Experiență solicitată: ', '')

        let jobType = $(el)
            .find('.ms-5 li')
            .eq(1)
            .text()
            .trim()
            .replace(/\s{2,}/g, ' ')
            .replace('Tip ofertă: ', '')
            .replace("Intern", "Internship")

        let detailsLink = $(el)
            .find('div.job_header_buttons a')
            .eq(1)
            .attr('href')

        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const formattedDate = `${year}-${month}-${day}`;
        
        const newJobListing = {
            name: name, 
            location: locations, 
            company: company, 
            experience: experience, 
            source: "Juniors.ro", 
            found_at: formattedDate,
            details: detailsLink,
            job_type: jobType
        }
        
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



scrapeData()