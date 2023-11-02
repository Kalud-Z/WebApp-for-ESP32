import { numberOfChannels } from './websocketModule.js';

const intervalRate_TwoChannels = 10; // in ms. The rate at which the server sends the data.
const howManyDataPointPerBatch = 10;  // The server sends 10 datapoints per batch.
const timeFrameOfVisibleData = 5; // in seconds.

export default function setupCharting(dataEmitter) {
    if (numberOfChannels === 2) {
        let dataChannel1 = [
            [], // IDs for the x-axis
            []  // channel1 data
        ];

        let dataChannel2 = [
            [], // IDs for the x-axis (shared with RD)
            []  // channel2 data
        ];

        const maxDataPoints = ((1000 / intervalRate_TwoChannels) * timeFrameOfVisibleData) * howManyDataPointPerBatch;

        const optionsChannel1 = createOptions("Channel 1 Data", "red");
        const optionsChannel2 = createOptions("Channel 2  Data", "blue");

        // Create containers for the charts
        const containerChannel1 = createChartContainer();
        const containerChannel2 = createChartContainer();

        // Initialize uPlot for RD
        let uplotChannel1 = new uPlot(optionsChannel1, dataChannel1, containerChannel1);
        // Initialize uPlot for IRD
        let uplotChannel2 = new uPlot(optionsChannel2, dataChannel2, containerChannel2);

        // Setup charts with proper sizing
        setupChartSize(uplotChannel1, containerChannel1);
        setupChartSize(uplotChannel2, containerChannel2);

        // Listen for new batch data
        dataEmitter.on('dataBatch', (batchData) => {
            // console.log('batchData : ', batchData);

            updateChartData(dataChannel1, batchData.dataPointIDs, batchData.channel1Values, maxDataPoints);
            updateChartData(dataChannel2, batchData.dataPointIDs, batchData.channel2Values, maxDataPoints);

            // Update the charts
            uplotChannel1.setData(dataChannel1);
            uplotChannel2.setData(dataChannel2);
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


// Call this function whenever you add or remove charts
function updateGridRows() {
    const chartCount = document.querySelectorAll('.chart-container').length;
    document.body.style.gridTemplateRows = `repeat(${chartCount}, 1fr)`;
}

