import {numberOfChannels} from './websocketModule.js';

const intervalRate_TwoChannels = 10; // in ms. the rate at which the server sends the data.
const intervalRate_FiveChannels = 10; //in ms. the rate at which the server sends the data.

export default function setupCharting(dataEmitter) {
    if (numberOfChannels === 5) {
        // Define initial data arrays for the five channels
        let data = Array.from({ length: 5 }, () => [
            [], // timestamps
            []  // channel data
        ]);

        // Define the window size
        const windowSize = 5; // how far we go back in seconds
        const maxDataPoints = windowSize * 1000 / intervalRate_FiveChannels;

        // Function to update chart dimensions
        function updateChartDimensions(...charts) {
            const width = window.innerWidth;
            const height = (window.innerHeight * 0.7) / 5; // Divide the window height for each chart
            for (const chart of charts) {
                chart.setSize({ width, height });
            }
        }

        // Define uPlot options for each channel
        const options = [
            {
                title: "Channel 1 Data",
                id: "bioplot1",
                class: "my-chart",
                width: window.innerWidth,
                height: (window.innerHeight * 0.7) / 5, // Divide the window height
                series: [
                    {},
                    {
                        label: "Channel 1",
                        stroke: "red",
                    }
                ],
                axes: [
                    {
                        auto: false,
                        stroke: "black",
                        grid: { show: true },
                    },
                    {
                        stroke: "black",
                        grid: { show: true },
                    }
                ],
            },
            {
                title: "Channel 2 Data",
                id: "bioplot2",
                class: "my-chart",
                width: window.innerWidth,
                height: (window.innerHeight * 0.7) / 5, // Divide the window height
                series: [
                    {},
                    {
                        label: "Channel 2",
                        stroke: "green",
                    }
                ],
                axes: [
                    {
                        auto: false,
                        stroke: "black",
                        grid: { show: true },
                    },
                    {
                        stroke: "black",
                        grid: { show: true },
                    }
                ],
            },
            {
                title: "Channel 3 Data",
                id: "bioplot3",
                class: "my-chart",
                width: window.innerWidth,
                height: (window.innerHeight * 0.7) / 5, // Divide the window height
                series: [
                    {},
                    {
                        label: "Channel 3",
                        stroke: "blue",
                    }
                ],
                axes: [
                    {
                        auto: false,
                        stroke: "black",
                        grid: { show: true },
                    },
                    {
                        stroke: "black",
                        grid: { show: true },
                    }
                ],
            },
            {
                title: "Channel 4 Data",
                id: "bioplot4",
                class: "my-chart",
                width: window.innerWidth,
                height: (window.innerHeight * 0.7) / 5, // Divide the window height
                series: [
                    {},
                    {
                        label: "Channel 4",
                        stroke: "orange",
                    }
                ],
                axes: [
                    {
                        auto: false,
                        stroke: "black",
                        grid: { show: true },
                    },
                    {
                        stroke: "black",
                        grid: { show: true },
                    }
                ],
            },
            {
                title: "Channel 5 Data",
                id: "bioplot5",
                class: "my-chart",
                width: window.innerWidth,
                height: (window.innerHeight * 0.7) / 5, // Divide the window height
                series: [
                    {},
                    {
                        label: "Channel 5",
                        stroke: "purple",
                    }
                ],
                axes: [
                    {
                        auto: false,
                        stroke: "black",
                        grid: { show: true },
                    },
                    {
                        stroke: "black",
                        grid: { show: true },
                    }
                ],
            },
        ];

        // Create containers for each chart
        const containers = options.map((_, index) => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            return container;
        });

        // Initialize uPlot for each channel
        // const uplots = options.map((option, index) => {
        //     const dataChannel = data[index];
        //     const container = containers[index];
        //     const uplot = new uPlot(option, dataChannel, container);
        //
        //     let now = Date.now();
        //     uplot.setScale('x', { min: now - windowSize * 1000, max: now });
        //
        //     return uplot;

        // Initialize uPlot for each channel
        const uplots = options.map((option, index) => {
            const dataChannel = data[index];
            const container = document.getElementById(`bioplot${index + 1}`); // Select the correct container by ID
            const uplot = new uPlot(option, dataChannel, container);

            let now = Date.now();
            uplot.setScale('x', { min: now - windowSize * 1000, max: now });

            return uplot;
        });

        // Update chart dimensions on window resize
        window.addEventListener('resize', () => updateChartDimensions(...uplots));

        dataEmitter.on('dataBatch', (batchData) => {
            // Update the data arrays for each channel with batch data
            for (let i = 0; i < 5; i++) {
                data[i][0].push(...batchData.timestamps);
                data[i][1].push(...batchData.channelValues[i]);
            }

            // Trim the data arrays if they're longer than maxDataPoints
            for (let i = 0; i < 5; i++) {
                if (data[i][0].length > maxDataPoints) {
                    data[i].forEach(channel => channel.splice(0, channel.length - maxDataPoints));
                }
            }

            // Update the charts
            uplots.forEach((uplot, index) => uplot.setData(data[index]));
        });
    }



    if(numberOfChannels === 2) {
        // Define initial data arrays for the two channels
        let data1 = [
            [], // timestamps
            []  // channel 1 data
        ];

        let data2 = [
            [], // timestamps
            []  // channel 2 data
        ];

        // Define the window size
        const windowSize = 60; // how far we go back in seconds
        const maxDataPoints = windowSize * 1000 / intervalRate_TwoChannels;

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
                    auto: false, // Add this linekkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
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

        let now = Date.now();
        uplot1.setScale('x', { min: now - windowSize * 1000, max: now });
        uplot2.setScale('x', { min: now - windowSize * 1000, max: now });

        // Update chart dimensions on window resize
        window.addEventListener('resize', () => updateChartDimensions(uplot1, uplot2));

        dataEmitter.on('dataBatch', (batchData) => {
            // Update the data arrays for each sensor with batch data
            data1[0].push(...batchData.timestamps);
            data1[1].push(...batchData.rdValues);
            data2[0].push(...batchData.timestamps);
            data2[1].push(...batchData.irdValues);

            // Trim the data arrays if they're longer than maxDataPoints
            if (data1[0].length > maxDataPoints) {
                data1.forEach(channel => channel.splice(0, channel.length - maxDataPoints));
                data2.forEach(channel => channel.splice(0, channel.length - maxDataPoints));
            }

            console.log('this is data1 : ', data1)
            console.log('§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§§')

            // Update the charts
            uplot1.setData(data1);
            uplot2.setData(data2);

            // // Assuming the timestamps are sorted, set the scale based on the last timestamp
            // let min = data1[0][data1[0].length - 1] - windowSize;
            // let max = data1[0][data1[0].length - 1];
            // uplot1.setScale('x', { min: min, max: max });
            // uplot2.setScale('x', { min: min, max: max });
        });
    }
};






