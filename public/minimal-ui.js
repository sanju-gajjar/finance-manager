/**
 * 🎯 Minimal Modern UI - Clean & Professional
 * Inspired by Linear, Arc Browser, and Notion's design philosophy
 */

class MinimalUI {
    constructor() {
        this.isInitialized = false;
        this.theme = 'dark';
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.loadStyles();
        this.setupEventListeners();
        this.enhanceButtons();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
        
        console.log('✨ Minimal UI initialized');
    }

    loadStyles() {
        // Remove any existing colorful stylesheets
        const existingStyles = document.querySelectorAll('link[href*="modern-enhancements"], style[data-modern-ui]');
        existingStyles.forEach(style => style.remove());

        // Load minimal dark theme
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/minimal-dark.css';
        document.head.appendChild(link);
    }

    enhanceButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            this.createMinimalButton(button);
        });
    }

    createMinimalButton(button) {
        // Remove any existing wheel button classes
        button.classList.remove('wheel-button');
        
        // Add clean button styling
        button.classList.add('minimal-btn');
        
        // Add icons based on button content
        const text = button.textContent.toLowerCase();
        let icon = '';
        
        if (text.includes('expense')) {
            icon = '💸';
            button.style.borderColor = '#ef4444';
            button.style.color = '#ef4444';
        } else if (text.includes('income')) {
            icon = '💰';
            button.style.borderColor = '#10b981';
            button.style.color = '#10b981';
        } else if (text.includes('summary')) {
            icon = '📊';
            button.style.borderColor = '#3b82f6';
            button.style.color = '#3b82f6';
        } else if (text.includes('install')) {
            icon = '⬇️';
        }

        if (icon && !button.querySelector('.btn-icon')) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = icon;
            iconSpan.style.marginRight = '8px';
            button.insertBefore(iconSpan, button.firstChild);
        }

        // Clean hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });

        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-1px)';
        });
    }

    createCleanModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: #111111;
            border: 1px solid #2a2a2a;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            transform: scale(0.95);
            transition: transform 0.2s ease;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: #ffffff; font-size: 1.125rem; font-weight: 600; margin: 0;">${title}</h3>
                <button class="close-btn" style="background: none; border: none; color: #666666; font-size: 1.5rem; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
            </div>
            <div>${content}</div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Show modal with animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        });

        // Close modal functionality
        const closeBtn = modalContent.querySelector('.close-btn');
        const closeModal = () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95)';
            setTimeout(() => modal.remove(), 200);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        return modal;
    }

    showSuccessToast(message) {
        // Remove any existing toasts
        const existingToasts = document.querySelectorAll('.success-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #161616;
            border: 1px solid #2a2a2a;
            color: #ffffff;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        toast.innerHTML = `
            <span style="color: #10b981;">✓</span>
            ${message}
        `;

        document.body.appendChild(toast);

        // Show toast
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    createSelectMenu(options, onSelect) {
        const menu = document.createElement('div');
        menu.className = 'select-menu';
        menu.style.cssText = `
            position: absolute;
            background: #111111;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            padding: 4px;
            min-width: 200px;
            z-index: 1000;
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'select-item';
            item.style.cssText = `
                padding: 8px 12px;
                border-radius: 4px;
                color: #ffffff;
                cursor: pointer;
                transition: background-color 0.15s;
                font-size: 14px;
            `;
            item.textContent = option.label;

            item.addEventListener('mouseenter', () => {
                item.style.background = '#222222';
            });

            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });

            item.addEventListener('click', () => {
                onSelect(option.value);
                this.closeSelectMenu(menu);
            });

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        // Show menu
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1) translateY(0)';
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    this.closeSelectMenu(menu);
                }
            }, { once: true });
        }, 100);

        return menu;
    }

    closeSelectMenu(menu) {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.95) translateY(-8px)';
        setTimeout(() => menu.remove(), 150);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key) {
                    case 'e':
                    case 'E':
                        e.preventDefault();
                        const expenseBtn = document.querySelector('button[onclick*="expense"]');
                        if (expenseBtn) expenseBtn.click();
                        break;
                    case 'i':
                    case 'I':
                        e.preventDefault();
                        const incomeBtn = document.querySelector('button[onclick*="income"]');
                        if (incomeBtn) incomeBtn.click();
                        break;
                    case 's':
                    case 'S':
                        e.preventDefault();
                        const summaryBtn = document.querySelector('button[onclick*="summary"]');
                        if (summaryBtn) summaryBtn.click();
                        break;
                }
            }
        });
    }

    setupEventListeners() {
        // Clean form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                setTimeout(() => {
                    this.showSuccessToast('Entry saved successfully');
                }, 100);
            }
        });

        // Enhance PWA install button
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            this.enhanceInstallButton(installButton);
        }
    }

    enhanceInstallButton(button) {
        button.innerHTML = '⬇️';
        button.style.cssText = `
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            width: 48px !important;
            height: 48px !important;
            background: #161616 !important;
            border: 1px solid #2a2a2a !important;
            border-radius: 12px !important;
            color: #ffffff !important;
            font-size: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
            z-index: 1000 !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#222222';
            button.style.borderColor = '#3b82f6';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 12px 20px -5px rgba(0, 0, 0, 0.3)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#161616';
            button.style.borderColor = '#2a2a2a';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        });
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    // Clean up any existing colorful elements
    cleanup() {
        // Remove floating elements
        const floatingElements = document.querySelectorAll('.floating-elements, .floating-element');
        floatingElements.forEach(el => el.remove());

        // Remove celebration containers
        const celebrations = document.querySelectorAll('.celebration-container, .confetti, .firework');
        celebrations.forEach(el => el.remove());

        // Remove colorful backgrounds
        document.body.style.background = '#0a0a0a';
        document.body.style.backgroundImage = 'none';

        // Clean up any wheel buttons
        const wheelButtons = document.querySelectorAll('.wheel-button');
        wheelButtons.forEach(btn => {
            btn.classList.remove('wheel-button');
            btn.removeAttribute('style');
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.minimalUI = new MinimalUI();
    });
} else {
    window.minimalUI = new MinimalUI();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MinimalUI;
}