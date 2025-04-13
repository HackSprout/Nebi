console.log("Nebi Content Script Loaded!");


if (!document.getElementById('gazeDot')) {
  const gazeDot = document.createElement('div');
  gazeDot.id = 'gazeDot';
  gazeDot.style.position = 'absolute';
  gazeDot.style.width = '15px';
  gazeDot.style.height = '15px';
  gazeDot.style.background = 'red';
  gazeDot.style.borderRadius = '50%';
  gazeDot.style.opacity = '0.7';
  gazeDot.style.pointerEvents = 'none';
  gazeDot.style.zIndex = '9999';
  document.body.appendChild(gazeDot);
}


let recognition;
let isListening = false;

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
    try {
      recognition.stop();
      recognition.start(); 
    } catch (e) {
      console.error('Failed restarting recognition:', e.message);
    }
  };
}

function startSpeechRecognition() {
  if (recognition && !isListening) {
    recognition.start();
    isListening = true;
    console.log("Started speech recognition.");
  }
}

function stopSpeechRecognition() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
    console.log("Stopped speech recognition.");
  }
}


function startWebGazer() {
  console.log("[WebGazer] Starting tracking...");
  if (typeof webgazer !== 'undefined') {
    webgazer.setRegression('ridge')
      .setGazeListener((data, timestamp) => {
        if (data) {
          const gazeDot = document.getElementById("gazeDot");
          if (gazeDot) {
            gazeDot.style.left = data.x + "px";
            gazeDot.style.top = data.y + "px";
            gazeDot.style.display = 'block';
          }
        }
      })
      .begin();
  } else {
    console.error("[WebGazer] Not loaded!");
  }
}

function stopWebGazer() {
  console.log("[WebGazer] Stopping tracking...");
  if (typeof webgazer !== 'undefined') {
    webgazer.end();
    const gazeDot = document.getElementById("gazeDot");
    if (gazeDot) gazeDot.style.display = 'none';
  }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("ContentScript received:", message.action);

  if (message.action === "switch_tab") {
    switchTab(message.direction);
  } else if (message.action === "close_tab") {
    closeCurrentTab();
  } else if (message.action === "start_tracking") {
    setupSpeechRecognition();
    startSpeechRecognition();
    startWebGazer();
  } else if (message.action === "stop_tracking") {
    stopSpeechRecognition();
    stopWebGazer();
  } else if (message.action === "start_calibration") {
    console.log("[WebGazer] Starting Calibration...");

    if (typeof webgazer !== 'undefined') {
      const gazeDot = document.getElementById("gazeDot");
      // if (gazeDot) {
      //   gazeDot.style.display = 'none'; 
      // }

      webgazer.pause();
      webgazer.clearData();
      webgazer.showVideo(false);
      webgazer.showPredictionPoints(true);

      showCalibrationOverlay(); 
    }
  }
});


function handleVoiceCommand(command) {
  console.log("Handling voice command:", command);

  if (command.includes('scroll down')) {
    window.scrollBy({ top: 400, behavior: 'smooth' });
  } else if (command.includes('scroll up')) {
    window.scrollBy({ top: -400, behavior: 'smooth' });
  } else if (command.includes('reload')) {
    chrome.runtime.sendMessage({ action: "reload_tab" });
  } else if (command.includes('click')) {
    const event = new MouseEvent('click', {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
      bubbles: true,
      cancelable: true,
      view: window,
    });
    const target = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (target) {
      target.dispatchEvent(event);
      console.log('Clicked at center.');
    }
  } else if (command.includes('switch tab right')) {
    switchTab("right");
  } else if (command.includes('switch tab left')) {
    switchTab("left");
  } else if (command.includes('close tab')) {
    closeCurrentTab();
  } else if (command.includes('calibration')) {
    chrome.runtime.sendMessage({ action: "start_calibration" });
  }
}


function switchTab(direction) {
  chrome.runtime.sendMessage({ action: "switch_tab", direction: direction });
}

function closeCurrentTab() {
  chrome.runtime.sendMessage({ action: "close_tab" });
}


window.addEventListener('load', () => {
  console.log("[ContentScript] Page loaded. Restarting Speech Recognition...");

  setupSpeechRecognition();
  startSpeechRecognition();
});


function showCalibrationOverlay() {
  if (document.getElementById('calibrationOverlay')) {
    console.log('Calibration overlay already exists.');
    return;
  }

  console.log("[Calibration] Starting overlay...");

  const overlay = document.createElement('div');
  overlay.id = 'calibrationOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';  
  overlay.style.zIndex = '9999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  document.body.appendChild(overlay);

  const positions = [
    { top: '10%', left: '10%' }, { top: '10%', left: '50%' }, { top: '10%', right: '10%' },
    { top: '50%', left: '10%' }, { top: '50%', left: '50%' }, { top: '50%', right: '10%' },
    { bottom: '10%', left: '10%' }, { bottom: '10%', left: '50%' }, { bottom: '10%', right: '10%' }
  ];

  let currentDotIndex = 0;
  let currentDot = null;

  function showNextDot() {
    if (currentDot) {
      currentDot.remove(); 
    }

    if (currentDotIndex >= positions.length) {
      finishCalibration();
      return;
    }

    const pos = positions[currentDotIndex];
    const dot = document.createElement('div');
    dot.className = 'calibrationDot';
    dot.style.position = 'absolute';
    dot.style.width = '30px';
    dot.style.height = '30px';
    dot.style.backgroundColor = 'red';
    dot.style.borderRadius = '50%';
    dot.style.cursor = 'pointer';
    dot.style.zIndex = '10000000';  

    for (const [key, value] of Object.entries(pos)) {
      dot.style[key] = value;
    }
    dot.style.transform = 'translate(-50%, -50%)';

    dot.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      console.log(`[Calibration] Click recorded at: (${x}, ${y})`);
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
  console.log("%c[Calibration] Complete!", "color: lightgreen; font-size: 16px");

  const gazeDot = document.getElementById("gazeDot");
  if (gazeDot) {
    gazeDot.style.display = 'block';
  }

  if (typeof webgazer !== 'undefined') {
    webgazer.showPredictionPoints(false); 
    webgazer.resume();                    
  }

  if (recognition) {
    console.log("[Calibration] Restarting Speech Recognition...");
    try {
      recognition.stop();
      recognition.start();
    } catch (e) {
      console.error('Failed restarting recognition after calibration:', e.message);
    }
  }
}


