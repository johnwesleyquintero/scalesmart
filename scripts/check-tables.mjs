// check_tables.mjs
import { getTableSchema } from './src/lib/supabase';

async function checkTables() {
  const tableNames = ['users', 'accounts', 'sessions', 'verification_tokens'];
  for (const tableName of tableNames) {
    try {
      await getTableSchema(tableName);
      console.log(`Table '${tableName}' exists.`);
    } catch (error) {
      console.log(`Table '${tableName}' does not exist or is not accessible.`);
      console.error(`Error fetching '${tableName}': ${error.message || error}`);
    }
  }
}

checkTables();
