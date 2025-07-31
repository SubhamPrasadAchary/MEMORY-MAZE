// Animation Effects for Memory Maze Game
class AnimationManager {
    constructor() {
        this.starEmojis = ['⭐', '🌟', '✨', '💫', '☄️'];
        this.bombEmoji = '💥';
    }

    // Create and animate a star at the specified position
    createStar(element) {
        const rect = element.getBoundingClientRect();
        const star = document.createElement('div');
        const randomStar = this.starEmojis[Math.floor(Math.random() * this.starEmojis.length)];
        
        star.textContent = randomStar;
        star.style.position = 'absolute';
        star.style.left = `${rect.left + rect.width/2}px`;
        star.style.top = `${rect.top}px`;
        star.style.fontSize = '0px';
        star.style.transform = 'translate(-50%, -50%)';
        star.style.pointerEvents = 'none';
        star.style.zIndex = '1000';
        star.style.transition = 'all 1s ease-out';
        
        document.body.appendChild(star);
        
        // Trigger animation
        setTimeout(() => {
            star.style.fontSize = '40px';
            star.style.opacity = '1';
            star.style.top = `${rect.top - 30}px`;
        }, 10);
        
        // Remove star after animation
        setTimeout(() => {
            star.style.opacity = '0';
            star.style.transform = 'translate(-50%, -100px) scale(0.5)';
            
            // Remove element after animation completes
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 1000);
        }, 500);
    }

    // Create and animate a bomb at the specified position
    createBomb(element) {
        const rect = element.getBoundingClientRect();
        const bomb = document.createElement('div');
        
        bomb.textContent = this.bombEmoji;
        bomb.style.position = 'absolute';
        bomb.style.left = `${rect.left + rect.width/2}px`;
        bomb.style.top = `${rect.top + rect.height/2}px`;
        bomb.style.fontSize = '30px';
        bomb.style.transform = 'translate(-50%, -50%) scale(0)';
        bomb.style.opacity = '0';
        bomb.style.pointerEvents = 'none';
        bomb.style.zIndex = '1000';
        bomb.style.transition = 'all 0.3s ease-out';
        
        document.body.appendChild(bomb);
        
        // Trigger animation
        setTimeout(() => {
            bomb.style.transform = 'translate(-50%, -50%) scale(1.5)';
            bomb.style.opacity = '1';
            
            // Explosion effect
            setTimeout(() => {
                bomb.style.transform = 'translate(-50%, -50%) scale(3)';
                bomb.style.opacity = '0';
                bomb.style.filter = 'blur(2px)';
                
                // Remove element after animation completes
                setTimeout(() => {
                    if (bomb.parentNode) {
                        bomb.parentNode.removeChild(bomb);
                    }
                }, 300);
            }, 300);
        }, 10);
    }

    // Shake animation for wrong selection
    shakeElement(element) {
        element.style.animation = 'shake 0.5s';
        
        // Remove animation after it completes
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

// Create a global animation manager instance
const animationManager = new AnimationManager();

// Add shake animation to CSS if not already present
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        50% { transform: translateX(5px); }
        75% { transform: translateX(-5px); }
        100% { transform: translateX(0); }
    }
`;
document.head.appendChild(style);

// Example usage:
// animationManager.createStar(cellElement);  // For correct selection
// animationManager.createBomb(cellElement);  // For wrong selection
// animationManager.shakeElement(cellElement);  // For additional feedback
