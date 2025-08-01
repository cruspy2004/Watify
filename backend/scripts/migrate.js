const fs = require('fs');
const path = require('path');
const { query, pool } = require('../config/database');

class MigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../migrations');
    this.rollbacksDir = path.join(__dirname, '../migrations/rollbacks');
  }

  // Initialize migrations table
  async initMigrationsTable() {
    try {
      console.log('🔄 Initializing migrations table...');
      const migrationTableSQL = fs.readFileSync(
        path.join(this.migrationsDir, '000_create_migrations_table.sql'),
        'utf8'
      );
      await query(migrationTableSQL);
      console.log('✅ Migrations table initialized');
    } catch (error) {
      console.error('❌ Error initializing migrations table:', error);
      throw error;
    }
  }

  // Get all migration files
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql') && file !== '000_create_migrations_table.sql')
        .sort();
      return files;
    } catch (error) {
      console.error('❌ Error reading migration files:', error);
      return [];
    }
  }

  // Get executed migrations
  async getExecutedMigrations() {
    try {
      const result = await query('SELECT migration_name FROM migrations ORDER BY id');
      return result.rows.map(row => row.migration_name);
    } catch (error) {
      // If migrations table doesn't exist, return empty array
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  // Execute a single migration
  async executeMigration(migrationFile) {
    try {
      console.log(`🔄 Executing migration: ${migrationFile}`);
      
      const migrationSQL = fs.readFileSync(
        path.join(this.migrationsDir, migrationFile),
        'utf8'
      );

      // Execute the migration SQL
      await query(migrationSQL);

      // Record the migration
      const migrationName = migrationFile.replace('.sql', '');
      await query(
        'INSERT INTO migrations (migration_name, migration_file, batch) VALUES ($1, $2, $3)',
        [migrationName, migrationFile, 1]
      );

      console.log(`✅ Migration executed: ${migrationFile}`);
    } catch (error) {
      console.error(`❌ Error executing migration ${migrationFile}:`, error);
      throw error;
    }
  }

  // Run all pending migrations
  async runMigrations() {
    try {
      console.log('🚀 Starting database migrations...');
      console.log('=====================================');

      // Initialize migrations table
      await this.initMigrationsTable();

      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file.replace('.sql', ''))
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations. Database is up to date!');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(file => console.log(`   - ${file}`));
      console.log('');

      // Execute pending migrations
      for (const migrationFile of pendingMigrations) {
        await this.executeMigration(migrationFile);
      }

      console.log('');
      console.log('✅ All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Show migration status
  async showStatus() {
    try {
      console.log('📊 Migration Status');
      console.log('==================');

      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      console.log(`\n📁 Total migration files: ${migrationFiles.length}`);
      console.log(`✅ Executed migrations: ${executedMigrations.length}`);
      console.log(`⏳ Pending migrations: ${migrationFiles.length - executedMigrations.length}`);

      console.log('\n📋 Migration Details:');
      migrationFiles.forEach(file => {
        const migrationName = file.replace('.sql', '');
        const status = executedMigrations.includes(migrationName) ? '✅ Executed' : '⏳ Pending';
        console.log(`   ${status} - ${file}`);
      });

      if (executedMigrations.length > 0) {
        console.log('\n📈 Executed Migrations:');
        const result = await query(
          'SELECT migration_name, executed_at FROM migrations ORDER BY id'
        );
        result.rows.forEach(row => {
          console.log(`   ✅ ${row.migration_name} - ${row.executed_at.toISOString()}`);
        });
      }
    } catch (error) {
      console.error('❌ Error showing migration status:', error);
      throw error;
    }
  }

  // Reset database (DROP ALL TABLES)
  async reset() {
    try {
      console.log('🔄 Resetting database...');
      console.log('⚠️  WARNING: This will drop all tables!');

      // Get all tables
      const result = await query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'migrations'
      `);

      if (result.rows.length === 0) {
        console.log('ℹ️  No tables to drop');
        return;
      }

      // Drop all tables except migrations
      for (const row of result.rows) {
        await query(`DROP TABLE IF EXISTS ${row.tablename} CASCADE`);
        console.log(`🗑️  Dropped table: ${row.tablename}`);
      }

      // Clear migration records (except migrations table itself)
      await query('DELETE FROM migrations');
      
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }

  // Get rollback files
  getRollbackFiles() {
    try {
      const files = fs.readdirSync(this.rollbacksDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      return files;
    } catch (error) {
      console.error('❌ Error reading rollback files:', error);
      return [];
    }
  }

  // Execute a single rollback
  async executeRollback(rollbackFile, migrationName) {
    try {
      console.log(`🔄 Rolling back: ${migrationName}`);
      
      const rollbackSQL = fs.readFileSync(
        path.join(this.rollbacksDir, rollbackFile),
        'utf8'
      );

      // Execute the rollback SQL
      await query(rollbackSQL);

      // Remove the migration record
      await query(
        'DELETE FROM migrations WHERE migration_name = $1',
        [migrationName]
      );

      console.log(`✅ Rollback completed: ${migrationName}`);
    } catch (error) {
      console.error(`❌ Error executing rollback ${rollbackFile}:`, error);
      throw error;
    }
  }

  // Rollback last migration
  async rollbackLast() {
    try {
      console.log('🔄 Rolling back last migration...');
      console.log('====================================');

      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      // Get the last executed migration
      const result = await query(
        'SELECT migration_name FROM migrations ORDER BY id DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0].migration_name;
      const rollbackFile = `${lastMigration.replace('_create_', '_rollback_')}.sql`;

      // Check if rollback file exists
      const rollbackPath = path.join(this.rollbacksDir, rollbackFile);
      if (!fs.existsSync(rollbackPath)) {
        console.error(`❌ Rollback file not found: ${rollbackFile}`);
        return;
      }

      await this.executeRollback(rollbackFile, lastMigration);
      console.log('✅ Last migration rolled back successfully!');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Rollback to specific migration
  async rollbackTo(targetMigration) {
    try {
      console.log(`🔄 Rolling back to: ${targetMigration}`);
      console.log('=====================================');

      // Get executed migrations in reverse order
      const result = await query(
        'SELECT migration_name FROM migrations ORDER BY id DESC'
      );

      const migrationsToRollback = [];
      let found = false;

      for (const row of result.rows) {
        if (row.migration_name === targetMigration) {
          found = true;
          break;
        }
        migrationsToRollback.push(row.migration_name);
      }

      if (!found) {
        console.error(`❌ Target migration not found: ${targetMigration}`);
        return;
      }

      if (migrationsToRollback.length === 0) {
        console.log('ℹ️  Already at target migration');
        return;
      }

      console.log(`📋 Rolling back ${migrationsToRollback.length} migration(s):`);
      migrationsToRollback.forEach(migration => console.log(`   - ${migration}`));
      console.log('');

      // Execute rollbacks in order
      for (const migrationName of migrationsToRollback) {
        const rollbackFile = `${migrationName.replace('_create_', '_rollback_')}.sql`;
        const rollbackPath = path.join(this.rollbacksDir, rollbackFile);

        if (!fs.existsSync(rollbackPath)) {
          console.error(`❌ Rollback file not found: ${rollbackFile}`);
          continue;
        }

        await this.executeRollback(rollbackFile, migrationName);
      }

      console.log('✅ Rollback to target migration completed!');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Rollback N number of steps
  async rollbackSteps(steps) {
    try {
      console.log(`🔄 Rolling back ${steps} step(s)...`);
      console.log('====================================');

      const result = await query(
        'SELECT migration_name FROM migrations ORDER BY id DESC LIMIT $1',
        [steps]
      );

      if (result.rows.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return;
      }

      console.log(`📋 Rolling back ${result.rows.length} migration(s):`);
      result.rows.forEach(row => console.log(`   - ${row.migration_name}`));
      console.log('');

      // Execute rollbacks
      for (const row of result.rows) {
        const migrationName = row.migration_name;
        const rollbackFile = `${migrationName.replace('_create_', '_rollback_')}.sql`;
        const rollbackPath = path.join(this.rollbacksDir, rollbackFile);

        if (!fs.existsSync(rollbackPath)) {
          console.error(`❌ Rollback file not found: ${rollbackFile}`);
          continue;
        }

        await this.executeRollback(rollbackFile, migrationName);
      }

      console.log('✅ Rollback steps completed!');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const manager = new MigrationManager();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'run':
      case 'migrate':
        await manager.runMigrations();
        break;
      case 'status':
        await manager.showStatus();
        break;
      case 'reset':
        await manager.reset();
        break;
      case 'rollback':
        if (!arg) {
          await manager.rollbackLast();
        } else if (arg.startsWith('--steps=')) {
          const steps = parseInt(arg.replace('--steps=', ''));
          await manager.rollbackSteps(steps);
        } else if (arg.startsWith('--to=')) {
          const target = arg.replace('--to=', '');
          await manager.rollbackTo(target);
        } else {
          await manager.rollbackTo(arg);
        }
        break;
      default:
        console.log('🔧 Migration Manager Commands:');
        console.log('==============================');
        console.log('📄 Basic Commands:');
        console.log('  npm run migrate:run      - Run pending migrations');
        console.log('  npm run migrate:status   - Show migration status');
        console.log('  npm run migrate:reset    - Reset database (DROP ALL TABLES)');
        console.log('');
        console.log('🔄 Rollback Commands:');
        console.log('  npm run migrate:rollback             - Rollback last migration');
        console.log('  npm run migrate:rollback --steps=2   - Rollback N migrations');
        console.log('  npm run migrate:rollback --to=001_create_users_table - Rollback to specific migration');
        console.log('');
        console.log('💡 Examples:');
        console.log('  npm run migrate:run');
        console.log('  npm run migrate:rollback');
        console.log('  npm run migrate:rollback --steps=3');
        console.log('  npm run migrate:rollback --to=001_create_users_table');
    }
  } catch (error) {
    console.error('❌ Migration command failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationManager; 