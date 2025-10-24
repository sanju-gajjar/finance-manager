// 🎪 Modern UI Integration for Finance Manager
// Enhances existing functionality with stunning animations and interactions

class FinanceUIEnhancer {
    constructor() {
        this.originalSubmitEntry = window.submitEntry;
        this.originalOpenModal = window.openModal;
        this.init();
    }

    async init() {
        // Wait for Modern UI to be available
        if (typeof window.modernUI === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.enhanceExistingUI();
        this.replaceBoringButtons();
        this.addDragSelectMenus();
        this.enhanceFormSubmission();
        console.log('🎪 Finance UI Enhanced!');
    }

    enhanceExistingUI() {
        // Add modern styling to existing elements
        const existingButtons = document.querySelectorAll('button:not(.wheel-button)');
        existingButtons.forEach(button => {
            if (!button.classList.contains('modern-enhanced')) {
                this.modernizeButton(button);
            }
        });

        // Add glass morphism to cards
        const cards = document.querySelectorAll('.card, .summary-card, .expense-item');
        cards.forEach(card => {
            if (!card.classList.contains('glass-card')) {
                card.classList.add('glass-card');
            }
        });

        // Modernize inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!input.closest('.modern-input')) {
                this.modernizeInput(input);
            }
        });
    }

    replaceBoringButtons() {
        // Replace main action buttons with animated wheel buttons
        const addExpenseBtn = document.querySelector('[onclick*="expense"]') || 
                             document.querySelector('button:contains("Add Expense")');
        const addIncomeBtn = document.querySelector('[onclick*="income"]') || 
                            document.querySelector('button:contains("Add Income")');

        if (addExpenseBtn) {
            this.replaceWithWheelButton(addExpenseBtn, {
                text: '💸',
                color: 'danger',
                onClick: () => this.enhancedOpenModal('expense'),
                pulse: true
            });
        }

        if (addIncomeBtn) {
            this.replaceWithWheelButton(addIncomeBtn, {
                text: '💰',
                color: 'success',
                onClick: () => this.enhancedOpenModal('income'),
                pulse: true
            });
        }

        // Create floating action buttons
        this.createFloatingActionMenu();
    }

    replaceWithWheelButton(originalButton, options) {
        const wheelButton = window.modernUI.createWheelButton(options);
        wheelButton.classList.add('modern-enhanced');
        
        // Position it where the original button was
        const rect = originalButton.getBoundingClientRect();
        wheelButton.style.position = 'absolute';
        wheelButton.style.left = rect.left + 'px';
        wheelButton.style.top = rect.top + 'px';
        wheelButton.style.zIndex = '1000';
        
        // Hide original button with animation
        originalButton.style.transition = 'all 0.5s ease';
        originalButton.style.opacity = '0';
        originalButton.style.transform = 'scale(0)';
        
        setTimeout(() => {
            originalButton.style.display = 'none';
            wheelButton.style.position = 'relative';
            wheelButton.style.left = 'auto';
            wheelButton.style.top = 'auto';
            originalButton.parentNode.insertBefore(wheelButton, originalButton);
        }, 500);
    }

    createFloatingActionMenu() {
        // Create main FAB
        const fab = document.createElement('div');
        fab.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 1000;
        `;

        const mainButton = window.modernUI.createWheelButton({
            text: '✨',
            size: 'large',
            pulse: true,
            onClick: () => this.toggleFABMenu(fab)
        });

        fab.appendChild(mainButton);

        // Create sub-buttons
        const subButtons = [
            { text: '💸', action: () => this.enhancedOpenModal('expense'), color: 'danger', label: 'Add Expense' },
            { text: '💰', action: () => this.enhancedOpenModal('income'), color: 'success', label: 'Add Income' },
            { text: '📊', action: () => this.showStats(), color: 'info', label: 'Statistics' },
            { text: '⚙️', action: () => this.showSettings(), color: 'warning', label: 'Settings' }
        ];

        subButtons.forEach((btnConfig, index) => {
            const subBtn = window.modernUI.createWheelButton({
                text: btnConfig.text,
                color: btnConfig.color,
                onClick: btnConfig.action
            });

            subBtn.style.cssText = `
                position: absolute;
                bottom: 0;
                right: 0;
                transform: scale(0);
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                transition-delay: ${index * 0.1}s;
            `;

            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.innerHTML = btnConfig.label;
            tooltip.style.cssText = `
                position: absolute;
                right: 100%;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                margin-right: 10px;
                transition: opacity 0.3s ease;
            `;

            subBtn.appendChild(tooltip);
            subBtn.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
            subBtn.addEventListener('mouseleave', () => tooltip.style.opacity = '0');

            fab.appendChild(subBtn);
        });

        fab.subButtons = fab.querySelectorAll('.wheel-button:not(:first-child)');
        fab.isOpen = false;

        document.body.appendChild(fab);
    }

    toggleFABMenu(fab) {
        const subButtons = fab.subButtons;
        const isOpen = fab.isOpen;

        subButtons.forEach((btn, index) => {
            if (isOpen) {
                btn.style.transform = 'scale(0)';
                btn.style.bottom = '0';
                btn.style.right = '0';
            } else {
                const angle = (index * 60) - 90; // Spread buttons in an arc
                const radius = 80;
                const x = Math.cos(angle * Math.PI / 180) * radius;
                const y = Math.sin(angle * Math.PI / 180) * radius;
                
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                    btn.style.bottom = (y + 10) + 'px';
                    btn.style.right = (-x + 10) + 'px';
                }, index * 100);
            }
        });

        fab.isOpen = !isOpen;
    }

    addDragSelectMenus() {
        // Add drag select menu for expense categories
        const categoryItems = [
            { icon: '🍔', text: 'Food & Dining', value: 'food' },
            { icon: '🛒', text: 'Groceries', value: 'groceries' },
            { icon: '⛽', text: 'Transportation', value: 'transport' },
            { icon: '🏠', text: 'Housing', value: 'housing' },
            { icon: '🎬', text: 'Entertainment', value: 'entertainment' },
            { icon: '👕', text: 'Shopping', value: 'shopping' },
            { icon: '💊', text: 'Healthcare', value: 'healthcare' },
            { icon: '📚', text: 'Education', value: 'education' },
            { icon: '💼', text: 'Business', value: 'business' },
            { icon: '🎁', text: 'Gifts', value: 'gifts' },
            { icon: '🏦', text: 'Banking', value: 'banking' },
            { icon: '❓', text: 'Other', value: 'other' }
        ];

        // Replace category select with drag menu
        const categorySelect = document.getElementById('type');
        if (categorySelect) {
            const menuTrigger = document.createElement('button');
            menuTrigger.type = 'button';
            menuTrigger.innerHTML = '📂 Select Category';
            menuTrigger.style.cssText = `
                width: 100%;
                padding: 16px 20px;
                border: 2px solid rgba(102, 126, 234, 0.2);
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
            `;

            let selectedCategory = null;

            const menu = window.modernUI.createDragSelectMenu({
                items: categoryItems,
                onSelect: (item) => {
                    selectedCategory = item.value;
                    menuTrigger.innerHTML = `${item.icon} ${item.text}`;
                    categorySelect.value = item.value;
                    
                    // Trigger celebration for category selection
                    window.modernUI.showSuccessToast('Category selected!', item.icon);
                }
            });

            menuTrigger.addEventListener('click', (e) => {
                window.modernUI.showDragSelectMenu(menu, e);
            });

            categorySelect.parentNode.insertBefore(menuTrigger, categorySelect);
            categorySelect.style.display = 'none';
        }
    }

    enhancedOpenModal(type) {
        // Call original function
        if (this.originalOpenModal) {
            this.originalOpenModal(type);
        }

        // Add entrance animation to modal
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.8)';
            modal.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
        }

        // Add floating particles effect
        this.createFloatingParticles();
    }

    enhanceFormSubmission() {
        // Override the original submitEntry function
        window.submitEntry = async () => {
            const amount = document.getElementById("amount").value;
            const desc = document.getElementById("description").value;

            if (!amount || !desc) {
                this.showValidationError();
                return;
            }

            // Show loading animation
            this.showLoadingSpinner();

            try {
                // Call original submit logic (you'll need to extract this)
                await this.originalSubmitEntry();
                
                // Show success celebration
                window.modernUI.createCelebration('confetti');
                window.modernUI.showSuccessToast('Entry added successfully! 🎉', '✨');
                
                // Close modal with animation
                this.animatedCloseModal();
                
            } catch (error) {
                window.modernUI.showSuccessToast('Error saving entry', '❌');
            } finally {
                this.hideLoadingSpinner();
            }
        };
    }

    showValidationError() {
        // Shake animation for form
        const form = document.querySelector('.modal-content') || document.querySelector('form');
        if (form) {
            form.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                form.style.animation = '';
            }, 500);
        }

        // Add shake keyframes
        if (!document.getElementById('shake-styles')) {
            const style = document.createElement('style');
            style.id = 'shake-styles';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(style);
        }

        window.modernUI.showSuccessToast('Please fill in all fields', '⚠️');
    }

    showLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.id = 'loading-spinner';
        spinner.innerHTML = '✨';
        spinner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            z-index: 10000;
            animation: spin 1s linear infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(spinner);
    }

    hideLoadingSpinner() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    animatedCloseModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.transform = 'scale(0.8)';
            modal.style.opacity = '0';
            
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.transform = 'scale(1)';
                modal.style.opacity = '1';
            }, 300);
        }
    }

    createFloatingParticles() {
        const colors = ['✨', '⭐', '💫', '🌟'];
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.innerHTML = colors[Math.floor(Math.random() * colors.length)];
            particle.style.cssText = `
                position: fixed;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
                left: ${Math.random() * window.innerWidth}px;
                top: ${window.innerHeight}px;
                animation: float-up 3s ease-out forwards;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes float-up {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 3000);
        }
    }

    modernizeButton(button) {
        button.classList.add('modern-enhanced');
        button.style.cssText = `
            ${button.style.cssText}
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 12px;
            color: white;
            padding: 12px 24px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.05)';
            button.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });

        button.addEventListener('click', (e) => {
            window.modernUI.createRippleEffect(button, e);
        });
    }

    modernizeInput(input) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modern-input';
        
        const label = input.previousElementSibling;
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        if (label && label.tagName === 'LABEL') {
            wrapper.appendChild(label);
        }
    }

    showStats() {
        window.modernUI.showSuccessToast('Statistics coming soon!', '📊');
    }

    showSettings() {
        window.modernUI.showSuccessToast('Settings coming soon!', '⚙️');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FinanceUIEnhancer();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    new FinanceUIEnhancer();
}