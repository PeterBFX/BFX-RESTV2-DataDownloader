//Candles: https://docs.bitfinex.com/reference#rest-public-candles

"use strict"

//Dependencies

const fetch = require('node-fetch')
const url = 'https://api-pub.bitfinex.com/v2/'
const fs = require('fs')

//Settings

const symbol = 'fUSD' // Change based on the symbol for which you would like to retrieve data
const timeFrame = '1h' // Change based on the TimeFrame of the candles you would like to retrieve (1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M)
const period = 'a30:p2:p30' // Change based on the desired funding candle period or candle aggregation. For example, to retrieve only candles for funding offers with a period of 2, change this to 'p2'. To retrieve an aggregate of candles ranging from p2 to p10, change this to 'a10:p2:p10'.
let sortingMethod = "NewToOld" // Options: "NewToOld" or "OldToNew"

//End Settings

const pathParams = `candles/trade:${timeFrame}:${symbol}:${period}/hist`
const queryParams = 'sort=1&limit=10000' 

let i = 0;

//Functions

// getLastTimeStamp returns the timestamp of the most recent candle

async function getLastTimeStamp() {
    try {
        const req = await fetch(`${url}/${pathParams}?limit=1&sort=-1`)
        const response = await req.json()
        console.log(`End timestamp: ${response[0][0]}`)
        return(response[0][0])
    }
    catch (err) {
        console.log(err)
    }
}

// getStartTimeStamp returns the timestamp of the first ever candle

async function getStartTimeStamp() {
    try {
        const req = await fetch(`${url}/${pathParams}?limit=1&sort=1`)
        const response = await req.json()
        console.log(`Start timestamp: ${response[0][0]}`)
        return(JSON.stringify(response[0][0]))
    }
    catch (err) {
        console.log(err)
    }
}

//getCandles calls the endpoint using a specific timestamp and the settings above. For 1m candles, a delay is added to avoid rate limits. The function counts and prints the number of calls made and also prints the number of candles returned by a call to the console.

async function getCandles(ts) {
    if (timeFrame === '1m') {
        try {
            const req = await fetch(`${url}/${pathParams}?${queryParams}&start=${ts}`)
            const response = await req.json()
            await new Promise(r => setTimeout(r, 500));
            i++
            console.log(`Completed call ${i} which returned ${response.length} candles`)
            return (response)
        }
        catch (err) {
            console.log(err)
        }
    } else {
        try {
            const req = await fetch(`${url}/${pathParams}?${queryParams}&start=${ts}`)
            const response = await req.json()
            i++
            console.log(`Completed call ${i} which returned ${response.length} candles`)
            return (response)
        }
        catch (err) {
            console.log(err)
        }
    }
}

// sendRequestLoop checks if the startTimeStamp is smaller than the timestamp of the most recent candle. It calls getCandles and then based on the respone it changes the startTimeStamp to the value of the last candle in the response+1. 

async function sendRequestLoop() {
    const responseArray = []
    let startTimeStamp = await getStartTimeStamp();
    let lastTimeStamp = await getLastTimeStamp();
    try {
        while (startTimeStamp < lastTimeStamp) {
            console.log(`Sending request to endpoint with start timestamp ${startTimeStamp}`)
            const array = await getCandles(startTimeStamp);
            startTimeStamp = array[array.length-1][0]+1;
            responseArray.push(...array)
        }
        return responseArray
    }
    catch (err) {
        console.log(err)
    }
}

// saveCandles prints the total number of candles returned and saves the array to a JSON file as well as a CSV file.

async function saveCandles() {
    try {
        if (sortingMethod === "OldToNew") {
            const array = await sendRequestLoop();
            console.log(`Success! Script retrieved a total of ${array.length} candles for ${symbol} with a timeframe of: ${timeFrame} and period: ${period}`)
            let jsonData = JSON.stringify(array)
            fs.writeFile(`CandleLogJSON-${symbol}-${timeFrame}-${sortingMethod}.txt`, jsonData, (err) => {if (err) throw err; console.log(`JSON file saved at ./CandleLogJSON-${symbol}-${timeFrame}-${sortingMethod}.txt`)})
        } else if (sortingMethod === "NewToOld") {
            const array = await sendRequestLoop();
            let arrayReverse = array.reverse()
            console.log(`Success! Script retrieved a total of ${array.length} candles for ${symbol} with a timeframe of: ${timeFrame} and period: ${period}`)
            let jsonData = JSON.stringify(arrayReverse)
            fs.writeFile(`CandleLogJSON-${symbol}-${timeFrame}-${sortingMethod}.txt`, jsonData, (err) => {if (err) throw err; console.log(`JSON file saved at ./CandleLogJSON-${symbol}-${timeFrame}-${sortingMethod}.txt`)})
        } else {
            console.log("Error: unknown sorting method")
        }
    }
    catch (err) {
        console.log(err)
    }
}

saveCandles()






