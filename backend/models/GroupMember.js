const db = require('../config/database');

class GroupMember {
  constructor(data = {}) {
    this.id = data.id;
    this.group_id = data.group_id;
    this.member_name = data.member_name;
    this.member_number = data.member_number;
    this.status = data.status || 'pending';
    this.joined_at = data.joined_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Additional fields from joins
    this.group_name = data.group_name;
  }

  // Add a single member to a group
  static async create(memberData) {
    try {
      const query = `
        INSERT INTO group_members 
        (group_id, member_name, member_number, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        memberData.group_id,
        memberData.member_name,
        memberData.member_number,
        memberData.status || 'pending'
      ];

      const result = await db.query(query, values);
      return new GroupMember(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Member already exists in this group');
      }
      throw new Error(`Error adding group member: ${error.message}`);
    }
  }

  // Bulk add members to a group
  static async bulkCreate(groupId, membersData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      const errors = [];
      
      for (const member of membersData) {
        try {
          const query = `
            INSERT INTO group_members 
            (group_id, member_name, member_number, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          
          const values = [
            groupId,
            member.member_name,
            member.member_number,
            member.status || 'pending'
          ];

          const result = await client.query(query, values);
          results.push(new GroupMember(result.rows[0]));
        } catch (error) {
          errors.push({
            member: member,
            error: error.message
          });
        }
      }
      
      await client.query('COMMIT');
      
      return {
        successful: results,
        failed: errors,
        summary: {
          total: membersData.length,
          successful: results.length,
          failed: errors.length
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error bulk adding members: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Get all members with filters and pagination
  static async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        group_id = null,
        status = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      let queryParams = [];
      let paramCount = 0;

      // Add group filter
      if (group_id) {
        paramCount++;
        whereClause += ` AND gm.group_id = $${paramCount}`;
        queryParams.push(group_id);
      }

      // Add search filter
      if (search) {
        paramCount++;
        whereClause += ` AND (gm.member_name ILIKE $${paramCount} OR gm.member_number ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Add status filter
      if (status) {
        paramCount++;
        whereClause += ` AND gm.status = $${paramCount}`;
        queryParams.push(status);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Data query
      const dataQuery = `
        SELECT 
          gm.*,
          wg.group_name
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        ${whereClause}
        ORDER BY gm.${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);

      return {
        members: dataResult.rows.map(row => new GroupMember(row)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching group members: ${error.message}`);
    }
  }

  // Get pending members
  static async getPendingMembers(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = "WHERE gm.status = 'pending'";
      let queryParams = [];
      let paramCount = 0;

      // Add search filter
      if (search) {
        paramCount++;
        whereClause += ` AND (gm.member_name ILIKE $${paramCount} OR gm.member_number ILIKE $${paramCount} OR wg.group_name ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Data query
      const dataQuery = `
        SELECT 
          gm.*,
          wg.group_name
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        ${whereClause}
        ORDER BY gm.${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);

      return {
        members: dataResult.rows.map(row => new GroupMember(row)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error fetching pending members: ${error.message}`);
    }
  }

  // Search members across all groups
  static async searchMembers(searchTerm, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        sortBy = 'member_name',
        sortOrder = 'ASC'
      } = options;

      const offset = (page - 1) * limit;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        WHERE gm.member_name ILIKE $1 OR gm.member_number ILIKE $1
      `;
      const countResult = await db.query(countQuery, [`%${searchTerm}%`]);
      const total = parseInt(countResult.rows[0].total);

      // Data query with group details
      const dataQuery = `
        SELECT 
          gm.*,
          wg.group_name,
          STRING_AGG(wg2.group_name, ', ') as all_groups
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        LEFT JOIN group_members gm2 ON gm.member_number = gm2.member_number
        LEFT JOIN whatsapp_groups_extended wg2 ON gm2.group_id = wg2.id
        WHERE gm.member_name ILIKE $1 OR gm.member_number ILIKE $1
        GROUP BY gm.id, gm.group_id, gm.member_name, gm.member_number, gm.status, gm.joined_at, gm.created_at, gm.updated_at, wg.group_name
        ORDER BY gm.${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
      
      const dataResult = await db.query(dataQuery, [`%${searchTerm}%`, limit, offset]);

      return {
        members: dataResult.rows.map(row => ({
          ...new GroupMember(row).toJSON(),
          all_groups: row.all_groups
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error(`Error searching members: ${error.message}`);
    }
  }

  // Find member by ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          gm.*,
          wg.group_name
        FROM group_members gm
        LEFT JOIN whatsapp_groups_extended wg ON gm.group_id = wg.id
        WHERE gm.id = $1
      `;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new GroupMember(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding group member: ${error.message}`);
    }
  }

  // Update member status
  static async updateStatus(id, status) {
    try {
      const query = `
        UPDATE group_members 
        SET status = $1, 
            joined_at = CASE WHEN $2 = 'active' AND joined_at IS NULL THEN CURRENT_TIMESTAMP ELSE joined_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await db.query(query, [status, status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new GroupMember(result.rows[0]);
    } catch (error) {
      throw new Error(`Error updating member status: ${error.message}`);
    }
  }

  // Remove member from group
  static async remove(id) {
    try {
      const query = 'DELETE FROM group_members WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new GroupMember(result.rows[0]);
    } catch (error) {
      throw new Error(`Error removing group member: ${error.message}`);
    }
  }

  // Get member statistics
  static async getStatistics(groupId = null) {
    try {
      let whereClause = '';
      let queryParams = [];
      
      if (groupId) {
        whereClause = 'WHERE group_id = $1';
        queryParams.push(groupId);
      }

      const query = `
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_members,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_members
        FROM group_members
        ${whereClause}
      `;
      
      const result = await db.query(query, queryParams);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting member statistics: ${error.message}`);
    }
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      group_id: this.group_id,
      group_name: this.group_name,
      member_name: this.member_name,
      member_number: this.member_number,
      status: this.status,
      joined_at: this.joined_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = GroupMember; 