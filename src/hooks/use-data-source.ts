import { useState, useEffect } from 'react';

interface DataSourceConfig {
  type: string;
  connectionString: string;
}

export const useDataSource = (config: DataSourceConfig) => {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!config || !config.connectionString) {
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Simulate data fetching based on source type
        const result = await new Promise<any[]>((resolve, reject) => {
          setTimeout(() => {
            if (config.connectionString.includes('error')) {
              reject('Simulated connection error');
            } else {
              resolve([
                { id: 1, name: 'Sample Data 1', value: 100 },
                { id: 2, name: 'Sample Data 2', value: 200 },
              ]);
            }
          }, 500);
        });
        setData(result);
      } catch (err: any) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  return { data, loading, error };
};
