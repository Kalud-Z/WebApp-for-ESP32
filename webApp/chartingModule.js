import { numberOfChannels } from './websocketModule.js';

const intervalRate_TwoChannels = 10; // in ms. The rate at which the server sends the data.
const howManyDataPointPerBatch = 10;  // The server sends 10 datapoints per batch.
const timeFrameOfVisibleData = 5; // in seconds.

export default function setupCharting(dataEmitter) {
    if (numberOfChannels === 2) {
        let dataRD = [
            [], // IDs for the x-axis
            []  // RD data
        ];

        let dataIRD = [
            [], // IDs for the x-axis (shared with RD)
            []  // IRD data
        ];

        const maxDataPoints = ((1000 / intervalRate_TwoChannels) * timeFrameOfVisibleData) * howManyDataPointPerBatch;

        // Define uPlot options for RD and IRD
        const optionsRD = createOptions("Channel 1 RD Data", "red");
        const optionsIRD = createOptions("Channel 1 IRD Data", "blue");

        // Create containers for the charts
        const containerRD = createChartContainer();
        const containerIRD = createChartContainer();

        // Initialize uPlot for RD
        let uplotRD = new uPlot(optionsRD, dataRD, containerRD);
        // Initialize uPlot for IRD
        let uplotIRD = new uPlot(optionsIRD, dataIRD, containerIRD);

        // Setup charts with proper sizing
        setupChartSize(uplotRD, containerRD);
        setupChartSize(uplotIRD, containerIRD);

        // Listen for new batch data
        dataEmitter.on('dataBatch', (batchData) => {
            updateChartData(dataRD, batchData.dataPointIDs, batchData.rdValues, maxDataPoints);
            updateChartData(dataIRD, batchData.dataPointIDs, batchData.irdValues, maxDataPoints);

            // Update the charts
            uplotRD.setData(dataRD);
            uplotIRD.setData(dataIRD);
        });
    }
}


// ##########################  helping functions  ###############################################################
function createOptions(title, strokeColor) {
    return {
        title: title,
        id: title.toLowerCase().replace(/\s+/g, ''),
        class: "my-chart",
        width: 0,
        height: 0,
        series: [
            {
                label: "ID",
                value: (u, value) => `ID: ${value}`
            },
            {
                label: title,
                stroke: strokeColor,
            }
        ],
        axes: [
            {
                stroke: "black",
                grid: { show: true },
                values: (u, ticks) => ticks.map(tick => `ID: ${tick}`) // Custom format for the x-axis labels
            },
            {
                stroke: "black",
                grid: { show: true },
                size : 70,
            }
        ]
    };
}

function createChartContainer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.classList.add('chart-container');
    return container;
}

function setupChartSize(uplot, container) {
    requestAnimationFrame(() => {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        uplot.setSize({ width: containerWidth, height: containerHeight });
    });
}

function updateChartData(dataArray, ids, values, maxDataPoints) {
    dataArray[0].push(...ids);
    dataArray[1].push(...values);
    if (dataArray[0].length > maxDataPoints) {
        dataArray.forEach(channel => channel.splice(0, channel.length - maxDataPoints));
    }
}
