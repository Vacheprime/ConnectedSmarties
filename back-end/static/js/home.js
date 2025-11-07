import { Chart } from "@/components/ui/chart"
const fanStatus = "off"

// Declare showToast function or import it from notifications.js
function showToast(title, message, type) {
  console.log(`Title: ${title}, Message: ${message}, Type: ${type}`)
}

let humidityChart = null

function initHumidityChart() {
  const ctx = document.getElementById("humidityParetoChart")
  if (!ctx) return

  humidityChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Fridge 1", "Fridge 2"],
      datasets: [
        {
          label: "Humidity (%)",
          data: [0, 0],
          backgroundColor: ["rgba(59, 130, 246, 0.6)", "rgba(16, 185, 129, 0.6)"],
          borderColor: ["rgba(59, 130, 246, 1)", "rgba(16, 185, 129, 1)"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => value + "%",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

function updateHumidityChart(humidity1, humidity2) {
  if (humidityChart) {
    humidityChart.data.datasets[0].data = [humidity1, humidity2]
    humidityChart.update()
  }
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

async function fetchSensorData() {
  try {
    const response = await fetch("/api/sensors")
    if (response.ok) {
      const data = await response.json()

      const sensor1Temp = Number.parseFloat(data.sensor1.temperature)
      const sensor1Humidity = Number.parseFloat(data.sensor1.humidity)
      updateThermometer(sensor1Temp, 1)
      updateHumidityGauge(sensor1Humidity, 1)

      const sensor2Temp = Number.parseFloat(data.sensor2.temperature)
      const sensor2Humidity = Number.parseFloat(data.sensor2.humidity)
      updateThermometer(sensor2Temp, 2)
      updateHumidityGauge(sensor2Humidity, 2)

      updateHumidityChart(sensor1Humidity, sensor2Humidity)

      document.getElementById("sensor1-temp-status").innerHTML = '<span class="status-dot"></span><span>Active</span>'
      document.getElementById("sensor1-humidity-status").innerHTML =
        '<span class="status-dot"></span><span>Active</span>'
      document.getElementById("sensor2-temp-status").innerHTML = '<span class="status-dot"></span><span>Active</span>'
      document.getElementById("sensor2-humidity-status").innerHTML =
        '<span class="status-dot"></span><span>Active</span>'
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

async function controlFan(action, fanId) {
  try {
    const sensorId = Number.parseInt(fanId)

    const response = await fetch(`/fan/${action}?sensor_id=${sensorId}`, {
      method: "POST",
    })

    if (response.ok) {
      const data = await response.json()
      updateFanUI(fanId, action === "on")
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

function updateFanUI(fanId, isOn) {
  const fanImg = document.getElementById(`fan-${fanId}-img`)
  const fanDot = document.getElementById(`fan-dot-${fanId}`)
  const fanStatusText = document.getElementById(`fan-status-text-${fanId}`)

  if (isOn) {
    fanImg.style.opacity = "1"
    fanDot.style.backgroundColor = "var(--color-success)"
    fanStatusText.textContent = "Activated"
    fanStatusText.style.color = "var(--color-success)"
  } else {
    fanImg.style.opacity = "0.5"
    fanDot.style.backgroundColor = "var(--color-text-muted)"
    fanStatusText.textContent = "Deactivated"
    fanStatusText.style.color = "var(--color-text-muted)"
  }
}

function openThresholdModal() {
  const modal = document.getElementById("threshold-modal")
  modal.classList.add("show")

  // Load current values
  const highValue = document.getElementById("high-threshold-value").textContent
  const lowValue = document.getElementById("low-threshold-value").textContent
  document.getElementById("high-threshold-input").value = highValue
  document.getElementById("low-threshold-input").value = lowValue
}

function closeThresholdModal() {
  const modal = document.getElementById("threshold-modal")
  modal.classList.remove("show")
}

async function saveThreshold() {
  const highThreshold = Number.parseFloat(document.getElementById("high-threshold-input").value)
  const lowThreshold = Number.parseFloat(document.getElementById("low-threshold-input").value)

  try {
    const response = await fetch("/api/threshold", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        high_threshold: highThreshold,
        low_threshold: lowThreshold,
      }),
    })

    if (response.ok) {
      document.getElementById("high-threshold-value").textContent = highThreshold
      document.getElementById("low-threshold-value").textContent = lowThreshold
      showToast("Success", "Thresholds updated successfully", "success")
      closeThresholdModal()
    } else {
      throw new Error("Failed to update thresholds")
    }
  } catch (error) {
    console.error("Error updating thresholds:", error)
    showToast("Error", "Failed to update thresholds", "error")
  }
}

async function loadThresholds() {
  try {
    const response = await fetch("/api/threshold")
    if (response.ok) {
      const data = await response.json()
      document.getElementById("high-threshold-value").textContent = data.high_threshold
      document.getElementById("low-threshold-value").textContent = data.low_threshold
    }
  } catch (error) {
    console.error("Error loading thresholds:", error)
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initHumidityChart()
  loadThresholds()
  fetchSensorData()
  // Update sensor data every 5 seconds
  setInterval(fetchSensorData, 5000)
})

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("threshold-modal")
  if (event.target === modal) {
    closeThresholdModal()
  }
}
