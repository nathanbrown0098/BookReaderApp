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

        // Determine the type of PDF data we have
        if (typeof pdfData === 'string') {
            // Handle string data (URL or base64)
            if (pdfData.startsWith('blob:')) {
                console.log("Handling blob URL");
                
                // Use a direct approach with the blob URL
                try {
                    // Create an XMLHttpRequest to get the PDF data
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', pdfData, true);
                    xhr.responseType = 'arraybuffer';
                    
                    xhr.onload = function() {
                        if (this.status === 200) {
                            const arrayBuffer = this.response;
                            console.log("PDF fetched as ArrayBuffer, length:", arrayBuffer.byteLength);
                            
                            // Use the Adobe DC View API to display the PDF
                            adobeDCView.previewFile({
                                content: { promise: Promise.resolve(arrayBuffer) },
                                metaData: {
                                    fileName: fileName || "PDF Book",
                                    id: fileId
                                }
                            }, previewConfig)
                            .then(viewer => {
                                console.log("PDF successfully loaded");
                                adobeViewer = viewer;
                            })
                            .catch(error => {
                                console.error("Error loading PDF:", error);
                                document.getElementById('pdfViewer').innerHTML = 
                                    `<p>Error loading PDF: ${error.message || 'Unknown error'}. Please try again.</p>`;
                            });
                        } else {
                            console.error("XHR error:", this.status);
                            document.getElementById('pdfViewer').innerHTML = 
                                `<p>Error loading PDF: HTTP status ${this.status}. Please try again.</p>`;
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error("XHR network error");
                        document.getElementById('pdfViewer').innerHTML = 
                            `<p>Network error loading PDF. Please try again.</p>`;
                    };
                    
                    xhr.send();
                } catch (fetchError) {
                    console.error("Error fetching blob URL:", fetchError);
                    
                    // Fallback to using the URL directly
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
                        console.log("PDF successfully loaded with fallback method");
                        adobeViewer = viewer;
                    })
                    .catch(error => {
                        console.error("Error loading PDF with fallback method:", error);
                        document.getElementById('pdfViewer').innerHTML = 
                            `<p>Error loading PDF: ${error.message || 'Unknown error'}. Please try uploading the book again.</p>`;
                    });
                }
            } 
            // For data URLs (base64)
            else if (pdfData.startsWith('data:application/pdf')) {
                console.log("Handling data URL");
                try {
                    // Convert base64 to ArrayBuffer
                    const base64 = pdfData.split(',')[1];
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const buffer = bytes.buffer;
                    
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
                        document.getElementById('pdfViewer').innerHTML = 
                            `<p>Error loading PDF: ${error.message || 'Unknown error'}. Please try again.</p>`;
                    });
                } catch (base64Error) {
                    console.error("Error processing base64 data:", base64Error);
                    document.getElementById('pdfViewer').innerHTML = 
                        `<p>Error processing PDF data: ${base64Error.message || 'Unknown error'}. Please try uploading the book again.</p>`;
                }
            }
            // For regular URLs
            else {
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
                    document.getElementById('pdfViewer').innerHTML = 
                        `<p>Error loading PDF: ${error.message || 'Unknown error'}. Please try again.</p>`;
                });
            }
        } 
        // Handle ArrayBuffer data directly
        else if (pdfData instanceof ArrayBuffer) {
            console.log("Handling ArrayBuffer data");
            adobeDCView.previewFile({
                content: { promise: Promise.resolve(pdfData) },
                metaData: {
                    fileName: fileName || "PDF Book",
                    id: fileId
                }
            }, previewConfig)
            .then(viewer => {
                console.log("PDF successfully loaded from ArrayBuffer");
                adobeViewer = viewer;
            })
            .catch(error => {
                console.error("Error loading PDF from ArrayBuffer:", error);
                document.getElementById('pdfViewer').innerHTML = 
                    `<p>Error loading PDF: ${error.message || 'Unknown error'}. Please try again.</p>`;
            });
        }
        // Handle Blob data directly
        else if (pdfData instanceof Blob) {
            console.log("Handling Blob data");
            // Convert Blob to ArrayBuffer
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
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
                    document.getElementById('pdfViewer').innerHTML = 
                        `<p>Error loading PDF: ${error.message || 'Unknown error'}. Please try again.</p>`;
                });
            };
            reader.onerror = function(error) {
                console.error("Error reading Blob:", error);
                document.getElementById('pdfViewer').innerHTML = 
                    `<p>Error reading PDF data: ${error.message || 'Unknown error'}. Please try again.</p>`;
            };
            reader.readAsArrayBuffer(pdfData);
        }
        else {
            console.error("Unsupported PDF data type:", typeof pdfData);
            document.getElementById('pdfViewer').innerHTML = 
                `<p>Error: Unsupported PDF data type. Please try uploading the book again.</p>`;
        }
    } catch (error) {
        console.error("Exception in embedPDF:", error);
        document.getElementById('pdfViewer').innerHTML = 
            `<p>Error initializing PDF viewer: ${error.message || 'Unknown error'}. Please refresh the page and try again.</p>`;
    }
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
                document.getElementById('pdfViewer').innerHTML = 
                    '<p>Error: Invalid book data format. Please return to the library and try opening the book again.</p>';
                // Don't redirect immediately to allow the user to read the error message
                setTimeout(() => {
                    window.location.href = 'library.html';
                }, 3000);
            }
        } catch (error) {
            console.error("Error parsing book from session storage:", error);
            document.getElementById('pdfViewer').innerHTML = 
                `<p>Error loading book: ${error.message || 'Unknown error'}. Redirecting to library...</p>`;
            setTimeout(() => {
                window.location.href = 'library.html';
            }, 3000);
        }
    } else {
        console.log("No book found in session storage, redirecting to library");
        document.getElementById('pdfViewer').innerHTML = 
            '<p>No book selected. Redirecting to library...</p>';
        setTimeout(() => {
            window.location.href = 'library.html';
        }, 1000);
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
