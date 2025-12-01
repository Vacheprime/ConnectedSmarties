import { showToast } from './notifications.js';

const fanStatus = "off"

let humidityChart = null

/**
 * A helper function to show or clear an error for a specific field.
 * @param {string} fieldId - The ID of the input element.
 * @param {string} message - The error message to show. If empty, clears the error.
 */
function setFieldError(fieldId, message) {
  const errorSpan = document.getElementById(`${fieldId}-error`);
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = message ? 'block' : 'none';
  }
}

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

      // This function is now only responsible for Fridge 1 and Fridge 2
      
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
  
  // Clear any old errors
  setFieldError('high-threshold-input', '');
  setFieldError('low-threshold-input', '');
}

function closeThresholdModal() {
  const modal = document.getElementById("threshold-modal")
  modal.classList.remove("show")
}

async function saveThreshold() {
  const highInput = document.getElementById("high-threshold-input");
  const lowInput = document.getElementById("low-threshold-input");
  
  const highThreshold = Number.parseFloat(highInput.value)
  const lowThreshold = Number.parseFloat(lowInput.value)

  // --- VALIDATION ---
  let isValid = true;
  setFieldError('high-threshold-input', '');
  setFieldError('low-threshold-input', '');

  if (isNaN(highThreshold)) {
    setFieldError('high-threshold-input', 'Please enter a valid number.');
    isValid = false;
  }
  
  if (isNaN(lowThreshold)) {
    setFieldError('low-threshold-input', 'Please enter a valid number.');
    isValid = false;
  }

  if (isValid && highThreshold <= lowThreshold) {
    setFieldError('high-threshold-input', 'High threshold must be greater than low threshold.');
    setFieldError('low-threshold-input', 'Low threshold must be less than high threshold.');
    isValid = false;
  }
  
  if (!isValid) {
     showToast("Validation Error", "Please fix the errors in the form.", "error");
     return;
  }
  // --- END VALIDATION ---

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
      const data = await response.json()
      document.getElementById("high-threshold-value").textContent = highThreshold
      document.getElementById("low-threshold-value").textContent = lowThreshold
      showToast("Success", "Thresholds updated successfully. Email alerts will now use these values.", "success")
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

function initAmbientContext() {
  // Fetch ambient context data from Pareto Anywhere API
  fetchAmbientContext()
}

async function fetchAmbientContext() {
  try {
    const response = await fetch("/api/ambient-context")
    if (response.ok) {
      const data = await response.json()
      
      // Format the data for updateAmbientContext
      const contextData = {
        motion: { detected: false, device: data.device_id || "unknown", time: data.timestamp },
        temperature: {
          current: data.temperature, 
          max: data.temperature,
          min: data.temperature,
        },
        humidity: {
          current: data.humidity, 
          max: data.humidity,
          min: data.humidity,
        },
        light: { 
          current: data.lux, 
          max: data.lux, 
          min: data.lux 
        },
        battery: { 
          current: data.battery, 
          max: data.battery, 
          min: data.battery 
        },
      }
      
      updateAmbientContext(contextData)
    } else {
      throw new Error("Failed to fetch ambient context")
    }
  } catch (error) {
    console.error("Error fetching ambient context:", error)
    showToast("Ambient Context Error", "Failed to fetch ambient context from Pareto Anywhere", "error")
    
    // UPDATED: Use null placeholder data on error
    updateAmbientContext({
      motion: { detected: false, device: "error", time: new Date().toLocaleTimeString() },
      temperature: { current: null, max: null, min: null },
      humidity: { current: null, max: null, min: null },
      light: { current: null, max: null, min: null },
      battery: { current: null, max: null, min: null },
    })
  }
}

// This function now handles null values gracefully
function updateAmbientContext(data) {
  // Helper function to update text or show placeholder
  const updateText = (elementId, value, unit = "") => {
    const element = document.getElementById(elementId);
    if (element) {
      if (value !== null && value !== undefined && !isNaN(value)) {
        // For temp, show one decimal. For others, round.
        let displayValue;
        if (elementId.includes("temp")) {
            displayValue = value.toFixed(1);
        } else if (elementId.includes("humidity") || elementId.includes("light") || elementId.includes("battery")) {
            displayValue = Math.round(value);
        } else {
            displayValue = value;
        }
        element.textContent = `${displayValue}${unit}`;
      } else {
        element.textContent = "—"; // Placeholder for null/invalid data
      }
    }
  };

  // Update motion status and time
  const motionStatus = document.getElementById("motion-status")
  if (motionStatus) {
    motionStatus.textContent = data.motion.detected ? "Motion detected" : "No motion detected"
  }
  
  // Update device ID and time
  const motionDevice = document.getElementById("motion-device")
  if (motionDevice) {
    motionDevice.textContent = data.motion.device
  }
  
  const motionTime = document.getElementById("motion-time")
  if (motionTime) {
    motionTime.textContent = data.motion.time
  }

  // Update temperature
  updateText("ambient-temp", data.temperature.current);
  updateText("temp-max", data.temperature.max, "°C");
  updateText("temp-min", data.temperature.min, "°C");

  // Update humidity
  updateText("ambient-humidity", data.humidity.current);
  updateText("humidity-max", data.humidity.max, "%");
  updateText("humidity-min", data.humidity.min, "%");

  // Update light
  updateText("ambient-light", data.light.current);
  updateText("light-max", data.light.max, " lux");
  updateText("light-min", data.light.min, " lux");

  // Update battery (if available)
  updateText("ambient-battery", data.battery.current);
  updateText("battery-max", data.battery.max, " ");
  updateText("battery-min", data.battery.min, " ");
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initAmbientContext() // Fetch ambient context immediately

  // Initialize all fans to OFF (Deactivated)
  window.fanStatuses = {
    1: "off",
    2: "off"
  };

  // Make sure UI starts correctly
  updateFanUI(1);
  updateFanUI(2);

  // Fetch sensor data immediately and then every 5s
  
  initHumidityChart()
  loadThresholds()
  fetchSensorData()
  // Update sensor data every 5 seconds
  setInterval(fetchSensorData, 5000)
  // Update ambient context every 5 seconds
  setInterval(fetchAmbientContext, 5000)

  // Add real-time validation for modal inputs
  document.getElementById('high-threshold-input').addEventListener('input', () => {
    setFieldError('high-threshold-input', '');
  });
  document.getElementById('low-threshold-input').addEventListener('input', () => {
    setFieldError('low-threshold-input', '');
  });
})

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("threshold-modal")
  if (event.target === modal) {
    closeThresholdModal()
  }
}

// Export to global scope
if (typeof window !== "undefined") {
  window.controlFan = controlFan
  window.openThresholdModal = openThresholdModal
  window.closeThresholdModal = closeThresholdModal
  window.saveThreshold = saveThreshold
}