document.getElementById("start").addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ["contentScript.js"]
        });
    });
});

document.getElementById("stop").addEventListener("click", () => {
    // alert("Stopping Nebi (feature coming soon)");
});
