import os
import json
import matplotlib.pyplot as plt

directory = '/home/kalud/Desktop/KZ/Synced/Studium-stuff/WS-2023___CURRENT___/__Bachelor_Arbeit__/Benno-Dömer__MAIN/Einarbeitung/__Dev-Board__WIP/docs/__Lokale_Entwicklung____WIP___/latency-results'

files = os.listdir(directory)

latency_files = [file for file in files if 'latency' in file and 'channels' in file]

plt.figure(figsize=(10, 5))

# Loop through each latency file and plot the data
for file_name in latency_files:
    file_path = os.path.join(directory, file_name)

    with open(file_path, 'r') as file:
        data = json.load(file)

    batch_ids = [item['batchID'] for item in data]
    latencies = [item['latency'] for item in data]

    #plt.plot(batch_ids, latencies, linewidth=1.5, label=file_name)  # Add label for legend
    plt.plot(batch_ids, latencies, linewidth=0.5, label=file_name, marker='o', markersize=3)  # Adjust markersize as needed

    # Add text at the end of each curve
    end_x = batch_ids[-1]
    end_y = latencies[-1]
    #plt.text(end_x, end_y, file_name, fontsize=9, verticalalignment='bottom') #show file name next to each curve

plt.title('Latency per Batch Comparison')
plt.xlabel('Batch ID')
plt.ylabel('Latency (ms)')
plt.grid(True)
#plt.legend(loc='upper left')  # Position the legend in the top left corner

# Place the legend outside the plot
plt.legend(loc='upper left', bbox_to_anchor=(1, 1))

plt.tight_layout(rect=[0, 0, 1.1, 1])  # Adjust the rect parameter as needed

plt.show()
