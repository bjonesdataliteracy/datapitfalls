import pandas as pd
import matplotlib.pyplot as plt

# One row per known Edgar Allan Poe work, with the year it was written.
works = pd.read_csv("poe_works.csv")

# Count works per year and plot the timeline.
per_year = works.groupby("year").size()
per_year.plot(kind="line", title="Poe works per year")
plt.show()

fewest_year = per_year.idxmin()
print(f"Poe's least productive year was {fewest_year} with {per_year.min()} work(s).")
