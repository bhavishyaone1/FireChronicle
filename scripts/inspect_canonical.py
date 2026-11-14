import pandas as pd
df = pd.read_parquet('data/processed/canonical_observations.parquet')
print('Total Rows:', len(df))
print('Columns:', df.columns.tolist())
print('\nSensor Breakdown:\n', df['sensor'].value_counts())
print('\nDate Range:\n', df['acq_date_utc'].min(), 'to', df['acq_date_utc'].max())
print('\nTop 5 States:\n', df['india_state'].value_counts().head(5))
