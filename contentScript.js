console.log("Nebi content script loaded!");

// Initialize WebGazer here
// webgazer.begin();

const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.bottom = '10px';
overlay.style.left = '10px';
overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
overlay.style.color = 'white';
overlay.style.padding = '10px';
overlay.style.borderRadius = '10px';
overlay.style.zIndex = '10000';
overlay.innerText = '👁️ Nebi is active';

document.body.appendChild(overlay);
