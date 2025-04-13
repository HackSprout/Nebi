console.log("Nebi Content Script Loaded!");

// ==============================
// Mic + Voice Recognition Setup
// ==============================

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
      recognition.start();  // Auto-restart if it crashes
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

// ==============================
// Background Message Listener
// ==============================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("ContentScript received:", message.action);

  if (message.action === "switch_tab") {
    switchTab(message.direction);
  } else if (message.action === "close_tab") {
    closeCurrentTab();
  } else if (message.action === "start_tracking") {
    setupSpeechRecognition();
    startSpeechRecognition();
  } else if (message.action === "stop_tracking") {
    stopSpeechRecognition();
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
  } 
  else if (command.includes('switch tab right')) {
    switchTab("right");   
  } 
  else if (command.includes('switch tab left')) {
    switchTab("left");     
  } else if (command.includes('close tab')) {
    closeCurrentTab();   
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
