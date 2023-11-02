import { numberOfChannels } from './websocketModule.js';

const intervalRate_TwoChannels = 10; // in ms. The rate at which the server sends the data.
const howManyDataPointPerBatch = 10;  // The server sends 10 datapoints per batch.
const timeFrameOfVisibleData = 5; // in seconds.

export default function setupCharting(dataEmitter) {
    if (numberOfChannels === 2) {
        // Define initial data arrays for the channel
        let data1 = [
            [], // IDs for the x-axis
            []  // Channel 1 data
        ];

        const maxDataPoints = ((1000 / intervalRate_TwoChannels) * timeFrameOfVisibleData) * howManyDataPointPerBatch;

        // Define uPlot options for the sensor
        const options = {
            title: "Channel 1 Data",
            id: "bioplot1",
            class: "my-chart",
            width: window.innerWidth * 0.8,
            height: window.innerHeight * 0.5,
            series: [
                {
                    label: "ID",
                    value: (self, rawValue) => `ID: ${rawValue}` // Formatting the tooltip to show ID
                },
                {
                    label: "RD",
                    stroke: "red",
                }
            ],
            axes: [
                {
                    stroke: "black",
                    grid: { show: true },
                    values: (self, ticks) => ticks.map(rawValue => `ID: ${rawValue}`), // Formatting the axis to show ID
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

        // You do not need to set the scale for the x-axis since we are using IDs
        // Remove the initial scale setting for x-axis

        dataEmitter.on('dataBatch', (batchData) => {
            console.log('this is batchData : ', batchData);
            // Update the data array for the sensor with batch IDs and RD values
            data1[0].push(...batchData.dataPointIDs); // Assuming batchData.ids is the array of IDs
            data1[1].push(...batchData.rdValues);

            // Trim the data array if it's longer than maxDataPoints
            if (data1[0].length > maxDataPoints) {
                console.log('this is maxDataPoints : ', maxDataPoints);
                data1.forEach(channel => channel.splice(0, channel.length - maxDataPoints));
            }

            // Update the chart
            uplot.setData(data1);
        });
    }
};
