document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const manualBtn = document.getElementById("manualClaim");

  function updateStatus() {
    chrome.storage.local.get(["dailyKeyStatus", "claimedDate"], (result) => {
      const today = new Date().toDateString();
      const isClaimedToday =
        result.dailyKeyStatus === "claimed" && result.claimedDate === today;
      statusDiv.textContent = isClaimedToday
        ? "Daily Key Claimed ✅"
        : "Waiting for Daily Key ⏳";
    });
  }

  updateStatus();

  // Live update when storage changes (e.g. after claim)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.dailyKeyStatus || changes.claimedDate)) {
      updateStatus();
    }
  });

  manualBtn.addEventListener("click", () => {
    chrome.storage.local.get(["dailyKeyStatus", "claimedDate"], (result) => {
      const today = new Date().toDateString();
      if (result.dailyKeyStatus === "claimed" && result.claimedDate === today) {
        statusDiv.textContent = "Already Claimed ✅";
        alert("Daily Mission Key already claimed today!");
        return;
      }

      // Look for existing STFC store tabs
      chrome.tabs.query(
        { url: "https://home.startrekfleetcommand.com/*" },
        (tabs) => {
          if (tabs.length === 0) {
            // No store tab → open one (auto-claim will run via content script)
            chrome.tabs.create({
              url: "https://home.startrekfleetcommand.com/store",
            });
            statusDiv.textContent =
              "Opening STFC store page... Claim should start automatically.";
            return;
          }

          // Prefer the active one if available, else first match
          let targetTab = tabs.find((t) => t.active) || tabs[0];

          // Activate if necessary
          if (!targetTab.active) {
            chrome.tabs.update(targetTab.id, { active: true });
          }

          // Trigger manual claim
          chrome.tabs.sendMessage(
            targetTab.id,
            { action: "manualClaim" },
            (resp) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Send message error:",
                  chrome.runtime.lastError.message,
                );
                statusDiv.textContent =
                  "Error: " + chrome.runtime.lastError.message;
                alert(
                  "Failed to trigger claim. Make sure the STFC page is loaded.",
                );
              } else {
                console.log("Manual claim triggered", resp);
                statusDiv.textContent = "Claim sequence started...";
              }
            },
          );
        },
      );
    });
  });
});
