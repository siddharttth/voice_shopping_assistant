// Voice Command Shopping Assistant - Main JavaScript File

class VoiceShoppingAssistant {
    constructor() {
        this.shoppingList = [];
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.shouldBeListening = false;
        this.currentLanguage = 'en-US';
        
        // Product categories for smart categorization
        this.categories = {
            dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'ice cream'],
            produce: ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'carrot', 'onion', 'potato'],
            meat: ['chicken', 'beef', 'pork', 'fish', 'lamb', 'turkey'],
            grains: ['bread', 'rice', 'pasta', 'cereal', 'flour', 'oats'],
            beverages: ['water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine'],
            snacks: ['chips', 'cookies', 'crackers', 'nuts', 'popcorn'],
            frozen: ['frozen pizza', 'frozen vegetables', 'ice cream'],
            household: ['soap', 'detergent', 'paper towels', 'toilet paper', 'cleaning supplies']
        };

        // Seasonal suggestions
        this.seasonalItems = {
            summer: ['watermelon', 'ice cream', 'lemonade', 'grill supplies', 'beach items'],
            winter: ['hot chocolate', 'soup ingredients', 'warm clothes', 'holiday items'],
            spring: ['fresh flowers', 'spring vegetables', 'cleaning supplies'],
            fall: ['pumpkin', 'apple cider', 'fall decorations', 'warm spices']
        };

        // Substitute suggestions
        this.substitutes = {
            'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
            'bread': ['tortillas', 'pita bread', 'rice cakes'],
            'sugar': ['honey', 'maple syrup', 'stevia', 'agave'],
            'eggs': ['flax seeds', 'banana', 'applesauce', 'tofu'],
            'butter': ['olive oil', 'coconut oil', 'avocado', 'greek yogurt']
        };

        // Mock product database for search
        this.products = [
            { name: 'Organic Milk', price: 4.99, category: 'dairy', brand: 'Organic Valley' },
            { name: 'Whole Grain Bread', price: 3.49, category: 'grains', brand: 'Nature\'s Own' },
            { name: 'Fresh Apples', price: 2.99, category: 'produce', brand: 'Local Farm' },
            { name: 'Chicken Breast', price: 8.99, category: 'meat', brand: 'Perdue' },
            { name: 'Greek Yogurt', price: 5.49, category: 'dairy', brand: 'Chobani' },
            { name: 'Brown Rice', price: 3.99, category: 'grains', brand: 'Uncle Ben\'s' },
            { name: 'Fresh Spinach', price: 2.49, category: 'produce', brand: 'Local Farm' },
            { name: 'Salmon Fillet', price: 12.99, category: 'meat', brand: 'Wild Alaskan' },
            { name: 'Orange Juice', price: 4.49, category: 'beverages', brand: 'Tropicana' },
            { name: 'Dark Chocolate', price: 6.99, category: 'snacks', brand: 'Lindt' }
        ];

        this.init();
    }

    init() {
        this.loadShoppingList();
        this.setupVoiceRecognition();
        this.attachRecognitionHandlers();
        this.setupEventListeners();
        this.setupNetworkMonitoring();
        this.updateUI();
        this.generateSuggestions();
        this.updateLanguageHints();
        this.speak('Voice shopping assistant ready. Click the microphone to start.');
    }

    setupNetworkMonitoring() {
        // Monitor network status changes
        window.addEventListener('online', () => {
            this.updateStatus('Internet connection restored. Voice recognition available.');
            this.speak('Internet connection restored');
        });

        window.addEventListener('offline', () => {
            this.updateStatus('Internet connection lost. Voice recognition unavailable.');
            this.speak('Internet connection lost');
            if (this.isListening) {
                this.stopListening();
            }
        });
    }

    updateLanguageHints() {
        // Update voice command examples based on selected language
        const languageHints = {
            'en-US': {
                add: 'Try: "add milk", "buy bread", "need eggs"',
                remove: 'Try: "remove milk", "delete apples"',
                search: 'Try: "find milk", "search for bread"',
                clear: 'Try: "clear list", "empty list"'
            },
            'es-ES': {
                add: 'Try: "añadir leche", "comprar pan", "necesito huevos"',
                remove: 'Try: "eliminar leche", "borrar manzanas"',
                search: 'Try: "buscar leche", "encontrar pan"',
                clear: 'Try: "limpiar lista", "vaciar lista"'
            },
            'fr-FR': {
                add: 'Try: "acheter lait", "ajouter pain", "j\'ai besoin d\'œufs"',
                remove: 'Try: "supprimer lait", "enlever pommes"',
                search: 'Try: "trouver lait", "chercher pain"',
                clear: 'Try: "vider liste", "effacer liste"'
            },
            'de-DE': {
                add: 'Try: "kaufen Milch", "hinzufügen Brot", "brauche Eier"',
                remove: 'Try: "entfernen Milch", "löschen Äpfel"',
                search: 'Try: "finden Milch", "suchen Brot"',
                clear: 'Try: "Liste leeren", "Liste löschen"'
            },
            'hi-IN': {
                add: 'Try: "खरीदना दूध", "जोड़ना रोटी", "चाहिए अंडे"',
                remove: 'Try: "हटाना दूध", "मिटाना सेब"',
                search: 'Try: "ढूंढना दूध", "खोजना रोटी"',
                clear: 'Try: "सूची साफ़ करना", "सूची खाली करना"'
            }
        };

        const hints = languageHints[this.currentLanguage] || languageHints['en-US'];
        
        // Update status with language-specific hints
        if (!this.isListening) {
            this.updateStatus(`Ready to listen in ${this.getLanguageName(this.currentLanguage)}. ${hints.add}`);
        }
    }

    getLanguageName(code) {
        const languages = {
            'en-US': 'English',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German',
            'hi-IN': 'Hindi'
        };
        return languages[code] || 'English';
    }

    setupVoiceRecognition() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        // Initialize speech recognition
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = this.currentLanguage;

        // Speech recognition event handlers
        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.updateMicButton(true);
            this.updateStatus('Listening... Speak now!');
            this.speak('Listening');
        };

        this.recognition.onspeechstart = () => {
            console.log('Speech detected');
            this.updateStatus('Speech detected... Keep speaking!');
            this.updateMicButton(true, 'speaking');
        };

        this.recognition.onspeechend = () => {
            console.log('Speech ended');
            this.updateStatus('Processing your command...');
            this.updateMicButton(true, 'processing');
        };

        this.recognition.onresult = (event) => {
            console.log('Speech recognition result:', event);
            if (event.results.length > 0) {
                const result = event.results[0];
                if (result.isFinal) {
                    const command = result[0].transcript.toLowerCase();
                    const confidence = result[0].confidence;
                    console.log(`Command: "${command}" (confidence: ${confidence})`);
                    
                    this.updateStatus(`Heard: "${command}"`);
                    
                    // Only process if confidence is reasonable
                    if (confidence > 0.3) {
                        this.processCommand(command);
                    } else {
                        this.updateStatus('Command unclear. Please try again.');
                        this.speak('Command unclear. Please try again.');
                    }
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let errorMessage = 'Error: ';
            switch(event.error) {
                case 'no-speech':
                    errorMessage += 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone access denied. Please refresh and allow access.';
                    break;
                case 'network':
                    errorMessage += 'Network error. Please check your connection.';
                    break;
                case 'service-not-allowed':
                    errorMessage += 'Speech recognition service not available.';
                    break;
                default:
                    errorMessage += event.error;
            }
            
            this.updateStatus(errorMessage);
            this.speak('Voice recognition error. Please try again.');
            this.isListening = false;
            this.updateMicButton(false);
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.updateMicButton(false);
            this.updateStatus('Ready to listen');
        };

        this.recognition.onnomatch = () => {
            console.log('No speech match found');
            this.updateStatus('No speech match found. Please try again.');
            this.speak('No speech match found. Please try again.');
        };
    }

    setupEventListeners() {
        // Microphone button
        const micBtn = document.getElementById('mic-btn');
        micBtn.addEventListener('click', () => {
            if (!this.isListening) {
                this.startListening();
            } else {
                this.stopListening();
            }
        });

        // Language selector
        const languageSelect = document.getElementById('language-select');
        languageSelect.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            if (this.recognition) {
                this.recognition.lang = this.currentLanguage;
            }
            this.speak(`Language changed to ${e.target.options[e.target.selectedIndex].text}`);
            
            // Update UI language hints
            this.updateLanguageHints();
        });

        // Search button
        const searchBtn = document.getElementById('search-btn');
        searchBtn.addEventListener('click', () => {
            const query = document.getElementById('search-input').value;
            if (query.trim()) {
                this.searchProducts(query);
            }
        });

        // Search input enter key
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query.trim()) {
                    this.searchProducts(query);
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'm':
                        e.preventDefault();
                        this.startListening();
                        break;
                    case 's':
                        e.preventDefault();
                        document.getElementById('search-input').focus();
                        break;
                }
            }
        });

        // Debug controls
        const testMicBtn = document.getElementById('test-mic');
        if (testMicBtn) {
            testMicBtn.addEventListener('click', () => this.testMicrophone());
        }

        const debugInfoBtn = document.getElementById('debug-info');
        if (debugInfoBtn) {
            debugInfoBtn.addEventListener('click', () => this.showDebugInfo());
        }

        const retryVoiceBtn = document.getElementById('retry-voice');
        if (retryVoiceBtn) {
            retryVoiceBtn.addEventListener('click', () => this.retryVoiceRecognition());
        }

        const testCommandBtn = document.getElementById('test-command');
        if (testCommandBtn) {
            testCommandBtn.addEventListener('click', () => this.testCommandProcessing());
        }
    }

    startListening() {
        if (!this.recognition || this.isListening) return;
        
        // Check network status first
        if (!navigator.onLine) {
            this.updateStatus('No internet connection. Voice recognition requires internet.');
            this.speak('No internet connection. Please check your network.');
            return;
        }
        
        try {
            // Always create a fresh recognition instance to avoid state issues
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            this.recognition.lang = this.currentLanguage;
            
            // Add network error handling
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                if (event.error === 'network') {
                    this.handleNetworkError();
                    return;
                }
                
                let errorMessage = 'Error: ';
                let shouldRetry = false;
                
                switch(event.error) {
                    case 'no-speech':
                        errorMessage += 'No speech detected. Please try again.';
                        shouldRetry = true;
                        break;
                    case 'audio-capture':
                        errorMessage += 'Microphone access denied. Please allow microphone access.';
                        break;
                    case 'not-allowed':
                        errorMessage += 'Microphone access denied. Please refresh and allow access.';
                        break;
                    case 'service-not-allowed':
                        errorMessage += 'Speech recognition service not available.';
                        break;
                    case 'aborted':
                        errorMessage += 'Speech recognition was aborted.';
                        shouldRetry = true;
                        break;
                    case 'bad-grammar':
                        errorMessage += 'Speech grammar error.';
                        shouldRetry = true;
                        break;
                    case 'language-not-supported':
                        errorMessage += 'Language not supported.';
                        break;
                    default:
                        errorMessage += event.error;
                        shouldRetry = true;
                }
                
                this.updateStatus(errorMessage);
                
                if (shouldRetry) {
                    this.speak('Voice recognition error. Retrying in 3 seconds...');
                    // Auto-retry after 3 seconds for recoverable errors
                    setTimeout(() => {
                        if (this.shouldBeListening) {
                            this.updateStatus('Retrying voice recognition...');
                            this.startListening();
                        }
                    }, 3000);
                } else {
                    this.speak('Voice recognition error. Please try again.');
                }
                
                this.isListening = false;
                this.updateMicButton(false);
            };
            
            // Re-attach other event handlers
            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.isListening = true;
                this.updateMicButton(true);
                this.updateStatus('Listening... Speak now!');
                this.speak('Listening');
            };

            this.recognition.onspeechstart = () => {
                console.log('Speech detected');
                this.updateStatus('Speech detected... Keep speaking!');
                this.updateMicButton(true, 'speaking');
            };

            this.recognition.onspeechend = () => {
                console.log('Speech ended');
                this.updateStatus('Processing your command...');
                this.updateMicButton(true, 'processing');
            };

            this.recognition.onresult = (event) => {
                console.log('Speech recognition result:', event);
                if (event.results.length > 0) {
                    const result = event.results[0];
                    if (result.isFinal) {
                        const command = result[0].transcript.toLowerCase();
                        const confidence = result[0].confidence;
                        console.log(`Command: "${command}" (confidence: ${confidence})`);
                        
                        this.updateStatus(`Heard: "${command}"`);
                        
                        // Always process valid commands, regardless of confidence
                        // Many browsers return 0 confidence even for perfect recognition
                        if (this.isValidCommand(command)) {
                            if (confidence <= 0.1) {
                                this.logConfidenceIssue(command, confidence);
                            }
                            this.processCommand(command);
                        } else {
                            // Only reject if confidence is very low AND command doesn't match patterns
                            if (confidence < 0.05) {
                                this.updateStatus('Command unclear. Please try again.');
                                this.speak('Command unclear. Please try again.');
                            } else {
                                // Try to process anyway - might be a new command pattern
                                console.log(`Attempting to process unrecognized command: "${command}"`);
                                this.processCommand(command);
                            }
                        }
                    }
                }
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                this.isListening = false;
                this.updateMicButton(false);
                this.updateStatus('Ready to listen');
                
                // If it ended unexpectedly while we were listening, try to restart
                if (this.shouldBeListening && this.recognition.state === 'inactive') {
                    console.log('Recognition ended unexpectedly, attempting to restart...');
                    setTimeout(() => {
                        if (this.shouldBeListening) {
                            this.startListening();
                        }
                    }, 1000);
                }
            };

            this.recognition.onnomatch = () => {
                console.log('No speech match found');
                this.updateStatus('No speech match found. Please try again.');
                this.speak('No speech match found. Please try again.');
            };
            
            this.shouldBeListening = true;
            this.recognition.start();
            console.log('Starting speech recognition...');
            
            // Set a timeout to stop listening after 10 seconds if no speech detected
            this.recognitionTimeout = setTimeout(() => {
                if (this.isListening) {
                    this.updateStatus('No speech detected. Stopping...');
                    this.speak('No speech detected. Stopping.');
                    this.stopListening();
                }
            }, 10000);
            
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.showError('Error starting voice recognition. Please try again.');
            this.isListening = false;
            this.updateMicButton(false);
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                // Clear the timeout
                if (this.recognitionTimeout) {
                    clearTimeout(this.recognitionTimeout);
                    this.recognitionTimeout = null;
                }
                
                this.shouldBeListening = false;
                this.recognition.stop();
                console.log('Stopping speech recognition...');
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    }

    attachRecognitionHandlers() {
        if (!this.recognition) return;
        
        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.updateMicButton(true);
            this.updateStatus('Listening... Speak now!');
            this.speak('Listening');
        };

        this.recognition.onspeechstart = () => {
            console.log('Speech detected');
            this.updateStatus('Speech detected... Keep speaking!');
            this.updateMicButton(true, 'speaking');
        };

        this.recognition.onspeechend = () => {
            console.log('Speech ended');
            this.updateStatus('Processing your command...');
            this.updateMicButton(true, 'processing');
        };

        this.recognition.onresult = (event) => {
            console.log('Speech recognition result:', event);
            if (event.results.length > 0) {
                const result = event.results[0];
                if (result.isFinal) {
                    const command = result[0].transcript.toLowerCase();
                    const confidence = result[0].confidence;
                    console.log(`Command: "${command}" (confidence: ${confidence})`);
                    
                    this.updateStatus(`Heard: "${command}"`);
                    
                    // Only process if confidence is reasonable
                    if (confidence > 0.3) {
                        this.processCommand(command);
                    } else {
                        this.updateStatus('Command unclear. Please try again.');
                        this.speak('Command unclear. Please try again.');
                    }
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let errorMessage = 'Error: ';
            switch(event.error) {
                case 'no-speech':
                    errorMessage += 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone access denied. Please refresh and allow access.';
                    break;
                case 'network':
                    errorMessage += 'Network error. Please check your connection.';
                    break;
                case 'service-not-allowed':
                    errorMessage += 'Speech recognition service not available.';
                    break;
                default:
                    errorMessage += event.error;
            }
            
            this.updateStatus(errorMessage);
            this.speak('Voice recognition error. Please try again.');
            this.isListening = false;
            this.updateMicButton(false);
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.updateMicButton(false);
            this.updateStatus('Ready to listen');
            
            // If it ended unexpectedly while we were listening, try to restart
            if (this.shouldBeListening && this.recognition.state === 'inactive') {
                console.log('Recognition ended unexpectedly, attempting to restart...');
                setTimeout(() => {
                    if (this.shouldBeListening) {
                        this.startListening();
                    }
                }, 1000);
            }
        };

        this.recognition.onnomatch = () => {
            console.log('No speech match found');
            this.updateStatus('No speech match found. Please try again.');
            this.speak('No speech match found. Please try again.');
        };
    }

    processCommand(command) {
        console.log('Processing command:', command);
        console.log('Command length:', command.length);
        console.log('Command type:', typeof command);
        
        // Enhanced NLP: Detect add commands and extract item/quantity
        const addPatterns = [
            /^add\s+(\d+)\s+(.+)/i,           // "Add 2 milk"
            /^add\s+(.+)/i,                    // "Add milk"
            /^i\s+need\s+(.+)/i,               // "I need apples"
            /^buy\s+(.+)/i,                    // "Buy bananas"
            /^i\s+want\s+to\s+buy\s+(.+)/i,   // "I want to buy oranges"
            /^get\s+(.+)/i,                    // "Get bread"
            /^purchase\s+(.+)/i,               // "Purchase eggs"
            /^need\s+(.+)/i,                   // "Need milk"
            /^want\s+(.+)/i,                   // "Want cheese"
            // Multilingual patterns
            /^añadir\s+(.+)/i,                 // Spanish: "Añadir leche"
            /^comprar\s+(.+)/i,                // Spanish: "Comprar pan"
            /^acheter\s+(.+)/i,                // French: "Acheter lait"
            /^kaufen\s+(.+)/i,                 // German: "Kaufen Brot"
            /^खरीदना\s+(.+)/i,                 // Hindi: "खरीदना दूध"
        ];
        
        let item = null;
        let qty = 1;
        let commandType = 'unknown';
        
        // Check for add patterns first
        console.log('Checking add patterns for command:', command);
        for (const pattern of addPatterns) {
            const match = command.match(pattern);
            console.log(`Pattern ${pattern}: ${match ? 'MATCH' : 'no match'}`);
            if (match) {
                commandType = 'add';
                const details = match[1] || match[2]; // Handle different group positions
                console.log('Matched details:', details);
                
                // Extract quantity if present (e.g., "2 bottles of water" or "three apples")
                const qtyMatch = details.match(/^(\d+)\s+(.*)/);
                const writtenQtyMatch = details.match(/^(one|two|three|four|five|six|seven|eight|nine|ten)\s+(.*)/i);
                
                if (qtyMatch) {
                    qty = parseInt(qtyMatch[1], 10);
                    item = qtyMatch[2].trim();
                    console.log(`Numeric quantity: ${qty}, Item: ${item}`);
                } else if (writtenQtyMatch) {
                    const writtenNumbers = {
                        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
                    };
                    qty = writtenNumbers[writtenQtyMatch[1].toLowerCase()];
                    item = writtenQtyMatch[2].trim();
                    console.log(`Written quantity: ${qty}, Item: ${item}`);
                } else {
                    item = details.trim();
                    console.log(`Item: ${item}, Default quantity: ${qty}`);
                }
                break;
            }
        }
        
        // If no add pattern found, check other command types
        if (commandType === 'unknown') {
            // Remove items
            if (this.matchesPattern(command, /remove\s+(.+)/i)) {
                commandType = 'remove';
                const match = command.match(/remove\s+(.+)/i);
                item = match[1].trim();
            } else if (this.matchesPattern(command, /delete\s+(.+)/i)) {
                commandType = 'remove';
                const match = command.match(/delete\s+(.+)/i);
                item = match[1].trim();
            } else if (this.matchesPattern(command, /eliminar\s+(.+)/i)) { // Spanish
                commandType = 'remove';
                const match = command.match(/eliminar\s+(.+)/i);
                item = match[1].trim();
            }
            // Search
            else if (this.matchesPattern(command, /find\s+(.+)/i)) {
                commandType = 'search';
                const match = command.match(/find\s+(.+)/i);
                item = match[1].trim();
            } else if (this.matchesPattern(command, /search\s+for\s+(.+)/i)) {
                commandType = 'search';
                const match = command.match(/search\s+for\s+(.+)/i);
                item = match[1].trim();
            } else if (this.matchesPattern(command, /buscar\s+(.+)/i)) { // Spanish
                commandType = 'search';
                const match = command.match(/buscar\s+(.+)/i);
                item = match[1].trim();
            }
            // Clear list
            else if (this.matchesPattern(command, /clear\s+list/i)) {
                commandType = 'clear';
            } else if (this.matchesPattern(command, /empty\s+list/i)) {
                commandType = 'clear';
            } else if (this.matchesPattern(command, /limpiar\s+lista/i)) { // Spanish
                commandType = 'clear';
            }
            // Help
            else if (this.matchesPattern(command, /help/i)) {
                commandType = 'help';
            } else if (this.matchesPattern(command, /ayuda/i)) { // Spanish
                commandType = 'help';
            }
        }
        
        // Execute the command
        console.log(`Executing command type: ${commandType}, Item: ${item}, Quantity: ${qty}`);
        switch (commandType) {
            case 'add':
                if (item) {
                    console.log(`Adding item: ${qty} ${item}`);
                    this.addItem(item, qty);
                    this.speak(`Added ${qty} ${item} to your shopping list`);
                } else {
                    console.log('No item found in command');
                    this.speak('I didn\'t understand what to add. Please try again.');
                    this.updateStatus('Unknown item. Try "Add milk" or "Buy 2 apples"');
                }
                break;
                
            case 'remove':
                if (item) {
                    this.removeItem(item);
                } else {
                    this.speak('I didn\'t understand what to remove. Please try again.');
                    this.updateStatus('Unknown item to remove. Try "Remove milk"');
                }
                break;
                
            case 'search':
                if (item) {
                    this.searchProducts(item);
                } else {
                    this.speak('I didn\'t understand what to search for. Please try again.');
                    this.updateStatus('Unknown search term. Try "Find milk"');
                }
                break;
                
            case 'clear':
                this.clearList();
                break;
                
            case 'help':
                this.showHelp();
                break;
                
            default:
                this.speak(`I didn't understand that command. Try saying "add milk" or "help"`);
                this.updateStatus('Unknown command. Try "Add milk" or "Help"');
        }
    }

    matchesPattern(text, pattern) {
        return pattern.test(text);
    }

    isValidCommand(command) {
        // Check if the command matches any of our known patterns
        const addPatterns = [
            /^add\s+(\d+)\s+(.+)/i,           // "Add 2 milk"
            /^add\s+(.+)/i,                    // "Add milk"
            /^i\s+need\s+(.+)/i,               // "I need apples"
            /^buy\s+(.+)/i,                    // "Buy bananas"
            /^i\s+want\s+to\s+buy\s+(.+)/i,   // "I want to buy oranges"
            /^get\s+(.+)/i,                    // "Get bread"
            /^purchase\s+(.+)/i,               // "Purchase eggs"
            /^need\s+(.+)/i,                   // "Need milk"
            /^want\s+(.+)/i,                   // "Want cheese"
            // Multilingual patterns
            /^añadir\s+(.+)/i,                 // Spanish: "Añadir leche"
            /^comprar\s+(.+)/i,                // Spanish: "Comprar pan"
            /^acheter\s+(.+)/i,                // French: "Acheter lait"
            /^kaufen\s+(.+)/i,                 // German: "Kaufen Brot"
            /^खरीदना\s+(.+)/i,                 // Hindi: "खरीदना दूध"
        ];

        const removePatterns = [
            /^remove\s+(.+)/i,
            /^delete\s+(.+)/i,
            /^eliminar\s+(.+)/i
        ];

        const searchPatterns = [
            /^find\s+(.+)/i,
            /^search\s+for\s+(.+)/i,
            /^buscar\s+(.+)/i
        ];

        const clearPatterns = [
            /^clear\s+list/i,
            /^empty\s+list/i,
            /^limpiar\s+lista/i
        ];

        const helpPatterns = [
            /^help/i,
            /^ayuda/i
        ];

        // Check if command matches any pattern
        const allPatterns = [...addPatterns, ...removePatterns, ...searchPatterns, ...clearPatterns, ...helpPatterns];
        
        for (const pattern of allPatterns) {
            if (pattern.test(command)) {
                return true;
            }
        }
        
        return false;
    }

    addItem(item, quantity = 1) {
        // Check if item already exists
        const existingItem = this.shoppingList.find(listItem => 
            listItem.name.toLowerCase() === item.toLowerCase()
        );

        if (existingItem) {
            existingItem.quantity += quantity;
            this.speak(`Updated quantity of ${item} to ${existingItem.quantity}`);
            this.updateStatus(`Updated: ${existingItem.quantity} ${item}`);
        } else {
            const newItem = {
                id: Date.now(),
                name: item,
                quantity: quantity,
                category: this.categorizeItem(item),
                addedAt: new Date().toISOString()
            };
            this.shoppingList.push(newItem);
            this.speak(`Added ${quantity} ${item} to your shopping list`);
            this.updateStatus(`Added: ${quantity} ${item} (${this.categorizeItem(item)})`);
        }

        this.saveShoppingList();
        this.updateUI();
        this.generateSuggestions();
        
        // Show success animation
        this.showSuccessFeedback();
    }

    showSuccessFeedback() {
        // Flash the shopping list section to show success
        const shoppingSection = document.querySelector('.shopping-section');
        if (shoppingSection) {
            shoppingSection.classList.add('success-flash');
            setTimeout(() => {
                shoppingSection.classList.remove('success-flash');
            }, 500);
        }
    }

    logConfidenceIssue(command, confidence) {
        console.warn(`Low confidence command detected: "${command}" (confidence: ${confidence})`);
        console.log('This might be a browser issue. Processing command anyway...');
        
        // Show user-friendly message
        this.updateStatus(`Processing: "${command}" (confidence was low but command looks valid)`);
    }

    testCommandProcessing() {
        this.updateStatus('Testing command processing...');
        console.log('=== Testing Command Processing ===');
        
        const testCommands = [
            'add milk',
            'add 2 apples',
            'buy bread',
            'need eggs',
            'add three apples',
            'purchase cheese'
        ];
        
        testCommands.forEach((command, index) => {
            setTimeout(() => {
                console.log(`\n--- Test ${index + 1}: "${command}" ---`);
                this.processCommand(command);
            }, index * 1000);
        });
        
        this.speak('Testing command processing with sample commands');
    }

    removeItem(item) {
        const itemIndex = this.shoppingList.findIndex(listItem => 
            listItem.name.toLowerCase() === item.toLowerCase()
        );

        if (itemIndex !== -1) {
            const removedItem = this.shoppingList[itemIndex];
            this.shoppingList.splice(itemIndex, 1);
            this.speak(`Removed ${removedItem.name} from your shopping list`);
            this.saveShoppingList();
            this.updateUI();
        } else {
            this.speak(`I couldn't find ${item} in your shopping list`);
        }
    }

    clearList() {
        if (this.shoppingList.length > 0) {
            this.shoppingList = [];
            this.saveShoppingList();
            this.updateUI();
            this.speak('Shopping list cleared');
        } else {
            this.speak('Your shopping list is already empty');
        }
    }

    categorizeItem(item) {
        const itemLower = item.toLowerCase();
        
        for (const [category, items] of Object.entries(this.categories)) {
            if (items.some(catItem => itemLower.includes(catItem))) {
                return category;
            }
        }
        
        return 'other';
    }

    searchProducts(query) {
        const results = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            product.brand.toLowerCase().includes(query.toLowerCase())
        );

        this.displaySearchResults(results, query);
        
        if (results.length > 0) {
            this.speak(`Found ${results.length} products matching "${query}"`);
        } else {
            this.speak(`No products found matching "${query}"`);
        }
    }

    displaySearchResults(results, query) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="empty-state">No products found for "${query}"</div>`;
            return;
        }

        const resultsHTML = results.map(product => `
            <div class="search-result-item">
                <div class="result-name">${product.name} - ${product.brand}</div>
                <div class="result-price">$${product.price}</div>
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;
    }

    generateSuggestions() {
        const suggestionsContainer = document.getElementById('suggestions');
        const suggestions = [];

        // History-based suggestions
        const historySuggestions = this.getHistorySuggestions();
        if (historySuggestions.length > 0) {
            suggestions.push({
                icon: '🕒',
                text: `Recently added: ${historySuggestions.slice(0, 3).join(', ')}`
            });
        }

        // Seasonal suggestions
        const currentSeason = this.getCurrentSeason();
        const seasonalItems = this.seasonalItems[currentSeason] || [];
        if (seasonalItems.length > 0) {
            suggestions.push({
                icon: '🌞',
                text: `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} essentials: ${seasonalItems.slice(0, 3).join(', ')}`
            });
        }

        // Substitute suggestions based on current list
        const substituteSuggestions = this.getSubstituteSuggestions();
        if (substituteSuggestions.length > 0) {
            suggestions.push({
                icon: '🔄',
                text: `Consider alternatives: ${substituteSuggestions.slice(0, 2).join(', ')}`
            });
        }

        // Render suggestions
        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <span class="suggestion-icon">${suggestion.icon}</span>
                <span class="suggestion-text">${suggestion.text}</span>
            </div>
        `).join('');

        suggestionsContainer.innerHTML = suggestionsHTML;
    }

    getHistorySuggestions() {
        const history = JSON.parse(localStorage.getItem('shoppingHistory') || '[]');
        return history.slice(0, 5);
    }

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    getSubstituteSuggestions() {
        const substitutes = [];
        this.shoppingList.forEach(item => {
            if (this.substitutes[item.name.toLowerCase()]) {
                substitutes.push(...this.substitutes[item.name.toLowerCase()]);
            }
        });
        return [...new Set(substitutes)];
    }

    updateUI() {
        const listContainer = document.getElementById('shopping-list');
        
        if (this.shoppingList.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">Your shopping list is empty. Try saying "add milk" or "add 2 apples"</div>';
            return;
        }

        const listHTML = this.shoppingList.map(item => `
            <div class="list-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-category">${item.category}</div>
                </div>
                <div class="item-quantity">${item.quantity}</div>
                <button class="remove-btn" onclick="app.removeItemById(${item.id})">Remove</button>
            </div>
        `).join('');

        listContainer.innerHTML = listHTML;
    }

    removeItemById(id) {
        const itemIndex = this.shoppingList.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            const removedItem = this.shoppingList[itemIndex];
            this.shoppingList.splice(itemIndex, 1);
            this.speak(`Removed ${removedItem.name} from your shopping list`);
            this.saveShoppingList();
            this.updateUI();
        }
    }

    updateMicButton(listening, state = 'listening') {
        const micBtn = document.getElementById('mic-btn');
        const micText = micBtn.querySelector('.mic-text');
        
        // Remove all state classes
        micBtn.classList.remove('listening', 'speaking', 'processing');
        
        if (listening) {
            if (state === 'speaking') {
                micBtn.classList.add('speaking');
                micText.textContent = 'Speaking...';
            } else if (state === 'processing') {
                micBtn.classList.add('processing');
                micText.textContent = 'Processing...';
            } else {
                micBtn.classList.add('listening');
                micText.textContent = 'Listening...';
            }
        } else {
            micText.textContent = 'Click to Speak';
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
    }

    speak(text) {
        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.currentLanguage;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            this.synthesis.speak(utterance);
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showHelp() {
        const helpText = `
            🎤 Available Voice Commands:

            📝 ADD ITEMS (English):
            - "add milk" or "add 2 apples"
            - "buy bread" or "purchase eggs"
            - "i need apples" or "i want to buy oranges"
            - "get bread" or "want cheese"

            🌍 MULTILINGUAL ADD COMMANDS:
            - Spanish: "añadir leche", "comprar pan"
            - French: "acheter lait"
            - German: "kaufen Brot"
            - Hindi: "खरीदना दूध"

            🗑️ REMOVE ITEMS:
            - "remove milk" or "delete apples"
            - Spanish: "eliminar leche"

            🔍 SEARCH:
            - "find milk" or "search for bread"
            - Spanish: "buscar leche"

            🧹 MANAGE LIST:
            - "clear list" or "empty list"
            - Spanish: "limpiar lista"

            ❓ HELP:
            - "help" or "ayuda" (Spanish)

            ⌨️ KEYBOARD SHORTCUTS:
            - Ctrl+M: Start voice listening
            - Ctrl+S: Focus search box

            💡 TIPS:
            - Speak clearly and wait for "Listening..."
            - Use quantities: "add 3 bananas"
            - Try different phrases: "need milk" works same as "add milk"
        `;
        
        this.speak('Here are the available voice commands');
        alert(helpText);
    }

    testMicrophone() {
        this.updateStatus('Testing microphone access...');
        
        // Check if microphone access is available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    this.updateStatus('Microphone access granted! Testing voice recognition...');
                    this.speak('Microphone access granted');
                    
                    // Stop the stream
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Now test speech recognition
                    this.testSpeechRecognition();
                })
                .catch(error => {
                    console.error('Microphone access error:', error);
                    let errorMsg = 'Microphone access denied: ';
                    switch(error.name) {
                        case 'NotAllowedError':
                            errorMsg += 'Please allow microphone access and refresh the page.';
                            break;
                        case 'NotFoundError':
                            errorMsg += 'No microphone found.';
                            break;
                        case 'NotSupportedError':
                            errorMsg += 'Microphone not supported in this browser.';
                            break;
                        default:
                            errorMsg += error.message;
                    }
                    this.updateStatus(errorMsg);
                    this.speak('Microphone access denied');
                });
        } else {
            this.updateStatus('Microphone access not supported in this browser.');
            this.speak('Microphone not supported');
        }
    }

    testSpeechRecognition() {
        this.updateStatus('Testing speech recognition service...');
        
        try {
            const testRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            testRecognition.lang = 'en-US';
            testRecognition.continuous = false;
            testRecognition.interimResults = false;
            
            testRecognition.onstart = () => {
                this.updateStatus('Speech recognition service is working! Starting test...');
                this.speak('Speech recognition working');
                
                // Stop after 2 seconds
                setTimeout(() => {
                    try {
                        testRecognition.stop();
                    } catch (e) {
                        console.log('Test recognition stopped');
                    }
                }, 2000);
            };
            
            testRecognition.onerror = (event) => {
                console.error('Test recognition error:', event.error);
                this.updateStatus(`Speech recognition error: ${event.error}. This may cause voice issues.`);
                this.speak('Speech recognition has errors');
            };
            
            testRecognition.onend = () => {
                this.updateStatus('Speech recognition test completed. Try using voice commands now.');
                this.speak('Test completed');
            };
            
            testRecognition.start();
            
        } catch (error) {
            console.error('Speech recognition test error:', error);
            this.updateStatus('Speech recognition not available in this browser.');
            this.speak('Speech recognition not available');
        }
    }

    showDebugInfo() {
        const debugInfo = {
            'Browser': navigator.userAgent,
            'Speech Recognition': 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? 'Supported' : 'Not Supported',
            'Speech Synthesis': 'speechSynthesis' in window ? 'Supported' : 'Not Available',
            'Microphone Access': navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'Available' : 'Not Available',
            'Current Language': this.currentLanguage,
            'Recognition State': this.recognition ? this.recognition.state : 'Not Initialized',
            'Is Listening': this.isListening,
            'Local Storage': typeof(Storage) !== 'undefined' ? 'Available' : 'Not Available',
            'HTTPS': window.location.protocol === 'https:' ? 'Yes' : 'No (Required for voice)',
            'Network Status': navigator.onLine ? 'Online' : 'Offline'
        };

        let debugText = 'Debug Information:\n\n';
        for (const [key, value] of Object.entries(debugInfo)) {
            debugText += `${key}: ${value}\n`;
        }

        console.log('Debug Info:', debugInfo);
        alert(debugText);
    }

    // Enhanced error handling for network issues
    handleNetworkError() {
        this.updateStatus('Network error detected. Trying alternative approach...');
        
        // Show retry button
        const retryBtn = document.getElementById('retry-voice');
        if (retryBtn) {
            retryBtn.style.display = 'inline-block';
        }
        
        // Try to restart with different settings
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (e) {
                console.log('Recognition already stopped');
            }
        }
        
        // Wait a bit and try again
        setTimeout(() => {
            this.updateStatus('Retrying with network recovery...');
            this.startListening();
        }, 2000);
    }

    retryVoiceRecognition() {
        this.updateStatus('Manually retrying voice recognition...');
        
        // Hide retry button
        const retryBtn = document.getElementById('retry-voice');
        if (retryBtn) {
            retryBtn.style.display = 'none';
        }
        
        // Reset and try again
        this.shouldBeListening = false;
        this.isListening = false;
        this.updateMicButton(false);
        
        setTimeout(() => {
            this.startListening();
        }, 1000);
    }

    saveShoppingList() {
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
        
        // Save to history for suggestions
        const history = JSON.parse(localStorage.getItem('shoppingHistory') || '[]');
        this.shoppingList.forEach(item => {
            if (!history.includes(item.name.toLowerCase())) {
                history.push(item.name.toLowerCase());
            }
        });
        localStorage.setItem('shoppingHistory', JSON.stringify(history));
    }

    loadShoppingList() {
        const saved = localStorage.getItem('shoppingList');
        if (saved) {
            this.shoppingList = JSON.parse(saved);
        }
    }
}

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Initializing Voice Shopping Assistant...');
            window.app = new VoiceShoppingAssistant();
            
            // Add global debug function
            window.debugVoice = () => {
                if (window.app) {
                    window.app.showDebugInfo();
                }
            };
            
            console.log('Voice Shopping Assistant initialized. Use window.debugVoice() for debugging.');
        });

// Add some sample data for demonstration
if (typeof window !== 'undefined') {
    window.addSampleData = () => {
        if (window.app) {
            window.app.addItem('milk', 2);
            window.app.addItem('bread', 1);
            window.app.addItem('apples', 6);
            window.app.addItem('chicken breast', 2);
        }
    };
}
