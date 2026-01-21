const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting AgentAuth database migration...');
  
  // Read database configuration
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('💡 Create a .env file with: DATABASE_URL=postgresql://user:password@localhost:5432/agent_auth');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing schema...');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt + ';');
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Skip duplicate table/extension errors
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 Database migration completed successfully!');
    
    // Test the connection and show some info
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM agents) as agents_count,
        (SELECT COUNT(*) FROM permission_grants) as grants_count
    `);
    
    console.log('\n📊 Database Status:');
    console.log(`   Users: ${result.rows[0].users_count}`);
    console.log(`   Agents: ${result.rows[0].agents_count}`);
    console.log(`   Permission Grants: ${result.rows[0].grants_count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };