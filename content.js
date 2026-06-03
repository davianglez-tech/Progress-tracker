// Content script that runs on Edgenuity pages
// This script tracks progress percentage on the page

function getProgressPercentage() {
  // Try multiple selectors to find the progress percentage
  // Adjust these selectors based on Edgenuity's actual DOM structure
  
  const progressSelectors = [
    '.progress-percentage',
    '[data-progress]',
    '.course-progress',
    '.completion-percentage',
    '.percent',
    '.progress-bar-text',
    '.progress-value',
    '[class*="progress"]'
  ];

  for (let selector of progressSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      const match = text.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
  }

  // If no selector found, return null
  return null;
}

function checkProgress() {
  const currentProgress = getProgressPercentage();

  if (currentProgress === null) {
    console.log('Could not find progress percentage on this page');
    return;
  }

  // Get stored progress from Chrome storage
  chrome.storage.local.get(['lastAlertedProgress', 'courseUrl'], (result) => {
    const lastAlerted = result.lastAlertedProgress || 0;
    const courseUrl = result.courseUrl || window.location.href;

    // Check if we've hit a new 10% milestone
    const lastMilestone = Math.floor(lastAlerted / 10) * 10;
    const currentMilestone = Math.floor(currentProgress / 10) * 10;

    if (currentProgress > lastAlerted && currentMilestone > lastMilestone) {
      // Send message to background script to show notification
      chrome.runtime.sendMessage({
        type: 'progressAlert',
        progress: currentProgress,
        milestone: currentMilestone
      });

      // Update stored progress
      chrome.storage.local.set({
        lastAlertedProgress: currentProgress,
        courseUrl: courseUrl,
        lastUpdate: new Date().toISOString()
      });
    }
  });
}

// Check progress when page loads
window.addEventListener('load', checkProgress);

// Check progress every 5 seconds
setInterval(checkProgress, 5000);

// Also check when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkProgress();
  }
});
