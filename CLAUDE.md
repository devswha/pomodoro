# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**POMODORO TIMER v4.0.0** - Modern React-based pomodoro timer application with minimalist black & white design. This is a complete rewrite from the original vanilla HTML/CSS/JavaScript version to a responsive React web application.

## Live Development

**Local Development**: http://localhost:3000
- React development server with hot reloading
- Responsive design for mobile, tablet, and desktop
- Minimalist black & white UI design

## Development Setup

This is a React application with modern tooling and hot reloading.

To run locally:
```bash
# Install dependencies
npm install

# Start development server
npm start

# Access at http://localhost:3000
```

## Architecture & Current Implementation

### 1. React Application Structure
```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context for state management
│   └── UserContext.js  # User authentication and data management
├── pages/              # Main application pages
│   ├── LoginPage.js    # Minimalist login form
│   ├── SignupPage.js   # Single-step signup form
│   ├── MainPage.js     # Dashboard with pomodoro timer
│   ├── PomodoroStartPage.js
│   ├── PomodoroRankingPage.js
│   ├── MyPage.js       # User statistics
│   └── MonthlyPage.js  # Calendar and session history
├── services/           # Business logic and data management
│   └── UserManager.js  # Core user data management
└── styles/
    └── GlobalStyles.css # Minimalist black & white theme
```

### 2. Data Management System

**CRITICAL: User Database Structure**
This application uses localStorage-based user-specific data management. **DO NOT modify this structure** without careful consideration as it manages all user data across sessions.

#### Core Database Keys:
```javascript
// Primary user registry
'registeredUsers' → { 
  [userId]: { 
    id, displayName, email, createdAt, lastLogin, preferences 
  } 
}

// User-specific data (per userId)
`userStats_${userId}` → {
  userId, totalSessions, completedSessions, totalMinutes,
  completedMinutes, streakDays, longestStreak, lastSessionDate,
  weeklyGoal, monthlyStats: {}, dailyStats: {}, tags: {}, 
  locations: {}, completionRate, averageSessionLength
}

`pomodoroSessions_${userId}` → [
  { id, title, goal, tags, location, duration, startTime, 
    endTime, user, status, createdAt }
]

`activePomodoroSession_${userId}` → {
  id, title, goal, tags, location, duration, startTime, 
  endTime, user, status, createdAt
}

// Current session tracking
'currentUser' → userId (string)
```

#### Data Isolation Rules:
- Each user's data is completely isolated by userId
- Never mix data between users
- Always use UserManager class for data operations
- Initialize data with proper defaults for new users

### 3. Core Files Structure

#### React Components
- **`src/App.js`** - Main application router and layout
- **`src/pages/LoginPage.js`** - Minimalist login with black/white design
- **`src/pages/SignupPage.js`** - Single-step signup (username, password, confirm)
- **`src/pages/MainPage.js`** - Dashboard with statistics and active timer
- **`src/contexts/UserContext.js`** - React Context for user state management
- **`src/services/UserManager.js`** - Core data management class

#### Styling
- **`src/styles/GlobalStyles.css`** - Minimalist black & white theme
- **Styled Components** - Component-level styling with CSS-in-JS

## Key Features Implemented

### 🔐 Authentication System
- **Single-Step Signup**: Username, password, confirm password on one page
- **Real-time Validation**: Live form validation with visual feedback  
- **Simple Login**: Minimalist login form
- **Auto Navigation**: Seamless flow from auth to dashboard

### 🎨 Minimalist Design
- **Black & White Theme**: Complete monochrome color palette
- **Square Design**: No rounded corners, clean geometric forms
- **Typography**: Uppercase labels, wide letter spacing
- **Focus States**: Black borders on focus, opacity changes on hover

### 📊 Pomodoro Features
- **Timer Management**: Start, pause, stop pomodoro sessions
- **Statistics Tracking**: Real-time statistics and completion rates
- **Session History**: Complete history of all pomodoro sessions
- **User Isolation**: Each user has completely separate data

### 📱 Responsive Design
- **Mobile First**: Touch-optimized interface
- **Desktop Scalable**: Adapts to larger screens without "window-in-window" effect
- **Clean Layout**: Focuses on content without distracting elements

## Development Guidelines

### React & Modern JavaScript
1. **Use React Hooks**: Functional components with useState, useEffect
2. **Context for State**: Global state via React Context API
3. **Styled Components**: CSS-in-JS for component styling
4. **ES6+ Features**: Modern JavaScript syntax and patterns

### Data Management Rules
1. **Always use UserManager**: Never directly access localStorage
2. **Maintain Data Isolation**: Each user's data must remain separate
3. **Preserve Database Structure**: Do not modify existing localStorage keys
4. **Initialize Properly**: New users get proper default values

### Code Standards
- **TypeScript Ready**: Code structured for easy TypeScript migration
- **Component Classes**: Organized service classes (UserManager)
- **Error Handling**: Proper try/catch and error states
- **Performance**: Optimized re-renders with proper React patterns

### Testing Approach
- **User Flow Testing**: Complete signup → login → timer flow
- **Data Persistence**: Verify user data persists across sessions
- **Responsive Testing**: Test across mobile, tablet, desktop
- **Cross-browser**: Ensure localStorage compatibility

## Design System

### Color Palette
```css
/* Monochrome Theme */
--primary: #000000     /* Black - primary actions, text */
--secondary: #6c757d   /* Gray - secondary text */
--background: #ffffff  /* White - main background */
--surface: #f8f9fa     /* Light gray - card backgrounds */
--border: #e9ecef      /* Light gray - borders */
--error: #dc3545       /* Red - error states */
```

### Typography Scale
```css
/* Headers */
h1: 2.5rem (mobile) → 3.5rem (desktop)
h2: 2rem → 2.25rem  
h3: 1.5rem → 1.75rem

/* Body */
body: 1rem → 1.125rem
small: 0.875rem
```

### Component Patterns
- **Buttons**: Black background, white text, no border-radius
- **Inputs**: 2px borders, no border-radius, focus = black border
- **Cards**: White background, subtle gray borders
- **Layout**: Generous padding, clean spacing

## Success Metrics

This React v4.0.0 implementation achieved:
- ✅ **Complete React Migration** from vanilla HTML/CSS/JS
- ✅ **Minimalist Black & White Design** 
- ✅ **Single-Step Signup Flow** (simplified UX)
- ✅ **Responsive Web Design** (mobile to desktop)
- ✅ **User Data Preservation** (maintains all existing user data)
- ✅ **Modern Development Stack** (React + ES6 + CSS-in-JS)

## Version History

- **v4.0.0** (Current): React-based minimalist black & white design
- **v3.x** (Legacy): Vanilla HTML/CSS/JS with iOS-style design (moved to /legacy)

## Important Notes

⚠️ **Critical Database Warning**: The localStorage structure in UserManager.js contains all user data. Do not modify without careful consideration. Always test data migration thoroughly.

🎨 **Design Philosophy**: This version embraces minimalism - black, white, and gray only. No colors except red for errors. Clean, geometric, distraction-free design.

🚀 **Performance**: React app is optimized for development speed with hot reloading while maintaining production-ready code structure.