document.getElementById('myForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cityName = document.getElementById('search').value.trim();
  if (!cityName) {
    console.error("Veuillez entrer une ville.");
    return;
  }

  try {
    // 1️⃣ Géocodage
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      console.error("Ville non trouvée.");
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // 2️⃣ Données météo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,weathercode&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    // 3️⃣ Météo actuelle
    const current = weatherData.current;

    // 🎯 Sélecteurs DOM
    const town = document.querySelector('.town-name');
    const date = document.querySelector('.date');
    const temperatureDiv = document.querySelector('.temperature'); 
    const tempP = temperatureDiv.querySelector('p'); 
    const feelLike = document.querySelector('.feel-like');
    const humidity = document.querySelector('.humidity');
    const wind = document.querySelector('.wind');
    const precipitation = document.querySelector('.precipitation');

    // 🧭 Fonction icônes
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

    // 4️⃣ Injection météo actuelle
    town.textContent = `${name}, ${country}`;
    date.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    tempP.textContent = `${current.temperature_2m}°C`;
    feelLike.textContent = `${current.apparent_temperature}°C`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    wind.textContent = `${current.wind_speed_10m} km/h`;
    precipitation.textContent = `${current.precipitation} mm`;

    // ✅ Icône principale avec animation fade
    let img = temperatureDiv.querySelector('img');

    if (!img) {
      // si aucune image, on crée directement
      img = document.createElement('img');
      img.style.width = "120px";
      img.style.height = "120px";
      img.style.marginRight = "10px";
      img.style.transition = "opacity 0.5s ease-in-out";
      temperatureDiv.insertBefore(img, tempP);
      img.src = `./assets/images/${getWeatherIcon(current.weathercode)}`;
      img.alt = `Icône météo ${name}`;
      img.style.opacity = 1;
    } else {
      // effet fade
      img.classList.add('fade-out');
      setTimeout(() => {
        img.src = `./assets/images/${getWeatherIcon(current.weathercode)}`;
        img.alt = `Icône météo ${name}`;
        img.classList.remove('fade-out');
      }, 500);
    }

    // 5️⃣ Mise à jour des 7 jours
    const dayElements = document.querySelectorAll('.days .day');

    weatherData.daily.time.forEach((dateStr, i) => {
      if (!dayElements[i]) return; 
      const dayEl = dayElements[i];
      const min = weatherData.daily.temperature_2m_min[i];
      const max = weatherData.daily.temperature_2m_max[i];
      const code = weatherData.daily.weathercode[i];
      const icon = getWeatherIcon(code);
      const dayName = new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' });

      // Nom du jour
      const pDay = dayEl.querySelector('.tp-6');
      if (pDay) pDay.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      // Icône : création dynamique si n'existe pas
      let imgEl = dayEl.querySelector('img');
      if (!imgEl) {
        imgEl = document.createElement('img');
        dayEl.insertBefore(imgEl, dayEl.querySelector('.min-max-temperatures'));
      }
      imgEl.src = `./assets/images/${icon}`;
      imgEl.alt = `Météo ${dayName}`;

      // Min/max
      const maxEl = dayEl.querySelector('.max-temp');
      const minEl = dayEl.querySelector('.min-temp');
      if (maxEl) maxEl.textContent = `${max.toFixed(1)}°`;
      if (minEl) minEl.textContent = `${min.toFixed(1)}°`;
    });

  } catch (err) {
    console.error("Erreur :", err);
  }
});
