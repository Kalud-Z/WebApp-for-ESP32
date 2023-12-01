##########   USING PLOTLY   #####################################################

import plotly.graph_objects as go
import json
import os

directory = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Entwicklung-auf-ESP32__WIP__/__Testing__/latency-results'

files = os.listdir(directory)
latency_files = [file for file in files if 'latency' in file and 'channels' in file]

fig = go.Figure()

# Loop through each latency file and add a trace to the plot
for file_name in latency_files:
    file_path = os.path.join(directory, file_name)

    with open(file_path, 'r') as file:
        data = json.load(file)

    batch_ids = [item['batchID'] for item in data]
    latencies = [item['latency'] for item in data]

    # Add a trace for each file
    fig.add_trace(go.Scatter(x=batch_ids, y=latencies, mode='lines+markers', name=file_name))

fig.update_layout(
    title='Latency per Batch Comparison',
    xaxis_title='Batch ID',
    yaxis_title='Latency (ms)',
    legend_title='File Names'
)


fig.write_html("/home/kalud/latency_plot.html")

fig.show()
