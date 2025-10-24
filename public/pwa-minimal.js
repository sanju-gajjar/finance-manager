/**
 * 🎯 Minimal PWA Manager - Clean & Professional
 * Progressive Web App functionality with minimal design
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstallable = false;
        this.isStandalone = this.checkStandaloneMode();
        
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.handleStandaloneMode();
        
        console.log('✨ PWA Manager initialized');
    }

    checkStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered successfully');
                
                // Listen for updates
                this.swRegistration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }

    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.isInstallable = true;
            this.showInstallButton();
        });

        // Listen for successful app install
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.deferredPrompt = null;
            this.isInstallable = false;
            this.hideInstallButton();
            this.showNotification('App installed successfully!');
        });
    }

    showInstallButton() {
        if (this.isStandalone) return;
        
        let installButton = document.getElementById('pwa-install-button');
        
        if (!installButton) {
            installButton = document.createElement('button');
            installButton.id = 'pwa-install-button';
            installButton.innerHTML = '⬇️';
            installButton.title = 'Install App';
            
            installButton.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 48px;
                height: 48px;
                background: #161616;
                border: 1px solid #2a2a2a;
                border-radius: 12px;
                color: #ffffff;
                font-size: 20px;
                cursor: pointer;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            `;

            installButton.addEventListener('mouseenter', () => {
                installButton.style.background = '#222222';
                installButton.style.borderColor = '#3b82f6';
                installButton.style.transform = 'translateY(-2px)';
                installButton.style.boxShadow = '0 12px 20px -5px rgba(0, 0, 0, 0.3)';
            });

            installButton.addEventListener('mouseleave', () => {
                installButton.style.background = '#161616';
                installButton.style.borderColor = '#2a2a2a';
                installButton.style.transform = 'translateY(0)';
                installButton.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            });

            installButton.addEventListener('click', () => {
                this.installApp();
            });

            document.body.appendChild(installButton);
        }

        installButton.style.display = this.isInstallable ? 'flex' : 'none';
    }

    hideInstallButton() {
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            this.showNotification('Install not available');
            return;
        }

        try {
            const result = await this.deferredPrompt.prompt();
            console.log('📱 Install prompt result:', result.outcome);
            
            if (result.outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                this.showNotification('Installing app...');
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.isInstallable = false;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Install prompt failed:', error);
            this.showNotification('Installation failed');
        }
    }

    handleStandaloneMode() {
        if (this.isStandalone) {
            console.log('📱 Running in standalone mode');
            document.body.classList.add('standalone-mode');
            
            // Add standalone-specific styles
            const style = document.createElement('style');
            style.textContent = `
                .standalone-mode {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `;
            document.head.appendChild(style);
        }
    }

    showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.pwa-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'pwa-notification';
        notification.textContent = message;
        
        let backgroundColor = '#161616';
        let borderColor = '#2a2a2a';
        
        if (type === 'success') {
            borderColor = '#10b981';
        } else if (type === 'error') {
            borderColor = '#ef4444';
        } else if (type === 'warning') {
            borderColor = '#f59e0b';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            border: 1px solid ${borderColor};
            color: #ffffff;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Show notification
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Cache management
    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('🗑️ Cache cleared');
            this.showNotification('Cache cleared successfully');
        }
    }

    // Update check
    async checkForUpdates() {
        if (this.swRegistration) {
            await this.swRegistration.update();
            console.log('🔄 Checked for updates');
        }
    }

    // Network status
    setupNetworkMonitoring() {
        const updateNetworkStatus = () => {
            const isOnline = navigator.onLine;
            console.log(isOnline ? '🌐 Online' : '📴 Offline');
            
            document.body.classList.toggle('offline', !isOnline);
            
            if (!isOnline) {
                this.showNotification('You are offline. Some features may be limited.', 'warning');
            }
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();
    }

    // Get app info
    getAppInfo() {
        return {
            isStandalone: this.isStandalone,
            isInstallable: this.isInstallable,
            hasServiceWorker: 'serviceWorker' in navigator,
            isOnline: navigator.onLine,
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }
}

// Initialize PWA Manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaManager = new PWAManager();
    });
} else {
    window.pwaManager = new PWAManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}