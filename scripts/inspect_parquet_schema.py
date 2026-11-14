import duckdb

c = duckdb.connect()
df = c.execute("DESCRIBE SELECT * FROM 'data/processed/canonical_observations.parquet'").df()
print("Parquet columns and types:")
for idx, row in df.iterrows():
    print(f"  {row['column_name']}: {row['column_type']}")
