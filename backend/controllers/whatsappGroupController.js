const WhatsAppGroupExtended = require('../models/WhatsAppGroupExtended');
const GroupMember = require('../models/GroupMember');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'members-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

class WhatsAppGroupController {
  // Create a new WhatsApp group
  static async createGroup(req, res) {
    try {
      const { group_name, description, status } = req.body;

      // Validation
      if (!group_name) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required'
        });
      }

      const groupData = {
        group_name: group_name.trim(),
        description: description?.trim() || null,
        status: status || 'active'
      };

      const newGroup = await WhatsAppGroupExtended.create(groupData);

      res.status(201).json({
        success: true,
        message: 'WhatsApp group created successfully',
        data: newGroup.toJSON()
      });
    } catch (error) {
      console.error('Error creating WhatsApp group:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get all WhatsApp groups with pagination and search
  static async getAllGroups(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        sortBy,
        sortOrder
      };

      const result = await WhatsAppGroupExtended.findAll(options);

      res.json({
        success: true,
        message: 'Groups fetched successfully',
        data: result.groups.map(group => group.toJSON()),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get group by ID
  static async getGroupById(req, res) {
    try {
      const { id } = req.params;

      const group = await WhatsAppGroupExtended.findById(id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      res.json({
        success: true,
        message: 'Group fetched successfully',
        data: group.toJSON()
      });
    } catch (error) {
      console.error('Error fetching WhatsApp group:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Update WhatsApp group
  static async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove undefined and null values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      const updatedGroup = await WhatsAppGroupExtended.update(id, updateData);

      if (!updatedGroup) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      res.json({
        success: true,
        message: 'Group updated successfully',
        data: updatedGroup.toJSON()
      });
    } catch (error) {
      console.error('Error updating WhatsApp group:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Delete WhatsApp group (soft delete)
  static async deleteGroup(req, res) {
    try {
      const { id } = req.params;

      const deletedGroup = await WhatsAppGroupExtended.delete(id);

      if (!deletedGroup) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      res.json({
        success: true,
        message: 'Group deleted successfully',
        data: deletedGroup.toJSON()
      });
    } catch (error) {
      console.error('Error deleting WhatsApp group:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get group options for dropdowns
  static async getGroupOptions(req, res) {
    try {
      const options = await WhatsAppGroupExtended.getGroupOptions();

      res.json({
        success: true,
        message: 'Group options fetched successfully',
        data: options
      });
    } catch (error) {
      console.error('Error fetching group options:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Add member manually
  static async addMember(req, res) {
    try {
      const { group_id, member_name, member_number, status } = req.body;

      // Validation
      if (!group_id || !member_name || !member_number) {
        return res.status(400).json({
          success: false,
          message: 'Group ID, member name, and member number are required'
        });
      }

      const memberData = {
        group_id,
        member_name: member_name.trim(),
        member_number: member_number.trim(),
        status: status || 'pending'
      };

      const newMember = await GroupMember.create(memberData);

      res.status(201).json({
        success: true,
        message: 'Member added successfully',
        data: newMember.toJSON()
      });
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Upload Excel file for bulk member import
  static uploadExcel = upload.single('excel_file');

  static async importMembersFromExcel(req, res) {
    try {
      const { group_id } = req.body;
      
      if (!group_id) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is required'
        });
      }

      // Verify group exists
      const group = await WhatsAppGroupExtended.findById(group_id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // Read Excel file
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      // Validate and format data
      const membersData = [];
      const validationErrors = [];

      data.forEach((row, index) => {
        const rowNumber = index + 2; // Excel row number (assuming header in row 1)
        
        if (!row.member_name || !row.member_number) {
          validationErrors.push(`Row ${rowNumber}: Member name and number are required`);
          return;
        }

        membersData.push({
          member_name: String(row.member_name).trim(),
          member_number: String(row.member_number).trim(),
          status: row.status || 'pending'
        });
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors in Excel file',
          errors: validationErrors
        });
      }

      // Bulk import members
      const result = await GroupMember.bulkCreate(group_id, membersData);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'Members imported successfully',
        data: {
          ...result.summary,
          successful_members: result.successful.map(member => member.toJSON()),
          failed_members: result.failed
        }
      });
    } catch (error) {
      console.error('Error importing members from Excel:', error);
      
      // Clean up uploaded file in case of error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Download sample Excel template
  static async downloadSampleExcel(req, res) {
    try {
      // Create sample data
      const sampleData = [
        { member_name: 'John Doe', member_number: '+923001234567', status: 'pending' },
        { member_name: 'Jane Smith', member_number: '+923001234568', status: 'pending' },
        { member_name: 'Mike Johnson', member_number: '+923001234569', status: 'pending' }
      ];

      // Create workbook
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(sampleData);

      // Add headers
      xlsx.utils.book_append_sheet(wb, ws, 'Members');

      // Generate buffer
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for download
      res.setHeader('Content-Disposition', 'attachment; filename=members-sample.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      res.send(buffer);
    } catch (error) {
      console.error('Error generating sample Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating sample file'
      });
    }
  }

  // Get group statistics
  static async getGroupStatistics(req, res) {
    try {
      const stats = await WhatsAppGroupExtended.getStatistics();

      res.json({
        success: true,
        message: 'Statistics fetched successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching group statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = WhatsAppGroupController; 