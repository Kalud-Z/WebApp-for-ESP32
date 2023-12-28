import json
from datetime import datetime
import plotly.graph_objs as go
from plotly.offline import plot

def parse_timestamp(ts):
    return datetime.strptime(ts, '%H:%M:%S:%f')

def calculate_differences(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)

    differences = []
    for i in range(1, len(data)):
        t1 = parse_timestamp(data[i - 1]['timestamp'])
        t2 = parse_timestamp(data[i]['timestamp'])
        diff = (t2 - t1).total_seconds() * 1000  # Convert difference to milliseconds
        differences.append(diff)

    return differences

def plot_differences(differences):
    trace = go.Scatter(
        y = differences,
        mode = 'lines+markers',
        name = 'Differences'
    )
    layout = go.Layout(
        title = 'Differences in Timestamps',
        xaxis = dict(title = 'Batch Number'),
        yaxis = dict(title = 'Time Difference (milliseconds)')
    )
    fig = go.Figure(data=[trace], layout=layout)
    plot(fig, filename='timestamp_differences.html')

# Replace 'your_file.json' with the path to your JSON file
file_path = 'allSentBatches_6_channels_20_dp_per_batch.json'
differences = calculate_differences(file_path)
plot_differences(differences)
