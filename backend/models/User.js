const { query } = require('../config/database');

class User {
  // Create users table if it doesn't exist
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
    `;

    try {
      await query(createTableQuery);
      console.log('✅ Users table created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating users table:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT id, name, email, role, active, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT id, name, email, password, role, active, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { name, email, password, role = 'user' } = userData;
      const result = await query(
        'INSERT INTO users (name, email, password, role, active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, email, role, active, created_at',
        [name, email, password, role, true]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const updateQuery = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING id, name, email, role, active, created_at, updated_at
      `;

      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (soft delete)
  static async softDelete(id) {
    try {
      const result = await query(
        'UPDATE users SET active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error soft deleting user:', error);
      throw error;
    }
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE active = true';
      const queryParams = [limit, offset];
      let paramCount = 3;

      // Add filters
      if (filters.role) {
        whereClause += ` AND role = $${paramCount}`;
        queryParams.push(filters.role);
        paramCount++;
      }

      if (filters.search) {
        whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const selectQuery = `
        SELECT id, name, email, role, active, created_at, updated_at 
        FROM users ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const [countResult, usersResult] = await Promise.all([
        query(countQuery, queryParams.slice(2)),
        query(selectQuery, queryParams)
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        users: usersResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

module.exports = User; 