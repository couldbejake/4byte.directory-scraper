const axios = require('axios');
const fs = require('fs').promises;

const SLEEP_TIME_MS = 50;  // Set the delay duration at the top of the file

const url = 'https://www.4byte.directory/api/v1/signatures/?format=json';
const output = [];
let totalFetched = 0;  
const startTime = Date.now();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds - (hrs * 3600)) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
};

const calculateEstimatedTimeLeft = (totalCount, currentlyFetched, elapsedTime) => {
    const averageTimePerSignature = elapsedTime / currentlyFetched;
    const remainingSignatures = totalCount - currentlyFetched;
    return averageTimePerSignature * remainingSignatures;
};

const writeToFile = async (data) => {
    try {
        await fs.writeFile('signatures-output.json', JSON.stringify(data, null, 4));
        console.log('Data written to signatures-output.json successfully!');
    } catch (error) {
        console.error('Error writing to file:', error);
    }
};

const getSignatures = async (url) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const { data } = response;
        const { results, count, next } = data;

        results.forEach(result => {
            result.bytes_signature = Buffer.from(result.bytes_signature).toString('hex');
        });

        output.push(...results);

        totalFetched += results.length;

        const elapsedTime = (Date.now() - startTime) / 1000;
        const estimatedTimeLeftInSeconds = calculateEstimatedTimeLeft(count, totalFetched, elapsedTime);

        console.log(`Fetched ${totalFetched}/${count}. Elapsed time: ${formatTime(elapsedTime)}. Estimated time left: ${formatTime(estimatedTimeLeftInSeconds)}.`);

        if (next) {
            await sleep(SLEEP_TIME_MS);  // Use the sleep time defined at the top
            await getSignatures(next);
        } else {
            await writeToFile(output);
        }
    } catch (error) {
        console.error(error);
    }
};

getSignatures(url);
