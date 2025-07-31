#  Memory Maze - Game Design Document (GDD)

## Game Overview
**Title**: Memory Maze  
**Type**: Web-based Puzzle Game  
**Genre**: Memory/Logic  
**Platform**: Web Browser (Desktop & Mobile)  
**Tech Stack**: HTML, CSS, JavaScript, React, Node.js, MongoDB

## Objective
Players flip cards in a grid to find matching pairs within a time limit. Score is based on memory, speed, and efficiency.

## Gameplay Mechanics
- Player sees a path
- Player has to recreate the path in a stipulated time period.
- Level by level the difficulty increases.
- Player gets three powerups each level.
- There is a leaderboard for making the game more competitive.
- If the player selects the correct path they win, otherwise they lose.  

## Features
### Core Features
- Timer
- Score tracking
- Responsive design

### Bonus Features (If Time Allows)
- Difficulty levels
- Leaderboard
- Login/Signup (Auth)
- Sound effects

## Technical Architecture

**Frontend:**
- React
- Game logic with useState/useEffect
- Styled using CSS/Figma designs

**Backend:**
- Node.js with Express
- MongoDB database
- REST APIs for score saving & leaderboard

**API Routes:**
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | `/api/leaderboard`  | Get top scores       |
| POST   | `/api/score`        | Submit player score  |
| POST   | `/api/auth/signup`  | Register user (optional) |
| POST   | `/api/auth/login`   | Login user (optional)  |

## Visual Style
- Clean and minimalistic
- Bright, memory-themed color palette
- Flip animations for cards
- Mobile-friendly UI

## User Flow
1. Player lands on homepage.
2. Starts game → sees game grid.
3. Completes level → sees result.
4. Score is saved (if logged in).
5. Can view leaderboard or play again.

## Team Responsibilities

| Member               | Role           | Responsibility                                |
|----------------------|----------------|-----------------------------------------------|
| Shikhar Goel         | Full Stack     | Setup project, connect frontend & backend     |
| Ananya Goyal         | Backend Dev    | Build API, MongoDB models, data logic         |
| Subham Kumar Achary  | Frontend Dev   | Game layout, assets, responsive styling       |
| Praduman Kumar       | UI/UX Designer | UI logic, state management, animations        |

## Testing Plan
- Unit testing for API routes
- Manual playtesting for gameplay
- Bug fixing and responsiveness checks

## Deployment
- Frontend: Vercel/Netlify
- Backend: Render/Railway
