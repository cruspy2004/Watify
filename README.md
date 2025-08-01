# 📱 Watify - WhatsApp Business Automation Platform

A powerful full-stack application for WhatsApp business automation, group management, and bulk messaging using WhatsApp Web integration.

## 🚀 Features

- **WhatsApp Web Integration**: Connect and manage your WhatsApp account programmatically
- **Group Management**: View and manage your WhatsApp groups
- **Bulk Messaging**: Send messages to multiple contacts with rate limiting
- **User Authentication**: Secure JWT-based authentication system
- **Member Management**: Manage group members with Excel import/export
- **Real-time Status**: Monitor WhatsApp connection status and health
- **Responsive UI**: Modern React interface with Material-UI components

## �️ Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **PostgreSQL** database with **pg** driver
- **WhatsApp Web.js** for WhatsApp integration
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Puppeteer** for browser automation

### Frontend
- **React** with hooks and context
- **Material-UI (MUI)** for UI components
- **Axios** for API communication
- **React Router** for navigation

## 📁 Project Structure

```
watify/
├── backend/
│   ├── config/          # Database and WhatsApp configuration
│   ├── controllers/     # API route controllers
│   ├── middleware/      # Authentication middleware
│   ├── migrations/      # Database migration scripts
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # WhatsApp and other services
│   └── server.js        # Main server file
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── context/     # React context providers
│       └── utils/       # Utility functions
├── package.json         # Root dependencies
└── README.md           # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Chrome/Chromium** (for WhatsApp Web automation)

### 1. Clone the Repository
```bash
git clone https://github.com/cruspy2004/Watify.git
cd Watify
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

Create a PostgreSQL database and update the connection details:

```bash
# Create database
createdb wateen_watify

# Run migrations
cd backend
npm run migrate
```

### 4. Environment Configuration

Create `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wateen_watify
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 5. Start the Application

```bash
# Start backend server (from root directory)
npm run dev:backend

# Start frontend (in a new terminal, from root directory)
npm run dev:frontend

# Or start both concurrently
npm run dev
```

## 📱 WhatsApp Setup

1. **Start the Backend**: The backend must be running first
2. **Login to Web Interface**: Go to `http://localhost:3000` and login
3. **Scan QR Code**: Navigate to WhatsApp section and scan the QR code with your WhatsApp mobile app
4. **Wait for Connection**: The system will connect and fetch your groups automatically

## 🔑 Default Login Credentials

- **Email**: Create your account through the registration process
- **Password**: Set during registration
## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### WhatsApp Management
- `GET /api/whatsapp/status` - Get WhatsApp connection status
- `GET /api/whatsapp/qr` - Get QR code for authentication
- `GET /api/whatsapp/groups` - Get all WhatsApp groups
- `POST /api/whatsapp/send-message` - Send single message
- `POST /api/whatsapp/send-to-group` - Send bulk messages to group

### Group Management
- `GET /api/groups` - Get all groups with pagination
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
# Run migrations
cd backend
npm run migrate

# Rollback migrations
npm run migrate:rollback
```

## 🚀 Deployment

### Using Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build -d
```

### Manual Deployment
1. Set `NODE_ENV=production` in environment
2. Build frontend: `cd frontend && npm run build`
3. Configure PostgreSQL production database
4. Set up reverse proxy (nginx recommended)
5. Configure SSL certificates
6. Start with PM2: `pm2 start backend/server.js`

## �️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Rate limiting for API endpoints
- Input validation and sanitization

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/cruspy2004/Watify/issues) page
2. Create a new issue with detailed information
3. Include logs and error messages

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [API Documentation](https://github.com/cruspy2004/Watify/wiki)
- **Support**: [Issues Page](https://github.com/cruspy2004/Watify/issues)

---

**⭐ Star this repository if you find it helpful!**

Built with ❤️ by [cruspy2004](https://github.com/cruspy2004)
  "password": "password123"
}
```

#### Get Profile (Protected)
```bash
GET /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📜 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run client` - Start React frontend (when set up)
- `npm run server` - Alias for `npm run dev`
- `npm run build` - Build React frontend (when set up)

## 🔐 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcryptjs with salt rounds
- **CORS Protection** configured for frontend URL
- **Helmet** for security headers
- **Input Validation** on all endpoints
- **SQL Injection Protection** using parameterized queries

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚧 Next Steps

1. **Set up React Frontend**:
   ```bash
   cd frontend
   npx create-react-app . --template typescript  # or without typescript
   ```

2. **Add More Features**:
   - User roles and permissions
   - Password reset functionality
   - Email verification
   - File upload capabilities
   - Admin panel

3. **Production Deployment**:
   - Set up environment variables for production
   - Configure PostgreSQL for production
   - Set up CI/CD pipeline
   - Deploy to cloud platforms (Heroku, AWS, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**Happy Coding! 🎉** 