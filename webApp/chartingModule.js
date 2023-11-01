import {numberOfChannels} from './websocketModule.js';


export default function setupCharting(dataEmitter) {
    if(numberOfChannels === 5) {
        // Define initial data arrays for the five channels
        let channels = Array.from({ length: 5 }, () => [[], []]);

        // Define the window size (e.g., 3 seconds)
        const windowSize = 1; // showing data in the 3 seconds
        const dataSendingInterval = 1; // 1ms
        const maxDataPoints = windowSize * 1000 / dataSendingInterval;

        // Function to update chart dimensions
        function updateChartDimensions(...plots) {
            const width = window.innerWidth;
            const height = (window.innerHeight * 0.7) / plots.length;
            plots.forEach(plot => plot.setSize({ width, height }));
        }

        // Define uPlot options for each channel
        const colors = ['red', 'blue', 'green', 'purple', 'orange'];
        const createOptions = (index) => ({
            title: `Channel ${index + 1} Data`,
            id: `bioplot${index + 1}`,
            class: "my-chart",
            width: window.innerWidth,
            height: (window.innerHeight * 0.7) / 5,
            series: [
                {},
                {
                    label: `CH${index + 1}`,
                    stroke: colors[index],
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
        });

        // Create containers and initialize uPlot for each channel
        let plots = channels.map((data, index) => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            return new uPlot(createOptions(index), data, container);
        });

        // Update chart dimensions on window resize
        window.addEventListener('resize', () => updateChartDimensions(...plots));

        // Listen to the 'data' event from the WebSocket module
        dataEmitter.on('data', (data) => {
            // Destructure the data object to extract channel values
            const { timestampNs, ch1, ch2, ch3, ch4, ch5 } = data;

            // Convert nanoseconds to seconds for the timestamp
            let timestamp = Number(timestampNs) / 1e9;

            // Update the data arrays for each channel
            // Now directly using the channel values received in the data object
            channels[0][0].push(timestamp);
            channels[0][1].push(ch1);

            channels[1][0].push(timestamp);
            channels[1][1].push(ch2);

            channels[2][0].push(timestamp);
            channels[2][1].push(ch3);

            channels[3][0].push(timestamp);
            channels[3][1].push(ch4);

            channels[4][0].push(timestamp);
            channels[4][1].push(ch5);

            // If we have more data points than the window size, remove the oldest ones
            if (channels[0][0].length > maxDataPoints) {
                channels.forEach(channel => {
                    channel[0].shift(); // Shift timestamps
                    channel[1].shift(); // Shift data points
                });
            }

            // Update the charts and adjust the scales for the sliding effect
            let min = timestamp - windowSize;
            let max = timestamp;
            plots.forEach((plot, index) => {
                plot.setData(channels[index]);
                plot.setScale('x', { min: min, max: max });
            });
        });
    }

    if(numberOfChannels === 2) {
        // Define initial data arrays for the two channels
        let data1 = [
            [], // timestamps
            []  // sensor 1 data
        ];

        let data2 = [
            [], // timestamps
            []  // sensor 2 data
        ];

        // Define the window size (e.g., 10 seconds)
        const windowSize = 1; // how far we go back in seconds
        const intervalRate = 1; // server sends data every 1ms
        const maxDataPoints = windowSize * 1000 / intervalRate;

        // Function to update chart dimensions
        function updateChartDimensions(uplot1, uplot2) {
            const width = window.innerWidth;
            const height = (window.innerHeight * 0.7) / 2; // 35% of the window height for each chart
            uplot1.setSize({ width, height });
            uplot2.setSize({ width, height });
        }

        // Define uPlot options for the first sensor
        const options1 = {
            title: "Channel 1 Data",
            id: "bioplot1",
            class: "my-chart",
            width: window.innerWidth,
            height: (window.innerHeight * 0.7) / 2, // 35% of the window height
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

        // Define uPlot options for the second sensor
        const options2 = {
            title: "Channel 2 Data",
            id: "bioplot2",
            class: "my-chart",
            width: window.innerWidth,
            height: (window.innerHeight * 0.7) / 2, // 35% of the window height
            series: [
                {},
                {
                    label: "IRD",
                    stroke: "blue",
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

        // Create containers for each chart
        const container1 = document.createElement('div');
        const container2 = document.createElement('div');
        document.body.appendChild(container1);
        document.body.appendChild(container2);

        // Initialize uPlot for each sensor
        let uplot1 = new uPlot(options1, data1, container1);
        let uplot2 = new uPlot(options2, data2, container2);

        // Update chart dimensions on window resize
        window.addEventListener('resize', () => updateChartDimensions(uplot1, uplot2));

        // Listen to the 'data' event from the WebSocket module
        dataEmitter.on('data', ({ timestampNs, rd, ird }) => {
            // Convert nanoseconds to seconds for the timestamp
            let timestamp = Number(timestampNs) / 1e9;

            // Update the data arrays for each sensor
            data1[0].push(timestamp);
            data1[1].push(rd);
            data2[0].push(timestamp);
            data2[1].push(ird);

            // If we have more data points than the window size, remove the oldest ones
            if (data1[0].length > maxDataPoints) {
                data1.forEach(channel => channel.shift());
                data2.forEach(channel => channel.shift());
            }

            // Update the charts
            uplot1.setData(data1);
            uplot2.setData(data2);

            // Adjust the scales to create the sliding effect for each chart
            let min = timestamp - windowSize;
            let max = timestamp;
            uplot1.setScale('x', { min: min, max: max });
            uplot2.setScale('x', { min: min, max: max });
        });
    }
};





