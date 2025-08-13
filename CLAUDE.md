# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a complete iOS-style signup and login system with a main dashboard, built with vanilla HTML, CSS, and JavaScript. The project was implemented using MCP (Model Context Protocol) to perfectly replicate Figma designs, creating a pixel-perfect native iOS app experience in the web browser.

## Live Deployment

**Production URL**: https://fantastic-hamster-4694a6.netlify.app/
- **Login Page**: `/` (index.html)
- **Signup Page**: `/signup` (signup.html) 
- **Main Dashboard**: `/main` (main.html)
- **Landing Page**: `landing.html` (development overview page)

## Development Setup

This is a vanilla web application with no build process or dependencies required.

To run locally:
```bash
# Serve files with a simple HTTP server (recommended for full functionality)
python -m http.server 8000
# or
npx serve .
```

## Architecture & Implementation Process

The project was built following a systematic MCP-based Figma implementation process:

### 1. MCP Figma Integration
- Used `mcp__figma__add_figma_file` to access Figma design file
- Used `mcp__figma__view_node` to analyze specific design nodes
- Implemented pixel-perfect designs based on Figma node analysis

### 2. Implementation Order
1. **Signup Page** (Figma node 35:1371) - 3-step flow with virtual keyboard
2. **Login Page** (Figma node 35:701) - Simple login form
3. **Main Dashboard** (Figma node 5-2860) - Complete dashboard with statistics
4. **User Flow Integration** - Auto-navigation between pages
5. **Deployment & Optimization** - Netlify deployment with routing

### 3. Core Files Structure

#### Authentication Pages
- **`index.html`** - Main login page (iOS-style interface)
- **`login-script.js`** - Login logic with validation and navigation
- **`login-style.css`** - iOS native styling for login page

- **`signup.html`** - 3-step signup flow (ID → Password → Confirm Password)
- **`new-signup-script.js`** - Multi-step signup logic with virtual keyboard
- **`signup-style.css`** - Complete iOS styling with animations

#### Dashboard
- **`main.html`** - Main dashboard based on Figma node 5-2860
- **`main-script.js`** - Dashboard functionality with pomodoro timer
- **`main-style.css`** - Dashboard styling with charts and cards

#### Supporting Files
- **`landing.html`** - Project showcase and navigation page
- **`_redirects`** - Netlify routing configuration
- **`README.md`** - Comprehensive project documentation

### 4. Key Implementation Techniques

#### MCP-Based Design Implementation
```javascript
// Example pattern used throughout development:
// 1. Access Figma node via MCP
mcp__figma__view_node({ file_key, node_id })

// 2. Analyze design elements systematically
// 3. Implement pixel-perfect CSS
// 4. Add iOS-native interactions
// 5. Test across devices
```

#### iOS-Style Design Patterns
- **Typography**: SF Pro Display font system
- **Colors**: Native iOS color palette (#007AFF, #34C759, #FF3B30)
- **Interactions**: Touch feedback, haptic simulation, native animations
- **Layout**: Card-based design with proper spacing and shadows

#### User Flow Management
```javascript
// Navigation pattern implemented across all pages:
// Login success → main.html?user=username
// Signup complete → main.html?user=username  
// Auto user data persistence via localStorage
```

## Key Features Implemented

### 🔐 Authentication System
- **3-Step Signup Flow**: ID validation → Password creation → Password confirmation
- **Real-time Validation**: Live form validation with visual feedback
- **Virtual Keyboard**: Custom iOS-style keyboard with shift support
- **Auto Navigation**: Seamless flow from signup/login to dashboard

### 📱 iOS Native Experience  
- **Pixel Perfect Design**: Exact replication of Figma designs
- **Touch Interactions**: Native iOS touch feedback and animations
- **Responsive Layout**: iPhone container with proper scaling
- **Status Bar**: Authentic iOS status bar with notch simulation

### 📊 Dashboard Features
- **Statistics Charts**: Animated SVG progress rings
- **Action Cards**: Interactive cards for pomodoro functions
- **Real-time Clock**: Live time display and pomodoro timer
- **User Persistence**: Login state and user data management

### 🎨 Technical Excellence
- **Vanilla Implementation**: No frameworks, pure HTML/CSS/JS
- **Performance Optimized**: Smooth animations and minimal footprint
- **Accessibility Ready**: Proper focus management and keyboard navigation
- **Mobile First**: Touch-optimized interface with proper viewport handling

## Development Guidelines

### MCP Implementation Process
1. **Always use MCP first**: `mcp__figma__view_node` for design analysis
2. **Pixel-perfect accuracy**: Match Figma designs exactly
3. **iOS design patterns**: Follow native iOS conventions
4. **Progressive enhancement**: Build mobile-first, enhance for desktop

### Code Standards
- **Vanilla JavaScript**: No external dependencies
- **Component Classes**: Organized class-based architecture
- **Event-driven**: Proper event handling and cleanup
- **Responsive CSS**: Mobile-first responsive design

### Testing Approach
- **Cross-device testing**: iPhone container scales properly
- **User flow testing**: Complete signup → login → dashboard flow
- **Touch interaction testing**: All interactive elements respond properly
- **Performance testing**: Smooth animations and quick load times

## Deployment Configuration

### Netlify Setup
```
# _redirects configuration:
/           /index.html     200
/login      /index.html     200  
/signup     /signup.html    200
/main       /main.html      200
```

### URL Structure
- Root (`/`) serves login page
- Signup flow at `/signup` 
- Dashboard at `/main`
- Auto-navigation with user parameters

## Success Metrics

This implementation achieved:
- ✅ **Pixel-perfect Figma replication** using MCP
- ✅ **Complete user authentication flow** 
- ✅ **Native iOS experience** in web browser
- ✅ **Fully functional dashboard** with real features
- ✅ **Production deployment** with proper routing
- ✅ **Zero external dependencies** - pure web standards

## Key Learning: MCP-Driven Development

The most important aspect of this project is the **systematic MCP-based implementation process**:

1. **Use MCP for design analysis**: Always start with `mcp__figma__view_node`
2. **Implement systematically**: Break down designs into components  
3. **Test continuously**: Verify each component before moving forward
4. **Maintain consistency**: Use consistent patterns across all pages
5. **Deploy frequently**: Test in production environment regularly

This approach ensures pixel-perfect results and maintains design integrity throughout the development process.