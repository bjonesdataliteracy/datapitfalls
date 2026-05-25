import pandas as pd

# World Bank urban-population percentage, one row per country.
df = pd.read_csv("urban.csv")  # columns: country, region, urban_pct

# Roll up to a regional figure.
regional = df.groupby("region")["urban_pct"].mean()

print("Urban population % by region:")
print(regional.round(1).to_string())
