chrome.runtime.onInstalled.addListener(() => {
    console.log("Nebi Extension Installed.");
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message.action);
  
    if (message.action === "start_tracking" || message.action === "stop_tracking") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: message.action }, (response) => {
            console.log("Content script responded:", response);
            sendResponse({ status: "success", from: "background" });
          });
        } else {
          sendResponse({ status: "error", from: "background" });
        }
      });
  
      return true;
    }
  });
  