document.getElementById('myForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const cityName = document.getElementById('search').value.trim();
  if (!cityName) {
    console.error("Veuillez entrer une ville.");
    return;
  }

  try {
    // 1️⃣ Géocodage : récupérer coordonnées
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      console.error("Ville non trouvée.");
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    console.log(`Ville : ${name}, Pays : ${country}`);
    console.log(`Coordonnées : lat=${latitude}, lon=${longitude}`);

    // 2️⃣ Appel API météo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&daily=temperature_2m_min,temperature_2m_max&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    // 3️⃣ Afficher la date actuelle
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    console.log(`Aujourd’hui : ${today}`);

    // 4️⃣ Températures heure par heure (aujourd’hui)
    const hours = weatherData.hourly.time;
    const temps = weatherData.hourly.temperature_2m;
    const todayDate = hours[0].split('T')[0];

    const hourlyToday = hours
      .map((time, i) => ({ time, temp: temps[i] }))
      .filter(h => h.time.startsWith(todayDate));

    console.log("Températures heure par heure aujourd’hui :");
    console.table(hourlyToday);

    // 5️⃣ Températures min / max sur la semaine
    const dailyDates = weatherData.daily.time;
    const dailyMin = weatherData.daily.temperature_2m_min;
    const dailyMax = weatherData.daily.temperature_2m_max;

    const weekly = dailyDates.map((date, i) => ({
      date,
      min: dailyMin[i],
      max: dailyMax[i],
    }));

    console.log("Prévisions semaine (min / max) :");
    console.table(weekly);

    // HTML ELEMENTS
    const town = document.querySelector('.town-name-date h4');
    const date = document.querySelector('.date');
    const temperature = document.querySelector('.temperature p');
    const feelLike = document.querySelector('.feel-like');
    const humidity = document.querySelector('.humidity');
    const wind = document.querySelector('.wind');
    const precipitation = document.querySelector('.precipitation');
    // WEEK DAYS
    const tue = document.querySelector('.day.tue');
    const wed = document.querySelector('.day.wed');
    const thu = document.querySelector('.day.thu');
    const fri = document.querySelector('.day.fri');
    const sat = document.querySelector('.day.sat');
    const sun = document.querySelector('.day.sun');
    const mon = document.querySelector('.day.mon');


  } catch (err) {
    console.error("Erreur :", err);
  }
});
