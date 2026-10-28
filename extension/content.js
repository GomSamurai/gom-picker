/**
 * GOM Color Picker Pro - Content Script
 * Allows in-page color picking using native EyeDropper API with element sampling fallback.
 */

(() => {
  // Prevent duplicate execution
  if (window.__gomPickerContentInjected) return;
  window.__gomPickerContentInjected = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "trigger_eyedropper") {
      activateEyeDropper();
      sendResponse({ status: "started" });
    }
  });

  async function activateEyeDropper() {
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          handlePickedColor(hex);
        }
      } catch (e) {
        // User cancelled or aborted eyedropper
        console.log("[GOM Picker] Pipeta cerrada o cancelada por el usuario.");
      }
    } else {
      activateFallbackHoverPicker();
    }
  }

  function handlePickedColor(hex) {
    // Copy to clipboard
    try {
      navigator.clipboard.writeText(hex);
    } catch (_) {}

    // Send to background
    chrome.runtime.sendMessage({
      action: "color_picked",
      color: hex
    });

    // Show floating toast notification on webpage
    showToastNotification(`🎨 Color ${hex} copiado al portapapeles`);
  }

  function activateFallbackHoverPicker() {
    let highlightOverlay = document.createElement("div");
    highlightOverlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      border: 2px dashed #6366F1;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 4px;
      transition: all 0.05s ease;
      display: none;
    `;
    document.body.appendChild(highlightOverlay);

    const onMouseMove = (e) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target !== highlightOverlay) {
        const rect = target.getBoundingClientRect();
        highlightOverlay.style.display = "block";
        highlightOverlay.style.left = `${rect.left}px`;
        highlightOverlay.style.top = `${rect.top}px`;
        highlightOverlay.style.width = `${rect.width}px`;
        highlightOverlay.style.height = `${rect.height}px`;
      }
    };

    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      cleanup();

      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target) {
        const style = window.getComputedStyle(target);
        let color = style.backgroundColor;
        if (!color || color === "rgba(0, 0, 0, 0)" || color === "transparent") {
          color = style.color || "#000000";
        }
        const hex = rgbStringToHex(color);
        handlePickedColor(hex);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        cleanup();
      }
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      if (highlightOverlay && highlightOverlay.parentNode) {
        highlightOverlay.parentNode.removeChild(highlightOverlay);
      }
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
  }

  function rgbStringToHex(rgbStr) {
    const match = rgbStr.match(/\d+/g);
    if (!match || match.length < 3) return "#6366F1";
    const r = parseInt(match[0], 10);
    const g = parseInt(match[1], 10);
    const b = parseInt(match[2], 10);
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  function showToastNotification(text) {
    const toast = document.createElement("div");
    toast.textContent = text;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: #090A0F;
      color: #FFFFFF;
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid #6366F1;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(99,102,241,0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      animation: gomFadeIn 0.25s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }
})();
