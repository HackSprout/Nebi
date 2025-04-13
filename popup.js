// Load Tracking Status When Popup Opens
chrome.storage.local.get("trackingEnabled", (data) => {
  const toggle = document.getElementById("eyeTrackingToggle");
  if (toggle) {
    toggle.checked = data.trackingEnabled || false;
    updateTrackingLabels(data.trackingEnabled || false);
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
      updateTrackingLabels(isTrackingEnabled);
    } else {
      console.error("Failed to toggle tracking.");
    }
  });
});

// Update Tracking Labels (Voice: ON/OFF, Gaze: ON/OFF)
function updateTrackingLabels(isEnabled) {
  const voiceLabel = document.getElementById("voiceStatus");
  const gazeLabel = document.getElementById("gazeStatus");
  const statusText = isEnabled ? 'ON' : 'OFF';
  const statusColor = isEnabled ? '#4CAF50' : '#8e8e93'; 

  if (voiceLabel) {
    voiceLabel.textContent = statusText;
    voiceLabel.style.color = statusColor;
  }

  if (gazeLabel) {
    gazeLabel.textContent = statusText;
    gazeLabel.style.color = statusColor;
  }
}

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
    const voiceLabel = document.getElementById("voiceStatus");
    if (voiceLabel) voiceLabel.textContent = "ON"; // Optional: Update Voice Status
  });
});

updateTrackingLabels(false);