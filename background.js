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

  if (message.action === "switch_tab") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        const activeTab = activeTabs[0];
        const activeIndex = tabs.findIndex(tab => tab.id === activeTab.id);
  
        let newTabId = null;
  
        if (message.direction === "right" && activeIndex < tabs.length - 1) {
          newTabId = tabs[activeIndex + 1].id;
        } else if (message.direction === "left" && activeIndex > 0) {
          newTabId = tabs[activeIndex - 1].id;
        }
  
        if (newTabId) {
          chrome.tabs.update(newTabId, { active: true }, () => {
            chrome.tabs.reload(newTabId);
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
        chrome.tabs.reload(tabs[0].id);
      }
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^https?:/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["webgazer.js", "contentScript.js"]
    }, () => {
      console.log("Nebi: Re-injected scripts after navigation.");

      chrome.storage.local.get("trackingEnabled", (data) => {
        if (data.trackingEnabled) {
          chrome.tabs.sendMessage(tabId, { action: "start_tracking" }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn("Nebi: Could not auto-start tracking after navigation:", chrome.runtime.lastError.message);
            }
          });
        }
      });
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get("trackingEnabled", (data) => {
    if (data.trackingEnabled) {
      chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        files: ["contentScript.js"]
      }, () => {
        console.log("Nebi: Re-injected contentScript after tab switch.");

        chrome.tabs.sendMessage(activeInfo.tabId, { action: "start_tracking" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Nebi: Could not start tracking on tab switch:", chrome.runtime.lastError.message);
          }
        });
      });
    }
  });
});

