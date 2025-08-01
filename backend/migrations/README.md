# 🗄️ Database Migrations

This directory contains all database migration files for the Wateen Watify project.

## 📁 **Migration Files**

| File | Description | Status |
|------|-------------|--------|
| `000_create_migrations_table.sql` | Creates migration tracking table | ✅ System |
| `001_create_users_table.sql` | Creates users table with authentication | ⏳ Pending |
| `002_create_whatsapp_groups_table.sql` | Creates WhatsApp groups management | ⏳ Pending |
| `003_create_subscribers_table.sql` | Creates subscribers/contacts table | ⏳ Pending |
| `004_create_messages_table.sql` | Creates message tracking table | ⏳ Pending |
| `005_create_campaigns_table.sql` | Creates broadcast campaigns table | ⏳ Pending |

## 🚀 **Migration Commands**

### **Run Migrations**
```bash
# Run all pending migrations
npm run migrate:run
# or
npm run migrate
```

### **Check Migration Status**
```bash
# Show which migrations are executed/pending
npm run migrate:status
```

### **Rollback Migrations** 🔄
```bash
# Rollback last migration
npm run migrate:rollback

# Rollback specific number of migrations
npm run migrate:rollback --steps=2

# Rollback to specific migration
npm run migrate:rollback --to=001_create_users_table
```

### **Reset Database**
```bash
# ⚠️ WARNING: Drops all tables and data!
npm run migrate:reset
```

## 📋 **Database Schema Overview**

### **Users Table**
- User authentication and management
- Enhanced security features (login attempts, email verification)
- Role-based access control

### **WhatsApp Groups Table**
- Group management and tracking
- Admin assignments and member counts
- Integration with WhatsApp group IDs

### **Subscribers Table**
- Contact management with phone numbers
- Tagging system for categorization
- Opt-in/opt-out tracking

### **Messages Table**
- Complete message history tracking
- Support for all media types
- Delivery status monitoring

### **Campaigns Table**
- Broadcast campaign management
- Scheduling and targeting
- Performance tracking

## 🔧 **Creating New Migrations**

1. **Create a new SQL file** with naming convention:
   ```
   006_descriptive_name.sql
   ```

2. **Add migration header**:
   ```sql
   -- Migration: 006_add_new_feature.sql
   -- Description: Add new feature table
   -- Created: 2025-06-28
   ```

3. **Write SQL commands**:
   ```sql
   CREATE TABLE IF NOT EXISTS new_table (
       id SERIAL PRIMARY KEY,
       -- ... columns
   );
   
   CREATE INDEX IF NOT EXISTS idx_new_table_field ON new_table(field);
   ```

4. **Run the migration**:
   ```bash
   npm run migrate:run
   ```

## 📊 **Migration Features**

### ✅ **What's Included:**
- **Migration Tracking** - Tracks which migrations have been executed
- **Automatic Ordering** - Runs migrations in filename order
- **Idempotent Operations** - Safe to run multiple times
- **Status Reporting** - See which migrations are pending/executed
- **Error Handling** - Proper error reporting and rollback
- **Index Creation** - Performance optimizations included
- **Triggers** - Automatic `updated_at` timestamp updates
- **Rollback System** - Safe rollback to previous states

### 🛡️ **Safety Features:**
- **IF NOT EXISTS** clauses prevent errors
- **CASCADE** handling for foreign keys
- **Transaction safety** for each migration
- **Validation** before execution
- **Rollback files** for each migration

## 🔄 **Rollback System**

### **How Rollbacks Work:**
1. **Rollback Files** - Each migration has a corresponding rollback in `/rollbacks/`
2. **Safe Reversals** - Rollbacks remove tables, indexes, and constraints in proper order
3. **Migration Tracking** - Rollbacks update the migrations table automatically
4. **Dependency Handling** - Foreign key constraints are handled with CASCADE

### **Rollback Files Structure:**
```
backend/migrations/rollbacks/
├── 001_rollback_users_table.sql
├── 002_rollback_whatsapp_groups_table.sql
├── 003_rollback_subscribers_table.sql
├── 004_rollback_messages_table.sql
└── 005_rollback_campaigns_table.sql
```

### **Rollback Examples:**
```bash
# Rollback the last migration
npm run migrate:rollback

# Rollback last 3 migrations
npm run migrate:rollback --steps=3

# Rollback to a specific migration (keeps that migration)
npm run migrate:rollback --to=001_create_users_table
```

## 🔄 **Migration Workflow**

1. **Development**: Create new migration files
2. **Testing**: Run `npm run migrate:status` to check
3. **Execution**: Run `npm run migrate:run`
4. **Verification**: Check database structure
5. **Production**: Deploy and run migrations

## 📝 **Best Practices**

- **Always backup** before running migrations in production
- **Test migrations** in development environment first
- **Use descriptive names** for migration files
- **Add comments** explaining complex operations
- **Keep migrations small** and focused
- **Never modify** existing migration files after they've been run

## 🆘 **Troubleshooting**

### **Migration Fails**
```bash
# Check migration status
npm run migrate:status

# Reset and try again (CAUTION: loses data)
npm run migrate:reset
npm run migrate:run
```

### **Database Connection Issues**
```bash
# Test database connection
npm run db:test

# Check database configuration
npm run db:config
```

### **Permission Issues**
- Ensure PostgreSQL user has CREATE/ALTER privileges
- Check database connection settings in `.env` 