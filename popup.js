// Load Tracking Status When Popup Opens
chrome.storage.local.get("trackingEnabled", (data) => {
  const toggle = document.getElementById("eyeTrackingToggle");
  if (toggle) {
    toggle.checked = data.trackingEnabled || false;
    updateTrackingLabels(data.trackingEnabled || false);
  }
});

document.addEventListener('DOMContentLoaded', function() {
    // Handle Eye Tracking Toggle
    document.getElementById("eyeTrackingToggle").addEventListener("change", async (event) => {
        const isTrackingEnabled = event.target.checked;

        try {
            const response = await fetch('http://127.0.0.1:6000/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: isTrackingEnabled ? 'start' : 'stop' })
            });

            if (response.ok) {
                console.log(`Tracking ${isTrackingEnabled ? "started" : "stopped"} successfully.`);
                updateTrackingLabels(isTrackingEnabled);
                chrome.storage.local.set({ trackingEnabled: isTrackingEnabled });  // Save toggle status
            } else {
                console.error('Failed to communicate with backend server.');
            }
        } catch (error) {
            console.error('Error talking to backend:', error);
        }
    });

    // Handle About card click
    document.querySelector('.about-card').addEventListener('click', () => {
        window.location.href = 'about.html';
    });

    // Handle Commands card click
    document.querySelector('.command-card').addEventListener('click', () => {
        window.location.href = 'commands.html';
    });

    // Calibration Button
    document.getElementById("calibrate-button").addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "start_calibration" }, (response) => {
        console.log("Calibration triggered.");
        window.close();
      });
    });

    // Voice Commands Button
    document.getElementById("enableVoice")?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "start_voice_commands" }, (response) => {
        console.log("Voice command listening started.");
        const voiceLabel = document.getElementById("voiceStatus");
        if (voiceLabel) voiceLabel.textContent = "ON"; 
      });
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
