// Calculate next 7:00 AM
let alarmTime = new Date();
alarmTime.setHours(7, 0, 0, 0);
if (alarmTime.getTime() < Date.now()) {
  alarmTime.setDate(alarmTime.getDate() + 1);
}

chrome.alarms.create("dailyClaim", {
  when: alarmTime.getTime(),
  periodInMinutes: 24 * 60,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyClaim") {
    chrome.tabs.query(
      { url: "https://home.startrekfleetcommand.com/*" },
      (tabs) => {
        if (tabs.length === 0) {
          chrome.tabs.create({
            url: "https://home.startrekfleetcommand.com/store",
          });
        } else {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, { action: "autoClaim" });
          });
        }
      },
    );
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "closeTabAfterClaim" && sender.tab) {
    console.log(
      "[Background] Closing tab after successful claim:",
      sender.tab.id,
    );
    chrome.tabs.remove(sender.tab.id);
  }
});
