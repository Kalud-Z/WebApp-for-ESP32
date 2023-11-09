import * as fs from 'fs';
import * as path from 'path';

interface Batch {
    batchID: number;
    timestamp: string;
}

interface Latency {
    batchID: number;
    latency: number;
}

// Convert a timestamp to milliseconds
const timestampToMs = (timestamp: string): number => {
    const [hours, minutes, seconds, milliseconds] = timestamp.split(':').map(Number);
    return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
};

// Calculate latency between two timestamps
const calculateLatency = (sent: string, received: string): number => {
    return timestampToMs(received) - timestampToMs(sent);
};

// Read JSON file and parse it
const readJsonFile = (filePath: string): Batch[] => {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
};

// The directory containing your files
const directoryPath = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Lokale_Entwicklung____WIP___/latency-results';

// Function to find files by pattern
const findFilesByPattern = (dir: string, pattern: RegExp): string[] => {
    const files = fs.readdirSync(dir);
    return files.filter(file => pattern.test(file)).map(file => path.join(dir, file));
};

// Find the 'Received' and 'Sent' files
const receivedFiles = findFilesByPattern(directoryPath, /Received/);
const sentFiles = findFilesByPattern(directoryPath, /Sent/);

if (receivedFiles.length !== 1 || sentFiles.length !== 1) {
    throw new Error('There should be exactly one "Received" file and one "Sent" file.');
}

// Read the batch data from files
const receivedBatches = readJsonFile(receivedFiles[0]);
const sentBatches = readJsonFile(sentFiles[0]);

console.log(`Total number of received batches: ${receivedBatches.length}`);
console.log(`Total number of sent batches: ${sentBatches.length}`);

// Assuming both files have the same number of batch entries and are in the same order
const latencyResults: Latency[] = receivedBatches.map((receivedBatch) => {
    const sentBatch = sentBatches.find((batch) => batch.batchID === receivedBatch.batchID);
    if (!sentBatch) {
        throw new Error(`Sent batch not found for batchID ${receivedBatch.batchID}`);
    }

    const latency = calculateLatency(sentBatch.timestamp, receivedBatch.timestamp);

    return {
        batchID: receivedBatch.batchID,
        latency: latency
    };
});


const extractDynamicPart = (filename: string): string => {
    const match = filename.match(/all(?:Received|Sent)Batches(_\d+_channels_\d+_dp_per_batch)/);
    if (!match) {
        throw new Error(`Filename ${filename} does not match the expected pattern.`);
    }
    return match[1]; // Returns the captured group from the regex
};


// const extractDynamicPart = (filename: string): string => {
//     const match = filename.match(/all(?:Received|Sent)Batches(_\d+_channels_\d+_dp_per_batch)/);
//     if (!match) {
//         throw new Error(`Filename ${filename} does not match the expected pattern.`);
//     }
//     return match[1]; // Returns the captured group from the regex
// };

const dynamicPart = extractDynamicPart(receivedFiles[0]);

// Write the results to a file
// const outputPath = path.join(directoryPath, 'latency.json');
const outputPath = path.join(directoryPath, `latency${dynamicPart}.json`);
fs.writeFileSync(outputPath, JSON.stringify(latencyResults, null, 2), 'utf-8');

console.log('Latency calculation completed and saved to latency.json');

// ##################################################### HELPING FUNCTIONS ########################################################
