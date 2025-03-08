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
        // Load books from localStorage
        const savedBooks = localStorage.getItem('pdfBookLibrary');
        if (savedBooks) {
            bookLibrary = JSON.parse(savedBooks);
            renderBookLibrary();
        } else {
            bookLibrary = [];
            updateEmptyLibraryMessage();
        }
    }
    
    // Handle book upload
    function handleBookUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            // Create a book object
            const newBook = {
                id: generateUniqueId(),
                name: file.name,
                dateAdded: new Date().toISOString(),
                data: URL.createObjectURL(file)
            };
            
            // Add to library
            bookLibrary.push(newBook);
            
            // Save to localStorage
            saveLibraryToStorage();
            
            // Render the updated library
            renderBookLibrary();
            
            // Reset the file input
            bookUploadInput.value = '';
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
        localStorage.setItem('pdfBookLibrary', JSON.stringify(bookLibrary));
    }
    
    // Render the book library
    function renderBookLibrary() {
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
        // Store the current book in sessionStorage
        sessionStorage.setItem('currentBook', JSON.stringify(book));
        
        // Navigate to the reader page
        window.location.href = 'reader.html';
    }
    
    // Remove a book from the library
    function removeBook(bookId) {
        if (confirm('Are you sure you want to remove this book from your library?')) {
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