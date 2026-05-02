// Comprehensive location data for CrisisLens - Global coverage
export interface LocationData {
  country: string;
  states: State[];
}

export interface State {
  name: string;
  cities: string[];
}

export const locationData: LocationData[] = [
  {
    country: "India",
    states: [
      {
        name: "Andhra Pradesh",
        cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kakinada", "Rajahmundry", "Nellore", "Kurnool", "Anantapur", "Kadapa"]
      },
      {
        name: "Delhi",
        cities: ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "North East Delhi", "North West Delhi", "South West Delhi", "Shahdara"]
      },
      {
        name: "Karnataka",
        cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Vijayapura", "Shimoga"]
      },
      {
        name: "Maharashtra",
        cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Pimpri-Chinchwad", "Solapur", "Kolhapur", "Amravati"]
      },
      {
        name: "Tamil Nadu",
        cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Erode", "Tirunelveli", "Vellore", "Thoothukudi", "Dindigul"]
      },
      {
        name: "Telangana",
        cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Miryalaguda"]
      },
      {
        name: "Uttar Pradesh",
        cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad", "Ghaziabad", "Noida", "Bareilly", "Aligarh"]
      },
      {
        name: "West Bengal",
        cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Kharagpur", "Shantipur"]
      },
      {
        name: "Gujarat",
        cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Bhuj"]
      },
      {
        name: "Rajasthan",
        cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Jaisalmer", "Sikar", "Alwar", "Bhilwara"]
      },
      {
        name: "Kerala",
        cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram"]
      },
      {
        name: "Punjab",
        cities: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Firozpur", "Pathankot", "Moga", "Mohali"]
      }
    ]
  },
  {
    country: "United States",
    states: [
      {
        name: "California",
        cities: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Fresno", "Long Beach", "Oakland", "Bakersfield", "Anaheim"]
      },
      {
        name: "New York",
        cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"]
      },
      {
        name: "Texas",
        cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"]
      },
      {
        name: "Florida",
        cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"]
      },
      {
        name: "Illinois",
        cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Peoria", "Elgin", "Waukegan", "Cicero"]
      },
      {
        name: "Pennsylvania",
        cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona"]
      },
      {
        name: "Ohio",
        cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"]
      },
      {
        name: "Georgia",
        cities: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Roswell", "Macon", "Johns Creek", "Albany"]
      },
      {
        name: "North Carolina",
        cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Greenville"]
      },
      {
        name: "Michigan",
        cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Clinton Township"]
      }
    ]
  },
  {
    country: "United Kingdom",
    states: [
      {
        name: "England",
        cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Sheffield", "Bristol", "Manchester", "Leicester", "Coventry"]
      },
      {
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Stirling", "Perth", "Dunfermline", "Falkirk", "Motherwell"]
      },
      {
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport", "Wrexham", "Bangor", "Barry", "Neath", "Colwyn Bay", "Caerphilly", "Bridgend"]
      },
      {
        name: "Northern Ireland",
        cities: ["Belfast", "Derry", "Lisburn", "Newtownabbey", "Bangor", "Craigavon", "Ballymena", "Newry", "Armagh", "Larne"]
      }
    ]
  },
  {
    country: "Canada",
    states: [
      {
        name: "Ontario",
        cities: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "Brampton", "London", "Markham", "Windsor", "Kitchener", "Vaughan"]
      },
      {
        name: "Quebec",
        cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Sherbrooke", "Longueuil", "Saguenay", "Trois-Rivières", "Terrebonne", "Saint-Jean-sur-Richelieu"]
      },
      {
        name: "British Columbia",
        cities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Abbotsford", "Coquitlam", "Kelowna", "Saanich", "Langley"]
      },
      {
        name: "Alberta",
        cities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Leduc", "Fort McMurray"]
      },
      {
        name: "Manitoba",
        cities: ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie", "Winkler", "Selkirk", "Morden", "Dauphin", "Flin Flon"]
      }
    ]
  },
  {
    country: "Australia",
    states: [
      {
        name: "New South Wales",
        cities: ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Maitland", "Wagga Wagga", "Albury", "Coffs Harbour", "Tamworth", "Orange"]
      },
      {
        name: "Victoria",
        cities: ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Mildura", "Warrnambool", "Sunbury", "Sale", "Traralgon"]
      },
      {
        name: "Queensland",
        cities: ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba", "Mackay", "Rockhampton", "Bundaberg", "Hervey Bay"]
      },
      {
        name: "Western Australia",
        cities: ["Perth", "Fremantle", "Mandurah", "Bunbury", "Geraldton", "Albany", "Kalgoorlie", "Busselton", "Rockingham", "Karratha"]
      },
      {
        name: "South Australia",
        cities: ["Adelaide", "Mount Gambier", "Whyalla", "Murray Bridge", "Port Augusta", "Port Pirie", "Victor Harbor", "Elizabeth", " Gawler", "Port Lincoln"]
      }
    ]
  },
  {
    country: "Germany",
    states: [
      {
        name: "Bavaria",
        cities: ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Würzburg", "Ingolstadt", "Fürth", "Erlangen", "Bayreuth", "Bamberg"]
      },
      {
        name: "Berlin",
        cities: ["Berlin", "Potsdam", "Cottbus", "Brandenburg an der Havel", "Frankfurt (Oder)", "Potsdam", "Schönefeld", "Teltow", "Hennigsdorf", "Oranienburg"]
      },
      {
        name: "Hamburg",
        cities: ["Hamburg", "Norderstedt", "Harburg", "Buxtehude", "Ahrensburg", "Pinneberg", "Stade", "Wedel", "Buchholz in der Nordheide", "Uelzen"]
      },
      {
        name: "Hesse",
        cities: ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach", "Hanau", "Marburg", "Giessen", "Wetzlar", "Fulda"]
      },
      {
        name: "North Rhine-Westphalia",
        cities: ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster"]
      }
    ]
  },
  {
    country: "France",
    states: [
      {
        name: "Île-de-France",
        cities: ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Montreuil", "Versailles", "Créteil", "Nanterre", "Vitry-sur-Seine", "Argenteuil", "Saint-Maur-des-Fossés"]
      },
      {
        name: "Provence-Alpes-Côte d'Azur",
        cities: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Cannes", "Antibes", "Arles", "Nîmes", "Fréjus"]
      },
      {
        name: "Auvergne-Rhône-Alpes",
        cities: ["Lyon", "Grenoble", "Saint-Étienne", "Clermont-Ferrand", "Annecy", "Valence", "Chambéry", "Villeurbanne", "Vienne", "Bourg-en-Bresse"]
      },
      {
        name: "Nouvelle-Aquitaine",
        cities: ["Bordeaux", "Toulouse", "Pau", "Limoges", "Bayonne", "Poitiers", "Périgueux", "Angoulême", "La Rochelle", "Brive-la-Gaillarde"]
      },
      {
        name: "Hauts-de-France",
        cities: ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkerque", "Valenciennes", "Lens", "Douai", "Béthune", "Saint-Quentin"]
      }
    ]
  },
  {
    country: "Japan",
    states: [
      {
        name: "Tokyo",
        cities: ["Tokyo", "Shinjuku", "Shibuya", "Shinagawa", "Setagaya", "Bunkyo", "Meguro", "Minato", "Chiyoda", "Chuo"]
      },
      {
        name: "Osaka",
        cities: ["Osaka", "Sakai", "Kobe", "Kyoto", "Nara", "Higashiosaka", "Hirakata", "Suita", "Takatsuki", "Ibaraki"]
      },
      {
        name: "Kanagawa",
        cities: ["Yokohama", "Kawasaki", "Sagamihara", "Yokosuka", "Fujisawa", "Kamakura", "Hiratsuka", "Odawara", "Atsugi", "Ebina"]
      },
      {
        name: "Aichi",
        cities: ["Nagoya", "Toyota", "Ichinomiya", "Kasugai", "Seto", "Handa", "Tokoname", "Inazawa", "Kariya", "Toyohashi"]
      },
      {
        name: "Fukuoka",
        cities: ["Fukuoka", "Kitakyushu", "Kurume", "Omuta", "Iizuka", "Yame", "Chikugo", "Dazaifu", "Yukuhashi", "Miyawaka"]
      }
    ]
  },
  {
    country: "China",
    states: [
      {
        name: "Beijing",
        cities: ["Beijing", "Chaoyang", "Haidian", "Fengtai", "Tongzhou", "Shijingshan", "Changping", "Daxing", "Shunyi", "Mentougou"]
      },
      {
        name: "Shanghai",
        cities: ["Shanghai", "Pudong", "Minhang", "Baoshan", "Jiading", "Jinshan", "Songjiang", "Qingpu", "Fengxian", "Chongming"]
      },
      {
        name: "Guangdong",
        cities: ["Guangzhou", "Shenzhen", "Dongguan", "Foshan", "Zhuhai", "Zhongshan", "Jiangmen", "Huizhou", "Zhaoqing", "Shantou"]
      },
      {
        name: "Jiangsu",
        cities: ["Nanjing", "Suzhou", "Wuxi", "Changzhou", "Nantong", "Yangzhou", "Taizhou", "Xuzhou", "Lianyungang", "Huai'an"]
      },
      {
        name: "Zhejiang",
        cities: ["Hangzhou", "Ningbo", "Wenzhou", "Jiaxing", "Shaoxing", "Jinhua", "Taizhou", "Huzhou", "Quzhou", "Lishui"]
      }
    ]
  },
  {
    country: "Brazil",
    states: [
      {
        name: "São Paulo",
        cities: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "São José dos Campos", "Osasco", "Ribeirão Preto", "Sorocaba", "Santos"]
      },
      {
        name: "Rio de Janeiro",
        cities: ["Rio de Janeiro", "Niterói", "Duque de Caxias", "Nova Iguaçu", "São Gonçalo", "Belford Roxo", "São João de Meriti", "Mesquita", "Nilópolis", "Queimados"]
      },
      {
        name: "Minas Gerais",
        cities: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga"]
      },
      {
        name: "Bahia",
        cities: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Ilhéus", "Jequié", "Alagoinhas", "Barreiras"]
      },
      {
        name: "Paraná",
        cities: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá"]
      }
    ]
  },
  {
    country: "Russia",
    states: [
      {
        name: "Moscow",
        cities: ["Moscow", "Krasnogorsk", "Khimki", "Balashikha", "Podolsk", "Korolyov", "Lyubertsy", "Mytishchi", "Domodedovo", "Shchyolkovo"]
      },
      {
        name: "Saint Petersburg",
        cities: ["Saint Petersburg", "Gatchina", "Peterhof", "Pushkin", "Kolpino", "Vyborg", "Pskov", "Veliky Novgorod", "Murmansk", "Arkhangelsk"]
      },
      {
        name: "Novosibirsk",
        cities: ["Novosibirsk", "Berdsk", "Iskitim", "Krasnoobsk", "Ob", "Kuybyshev", "Barabinsk", "Toguchin", "Linëvo", "Cherepanovo"]
      },
      {
        name: "Yekaterinburg",
        cities: ["Yekaterinburg", "Nizhny Tagil", "Kamensk-Uralsky", "Pervouralsk", "Serov", "Novouralsk", "Pyshma", "Kachkanar", "Krasnoturinsk", "Ivdel"]
      },
      {
        name: "Kazan",
        cities: ["Kazan", "Naberezhnye Chelny", "Nizhnekamsk", "Almetyevsk", "Zelenodolsk", "Bugulma", "Yelabuga", "Chistopol", "Zainsk", "Bavly"]
      }
    ]
  },
  {
    country: "South Africa",
    states: [
      {
        name: "Gauteng",
        cities: ["Johannesburg", "Pretoria", "Soweto", "Sandton", "Rooseveltpark", "Randburg", "Roodepoort", "Midrand", "Kempton Park", "Boksburg"]
      },
      {
        name: "Cape Town",
        cities: ["Cape Town", "Stellenbosch", "Paarl", "Worcester", "George", "Knysna", "Mossel Bay", "Oudtshoorn", "Hermanus", "Saldanha"]
      },
      {
        name: "KwaZulu-Natal",
        cities: ["Durban", "Pietermaritzburg", "Umhlanga", "Richards Bay", "Newcastle", "Pinetown", "Amanzimtoti", "Ballito", "Umlazi", "Chatsworth"]
      },
      {
        name: "Eastern Cape",
        cities: ["Port Elizabeth", "East London", "Gqeberha", "Mthatha", "Queenstown", "Graaff-Reinet", "Cradock", "Aliwal North", "Kokstad", "Uitenhage"]
      },
      {
        name: "Western Cape",
        cities: ["Cape Town", "Stellenbosch", "Paarl", "Worcester", "George", "Knysna", "Mossel Bay", "Oudtshoorn", "Hermanus", "Saldanha"]
      }
    ]
  },
  {
    country: "Mexico",
    states: [
      {
        name: "Mexico City",
        cities: ["Mexico City", "Ecatepec", "Guadalajara", "Puebla", "Ciudad Juárez", "Tijuana", "León", "Monterrey", "Zapopan", "Nezahualcóyotl"]
      },
      {
        name: "Jalisco",
        cities: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta", "Ciudad Guzmán", "Lagos de Moreno", "Autlán de Navarro", "Ocotlán", "Ameca"]
      },
      {
        name: "Nuevo León",
        cities: ["Monterrey", "Guadalupe", "San Nicolás de los Garza", "Apodaca", "Escobedo", "Santa Catarina", "San Pedro Garza García", "General Escobedo", "García", "Juárez"]
      },
      {
        name: "Puebla",
        cities: ["Puebla", "Heroica Puebla de Zaragoza", "San Andrés Cholula", "San Martín Texmelucan", "Tlaxcala", "Acatzingo", "Atlixco", "Tehuacán", "Huejotzingo", "Cholula"]
      },
      {
        name: "Veracruz",
        cities: ["Veracruz", "Xalapa", "Coatzacoalcos", "Minatitlán", "Poza Rica", "Córdoba", "Orizaba", "Tuxpan", "Papantla", "Acayucan"]
      }
    ]
  },
  {
    country: "South Korea",
    states: [
      {
        name: "Seoul",
        cities: ["Seoul", "Gangnam", "Gangbuk", "Seocho", "Songpa", "Mapo", "Yongsan", "Jongno", "Gangseo", "Yangcheon"]
      },
      {
        name: "Busan",
        cities: ["Busan", "Haeundae", "Gangseo", "Seo", "Dongnae", "Yeongdo", "Geumjeong", "Saha", "Sasang", "Nam-gu"]
      },
      {
        name: "Incheon",
        cities: ["Incheon", "Bupyeong", "Gyeyang", "Namdong", "Michuhol", "Yeonsu", "Jung-gu", "Dong-gu", "Namdong-gu", "Seo-gu"]
      },
      {
        name: "Daegu",
        cities: ["Daegu", "Jung-gu", "Dong-gu", "Seo-gu", "Buk-gu", "Suseong-gu", "Dalseo-gu", "Dalseong-gun", "Nam-gu", "Suseong-gu"]
      },
      {
        name: "Gyeonggi",
        cities: ["Suwon", "Seongnam", "Goyang", "Yongin", "Ansan", "Anyang", "Bucheon", "Gwangmyeong", "Uijeongbu", "Paju"]
      }
    ]
  },
  {
    country: "Singapore",
    states: [
      {
        name: "Central Region",
        cities: ["Singapore", "Marina Bay", "Orchard", "Raffles Place", "Tanjong Pagar", "Bugis", "City Hall", "Clarke Quay", "Boat Quay", "Chinatown"]
      },
      {
        name: "East Region",
        cities: ["Bedok", "Tampines", "Pasir Ris", "Changi", "Punggol", "Sengkang", "Hougang", "Serangoon", "Kallang", "Geylang"]
      },
      {
        name: "West Region",
        cities: ["Jurong", "Clementi", "Bukit Batok", "Bukit Panjang", "Choa Chu Kang", "Woodlands", "Yishun", "Sembawang", "Tengah", "Tuas"]
      },
      {
        name: "North Region",
        cities: ["Woodlands", "Yishun", "Sembawang", "Kranji", "Mandai", "Sungei Kadut", "Admiralty", "Canberra", "Sembawang", "Woodlands"]
      },
      {
        name: "North-East Region",
        cities: ["Hougang", "Sengkang", "Punggol", "Serangoon", "Kovan", "Buangkok", "Rivervale", "Compassvale", "Anchorvale", "Lorong Halus"]
      }
    ]
  },
  {
    country: "United Arab Emirates",
    states: [
      {
        name: "Dubai",
        cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah", "Al Ain", "Dubai Marina", "Jumeirah"]
      },
      {
        name: "Abu Dhabi",
        cities: ["Abu Dhabi", "Al Ain", "Liwa", "Madinat Zayed", "Ghayathi", "Ruwais", "Dalma Island", "Bani Yas", "Sir Bani Yas", "Jebel Dhanna"]
      },
      {
        name: "Sharjah",
        cities: ["Sharjah", "Al Khan", "Al Majaz", "Al Qasba", "Al Nahda", "Al Rolla", "Al Yarmook", "Mleiha", "Kalba", "Khor Fakkan"]
      },
      {
        name: "Ras Al Khaimah",
        cities: ["Ras Al Khaimah", "Al Hamra", "Al Jazirah Al Hamra", "Al Nakheel", "Al Seer", "Dhayd", "Ghalilah", "Jazirat Al Hamra", "Khuzam", "Mina Al Arab"]
      },
      {
        name: "Fujairah",
        cities: ["Fujairah", "Dibba Al Fujairah", "Khor Fakkan", "Kalba", "Masafi", "Qidfa", "Bidiyah", "Murbeh", "Saqamqam", "Wadi Saham"]
      }
    ]
  }
];

export function getCountries(): string[] {
  return locationData.map(loc => loc.country);
}

export function getStates(country: string): string[] {
  const countryData = locationData.find(loc => loc.country === country);
  return countryData?.states.map(state => state.name) || [];
}

export function getCities(country: string, state: string): string[] {
  const countryData = locationData.find(loc => loc.country === country);
  const stateData = countryData?.states.find(s => s.name === state);
  return stateData?.cities || [];
}

export function getDefaultCountry(): string {
  return "India";
}
