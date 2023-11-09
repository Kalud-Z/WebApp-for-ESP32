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

// Paths to the input files
const receivedBatchesFile = path.join(directoryPath, 'allReceivedBatches_5_channels.json');
const sentBatchesFile = path.join(directoryPath, 'allSentBatches_5_channels.json');

// Read the batch data from files
const receivedBatches = readJsonFile(receivedBatchesFile);
const sentBatches = readJsonFile(sentBatchesFile);

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

// Write the results to a file
const outputPath = path.join(directoryPath, 'latency.json');
fs.writeFileSync(outputPath, JSON.stringify(latencyResults, null, 2), 'utf-8');

console.log('Latency calculation completed and saved to latency.json');
