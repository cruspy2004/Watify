const { query } = require('../config/database');

class WhatsAppGroup {
  // Find group by ID
  static async findById(id) {
    try {
      const result = await query(
        `SELECT wg.*, u.name as admin_name, uc.name as created_by_name
         FROM whatsapp_groups wg
         LEFT JOIN users u ON wg.admin_user_id = u.id
         LEFT JOIN users uc ON wg.created_by = uc.id
         WHERE wg.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding group by ID:', error);
      throw error;
    }
  }

  // Find group by WhatsApp group ID
  static async findByGroupId(groupId) {
    try {
      const result = await query(
        'SELECT * FROM whatsapp_groups WHERE group_id = $1',
        [groupId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding group by group ID:', error);
      throw error;
    }
  }

  // Create new group
  static async create(groupData) {
    try {
      const { 
        name, 
        description, 
        group_id, 
        invite_link, 
        admin_user_id, 
        member_count = 0, 
        max_members = 256, 
        created_by 
      } = groupData;

      const result = await query(
        `INSERT INTO whatsapp_groups 
         (name, description, group_id, invite_link, admin_user_id, member_count, max_members, created_by, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
         RETURNING *`,
        [name, description, group_id, invite_link, admin_user_id, member_count, max_members, created_by]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  // Update group
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id') {
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
        UPDATE whatsapp_groups 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  // Delete group
  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM whatsapp_groups WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // Soft delete (deactivate)
  static async deactivate(id) {
    try {
      const result = await query(
        'UPDATE whatsapp_groups SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deactivating group:', error);
      throw error;
    }
  }

  // Get all groups with pagination and filters
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [limit, offset];
      let paramCount = 3;

      // Add filters
      if (filters.is_active !== undefined) {
        whereClause += ` AND wg.is_active = $${paramCount}`;
        queryParams.push(filters.is_active);
        paramCount++;
      }

      if (filters.admin_user_id) {
        whereClause += ` AND wg.admin_user_id = $${paramCount}`;
        queryParams.push(filters.admin_user_id);
        paramCount++;
      }

      if (filters.search) {
        whereClause += ` AND (wg.name ILIKE $${paramCount} OR wg.description ILIKE $${paramCount})`;
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      const countQuery = `
        SELECT COUNT(*) 
        FROM whatsapp_groups wg
        ${whereClause}
      `;

      const selectQuery = `
        SELECT wg.*, u.name as admin_name, uc.name as created_by_name
        FROM whatsapp_groups wg
        LEFT JOIN users u ON wg.admin_user_id = u.id
        LEFT JOIN users uc ON wg.created_by = uc.id
        ${whereClause} 
        ORDER BY wg.created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const [countResult, groupsResult] = await Promise.all([
        query(countQuery, queryParams.slice(2)),
        query(selectQuery, queryParams)
      ]);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        groups: groupsResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalGroups: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all groups:', error);
      throw error;
    }
  }

  // Get groups by user (admin or creator)
  static async getByUser(userId) {
    try {
      const result = await query(
        `SELECT wg.*, u.name as admin_name
         FROM whatsapp_groups wg
         LEFT JOIN users u ON wg.admin_user_id = u.id
         WHERE wg.admin_user_id = $1 OR wg.created_by = $1
         ORDER BY wg.created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting groups by user:', error);
      throw error;
    }
  }

  // Update member count
  static async updateMemberCount(id, memberCount) {
    try {
      const result = await query(
        'UPDATE whatsapp_groups SET member_count = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [memberCount, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating member count:', error);
      throw error;
    }
  }

  // Get group statistics
  static async getStatistics() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_groups,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_groups,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_groups,
          AVG(member_count) as avg_member_count,
          SUM(member_count) as total_members
        FROM whatsapp_groups
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting group statistics:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppGroup; 