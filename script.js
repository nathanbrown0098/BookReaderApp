/**
 * PDF Book Reader - Reader Page Script
 * 
 * This script handles the PDF viewing and word definition functionality
 * for the reader page of the PDF Book Reader application.
 */

// Adobe PDF Embed API Client ID
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f';

// Global variable for the Adobe viewer instance
let adobeViewer = null;

/**
 * Sets up page navigation functionality
 * @param {HTMLElement} pageInput - The page number input element
 */
function setupNavigation(pageInput) {
    if (!pageInput) return;
    
    pageInput.addEventListener('input', function() {
        const pageNumber = parseInt(pageInput.value, 10);
        if (!isNaN(pageNumber)) {
            goToPage(pageNumber);
        }
    });
}

/**
 * Navigates to a specific page in the PDF
 * @param {number} pageNumber - The page number to navigate to
 */
function goToPage(pageNumber) {
    if (adobeViewer) {
        adobeViewer.gotoPage(pageNumber);
    }
}

/**
 * Embeds a PDF into the viewer
 * @param {string} pdfURL - The URL of the PDF to embed
 * @param {string} fileName - The name of the PDF file
 */
function embedPDF(pdfURL, fileName) {   
    console.log("Embedding PDF:", fileName);
    
    // Show loading message
    const pdfViewer = document.getElementById('pdfViewer');
    if (!pdfViewer) {
        console.error("PDF viewer element not found");
        return;
    }
    
    pdfViewer.innerHTML = '<div class="loading-pdf">Loading PDF...</div>';
    
    try {
        // Initialize the Adobe DC View
        const adobeDCView = new AdobeDC.View({
            clientId: CLIENT_ID,
            divId: "pdfViewer"
        });
        
        // Preview the file
        adobeDCView.previewFile({
            content: {
                location: {
                    url: pdfURL
                }
            },
            metaData: {
                fileName: fileName || "PDF Book"
            }
        }, {
            showDownloadPDF: true,
            showPrintPDF: true
        })
        .then(viewer => {
            console.log("PDF successfully loaded");
            adobeViewer = viewer;
        })
        .catch(error => {
            console.error("Error loading PDF:", error);
            pdfViewer.innerHTML = 
                `<p>Error loading PDF: ${error.message || 'Unknown error'}. <a href="library.html">Return to library</a></p>`;
        });
    } catch (error) {
        console.error("Exception in embedPDF:", error);
        pdfViewer.innerHTML = 
            `<p>Error initializing PDF viewer: ${error.message || 'Unknown error'}. <a href="library.html">Return to library</a></p>`;
    }
}

/**
 * Fetches the definition of a word from the dictionary API
 * @param {string} word - The word to define
 * @returns {Promise<Object>} - The definition object or an error object
 */
async function defineWord(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (!response.ok) {
            throw new Error('Word not found');
        }
        const data = await response.json();
        return formatDefinition(data[0]);
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * Formats the raw definition data into a more usable structure
 * @param {Object} data - The raw definition data
 * @returns {Object} - The formatted definition
 */
function formatDefinition(data) {
    return {
        word: data.word,
        phonetic: data.phonetic || '',
        meanings: data.meanings.map(meaning => ({
            partOfSpeech: meaning.partOfSpeech,
            definitions: meaning.definitions.slice(0, 2).map(def => def.definition)
        }))
    };
}

/**
 * Saves a word and its definition to localStorage
 * @param {string} word - The word to save
 * @param {Object} definition - The definition object
 */
function saveWord(word, definition) {
    const savedWords = getSavedWords();
    if (!savedWords.some(item => item.word === word)) {
        savedWords.push({ word, definition });
        localStorage.setItem('savedWords', JSON.stringify(savedWords));
    }
}

/**
 * Removes a word from the saved words list
 * @param {string} word - The word to remove
 */
function removeWord(word) {
    const savedWords = getSavedWords().filter(item => item.word !== word);
    localStorage.setItem('savedWords', JSON.stringify(savedWords));
}

/**
 * Gets the list of saved words from localStorage
 * @returns {Array} - The list of saved words
 */
function getSavedWords() {
    const savedWords = localStorage.getItem('savedWords');
    return savedWords ? JSON.parse(savedWords) : [];
}

/**
 * Initializes the UI elements for the word definition functionality
 */
function initializeUI() {
    const wordInput = document.getElementById('wordInput');
    const defineButton = document.getElementById('defineButton');
    const definitionResult = document.getElementById('definitionResult');
    const savedWordsList = document.getElementById('savedWordsList');
    
    if (!wordInput || !defineButton || !definitionResult || !savedWordsList) {
        console.error("Word definition UI elements not found");
        return;
    }

    // Define word button click handler
    defineButton.addEventListener('click', async () => {
        const word = wordInput.value.trim();
        if (word) {
            const definition = await defineWord(word);
            if (definition.error) {
                definitionResult.innerHTML = `<p class="error">${definition.error}</p>`;
            } else {
                const definitionHTML = `
                    <h4>${definition.word} ${definition.phonetic}</h4>
                    ${definition.meanings.map(meaning => `
                        <div class="meaning">
                            <p><em>${meaning.partOfSpeech}</em></p>
                            <ol>
                                ${meaning.definitions.map(def => `<li>${def}</li>`).join('')}
                            </ol>
                        </div>
                    `).join('')}
                    <button id="saveWord">Save to My Word List</button>
                `;
                definitionResult.innerHTML = definitionHTML;

                // Add save button handler
                document.getElementById('saveWord').addEventListener('click', () => {
                    saveWord(definition.word, definition);
                    updateWordList();
                });
            }
        }
    });

    // Enter key handler for word input
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            defineButton.click();
        }
    });

    // Initialize word list
    updateWordList();
    
    /**
     * Updates the word list display
     */
    function updateWordList() {
        const savedWords = getSavedWords();
        savedWordsList.innerHTML = savedWords.map(item => `
            <li>
                <span>${item.word}</span>
                <button class="remove-word" data-word="${item.word}">Remove</button>
            </li>
        `).join('');

        // Add remove button handlers
        document.querySelectorAll('.remove-word').forEach(button => {
            button.addEventListener('click', (e) => {
                const word = e.target.dataset.word;
                removeWord(word);
                updateWordList();
            });
        });
    }
}

/**
 * Loads a book from session storage or file input
 */
function loadBookFromSession() {
    console.log("Loading book from session storage");
    
    // Check if we have a direct file upload (for backward compatibility)
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        console.log("Found file input, setting up direct file upload handler");
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                const fileURL = URL.createObjectURL(file);
                embedPDF(fileURL, file.name);
            } else {
                alert('Please upload a valid PDF file.');
            }
        });
    }
    
    // Check for book in session storage (from library)
    const currentBook = sessionStorage.getItem('currentBook');
    if (currentBook) {
        try {
            const book = JSON.parse(currentBook);
            console.log("Book found in session storage:", book.name);
            
            // If the book data is a blob URL, we need to check if it's still valid
            if (book.data && book.data.startsWith('blob:')) {
                console.log("Using book data URL");
                
                // Create a test request to see if the blob URL is valid
                fetch(book.data, { method: 'HEAD' })
                    .then(() => {
                        // If successful, use the blob URL
                        console.log("Blob URL is valid");
                        embedPDF(book.data, book.name);
                    })
                    .catch(error => {
                        console.error("Blob URL is invalid:", error);
                        // If we have blobData as fallback, use that
                        if (book.blobData) {
                            console.log("Falling back to base64 data");
                            embedPDF(book.blobData, book.name);
                        } else {
                            throw new Error('Blob URL is invalid and no fallback data available');
                        }
                    });
                return;
            }
            
            // Use the URL directly if it's not a blob URL
            if (book.data) {
                console.log("Using book data URL");
                embedPDF(book.data, book.name);
                return;
            }
            
            // Fallback to blobData if available
            if (book.blobData) {
                console.log("Using book blob data");
                embedPDF(book.blobData, book.name);
                return;
            }
            
            // If no data found, show error
            console.error("No valid book data found");
            document.getElementById('pdfViewer').innerHTML = 
                `<p>Error: No valid book data found. <a href="library.html">Return to library</a></p>`;
            
        } catch (error) {
            console.error("Error parsing book from session storage:", error);
            document.getElementById('pdfViewer').innerHTML = 
                `<p>Error loading book: ${error.message || 'Unknown error'}. <a href="library.html">Return to library</a></p>`;
        }
    } else {
        console.log("No book found in session storage");
        document.getElementById('pdfViewer').innerHTML = 
            `<p>No book selected. <a href="library.html">Go to library</a> to select a book.</p>`;
    }
}

// Initialize everything when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, initializing viewer");
    
    // Add loading indicator to PDF viewer
    const pdfViewer = document.getElementById('pdfViewer');
    if (pdfViewer) {
        pdfViewer.innerHTML = '<div class="loading-pdf">Initializing PDF viewer...</div>';
    }
    
    // Function to initialize Adobe viewer
    function initializeAdobeViewer() {
        console.log("Initializing Adobe viewer");
        try {
            if (typeof AdobeDC === 'undefined') {
                throw new Error('Adobe DC SDK not loaded');
            }
            
            // Initialize the Adobe DC View
            const adobeDCView = new AdobeDC.View({
                clientId: CLIENT_ID,
                divId: "pdfViewer"
            });
            
            console.log("Adobe DC View initialized successfully");
            loadBookFromSession();
            
            const pageInput = document.getElementById('pageNumberInput');
            setupNavigation(pageInput);
            
            initializeUI();
        } catch (error) {
            console.error("Error initializing Adobe viewer:", error);
            if (pdfViewer) {
                pdfViewer.innerHTML = `
                    <div class="error-message">
                        <p>Error initializing PDF viewer: ${error.message}</p>
                        <p>Please make sure you have a valid Adobe PDF Embed API client ID and try refreshing the page.</p>
                        <a href="library.html">Return to library</a>
                    </div>
                `;
            }
        }
    }
    
    // Check if Adobe DC View is ready
    if (window.AdobeDC) {
        console.log("Adobe DC SDK is ready");
        initializeAdobeViewer();
    } else {
        console.log("Waiting for Adobe DC SDK to load");
        // Add a timeout to prevent infinite waiting
        const timeout = setTimeout(() => {
            console.error("Timeout waiting for Adobe DC SDK");
            if (pdfViewer) {
                pdfViewer.innerHTML = `
                    <div class="error-message">
                        <p>Error: Adobe PDF Embed API failed to load</p>
                        <p>Please check your internet connection and try refreshing the page.</p>
                        <a href="library.html">Return to library</a>
                    </div>
                `;
            }
        }, 10000); // 10 second timeout
        
        document.addEventListener('adobe_dc_view_sdk.ready', function() {
            clearTimeout(timeout);
            console.log("Adobe DC SDK is now ready");
            initializeAdobeViewer();
        });
    }
});
