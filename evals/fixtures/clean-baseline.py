import pandas as pd

# Total sales over a column we first confirm is complete (nothing dropped silently).
df = pd.read_csv("sales.csv")
assert df["amount"].notna().all(), "amount column has missing values"

total = df["amount"].sum()
print(f"Total sales across {len(df)} complete records: {total:,.2f}")
