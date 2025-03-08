// Define your Adobe Client ID
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f';

// Handle file upload
function handleFileUpload(fileInput, embedPDF) {
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const fileURL = URL.createObjectURL(file);
            embedPDF(fileURL);
        } else {
            alert('Please upload a valid PDF file.');
        }
    });
}

// Embed the PDF into the viewer
function embedPDF(pdfURL) {   
    const adobeDCView = new AdobeDC.View({ clientId: CLIENT_ID, divId: "pdfViewer" });
    adobeDCView.previewFile({
        content: {
            location: {
                url: pdfURL
            }
        },
        metaData: {
            fileName: "Uploaded PDF"
        }
    }, {
        showDownloadPDF: true,
        showPrintPDF: true
    });
}

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

// Initialize everything
const fileInput = document.getElementById('fileInput');
handleFileUpload(fileInput, embedPDF);

const pageInput = document.getElementById('pageNumberInput');
setupNavigation(pageInput);
initializeUI();
