# Voice Email Backend

A comprehensive backend API for the Voice Email System designed for blind users. This backend provides secure authentication, email management, contact management, voice processing, and accessibility features.

## Features

- 🔐 **User Authentication**: JWT-based authentication with secure password hashing
- 📧 **Email Management**: Send, receive, organize emails with SMTP integration
- 👥 **Contact Management**: Full CRUD operations for contacts with search and favorites
- 🎤 **Voice Processing**: Voice session tracking and command processing
- ♿ **Accessibility**: Screen reader optimized with customizable voice settings
- 📊 **Analytics**: User activity tracking and voice usage analytics
- 🔒 **Security**: Rate limiting, input validation, and CORS protection
- 💾 **Data Export**: GDPR-compliant data export functionality

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with SMTP
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator

## Quick Start

### 1. Installation

```bash
# Clone the repository (if not already done)
cd voice-email-backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Important: Change JWT_SECRET and configure SMTP settings
```

### 3. Database Setup

```bash
# Initialize the database
npm run init-db
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | **Required** |
| `DB_PATH` | SQLite database path | `./database/voice_email.db` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | **Required for email** |
| `SMTP_PASS` | SMTP password | **Required for email** |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `GET /verify` - Verify JWT token
- `POST /logout` - Logout user

### Emails (`/api/emails`)

- `GET /` - Get emails with filtering and pagination
- `GET /:id` - Get single email
- `POST /send` - Send email
- `POST /drafts` - Save draft
- `GET /drafts/list` - Get drafts
- `PUT /drafts/:id` - Update draft
- `DELETE /drafts/:id` - Delete draft
- `PUT /:id/move` - Move email to folder
- `PUT /:id/star` - Toggle email star
- `PUT /:id/read` - Mark email as read/unread
- `DELETE /:id` - Delete email permanently

### Contacts (`/api/contacts`)

- `GET /` - Get contacts with search and pagination
- `GET /:id` - Get single contact
- `POST /` - Create new contact
- `PUT /:id` - Update contact
- `PUT /:id/favorite` - Toggle favorite status
- `DELETE /:id` - Delete contact
- `POST /bulk` - Bulk operations
- `POST /import` - Import contacts
- `GET /export/csv` - Export contacts as CSV

### Voice (`/api/voice`)

- `POST /session` - Save voice session data
- `GET /sessions` - Get voice session history
- `POST /command` - Process voice command
- `GET /analytics` - Voice usage analytics
- `GET /tts-preferences` - Get TTS preferences
- `PUT /tts-preferences` - Update TTS preferences

### Users (`/api/users`)

- `GET /stats` - User statistics
- `GET /preferences` - Get user preferences
- `PUT /preferences` - Update user preferences
- `GET /activity` - User activity log
- `DELETE /account` - Delete user account
- `GET /export` - Export user data (GDPR)

## Database Schema

### Users Table
- User authentication and profile information
- Voice and accessibility settings (JSON)
- Created/updated timestamps

### Emails Table
- Email content and metadata
- Folder organization (inbox, sent, drafts, trash)
- Read/starred/important flags
- Voice transcript support

### Contacts Table
- Contact information (name, email, phone, notes)
- Avatar and favorite status
- User-specific contacts

### Voice Sessions Table
- Voice interaction tracking
- Session types and transcripts
- Audio duration and confidence scores

### Drafts Table
- Separate table for email drafts
- Voice transcript support
- Auto-save functionality

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Configurable request limits
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: Security headers and protections

## Voice Features

- **Session Tracking**: Monitor voice usage patterns
- **Command Processing**: Natural language command interpretation
- **TTS Preferences**: Customizable speech settings
- **Analytics**: Voice usage statistics and insights

## Email Features

- **SMTP Integration**: Real email sending capability
- **Folder Management**: Organize emails in folders
- **Search & Filter**: Advanced email filtering
- **Draft Management**: Auto-save and manage drafts
- **Bulk Operations**: Efficient bulk email operations

## Contact Features

- **Full CRUD**: Complete contact management
- **Search & Filter**: Find contacts quickly
- **Favorites**: Mark important contacts
- **Import/Export**: CSV import and export
- **Bulk Operations**: Manage multiple contacts

## Development

### Database Management

```bash
# Initialize/reset database
npm run init-db

# The database file is located at ./database/voice_email.db
```

### Testing

```bash
# Run tests (when implemented)
npm test
```

### API Testing

Use tools like Postman or curl to test the API endpoints. All protected routes require the `Authorization: Bearer <token>` header.

Example:
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper SMTP settings
4. Set up reverse proxy (nginx)
5. Use process manager (PM2)
6. Configure SSL/TLS
7. Set up database backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support or questions about the Voice Email Backend, please create an issue in the repository or contact the development team.
