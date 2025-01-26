// Define your Adobe Client ID (get it from Adobe PDF Embed API dashboard)
const CLIENT_ID = 'd5d01981d6594f918d6526e3c250903f'; // Replace with your client ID

// Initialize Adobe PDF Embed API
let adobeViewer = null;

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
            fileName: "Uploaded PDF"
        }
    }, {
        showDownloadPDF: true,
        showPrintPDF: true,
        showLeftHandPanel: false
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
