// document.getElementById("start").addEventListener("click", () => {
//   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//     chrome.scripting.executeScript({
//       target: {tabId: tabs[0].id},
//       files: ["contentScript.js"]
//     });
//   });
// });

// document.getElementById("stop").addEventListener("click", () => {
//   alert("Stopping Nebi (feature coming soon)");
// });

document.getElementById("start").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "start_tracking" }, (response) => {
    if (response && response.status === "success") {
      console.log(" Tracking started successfully.");
    } else {
      console.error("Failed to start tracking.");
    }
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "stop_tracking" }, (response) => {
    if (response && response.status === "success") {
      console.log("Tracking stopped successfully.");
    } else {
      console.error("Failed to stop tracking.");
    }
  });
});

document.getElementById("calibrate").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "start_calibration" }, (response) => {
    console.log("Calibration triggered");
  });
});

