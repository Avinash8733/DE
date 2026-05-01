# Voice Email System

A full-stack, accessibility-first email application designed specifically for blind and visually impaired users. Features voice control, screen reader optimization, and beautiful glass morphism UI.

## 🌟 Features

### Accessibility First
- 🎤 **Voice Control**: Navigate and compose emails using voice commands
- 👁️ **Screen Reader Optimized**: Full compatibility with NVDA, JAWS, and VoiceOver
- ⌨️ **Keyboard Navigation**: Complete keyboard accessibility with logical tab order
- 🔊 **Audio Feedback**: Spoken confirmations and announcements for all actions
- ♿ **WCAG 2.1 Compliant**: Meets accessibility standards

### Core Email Features
- 📧 **Send & Receive**: Full email functionality with SMTP integration
- 📝 **Voice Composition**: Dictate emails using speech recognition
- 📁 **Email Management**: Inbox, Sent, Drafts, and Trash folders
- 👥 **Contact Management**: Add, edit, and organize contacts
- ⭐ **Email Actions**: Star, mark as read, delete, and move emails

### Modern UI/UX
- ✨ **Glass Morphism Design**: Beautiful, modern interface with blur effects
- 🎨 **High Contrast Support**: Optimized for users with low vision
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark/Light Themes**: Automatic theme detection and manual override

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voice-email-system
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd voice-email-backend
   npm install
   
   # Frontend
   cd ../voice-email-frontend
   npm install
   ```

3. **Initialize the database**
   ```bash
   cd voice-email-backend
   npm run init-db
   ```

4. **Start development servers**
   
   **Option A: Use the startup script (Windows)**
   ```bash
   # From project root
   start-dev.bat
   ```
   
   **Option B: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd voice-email-backend
   npm start
   
   # Terminal 2 - Frontend  
   cd voice-email-frontend
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 Usage

### Getting Started
1. **Register**: Create a new account or use demo credentials
2. **Voice Setup**: Allow microphone access for voice features
3. **Navigation**: Use Ctrl+1-9 for quick section switching
4. **Voice Commands**: Press the voice button and speak naturally

### Voice Commands
- **Navigation**: "Go to inbox", "Open compose", "Show contacts"
- **Email Actions**: "Read email", "Send message", "Delete email"
- **Composition**: "Compose email to john@example.com"

### Keyboard Shortcuts
- `Ctrl+1`: Compose
- `Ctrl+2`: Inbox  
- `Ctrl+3`: Sent
- `Ctrl+4`: Drafts
- `Ctrl+5`: Contacts
- `Ctrl+6`: Trash
- `Ctrl+7`: Settings
- `Ctrl+8`: Help
- `Ctrl+9`: Profile
- `Ctrl+H`: Help

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Database**: SQLite with full schema
- **Authentication**: JWT-based auth system
- **API**: RESTful API with comprehensive endpoints
- **Email**: Nodemailer integration for SMTP
- **Voice**: Speech processing and analytics

### Frontend (React)
- **State Management**: React Context API
- **API Integration**: Axios-based service layer
- **Voice Features**: Web Speech API integration
- **Accessibility**: ARIA labels, semantic HTML
- **Styling**: CSS with glass morphism effects

### Database Schema
- **Users**: Authentication and preferences
- **Emails**: Full email storage and metadata
- **Contacts**: Contact management
- **Drafts**: Draft email storage
- **Voice Sessions**: Voice interaction analytics

## 🔧 Configuration

### Backend Environment Variables
Create `voice-email-backend/.env`:
```env
NODE_ENV=development
PORT=5000
DB_PATH=./database/voice_email.db
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000

# Optional SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend Environment Variables
Create `voice-email-frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🧪 Testing

### Demo Account
- **Email**: demo@voiceemail.com
- **Password**: demo123

### API Testing
```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome 80+**: Full feature support
- **Firefox 75+**: Full feature support  
- **Safari 13+**: Full feature support
- **Edge 80+**: Full feature support

### Voice Features
- Requires HTTPS in production
- Microphone permission required
- Works best with Chrome/Edge

## ♿ Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- Comprehensive ARIA labels
- Live regions for dynamic content
- Logical heading hierarchy

### Keyboard Navigation
- All functionality keyboard accessible
- Visible focus indicators
- Skip links for main content
- Logical tab order

### Voice Control
- Natural language processing
- Voice feedback for actions
- Customizable speech settings
- Offline voice recognition

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd voice-email-frontend
npm run build

# Backend
cd voice-email-backend
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure HTTPS for voice features
- Set up proper SMTP credentials
- Configure CORS for production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test accessibility features
5. Submit a pull request

### Development Guidelines
- Follow WCAG 2.1 AA standards
- Test with screen readers
- Ensure keyboard accessibility
- Maintain voice command compatibility

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Getting Help
- Check the Help section in the app
- Review keyboard shortcuts (Ctrl+H)
- Test voice commands with the voice button

### Common Issues
- **Microphone not working**: Check browser permissions
- **Voice commands not recognized**: Ensure clear speech
- **Screen reader issues**: Verify ARIA support is enabled

## 🔮 Future Features

- [ ] Email templates
- [ ] Advanced voice commands
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Email encryption
- [ ] Calendar integration
- [ ] Advanced search
- [ ] Email rules/filters

---

**Built with ❤️ for accessibility and inclusion**
