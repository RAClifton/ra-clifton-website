const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration(file, name) {
  console.log(`\n📝 Running: ${name}`);
  const content = fs.readFileSync(path.join(__dirname, `../${file}`), 'utf-8');
  try {
    // Split by semicolon and execute each statement
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      await sql.query(statement);
    }
    console.log(`✅ ${name} applied successfully`);
  } catch (err) {
    console.error(`❌ Error in ${name}:`, err.message);
    throw err;
  }
}

async function main() {
  try {
    console.log('\n🚀 Starting database migrations...\n');

    await runMigration('db/005_insights_schema.sql', '005: Insights Schema');
    await runMigration('db/006_insights_audit.sql', '006: Insights Audit');

    console.log('\n📊 Verifying tables...');
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('insights', 'insights_audit')
      ORDER BY table_name
    `;

    if (tables.length === 2) {
      console.log('\n✅ All migrations completed! Tables created:');
      tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
      process.exit(0);
    } else {
      console.error('\n❌ Not all tables were created');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
