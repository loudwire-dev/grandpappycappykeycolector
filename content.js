// 👴 R.K. Loudwire's YouTube Auto Like

let currentUrl = location.href;
let hasLiked = false;
let interval = null;

// 🧠 Wait until DOM is ready
function waitForBody(callback) {
  if (document.body) {
    callback();
  } else {
    setTimeout(() => waitForBody(callback), 100);
  }
}

// 🚀 Initialize for each video
function init() {
  console.log("👴 Grand Pappy Cappy initializing...");

  // ⛔ Skip Shorts
  if (location.href.includes("/shorts/")) {
    console.log("⛔ Skipping Shorts");
    return;
  }

  const video = document.querySelector("video");

  if (!video) {
    setTimeout(init, 1000);
    return;
  }

  hasLiked = false;

  if (interval) clearInterval(interval);

  interval = setInterval(() => {
    if (!video.duration || isNaN(video.duration)) return;

    const current = video.currentTime;
    const halfway = video.duration * 0.5;

    console.log(`⏱ ${current.toFixed(1)} / ${halfway.toFixed(1)}`);

    if (!hasLiked && current >= halfway) {
      console.log("🔥 50% reached — attempting like");
      clickLike();
      hasLiked = true;
    }
  }, 1000);
}

// 👍 Like video + increment counter safely
function clickLike() {
  const likeButton = document.querySelector('button[aria-label*="like" i]');

  if (!likeButton) {
    console.log("❌ Like button not found");
    return;
  }

  if (likeButton.getAttribute("aria-pressed") === "true") {
    console.log("👍 Already liked");
    return;
  }

  likeButton.click();
  console.log("✅ Liked video");

  // 📊 Safe storage update
  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["likeCount"], (result) => {
        if (chrome.runtime.lastError) {
          console.log("Storage GET error:", chrome.runtime.lastError);
          return;
        }

        let count = result.likeCount || 0;
        count++;

        chrome.storage.local.set({ likeCount: count }, () => {
          if (chrome.runtime.lastError) {
            console.log("Storage SET error:", chrome.runtime.lastError);
          } else {
            console.log(`📊 Total Likes: ${count}`);
          }
        });
      });
    } else {
      console.log("⚠️ chrome.storage unavailable");
    }
  } catch (err) {
    console.log("⚠️ Storage crashed:", err);
  }
}

// 🔄 Watch for YouTube navigation (SPA-safe)
function watchNavigation() {
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      console.log("🔄 New video detected");

      // Give YouTube time to load new player
      setTimeout(init, 1500);
    }
  }, 1000);
}

// 🚀 Start everything safely
waitForBody(() => {
  watchNavigation();
  init();
});
