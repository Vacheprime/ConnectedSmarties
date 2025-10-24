let fanStatus = "off"

const TEST_MODE = true // 👈 turn this on/off to switch between test & real data

// Function to show toast messages
function showToast(title, message, type) {
  // Implementation of showToast function
  console.log(`Toast - Title: ${title}, Message: ${message}, Type: ${type}`)
}

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

// Fetch sensor data
async function fetchSensorData() {
  try {
    if (TEST_MODE) {
      // ✅ Test values
      const data = {
        sensor1: { temperature: 50, humidity: 35 },
        sensor2: { temperature: 13.33, humidity: 45 },
      }

      // Update UI with test values
      updateThermometer(data.sensor1.temperature, 1)
      updateHumidityGauge(data.sensor1.humidity, 1)
      updateThermometer(data.sensor2.temperature, 2)
      updateHumidityGauge(data.sensor2.humidity, 2)

      document.getElementById("sensor1-temp-status").innerHTML = '<span class="status-dot"></span><span>Test</span>'
      document.getElementById("sensor1-humidity-status").innerHTML = '<span class="status-dot"></span><span>Test</span>'
      document.getElementById("sensor2-temp-status").innerHTML = '<span class="status-dot"></span><span>Test</span>'
      document.getElementById("sensor2-humidity-status").innerHTML = '<span class="status-dot"></span><span>Test</span>'
      return // ✅ Skip the API fetch completely
    }

    // 🌐 Normal API mode
    const response = await fetch("/api/sensors")
    if (response.ok) {
      const data = await response.json()

      const sensor1Temp = Number.parseFloat(data.sensor1.temperature)
      updateThermometer(sensor1Temp, 1)
      updateHumidityGauge(data.sensor1.humidity, 1)

      const sensor2Temp = Number.parseFloat(data.sensor2.temperature)
      updateThermometer(sensor2Temp, 2)
      updateHumidityGauge(data.sensor2.humidity, 2)

      document.getElementById("sensor1-temp-status").innerHTML = '<span class="status-dot"></span><span>Active</span>'
      document.getElementById("sensor1-humidity-status").innerHTML = '<span class="status-dot"></span><span>Active</span>'
      document.getElementById("sensor2-temp-status").innerHTML = '<span class="status-dot"></span><span>Active</span>'
      document.getElementById("sensor2-humidity-status").innerHTML = '<span class="status-dot"></span><span>Active</span>'
    } else {
      throw new Error("Failed to fetch sensor data")
    }
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    showToast("Sensor Error", "Failed to fetch sensor data", "error")

    document.getElementById("sensor1-temp-status").innerHTML = "<span>Error</span>"
    document.getElementById("sensor1-humidity-status").innerHTML = "<span>Error</span>"
    document.getElementById("sensor2-temp-status").innerHTML = "<span>Error</span>"
    document.getElementById("sensor2-humidity-status").innerHTML = "<span>Error</span>"
  }
}

// Control fan
async function controlFan(action) {
  try {
    const response = await fetch(`/api/fan/${action}`, {
      method: "POST",
    })

    if (response.ok) {
      const data = await response.json()
      fanStatus = data.status
      updateFanUI()
      showToast("Fan Control", data.message, "success")
    } else {
      const error = await response.json()
      throw new Error(error.error || "Failed to control fan")
    }
  } catch (error) {
    console.error("Error controlling fan:", error)
    showToast("Fan Error", error.message, "error")
  }
}

// Update fan UI
function updateFanUI() {
  const fanIcon = document.getElementById("fan-icon")
  const fanStatusText = document.getElementById("fan-status-text")

  if (fanStatus === "on") {
    fanIcon.classList.add("spinning")
    fanStatusText.textContent = "ON"
    fanStatusText.classList.add("on")
  } else {
    fanIcon.classList.remove("spinning")
    fanStatusText.textContent = "OFF"
    fanStatusText.classList.remove("on")
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  fetchSensorData()
  // Update sensor data every 5 seconds
  setInterval(fetchSensorData, 5000)
})
