require('dotenv').config({path:"../.env"})
const axios = require('axios')
const {createClient} = require("@supabase/supabase-js");

async function processData() {
    // Supabase credentials
    const supabaseKey = process.env.SUPABASE_KEY
    const supabseUrl = process.env.SUPABASE_URL
    const supabase = createClient(supabseUrl, supabaseKey)
    
    const url = process.env.DEVJOBS_LINK
    const {data: devjobsData} = await axios.get(url)
    for (let i = 0; i < devjobsData.length; i++) {
        let name = devjobsData[i].name
        let workplace = devjobsData[i].workplace
        let cityCategory = devjobsData[i].cityCategory
        let company = devjobsData[i].company
        let experience = devjobsData[i].expLevel
        let jobUrl = devjobsData[i].jobUrl
        
        let newJobListing = createJobListing(name, workplace, cityCategory, company, experience, jobUrl)
        
        // Check if the listing isn't already in the db
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

function createJobListing(name, workplace, city, company, experience, jobUrl) {
    let formattedLocations = []
    if (workplace === "remote") {
        formattedLocations.push("Remote")
    } else {
        formattedLocations.push(city)
    }
    
    let formattedExperience;
    switch (experience) {
        case "Junior":
            formattedExperience = "< 2 ani";
            break
        case "Regular":
            formattedExperience = "2-5 ani";
            break
        default:
            formattedExperience = "> 5 ani";
            break
    }

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const formattedDate = `${year}-${month}-${day}`;
    
    let detailsLink = "https://devjob.ro/jobs/" + jobUrl
    
    return {
        name: name,
        location: formattedLocations,
        experience: formattedExperience,
        source: "devjobs.ro",
        found_at: formattedDate,
        details: detailsLink,
        job_type: "Job"
    }
}

processData()
