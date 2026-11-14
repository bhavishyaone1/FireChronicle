import pandas as pd
df = pd.read_parquet('data/processed/candidate_correspondences.parquet')
print('Total Candidate Correspondences:', len(df))
print('Columns:', df.columns.tolist())
print('\nMean Spatial Separation:', round(df['spatial_separation_m'].mean(), 1), 'm')
print('Mean Temporal Delta:', round(df['temporal_delta_sec'].mean() / 60.0, 1), 'min')
print('Mean Match Score:', round(df['match_score'].mean(), 3))
print('\nSample Pair:\n', df.iloc[0].to_dict())
