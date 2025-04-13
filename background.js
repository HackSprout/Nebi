let trackingEnabled = false; // Global tracking state

chrome.runtime.onInstalled.addListener(() => {
  console.log("Nebi Extension Installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message.action);

  if (message.action === "toggle_tracking") {
    trackingEnabled = message.enabled;
    chrome.storage.local.set({ trackingEnabled }); 
  
    chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: trackingEnabled ? "start_tracking" : "stop_tracking"
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn(`Nebi: Could not send to tab ${tab.id}`, chrome.runtime.lastError.message);
          } else {
            console.log(`Nebi: Toggled tracking on tab ${tab.id}`);
          }
        });
      });
    });
    sendResponse({ status: "success", from: "background" });
    return true;
  }
  

  if (
    message.action === "start_calibration" ||
    message.action === "start_voice_commands" ||
    message.action === "update_sensitivity"
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: message.action, value: message.value }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Nebi: Error sending to content script:", chrome.runtime.lastError.message);
          }
          sendResponse({ status: "success", from: "background" });
        });
      } else {
        sendResponse({ status: "error", from: "background" });
      }
    });
    return true;
  }
});

// Auto-reinject after navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^https?:/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["webgazer.js", "contentScript.js"]
    }, () => {
      console.log("Nebi: Re-injected scripts after navigation.");

      if (trackingEnabled) {
        chrome.tabs.sendMessage(tabId, { action: "start_tracking" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Nebi: Could not auto-restart tracking after navigation:", chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
});
