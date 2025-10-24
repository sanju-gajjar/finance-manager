// ✨ Modern UI Components Library
// 🎪 Animated Wheel Buttons, Drag Select Menus, and Celebration Effects

class ModernUI {
    constructor() {
        this.celebrationActive = false;
        this.wheelButtons = new Map();
        this.dragSelectMenus = new Map();
        this.init();
    }

    init() {
        this.injectStyles();
        this.setupGlobalAnimations();
        console.log('✨ Modern UI initialized!');
    }

    injectStyles() {
        const styles = `
            <style id="modern-ui-styles">
                /* 🎯 Animated Wheel Button Styles */
                .wheel-button {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: white;
                    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    overflow: hidden;
                    user-select: none;
                }

                .wheel-button::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffa726, #ab47bc);
                    border-radius: 50%;
                    z-index: -1;
                    animation: wheel-rotate 3s linear infinite;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .wheel-button:hover::before {
                    opacity: 1;
                }

                .wheel-button:hover {
                    transform: scale(1.1) rotate(180deg);
                    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.6);
                }

                .wheel-button:active {
                    transform: scale(0.95) rotate(360deg);
                }

                .wheel-button-pulse {
                    animation: wheel-pulse 2s ease-in-out infinite;
                }

                @keyframes wheel-rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes wheel-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                /* 🎨 Drag Select Menu Styles */
                .drag-select-menu {
                    position: fixed;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    min-width: 250px;
                    z-index: 1000;
                    opacity: 0;
                    transform: scale(0.8) translateY(20px);
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    pointer-events: none;
                }

                .drag-select-menu.active {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    pointer-events: all;
                }

                .drag-select-menu::before {
                    content: '';
                    position: absolute;
                    top: -10px;
                    left: 30px;
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-bottom: none;
                    border-right: none;
                    transform: rotate(45deg);
                    backdrop-filter: blur(20px);
                }

                .drag-select-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    margin: 4px 0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    color: #333;
                    position: relative;
                    overflow: hidden;
                }

                .drag-select-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
                    transition: left 0.5s ease;
                }

                .drag-select-item:hover::before {
                    left: 100%;
                }

                .drag-select-item:hover {
                    background: rgba(102, 126, 234, 0.1);
                    transform: translateX(8px);
                    color: #667eea;
                }

                .drag-select-item .icon {
                    margin-right: 12px;
                    font-size: 1.2rem;
                    transition: transform 0.2s ease;
                }

                .drag-select-item:hover .icon {
                    transform: scale(1.2) rotate(10deg);
                }

                /* 🎆 Celebration Animation Styles */
                .celebration-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9999;
                    overflow: hidden;
                }

                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    animation: confetti-fall 3s ease-out forwards;
                }

                .confetti.square {
                    border-radius: 2px;
                }

                .confetti.triangle {
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-bottom: 10px solid;
                    border-radius: 0;
                }

                @keyframes confetti-fall {
                    0% {
                        transform: translateY(-100vh) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }

                .firework {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    animation: firework-explode 1s ease-out forwards;
                }

                @keyframes firework-explode {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0);
                        opacity: 0;
                    }
                }

                /* 🌟 Success Toast Animation */
                .success-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #4ecdc4, #44a08d);
                    color: white;
                    padding: 16px 24px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(68, 160, 141, 0.3);
                    transform: translateX(400px);
                    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 1001;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .success-toast.show {
                    transform: translateX(0);
                }

                .success-toast .toast-icon {
                    font-size: 1.5rem;
                    animation: toast-bounce 0.6s ease-in-out;
                }

                @keyframes toast-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                }

                /* 🎪 Modern Input Styles */
                .modern-input {
                    position: relative;
                    margin: 20px 0;
                }

                .modern-input input, .modern-input select {
                    width: 100%;
                    padding: 16px 20px;
                    border: 2px solid rgba(102, 126, 234, 0.2);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    font-size: 16px;
                    transition: all 0.3s ease;
                    outline: none;
                }

                .modern-input input:focus, .modern-input select:focus {
                    border-color: #667eea;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
                }

                .modern-input label {
                    position: absolute;
                    top: 16px;
                    left: 20px;
                    color: #999;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 0 8px;
                }

                .modern-input input:focus + label,
                .modern-input input:valid + label {
                    top: -8px;
                    font-size: 12px;
                    color: #667eea;
                    font-weight: 600;
                }

                /* 🌈 Glassmorphism Cards */
                .glass-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 24px;
                    margin: 16px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .glass-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    transition: left 0.8s ease;
                }

                .glass-card:hover::before {
                    left: 100%;
                }

                .glass-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                    border-color: rgba(102, 126, 234, 0.3);
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // 🎯 Create Animated Wheel Button
    createWheelButton(options = {}) {
        const {
            text = '+',
            onClick = () => {},
            color = 'default',
            size = 'medium',
            pulse = false,
            container = document.body
        } = options;

        const button = document.createElement('button');
        button.className = `wheel-button ${pulse ? 'wheel-button-pulse' : ''}`;
        button.innerHTML = text;
        
        // Size variations
        if (size === 'small') {
            button.style.width = '60px';
            button.style.height = '60px';
            button.style.fontSize = '1.2rem';
        } else if (size === 'large') {
            button.style.width = '100px';
            button.style.height = '100px';
            button.style.fontSize = '2rem';
        }

        // Color variations
        const colors = {
            success: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
            danger: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            warning: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
            info: 'linear-gradient(135deg, #45b7d1 0%, #2196f3 100%)',
        };

        if (colors[color]) {
            button.style.background = colors[color];
        }

        button.addEventListener('click', (e) => {
            this.createRippleEffect(e.target, e);
            onClick(e);
        });

        container.appendChild(button);
        return button;
    }

    // 🎨 Create Drag Select Menu
    createDragSelectMenu(options = {}) {
        const {
            items = [],
            onSelect = () => {},
            triggerElement = null,
            className = ''
        } = options;

        const menu = document.createElement('div');
        menu.className = `drag-select-menu ${className}`;

        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'drag-select-item';
            menuItem.innerHTML = `
                <span class="icon">${item.icon || '•'}</span>
                <span class="text">${item.text}</span>
            `;

            menuItem.addEventListener('click', () => {
                onSelect(item);
                this.hideDragSelectMenu(menu);
            });

            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);

        if (triggerElement) {
            triggerElement.addEventListener('click', (e) => {
                this.showDragSelectMenu(menu, e);
            });
        }

        return menu;
    }

    showDragSelectMenu(menu, event) {
        const rect = event.target.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 10}px`;
        
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    this.hideDragSelectMenu(menu);
                }
            }, { once: true });
        }, 100);
    }

    hideDragSelectMenu(menu) {
        menu.classList.remove('active');
    }

    // 🎆 Create Celebration Effect
    createCelebration(type = 'confetti', duration = 3000) {
        if (this.celebrationActive) return;
        
        this.celebrationActive = true;
        
        const container = document.createElement('div');
        container.className = 'celebration-container';
        document.body.appendChild(container);

        if (type === 'confetti') {
            this.createConfetti(container, duration);
        } else if (type === 'fireworks') {
            this.createFireworks(container, duration);
        }

        setTimeout(() => {
            container.remove();
            this.celebrationActive = false;
        }, duration);
    }

    createConfetti(container, duration) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726', '#ab47bc'];
        const shapes = ['', 'square', 'triangle'];
        
        const createPiece = () => {
            const confetti = document.createElement('div');
            confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            container.appendChild(confetti);
        };

        for (let i = 0; i < 100; i++) {
            setTimeout(createPiece, Math.random() * 1000);
        }
    }

    createFireworks(container, duration) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726'];
        
        const createFirework = () => {
            const centerX = Math.random() * window.innerWidth;
            const centerY = Math.random() * window.innerHeight * 0.5 + 100;
            
            for (let i = 0; i < 20; i++) {
                const spark = document.createElement('div');
                spark.className = 'firework';
                spark.style.left = centerX + 'px';
                spark.style.top = centerY + 'px';
                spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                const angle = (i / 20) * Math.PI * 2;
                const distance = Math.random() * 100 + 50;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                spark.style.setProperty('--end-x', x + 'px');
                spark.style.setProperty('--end-y', y + 'px');
                spark.style.animation = `firework-explode 1s ease-out forwards`;
                spark.style.transform = `translate(${x}px, ${y}px)`;
                
                container.appendChild(spark);
            }
        };

        for (let i = 0; i < 5; i++) {
            setTimeout(createFirework, i * 600);
        }
    }

    // 🌟 Show Success Toast
    showSuccessToast(message, icon = '🎉') {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // ✨ Create Ripple Effect
    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    setupGlobalAnimations() {
        // Add smooth page transitions
        document.body.style.transition = 'all 0.3s ease';
        
        // Add entrance animation to existing elements
        const animateIn = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        };

        const observer = new IntersectionObserver(animateIn, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements that should animate in
        document.querySelectorAll('.card, .form-group, .expense-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
    }
}

// Initialize Modern UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.modernUI = new ModernUI();
    });
} else {
    window.modernUI = new ModernUI();
}