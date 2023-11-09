import os
import json
import matplotlib.pyplot as plt

# Directory where your files are stored- you should place all latency files in the same dir
directory = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Lokale_Entwicklung____WIP___/latency-results'

# List all files in the directory
files = os.listdir(directory)

# Filter for files that contain 'latency' in the name
latency_files = [file for file in files if 'latency' in file]

# Initialize a figure for plotting
plt.figure(figsize=(10, 5))

# Loop through each latency file and plot the data
for file_name in latency_files:
    # Construct the full file path
    file_path = os.path.join(directory, file_name)

    # Read the JSON data from the file
    with open(file_path, 'r') as file:
        data = json.load(file)

    # Extract batch IDs and latencies
    batch_ids = [item['batchID'] for item in data]
    latencies = [item['latency'] for item in data]

    # Plotting the data with a thinner line and no markers
    plt.plot(batch_ids, latencies, linewidth=2.5, label=file_name)  # Thinner line with no markers


# After plotting all files, finalize the plot details
plt.title('Latency per Batch Comparison')  # Title of the plot
plt.xlabel('Batch ID')  # X-axis label
plt.ylabel('Latency (ms)')  # Y-axis label
plt.grid(True)  # Show grid
plt.legend()  # Show legend to identify each line
plt.tight_layout()  # Fit the plot layout

# Display the plot with all the data
plt.show()



