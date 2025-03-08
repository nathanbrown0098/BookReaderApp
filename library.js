// Library management functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const bookUploadInput = document.getElementById('bookUpload');
    const booksContainer = document.getElementById('booksContainer');
    const emptyLibraryMessage = document.getElementById('emptyLibraryMessage');
    const searchInput = document.getElementById('searchInput');
    const bookTemplate = document.getElementById('bookTemplate');
    
    // Book library array
    let bookLibrary = [];
    
    // Initialize the library
    initializeLibrary();
    
    // Event Listeners
    bookUploadInput.addEventListener('change', handleBookUpload);
    searchInput.addEventListener('input', handleSearch);
    
    // Initialize the library from localStorage
    function initializeLibrary() {
        console.log("Initializing library");
        // Load books from localStorage
        const savedBooks = localStorage.getItem('pdfBookLibrary');
        if (savedBooks) {
            try {
                bookLibrary = JSON.parse(savedBooks);
                console.log(`Loaded ${bookLibrary.length} books from localStorage`);
                
                // Restore Blob URLs for each book
                bookLibrary.forEach(book => {
                    if (book.blobData && (!book.data || !book.data.startsWith('blob:'))) {
                        try {
                            console.log(`Restoring Blob URL for book: ${book.name}`);
                            const byteCharacters = atob(book.blobData.split(',')[1]);
                            const byteNumbers = new Array(byteCharacters.length);
                            
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: 'application/pdf' });
                            book.data = URL.createObjectURL(blob);
                            console.log(`Successfully created Blob URL: ${book.data}`);
                        } catch (error) {
                            console.error(`Error creating Blob URL for book ${book.name}:`, error);
                            // Keep the base64 data as fallback
                            book.data = book.blobData;
                        }
                    }
                });
                
                renderBookLibrary();
            } catch (error) {
                console.error("Error loading library:", error);
                bookLibrary = [];
                updateEmptyLibraryMessage();
            }
        } else {
            console.log("No books found in localStorage");
            bookLibrary = [];
            updateEmptyLibraryMessage();
        }
    }
    
    // Handle book upload
    function handleBookUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            console.log(`Uploading PDF: ${file.name}, size: ${file.size} bytes`);
            
            // Show loading message
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'loading-message';
            loadingMessage.textContent = 'Uploading PDF...';
            document.body.appendChild(loadingMessage);
            
            try {
                // Create a Blob URL for immediate use
                const blobUrl = URL.createObjectURL(file);
                console.log(`Created Blob URL: ${blobUrl}`);
                
                // Also read as data URL for backup storage
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const blobData = e.target.result; // This is a data URL (base64)
                        console.log(`File read as data URL, length: ${blobData.length}`);
                        
                        // Create a book object
                        const newBook = {
                            id: generateUniqueId(),
                            name: file.name,
                            dateAdded: new Date().toISOString(),
                            data: blobUrl,
                            blobData: blobData, // Store the base64 data for persistence
                            size: file.size
                        };
                        
                        // Add to library
                        bookLibrary.push(newBook);
                        
                        // Save to localStorage
                        saveLibraryToStorage();
                        
                        // Render the updated library
                        renderBookLibrary();
                        
                        console.log(`Book "${file.name}" added to library`);
                    } catch (processError) {
                        console.error("Error processing file data:", processError);
                        alert(`Error processing the PDF file: ${processError.message}`);
                    } finally {
                        // Remove loading message and reset input
                        document.body.removeChild(loadingMessage);
                        bookUploadInput.value = '';
                    }
                };
                
                reader.onerror = function(error) {
                    console.error("Error reading file:", error);
                    alert("Error reading the PDF file. Please try again.");
                    document.body.removeChild(loadingMessage);
                    bookUploadInput.value = '';
                };
                
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error handling file upload:", error);
                alert(`Error handling the PDF file: ${error.message}`);
                document.body.removeChild(loadingMessage);
                bookUploadInput.value = '';
            }
        } else {
            alert('Please upload a valid PDF file.');
        }
    }
    
    // Generate a unique ID for each book
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // Save the library to localStorage
    function saveLibraryToStorage() {
        try {
            console.log(`Saving ${bookLibrary.length} books to localStorage`);
            localStorage.setItem('pdfBookLibrary', JSON.stringify(bookLibrary));
        } catch (error) {
            console.error("Error saving library:", error);
            
            // If the error is due to localStorage size limits, try removing the blobData
            if (error.name === 'QuotaExceededError') {
                alert('Your library is too large to store in browser storage. Some book data may not be saved.');
                
                // Create a smaller version of the library without the large blob data
                const smallerLibrary = bookLibrary.map(book => {
                    const { blobData, ...smallerBook } = book;
                    return smallerBook;
                });
                
                try {
                    localStorage.setItem('pdfBookLibrary', JSON.stringify(smallerLibrary));
                    console.log("Saved smaller version of library without blob data");
                } catch (innerError) {
                    console.error("Still couldn't save library:", innerError);
                }
            }
        }
    }
    
    // Render the book library
    function renderBookLibrary() {
        console.log("Rendering book library");
        // Clear the container except for the empty message
        const children = Array.from(booksContainer.children);
        children.forEach(child => {
            if (child !== emptyLibraryMessage) {
                booksContainer.removeChild(child);
            }
        });
        
        // Update empty library message visibility
        updateEmptyLibraryMessage();
        
        // Render each book
        bookLibrary.forEach(book => {
            const bookElement = createBookElement(book);
            booksContainer.appendChild(bookElement);
        });
    }
    
    // Create a book element from the template
    function createBookElement(book) {
        const bookElement = document.importNode(bookTemplate.content, true).querySelector('.book-card');
        
        // Set book details
        bookElement.dataset.id = book.id;
        bookElement.querySelector('.book-title').textContent = book.name.replace('.pdf', '');
        
        // Format and set the date
        const dateAdded = new Date(book.dateAdded);
        const formattedDate = dateAdded.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        bookElement.querySelector('.date-added').textContent = formattedDate;
        
        // Set thumbnail (placeholder for now)
        const thumbnailElement = bookElement.querySelector('.book-thumbnail');
        thumbnailElement.innerHTML = `<div class="pdf-icon">PDF</div>`;
        
        // Add event listeners to buttons
        const openButton = bookElement.querySelector('.open-book');
        const removeButton = bookElement.querySelector('.remove-book');
        
        openButton.addEventListener('click', () => openBook(book));
        removeButton.addEventListener('click', () => removeBook(book.id));
        
        return bookElement;
    }
    
    // Open a book in the reader
    function openBook(book) {
        console.log(`Opening book: ${book.name}`);
        
        try {
            // Create a simplified book object with just what we need
            const bookForSession = {
                id: book.id,
                name: book.name,
                dateAdded: book.dateAdded
            };
            
            // If we have a blob URL, use it directly
            if (book.data && book.data.startsWith('blob:')) {
                console.log("Using blob URL for opening");
                bookForSession.data = book.data;
            } 
            // If we have base64 data, use that
            else if (book.blobData && book.blobData.startsWith('data:application/pdf')) {
                console.log("Using base64 data for opening");
                bookForSession.data = book.blobData;
            }
            // If we don't have valid data, show an error
            else {
                alert('This book cannot be opened. Please try uploading it again.');
                return;
            }
            
            // Store the simplified book object in sessionStorage
            sessionStorage.setItem('currentBook', JSON.stringify(bookForSession));
            console.log("Book stored in sessionStorage, navigating to reader");
            
            // Navigate to the reader page
            window.location.href = 'reader.html';
        } catch (error) {
            console.error("Error preparing book for opening:", error);
            alert(`Error opening book: ${error.message}. Please try again.`);
        }
    }
    
    // Remove a book from the library
    function removeBook(bookId) {
        if (confirm('Are you sure you want to remove this book from your library?')) {
            console.log(`Removing book with ID: ${bookId}`);
            
            // Find the book to revoke its Blob URL
            const bookToRemove = bookLibrary.find(book => book.id === bookId);
            if (bookToRemove && bookToRemove.data && bookToRemove.data.startsWith('blob:')) {
                console.log(`Revoking Blob URL: ${bookToRemove.data}`);
                URL.revokeObjectURL(bookToRemove.data);
            }
            
            // Filter out the book with the given ID
            bookLibrary = bookLibrary.filter(book => book.id !== bookId);
            
            // Save the updated library
            saveLibraryToStorage();
            
            // Re-render the library
            renderBookLibrary();
        }
    }
    
    // Handle search functionality
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        
        // If search is empty, show all books
        if (!searchTerm) {
            renderBookLibrary();
            return;
        }
        
        // Filter books based on search term
        const filteredBooks = bookLibrary.filter(book => 
            book.name.toLowerCase().includes(searchTerm)
        );
        
        // Clear the container except for the empty message
        const children = Array.from(booksContainer.children);
        children.forEach(child => {
            if (child !== emptyLibraryMessage) {
                booksContainer.removeChild(child);
            }
        });
        
        // Show message if no results
        if (filteredBooks.length === 0) {
            emptyLibraryMessage.style.display = 'block';
            emptyLibraryMessage.querySelector('p').textContent = 'No books match your search.';
        } else {
            emptyLibraryMessage.style.display = 'none';
            
            // Render filtered books
            filteredBooks.forEach(book => {
                const bookElement = createBookElement(book);
                booksContainer.appendChild(bookElement);
            });
        }
    }
    
    // Update empty library message visibility
    function updateEmptyLibraryMessage() {
        if (bookLibrary.length === 0) {
            emptyLibraryMessage.style.display = 'block';
            emptyLibraryMessage.querySelector('p').textContent = 'Your library is empty. Upload a PDF book to get started!';
        } else {
            emptyLibraryMessage.style.display = 'none';
        }
    }
}); 