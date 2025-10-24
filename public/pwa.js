// PWA Installation and Management
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.swRegistration = null;
        
        this.init();
    }
    
    async init() {
        // Check if already installed
        this.checkInstallation();
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup update notifications
        this.setupUpdateNotifications();
        
        // Setup background sync
        this.setupBackgroundSync();
    }
    
    checkInstallation() {
        // Check if running as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppMode = (window.navigator.standalone === true);
        
        this.isInstalled = isStandalone || isInWebAppMode;
        
        if (this.isInstalled) {
            console.log('✅ App is running as PWA');
            this.hideInstallButton();
        } else {
            console.log('📱 App is running in browser mode');
            this.showInstallButton();
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered successfully');
                
                // Listen for updates
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }
    
    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
            console.log('📱 PWA install prompt available');
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showNotification('🎉 App installed successfully!', 'success');
        });
    }
    
    showInstallButton() {
        let installButton = document.getElementById('pwa-install-button');
        
        if (!installButton) {
            // Create modern animated wheel install button
            installButton = document.createElement('button');
            installButton.id = 'pwa-install-button';
            installButton.className = 'wheel-button wheel-button-pulse';
            installButton.innerHTML = '📱';
            installButton.style.cssText = `
                position: fixed;
                bottom: 120px;
                right: 30px;
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 1.8rem;
                box-shadow: 0 8px 32px rgba(81, 207, 102, 0.4);
                z-index: 999;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                overflow: hidden;
                user-select: none;
                animation: install-pulse 2s ease-in-out infinite;
            `;

            // Add rotating border effect
            installButton.innerHTML = `
                <div style="
                    position: absolute;
                    top: -3px; left: -3px; right: -3px; bottom: -3px;
                    background: linear-gradient(45deg, #51cf66, #40c057, #37b24d, #2b8a3e);
                    border-radius: 50%;
                    z-index: -1;
                    animation: wheel-rotate 3s linear infinite;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                "></div>
                <span style="position: relative; z-index: 1;">📱</span>
            `;
            
            // Enhanced hover effects
            installButton.addEventListener('mouseenter', () => {
                installButton.style.transform = 'scale(1.15) rotate(180deg)';
                installButton.style.boxShadow = '0 12px 40px rgba(81, 207, 102, 0.6)';
                installButton.querySelector('div').style.opacity = '1';
            });
            
            installButton.addEventListener('mouseleave', () => {
                installButton.style.transform = 'scale(1) rotate(0deg)';
                installButton.style.boxShadow = '0 8px 32px rgba(81, 207, 102, 0.4)';
                installButton.querySelector('div').style.opacity = '0';
            });

            installButton.addEventListener('click', (e) => {
                // Add click ripple effect
                const ripple = document.createElement('span');
                const rect = installButton.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: install-ripple 0.6s linear;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    pointer-events: none;
                `;

                installButton.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);

                // Call install function
                this.installApp();
            });

            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.innerHTML = 'Install as App';
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
                transition: all 0.3s ease;
                font-weight: 500;
            `;

            installButton.appendChild(tooltip);
            installButton.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(-50%) translateX(-5px)';
            });
            installButton.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(-50%) translateX(0)';
            });

            // Add keyframes for animations
            if (!document.getElementById('install-animations')) {
                const style = document.createElement('style');
                style.id = 'install-animations';
                style.textContent = `
                    @keyframes install-pulse {
                        0%, 100% { 
                            transform: scale(1);
                            box-shadow: 0 8px 32px rgba(81, 207, 102, 0.4);
                        }
                        50% { 
                            transform: scale(1.05);
                            box-shadow: 0 12px 40px rgba(81, 207, 102, 0.6);
                        }
                    }
                    @keyframes wheel-rotate {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes install-ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(installButton);
        }
        
        installButton.style.display = 'flex';
    }
    
    hideInstallButton() {
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }
    
    async installApp() {
        if (!this.deferredPrompt) {
            this.showNotification('⚠️ Install not available', 'warning');
            return;
        }
        
        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user's response
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                this.showNotification('🎉 Installing app...', 'info');
            } else {
                console.log('❌ User dismissed the install prompt');
                this.showNotification('ℹ️ Install cancelled', 'info');
            }
            
            // Clear the deferredPrompt
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Install failed:', error);
            this.showNotification('❌ Install failed', 'error');
        }
    }
    
    setupUpdateNotifications() {
        // Check for updates every 30 minutes
        setInterval(() => {
            if (this.swRegistration) {
                this.swRegistration.update();
            }
        }, 30 * 60 * 1000);
    }
    
    showUpdateNotification() {
        const updateNotification = document.createElement('div');
        updateNotification.id = 'update-notification';
        updateNotification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #74c0fc, #339af0);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            max-width: 90%;
            animation: slideDown 0.3s ease;
        `;
        
        updateNotification.innerHTML = `
            <div style="margin-bottom: 12px;">
                <strong>🆕 App Update Available!</strong>
            </div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="pwaManager.applyUpdate()" 
                        style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                    Update Now
                </button>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: rgba(0,0,0,0.2); border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                    Later
                </button>
            </div>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(updateNotification);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (updateNotification.parentElement) {
                updateNotification.remove();
            }
        }, 10000);
    }
    
    async applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            // Tell the waiting SW to skip waiting and become active
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Listen for the controlling SW to change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
            
            // Remove notification
            const notification = document.getElementById('update-notification');
            if (notification) {
                notification.remove();
            }
            
            this.showNotification('🔄 Updating app...', 'info');
        }
    }
    
    setupBackgroundSync() {
        // Register for background sync when going online
        window.addEventListener('online', () => {
            if (this.swRegistration && this.swRegistration.sync) {
                this.swRegistration.sync.register('expense-sync')
                    .then(() => {
                        console.log('✅ Background sync registered');
                    })
                    .catch((error) => {
                        console.error('❌ Background sync registration failed:', error);
                    });
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Use the existing storage manager notification system
        if (window.storageManager) {
            window.storageManager.showStatus(message, type);
        } else {
            // Fallback to console
            console.log(`[PWA] ${message}`);
        }
    }
    
    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        }
        return false;
    }
    
    // Show local notification
    showLocalNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            return notification;
        }
    }
    
    // Get app info
    getAppInfo() {
        return {
            isInstalled: this.isInstalled,
            serviceWorkerRegistered: !!this.swRegistration,
            canInstall: !!this.deferredPrompt,
            notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
        };
    }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for global access
window.pwaManager = pwaManager;