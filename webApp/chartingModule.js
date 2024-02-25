import { numberOfChannels } from './websocketModule.js';

const sampleRate = 50; // in ms. The rate at which the server sends the data.
const howManyDataPointPerBatch = 50;  // The server sends 10 datapoints per batch.
const timeFrameOfVisibleData = 5; // in seconds.

export default function setupCharting(dataEmitter) {
    let channelsData = [];
    let uplotInstances = [];
    const maxDataPoints = ((1000 / sampleRate) * timeFrameOfVisibleData) * howManyDataPointPerBatch;

    for (let channelIndex = 1; channelIndex <= numberOfChannels; channelIndex++) {
        channelsData.push([
            [], // IDs for the x-axis
            []  // channel data
        ]);

        // console.log('this is channelIndex : ', channelIndex)
        const options = createOptions(`Channel ${channelIndex} Data`, `color-${channelIndex}`);
        const container = createChartContainer();
        const uplot = new uPlot(options, channelsData[channelIndex - 1], container);

        setupChartSize(uplot, container);
        uplotInstances.push(uplot);
    }

    dataEmitter.on('dataBatch', (batchData) => {
        for (let channelIndex = 1; channelIndex <= numberOfChannels; channelIndex++) {
            const channelKey = `channel${channelIndex}Values`;
            updateChartData(channelsData[channelIndex - 1], batchData.dataPointIDs, batchData[channelKey], maxDataPoints);

            uplotInstances[channelIndex - 1].setData(channelsData[channelIndex - 1]);
        }
    });

    updateGridRows();
}


// ##########################  helping functions  ###############################################################
function createOptions(title, colorClassName) {
    const colorValue = getComputedStyle(document.documentElement).getPropertyValue(`--${colorClassName}`);

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
                stroke: colorValue.trim(), // Use the actual color value here
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

