console.log("Nebi content script loaded!");

let isTracking = false;

let recognition;
let isListening = false;

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

  isTracking = true;
}

function stopTracking() {
  if (!isTracking) return;

  console.log("%cStopping WebGazer tracking...", "color: red; font-size: 14px");
  webgazer.pause(); 
  stopSpeechRecognition();
  isTracking = false;
}

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

const cursor = document.createElement('div');
cursor.style.position = 'absolute';
cursor.style.width = '10px';
cursor.style.height = '10px';
cursor.style.background = 'red';
cursor.style.borderRadius = '50%';
cursor.style.zIndex = '9999';
cursor.style.pointerEvents = 'none';
document.body.appendChild(cursor);

function updateCursor(x, y) {
  cursor.style.left = `${x - 5}px`;
  cursor.style.top = `${y - 5}px`;
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('Speech Recognition not supported in this browser.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log('Heard:', transcript);

    if (transcript.includes('click')) {
      simulateClickAtGaze();
    } else if (transcript.includes('scroll down')) {
      window.scrollBy(0, 100);
    } else if (transcript.includes('scroll up')) {
      window.scrollBy(0, -100);
    } else if (transcript.includes('stop')) {
      stopTracking();
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
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

function showCalibrationOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'calibrationOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.display = 'flex';
  overlay.style.flexWrap = 'wrap';
  overlay.style.justifyContent = 'space-around';
  overlay.style.alignContent = 'space-around';
  overlay.style.zIndex = '999999';
  document.body.appendChild(overlay);

  const points = 9;
  for (let i = 0; i < points; i++) {
    const dot = document.createElement('div');
    dot.className = 'calibrationDot';
    dot.style.width = '20px';
    dot.style.height = '20px';
    dot.style.backgroundColor = 'red';
    dot.style.borderRadius = '50%';
    dot.style.cursor = 'pointer';
    dot.style.margin = '40px';
    dot.dataset.index = i;
    overlay.appendChild(dot);
  }

  const dots = document.querySelectorAll('.calibrationDot');
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      console.log(`Calibration click recorded at: (${x}, ${y})`);

      webgazer.recordScreenPosition(x, y, 'click');

      dot.style.visibility = 'hidden';

      if ([...dots].every(d => d.style.visibility === 'hidden')) {
        finishCalibration();
      }
    });
  });
}

function finishCalibration() {
  const overlay = document.getElementById('calibrationOverlay');
  if (overlay) {
    overlay.remove();
  }
  console.log("%c Calibration complete!", "color: lightgreen; font-size: 16px");
}
