chrome.storage.local.get("trackingEnabled", (data) => {
  const toggle = document.getElementById("eyeTrackingToggle");
  if (toggle) {
    toggle.checked = data.trackingEnabled || false;
    updateTrackingLabels(data.trackingEnabled || false);
  }
});

document.addEventListener('DOMContentLoaded', function() {
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

    document.querySelector('.about-card').addEventListener('click', () => {
        window.location.href = 'about.html';
    });

    document.querySelector('.command-card').addEventListener('click', () => {
        window.location.href = 'commands.html';
    });
});

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

document.getElementById("calibrate-button").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "start_calibration" }, (response) => {
    console.log("Calibration triggered.");
    window.close();
  });
});

document.getElementById("enableVoice").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "start_voice_commands" }, (response) => {
    console.log("Voice command listening started.");
    const voiceLabel = document.getElementById("voiceStatus");
    if (voiceLabel) voiceLabel.textContent = "ON"; 
  });
});

updateTrackingLabels(false);