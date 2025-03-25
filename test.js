/**
 * PDF Book Reader Testing Utility
 * 
 * This file contains functions to test the functionality of the PDF Book Reader application.
 * It includes tests for both the library and reader components.
 */

// Test configuration
const TEST_CONFIG = {
    // Set to true to enable console logging of test results
    enableLogging: true,
    // Set to true to run tests automatically on page load
    autoRunTests: true,
    // Sample PDF URL for testing (replace with a valid PDF URL if needed)
    samplePdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
};

// Test utility functions
const TestUtils = {
    // Log a message to the console if logging is enabled
    log: function(message, type = 'info') {
        if (TEST_CONFIG.enableLogging) {
            switch(type) {
                case 'success':
                    console.log('%c✓ ' + message, 'color: green; font-weight: bold;');
                    break;
                case 'error':
                    console.error('✗ ' + message);
                    break;
                case 'warning':
                    console.warn('⚠ ' + message);
                    break;
                default:
                    console.log('ℹ ' + message);
            }
        }
    },
    
    // Create a test result element and append it to the document
    displayTestResult: function(testName, passed, message) {
        // Create test result container if it doesn't exist
        let testResultsContainer = document.getElementById('testResults');
        if (!testResultsContainer) {
            testResultsContainer = document.createElement('div');
            testResultsContainer.id = 'testResults';
            testResultsContainer.style.position = 'fixed';
            testResultsContainer.style.top = '10px';
            testResultsContainer.style.right = '10px';
            testResultsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            testResultsContainer.style.padding = '10px';
            testResultsContainer.style.borderRadius = '5px';
            testResultsContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
            testResultsContainer.style.maxHeight = '80vh';
            testResultsContainer.style.overflowY = 'auto';
            testResultsContainer.style.zIndex = '9999';
            
            const heading = document.createElement('h3');
            heading.textContent = 'Test Results';
            heading.style.marginTop = '0';
            testResultsContainer.appendChild(heading);
            
            document.body.appendChild(testResultsContainer);
        }
        
        // Create test result element
        const resultElement = document.createElement('div');
        resultElement.style.marginBottom = '5px';
        resultElement.style.padding = '5px';
        resultElement.style.borderRadius = '3px';
        
        if (passed) {
            resultElement.style.backgroundColor = '#d4edda';
            resultElement.style.color = '#155724';
            resultElement.innerHTML = `✓ ${testName}`;
        } else {
            resultElement.style.backgroundColor = '#f8d7da';
            resultElement.style.color = '#721c24';
            resultElement.innerHTML = `✗ ${testName}: ${message}`;
        }
        
        testResultsContainer.appendChild(resultElement);
    },
    
    // Run a test and display the result
    runTest: function(testName, testFunction) {
        try {
            const result = testFunction();
            if (result === true) {
                this.log(`Test passed: ${testName}`, 'success');
                this.displayTestResult(testName, true);
                return true;
            } else {
                const message = typeof result === 'string' ? result : 'Test failed';
                this.log(`Test failed: ${testName} - ${message}`, 'error');
                this.displayTestResult(testName, false, message);
                return false;
            }
        } catch (error) {
            this.log(`Test error: ${testName} - ${error.message}`, 'error');
            this.displayTestResult(testName, false, error.message);
            return false;
        }
    }
};

// Library page tests
const LibraryTests = {
    // Test if the library page is loaded correctly
    testLibraryPageLoaded: function() {
        const bookUploadInput = document.getElementById('bookUpload');
        const booksContainer = document.getElementById('booksContainer');
        const searchInput = document.getElementById('searchInput');
        
        if (!bookUploadInput) return 'Book upload input not found';
        if (!booksContainer) return 'Books container not found';
        if (!searchInput) return 'Search input not found';
        
        return true;
    },
    
    // Test book upload functionality
    testBookUpload: function() {
        // Create a mock PDF file
        const mockPdfBlob = new Blob(['mock PDF content'], { type: 'application/pdf' });
        const mockFile = new File([mockPdfBlob], 'test.pdf', { type: 'application/pdf' });
        
        // Create a mock file input event
        const mockEvent = { target: { files: [mockFile] } };
        
        // Get the original book count
        const originalBookCount = JSON.parse(localStorage.getItem('pdfBookLibrary') || '[]').length;
        
        // Call the handleBookUpload function
        try {
            // This is a simulation - the actual function would be called by the event listener
            if (typeof handleBookUpload === 'function') {
                handleBookUpload(mockEvent);
                
                // Check if a new book was added
                setTimeout(() => {
                    const newBookCount = JSON.parse(localStorage.getItem('pdfBookLibrary') || '[]').length;
                    if (newBookCount > originalBookCount) {
                        TestUtils.log('Book upload test passed', 'success');
                        TestUtils.displayTestResult('Book Upload', true);
                    } else {
                        TestUtils.log('Book upload test failed - book count did not increase', 'error');
                        TestUtils.displayTestResult('Book Upload', false, 'Book count did not increase');
                    }
                }, 500);
                
                return 'Book upload test initiated - check results after delay';
            } else {
                return 'handleBookUpload function not available for testing';
            }
        } catch (error) {
            return `Error in book upload test: ${error.message}`;
        }
    },
    
    // Test search functionality
    testSearch: function() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return 'Search input not found';
        
        // Store original book display state
        const originalDisplay = document.querySelectorAll('.book-card').length;
        
        // Enter a search term that likely won't match any books
        searchInput.value = 'xyznonexistentbook123';
        
        // Trigger the search
        const event = new Event('input');
        searchInput.dispatchEvent(event);
        
        // Check if search results are filtered
        const filteredDisplay = document.querySelectorAll('.book-card').length;
        
        // Clear the search
        searchInput.value = '';
        searchInput.dispatchEvent(event);
        
        // Check if all books are shown again
        const resetDisplay = document.querySelectorAll('.book-card').length;
        
        if (filteredDisplay === 0 && resetDisplay === originalDisplay) {
            return true;
        } else {
            return `Search test failed: original=${originalDisplay}, filtered=${filteredDisplay}, reset=${resetDisplay}`;
        }
    },
    
    // Run all library tests
    runAll: function() {
        TestUtils.log('Running library tests...', 'info');
        TestUtils.runTest('Library Page Loaded', this.testLibraryPageLoaded);
        // Only run these tests if the library page is loaded
        if (document.getElementById('bookUpload')) {
            TestUtils.runTest('Book Upload', this.testBookUpload);
            TestUtils.runTest('Search Functionality', this.testSearch);
        }
    }
};

// Reader page tests
const ReaderTests = {
    // Test if the reader page is loaded correctly
    testReaderPageLoaded: function() {
        const pdfViewer = document.getElementById('pdfViewer');
        const wordInput = document.getElementById('wordInput');
        const defineButton = document.getElementById('defineButton');
        
        if (!pdfViewer) return 'PDF viewer not found';
        if (!wordInput) return 'Word input not found';
        if (!defineButton) return 'Define button not found';
        
        return true;
    },
    
    // Test PDF loading
    testPdfLoading: function() {
        // Check if we have a PDF loaded
        const pdfViewer = document.getElementById('pdfViewer');
        if (!pdfViewer) return 'PDF viewer not found';
        
        // If we're on the reader page but no book is loaded, try loading a test PDF
        if (!sessionStorage.getItem('currentBook') && typeof embedPDF === 'function') {
            TestUtils.log('No book in session storage, loading test PDF', 'warning');
            
            // Create a test book
            const testBook = {
                id: 'test-book',
                name: 'Test PDF',
                data: TEST_CONFIG.samplePdfUrl
            };
            
            // Store in session storage
            sessionStorage.setItem('currentBook', JSON.stringify(testBook));
            
            // Try to load the PDF
            embedPDF(testBook.data, testBook.name);
            
            return 'Test PDF loading initiated - check viewer';
        }
        
        // Check if Adobe viewer is initialized
        if (typeof adobeViewer !== 'undefined' && adobeViewer !== null) {
            return true;
        } else {
            return 'Adobe viewer not initialized';
        }
    },
    
    // Test word definition functionality
    testWordDefinition: async function() {
        const wordInput = document.getElementById('wordInput');
        const defineButton = document.getElementById('defineButton');
        const definitionResult = document.getElementById('definitionResult');
        
        if (!wordInput || !defineButton || !definitionResult) {
            return 'Word definition elements not found';
        }
        
        // Enter a test word
        wordInput.value = 'test';
        
        // Click the define button
        defineButton.click();
        
        // Wait for the definition to load
        return new Promise((resolve) => {
            setTimeout(() => {
                if (definitionResult.innerHTML.includes('test')) {
                    resolve(true);
                } else {
                    resolve('Definition not loaded correctly');
                }
            }, 2000);
        });
    },
    
    // Test word saving functionality
    testWordSaving: function() {
        // Get current saved words
        const originalWords = JSON.parse(localStorage.getItem('savedWords') || '[]');
        const originalCount = originalWords.length;
        
        // Create a test word and definition
        const testWord = {
            word: 'testword_' + Date.now(),
            definition: {
                word: 'testword',
                phonetic: '/test/',
                meanings: [{
                    partOfSpeech: 'noun',
                    definitions: ['A test word for testing purposes']
                }]
            }
        };
        
        // Save the word
        if (typeof saveWord === 'function') {
            saveWord(testWord.word, testWord.definition);
            
            // Check if the word was saved
            const newWords = JSON.parse(localStorage.getItem('savedWords') || '[]');
            const newCount = newWords.length;
            
            if (newCount > originalCount) {
                // Clean up - remove the test word
                if (typeof removeWord === 'function') {
                    removeWord(testWord.word);
                }
                return true;
            } else {
                return 'Word not saved correctly';
            }
        } else {
            return 'saveWord function not available';
        }
    },
    
    // Run all reader tests
    runAll: function() {
        TestUtils.log('Running reader tests...', 'info');
        TestUtils.runTest('Reader Page Loaded', this.testReaderPageLoaded);
        // Only run these tests if the reader page is loaded
        if (document.getElementById('pdfViewer')) {
            TestUtils.runTest('PDF Loading', this.testPdfLoading);
            TestUtils.runTest('Word Definition', this.testWordDefinition);
            TestUtils.runTest('Word Saving', this.testWordSaving);
        }
    }
};

// Initialize tests based on the current page
document.addEventListener('DOMContentLoaded', function() {
    TestUtils.log('Test script loaded', 'info');
    
    // Add a button to run tests manually
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Tests';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '8px 16px';
    testButton.style.backgroundColor = '#007bff';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', function() {
        // Determine which page we're on and run appropriate tests
        if (document.getElementById('bookUpload')) {
            // We're on the library page
            LibraryTests.runAll();
        } else if (document.getElementById('pdfViewer')) {
            // We're on the reader page
            ReaderTests.runAll();
        } else {
            TestUtils.log('Could not determine current page', 'error');
        }
    });
    
    document.body.appendChild(testButton);
    
    // Auto-run tests if configured
    if (TEST_CONFIG.autoRunTests) {
        setTimeout(function() {
            testButton.click();
        }, 1000);
    }
}); 