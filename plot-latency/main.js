// Function to read the JSON file and parse it
function readDataFromFile(filePath) {
    return fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Could not read the file:', error);
        });
}

// Prepare the data for uPlot
function prepareDataForPlotting(rawData) {
    const xValues = []; // batchID will be our x-axis
    const yValues = []; // latency will be our y-axis

    rawData.forEach(item => {
        xValues.push(item.batchID);
        yValues.push(item.latency);
    });

    return [xValues, yValues];
}

// Function to plot the data
function plotData(data) {
    const options = {
        width: 800,
        height: 600,
        series: [
            {},
            {
                stroke: "red",
            }
        ],
    };

    // Assuming you have a div with the id of 'chart' in your HTML
    const uplotChart = new uPlot(options, data, document.getElementById('chart'));
}


async function main() {
    try {
        // If you're running a local server, this can be a relative path.
        const filePath = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Lokale_Entwicklung____WIP___/latency-results/latency.json'; // Use the relative path from your server's root
        const rawData = await readDataFromFile(filePath);
        console.log('this is rawData : ', rawData);
        const dataForPlotting = prepareDataForPlotting(rawData);
        // plotData(dataForPlotting);
    } catch (error) {
        console.error('Error:', error);
    }
}

// ################################################################################################################
main();
