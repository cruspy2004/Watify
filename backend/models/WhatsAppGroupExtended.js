const db = require('../config/database');

class WhatsAppGroupExtended {
  constructor(data = {}) {
    this.id = data.id;
    this.group_name = data.group_name;
    this.description = data.description;
    this.profile_picture = data.profile_picture;
    this.member_count = data.member_count || 0;
    this.status = data.status || 'active';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new WhatsApp group
  static async create(groupData) {
    try {
      const query = `
        INSERT INTO whatsapp_groups_extended 
        (group_name, description, profile_picture, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        groupData.group_name,
        groupData.description || null,
        groupData.profile_picture || null,
        groupData.status || 'active'
      ];

      const result = await db.query(query, values);
      return new WhatsAppGroupExtended(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating WhatsApp group: ${error.message}`);
    }
  }

  // Get all WhatsApp groups with pagination and search
  static async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      let queryParams = [];
      let paramCount = 0;

      // Add search filter
      if (search) {
        paramCount++;
        whereClause += ` AND (group_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Add status filter
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        queryParams.push(status);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM whatsapp_groups_extended
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Data query
      const dataQuery = `
        SELECT *
        FROM whatsapp_groups_extended
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);

      return {
        groups: dataResult.rows.map(row => new WhatsAppGroupExtended(row)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching WhatsApp groups: ${error.message}`);
    }
  }

  // Find group by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM whatsapp_groups_extended WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new WhatsAppGroupExtended(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding WhatsApp group: ${error.message}`);
    }
  }

  // Update group
  static async update(id, updateData) {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      // Add id for WHERE clause
      paramCount++;
      values.push(id);

      const query = `
        UPDATE whatsapp_groups_extended 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new WhatsAppGroupExtended(result.rows[0]);
    } catch (error) {
      throw new Error(`Error updating WhatsApp group: ${error.message}`);
    }
  }

  // Delete group (soft delete by changing status)
  static async delete(id) {
    try {
      const query = `
        UPDATE whatsapp_groups_extended 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new WhatsAppGroupExtended(result.rows[0]);
    } catch (error) {
      throw new Error(`Error deleting WhatsApp group: ${error.message}`);
    }
  }

  // Hard delete group (permanent)
  static async hardDelete(id) {
    try {
      const query = 'DELETE FROM whatsapp_groups_extended WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new WhatsAppGroupExtended(result.rows[0]);
    } catch (error) {
      throw new Error(`Error permanently deleting WhatsApp group: ${error.message}`);
    }
  }

  // Get group statistics
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_groups,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_groups,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_groups,
          SUM(member_count) as total_members,
          AVG(member_count) as avg_members_per_group
        FROM whatsapp_groups_extended
      `;
      
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting group statistics: ${error.message}`);
    }
  }

  // Get groups for dropdown/select options
  static async getGroupOptions() {
    try {
      const query = `
        SELECT id, group_name, member_count, status
        FROM whatsapp_groups_extended
        WHERE status = 'active'
        ORDER BY group_name ASC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting group options: ${error.message}`);
    }
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      group_name: this.group_name,
      description: this.description,
      profile_picture: this.profile_picture,
      member_count: this.member_count,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = WhatsAppGroupExtended; 