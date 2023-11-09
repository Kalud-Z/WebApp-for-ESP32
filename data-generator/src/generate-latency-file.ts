import fs from 'fs';
import path from 'path';

interface Batch {
    batchID: number;
    timestamp: string;
}

interface LatencyResult {
    batchID: number;
    latency: string; // in milliseconds as a string
}

// Specify the directory path
const dirPath = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Lokale_Entwicklung____WIP___/latency-results';

// Read the directory and filter out the JSON files
const jsonFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));

// Find the matching pair of files
const receivedPattern = /allReceivedBatches_(\d+)_channels\.json/;
const sentPattern = /allSentBatches_(\d+)_channels\.json/;

// Initialize empty arrays for the batch data
let receivedBatches: Batch[] = [];
let sentBatches: Batch[] = [];

// Function to read JSON data from a file
const readJsonData = (filePath: string): Batch[] => {
    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(rawData) as Batch[];
    } catch (error) {
        console.error(`Error reading file ${filePath}: `, error);
        process.exit(1);
    }
};

// Iterate over the files and read their content
jsonFiles.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (receivedPattern.test(file)) {
        receivedBatches = readJsonData(filePath);
    } else if (sentPattern.test(file)) {
        sentBatches = readJsonData(filePath);
    }
});

// Check if both arrays have been populated
if (receivedBatches.length === 0 || sentBatches.length === 0) {
    console.error('Both sent and received batch files must be present.');
    process.exit(1);
}

// Calculate latency
const calculateLatency = (sent: Batch[], received: Batch[]): LatencyResult[] => {
    const latencyResults: LatencyResult[] = [];
    const receivedBatchIDs = new Set(received.map(batch => batch.batchID));
    const sentBatchIDs = new Set(sent.map(batch => batch.batchID));

    // Iterate over sent batches to find corresponding received batch and calculate latency
    sent.forEach(batch => {
        if (!receivedBatchIDs.has(batch.batchID)) {
            console.log(`BatchID ${batch.batchID} found in sent batches but not in received batches.`);
        } else {
            const receivedBatch = received.find(r => r.batchID === batch.batchID);
            // Ensure that receivedBatch is not undefined before proceeding
            if (receivedBatch) {
                const latencyMs = new Date(receivedBatch.timestamp).getTime() - new Date(batch.timestamp).getTime();
                latencyResults.push({
                    batchID: batch.batchID,
                    latency: latencyMs.toString() // The latency is kept as a string according to the user's initial request
                });
            }
        }
    });

    // Iterate over received batches to log those not present in sent batches
    received.forEach(batch => {
        if (!sentBatchIDs.has(batch.batchID)) {
            console.log(`BatchID ${batch.batchID} found in received batches but not in sent batches.`);
        }
    });

    return latencyResults;
};


// Calculate the latency and write the results to a file
const latencyResults = calculateLatency(sentBatches, receivedBatches);
const outputPath = path.join(dirPath, 'latency.json');
fs.writeFileSync(outputPath, JSON.stringify(latencyResults, null, 2), 'utf-8');
console.log(`Latency results written to ${outputPath}`);
