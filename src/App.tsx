import React, { useState, useEffect, useCallback, useRef } from 'react';

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
const MEMORIZE_TIME = 3000;
const GAME_TIME = 30000;

export default function App() {
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
  const [tracedPath, setTracedPath] = useState<[number, number][]>([]);
  const [wrongCell, setWrongCell] = useState<[number, number] | null>(null);
  const animationFrameId = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number>();

  const generateMaze = useCallback((size: number) => {
    const newGrid: Cell[][] = [];
    
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

    let currentRow = 0;
    let currentCol = 0;
    newGrid[0][0] = { ...newGrid[0][0], isPath: true, isStart: true, isPlayer: true };

    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    // Calculate target length based on grid size
    const pathLengthMap: { [key: number]: number } = {
      3: 6,
      4: 8,
      5: 10,
      6: 12,
      7: 14,
      8: 16,
      9: 18,
      10: 20,
    };
    
    const targetLength = pathLengthMap[size] || 6;
    let pathLength = 1;
    const pathHistory: [number, number][] = [[0, 0]];

    while (pathLength < targetLength) {
      const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
      let moved = false;

      for (const [dr, dc] of shuffledDirections) {
        const newRow = currentRow + dr;
        const newCol = currentCol + dc;

        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size &&
          !newGrid[newRow][newCol].isPath
        ) {
          newGrid[newRow][newCol].isPath = true;
          pathHistory.push([newRow, newCol]);
          currentRow = newRow;
          currentCol = newCol;
          pathLength++;
          moved = true;
          break;
        }
      }

      if (!moved && pathHistory.length > 1) {
        pathHistory.pop();
        const [prevRow, prevCol] = pathHistory[pathHistory.length - 1];
        currentRow = prevRow;
        currentCol = prevCol;
      } else if (!moved) {
        break;
      }
    }

    setCurrentPath([...pathHistory]);
    setAnimationStep(0);
    setIsAnimating(true);

    const [endRow, endCol] = pathHistory[pathHistory.length - 1];
    newGrid[endRow][endCol].isEnd = true;

    return newGrid;
  }, []);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c', '#c44569', '#f8b500', '#a29bfe'];
    
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 15 + 8,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(newParticles);
  }, []);

  const animateParticles = useCallback(() => {
    setParticles((prevParticles: Particle[]) => 
      prevParticles.map((p: Particle) => ({
        ...p,
        x: (p.x + p.speedX + window.innerWidth) % window.innerWidth,
        y: (p.y + p.speedY + window.innerHeight) % window.innerHeight
      }))
    );
    animationFrameId.current = requestAnimationFrame(animateParticles);
  }, []);

  const initGame = useCallback(() => {
    const newGrid = generateMaze(gridSize);
    setGrid(newGrid);
    setPlayerPos({ row: 0, col: 0 });
    setGameState('memorize');
    setTimeLeft(GAME_TIME / 1000);
    setTracedPath([[0, 0]]);
    setWrongCell(null);
    createParticles();
  }, [gridSize, generateMaze, createParticles]);

  useEffect(() => {
    createParticles();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [createParticles]);

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

  useEffect(() => {
    initGame();
  }, [initGame, level]);

  useEffect(() => {
    if (gameState === 'memorize') {
      const timer = setTimeout(() => {
        setGameState('solving');
      }, MEMORIZE_TIME);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'solving') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setGameState('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'memorize' || !isAnimating) return;

    const interval = setInterval(() => {
      setAnimationStep((prev: number) => {
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

  const isCellInAnimatedPath = (row: number, col: number) => {
    return currentPath.slice(0, animationStep + 1).some(([r, c]: [number, number]) => r === row && c === col);
  };

  const handleArrowClick = (key: string) => {
    // Strict state check
    if (gameState !== 'solving') {
      return;
    }
    
    // Strict key validation
    const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
    if (!validKeys.includes(key)) {
      return;
    }
    
    const directions: { [key: string]: [number, number] } = {
      'ArrowUp': [-1, 0],
      'ArrowDown': [1, 0],
      'ArrowLeft': [0, -1],
      'ArrowRight': [0, 1],
      'w': [-1, 0],
      's': [1, 0],
      'a': [0, -1],
      'd': [0, 1],
    };

    const direction = directions[key];
    if (!direction) {
      return;
    }

    const [dr, dc] = direction;
    const newRow = playerPos.row + dr;
    const newCol = playerPos.col + dc;

    // Strict boundary and path validation
    const isValidMove = (
      newRow >= 0 &&
      newRow < gridSize &&
      newCol >= 0 &&
      newCol < gridSize &&
      grid[newRow] &&
      grid[newRow][newCol] &&
      grid[newRow][newCol].isPath === true
    );

    if (isValidMove) {
      handleCellClick(newRow, newCol);
    }
  };

  const handleCellClick = (clickedRow: number, clickedCol: number) => {
    if (gameState !== 'solving') return;

    // Check if clicked on wrong cell (not a path cell)
    if (!grid[clickedRow]?.[clickedCol]?.isPath) {
      setWrongCell([clickedRow, clickedCol]);
      setTimeout(() => setGameState('lost'), 500);
      return;
    }

    // Check if it's the current position
    if (clickedRow === playerPos.row && clickedCol === playerPos.col) return;
    
    const rowDiff = Math.abs(clickedRow - playerPos.row);
    const colDiff = Math.abs(clickedCol - playerPos.col);
    const isAdjacent = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    const isStart = clickedRow === 0 && clickedCol === 0 && playerPos.row === 0 && playerPos.col === 0;
    
    if (!isAdjacent && !isStart) {
      setWrongCell([clickedRow, clickedCol]);
      setTimeout(() => setGameState('lost'), 500);
      return;
    }

    setGrid((currentGrid: Cell[][]) => {
      const newGrid = currentGrid.map((row: Cell[]) => [...row]);
      
      const { row: currentRow, col: currentCol } = playerPos;
      if (currentRow < newGrid.length && currentCol < newGrid[0].length) {
        newGrid[currentRow][currentCol].isPlayer = false;
      }
      
      newGrid[clickedRow][clickedCol].isPlayer = true;
      setPlayerPos({ row: clickedRow, col: clickedCol });
      setTracedPath([...tracedPath, [clickedRow, clickedCol]]);

      if (newGrid[clickedRow][clickedCol].isEnd) {
        const newScore = score + Math.round(timeLeft * level);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Strict game state check
      if (gameState !== 'solving') {
        return;
      }
      
      // Strict key validation
      const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
      const key = e.key;
      
      if (validKeys.includes(key)) {
        // Prevent default browser behavior (scrolling, etc.)
        e.preventDefault();
        e.stopPropagation();
        
        // Handle the movement
        handleArrowClick(key);
      }
    };

    // Add event listener with strict options
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    // Clean up event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [playerPos, grid, gameState, gridSize, handleArrowClick]);

  const renderParticles = () => {
    return particles.map((particle: Particle) => (
      <div
        key={particle.id}
        style={{
          position: 'fixed',
          left: `${particle.x}px`,
          top: `${particle.y}px`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          backgroundColor: particle.color,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.7,
          boxShadow: `0 0 ${particle.size * 3}px ${particle.color}, 0 0 ${particle.size * 6}px ${particle.color}40, 0 0 ${particle.size * 9}px ${particle.color}20`,
          filter: 'blur(0.8px)',
          animation: `float ${8 + particle.id % 7}s ease-in-out infinite`,
        }}
      />
    ));
  };

  if (gameState === 'won') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100vw',
        background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)',
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0
      }}>
        {renderParticles()}
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-bold mb-4 text-green-600">You Won!</h1>
          <p className="text-xl mb-6">Final Score: {score}</p>
          <button
            onClick={() => {
              setLevel(1);
              setGridSize(GRID_SIZES[0]);
              setScore(0);
              setGameState('memorize');
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

  if (gameState === 'lost') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100vw',
        background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)',
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0
      }}>
        {renderParticles()}
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600">Game Over</h1>
          <p className="text-xl mb-6">Time's up! Your score: {score}</p>
          <button
            onClick={() => {
              setLevel(1);
              setGridSize(GRID_SIZES[0]);
              setScore(0);
              setGameState('memorize');
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

  return (
    <div ref={containerRef} style={{ 
      minHeight: '100vh', 
      width: '100vw',
      background: 'linear-gradient(-45deg, #002fffff, #3b0c69ff, #f093fb, #e05d6fff, #4facfe, #08686dff)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      color: '#fff', 
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {renderParticles()}
      
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '60rem', margin: '0 auto', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Memory Maze</h1>
          <p style={{ fontSize: '1.125rem', color: '#ccc' }}>Navigate the path before time runs out!</p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#2d3748', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>Level</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{level}/8</div>
            </div>
            <div style={{ background: '#2d3748', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>Time Left</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft <= 10 ? '#f56565' : '#fff' }}>{timeLeft}s</div>
            </div>
            <div style={{ background: '#2d3748', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#63b3ed' }}>{score}</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              maxWidth: 'min(90vw, 600px)',
              gap: '0.5rem',
              marginBottom: '2rem',
              margin: '0 auto 2rem',
            }}
          >
            {grid.map((row: Cell[], rowIndex: number) =>
              row.map((cell: Cell, colIndex: number) => {
                const isCurrentCell = cell.row === playerPos.row && cell.col === playerPos.col;
                const isAdjacent = (Math.abs(cell.row - playerPos.row) === 1 && cell.col === playerPos.col) ||
                                   (Math.abs(cell.col - playerPos.col) === 1 && cell.row === playerPos.row);
                const isClickable = gameState === 'solving' && cell.isPath && !isCurrentCell && isAdjacent;
                
                let bgColor = '#fff';
                let borderColor = '#e2e8f0';

                if (wrongCell && wrongCell[0] === cell.row && wrongCell[1] === cell.col) {
                  bgColor = '#ef4444';
                  borderColor = '#b91c1c';
                } else if (tracedPath.some(([r, c]: [number, number]) => r === cell.row && c === cell.col)) {
                  bgColor = '#10b981';
                  borderColor = '#047857';
                } else if (gameState === 'memorize' && isCellInAnimatedPath(cell.row, cell.col)) {
                  bgColor = '#fcd34d';
                  borderColor = '#ca8a04';
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(cell.row, cell.col)}
                    style={{
                      aspectRatio: '1',
                      backgroundColor: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: '0.375rem',
                      cursor: isClickable ? 'pointer' : 'default',
                      opacity: gameState === 'solving' ? 1 : 0.7,
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (isClickable) e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      if (isClickable) e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          {gameState === 'memorize' ? (
            <div style={{ background: '#fef3c7', color: '#78350f', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              🧠 Memorize the path! You have {MEMORIZE_TIME/1000} seconds...
            </div>
          ) : (
            <div style={{ background: '#dbeafe', color: '#1e3a8a', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              🎮 Trace me if you can 🤠!
            </div>
          )}
          <p style={{ color: '#ccc' }}>
            Use ↑ ↓ ← → or W A S D to move
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 10 }}>
        <div>
          <button 
            onClick={() => handleArrowClick('ArrowUp')}
            style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button 
            onClick={() => handleArrowClick('ArrowLeft')}
            style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
          >
            ←
          </button>
          <button 
            onClick={() => handleArrowClick('ArrowDown')}
            style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
          >
            ↓
          </button>
          <button 
            onClick={() => handleArrowClick('ArrowRight')}
            style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
