// ========= FIREBASE =========
firebase.initializeApp({
  apiKey: "AIzaSyCP3WgCop702K8ixb8xoQ7xe5QDCDHN9Ac",
  databaseURL: "https://rakshai-ea4f7-default-rtdb.firebaseio.com"
});
const database = firebase.database();

// ========= DOM =========
const emergencyText = document.getElementById("emergencyText");
const sendBtn = document.getElementById("sendBtn");
const speakBtn = document.getElementById("speakBtn");
const statusDiv = document.getElementById("status");
const aiText = document.getElementById("aiText");
const alertSound = document.getElementById("alertSound");

// ========= MAP =========
let map, userMarker, locationLocked = false;

function initMap(lat, lng) {
  if (map) return;

  map = L.map("map").setView([lat, lng], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  userMarker = L.marker([lat, lng], { draggable: true })
    .addTo(map)
    .bindPopup("📍 Drag marker if location is incorrect")
    .openPopup();

  userMarker.on("dragend", () => {
    locationLocked = true;
    statusDiv.textContent = "📍 Location manually corrected";
  });

  setTimeout(() => map.invalidateSize(), 300);
}

// ========= LOCATION =========
navigator.geolocation.getCurrentPosition(
  pos => initMap(pos.coords.latitude, pos.coords.longitude),
  () => initMap(19.0330, 73.0297), // Nerul fallback
  { enableHighAccuracy: true, timeout: 15000 }
);

// ========= REAL-WORLD AI LOGIC =========
function detectType(msg) {
  msg = msg.toLowerCase();

  // 🔥 FIRE
  if (
    msg.includes("fire") ||
    msg.includes("blast") ||
    msg.includes("burn") ||
    msg.includes("explosion")
  ) return "fire";

  // 💊 MEDICAL
  if (
    msg.includes("heart") ||
    msg.includes("attack") ||
    msg.includes("bleeding") ||
    msg.includes("unconscious") ||
    msg.includes("injured") ||
    msg.includes("collapsed")
  ) return "medical";

  // 🚨 CRIME (SEVERE)
  if (
    msg.includes("murder") ||
    msg.includes("rape") ||
    msg.includes("assault") ||
    msg.includes("stab") ||
    msg.includes("shoot") ||
    msg.includes("gun") ||
    msg.includes("kidnap") ||
    msg.includes("robbery") ||
    msg.includes("violence")
  ) return "crime";

  // 🚗 ACCIDENT
  if (
    msg.includes("accident") ||
    msg.includes("crash") ||
    msg.includes("hit") ||
    msg.includes("collision")
  ) return "accident";

  return "other";
}

function getPriority(type) {
  // 🔴 LIFE THREATENING
  if (type === "fire" || type === "medical" || type === "crime") {
    return "HIGH";
  }

  // 🟠 SERIOUS BUT NOT IMMEDIATE DEATH
  if (type === "accident") {
    return "MEDIUM";
  }

  // 🟢 UNKNOWN / LOW RISK
  return "LOW";
}

function getGuidance(type) {
  return {
    fire: "🔥 Fire emergency detected. Move to safety immediately and call fire brigade.",
    medical: "💊 Medical emergency detected. Call ambulance and provide first aid if trained.",
    crime: "🚨 Violent crime detected. Stay safe and contact police immediately.",
    accident: "🚑 Accident detected. Secure area and call emergency services.",
    other: "⚠️ Emergency reported. Stay calm and wait for assistance."
  }[type];
}

// ========= SUBMIT =========
sendBtn.onclick = () => {
  if (!userMarker) return alert("📍 Location not ready");

  const msg = emergencyText.value.trim();
  if (!msg) return alert("Enter emergency details");

  const type = detectType(msg);
  const priority = getPriority(type);
  const { lat, lng } = userMarker.getLatLng();

  aiText.textContent = getGuidance(type);
  statusDiv.textContent = `🚨 ${type.toUpperCase()} | ${priority} priority`;

  if (priority === "HIGH" && alertSound) {
    alertSound.currentTime = 0;
    alertSound.play().catch(() => {});
  }

  database.ref("emergencies").push({
    type,
    priority,
    message: msg,
    lat,
    lng,
    time: Date.now()
  });
};
