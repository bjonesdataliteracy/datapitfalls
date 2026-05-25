import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("events.csv")
features = ["latitude", "longitude", "depth_km", "mag"]
X = StandardScaler().fit_transform(df[features])

# k chosen by glancing at the elbow plot.
km = KMeans(n_clusters=5, random_state=42, n_init=10).fit(X)
df["cluster"] = km.labels_

CLUSTER_NAMES = {
    0: "Deep Equatorial",
    1: "Western Pacific Shallow",
    2: "Northern Continental",
    3: "Southern Pacific",
    4: "High-Magnitude Indian Ocean",
}
df["zone"] = df["cluster"].map(CLUSTER_NAMES)

print("Earthquake zones discovered by clustering:")
print(df.groupby("zone")[features].mean().round(2))
