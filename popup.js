// When the popup loads
chrome.storage.local.get("trackingEnabled", (data) => {
  const toggle = document.getElementById("eyeTrackingToggle");
  if (data.trackingEnabled) {
    toggle.checked = true;
  } else {
    toggle.checked = false;
  }
});


// Eye Tracking Toggle
document.getElementById("eyeTrackingToggle").addEventListener("change", (event) => {
  const isTrackingEnabled = event.target.checked;
  
  chrome.runtime.sendMessage({ 
    action: "toggle_tracking", 
    enabled: isTrackingEnabled 
  }, (response) => {
    if (response && response.status === "success") {
      console.log(`Tracking ${isTrackingEnabled ? "started" : "stopped"} successfully.`);
    } else {
      console.error("Failed to toggle tracking.");
    }
  });
});

// Calibration Button
document.getElementById("calibrate").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "start_calibration" }, (response) => {
    console.log("Calibration triggered.");
  });
});

// Voice Commands Enable Button
document.getElementById("enableVoice").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "start_voice_commands" }, (response) => {
    console.log("Voice command listening started.");
  });
});

// Sensitivity Slider
document.getElementById("sensitivitySlider").addEventListener("input", (event) => {
  chrome.runtime.sendMessage({ action: "update_sensitivity", value: event.target.value }, (response) => {
    console.log(`Sensitivity updated to: ${event.target.value}`);
  });
});
