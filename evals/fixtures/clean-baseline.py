import pandas as pd

# Count rows per category over the full, fixed category set and report shares.
df = pd.read_csv("sales.csv")

categories = ["A", "B", "C", "D"]
counts = df["category"].value_counts().reindex(categories, fill_value=0)
total = int(counts.sum())

print(f"Total records: {total}")
for category in categories:
    n = int(counts[category])
    share = n / total if total else 0.0
    print(f"  {category}: {n} ({share:.1%})")
