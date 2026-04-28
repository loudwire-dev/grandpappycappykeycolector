// background.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "incrementLike") {
    chrome.storage.local.get({ totalLikes: 0 }, (res) => {
      const total = res.totalLikes + 1;
      chrome.storage.local.set({ totalLikes: total }, () => {
        console.log("📊 Total Likes now:", total);
        // Notify popup if open
        chrome.runtime.sendMessage({
          type: "totalLikesUpdated",
          totalLikes: total,
        });
      });
    });
  }
});
