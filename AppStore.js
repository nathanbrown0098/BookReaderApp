import { makeAutoObservable, action } from "mobx";

class AppStore {
    highlightedTextDict = {};

    constructor() {
        makeAutoObservable(this);
    }

    // Action to add highlighted text to the dictionary
    addHighlightedText(pageNumber, text) {
        if (!this.highlightedTextDict[pageNumber]) {
            this.highlightedTextDict[pageNumber] = [];
        }
        this.highlightedTextDict[pageNumber].push(text);
    }

    // Action to send highlighted text to the backend
    sendHighlightedTextToBackend() {
        fetch('/save-highlighted-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.highlightedTextDict),
        })
        .then(response => response.json())
        .then(data => console.log('Successfully saved highlighted text:', data))
        .catch((error) => console.error('Error saving highlighted text:', error));
    }
}

const appStore = new AppStore();
export default appStore;
