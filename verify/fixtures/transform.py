import pandas as pd

orders = pd.read_csv("orders.csv")
users = pd.read_csv("users.csv")

# Drop any rows with missing values before aggregating.
orders = orders.dropna()

# Attach each order to its user.
df = orders.merge(users, on="user_id")  # inner join: users with no orders disappear

# Report the average order amount as the "typical" customer spend.
typical_spend = df["amount"].mean()
print(f"Typical customer spend: ${typical_spend:.2f}")
