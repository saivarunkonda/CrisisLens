// Script to fetch comprehensive location data from online APIs and generate hardcoded data
// Run this with: node scripts/fetch-location-data.js

const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchCountries() {
  console.log('Fetching countries from REST Countries API...');
  const response = await fetchJSON('https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion,capital,population');
  
  return response
    .filter(country => country.population > 1000000) // Only countries with >1M population
    .map(country => ({
      name: country.name.common,
      code: country.cca2,
      region: country.region,
      subregion: country.subregion,
      capital: country.capital?.[0] || '',
      population: country.population
    }))
    .sort((a, b) => b.population - a.population)
    .slice(0, 50); // Top 50 countries by population
}

async function generateLocationData() {
  try {
    const countries = await fetchCountries();
    
    const locationData = countries.map(country => {
      // Generate states based on subregion or use capital as default
      const states = [];
      
      if (country.subregion) {
        states.push({ name: country.subregion, cities: [country.capital] });
      }
      
      // Add major cities based on country
      const majorCities = getMajorCitiesForCountry(country.code);
      if (majorCities.length > 1) {
        states[0].cities = majorCities;
      }
      
      return {
        country: country.name,
        states: states
      };
    }).filter(item => item.states.length > 0);
    
    console.log('Generated location data for', locationData.length, 'countries');
    console.log('Generated TypeScript code:');
    console.log(JSON.stringify(locationData, null, 2));
    
    return locationData;
  } catch (error) {
    console.error('Error fetching location data:', error);
    return null;
  }
}

function getMajorCitiesForCountry(countryCode) {
  // This is a simplified version - in production, you'd use a more comprehensive source
  const cityData = {
    'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'],
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    'GB': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow', 'Sheffield', 'Edinburgh', 'Bristol', 'Manchester'],
    'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
    'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Logan City'],
    'DE': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
    'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
    'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba', 'Manaus', 'Recife', 'Porto Alegre'],
    'RU': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don'],
    'JP': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Kobe', 'Kyoto', 'Fukuoka', 'Kawasaki', 'Saitama'],
    'CN': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Tianjin', 'Chongqing', 'Chengdu', 'Nanjing', 'Hangzhou'],
    'ZA': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Nelspruit', 'Kimberley'],
    'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'San Luis Potosí', 'Querétaro'],
    'KR': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang'],
    'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba'],
    'SG': ['Singapore', 'Woodlands', 'Tampines', 'Pasir Ris', 'Bedok', 'Jurong West', 'Sengkang', 'Hougang', 'Punggol', 'Yishun'],
    'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
    'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
    'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'],
    'ID': ['Jakarta', 'Surabaya', 'Bandung', 'Bekasi', 'Medan', 'Tangerang', 'Depok', 'Semarang', 'Palembang', 'Makassar'],
    'TR': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin'],
    'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Abha', 'Khamis Mushait'],
    'EG': ['Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said', 'Luxor', 'Mansoura', 'Mahalla', 'Tanta', 'Asyut'],
    'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
    'TH': ['Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Chiang Mai', 'Phuket', 'Pattaya', 'Udon Thani', 'Khon Kaen', 'Nakhon Ratchasima'],
    'VN': ['Ho Chi Minh City', 'Hanoi', 'Hai Phong', 'Can Tho', 'Da Nang', 'Bien Hoa', 'Hue', 'Nha Trang', 'Rach Gia', 'Quy Nhon'],
    'PH': ['Manila', 'Quezon City', 'Davao', 'Caloocan', 'Cebu City', 'Zamboanga', 'Antipolo', 'Taguig', 'Pasig', 'Cagayan de Oro'],
    'MY': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Malacca', 'Kota Kinabalu', 'Kuching', 'Seremban'],
    'BD': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Rangpur', 'Barisal', 'Comilla', 'Gazipur', 'Mymensingh'],
    'NG': ['Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos'],
    'PK': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta', 'Islamabad'],
    'IR': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia'],
    'SD': ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Nyala', 'Juba', 'Wad Madani', 'Al-Obeid', 'Kosti', 'Atbara'],
    'KE': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kehancha', 'Kitale', 'Garissa', 'Malindi', 'Machakos'],
    'CO': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué'],
    'CL': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán'],
    'PE': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Huancayo', 'Chimbote', 'Pucallpa'],
    'VE': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'San Cristóbal', 'Maturín', 'Barinas', 'Puerto La Cruz'],
    'UA': ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol'],
    'PL': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Białystok'],
    'SE': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'],
    'NO': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Fredrikstad', 'Tromsø', 'Sandnes', 'Drammen', 'Skien'],
    'DK': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'],
    'FI': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Pori', 'Kouvola'],
    'CH': ['Zürich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel/Bienne'],
    'AT': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'],
    'BE': ['Brussels', 'Antwerp', 'Ghent', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Seraing'],
    'GR': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Ioannina', 'Trikala', 'Chania', 'Alexandroupoli'],
    'PT': ['Lisbon', 'Porto', 'Amadora', 'Braga', 'Setúbal', 'Coimbra', 'Funchal', 'Vila Nova de Gaia', 'Évora', 'Aveiro'],
    'IE': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan'],
    'CZ': ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Budweis', 'Hradec Králové', 'Pardubice', 'Karlovy Vary'],
    'HU': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely'],
    'RO': ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Brăila'],
    'BG': ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen'],
    'HR': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Karlovac', 'Varaždin', 'Dubrovnik'],
    'SK': ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica', 'Nitra', 'Trnava', 'Martin', 'Trenčín', 'Poprad'],
    'SI': ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Kamnik', 'Domžale'],
    'EE': ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Maardu', 'Viljandi', 'Rakvere', 'Sillamäe', 'Kuressaare'],
    'LV': ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala', 'Ventspils', 'Rēzekne', 'Valmiera', 'Ogre', 'Jēkabpils'],
    'LT': ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Mažeikiai', 'Jonava', 'Utena'],
    'BY': ['Minsk', 'Gomel', 'Mogilev', 'Vitebsk', 'Grodno', 'Brest', 'Babruysk', 'Baranovichi', 'Borisov', 'Pinsk'],
    'KZ': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Oskemen', 'Semey', 'Oral'],
    'UZ': ['Tashkent', 'Samarkand', 'Namangan', 'Andijan', 'Bukhara', 'Fergana', 'Qarshi', 'Kokand', 'Nukus', 'Termez'],
    'NZ': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson', 'Rotorua'],
    'IE': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray', 'Navan']
  };
  
  return cityData[countryCode] || [country.capital || 'Capital'];
}

generateLocationData().then(data => {
  if (data) {
    console.log('\n\n=== COPY THIS TO location-data.ts ===\n');
    console.log('export const locationData: LocationData[] =', JSON.stringify(data, null, 2), ';');
  }
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
