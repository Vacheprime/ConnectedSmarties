let fanStatus = "off"

if (!window.fanStatuses) window.fanStatuses = {}

function updateThermometer(temperature, thermometerId) {
  const thermometerElement = document.getElementById(`temperature-${thermometerId}`)
  const minTemp = -20
  const maxTemp = 50

  // Calculate height percentage based on temperature range
  const heightPercent = ((temperature - minTemp) / (maxTemp - minTemp)) * 100

  // Update thermometer visual
  thermometerElement.style.height = Math.max(0, Math.min(100, heightPercent)) + "%"
  thermometerElement.setAttribute("data-value", temperature + "°C")
}

function updateHumidityGauge(humidity, gaugeId) {
  const humidityValueElement = document.getElementById(`humidity-value-${gaugeId}`)

  // Clamp the humidity value to be within 0-100%
  const clampedHumidity = Math.max(0, Math.min(100, Number.parseFloat(humidity)))

  // Update the numerical display
  humidityValueElement.textContent = Math.round(clampedHumidity)

  // Update the CSS variable for the gauge fill
  document.documentElement.style.setProperty(`--humidity-${gaugeId}`, clampedHumidity)
}

async function fetchSensorData() {
  try {
    const response = await fetch("/api/sensors")
    if (!response.ok) throw new Error("Failed to fetch sensor data")

    const data = await response.json()

    // Sensor 1
    const sensor1Temp = Number.parseFloat(data.sensor1.temperature)
    const sensor1Hum = Number.parseFloat(data.sensor1.humidity)
    updateThermometer(sensor1Temp, 1)
    updateHumidityGauge(sensor1Hum, 1)
    updateSensorStatus("sensor1-temp-status", true)
    updateSensorStatus("sensor1-humidity-status", true)

    // Sensor 2
    const sensor2Temp = Number.parseFloat(data.sensor2.temperature)
    const sensor2Hum = Number.parseFloat(data.sensor2.humidity)
    updateThermometer(sensor2Temp, 2)
    updateHumidityGauge(sensor2Hum, 2)
    updateSensorStatus("sensor2-temp-status", true)
    updateSensorStatus("sensor2-humidity-status", true)
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    showToast("Sensor Error", "Failed to fetch sensor data", "error")

    // Set statuses to error state
    updateSensorStatus("sensor1-temp-status", false)
    updateSensorStatus("sensor1-humidity-status", false)
    updateSensorStatus("sensor2-temp-status", false)
    updateSensorStatus("sensor2-humidity-status", false)
  }
}

// === SENSOR STATUS UI ===
function updateSensorStatus(elementId, isActive) {
  const el = document.getElementById(elementId)
  if (!el) return

  const dot = el.querySelector(".status-dot")
  const text = el.querySelector("span:last-child")

  if (isActive) {
    dot.style.backgroundColor = "green"
    text.textContent = "Active"
    text.style.color = "green"
  } else {
    dot.style.backgroundColor = "red"
    text.textContent = "Deactivated"
    text.style.color = "red"
  }
}

async function controlFan(action, sensorId) {
  try {
    const response = await fetch(`/fan/${action}?sensor_id=${sensorId}`, {
      method: "POST",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to control fan")
    }

    const data = await response.json()
    window.fanStatuses[sensorId] = action === "on" ? "on" : "off"
    updateFanUI(sensorId)
    showToast("Fan Control", data.message, "success")
  } catch (error) {
    console.error("Error controlling fan:", error)
    showToast("Fan Error", error.message, "error")
  }
}

function updateFanUI(sensorId) {
  const fanStatusText = document.getElementById(`fan-status-text-${sensorId}`)
  const fanImage = document.getElementById(`fan-${sensorId}-img`)
  const fanDot = document.getElementById(`fan-dot-${sensorId}`)
  

  const isOn = window.fanStatuses[sensorId] === "on"

  fanStatusText.textContent = isOn ? "Active" : "Deactivated"
  fanStatusText.style.color = isOn ? "green" : "red"
  fanDot.style.backgroundColor = isOn ? "green" : "red"

  if (isOn) fanImage.classList.add("spinning")
  else fanImage.classList.remove("spinning")
}

// === PAGE INIT ===
document.addEventListener("DOMContentLoaded", () => {
  // Initialize all fans to OFF (Deactivated)
  window.fanStatuses = {
    1: "off",
    2: "off"
  };

  // Make sure UI starts correctly
  updateFanUI(1);
  updateFanUI(2);

  // Fetch sensor data immediately and then every 5s
  fetchSensorData();
  setInterval(fetchSensorData, 5000);
});
