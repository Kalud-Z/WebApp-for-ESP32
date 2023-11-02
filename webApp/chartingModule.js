import { numberOfChannels } from './websocketModule.js';

const intervalRate_TwoChannels = 10; // in ms. the rate at which the server sends the data.
const howManyDataPointPerBatch = 10;  //the server sends 10 datapoints per batch.
const timeFrameOfVisibleData = 5; // in seconds.

export default function setupCharting(dataEmitter) {
    if (numberOfChannels === 2) {
        // Define initial data arrays for the single channel
        let data1 = [
            [], // timestamps
            []  // channel 1 data
        ];

        const maxDataPoints = ((1000 / intervalRate_TwoChannels) * timeFrameOfVisibleData) * howManyDataPointPerBatch;

        // Define uPlot options for the sensor
        const options = {
            title: "Channel 1 Data",
            id: "bioplot1",
            class: "my-chart",
            width: window.innerWidth * 1,
            height: window.innerHeight * 0.5, // 70% of the window height
            series: [
                {},
                {
                    label: "RD",
                    stroke: "red",
                }
            ],
            axes: [
                {
                    stroke: "black",
                    grid: { show: true },
                },
                {
                    stroke: "black",
                    grid: { show: true },
                }
            ],
        };

        // Create container for the chart
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Initialize uPlot for the sensor
        let uplot = new uPlot(options, data1, container);

        // Set the initial scale of the x-axis to show the last 'timeFrameOfVisibleData' seconds
        let nowInSeconds = Date.now() / 1000; // Convert 'now' to seconds
        uplot.setScale('x', {
            min: nowInSeconds - timeFrameOfVisibleData,
            max: nowInSeconds
        });

        dataEmitter.on('dataBatch', (batchData) => {
            console.log('this is batchData : ', batchData);
            // Update the data array for the sensor with batch data
            data1[0].push(...batchData.timestamps);
            data1[1].push(...batchData.rdValues);

            // Trim the data array if it's longer than maxDataPoints
            if (data1[0].length > maxDataPoints) {
                console.log('this is maxDataPoints : ', maxDataPoints);
                data1.forEach(channel => channel.splice(0, channel.length - maxDataPoints));
            }

            // Update the chart
            uplot.setData(data1);

            let min = data1[0][0]; // This should represent the oldest timestamp currently displayed
            let max = batchData.timestamps[batchData.timestamps.length - 1]; // This is the newest timestamp

            // Now we need to ensure that we're displaying a window of exactly 'timeFrameOfVisibleData' seconds
            // If we have more data than we need, adjust 'min' accordingly
            if (data1[0].length > maxDataPoints) {
                min = max - timeFrameOfVisibleData; // Display only the last 'timeFrameOfVisibleData' seconds
            }

            uplot.setScale('x', { min: min, max: max });
        });
    }
};
