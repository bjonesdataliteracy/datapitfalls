import pandas as pd

quakes = pd.read_csv("quakes.csv")  # column: mag (Richter magnitude)

avg_mag = quakes["mag"].mean()
print(f"Average earthquake magnitude: {avg_mag:.2f}")
print("This is the typical energy release across all recorded events.")
