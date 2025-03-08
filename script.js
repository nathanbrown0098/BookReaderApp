// Define your Adobe Client ID
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f';

// Setup page navigation
function setupNavigation(pageInput) {
    pageInput.addEventListener('input', function() {
        const pageNumber = parseInt(pageInput.value, 10);
        if (!isNaN(pageNumber)) {
            goToPage(pageNumber);
        }
    });
}

// Global variable for the Adobe viewer
let adobeViewer = null;

// Jump to a specific page
function goToPage(pageNumber) {
    if (adobeViewer) {
        adobeViewer.gotoPage(pageNumber);
    }
}

// Embed the PDF into the viewer
function embedPDF(pdfURL, fileName) {   
    // Make sure Adobe DC View is loaded
    if (!window.AdobeDC) {
        console.error("Adobe DC View SDK is not loaded yet");
        return;
    }

    // Initialize the Adobe DC View
    const adobeDCView = new AdobeDC.View({
        clientId: CLIENT_ID,
        divId: "pdfViewer"
    });

    // Create a unique file ID
    const fileId = Date.now().toString();

    // Preview the file
    const previewFilePromise = adobeDCView.previewFile({
        content: {
            location: {
                url: pdfURL
            }
        },
        metaData: {
            fileName: fileName || "PDF Book",
            id: fileId
        }
    }, {
        showDownloadPDF: true,
        showPrintPDF: true,
        showAnnotationTools: true
    });

    // Store the viewer instance
    previewFilePromise.then(viewer => {
        console.log("PDF successfully loaded");
        adobeViewer = viewer;
    }).catch(error => {
        console.error("Error loading PDF:", error);
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
    const currentBook = sessionStorage.getItem('currentBook');
    
    if (currentBook) {
        try {
            const book = JSON.parse(currentBook);
            console.log("Loading book:", book.name);
            
            // Check if the book data is a Blob URL or a base64 string
            if (book.data && book.data.startsWith('blob:')) {
                // It's already a Blob URL, use it directly
                embedPDF(book.data, book.name);
            } else if (book.data && book.data.startsWith('data:application/pdf')) {
                // It's a base64 data URL, use it directly
                embedPDF(book.data, book.name);
            } else {
                console.error("Invalid book data format");
                window.location.href = 'library.html';
            }
        } catch (error) {
            console.error("Error loading book:", error);
            window.location.href = 'library.html';
        }
    } else {
        // If no book in session, redirect to library
        window.location.href = 'library.html';
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, initializing viewer");
    
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
