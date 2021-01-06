//Funding Stats: https://docs.bitfinex.com/reference#rest-public-funding-stats
//The Funding Stats endpoint does not support the sort= parameter. As a result, it uses slightly different logic to iterate calls.

"use strict"

//Dependencies

const fetch = require('node-fetch')
const url = 'https://api-pub.bitfinex.com/v2/'
const fs = require('fs')

//Settings

const symbol = 'fUSD' // Set the funding currency for which you would like to retrieve data
let startTimeStamp = 1361274070000 // Set the TS for the oldest data you would like to retrieve. Oldest TS for fUSD & fBTC = 1361274070000 , 
let sortingMethod = "NewToOld" // Options: "NewToOld" or "OldToNew"

//End Settings

const pathParams = `funding/stats/${symbol}/hist`
const queryParams = 'limit=250'

let i = 0

//Functions

// getLastTimeStamp returns the timestamp of the most recent candle

async function getLastTimeStamp() {
    try {
        const req = await fetch(`${url}/${pathParams}?limit=1`)
        const response = await req.json()
        console.log(`End timestamp: ${response[0][0]}`)
        return(response[0][0])
    }
    catch (err) {
        console.log(err)
    }
}

//getFundingStats calls the FundingStats endpoint and returns the response. A delay is included to avoid rate limits. The function counts and prints the number of calls made and the number of elements in the returned reponse array.

async function getFundingStats(ts) {
    try{
        const req = await fetch(`${url}/${pathParams}?${queryParams}&end=${ts}`)
        const response = await req.json()
        await new Promise(r => setTimeout(r, 500));
        i++
        console.log(`Completed call ${i} which returned an array of ${response.length} items`)
        return (response)
    }
    catch (err) {
        console.log(err)
    }
}

//sendRequestLoop checks if the startTimeStamp is smaller than the timestamp of the most recent funding stats entry. It calls getStats and then based on the respone it changes the startTimeStamp to the value of the last datapoint in the response+1. 

async function sendRequestLoop() {
    const responseArray = []
    let lastTimeStamp = await getLastTimeStamp();
    let endTimeStamp = lastTimeStamp
    try {
        while (endTimeStamp > startTimeStamp) {
            console.log(`Sending request to endpoint with end timestamp ${endTimeStamp}`)
            const array = await getFundingStats(endTimeStamp);
            endTimeStamp = array[array.length-1][0]-1;
            responseArray.push(...array)
        }
        return responseArray
    }
    catch (err) {
        console.log(err)
    }
}

// saveStats prints the total number of candles returned and saves the array to a JSON file. Depending on the sortingMethod set, the array can be saved Old>New or New>Old.

async function saveStats() {
    try {
        if (sortingMethod === "OldToNew") {
            const array = await sendRequestLoop();
            let arrayReverse = array.reverse()
            console.log(`Success! Script retrieved a total of ${array.length} funding stats data points for ${symbol}`)
            let jsonData = JSON.stringify(arrayReverse)
            fs.writeFile(`FundingStatsJSON-${symbol}.txt`, jsonData, (err) => {if (err) throw err; console.log(`JSON file saved at ./FundingStatsJSON-${symbol}-${sortingMethod}.txt`)})
        } else if (sortingMethod === "NewToOld") {
            const array = await sendRequestLoop();
            console.log(`Success! Script retrieved a total of ${array.length} funding stats data points for ${symbol}`)
            let jsonData = JSON.stringify(array)
            fs.writeFile(`FundingStatsJSON-${symbol}-${sortingMethod}.txt`, jsonData, (err) => {if (err) throw err; console.log(`JSON file saved at ./FundingStatsJSON-${symbol}-${sortingMethod}.txt`)})
        } else {
            console.log("Error: unknown sorting method")
        }
    }
    catch (err) {
        console.log(err)
    }
}

saveStats()