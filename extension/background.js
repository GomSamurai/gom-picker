/**
 * GOM Color Picker Pro - Extension Background Service Worker (Manifest V3)
 * Handles context menus, keyboard shortcuts, and tab messaging.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Create Context Menu
  try {
    chrome.contextMenus.create({
      id: "gom_pick_color",
      title: "🎨 Muestrear color con Pipeta GOM",
      contexts: ["page", "image", "selection", "link"]
    });
  } catch (err) {
    console.error("Context menu creation error:", err);
  }
});

// Context Menu Click Listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "gom_pick_color" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "trigger_eyedropper" }, (response) => {
      if (chrome.runtime.lastError) {
        // Tab may not have content script injected yet, execute script
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        }, () => {
          chrome.tabs.sendMessage(tab.id, { action: "trigger_eyedropper" });
        });
      }
    });
  }
});

// Keyboard Commands Listener
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "pick_color") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "trigger_eyedropper" }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          }, () => {
            chrome.tabs.sendMessage(tab.id, { action: "trigger_eyedropper" });
          });
        }
      });
    }
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "color_picked" && request.color) {
    // Save to sync/local storage
    chrome.storage.local.get({ gom_history: [] }, (res) => {
      const history = res.gom_history || [];
      const updated = [request.color, ...history.filter(c => c.toLowerCase() !== request.color.toLowerCase())].slice(0, 36);
      chrome.storage.local.set({ gom_history: updated, gom_last_color: request.color });
    });
    sendResponse({ success: true });
  }
  return true;
});
