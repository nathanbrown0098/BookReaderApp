// Define your Adobe Client ID (get it from Adobe PDF Embed API dashboard)
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f'; // Replace with your client ID

// Initialize Adobe PDF Embed API
let adobeViewer = null;
let annotationManager = null; // Store the annotation manager

// Store highlighted text in a dictionary (this could be on the backend)
let highlightedTextDict = {};

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
    const viewerElement = document.getElementById('pdfViewer');
    
    // Initialize the Adobe PDF Embed API viewer
    adobeDCView = new AdobeDC.View({ clientId: CLIENT_ID, divId: "pdfViewer" });

    adobeDCView.previewFile({
        content: {
            location: {
                url: pdfURL // URL for the uploaded PDF
            }
        },
        metaData: {
            fileName: "Uploaded PDF",
            id: "77c6fa5d-6d74-4104-8349-657c8411a834"
        }
    }, {
        showDownloadPDF: true,
        showPrintPDF: true,
        showLeftHandPanel: false,
        enableAnnotationAPIs: true, // Enable annotation APIs
        includePDFAnnotations: true // Include existing annotations
    });

    // Initialize the annotation manager after embedding
    adobeDCView.previewFile({
        content: {
            location: {
                url: pdfURL
            }
        },
        metaData: {
            fileName: "Uploaded PDF"
        }
    }).then(adobeViewer => {
        adobeViewer.getAnnotationManager().then(manager => {
            annotationManager = manager;
            
            // Listen for updates to annotations (like highlights)
            annotationManager.listen("annotationsUpdated", function(annotations) {
                console.log("Annotations updated:", annotations);
                annotations.forEach(function(annotation) {
                    if (annotation.type === 'Highlight') {
                        console.log("Highlighted text:", annotation.text);
                        
                        // Store the highlighted text in the dictionary (could send to backend)
                        const pageNumber = annotation.pageNumber;
                        highlightedTextDict[pageNumber] = highlightedTextDict[pageNumber] || [];
                        highlightedTextDict[pageNumber].push(annotation.text);

                        // Optional: You can send highlightedTextDict to the backend here
                        // sendHighlightedTextToBackend(highlightedTextDict);
                    }
                });
            });
        });
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

// Initialize everything
const fileInput = document.getElementById('fileInput');
const pageInput = document.getElementById('pageNumberInput');
handleFileUpload(fileInput, embedPDF);
setupNavigation(pageInput);

// Example of sending the highlighted text to the backend (could use an API for this)
function sendHighlightedTextToBackend(data) {
    fetch('/save-highlighted-text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => console.log('Successfully saved highlighted text:', data))
    .catch((error) => console.error('Error saving highlighted text:', error));
}
