(function () {
  const GIFTS_TAB_ID = "store-web-gift-tab-button";
  const CLAIM_BUTTON_SELECTOR = 'button[name="offer-claim-button"]'; // Matches your HTML exactly

  let hasClaimedToday = false;

  function safeClick(el, name) {
    if (!el) {
      console.error(`[Mission Key Collector] ${name} not found`);
      return false;
    }
    console.log(
      `[Mission Key Collector] Clicking ${name}:`,
      el.outerHTML.substring(0, 300),
    );
    try {
      el.click();
      el.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      return true;
    } catch (err) {
      console.error(`[Mission Key Collector] Click error on ${name}:`, err);
      return false;
    }
  }

  async function waitForElement(
    getter,
    timeoutMs = 30000,
    intervalMs = 800,
    desc,
  ) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = getter();
      if (el && el.offsetParent !== null && !el.disabled) {
        console.log(`[Mission Key Collector] Found ${desc}`);
        return el;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    console.warn(`[Mission Key Collector] Timeout waiting for ${desc}`);
    return null;
  }

  async function clickGiftsTab() {
    console.log("[Mission Key Collector] Waiting for Gifts tab button...");
    const tabButton = await waitForElement(
      () => document.getElementById(GIFTS_TAB_ID),
      40000,
      1000,
      "Gifts tab (store-web-gift-tab-button)",
    );

    if (tabButton) {
      safeClick(tabButton, "Gifts Tab");
      console.log(
        "[Mission Key Collector] Waiting 4 seconds for Gifts tab content to load...",
      );
      await new Promise((r) => setTimeout(r, 4000)); // +4 seconds as requested
    }
  }

  async function claimDailyKey() {
    const today = new Date().toDateString();
    const storage = await new Promise((resolve) =>
      chrome.storage.local.get(["dailyKeyStatus", "claimedDate"], resolve),
    );
    if (storage.dailyKeyStatus === "claimed" && storage.claimedDate === today) {
      console.log("[Mission Key Collector] Already claimed today – skipping.");
      hasClaimedToday = true;
      return;
    }
    if (hasClaimedToday) return;

    console.log(
      "[Mission Key Collector] Waiting for first button[name='offer-claim-button']...",
    );
    const claimButton = await waitForElement(
      () => document.querySelector(CLAIM_BUTTON_SELECTOR), // Uses name attribute
      30000,
      1000,
      "offer-claim-button (first instance)",
    );

    if (claimButton) {
      safeClick(claimButton, "Claim Button (offer-claim-button)");
      await new Promise((r) => setTimeout(r, 5000)); // Wait 5s for any popup/confirmation/toast

      // Optional: Try to find & click confirm popup if one appears
      const confirmButton = await waitForElement(
        () => {
          const candidates = document.querySelectorAll(
            "button, div[role='button'], [class*='confirm'], [class*='ok'], [class*='modal'] button, [class*='close']",
          );
          for (const btn of candidates) {
            const text = (btn.textContent || btn.innerText || "")
              .trim()
              .toLowerCase();
            if (
              text.includes("confirm") ||
              text.includes("ok") ||
              text.includes("got it") ||
              text.includes("close") ||
              text.includes("done") ||
              text.includes("claim")
            ) {
              if (btn.offsetParent !== null && !btn.disabled) return btn;
            }
          }
          return null;
        },
        10000,
        800,
        "confirmation/close popup button (optional)",
      );

      if (confirmButton) {
        safeClick(confirmButton, "Confirm/Close Popup Button");
        console.log("[Mission Key Collector] Popup handled.");
      } else {
        console.log(
          "[Mission Key Collector] No popup found – proceeding to close tab.",
        );
      }

      // Mark claimed
      hasClaimedToday = true;
      chrome.storage.local.set({
        dailyKeyStatus: "claimed",
        claimedDate: today,
      });

      // Close the tab
      chrome.runtime.sendMessage({ action: "closeTabAfterClaim" });
      console.log(
        "[Mission Key Collector] Claim sequence finished – tab closing.",
      );
    } else {
      console.log(
        "[Mission Key Collector] No offer-claim-button found after waiting.",
      );
    }
  }

  async function runSequence() {
    // Initial page load delay (login, SPA init, etc.)
    await new Promise((r) => setTimeout(r, 10000));
    await clickGiftsTab();
    await claimDailyKey();
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(runSequence, 3000),
    );
  } else {
    setTimeout(runSequence, 3000);
  }

  // Re-trigger on DOM mutations (debounced)
  const observer = new MutationObserver(() => {
    setTimeout(runSequence, 5000);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  // Message from popup/background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "manualClaim" || msg.action === "autoClaim") {
      runSequence().then(() => sendResponse({ status: "started" }));
      return true; // async
    }
  });

  console.log(
    "[Mission Key Collector] Initialized – using button[name='offer-claim-button'], 4s tab wait, then claim & close",
  );
})();
