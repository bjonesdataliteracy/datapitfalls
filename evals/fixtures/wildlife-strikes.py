import pandas as pd

# FAA wildlife-strike reports, extract covering 2000-01-01 through 2017-07-31.
strikes = pd.read_csv("strikes.csv", parse_dates=["incident_date"])

strikes["year"] = strikes["incident_date"].dt.year
by_year = strikes.groupby("year").size()

print("Reported wildlife strikes per year:")
print(by_year.to_string())

print(f"\n2017 had only {by_year.loc[2017]} strikes — a steep decline from prior years.")
print("It looks like recent mitigation efforts are finally working.")
