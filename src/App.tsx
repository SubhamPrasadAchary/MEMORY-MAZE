import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// Add type for particles
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

type Cell = {
  row: number;
  col: number;
  isPath: boolean;
  isPlayer: boolean;
  isStart: boolean;
  isEnd: boolean;
};

type GameState = 'memorize' | 'solving' | 'won' | 'lost';

const GRID_SIZES = [3, 4, 5, 6, 7, 8, 9, 10];
const MEMORIZE_TIME = 3000; // 3 seconds
const GAME_TIME = 30000; // 30 seconds

function App() {
  const [gridSize, setGridSize] = useState(3);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [gameState, setGameState] = useState<GameState>('memorize');
  const [animationStep, setAnimationStep] = useState(0);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME / 1000);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationFrameId = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate a maze with a continuous path of 6 tiles in a 3x3 grid
  const generateMaze = useCallback((size: number) => {
    const newGrid: Cell[][] = [];
    
    // Initialize grid with all walls
    for (let row = 0; row < size; row++) {
      const newRow: Cell[] = [];
      for (let col = 0; col < size; col++) {
        newRow.push({
          row,
          col,
          isPath: false,
          isPlayer: false,
          isStart: false,
          isEnd: false,
        });
      }
      newGrid.push(newRow);
    }

    // Always start at top-left corner (0,0)
    let currentRow = 0;
    let currentCol = 0;
    newGrid[0][0] = { ...newGrid[0][0], isPath: true, isStart: true, isPlayer: true };

    const directions = [
      [0, 1],  // right
      [1, 0],  // down
      [0, -1], // left
      [-1, 0], // up
    ];

    // For 3x3 grid, we want exactly 6 path tiles (including start and end)
    const targetLength = 6;
    let pathLength = 1;
    const pathHistory: [number, number][] = [[0, 0]]; // Track the path for backtracking

    while (pathLength < targetLength) {
      // Shuffle directions to try them in random order
      const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
      let moved = false;

      // Try each direction until a valid move is found
      for (const [dr, dc] of shuffledDirections) {
        const newRow = currentRow + dr;
        const newCol = currentCol + dc;

        // Check if the new position is valid and not already part of the path
        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size &&
          !newGrid[newRow][newCol].isPath
        ) {
          // Mark the cell as part of the path
          newGrid[newRow][newCol].isPath = true;
          pathHistory.push([newRow, newCol]);
          currentRow = newRow;
          currentCol = newCol;
          pathLength++;
          moved = true;
          break;
        }
      }

      // If no valid move, backtrack
      if (!moved && pathHistory.length > 1) {
        pathHistory.pop(); // Remove current position
        const [prevRow, prevCol] = pathHistory[pathHistory.length - 1];
        currentRow = prevRow;
        currentCol = prevCol;
      } else if (!moved) {
        // If we can't move and can't backtrack, break to avoid infinite loop
        break;
      }
    }

    // Store the path for animation
    setCurrentPath([...pathHistory]);
    setAnimationStep(0);
    setIsAnimating(true);

    // Mark the last cell as end
    const [endRow, endCol] = pathHistory[pathHistory.length - 1];
    newGrid[endRow][endCol].isEnd = true;

    return newGrid;
  }, []);

  // Create floating particles
  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const colors = ['#4299e1', '#9f7aea', '#f6ad55', '#68d391', '#f6e05e'];
    
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 5 + 2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(newParticles);
  }, []);

  // Animate particles
  const animateParticles = useCallback(() => {
    setParticles(prevParticles => 
      prevParticles.map(p => ({
        ...p,
        x: (p.x + p.speedX + window.innerWidth) % window.innerWidth,
        y: (p.y + p.speedY + window.innerHeight) % window.innerHeight
      }))
    );
    animationFrameId.current = requestAnimationFrame(animateParticles);
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const newGrid = generateMaze(gridSize);
    setGrid(newGrid);
    setPlayerPos({ row: 0, col: 0 });
    setGameState('memorize');
    setTimeLeft(GAME_TIME / 1000);
    createParticles();
  }, [gridSize, generateMaze, createParticles]);

  // Initialize particles on mount
  useEffect(() => {
    createParticles();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [createParticles]);

  // Start/stop particle animation based on game state
  useEffect(() => {
    if (gameState === 'memorize' || gameState === 'solving') {
      animationFrameId.current = requestAnimationFrame(animateParticles);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, animateParticles]);

  // Start the game when component mounts or level changes
  useEffect(() => {
    initGame();
  }, [initGame, level]);

  // Handle memorize phase
  useEffect(() => {
    if (gameState === 'memorize') {
      const timer = setTimeout(() => {
        setGameState('solving');
        startGameTimer();
      }, MEMORIZE_TIME);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Game timer
  const startGameTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  // Animation effect for path display
  useEffect(() => {
    if (gameState !== 'memorize' || !isAnimating) return;

    const interval = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= currentPath.length - 1) {
          clearInterval(interval);
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [gameState, currentPath, isAnimating]);

  // Check if cell is in animated path
  const isCellInAnimatedPath = (row: number, col: number) => {
    return currentPath.slice(0, animationStep + 1).some(([r, c]) => r === row && c === col);
  };

  // Handle cell click
  const handleCellClick = (clickedRow: number, clickedCol: number) => {
    // Only allow clicks during the solving phase
    if (gameState !== 'solving') return;

    // Get current grid state
    setGrid(currentGrid => {
      // Create a deep copy of the grid
      const newGrid = currentGrid.map(row => [...row]);
      
      // Check if clicked on a non-path cell
      if (!newGrid[clickedRow][clickedCol].isPath) {
        setGameState('lost');
        return currentGrid; // Return current grid without changes
      }

      // Update player position
      const { row: currentRow, col: currentCol } = playerPos;
      newGrid[currentRow][currentCol].isPlayer = false;
      newGrid[clickedRow][clickedCol].isPlayer = true;
      
      // Update player position in state
      setPlayerPos({ row: clickedRow, col: clickedCol });

      // Check if reached the end
      if (newGrid[clickedRow][clickedCol].isEnd) {
        const newScore = score + (timeLeft * level);
        setScore(newScore);
        
        if (level < GRID_SIZES.length) {
          setLevel(level + 1);
          setGridSize(GRID_SIZES[level]);
        } else {
          setGameState('won');
        }
      }

      return newGrid;
    });
  };

  // Handle key press for movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'solving') return;

      const directions: { [key: string]: [number, number] } = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        w: [-1, 0],
        s: [1, 0],
        a: [0, -1],
        d: [0, 1],
      };

      const direction = directions[e.key];
      if (!direction) return;

      const [dr, dc] = direction;
      const newRow = playerPos.row + dr;
      const newCol = playerPos.col + dc;

      if (
        newRow >= 0 &&
        newRow < gridSize &&
        newCol >= 0 &&
        newCol < gridSize &&
        grid[newRow][newCol].isPath
      ) {
        handleCellClick(newRow, newCol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, grid, gameState, gridSize]);

  // Removed renderCell function as we've moved the logic directly into the grid rendering

  // Game over screen
  if (gameState === 'won') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-bold mb-4 text-green-600">You Won!</h1>
          <p className="text-xl mb-6">Final Score: {score}</p>
          <button
            onClick={() => {
              setLevel(1);
              setGridSize(GRID_SIZES[0]);
              setScore(0);
              initGame();
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Game lost screen
  if (gameState === 'lost') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600">Game Over</h1>
          <p className="text-xl mb-6">Time's up! Your score: {score}</p>
          <button
            onClick={() => {
              setLevel(1);
              setGridSize(GRID_SIZES[0]);
              setScore(0);
              initGame();
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render particles
  const renderParticles = () => {
    return particles.map((particle) => (
      <div
        key={particle.id}
        className="particle"
        style={{
          left: `${particle.x}px`,
          top: `${particle.y}px`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          backgroundColor: particle.color,
          animationDuration: `${10 + Math.random() * 20}s`,
          animationDelay: `-${Math.random() * 10}s`,
        }}
      />
    ));
  };

  return (
    <div className="game-container" ref={containerRef}>
      {/* Floating particles */}
      {renderParticles()}
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-2">
            <span className="game-title">Memory Maze</span>
          </h1>
          <p className="text-lg text-gray-300">Navigate the path before time runs out!</p>
          
          {/* Game Stats */}
          <div className="game-stats">
            <div className="stat-box level-display">
              <div className="stat-label">Level</div>
              <div className="stat-value">
                {level}<span className="text-sm opacity-80">/8</span>
              </div>
            </div>
            <div className="stat-box time-remaining">
              <div className="stat-label">Time Left</div>
              <div className={`stat-value ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                {timeLeft}s
              </div>
            </div>
            <div className="stat-box score-display">
              <div className="stat-label">Score</div>
              <div className="stat-value glow">{score}</div>
            </div>
          </div>
        </div>

      <div className="relative z-10">
        <div 
          className="grid-container mb-6"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: 'min(90vw, 600px)',
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellClassName = [
                'grid-cell',
                'relative group',
                'transition-all duration-300',
                'bg-white',
                cell.isPlayer ? 'border-2 border-blue-500' :
                cell.isStart ? 'border-2 border-green-500' :
                cell.isEnd ? 'bg-red-500' :
                gameState === 'memorize' && isCellInAnimatedPath(cell.row, cell.col) ? 'bg-yellow-400' :
                cell.isPath ? 'border-2 border-yellow-300 hover:bg-yellow-50 cursor-pointer' :
                'border border-gray-200 cursor-pointer'
              ].join(' ');

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cellClassName}
                  onClick={() => handleCellClick(cell.row, cell.col)}
                  style={{
                    animation: 'popIn 0.5s ease-out',
                    animationFillMode: 'both',
                    animationDelay: `${(rowIndex * gridSize + colIndex) * 0.03}s`,
                  }}
                >
                  {cell.isPath && !cell.isStart && !cell.isEnd && !cell.isPlayer && (
                    <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-center">
        {gameState === 'memorize' ? (
          <div className="game-status bg-yellow-50 text-yellow-800 border-yellow-200">
            🧠 Memorize the path! You have {MEMORIZE_TIME/1000} seconds...
          </div>
        ) : (
          <div className="game-status bg-blue-50 text-blue-800 border-blue-200">
            🎮 Trace me if you can 🤠 <span className="font-bold"></span>!
          </div>
        )}
        <p className="instructions">
          Use <span>↑</span> <span>↓</span> <span>←</span> <span>→</span> or <span>W</span> <span>A</span> <span>S</span> <span>D</span> to move
        </p>
      </div>
      </div>
    </div>
  );
}

export default App;
