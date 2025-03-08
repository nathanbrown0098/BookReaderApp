// Define your Adobe Client ID
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f';

// Global variable for the Adobe viewer
let adobeViewer = null;
let adobeDCView = null;

// Setup page navigation
function setupNavigation(pageInput) {
    pageInput.addEventListener('input', function() {
        const pageNumber = parseInt(pageInput.value, 10);
        if (!isNaN(pageNumber)) {
            goToPage(pageNumber);
        }
    });
}

// Jump to a specific page
function goToPage(pageNumber) {
    if (adobeViewer) {
        adobeViewer.gotoPage(pageNumber);
    }
}

// Embed the PDF into the viewer
function embedPDF(pdfData, fileName) {   
    console.log("Embedding PDF:", fileName);
    
    // Make sure Adobe DC View is loaded
    if (!window.AdobeDC) {
        console.error("Adobe DC View SDK is not loaded yet");
        document.getElementById('pdfViewer').innerHTML = '<p>Error: Adobe PDF Viewer failed to load. Please refresh the page and try again.</p>';
        return;
    }

    try {
        // Initialize the Adobe DC View if not already initialized
        if (!adobeDCView) {
            adobeDCView = new AdobeDC.View({
                clientId: CLIENT_ID,
                divId: "pdfViewer"
            });
        }

        // Create a unique file ID
        const fileId = Date.now().toString();

        // Show loading message
        document.getElementById('pdfViewer').innerHTML = '<div class="loading-pdf">Loading PDF...</div>';

        // Preview configuration
        const previewConfig = {
            showDownloadPDF: true,
            showPrintPDF: true,
            showAnnotationTools: false,
            enableFormFilling: false
        };

        // DIRECT APPROACH: If we have a Blob object, use it directly
        if (pdfData instanceof Blob) {
            console.log("Handling direct Blob data");
            
            // Convert Blob to ArrayBuffer
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                console.log("Blob converted to ArrayBuffer, length:", arrayBuffer.byteLength);
                
                adobeDCView.previewFile({
                    content: { promise: Promise.resolve(arrayBuffer) },
                    metaData: {
                        fileName: fileName || "PDF Book",
                        id: fileId
                    }
                }, previewConfig)
                .then(viewer => {
                    console.log("PDF successfully loaded from Blob");
                    adobeViewer = viewer;
                })
                .catch(error => {
                    console.error("Error loading PDF from Blob:", error);
                    handlePdfLoadError(error);
                });
            };
            
            reader.onerror = function(error) {
                console.error("Error reading Blob:", error);
                handlePdfLoadError(error, "Error reading PDF data");
            };
            
            reader.readAsArrayBuffer(pdfData);
            return;
        }
        
        // If we have a base64 data URL
        if (typeof pdfData === 'string' && pdfData.startsWith('data:application/pdf')) {
            console.log("Handling base64 data URL");
            try {
                // Convert base64 to ArrayBuffer
                const base64 = pdfData.split(',')[1];
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const buffer = bytes.buffer;
                console.log("Base64 converted to ArrayBuffer, length:", buffer.byteLength);
                
                adobeDCView.previewFile({
                    content: { promise: Promise.resolve(buffer) },
                    metaData: {
                        fileName: fileName || "PDF Book",
                        id: fileId
                    }
                }, previewConfig)
                .then(viewer => {
                    console.log("PDF successfully loaded from base64");
                    adobeViewer = viewer;
                })
                .catch(error => {
                    console.error("Error loading PDF from base64:", error);
                    handlePdfLoadError(error);
                });
                
                return;
            } catch (base64Error) {
                console.error("Error processing base64 data:", base64Error);
                handlePdfLoadError(base64Error, "Error processing PDF data");
                return;
            }
        }
        
        // FALLBACK: Try to use a direct URL approach
        if (typeof pdfData === 'string') {
            console.log("Falling back to URL approach:", pdfData.substring(0, 50) + "...");
            
            // For blob URLs, we'll try a different approach
            if (pdfData.startsWith('blob:')) {
                console.log("Handling blob URL with direct approach");
                
                // Create an iframe to display the PDF (this is a fallback method)
                const iframe = document.createElement('iframe');
                iframe.src = pdfData;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                
                const pdfViewer = document.getElementById('pdfViewer');
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(iframe);
                
                console.log("PDF loaded in iframe as fallback");
                return;
            }
            
            // For regular URLs, use the Adobe API
            console.log("Handling regular URL");
            adobeDCView.previewFile({
                content: {
                    location: {
                        url: pdfData
                    }
                },
                metaData: {
                    fileName: fileName || "PDF Book",
                    id: fileId
                }
            }, previewConfig)
            .then(viewer => {
                console.log("PDF successfully loaded from URL");
                adobeViewer = viewer;
            })
            .catch(error => {
                console.error("Error loading PDF from URL:", error);
                handlePdfLoadError(error);
            });
            
            return;
        }
        
        // If we get here, we don't know how to handle the data
        console.error("Unsupported PDF data type:", typeof pdfData);
        document.getElementById('pdfViewer').innerHTML = 
            `<p>Error: Unsupported PDF data type. Please try uploading the book again.</p>`;
            
    } catch (error) {
        console.error("Exception in embedPDF:", error);
        handlePdfLoadError(error, "Error initializing PDF viewer");
    }
}

// Helper function to handle PDF loading errors
function handlePdfLoadError(error, customMessage) {
    const message = customMessage || "Error loading PDF";
    const errorDetails = error ? (error.message || error.toString()) : "Unknown error";
    
    console.error(`${message}: ${errorDetails}`);
    
    // Show error message with retry button
    document.getElementById('pdfViewer').innerHTML = `
        <div class="pdf-error">
            <p>${message}: ${errorDetails}</p>
            <p>Please try again or return to the library.</p>
            <div class="error-buttons">
                <button id="retryButton">Retry</button>
                <button id="backToLibraryButton">Back to Library</button>
            </div>
        </div>
    `;
    
    // Add event listeners to buttons
    document.getElementById('retryButton').addEventListener('click', function() {
        // Reload the current page
        window.location.reload();
    });
    
    document.getElementById('backToLibraryButton').addEventListener('click', function() {
        // Navigate back to the library
        window.location.href = 'library.html';
    });
}

// Word definition functionality
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

// Word list management
function saveWord(word, definition) {
    const savedWords = getSavedWords();
    if (!savedWords.some(item => item.word === word)) {
        savedWords.push({ word, definition });
        localStorage.setItem('savedWords', JSON.stringify(savedWords));
    }
}

function removeWord(word) {
    const savedWords = getSavedWords().filter(item => item.word !== word);
    localStorage.setItem('savedWords', JSON.stringify(savedWords));
}

function getSavedWords() {
    const savedWords = localStorage.getItem('savedWords');
    return savedWords ? JSON.parse(savedWords) : [];
}

// Initialize UI elements
function initializeUI() {
    const wordInput = document.getElementById('wordInput');
    const defineButton = document.getElementById('defineButton');
    const definitionResult = document.getElementById('definitionResult');
    const savedWordsList = document.getElementById('savedWordsList');

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

    // Initial word list update
    updateWordList();
}

// Load book from session storage
function loadBookFromSession() {
    console.log("Loading book from session storage");
    
    // Check if we have a PDF blob in the window variable
    if (window.currentPdfBlob instanceof Blob) {
        console.log("Found PDF blob in window variable");
        const bookInfo = sessionStorage.getItem('currentBook');
        let bookName = "PDF Book";
        
        if (bookInfo) {
            try {
                const book = JSON.parse(bookInfo);
                bookName = book.name || bookName;
            } catch (e) {
                console.error("Error parsing book info:", e);
            }
        }
        
        embedPDF(window.currentPdfBlob, bookName);
        return;
    }
    
    const currentBook = sessionStorage.getItem('currentBook');
    
    if (currentBook) {
        try {
            const book = JSON.parse(currentBook);
            console.log("Book found in session storage:", book.name);
            
            // Check if we have the raw PDF data passed via window variable
            if (book.hasRawPdfData && window.currentPdfBlob) {
                console.log("Using raw PDF blob from window variable");
                embedPDF(window.currentPdfBlob, book.name);
                return;
            }
            
            // Check if we have the raw PDF data as a Blob
            if (book.rawPdfData) {
                console.log("Using raw PDF data");
                embedPDF(book.rawPdfData, book.name);
                return;
            }
            
            // Check if the book data is a Blob URL or a base64 string
            if (book.data && book.data.startsWith('blob:')) {
                console.log("Book data is a Blob URL");
                embedPDF(book.data, book.name);
            } else if (book.data && book.data.startsWith('data:application/pdf')) {
                console.log("Book data is a base64 string");
                embedPDF(book.data, book.name);
            } else if (book.blobData && book.blobData.startsWith('data:application/pdf')) {
                console.log("Using blobData instead of data");
                embedPDF(book.blobData, book.name);
            } else {
                console.error("Invalid book data format");
                document.getElementById('pdfViewer').innerHTML = `
                    <div class="pdf-error">
                        <p>Error: Invalid book data format.</p>
                        <p>Please return to the library and try opening the book again.</p>
                        <div class="error-buttons">
                            <button id="backToLibraryButton">Back to Library</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('backToLibraryButton').addEventListener('click', function() {
                    window.location.href = 'library.html';
                });
            }
        } catch (error) {
            console.error("Error parsing book from session storage:", error);
            document.getElementById('pdfViewer').innerHTML = `
                <div class="pdf-error">
                    <p>Error loading book: ${error.message || 'Unknown error'}</p>
                    <p>Please return to the library and try again.</p>
                    <div class="error-buttons">
                        <button id="backToLibraryButton">Back to Library</button>
                    </div>
                </div>
            `;
            
            document.getElementById('backToLibraryButton').addEventListener('click', function() {
                window.location.href = 'library.html';
            });
        }
    } else {
        console.log("No book found in session storage, redirecting to library");
        document.getElementById('pdfViewer').innerHTML = `
            <div class="pdf-error">
                <p>No book selected.</p>
                <p>Please select a book from your library.</p>
                <div class="error-buttons">
                    <button id="backToLibraryButton">Go to Library</button>
                </div>
            </div>
        `;
        
        document.getElementById('backToLibraryButton').addEventListener('click', function() {
            window.location.href = 'library.html';
        });
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, initializing viewer");
    
    // Add loading indicator to PDF viewer
    document.getElementById('pdfViewer').innerHTML = 
        '<div class="loading-pdf">Initializing PDF viewer...</div>';
    
    // Check if Adobe DC View is ready
    if (window.AdobeDC) {
        console.log("Adobe DC SDK is ready");
        initializeAdobeViewer();
    } else {
        console.log("Waiting for Adobe DC SDK to load");
        document.addEventListener('adobe_dc_view_sdk.ready', function() {
            console.log("Adobe DC SDK is now ready");
            initializeAdobeViewer();
        });
    }
    
    function initializeAdobeViewer() {
        loadBookFromSession();
        
        const pageInput = document.getElementById('pageNumberInput');
        setupNavigation(pageInput);
        
        initializeUI();
    }
});
