const { Client } = require('pg');

// Connect via pooler host for IPv4 support
const connectionString = 'postgresql://postgres.kilomlgjuwffavhhembl:Vamsi%402000030153@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function cleanDb() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database successfully!');

    // Truncate tables with cascades to delete old data
    const query = `
      TRUNCATE TABLE audit_logs, badges, learning_classes, learning_plans, notes, notification_history, otp_tokens, reminder_logs, schedules, study_sessions, uploaded_files, user_achievements, user_settings, users CASCADE;
    `;
    
    await client.query(query);
    console.log('Successfully truncated all tables and cleared old accounts!');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

cleanDb();
