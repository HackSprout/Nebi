let trackingEnabled = false; // Global tracking state

chrome.runtime.onInstalled.addListener(() => {
  console.log("Nebi Extension Installed.");
});

// Listen to popup and content script messages
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

  if (message.action === "switch_tab") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        const activeTab = activeTabs[0];
        const activeIndex = tabs.findIndex(tab => tab.id === activeTab.id);

        if (message.direction === "right" && activeIndex < tabs.length - 1) {
          chrome.tabs.update(tabs[activeIndex + 1].id, { active: true }, (tab) => {
            chrome.tabs.reload(tab.id);   // 💥 RELOAD after switching
          });
        } else if (message.direction === "left" && activeIndex > 0) {
          chrome.tabs.update(tabs[activeIndex - 1].id, { active: true }, (tab) => {
            chrome.tabs.reload(tab.id);   // 💥 RELOAD after switching
          });
        }
      });
    });
    return true;
  }

  if (message.action === "close_tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.remove(tabs[0].id);
      }
    });
    return true;
  }

  if (message.action === "reload_tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.reload(tabs[0].id);  // 💥 Reload active tab
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
      files: ["contentScript.js"]
    }, () => {
      console.log("Nebi: Re-injected content script after reload.");

      chrome.storage.local.get("trackingEnabled", (data) => {
        if (data.trackingEnabled) {
          chrome.tabs.sendMessage(tabId, { action: "start_tracking" }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn("Nebi: Could not auto-start tracking after reload:", chrome.runtime.lastError.message);
            }
          });
        }
      });
    });
  }
});
