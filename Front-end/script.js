class vAIronChat {
    constructor() {
        this.apiUrl = 'https://006dc4d800a1.ngrok-free.app';
        this.sessionId = null;
        this.isTyping = false;
        this.messageHistory = [];
        this.thinkingAnimation = null;
        this.thinkingTextInterval = null;
        this.thinkingProgressInterval = null;

        this.initializeElements();
        this.attachEventListeners();
        this.initializeChat();
    }

    initializeElements() {
        try {
            // Main chat elements
            this.chatContainer = document.getElementById('chatContainer');
            this.chatMessages = document.getElementById('chatMessages');
            this.messageInput = document.getElementById('messageInput');
            this.sendBtn = document.getElementById('sendBtn');

            // Thinking indicator elements
            this.thinkingIndicator = document.getElementById('aiThinking');
            this.thinkingText = document.querySelector('.thinking-text .text-part');
            this.progressFill = document.querySelector('.progress-fill');

            // Settings elements
            this.settingsPanel = document.getElementById('settingsPanel');
            this.clearChatBtn = document.getElementById('clearChat');
            this.themeSelect = document.getElementById('themeSelect');
            this.closeSettings = document.getElementById('closeSettings');

            // Desktop hint element
            this.desktopHint = document.getElementById('desktopHint');

            // UI elements
            this.loadingScreen = document.getElementById('loadingScreen');
            this.appContainer = document.getElementById('appContainer');
            this.loadingOverlay = document.getElementById('loadingOverlay');

            // Branding elements
            this.brandNameEl = document.getElementById('brandName');
            this.brandTaglineEl = document.getElementById('brandTagline');

            // Additional UI elements
            this.charCount = document.getElementById('charCount');
            this.sessionIdDisplay = document.getElementById('sessionIdDisplay');
            this.typingIndicator = document.getElementById('typingIndicator');

            // Initialize thinking state
            this.isThinking = false;
            this.thinkingTimeout = null;

            // Debug log to check if elements exist
            if (!this.chatContainer) console.warn('chatContainer not found');
            if (!this.messageInput) console.warn('messageInput not found');
            if (!this.sendBtn) console.warn('sendBtn not found');
            if (!this.thinkingIndicator) console.warn('aiThinking element not found');
        } catch (error) {
            console.error('Error initializing elements:', error);
        }
    }

    setupImageClickHandlers() {
        // Delega gli eventi click per le immagini (per gestire immagini aggiunte dinamicamente)
        this.chatMessages?.addEventListener('click', (e) => {
            if (e.target.classList.contains('chat-image')) {
                const modal = document.getElementById('imageModal');
                const modalImg = modal.querySelector('.image-modal-content');

                modalImg.src = e.target.src;
                modalImg.alt = e.target.alt;
                modal.classList.add('active');
            }
        });
    }

    addGestureSupport() {
        // Touch gesture variables
        let startX = 0;
        let startY = 0;
        let isSwipe = false;
        let swipeThreshold = 50; // Minimum distance for swipe
        let edgeThreshold = 30; // How close to edge to trigger

        // Add touch event listeners
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipe = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;

            // Check if it's a horizontal swipe from the right edge
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
                if (startX > window.innerWidth - edgeThreshold && diffX > 0) {
                    isSwipe = true;
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (isSwipe && !this.settingsPanel?.classList.contains('open')) {
                e.preventDefault();
                this.showSwipeHint();
                this.toggleSettings();
            }
            startX = 0;
            startY = 0;
            isSwipe = false;
        }, { passive: false });
    }

    showContextMenu(x, y) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();
    
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-light);
            z-index: 10000;
            min-width: 180px;
            overflow: hidden;
        `;
    
        menu.innerHTML = `
            <div class="context-menu-item" data-action="settings">
                <i class="fas fa-cog"></i>
                <span>Impostazioni</span>
                <span class="shortcut">Ctrl + ,</span>
            </div>
            <div class="context-menu-item" data-action="clear">
                <i class="fas fa-trash"></i>
                <span>Cancella chat</span>
            </div>
            <div class="context-menu-item" data-action="export">
                <i class="fas fa-download"></i>
                <span>Esporta chat</span>
            </div>
        `;
    
        document.body.appendChild(menu);
    
        // Position menu within viewport bounds
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
    
        if (rect.right > viewportWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > viewportHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
    
        // Aggiungi event listener per le azioni del menu
        menu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (!menuItem) return;
            
            e.stopPropagation();
            e.preventDefault();
            
            const action = menuItem.dataset.action;
            
            switch (action) {
                case 'settings':
                    this.toggleSettings();
                    break;
                case 'clear':
                    this.clearChat();
                    break;
                case 'export':
                    this.exportChat();
                    break;
            }
            
            menu.remove();
        });
    
        // Remove menu on click outside
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
                document.removeEventListener('contextmenu', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
            document.addEventListener('contextmenu', removeMenu);
        }, 10);
    }

    attachEventListeners() {
        try {
            // Send message on button click
            this.sendBtn?.addEventListener('click', () => this.sendMessage());
    
            // Handle keyboard input
            document.addEventListener('keydown', (e) => {
                // Settings shortcut (Ctrl/Cmd + ,)
                if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                    e.preventDefault();
                    this.toggleSettings();
                    return;
                }
    
                // Send on Enter (but allow Shift+Enter for new lines)
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
    
                    // Only send if there's text and we're not already processing
                    const message = this.messageInput.value.trim();
                    if (message && !this.isTyping) {
                        this.sendMessage();
                    }
                }
                // Focus input on Cmd/Ctrl + K
                else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.messageInput?.focus();
                }
                // Close settings on Escape
                else if (e.key === 'Escape') {
                    if (this.settingsPanel?.classList.contains('open')) {
                        this.toggleSettings();
                    } else {
                        this.messageInput?.blur();
                    }
                }
            });
    
            // Auto-resize textarea as user types
            this.messageInput?.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.updateCharCount();
            });
    
            // Clear chat button with confirmation - FIXED
            this.clearChatBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearChat();
            });
    
            // Theme selector
            this.themeSelect?.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
                // Close settings panel after selection on mobile
                if (window.innerWidth <= 768) {
                    this.toggleSettings();
                }
            });
    
            // Settings panel toggle with gesture support
            this.addGestureSupport();
    
            // Close settings button
            if (this.closeSettings) {
                this.closeSettings.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSettings();
                });
            }
    
            // Click outside settings to close - CORRETTO
            document.addEventListener('click', (e) => {
                // Se le impostazioni sono aperte e clicco fuori da esse
                if (this.settingsPanel && this.settingsPanel.classList.contains('open')) {
                    // Se clicco su un item del context menu, non chiudere le impostazioni
                    const isContextMenuItem = e.target.closest('.context-menu-item');
                    const isContextMenu = e.target.closest('.context-menu');
                    
                    // Se clicco fuori dalle impostazioni e non è un context menu
                    if (!this.settingsPanel.contains(e.target) && 
                        !e.target.closest('.settings-toggle') &&
                        !isContextMenuItem && !isContextMenu) {
                        this.toggleSettings();
                    }
                }
            });
    
            // Right-click context menu for settings
            document.addEventListener('contextmenu', (e) => {
                // Only show context menu on desktop (non-touch devices)
                const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                if (isTouchDevice) return;
    
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });
    
            // ===== NUOVI LISTENER PER IMPOSTAZIONI =====
    
            // Dimensione testo
            const textSizeSlider = document.getElementById('textSizeSlider');
            if (textSizeSlider) {
                textSizeSlider.addEventListener('input', (e) => {
                    this.changeTextSize(e.target.value);
                    document.getElementById('textSizeValue').textContent = `${e.target.value}px`;
                });
            }
    
            // Altezza linea
            const lineHeightSlider = document.getElementById('lineHeightSlider');
            if (lineHeightSlider) {
                lineHeightSlider.addEventListener('input', (e) => {
                    this.changeLineHeight(e.target.value);
                    document.getElementById('lineHeightValue').textContent = e.target.value;
                });
            }
    
            // Velocità digitazione
            const typingSpeedSlider = document.getElementById('typingSpeedSlider');
            if (typingSpeedSlider) {
                typingSpeedSlider.addEventListener('input', (e) => {
                    this.changeTypingSpeed(e.target.value);
                    const speedValue = parseInt(e.target.value);
                    let speedLabel = 'Media';
                    if (speedValue < 25) speedLabel = 'Lenta';
                    else if (speedValue < 50) speedLabel = 'Media';
                    else if (speedValue < 75) speedLabel = 'Veloce';
                    else speedLabel = 'Molto veloce';
                    document.getElementById('typingSpeedValue').textContent = speedLabel;
                });
            }
    
            // Toggle animazioni
            const animationsToggle = document.getElementById('animationsToggle');
            if (animationsToggle) {
                animationsToggle.addEventListener('change', (e) => {
                    this.toggleAnimations(e.target.checked);
                });
            }
    
            // Toggle salvataggio automatico
            const autoSaveToggle = document.getElementById('autoSaveToggle');
            if (autoSaveToggle) {
                autoSaveToggle.addEventListener('change', (e) => {
                    this.toggleAutoSave(e.target.checked);
                });
            }
    
            // Toggle alto contrasto
            const highContrastToggle = document.getElementById('highContrastToggle');
            if (highContrastToggle) {
                highContrastToggle.addEventListener('change', (e) => {
                    this.toggleHighContrast(e.target.checked);
                });
            }
    
            // Toggle riduzione animazioni
            const reduceMotionToggle = document.getElementById('reduceMotionToggle');
            if (reduceMotionToggle) {
                reduceMotionToggle.addEventListener('change', (e) => {
                    this.toggleReduceMotion(e.target.checked);
                });
            }
    
            // Toggle text-to-speech
            const textToSpeechToggle = document.getElementById('textToSpeechToggle');
            if (textToSpeechToggle) {
                textToSpeechToggle.addEventListener('change', (e) => {
                    this.toggleTextToSpeech(e.target.checked);
                });
            }
    
            // Esporta chat
            const exportChatBtn = document.getElementById('exportChat');
            if (exportChatBtn) {
                exportChatBtn.addEventListener('click', () => {
                    this.exportChat();
                });
            }
    
            // ===== FINE NUOVI LISTENER =====
    
            console.log('All event listeners attached successfully');
    
        } catch (error) {
            console.error('Error attaching event listeners:', error);
        }
    }

    
    changeTextSize(size) {
        // Apply font size globally using CSS custom property
        document.documentElement.style.setProperty('--base-font-size', `${size}px`);
        
        // Apply directly to common text elements for immediate effect
        const textElements = document.querySelectorAll('body, .message-text, .input-field textarea, .welcome-message h2, .welcome-message p, .settings-title h3, .settings-title p, .section-header h4, .setting-group label, .version-info span');
        
        textElements.forEach(element => {
            element.style.fontSize = `${size}px`;
        });
        
        localStorage.setItem('vairon-text-size', size);
    }
    
    changeLineHeight(height) {
        // Apply line height globally using CSS custom property
        document.documentElement.style.setProperty('--line-height', height);
        
        // Apply directly to common text elements for immediate effect
        const textElements = document.querySelectorAll('body, .message-text, .input-field textarea, .welcome-message h2, .welcome-message p, .settings-title h3, .settings-title p, .section-header h4, .setting-group label, .version-info span');
        
        textElements.forEach(element => {
            element.style.lineHeight = height;
        });
        
        localStorage.setItem('vairon-line-height', height);
    }

    setupImageModal() {
        // Crea il modal se non esiste già
        if (!document.getElementById('imageModal')) {
            const modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'image-modal';
            modal.innerHTML = `
                <button class="image-modal-close" onclick="this.parentElement.classList.remove('active')">
                    <i class="fas fa-times"></i>
                </button>
                <img class="image-modal-content" src="" alt="Immagine">
            `;
            document.body.appendChild(modal);

            // Chiudi modal cliccando fuori dall'immagine
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });

            // Chiudi modal con ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    initializeChat() {
        this.showLoadingScreen();
        this.updateSessionDisplay();
        this.loadSettings();
        this.setupImageModal();
        this.setupImageClickHandlers();
        this.setupDesktopHint();
        // Check server health immediately
        this.checkServerHealth();
    }

    setupDesktopHint() {
        // Only show hint on desktop (non-touch devices)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (!isTouchDevice && this.desktopHint) {
            // Show hint after 3 seconds
            setTimeout(() => {
                this.desktopHint.classList.add('visible');
                
                // Hide hint after 10 seconds
                setTimeout(() => {
                    this.desktopHint.classList.remove('visible');
                }, 10000);
            }, 3000);
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('appContainer');

        if (loadingScreen && appContainer) {
            // Ensure loading screen is visible
            loadingScreen.style.display = 'flex';
            appContainer.style.display = 'none';

            // Run intro typing then hide
            this.runIntroTyping();
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('appContainer');

        if (loadingScreen && appContainer) {
            // Add fade out animation to loading screen
            loadingScreen.classList.add('fade-out');

            // After fade out completes, show main app
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                appContainer.style.display = 'flex';
                appContainer.classList.add('fade-in');
            }, 800);
        }
    }

    async runIntroTyping() {
        try {
            if (this.brandNameEl) {
                await this.typeWriterAsync(this.brandNameEl, 'vAIron', 150);
            }
            await new Promise(r => setTimeout(r, 500));
            if (this.brandTaglineEl) {
                await this.typeWriterAsync(this.brandTaglineEl, 'Not artificial, Just evolved', 80);
            }
            await new Promise(r => setTimeout(r, 1000));
        } finally {
            this.hideLoadingScreen();
        }
    }

    async checkServerHealth() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (response.ok) {
                this.updateStatusIndicator(true);
            } else {
                throw new Error('Server not responding');
            }
        } catch (error) {
            console.error('Health check failed:', error);
            this.updateStatusIndicator(false);
            // Only show error after loading screen is hidden
            setTimeout(() => {
                this.showError('Impossibile connettersi al server. Riprova più tardi.');
            }, 1000);
        }
    }

    updateStatusIndicator(online) {
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            const statusText = statusDot.nextElementSibling;

            if (online) {
                statusDot.className = 'status-dot online';
                if (statusText) statusText.textContent = 'Online';
            } else {
                statusDot.className = 'status-dot offline';
                if (statusText) statusText.textContent = 'Offline';
            }
        }
    }

    async showThinkingAnimation() {
        if (!this.thinkingIndicator) return;

        // Show the thinking indicator
        this.thinkingIndicator.style.display = 'flex';
        this.thinkingIndicator.style.opacity = '1';

        // Start the fish animation if available
        this.startFishAnimation();

        // Thinking text animation
        const thinkingMessages = [
            'Sto pensando...',
            'Sto elaborando la risposta...',
            'Un attimo di pazienza...',
            'Sto cercando le informazioni...'
        ];

        let currentIndex = 0;

        // Update thinking text
        if (this.thinkingText) {
            this.thinkingText.textContent = thinkingMessages[currentIndex];

            // Change thinking text every few seconds
            this.thinkingTextInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % thinkingMessages.length;
                if (this.thinkingText) {
                    this.thinkingText.classList.add('changing');
                    setTimeout(() => {
                        if (this.thinkingText) {
                            this.thinkingText.textContent = thinkingMessages[currentIndex];
                            this.thinkingText.classList.remove('changing');
                        }
                    }, 300);
                }
            }, 3000);
        }

        // Progress bar animation
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
            this.progressFill.style.transition = 'none';

            setTimeout(() => {
                if (this.progressFill) {
                    this.progressFill.style.transition = 'width 2s linear';
                    this.progressFill.style.width = '100%';
                }
            }, 100);

            // Reset and restart progress bar
            this.thinkingProgressInterval = setInterval(() => {
                if (this.progressFill) {
                    this.progressFill.style.transition = 'none';
                    this.progressFill.style.width = '0%';

                    setTimeout(() => {
                        if (this.progressFill) {
                            this.progressFill.style.transition = 'width 2s linear';
                            this.progressFill.style.width = '100%';
                        }
                    }, 50);
                }
            }, 2000);
        }
    }

    async sendMessage() {
        try {
            const message = this.messageInput.value.trim();
            if (!message || this.isTyping) return;

            // Add user message to chat and history
            this.addMessage(message, 'user', {
                timestamp: new Date().toISOString()
            });

            // Clear input and update UI
            this.messageInput.value = '';
            this.autoResizeTextarea();
            this.updateCharCount();

            // Show thinking animation and disable input
            this.isTyping = true;
            this.sendBtn.disabled = true;
            await this.showThinkingAnimation();

            // Small delay to ensure UI updates before API call
            await new Promise(resolve => setTimeout(resolve, 100));

            const response = await this.callChatAPI(message);

            // Update session ID if new session
            if (response.session_id && !this.sessionId) {
                this.sessionId = response.session_id;
                this.updateSessionDisplay();
            }

            // Hide thinking animation
            await this.hideThinkingAnimation();

            // Store images if present in response
            if (response.images && response.images.length > 0) {
                this.currentResponseImages = response.images;
            }

            // Add bot response with streaming effect
            await this.addStreamedMessage(response.response || 'Non ho ricevuto una risposta valida.', 'bot', {
                timestamp: new Date().toISOString(),
                tools_used: response.tools_used,
                images: response.images
            });

            // Save message to history
            this.messageHistory.push({
                user: message,
                bot: response.response || 'Non ho ricevuto una risposta valida.',
                timestamp: new Date().toISOString(),
                tools_used: response.tools_used,
                images: response.images
            });

            // Save to local storage
            this.saveToLocalStorage();

            // Re-enable input after successful response
            this.isTyping = false;
            this.sendBtn.disabled = false;

        } catch (error) {
            console.error('Error sending message:', error);

            // Hide thinking animation if it's still showing
            await this.hideThinkingAnimation().catch(e => console.error('Error hiding thinking animation:', e));

            // Show error message
            this.addMessage(
                error.message.includes('Failed to fetch')
                    ? 'Errore di connessione. Verifica la tua connessione internet e riprova.'
                    : 'Scusa, si è verificato un errore. Riprova più tardi.',
                'bot',
                {
                    timestamp: new Date().toISOString(),
                    isError: true
                }
            );

            // Re-enable input
            this.isTyping = false;
            this.sendBtn.disabled = false;
        }
    }

    async callChatAPI(message) {
        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId || undefined,
                    blob: true // Add blob parameter to request images as blob data
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Errore nella risposta del server');
            }
    
            // Parse JSON response
            const jsonResponse = await response.json();
            return jsonResponse;
            
        } catch (error) {
            console.error('Errore durante la chiamata API:', error);
    
            // Gestione errori specifici
            if (error.name === 'AbortError') {
                throw new Error('La richiesta ha impiegato troppo tempo. Riprova più tardi.');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Errore di connessione. Verifica la tua connessione internet.');
            }
    
            throw error; // Re-throw other errors
        }
    }

    // Modified processImageUrls to handle images from API response
    processImageUrls(text, images = null) {
        console.log('Processing text for images:', text);
        console.log('Available images:', images);

        // Create a map of image paths to image data for quick lookup
        const imageMap = new Map();
        if (images && Array.isArray(images)) {
            images.forEach(img => {
                imageMap.set(img.path, img);
                // Also map by filename for easier matching
                imageMap.set(img.filename, img);
            });
        }

        // Handle markdown image links that reference files
        let processedText = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/gi, (match, alt, imagePath) => {
            console.log('Found markdown image link:', imagePath);
            
            // Check if we have this image in our response data
            const imageData = imageMap.get(imagePath) || 
                             Array.from(imageMap.values()).find(img => 
                                imagePath.includes(img.filename) || img.path.includes(imagePath)
                             );
            
            if (imageData) {
                console.log('Found matching image data for:', imagePath);
                return this.createImageHTML(imageData, alt);
            } else {
                // Mark as API image for later processing
                return `[IMMAGINE_API ${imagePath}]`;
            }
        });

        // Handle direct file path references
        const imagePathRegex = /([a-zA-Z0-9_\-\/\.]*\/[a-zA-Z0-9_\-\/\.]+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|avif))/gi;
        processedText = processedText.replace(imagePathRegex, (match) => {
            console.log('Found image path:', match);
            
            // Check if we have this image in our response data
            const imageData = imageMap.get(match) || 
                             Array.from(imageMap.values()).find(img => 
                                match.includes(img.filename) || img.path.includes(match) ||
                                match === img.path
                             );
            
            if (imageData) {
                console.log('Found matching image data for path:', match);
                return this.createImageHTML(imageData);
            } else {
                return `[IMMAGINE_API ${match}]`;
            }
        });

        // Handle remaining API image placeholders (fallback for unmatched images)
        processedText = processedText.replace(/\[IMMAGINE_API\s+([^\]]+)\]/gi, (match, imagePath) => {
            console.log('Processing fallback image placeholder:', imagePath);
            return `<div class="chat-image-container">
                <div class="image-error">Immagine non disponibile: ${imagePath}</div>
            </div>`;
        });

        return processedText;
    }

    // New method to create HTML for images using blob data
    createImageHTML(imageData, alt = 'Immagine') {
        console.log('Creating image HTML for:', imageData.filename);
        
        let imageSrc;
        
        // Use data_url if available, otherwise construct from base64
        if (imageData.data_url) {
            imageSrc = imageData.data_url;
        } else if (imageData.base64 && imageData.mime_type) {
            imageSrc = `data:${imageData.mime_type};base64,${imageData.base64}`;
        } else {
            console.error('No usable image data found for:', imageData.filename);
            return `<div class="image-error">Errore nel caricamento dell'immagine: ${imageData.filename}</div>`;
        }

        return `<div class="chat-image-container loaded">
            <img src="${imageSrc}" alt="${alt}" class="chat-image" 
                 onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'image-error\\'>Errore nel caricamento dell\\'immagine</div>';"
                 onload="console.log('Image loaded successfully: ${imageData.filename}');">
        </div>`;
    }

    addMessage(text, sender, metadata = {}) {
        if (!this.chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.innerHTML = '<img src="LogovAIron.png" alt="vAIron">';
        }

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text markdown-content';

        // Process image URLs with available images from metadata
        const processedText = this.processImageUrls(text, metadata.images);
        console.log('Text after image processing:', processedText);

        // Process markdown if text contains markdown syntax
        if (typeof marked !== 'undefined' && (processedText.includes('*') || processedText.includes('`') || processedText.includes('#') || processedText.includes('!['))) {
            try {
                const markedOptions = {
                    breaks: true,
                    gfm: true,
                    smartLists: true,
                    smartypants: true
                };

                // Add syntax highlighting if hljs is available
                if (typeof hljs !== 'undefined') {
                    markedOptions.highlight = function (code, lang) {
                        try {
                            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                            return hljs.highlight(code, { language }).value;
                        } catch (e) {
                            return code;
                        }
                    };
                }

                // Set marked options
                marked.setOptions(markedOptions);

                const html = marked.parse(processedText);
                messageText.innerHTML = html;

                // Apply syntax highlighting if hljs is available
                if (typeof hljs !== 'undefined') {
                    setTimeout(() => {
                        document.querySelectorAll('pre code').forEach((block) => {
                            try {
                                hljs.highlightElement(block);
                            } catch (e) {
                                console.error('Error highlighting code block:', e);
                            }
                        });
                    }, 0);
                }
            } catch (e) {
                console.error('Error parsing markdown:', e);
                messageText.innerHTML = processedText;
            }
        } else {
            messageText.innerHTML = processedText;
        }

        content.appendChild(messageText);

        // Add timestamp and tools info for bot messages
        if (metadata.timestamp || metadata.tools_used) {
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';

            if (metadata.timestamp) {
                const time = new Date(metadata.timestamp).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                messageTime.innerHTML = `<i class="fas fa-clock"></i> ${time}`;
            }

            content.appendChild(messageTime);

            if (metadata.tools_used && metadata.tools_used.length > 0) {
                const toolsInfo = document.createElement('div');
                toolsInfo.className = 'message-tools';
                toolsInfo.innerHTML = `<i class="fas fa-tools"></i> Strumenti utilizzati: ${metadata.tools_used.join(', ')}`;
                content.appendChild(toolsInfo);
            }
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.chatMessages.appendChild(messageDiv);

        // Enhanced scrolling - ensure we scroll after DOM updates
        requestAnimationFrame(() => {
            this.scrollToBottom();
        });

        // Speak text if text-to-speech is enabled
        if (this.textToSpeechEnabled && sender === 'bot') {
            this.speakText(text);
        }
    }

    // Modified addStreamedMessage to handle images properly
    async addStreamedMessage(text, sender, metadata = {}) {
        if (!this.chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.innerHTML = '<img src="LogovAIron.png" alt="vAIron">';
        }

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text markdown-content';

        // Add empty message text initially
        content.appendChild(messageText);

        // Add timestamp and tools info for bot messages
        if (metadata.timestamp || metadata.tools_used) {
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';

            if (metadata.timestamp) {
                const time = new Date(metadata.timestamp).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                messageTime.innerHTML = `<i class="fas fa-clock"></i> ${time}`;
            }

            content.appendChild(messageTime);

            if (metadata.tools_used && metadata.tools_used.length > 0) {
                const toolsInfo = document.createElement('div');
                toolsInfo.className = 'message-tools';
                toolsInfo.innerHTML = `<i class="fas fa-tools"></i> Strumenti utilizzati: ${metadata.tools_used.join(', ')}`;
                content.appendChild(toolsInfo);
            }
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.chatMessages.appendChild(messageDiv);

        // Scroll to the new message
        this.scrollToBottom();

        // Stream the text character by character with fixed speed (30ms)
        let displayedText = '';
        for (let i = 0; i < text.length; i++) {
            displayedText += text[i];

            // Process images with available metadata
            let processedText = displayedText;
            if (sender === 'bot') {
                processedText = this.processImageUrls(displayedText, metadata.images);
            }

            // Parse markdown if it's a bot message
            if (sender === 'bot' && typeof marked !== 'undefined') {
                try {
                    const markedOptions = {
                        breaks: true,
                        gfm: true,
                        smartypants: true,
                        langPrefix: 'language-'
                    };

                    if (typeof hljs !== 'undefined') {
                        markedOptions.highlight = function (code, lang) {
                            try {
                                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                                return hljs.highlight(code, { language }).value;
                            } catch (e) {
                                return code;
                            }
                        };
                    }

                    marked.setOptions(markedOptions);
                    const html = marked.parse(processedText);
                    messageText.innerHTML = html;

                    // Apply syntax highlighting
                    if (typeof hljs !== 'undefined') {
                        messageText.querySelectorAll('pre code').forEach((block) => {
                            try {
                                hljs.highlightElement(block);
                            } catch (e) {
                                // Ignore highlighting errors during streaming
                            }
                        });
                    }
                } catch (e) {
                    messageText.innerHTML = this.escapeHtml(processedText);
                }
            } else {
                messageText.innerHTML = this.escapeHtml(processedText);
            }

            // Scroll to bottom after each character
            this.scrollToBottom();

            // Fixed typing speed at 30ms
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Final parse and highlighting after streaming is complete
        if (sender === 'bot' && typeof marked !== 'undefined') {
            try {
                const finalProcessedText = this.processImageUrls(text, metadata.images);

                const markedOptions = {
                    breaks: true,
                    gfm: true,
                    smartLists: true,
                    smartypants: true,
                    langPrefix: 'language-'
                };

                if (typeof hljs !== 'undefined') {
                    markedOptions.highlight = function (code, lang) {
                        try {
                            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                            return hljs.highlight(code, { language }).value;
                        } catch (e) {
                            return code;
                        }
                    };
                }

                marked.setOptions(markedOptions);
                const html = marked.parse(finalProcessedText);
                messageText.innerHTML = html;

                // Apply final syntax highlighting
                if (typeof hljs !== 'undefined') {
                    setTimeout(() => {
                        messageText.querySelectorAll('pre code').forEach((block) => {
                            try {
                                hljs.highlightElement(block);
                            } catch (e) {
                                console.error('Error highlighting code block:', e);
                            }
                        });
                    }, 0);
                }
            } catch (e) {
                console.error('Error parsing markdown:', e);
                messageText.innerHTML = this.escapeHtml(text);
            }
        }

        // Speak text if text-to-speech is enabled (for bot messages only)
        if (this.textToSpeechEnabled && sender === 'bot') {
            this.speakText(text);
        }
    }

    startFishAnimation() {
        // Simple fish swimming animation using CSS transforms
        const fishLogo = this.thinkingIndicator.querySelector('img');
        if (fishLogo && typeof gsap !== 'undefined') {
            // Use GSAP for smooth fish animation
            gsap.to(fishLogo, {
                duration: 2,
                y: '+=8',
                x: '+=5',
                rotation: '3deg',
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });

            // Add subtle scale animation
            gsap.to(fishLogo, {
                duration: 3,
                scale: 1.05,
                yoyo: true,
                repeat: -1,
                ease: 'power2.inOut'
            });
        }
    }

    async hideThinkingAnimation() {
        return new Promise((resolve) => {
            try {
                // Clear any active intervals
                if (this.thinkingTextInterval) {
                    clearInterval(this.thinkingTextInterval);
                    this.thinkingTextInterval = null;
                }

                if (this.thinkingProgressInterval) {
                    clearInterval(this.thinkingProgressInterval);
                    this.thinkingProgressInterval = null;
                }

                // Add a small fade out effect
                if (this.thinkingIndicator) {
                    this.thinkingIndicator.style.opacity = '0';

                    // Wait for the fade out to complete
                    setTimeout(() => {
                        // Hide the indicator
                        this.thinkingIndicator.style.display = 'none';

                        // Reset the text element if it exists
                        if (this.thinkingText) {
                            this.thinkingText.classList.remove('changing');
                            this.thinkingText.style.opacity = '';
                            this.thinkingText.style.transform = '';
                        }

                        // Reset state
                        this.isTyping = false;
                        this.sendBtn.disabled = false;

                        resolve();
                    }, 300); // Match this with your CSS transition time
                } else {
                    // If no indicator, just resolve immediately
                    this.isTyping = false;
                    this.sendBtn.disabled = false;
                    resolve();
                }
            } catch (error) {
                console.error('Error in hideThinkingAnimation:', error);
                // Force reset if something goes wrong
                if (this.thinkingIndicator) {
                    this.thinkingIndicator.style.display = 'none';
                }
                this.isTyping = false;
                this.sendBtn.disabled = false;
                resolve(); // Always resolve to prevent unhandled promise rejection
            }
        });
    }

    hideTypingIndicator() {
        this.isTyping = false;
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
        if (this.sendBtn) {
            this.sendBtn.disabled = false;
        }

        // Clear the interval when hiding the typing indicator
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
    }

    scrollToBottom() {
        if (!this.chatMessages) return;

        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 50);

        // Also ensure smooth scrolling behavior
        this.chatMessages.scrollTo({
            top: this.chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    updateCharCount() {
        if (!this.charCount || !this.messageInput) return;

        const count = this.messageInput.value.length;
        const maxLength = 2000;
        const remaining = maxLength - count;

        // Update counter text
        this.charCount.textContent = `${count}/${maxLength}`;

        // Update styling based on remaining characters
        this.charCount.className = 'character-count';

        if (count === 0) {
            this.charCount.style.opacity = '0.5';
        } else if (remaining < 200) {
            this.charCount.classList.add('warning');
            if (remaining < 50) {
                this.charCount.classList.add('error');
            }
        }

        // Disable send button if at max length
        if (count >= maxLength && this.sendBtn) {
            this.sendBtn.disabled = true;
            this.charCount.classList.add('error');
        } else if (this.sendBtn && this.sendBtn.disabled && !this.isTyping) {
            this.sendBtn.disabled = false;
        }
    }

    autoResizeTextarea() {
        if (!this.messageInput) return;

        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateSessionDisplay() {
        if (!this.sessionIdDisplay) return;

        if (this.sessionId) {
            this.sessionIdDisplay.textContent = `Sessione: ${this.sessionId.substring(0, 8)}...`;
        } else {
            this.sessionIdDisplay.textContent = 'Nuova sessione';
        }
    }

    toggleSettings() {
        if (this.settingsPanel) {
            const isOpening = !this.settingsPanel.classList.contains('open');
            this.settingsPanel.classList.toggle('open');
            
            // Disabilita lo scroll del body quando le impostazioni sono aperte
            document.body.style.overflow = isOpening ? 'hidden' : '';
        }
    }

    // FIXED clearChat method - made synchronous and properly working
    clearChat() {
        // Confirm before clearing
        const confirmed = confirm('Sei sicuro di voler cancellare tutta la chat?');
        if (!confirmed) return;

        try {
            // Clear message history and reset session
            this.messageHistory = [];
            this.sessionId = null;

            // Clear the chat messages container with a fade out effect
            if (this.chatMessages) {
                this.chatMessages.style.opacity = '0';
                this.chatMessages.style.transition = 'opacity 0.3s ease';

                // Wait for fade out to complete then restore chat
                setTimeout(() => {
                    // Clear the chat and show welcome message
                    this.chatMessages.innerHTML = `
                        <div class="welcome-message">
                            <div class="welcome-icon">
                                <img src="LogovAIron.png" alt="vAIron">
                            </div>
                            <h2>Benvenuto in vAIron</h2>
                            <p>Il tuo assistente AI intelligente è pronto ad aiutarti. Inizia una conversazione!</p>
                        </div>
                    `;

                    // Reset session ID and update display
                    this.sessionId = null;
                    this.updateSessionDisplay();

                    // Clear local storage
                    this.clearLocalStorage();

                    // Fade back in
                    this.chatMessages.style.opacity = '1';
                    this.chatMessages.style.transition = 'opacity 0.3s ease';

                    // Scroll to top
                    this.chatMessages.scrollTop = 0;
                }, 300);
            }

        } catch (error) {
            console.error('Error clearing chat:', error);

            // Show error message to user
            this.addMessage(
                'Si è verificato un errore durante la cancellazione della chat. Riprova.',
                'bot',
                { isError: true }
            );
        }

        // Close settings panel if open
        if (this.settingsPanel && this.settingsPanel.classList.contains('open')) {
            this.settingsPanel.classList.remove('open');
        }
    }

    changeTheme(theme) {
        document.body.className = theme !== 'default' ? `theme-${theme}` : '';
        localStorage.setItem('vairon-theme', theme);
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    showError(message) {
        this.addMessage(message, 'bot', {
            timestamp: new Date().toISOString(),
            isError: true
        });
    }

    saveToLocalStorage() {
        const data = {
            sessionId: this.sessionId,
            messageHistory: this.messageHistory
        };
        localStorage.setItem('vairon-chat-data', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('vairon-chat-data');
            if (data) {
                const parsed = JSON.parse(data);
                this.sessionId = parsed.sessionId;
                this.messageHistory = parsed.messageHistory || [];

                // Restore chat messages
                if (this.messageHistory.length > 0 && this.chatMessages) {
                    const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
                    if (welcomeMessage) {
                        welcomeMessage.remove();
                    }

                    this.messageHistory.forEach(msg => {
                        this.addMessage(msg.user, 'user');
                        this.addMessage(msg.bot, 'bot', {
                            timestamp: msg.timestamp,
                            tools_used: msg.tools_used,
                            images: msg.images
                        });
                    });
                }

                this.updateSessionDisplay();
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    loadSettings() {
        try {
            // Load theme
            const theme = localStorage.getItem('vairon-theme') || 'default';
            if (this.themeSelect) {
                this.themeSelect.value = theme;
            }
            this.changeTheme(theme);

            // Load chat data
            this.loadFromLocalStorage();
            
            const animationsEnabled = localStorage.getItem('vairon-animations') !== 'false';
            this.toggleAnimations(animationsEnabled);
            document.getElementById('animationsToggle').checked = animationsEnabled;
            
            const autoSave = localStorage.getItem('vairon-auto-save') !== 'false';
            this.toggleAutoSave(autoSave);
            document.getElementById('autoSaveToggle').checked = autoSave;
            
            const highContrast = localStorage.getItem('vairon-high-contrast') === 'true';
            this.toggleHighContrast(highContrast);
            document.getElementById('highContrastToggle').checked = highContrast;
            
            const reduceMotion = localStorage.getItem('vairon-reduce-motion') === 'true';
            this.toggleReduceMotion(reduceMotion);
            document.getElementById('reduceMotionToggle').checked = reduceMotion;
            
            const textToSpeech = localStorage.getItem('vairon-text-to-speech') === 'true';
            this.toggleTextToSpeech(textToSpeech);
            document.getElementById('textToSpeechToggle').checked = textToSpeech;
            
            const textSize = localStorage.getItem('vairon-text-size') || '16';
            this.changeTextSize(textSize);
            if (document.getElementById('textSizeSlider')) {
                document.getElementById('textSizeSlider').value = textSize;
                document.getElementById('textSizeValue').textContent = `${textSize}px`;
            }
            
            const lineHeight = localStorage.getItem('vairon-line-height') || '1.7';
            this.changeLineHeight(lineHeight);
            if (document.getElementById('lineHeightSlider')) {
                document.getElementById('lineHeightSlider').value = lineHeight;
                document.getElementById('lineHeightValue').textContent = lineHeight;
            }
            
            const typingSpeed = localStorage.getItem('vairon-typing-speed') || '30';
            this.changeTypingSpeed(typingSpeed);
            if (document.getElementById('typingSpeedSlider')) {
                document.getElementById('typingSpeedSlider').value = typingSpeed;
                const speedValue = parseInt(typingSpeed);
                let speedLabel = 'Media';
                if (speedValue < 25) speedLabel = 'Lenta';
                else if (speedValue < 50) speedLabel = 'Media';
                else if (speedValue < 75) speedLabel = 'Veloce';
                else speedLabel = 'Molto veloce';
                document.getElementById('typingSpeedValue').textContent = speedLabel;
            }
            
            // Caricare lo stato dei toggle
            const loadToggleState = (id, defaultValue) => {
                const storedValue = localStorage.getItem(`vairon-${id}`);
                const isChecked = storedValue !== null ? storedValue === 'true' : defaultValue;
                const element = document.getElementById(id);
                if (element) {
                    element.checked = isChecked;
                }
                return isChecked;
            };
            
            this.toggleAnimations(loadToggleState('animations', true));
            this.toggleAutoSave(loadToggleState('auto-save', true));
            this.toggleHighContrast(loadToggleState('high-contrast', false));
            this.toggleReduceMotion(loadToggleState('reduce-motion', false));
            this.toggleTextToSpeech(loadToggleState('text-to-speech', false));
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    clearLocalStorage() {
        localStorage.removeItem('vairon-chat-data');
    }

    typeWriter(element, text, speed = 50) {
        if (!element) return;

        let i = 0;
        element.innerHTML = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += this.escapeHtml(text.charAt(i));
                i++;
                this.scrollToBottom();
            } else {
                clearInterval(timer);
                this.scrollToBottom(); // Final scroll after completion
            }
        }, speed);
    }

    typeWriterAsync(element, text, speed = 50) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }

            let i = 0;
            element.innerHTML = '';
            const timer = setInterval(() => {
                if (i < text.length) {
                    element.innerHTML += this.escapeHtml(text.charAt(i));
                    i++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, speed);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Additional CSS for chat images
const chatImageStyles = `
    .chat-image-container {
        margin: 1rem 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 100%;
    }
    
    .chat-image {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
        cursor: pointer;
    }
    
    .image-caption {
        text-align: center;
        padding: 0.5rem;
        color: #666;
        font-size: 0.9em;
        background-color: #f8f9fa;
        border-top: 1px solid #eee;
    }

    .image-loading {
        padding: 1rem;
        text-align: center;
        color: #666;
        font-style: italic;
    }

    .image-error {
        padding: 1rem;
        text-align: center;
        color: #dc3545;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        font-size: 0.9em;
    }

    .chat-image-container.loaded .image-loading {
        display: none;
    }
`;

// Additional CSS for themes and no-animations
const additionalStyles = `
.theme-dark {
    --bg-primary: #000000;
    --bg-secondary: #111111;
    --bg-tertiary: #222222;
}

.theme-light {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f1f5f9;
    --text-primary: #1e293b;
    --text-secondary: #475569;
    --text-muted: #64748b;
    --border-color: rgba(0, 0, 0, 0.1);
}

.no-animations * {
    animation: none !important;
    transition: none !important;
}

.status-dot.offline {
    background: #ff6b6b;
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}
`;

// Add additional styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = chatImageStyles + additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the chat application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vAIronChat = new vAIronChat();
});

// Initialize service worker if available
if ('serviceWorker' in navigator) {
    // Only register service worker in production (HTTPS) or localhost
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    if (isLocalhost || isHttps) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(error => {
                    console.log('SW registration failed: ', error);
                });
        });
    } else {
        console.log('ServiceWorker registration skipped: requires HTTPS in production');
    }
}