// Main selectors
const unitsBtn = document.querySelector(".units");
const unitsSelector = document.querySelector(".units-selector");

// Toggle the display of the units selector
unitsBtn.addEventListener("click", () => {
  unitsSelector.classList.toggle("units-active");
});

// Global variables
let currentUnits = {
  temperature: "celsius",
  wind: "kmh",
  precipitation: "mm",
};

let originalData = {
  current: {
    temperature: null,
    feelLike: null,
    wind: null,
    precipitation: null,
    humidity: null,
  },
  daily: {
    min: [],
    max: [],
  },
  hourly: {
    temperature: [],
    time: [],
    weathercode: [],
  },
};

let weatherData = null;
let now = new Date();
let todayStr = null;

// Error elements selectors
const errorSection = document.querySelector(".errors");
const noResultMsg = document.querySelector(".no-result");
const retryWrapper = document.querySelector(".retry-wrapper");
const gridContent = document.querySelector(".grid");
const retryBtn = document.getElementById("retry");

// Handle retry button click
if (retryBtn) {
  retryBtn.addEventListener("click", () => location.reload());
}

// Unit buttons selectors
const unitButtons = {
  temperature: document.querySelectorAll(".units-temperature"),
  wind: document.querySelectorAll(".units-wind"),
  precipitation: document.querySelectorAll(".units-precipitation"),
};

// Convert temperature °C <-> °F
function convertTemperature(value, toFahrenheit) {
  return toFahrenheit ? (value * 9) / 5 + 32 : value;
}

// Convert wind km/h <-> mph
function convertWind(value, toMph) {
  return toMph ? value * 0.621371 : value;
}

// Convert precipitation mm <-> in
function convertPrecipitation(value, toInches) {
  return toInches ? value * 0.0393701 : value;
}

// Update units display across the DOM
function updateUnitsDisplay() {
  const { temperature, wind, precipitation } = currentUnits;
  const tempEl = document.querySelector(".temp-txt");
  const feelLikeEl = document.querySelector(".feel-like");
  const windEl = document.querySelector(".wind");
  const precipitationEl = document.querySelector(".precipitation");
  const humidity = document.querySelector(".humidity");

  if (!tempEl || !feelLikeEl || !windEl || !precipitationEl) return;

  // Update temperature and feels like
  if (temperature === "fahrenheit") {
    tempEl.textContent = `${convertTemperature(
      originalData.current.temperature,
      true
    ).toFixed(1)}°F`;
    feelLikeEl.textContent = `${convertTemperature(
      originalData.current.feelLike,
      true
    ).toFixed(1)}°F`;
  } else {
    tempEl.textContent = `${originalData.current.temperature.toFixed(1)}°C`;
    feelLikeEl.textContent = `${originalData.current.feelLike.toFixed(1)}°C`;
  }

  // Update wind
  if (wind === "mph") {
    windEl.textContent = `${convertWind(
      originalData.current.wind,
      true
    ).toFixed(1)} mph`;
  } else {
    windEl.textContent = `${originalData.current.wind.toFixed(1)} km/h`;
  }

  // Update precipitation
  if (precipitation === "in") {
    precipitationEl.textContent = `${convertPrecipitation(
      originalData.current.precipitation,
      true
    ).toFixed(1)} in`;
  } else {
    precipitationEl.textContent = `${originalData.current.precipitation.toFixed(
      1
    )} mm`;
  }

  // Update humidity
  humidity.textContent = `${originalData.current.humidity.toFixed(0)} %`;

  // Update daily and hourly forecasts
  updateDailyForecast();
  const select = document.getElementById("hourly-days");
  if (select && select.value) updateHourly(select.value);
}

// Update the daily forecast temperatures
function updateDailyForecast() {
  const { temperature } = currentUnits;
  const dayElements = document.querySelectorAll(".days .day");
  dayElements.forEach((dayEl, i) => {
    if (!originalData.daily.min[i] || !originalData.daily.max[i]) return;
    const maxEl = dayEl.querySelector(".max-temp");
    const minEl = dayEl.querySelector(".min-temp");
    if (maxEl && minEl) {
      if (temperature === "fahrenheit") {
        maxEl.textContent = `${convertTemperature(
          originalData.daily.max[i],
          true
        ).toFixed(1)}°`;
        minEl.textContent = `${convertTemperature(
          originalData.daily.min[i],
          true
        ).toFixed(1)}°`;
      } else {
        maxEl.textContent = `${originalData.daily.max[i].toFixed(1)}°`;
        minEl.textContent = `${originalData.daily.min[i].toFixed(1)}°`;
      }
    }
  });
}

// Update the hourly forecast for the selected day
function updateHourly(selectedDate) {
  if (!weatherData) return;

  const { temperature } = currentUnits;
  const { time, weathercode } = weatherData.hourly;
  const hoursForDay = time
    .map((t, i) => ({
      date: t.split("T")[0],
      hour: new Date(t).getHours(),
      temp: originalData.hourly.temperature[i],
      code: weathercode[i],
    }))
    .filter((h) => h.date === selectedDate);

  let toDisplay = [];
  if (selectedDate === todayStr) {
    const currentHour = now.getHours();
    toDisplay = hoursForDay.filter((h) => h.hour >= currentHour).slice(0, 8);
  } else {
    toDisplay = hoursForDay.filter((h) => h.hour >= 6).slice(0, 8);
  }

  const hourlyDivs = document.querySelectorAll(".hourly-datas .hourly");
  for (let i = 0; i < 8; i++) {
    const div = hourlyDivs[i];
    const img = div.querySelector("img");
    const text = div.querySelector(".hourly-text");
    const temp = div.querySelector(".hourly-temp");
    const data = toDisplay[i];
    if (data) {
      img.src = `./assets/images/${getWeatherIcon(data.code)}`;
      img.alt = `Weather icon ${data.hour}h`;
      img.style.opacity = 1;
      text.textContent = `${data.hour} h`;
      if (temperature === "fahrenheit") {
        temp.textContent = `${convertTemperature(data.temp, true).toFixed(1)}°`;
      } else {
        temp.textContent = `${data.temp.toFixed(1)}°`;
      }
    } else {
      img.src = "";
      img.alt = "";
      img.style.opacity = 0;
      text.textContent = "";
      temp.textContent = "";
    }
  }
}

// Return the corresponding weather icon filename based on weather code
function getWeatherIcon(code) {
  if ([0].includes(code)) return "icon-sunny.webp";
  if ([1, 2].includes(code)) return "icon-partly-cloudy.webp";
  if ([3].includes(code)) return "icon-overcast.webp";
  if ([45, 48].includes(code)) return "icon-fog.webp";
  if ([51, 53, 55].includes(code)) return "icon-drizzle.webp";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "icon-rain.webp";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "icon-snow.webp";
  if ([95, 96, 99].includes(code)) return "icon-storm.webp";
  return "icon-partly-cloudy.webp";
}

// Unit buttons listeners
unitButtons.temperature.forEach((button) => {
  button.addEventListener("click", () => {
    unitButtons.temperature.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentUnits.temperature = button.id;
    updateUnitsDisplay();
  });
});

unitButtons.wind.forEach((button) => {
  button.addEventListener("click", () => {
    unitButtons.wind.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentUnits.wind = button.id;
    updateUnitsDisplay();
  });
});

unitButtons.precipitation.forEach((button) => {
  button.addEventListener("click", () => {
    unitButtons.precipitation.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentUnits.precipitation = button.id;
    updateUnitsDisplay();
  });
});

// Handle the search form submission
document.getElementById("myForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cityName = document.getElementById("search").value.trim();
  if (!cityName) return;

  // Reset errors visibility
  errorSection.style.display = "none";
  noResultMsg.style.visibility = "hidden";
  retryWrapper.style.visibility = "hidden";
  gridContent.style.display = "grid";

  const townDiv = document.querySelector(".town");
  const townNameEl = document.querySelector(".town-name");

  // Show loader
  const loader = document.createElement("div");
  loader.classList.add("loader");
  townDiv.appendChild(loader);
  townNameEl.style.visibility = "hidden";

  setTimeout(async () => {
    try {
      // Fetch geolocation
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      // If no result found
      if (!geoData.results || geoData.results.length === 0) {
        loader.remove();
        gridContent.style.display = "none";
        errorSection.style.display = "block";
        noResultMsg.style.visibility = "visible";
        return;
      }

      // Fetch weather data
      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,weathercode&hourly=temperature_2m,weathercode&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      weatherData = await weatherRes.json();

      now = new Date();
      todayStr = formatDateLocal(now);

      // Store original data
      originalData.current = {
        temperature: weatherData.current.temperature_2m,
        feelLike: weatherData.current.apparent_temperature,
        humidity: weatherData.current.relative_humidity_2m,
        wind: weatherData.current.wind_speed_10m,
        precipitation: weatherData.current.precipitation,
      };
      originalData.daily.min = [...weatherData.daily.temperature_2m_min];
      originalData.daily.max = [...weatherData.daily.temperature_2m_max];
      originalData.hourly.temperature = [...weatherData.hourly.temperature_2m];
      originalData.hourly.time = [...weatherData.hourly.time];
      originalData.hourly.weathercode = [...weatherData.hourly.weathercode];

      // Update DOM data
      const dateEl = document.querySelector(".date");
      const temperatureDiv = document.querySelector(".temperature");
      const tempP = temperatureDiv.querySelector("p");

      townNameEl.textContent = `${name}, ${country}`;
      townNameEl.style.visibility = "visible";
      dateEl.textContent = now.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      // Display main weather icon
      let img = temperatureDiv.querySelector("img");
      if (!img) {
        img = document.createElement("img");
        img.style.width = "120px";
        img.style.height = "120px";
        img.style.marginRight = "10px";
        img.style.transition = "opacity 0.5s ease-in-out";
        temperatureDiv.insertBefore(img, tempP);
      }
      img.src = `./assets/images/${getWeatherIcon(
        weatherData.current.weathercode
      )}`;
      img.alt = `Weather icon for ${name}`;

      // Update week days icons
      const dayElements = document.querySelectorAll(".days .day");
      weatherData.daily.time.forEach((dateStr, i) => {
        if (!dayElements[i]) return;
        const dayEl = dayElements[i];
        const code = weatherData.daily.weathercode[i];
        const icon = getWeatherIcon(code);
        const dayName = new Date(dateStr).toLocaleDateString("fr-FR", {
          weekday: "short",
        });
        const pDay = dayEl.querySelector(".tp-6");
        if (pDay)
          pDay.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        let imgEl = dayEl.querySelector("img");
        if (!imgEl) {
          imgEl = document.createElement("img");
          dayEl.insertBefore(
            imgEl,
            dayEl.querySelector(".min-max-temperatures")
          );
        }
        imgEl.src = `./assets/images/${icon}`;
        imgEl.alt = `Weather ${dayName}`;
      });

      // Update hourly select
      const select = document.getElementById("hourly-days");
      const options = { weekday: "long", day: "numeric", month: "short" };
      select.innerHTML = "";
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        const value = formatDateLocal(d);
        const label = d.toLocaleDateString("fr-FR", options);
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        select.appendChild(opt);
      }

      // Initialize display
      updateUnitsDisplay();
      select.addEventListener("change", (e) => updateHourly(e.target.value));

      // Set default unit buttons
      document.getElementById("celsius").classList.add("active");
      document.getElementById("kmh").classList.add("active");
      document.getElementById("mm").classList.add("active");

      // Remove loader
      loader.remove();
    } catch (err) {
      // Handle fetch/network error
      console.error("Fetch error:", err);
      loader.remove();
      gridContent.style.display = "none";
      errorSection.style.display = "block";
      retryWrapper.style.visibility = "visible";
    }
  }, 200);
});

// Format date as YYYY-MM-DD
function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
