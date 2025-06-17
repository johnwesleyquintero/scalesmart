interface DataSourceConfig {
  type: string;
  connectionString: string;
}

export const DataConnectorService = {
  async connect(config: DataSourceConfig): Promise<any> {
    // Simulate connection to a data source
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (config.connectionString.includes('error')) {
          reject(new Error('Failed to connect to data source.'));
        } else {
          console.log(
            `Successfully connected to ${config.type} using ${config.connectionString}`,
          );
          resolve({ status: 'connected', message: 'Connection successful' });
        }
      }, 700);
    });
  },

  async fetchData(config: DataSourceConfig, query: string): Promise<any[]> {
    // Simulate fetching data from a connected source
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (query.includes('fail')) {
          reject(new Error('Failed to fetch data.'));
        } else {
          console.log(`Fetching data from ${config.type} with query: ${query}`);
          resolve([
            { id: 1, value: Math.random() * 100 },
            { id: 2, value: Math.random() * 100 },
            { id: 3, value: Math.random() * 100 },
          ]);
        }
      }, 1000);
    });
  },
};
