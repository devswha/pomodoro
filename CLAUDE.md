# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based pomodoro timer application built with vanilla HTML, CSS, and JavaScript. It features a circular progress indicator, customizable work/break durations, session tracking, and browser notifications.

## Development Setup

This is a simple web application that can be run by opening `index.html` in a web browser. No build process or dependencies are required.

To run locally:
```bash
# Serve files with a simple HTTP server (recommended for full functionality)
python -m http.server 8000
# or
npx serve .
```

## Architecture

- `index.html` - Main HTML structure with timer interface, controls, and settings
- `style.css` - Modern CSS styling with responsive design and animations
- `script.js` - Core timer logic implemented as a PomodoroTimer class

### Key Features

- **Timer Sessions**: Work (25min), short break (5min), long break (15min)
- **Visual Progress**: Circular SVG progress ring with color coding
- **Customizable Durations**: User can adjust session lengths
- **Statistics Tracking**: Completed sessions and total time
- **Browser Notifications**: Alerts when sessions complete
- **Responsive Design**: Works on desktop and mobile devices
- **Auto Session Switching**: Automatically cycles between work and break periods

### Core Classes

- `PomodoroTimer` - Main timer class handling all functionality including:
  - Timer state management
  - Progress tracking
  - Notification handling
  - Session switching logic
  - Settings persistence