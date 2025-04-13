console.log("Nebi content script loaded!");

let isTracking = false;
let recognition;
let isListening = false;

// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("ContentScript received:", message.action);

  if (message.action === "start_tracking") {
    startTracking();
  } else if (message.action === "stop_tracking") {
    stopTracking();
  } else if (message.action === "start_calibration") {
    showCalibrationOverlay();
  }
});

// Start Eye Tracking
async function startTracking() {
  if (isTracking) return;

  console.log("%cStarting WebGazer tracking...", "color: green; font-size: 14px");

  await webgazer.setRegression('ridge')
    .setGazeListener((data, elapsedTime) => {
      if (data != null) {
        const smoothed = smoothGazePrediction(data);
        updateCursor(smoothed.x, smoothed.y);
      }
    })
    .begin();

  webgazer.showVideo(false).showPredictionPoints(true);

  setupSpeechRecognition();
  startSpeechRecognition();

  createCursor(); // Ensure cursor exists

  isTracking = true;
}

// Stop Eye Tracking
function stopTracking() {
  if (!isTracking) return;

  console.log("%cStopping WebGazer tracking...", "color: red; font-size: 14px");

  webgazer.pause();
  stopSpeechRecognition();

  isTracking = false;
}

// Smooth Gaze Points
let lastPredictions = [];

function smoothGazePrediction(prediction) {
  lastPredictions.push(prediction);
  if (lastPredictions.length > 5) {
    lastPredictions.shift();
  }

  const avgX = lastPredictions.reduce((sum, p) => sum + p.x, 0) / lastPredictions.length;
  const avgY = lastPredictions.reduce((sum, p) => sum + p.y, 0) / lastPredictions.length;

  return { x: avgX, y: avgY };
}

// Visual Cursor Creation
function createCursor() {
  if (!document.getElementById('gazeCursor')) {
    const cursor = document.createElement('div');
    cursor.id = 'gazeCursor';
    cursor.style.position = 'absolute';
    cursor.style.width = '10px';
    cursor.style.height = '10px';
    cursor.style.background = 'red';
    cursor.style.borderRadius = '50%';
    cursor.style.zIndex = '9999';
    cursor.style.pointerEvents = 'none';
    document.body.appendChild(cursor);
  }
}

function updateCursor(x, y) {
  const cursor = document.getElementById('gazeCursor');
  if (cursor) {
    cursor.style.left = `${x - 5}px`;
    cursor.style.top = `${y - 5}px`;
  }
}

// Speech Recognition Setup
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('Speech Recognition not supported.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log('Heard:', transcript);
    handleVoiceCommand(transcript);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  
    if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
      console.log('Restarting speech recognition due to error:', event.error);
      recognition.stop();
      recognition.start();
    }
  };
}

function startSpeechRecognition() {
  if (recognition && !isListening) {
    recognition.start();
    isListening = true;
  }
}

function stopSpeechRecognition() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

// Handle Voice Commands
function handleVoiceCommand(command) {
  if (command.includes('click')) {
    simulateClickAtGaze();
  } else if (command.includes('scroll down')) {
    window.scrollBy({ top: 400, behavior: 'smooth' });
  } else if (command.includes('scroll up')) {
    window.scrollBy({ top: -400, behavior: 'smooth' });
  } else if (command.includes('stop')) {
    stopTracking();
  } else if (command.includes('switch tab right')) {
    switchTab("right");
  } else if (command.includes('switch tab left')) {
    switchTab("left");
  } else if (command.includes('close this tab')) {
    closeCurrentTab();
  }
}

// Simulate Click at Current Gaze
function simulateClickAtGaze() {
  webgazer.getCurrentPrediction().then((prediction) => {
    if (prediction) {
      const event = new MouseEvent('click', {
        clientX: prediction.x,
        clientY: prediction.y,
        bubbles: true,
        cancelable: true,
        view: window,
      });
      const target = document.elementFromPoint(prediction.x, prediction.y);
      if (target) {
        target.dispatchEvent(event);
        console.log('Clicked at gaze:', prediction.x, prediction.y);
      }
    }
  });
}

// Show Calibration Overlay
function showCalibrationOverlay() {
    if (document.getElementById('calibrationOverlay')) {
      console.log('Calibration overlay already exists.');
      return;
    }
  
    const overlay = document.createElement('div');
    overlay.id = 'calibrationOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '999999';
    document.body.appendChild(overlay);
  
    const positions = [
      { top: '5%', left: '5%' },    // Top Left
      { top: '5%', left: '50%' },   // Top Middle
      { top: '5%', right: '5%' },   // Top Right
      { top: '50%', left: '5%' },   // Middle Left
      { top: '50%', left: '50%' },  // Center
      { top: '50%', right: '5%' },  // Middle Right
      { bottom: '5%', left: '5%' }, // Bottom Left
      { bottom: '5%', left: '50%' },// Bottom Middle
      { bottom: '5%', right: '5%' } // Bottom Right
    ];
  
    let currentDotIndex = 0;
    let currentDot = null;
  
    function showNextDot() {
      if (currentDot) {
        currentDot.remove();  // Remove old dot
      }
  
      if (currentDotIndex >= positions.length) {
        finishCalibration();
        return;
      }
  
      const pos = positions[currentDotIndex];
      const dot = document.createElement('div');
      dot.className = 'calibrationDot';
      dot.style.position = 'absolute';
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.backgroundColor = 'red';
      dot.style.borderRadius = '50%';
      dot.style.cursor = 'pointer';
      dot.style.zIndex = '1000000';
  
      for (const [key, value] of Object.entries(pos)) {
        dot.style[key] = value;
      }
      dot.style.transform = 'translate(-50%, -50%)'; // Center the dot
  
      dot.addEventListener('click', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        console.log(`Calibration click recorded at: (${x}, ${y})`);
        webgazer.recordScreenPosition(x, y, 'click');
        currentDotIndex++;
        showNextDot();
      });
  
      overlay.appendChild(dot);
      currentDot = dot;
    }
  
    showNextDot();
  }
  
  function finishCalibration() {
    const overlay = document.getElementById('calibrationOverlay');
    if (overlay) {
      overlay.remove();
    }
    console.log("%cCalibration complete!", "color: lightgreen; font-size: 16px");
  }
  

// Tab Control Functions
function switchTab(direction) {
  chrome.runtime.sendMessage({ action: "switch_tab", direction: direction });
}

function closeCurrentTab() {
  chrome.runtime.sendMessage({ action: "close_tab" });
}
