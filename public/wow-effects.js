// 🎪 Final Modern UI Integration & Wow Effects
// Adds the finishing touches to create an absolutely stunning experience

class WowEffects {
    constructor() {
        this.init();
    }

    init() {
        this.addPageLoadAnimation();
        this.setupParallaxEffects();
        this.addMouseFollowEffect();
        this.setupAdvancedInteractions();
        this.addKeyboardShortcuts();
        this.setupAdvancedCelebrations();
        console.log('🎭 Wow Effects initialized!');
    }

    addPageLoadAnimation() {
        // Animate elements in sequence on page load
        const elements = document.querySelectorAll('.container > *');
        
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100 + (index * 150));
        });

        // Add welcome message
        setTimeout(() => {
            this.showWelcomeMessage();
        }, 1000);
    }

    showWelcomeMessage() {
        const welcome = document.createElement('div');
        welcome.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
            backdrop-filter: blur(20px);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            opacity: 0;
            animation: welcome-popup 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        `;

        welcome.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 10px;">✨</div>
            <h3 style="margin: 10px 0; font-weight: 600;">Welcome to the Future!</h3>
            <p style="margin: 10px 0; opacity: 0.9;">Experience modern expense tracking</p>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                margin-top: 15px;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                Let's Start! 🚀
            </button>
        `;

        // Add keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes welcome-popup {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(welcome);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            welcome.style.animation = 'welcome-popup 0.3s reverse';
            setTimeout(() => welcome.remove(), 300);
        }, 4000);
    }

    setupParallaxEffects() {
        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.floating-element');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    addMouseFollowEffect() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: all 0.1s ease;
            opacity: 0;
        `;

        document.body.appendChild(cursor);

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
        });

        const animateCursor = () => {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            cursor.style.left = cursorX - 10 + 'px';
            cursor.style.top = cursorY - 10 + 'px';
            
            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        // Add click ripple effect
        document.addEventListener('click', (e) => {
            this.createClickRipple(e.clientX, e.clientY);
        });
    }

    createClickRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9998;
            animation: click-ripple 0.6s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes click-ripple {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
                100% {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                    transform: translate(-50%, -50%);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    setupAdvancedInteractions() {
        // Add hover sound effects (optional - can be enabled/disabled)
        const createHoverEffect = (element) => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'scale(1.05) translateY(-2px)';
                element.style.filter = 'brightness(1.1)';
                
                // Add subtle glow
                element.style.boxShadow = element.style.boxShadow + ', 0 0 20px rgba(102, 126, 234, 0.3)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
                element.style.filter = '';
                element.style.boxShadow = element.style.boxShadow.replace(', 0 0 20px rgba(102, 126, 234, 0.3)', '');
            });
        };

        // Apply to interactive elements
        document.querySelectorAll('button, .card, .summary-card, input, select').forEach(createHoverEffect);

        // Add shake animation on error
        window.addEventListener('error', (e) => {
            document.body.style.animation = 'error-shake 0.5s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes error-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + E = Add Expense
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                this.triggerShortcutAnimation('expense');
                if (window.openModal) window.openModal('expense');
            }

            // Alt + I = Add Income
            if (e.altKey && e.key === 'i') {
                e.preventDefault();
                this.triggerShortcutAnimation('income');
                if (window.openModal) window.openModal('income');
            }

            // Alt + S = Show Summary
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                this.triggerShortcutAnimation('summary');
                if (window.showSummaryForm) window.showSummaryForm();
            }

            // Escape = Close modals
            if (e.key === 'Escape') {
                const modal = document.getElementById('modal');
                if (modal && modal.style.display !== 'none') {
                    if (window.closeModal) window.closeModal();
                    this.triggerShortcutAnimation('close');
                }
            }
        });

        // Show keyboard shortcuts hint
        this.showKeyboardShortcuts();
    }

    triggerShortcutAnimation(type) {
        const messages = {
            'expense': '💸 Adding Expense...',
            'income': '💰 Adding Income...',
            'summary': '📊 Showing Summary...',
            'close': '❌ Closing...'
        };

        if (window.modernUI) {
            window.modernUI.showSuccessToast(messages[type] || 'Action triggered', '⌨️');
        }
    }

    showKeyboardShortcuts() {
        // Add keyboard shortcuts info (small tooltip)
        const shortcuts = document.createElement('div');
        shortcuts.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;

        shortcuts.innerHTML = `
            <div>⌨️ Shortcuts:</div>
            <div>Alt+E: Add Expense</div>
            <div>Alt+I: Add Income</div>
            <div>Alt+S: Summary</div>
            <div>Esc: Close</div>
        `;

        document.body.appendChild(shortcuts);

        // Show on Alt key hold
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                shortcuts.style.opacity = '1';
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!e.altKey) {
                shortcuts.style.opacity = '0';
            }
        });
    }

    setupAdvancedCelebrations() {
        // Create different celebration types for different actions
        const celebrationTypes = {
            expense: () => {
                if (window.modernUI) {
                    window.modernUI.createCelebration('fireworks', 2000);
                    setTimeout(() => {
                        window.modernUI.showSuccessToast('Expense tracked! 💸', '🎯');
                    }, 500);
                }
            },
            income: () => {
                if (window.modernUI) {
                    window.modernUI.createCelebration('confetti', 3000);
                    setTimeout(() => {
                        window.modernUI.showSuccessToast('Income added! 💰', '🎉');
                    }, 500);
                }
            },
            milestone: (amount) => {
                if (window.modernUI) {
                    window.modernUI.createCelebration('confetti', 4000);
                    setTimeout(() => {
                        window.modernUI.showSuccessToast(`🎊 Milestone reached: ₹${amount}!`, '🏆');
                    }, 800);
                }
            }
        };

        // Expose celebration functions globally
        window.celebrate = celebrationTypes;

        // Auto-trigger celebrations based on actions
        this.setupAutoCelebrations();
    }

    setupAutoCelebrations() {
        // Monitor for form submissions and trigger appropriate celebrations
        const originalSubmit = window.submitEntry;
        
        if (originalSubmit) {
            window.submitEntry = async function() {
                const result = await originalSubmit.apply(this, arguments);
                
                // Determine celebration type
                const modalTitle = document.getElementById('modalTitle');
                if (modalTitle) {
                    const isExpense = modalTitle.innerText.includes('Expense');
                    const amount = document.getElementById('amount')?.value;
                    
                    if (isExpense) {
                        window.celebrate.expense();
                    } else {
                        window.celebrate.income();
                    }

                    // Check for milestones
                    if (amount && parseFloat(amount) >= 10000) {
                        setTimeout(() => {
                            window.celebrate.milestone(amount);
                        }, 2000);
                    }
                }
                
                return result;
            };
        }
    }

    // Add special date celebrations
    checkSpecialDates() {
        const today = new Date();
        const month = today.getMonth();
        const date = today.getDate();

        // New Year
        if (month === 0 && date === 1) {
            this.specialCelebration('🎊 Happy New Year! 🎊', 'New year, new financial goals!');
        }
        // Christmas
        else if (month === 11 && date === 25) {
            this.specialCelebration('🎄 Merry Christmas! 🎄', 'Ho ho ho! Manage those holiday expenses!');
        }
        // Diwali (approximate)
        else if (month === 10 && (date >= 1 && date <= 15)) {
            this.specialCelebration('🪔 Happy Diwali! 🪔', 'Festival of lights and smart spending!');
        }
    }

    specialCelebration(title, message) {
        if (window.modernUI) {
            window.modernUI.createCelebration('confetti', 5000);
            setTimeout(() => {
                window.modernUI.showSuccessToast(message, '🎉');
            }, 1000);
        }
    }
}

// Initialize Wow Effects
document.addEventListener('DOMContentLoaded', () => {
    new WowEffects();
});

// Also check for special dates
setTimeout(() => {
    if (window.wowEffects) {
        window.wowEffects.checkSpecialDates();
    }
}, 2000);