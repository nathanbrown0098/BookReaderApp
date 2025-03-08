// Define your Adobe Client ID
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f';

// Global variable for the Adobe viewer
let adobeViewer = null;

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

// Embed the PDF into the viewer - simple approach that worked before
function embedPDF(pdfURL, fileName) {   
    console.log("Embedding PDF:", fileName);
    
    // Show loading message
    document.getElementById('pdfViewer').innerHTML = '<div class="loading-pdf">Loading PDF...</div>';
    
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
        document.getElementById('pdfViewer').innerHTML = 
            `<p>Error loading PDF: ${error.message || 'Unknown error'}. <a href="library.html">Return to library</a></p>`;
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

// Load book from session storage - simplified approach
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
            
            // Use the URL directly - this was working before
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
