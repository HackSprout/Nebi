console.log("Nebi Content Script Loaded!");



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
      recognition.start();  // Restart automatically if it crashes
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



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("ContentScript received:", message.action);

  if (message.action === "switch_tab") {
    switchTab(message.direction);
  } else if (message.action === "close_tab") {
    closeCurrentTab();
  } else if (message.action === "start_tracking") {
    startTracking();
  } else if (message.action === "stop_tracking") {
    stopTracking();
  }
});


function startTracking() {
  console.log("[ContentScript] Sending start tracking request to backend...");

  fetch('http://127.0.0.1:5000/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "start" })
  })
  .then(response => response.json())
  .then(data => {
    console.log('[ContentScript] Backend responded to start:', data);

    try {
      if (recognition) {
        recognition.abort();   // <- Force kill any old mic session
      }
    } catch (e) {
      console.error('Error aborting old recognition:', e.message);
    }

    setupSpeechRecognition();   // Re-setup fresh
    startSpeechRecognition();   // Restart clean
  })
  .catch(error => {
    console.error('[ContentScript] Failed to start tracking:', error);
  });
}


function stopTracking() {
  console.log("[ContentScript] Sending stop tracking request to backend...");

  fetch('http://127.0.0.1:5000/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: "stop" })
  })
  .then(response => response.json())
  .then(data => {
    console.log('[ContentScript] Backend responded to stop:', data);
    stopSpeechRecognition();    // <<<<<<<<<<<<<<<<<<<
  })
  .catch(error => {
    console.error('[ContentScript] Failed to stop tracking:', error);
  });
}



function handleVoiceCommand(command) {
  console.log("Handling voice command:", command);

  if (command.includes('scroll down')) {
    window.scrollBy({ top: 400, behavior: 'smooth' });
  } else if (command.includes('scroll up')) {
    window.scrollBy({ top: -400, behavior: 'smooth' });
  } else if (command.includes('reload')) {
    chrome.runtime.sendMessage({ action: "reload_tab" });
  } else if (command.includes('switch tab right')) {
    chrome.runtime.sendMessage({ action: "switch_tab", direction: "right" });
  } else if (command.includes('switch tab left')) {
      chrome.runtime.sendMessage({ action: "switch_tab", direction: "left" });
  } else if (command.includes('close tab')) {
      chrome.runtime.sendMessage({ action: "close_tab" });
  } else if (command.includes('click')) {
    // Simulate a click at center of screen
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
  }
}



function switchTab(direction) {
  chrome.runtime.sendMessage({ action: "switch_tab", direction: direction });
}

function closeCurrentTab() {
  chrome.runtime.sendMessage({ action: "close_tab" });
}
