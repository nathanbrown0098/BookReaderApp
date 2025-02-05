import { makeAutoObservable, runInAction } from 'https://cdn.skypack.dev/mobx';

// MobX state management (if you're using MobX)
class AnnotationStore {
    highlightedTextDict = {};

    constructor() {
        makeAutoObservable(this); // Automatically make all fields observable and actions for methods
    }

    addHighlight(pageNumber, text) {
        // Ensure that the state mutation is wrapped in a MobX action
        runInAction(() => {
            // Check if the page's highlight array exists, if not, initialize it
            if (!this.highlightedTextDict[pageNumber]) {
                this.highlightedTextDict[pageNumber] = [];
            }
            // Push the highlight text into the array for that page
            this.highlightedTextDict[pageNumber].push(text);
        });
    }
}

const annotationStore = new AnnotationStore();

// Define your Adobe Client ID (get it from Adobe PDF Embed API dashboard)
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f'; // Replace with your client ID
const eventOptions = {
    // If no event is passed in listenOn, all annotation events will be received
    listenOn: [
        "ANNOTATION_SELECTED"
    ]
}; 

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
    // Initialize the Adobe PDF Embed API viewer
    var adobeDCView = new AdobeDC.View({ clientId: CLIENT_ID, divId: "pdfViewer" });
    var previewFilePromise = adobeDCView.previewFile({
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
        enableAnnotationAPIs: true, // Enable annotation APIs
        includePDFAnnotations: true // Include existing annotations
    });

    // Initialize the annotation manager
    previewFilePromise.then(adobeViewer => {
        adobeViewer.getAnnotationManager().then(annotationManager => {
            // Listen for updates to annotations (like highlights)
            annotationManager.registerEventListener(
                function(event) { console.log(event.type, event.data) },
                eventOptions 
            );
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
handleFileUpload(fileInput, embedPDF);

const pageInput = document.getElementById('pageNumberInput');
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
