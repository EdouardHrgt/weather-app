document.getElementById('myForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cityName = document.getElementById('search').value.trim();
  if (!cityName) {
    console.error("Veuillez entrer une ville.");
    return;
  }

  const townDiv = document.querySelector('.town');
  const townNameEl = document.querySelector('.town-name');

  // ⚡ Afficher le loader
  const loader = document.createElement('div');
  loader.classList.add('loader');
  townDiv.appendChild(loader);

  // Masquer le contenu existant pendant le loader
  townNameEl.style.visibility = 'hidden';

  // ⏱ Attendre 1,5s avant d'exécuter le fetch
  setTimeout(async () => {
    try {
      // GEO LOCALISATION
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        console.error("Ville non trouvée.");
        loader.remove();
        townNameEl.style.visibility = 'visible';
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // FULL WEATHER DATAS FETCH
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weathercode&daily=temperature_2m_min,temperature_2m_max,weathercode&hourly=temperature_2m,weathercode&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      // DOM SELECTORS
      const dateEl = document.querySelector('.date');
      const temperatureDiv = document.querySelector('.temperature'); 
      const tempP = temperatureDiv.querySelector('p'); 
      const feelLike = document.querySelector('.feel-like');
      const humidity = document.querySelector('.humidity');
      const wind = document.querySelector('.wind');
      const precipitation = document.querySelector('.precipitation');

      // ICONS
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

      function formatDateLocal(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      }

      // CURRENT WEATHER
      const current = weatherData.current;
      townNameEl.textContent = `${name}, ${country}`;
      townNameEl.style.visibility = 'visible'; // afficher la ville
      dateEl.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      tempP.textContent = `${current.temperature_2m}°C`;
      feelLike.textContent = `${current.apparent_temperature}°C`;
      humidity.textContent = `${current.relative_humidity_2m}%`;
      wind.textContent = `${current.wind_speed_10m} km/h`;
      precipitation.textContent = `${current.precipitation} mm`;

      // MAIN ICON
      let img = temperatureDiv.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.style.width = "120px";
        img.style.height = "120px";
        img.style.marginRight = "10px";
        img.style.transition = "opacity 0.5s ease-in-out";
        temperatureDiv.insertBefore(img, tempP);
      }
      img.src = `./assets/images/${getWeatherIcon(current.weathercode)}`;
      img.alt = `Icône météo ${name}`;

      // WEEK DAYS UPDATE
      const dayElements = document.querySelectorAll('.days .day');
      weatherData.daily.time.forEach((dateStr, i) => {
        if (!dayElements[i]) return; 
        const dayEl = dayElements[i];
        const min = weatherData.daily.temperature_2m_min[i];
        const max = weatherData.daily.temperature_2m_max[i];
        const code = weatherData.daily.weathercode[i];
        const icon = getWeatherIcon(code);
        const dayName = new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' });

        const pDay = dayEl.querySelector('.tp-6');
        if (pDay) pDay.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        let imgEl = dayEl.querySelector('img');
        if (!imgEl) {
          imgEl = document.createElement('img');
          dayEl.insertBefore(imgEl, dayEl.querySelector('.min-max-temperatures'));
        }
        imgEl.src = `./assets/images/${icon}`;
        imgEl.alt = `Météo ${dayName}`;

        const maxEl = dayEl.querySelector('.max-temp');
        const minEl = dayEl.querySelector('.min-temp');
        if (maxEl) maxEl.textContent = `${max.toFixed(1)}°`;
        if (minEl) minEl.textContent = `${min.toFixed(1)}°`;
      });

      // WEATHER FORECAST (HOURLY)
      const select = document.getElementById('hourly-days');
      const hourlyContainer = document.querySelector('.hourly-datas');
      const now = new Date();
      const todayStr = formatDateLocal(now);
      const options = { weekday: 'long', day: 'numeric', month: 'short' };

      // SELECT TAG OPTIONS
      select.innerHTML = "";
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        const value = formatDateLocal(d);
        const label = d.toLocaleDateString('fr-FR', options);
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
        select.appendChild(opt);
      }

      // UPDATE HOURLY
      function updateHourly(selectedDate) {
        const { time, temperature_2m, weathercode } = weatherData.hourly;
        const hoursForDay = time
          .map((t, i) => ({
            date: t.split('T')[0],
            hour: new Date(t).getHours(),
            temp: temperature_2m[i],
            code: weathercode[i]
          }))
          .filter(h => h.date === selectedDate);

        let toDisplay = [];
        if (selectedDate === todayStr) {
          const currentHour = now.getHours();
          toDisplay = hoursForDay.filter(h => h.hour >= currentHour).slice(0, 8);
        } else {
          toDisplay = hoursForDay.filter(h => h.hour >= 6).slice(0, 8);
        }

        const hourlyDivs = document.querySelectorAll('.hourly-datas .hourly');
        for (let i = 0; i < 8; i++) {
          const div = hourlyDivs[i];
          const img = div.querySelector('img');
          const text = div.querySelector('.hourly-text');
          const temp = div.querySelector('.hourly-temp');

          const data = toDisplay[i];
          if (data) {
            img.src = `./assets/images/${getWeatherIcon(data.code)}`;
            img.alt = `Icône ${data.hour}h`;
            img.style.opacity = 1;
            text.textContent = `${data.hour} h`;
            temp.textContent = `${data.temp.toFixed(1)}°`;
          } else {
            img.src = "";
            img.alt = "";
            img.style.opacity = 0;
            text.textContent = "";
            temp.textContent = "";
          }
        }
      }

      // INITIAL DISPLAY
      updateHourly(todayStr);
      select.addEventListener('change', (e) => updateHourly(e.target.value));

      // 🔹 Supprimer le loader
      loader.remove();

    } catch (err) {
      console.error("Erreur :", err);
      loader.remove();
      townNameEl.style.visibility = 'visible';
    }
  }, 1000);
});
