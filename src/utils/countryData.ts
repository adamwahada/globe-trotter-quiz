// Famous people data by country
// NOTE: Only countries that exist in the world-atlas GeoJSON are included.
// Small island nations and micro-states have been removed to ensure all countries can be highlighted.
export const countryFamousPeople: Record<string, string> = {
  'Afghanistan': 'Ahmad Shah Massoud',
  'Albania': 'Mother Teresa',
  'Algeria': 'Abdelaziz Bouteflika',
  'Angola': 'Agostinho Neto',
  'Argentina': 'Lionel Messi',
  'Armenia': 'Charles Aznavour',
  'Australia': 'Chris Hemsworth',
  'Austria': 'Wolfgang Amadeus Mozart',
  'Azerbaijan': 'Heydar Aliyev',
  'Bahamas': 'Sidney Poitier',
  'Bangladesh': 'Sheikh Mujibur Rahman',
  'Belarus': 'Marc Chagall',
  'Belgium': 'Jean-Claude Van Damme',
  'Belize': 'Dean Barrow',
  'Benin': 'Angélique Kidjo',
  'Bhutan': 'Jigme Khesar Namgyel Wangchuck',
  'Bolivia': 'Evo Morales',
  'Bosnia and Herzegovina': 'Goran Bregović',
  'Botswana': 'Seretse Khama',
  'Brazil': 'Pelé',
  'Brunei': 'Hassanal Bolkiah',
  'Bulgaria': 'Hristo Stoichkov',
  'Burkina Faso': 'Thomas Sankara',
  'Burundi': 'Melchior Ndadaye',
  'Cambodia': 'King Norodom Sihanouk',
  'Cameroon': 'Roger Milla',
  'Canada': 'Justin Bieber',
  'Central African Republic': 'Barthélemy Boganda',
  'Chad': 'Idriss Déby',
  'Chile': 'Pablo Neruda',
  'China': 'Confucius',
  'Colombia': 'Shakira',
  'Congo': 'Papa Wemba',
  'Costa Rica': 'Óscar Arias',
  'Croatia': 'Nikola Tesla',
  'Cuba': 'Fidel Castro',
  'Cyprus': 'Makarios III',
  'Czechia': 'Franz Kafka',
  'Denmark': 'Hans Christian Andersen',
  'Djibouti': 'Hassan Gouled Aptidon',
  'Dominican Republic': 'Juan Pablo Duarte',
  'Ecuador': 'Eloy Alfaro',
  'Egypt': 'Cleopatra',
  'El Salvador': 'Óscar Romero',
  'Equatorial Guinea': 'Teodoro Obiang',
  'Eritrea': 'Isaias Afwerki',
  'Estonia': 'Arvo Pärt',
  'Eswatini': 'King Mswati III',
  'Ethiopia': 'Haile Selassie',
  'Fiji': 'Ratu Sir Lala Sukuna',
  'Finland': 'Jean Sibelius',
  'France': 'Napoleon Bonaparte',
  'Gabon': 'Omar Bongo',
  'Gambia': 'Dawda Jawara',
  'Georgia': 'Joseph Stalin',
  'Germany': 'Albert Einstein',
  'Ghana': 'Kwame Nkrumah',
  'Greece': 'Aristotle',
  'Guatemala': 'Rigoberta Menchú',
  'Guinea': 'Ahmed Sékou Touré',
  'Guinea-Bissau': 'Amílcar Cabral',
  'Guyana': 'Cheddi Jagan',
  'Haiti': 'Toussaint Louverture',
  'Honduras': 'Francisco Morazán',
  'Hungary': 'Ferenc Puskás',
  'Iceland': 'Björk',
  'India': 'Mahatma Gandhi',
  'Indonesia': 'Sukarno',
  'Iran': 'Cyrus the Great',
  'Iraq': 'Saddam Hussein',
  'Ireland': 'James Joyce',
  'Israel': 'Golda Meir',
  'Italy': 'Leonardo da Vinci',
  'Ivory Coast': 'Didier Drogba',
  'Jamaica': 'Bob Marley',
  'Japan': 'Hayao Miyazaki',
  'Jordan': 'King Hussein',
  'Kazakhstan': 'Abai Qunanbaiuly',
  'Kenya': 'Wangari Maathai',
  'North Korea': 'Kim Il-sung',
  'South Korea': 'BTS',
  'Kosovo': 'Rita Ora',
  'Kuwait': 'Sheikh Sabah Al-Ahmed',
  'Kyrgyzstan': 'Manas',
  'Laos': 'Kaysone Phomvihane',
  'Latvia': 'Rainis',
  'Lebanon': 'Fairuz',
  'Lesotho': 'Ntsu Mokhehle',
  'Liberia': 'Ellen Johnson Sirleaf',
  'Libya': 'Omar al-Mukhtar',
  'Lithuania': 'Jonas Basanavičius',
  'Luxembourg': 'Jean, Grand Duke of Luxembourg',
  'Madagascar': 'Philibert Tsiranana',
  'Malawi': 'Hastings Banda',
  'Malaysia': 'Tunku Abdul Rahman',
  'Mali': 'Modibo Keïta',
  'Mauritania': 'Moktar Ould Daddah',
  'Mexico': 'Benito Juárez',
  'Moldova': 'Stephen the Great',
  'Mongolia': 'Genghis Khan',
  'Montenegro': 'Petar II Petrović-Njegoš',
  'Morocco': 'King Mohammed V',
  'Mozambique': 'Samora Machel',
  'Myanmar': 'Aung San',
  'Namibia': 'Sam Nujoma',
  'Nepal': 'Tenzing Norgay',
  'Netherlands': 'Vincent van Gogh',
  'New Zealand': 'Sir Edmund Hillary',
  'Nicaragua': 'Augusto Sandino',
  'Niger': 'Hamani Diori',
  'Nigeria': 'Chinua Achebe',
  'North Macedonia': 'Mother Teresa',
  'Norway': 'Roald Amundsen',
  'Oman': 'Sultan Qaboos',
  'Pakistan': 'Muhammad Ali Jinnah',
  'Panama': 'Mariano Rivera',
  'Papua New Guinea': 'Sir Michael Somare',
  'Paraguay': 'José Gaspar Rodríguez de Francia',
  'Peru': 'Mario Vargas Llosa',
  'Philippines': 'José Rizal',
  'Poland': 'Marie Curie',
  'Portugal': 'Vasco da Gama',
  'Qatar': 'Sheikh Tamim',
  'Romania': 'Nicolae Ceaușescu',
  'Russia': 'Peter the Great',
  'Rwanda': 'Paul Kagame',
  'Saudi Arabia': 'King Abdulaziz',
  'Senegal': 'Léopold Sédar Senghor',
  'Serbia': 'Novak Djokovic',
  'Sierra Leone': 'Milton Margai',
  'Slovakia': 'Ľudovít Štúr',
  'Slovenia': 'France Prešeren',
  'Solomon Islands': 'Sir Peter Kenilorea',
  'Somalia': 'Ayaan Hirsi Ali',
  'South Africa': 'Nelson Mandela',
  'South Sudan': 'Salva Kiir',
  'Spain': 'Pablo Picasso',
  'Sri Lanka': 'Mahinda Rajapaksa',
  'Sudan': 'Ahmed al-Mirghani',
  'Suriname': 'Desi Bouterse',
  'Sweden': 'Alfred Nobel',
  'Switzerland': 'Roger Federer',
  'Syria': 'Nizar Qabbani',
  'Taiwan': 'Chiang Kai-shek',
  'Tajikistan': 'Rudaki',
  'Tanzania': 'Julius Nyerere',
  'Thailand': 'King Bhumibol Adulyadej',
  'Togo': 'Gnassingbé Eyadéma',
  'Trinidad and Tobago': 'Nicki Minaj',
  'Tunisia': 'Habib Bourguiba',
  'Turkey': 'Mustafa Kemal Atatürk',
  'Turkmenistan': 'Saparmurat Niyazov',
  'Uganda': 'Idi Amin',
  'Ukraine': 'Taras Shevchenko',
  'United Arab Emirates': 'Sheikh Zayed',
  'United Kingdom': 'William Shakespeare',
  'United States': 'George Washington',
  'Uruguay': 'José Artigas',
  'Uzbekistan': 'Amir Timur',
  'Vanuatu': 'Walter Lini',
  'Venezuela': 'Simón Bolívar',
  'Vietnam': 'Ho Chi Minh',
  'Yemen': 'Ali Abdullah Saleh',
  'Zambia': 'Kenneth Kaunda',
  'Zimbabwe': 'Robert Mugabe',
};

// Country to ISO 3166-1 alpha-2 code mapping for flag emojis
export const countryIsoCodes: Record<string, string> = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
  'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT',
  'Azerbaijan': 'AZ', 'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Barbados': 'BB',
  'Belarus': 'BY', 'Belgium': 'BE', 'Belize': 'BZ', 'Benin': 'BJ', 'Bhutan': 'BT',
  'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR', 'Brunei': 'BN',
  'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Burundi': 'BI', 'Cabo Verde': 'CV', 'Cambodia': 'KH',
  'Cameroon': 'CM', 'Canada': 'CA', 'Central African Republic': 'CF', 'Chad': 'TD', 'Chile': 'CL',
  'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM', 'Congo': 'CG', 'DR Congo': 'CD', 'Democratic Republic of the Congo': 'CD', 'Costa Rica': 'CR',
  'Croatia': 'HR', 'Cuba': 'CU', 'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Denmark': 'DK', 'Djibouti': 'DJ', 'Dominica': 'DM', 'Dominican Republic': 'DO', 'Ecuador': 'EC',
  'Egypt': 'EG', 'El Salvador': 'SV', 'Equatorial Guinea': 'GQ', 'Eritrea': 'ER', 'Estonia': 'EE',
  'Eswatini': 'SZ', 'Ethiopia': 'ET', 'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR',
  'Gabon': 'GA', 'Gambia': 'GM', 'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH',
  'Greece': 'GR', 'Grenada': 'GD', 'Guatemala': 'GT', 'Guinea': 'GN', 'Guinea-Bissau': 'GW',
  'Guyana': 'GY', 'Haiti': 'HT', 'Honduras': 'HN', 'Hungary': 'HU', 'Iceland': 'IS',
  'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE',
  'Israel': 'IL', 'Italy': 'IT', 'Ivory Coast': 'CI', 'Jamaica': 'JM', 'Japan': 'JP',
  'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kiribati': 'KI', 'North Korea': 'KP',
  'South Korea': 'KR', 'Kosovo': 'XK', 'Kuwait': 'KW', 'Kyrgyzstan': 'KG', 'Laos': 'LA',
  'Latvia': 'LV', 'Lebanon': 'LB', 'Lesotho': 'LS', 'Liberia': 'LR', 'Libya': 'LY',
  'Liechtenstein': 'LI', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Madagascar': 'MG', 'Malawi': 'MW',
  'Malaysia': 'MY', 'Maldives': 'MV', 'Mali': 'ML', 'Malta': 'MT', 'Marshall Islands': 'MH',
  'Mauritania': 'MR', 'Mauritius': 'MU', 'Mexico': 'MX', 'Micronesia': 'FM', 'Moldova': 'MD',
  'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME', 'Morocco': 'MA', 'Mozambique': 'MZ',
  'Myanmar': 'MM', 'Namibia': 'NA', 'Nauru': 'NR', 'Nepal': 'NP', 'Netherlands': 'NL',
  'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Niger': 'NE', 'Nigeria': 'NG', 'North Macedonia': 'MK',
  'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK', 'Palau': 'PW', 'Panama': 'PA',
  'Papua New Guinea': 'PG', 'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH', 'Poland': 'PL',
  'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO', 'Russia': 'RU', 'Rwanda': 'RW',
  'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC', 'Saint Vincent and the Grenadines': 'VC',
  'Samoa': 'WS', 'San Marino': 'SM', 'Sao Tome and Principe': 'ST', 'Saudi Arabia': 'SA',
  'Senegal': 'SN', 'Serbia': 'RS', 'Seychelles': 'SC', 'Sierra Leone': 'SL', 'Singapore': 'SG',
  'Slovakia': 'SK', 'Slovenia': 'SI', 'Solomon Islands': 'SB', 'Somalia': 'SO', 'South Africa': 'ZA',
  'South Sudan': 'SS', 'Spain': 'ES', 'Sri Lanka': 'LK', 'Sudan': 'SD', 'Suriname': 'SR',
  'Sweden': 'SE', 'Switzerland': 'CH', 'Syria': 'SY', 'Taiwan': 'TW', 'Tajikistan': 'TJ',
  'Tanzania': 'TZ', 'Thailand': 'TH', 'Togo': 'TG', 'Tonga': 'TO', 'Trinidad and Tobago': 'TT',
  'Tunisia': 'TN', 'Turkey': 'TR', 'Turkmenistan': 'TM', 'Tuvalu': 'TV', 'Uganda': 'UG',
  'Ukraine': 'UA', 'United Arab Emirates': 'AE', 'United Kingdom': 'GB', 'United States': 'US',
  'United States of America': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Vanuatu': 'VU',
  'Vatican City': 'VA', 'Venezuela': 'VE', 'Vietnam': 'VN', 'Yemen': 'YE', 'Zambia': 'ZM', 'Zimbabwe': 'ZW',
};

// Get flag image URL for a country (uses flagcdn.com for reliable display)
export const getCountryFlagUrl = (country: string): string => {
  const isoCode = countryIsoCodes[country];
  if (!isoCode) return '';
  return `https://flagcdn.com/w160/${isoCode.toLowerCase()}.png`;
};

// Get flag for a country - returns the URL for image display
export const getCountryFlag = (country: string): string => {
  return getCountryFlagUrl(country);
};

export const countryContinent: Record<string, string> = {
  // Africa
  'Algeria': 'Africa', 'Angola': 'Africa', 'Benin': 'Africa', 'Botswana': 'Africa',
  'Burkina Faso': 'Africa', 'Burundi': 'Africa', 'Cabo Verde': 'Africa', 'Cameroon': 'Africa',
  'Central African Republic': 'Africa', 'Chad': 'Africa', 'Comoros': 'Africa', 'Congo': 'Africa',
  'Djibouti': 'Africa', 'Egypt': 'Africa', 'Equatorial Guinea': 'Africa', 'Eritrea': 'Africa',
  'Eswatini': 'Africa', 'Ethiopia': 'Africa', 'Gabon': 'Africa', 'Gambia': 'Africa',
  'Ghana': 'Africa', 'Guinea': 'Africa', 'Guinea-Bissau': 'Africa', 'Ivory Coast': 'Africa',
  'Kenya': 'Africa', 'Lesotho': 'Africa', 'Liberia': 'Africa', 'Libya': 'Africa',
  'Madagascar': 'Africa', 'Malawi': 'Africa', 'Mali': 'Africa', 'Mauritania': 'Africa',
  'Mauritius': 'Africa', 'Morocco': 'Africa', 'Mozambique': 'Africa', 'Namibia': 'Africa',
  'Niger': 'Africa', 'Nigeria': 'Africa', 'Rwanda': 'Africa', 'Sao Tome and Principe': 'Africa',
  'Senegal': 'Africa', 'Seychelles': 'Africa', 'Sierra Leone': 'Africa', 'Somalia': 'Africa',
  'South Africa': 'Africa', 'South Sudan': 'Africa', 'Sudan': 'Africa', 'Tanzania': 'Africa',
  'Togo': 'Africa', 'Tunisia': 'Africa', 'Uganda': 'Africa', 'Zambia': 'Africa', 'Zimbabwe': 'Africa',

  // Asia
  'Afghanistan': 'Asia', 'Armenia': 'Asia', 'Azerbaijan': 'Asia', 'Bahrain': 'Asia',
  'Bangladesh': 'Asia', 'Bhutan': 'Asia', 'Brunei': 'Asia', 'Cambodia': 'Asia',
  'China': 'Asia', 'Georgia': 'Asia', 'India': 'Asia', 'Indonesia': 'Asia',
  'Iran': 'Asia', 'Iraq': 'Asia', 'Israel': 'Asia', 'Japan': 'Asia',
  'Jordan': 'Asia', 'Kazakhstan': 'Asia', 'Kuwait': 'Asia', 'Kyrgyzstan': 'Asia',
  'Laos': 'Asia', 'Lebanon': 'Asia', 'Malaysia': 'Asia', 'Maldives': 'Asia',
  'Mongolia': 'Asia', 'Myanmar': 'Asia', 'Nepal': 'Asia', 'North Korea': 'Asia',
  'Oman': 'Asia', 'Pakistan': 'Asia', 'Philippines': 'Asia', 'Qatar': 'Asia',
  'Saudi Arabia': 'Asia', 'Singapore': 'Asia', 'South Korea': 'Asia', 'Sri Lanka': 'Asia',
  'Syria': 'Asia', 'Taiwan': 'Asia', 'Tajikistan': 'Asia', 'Thailand': 'Asia',
  'Turkmenistan': 'Asia', 'United Arab Emirates': 'Asia', 'Uzbekistan': 'Asia',
  'Vietnam': 'Asia', 'Yemen': 'Asia',

  // Europe
  'Albania': 'Europe', 'Andorra': 'Europe', 'Austria': 'Europe', 'Belarus': 'Europe',
  'Belgium': 'Europe', 'Bosnia and Herzegovina': 'Europe', 'Bulgaria': 'Europe', 'Croatia': 'Europe',
  'Cyprus': 'Europe', 'Czech Republic': 'Europe', 'Czechia': 'Europe', 'Denmark': 'Europe',
  'Estonia': 'Europe', 'Finland': 'Europe', 'France': 'Europe', 'Germany': 'Europe',
  'Greece': 'Europe', 'Hungary': 'Europe', 'Iceland': 'Europe', 'Ireland': 'Europe',
  'Italy': 'Europe', 'Kosovo': 'Europe', 'Latvia': 'Europe', 'Liechtenstein': 'Europe',
  'Lithuania': 'Europe', 'Luxembourg': 'Europe', 'Malta': 'Europe', 'Moldova': 'Europe',
  'Monaco': 'Europe', 'Montenegro': 'Europe', 'Netherlands': 'Europe', 'North Macedonia': 'Europe',
  'Norway': 'Europe', 'Poland': 'Europe', 'Portugal': 'Europe', 'Romania': 'Europe',
  'Russia': 'Europe', 'San Marino': 'Europe', 'Serbia': 'Europe', 'Slovakia': 'Europe',
  'Slovenia': 'Europe', 'Spain': 'Europe', 'Sweden': 'Europe', 'Switzerland': 'Europe',
  'Turkey': 'Europe', 'Ukraine': 'Europe', 'United Kingdom': 'Europe', 'Vatican City': 'Europe',

  // North America
  'Antigua and Barbuda': 'North America', 'Bahamas': 'North America', 'Barbados': 'North America',
  'Belize': 'North America', 'Canada': 'North America', 'Costa Rica': 'North America',
  'Cuba': 'North America', 'Dominica': 'North America', 'Dominican Republic': 'North America',
  'El Salvador': 'North America', 'Grenada': 'North America', 'Guatemala': 'North America',
  'Haiti': 'North America', 'Honduras': 'North America', 'Jamaica': 'North America',
  'Mexico': 'North America', 'Nicaragua': 'North America', 'Panama': 'North America',
  'Saint Kitts and Nevis': 'North America', 'Saint Lucia': 'North America',
  'Saint Vincent and the Grenadines': 'North America', 'Trinidad and Tobago': 'North America',
  'United States': 'North America', 'United States of America': 'North America',

  // South America
  'Argentina': 'South America', 'Bolivia': 'South America', 'Brazil': 'South America',
  'Chile': 'South America', 'Colombia': 'South America', 'Ecuador': 'South America',
  'Guyana': 'South America', 'Paraguay': 'South America', 'Peru': 'South America',
  'Suriname': 'South America', 'Uruguay': 'South America', 'Venezuela': 'South America',

  // Oceania
  'Australia': 'Oceania', 'Fiji': 'Oceania', 'Kiribati': 'Oceania', 'Marshall Islands': 'Oceania',
  'Micronesia': 'Oceania', 'Nauru': 'Oceania', 'New Zealand': 'Oceania', 'Palau': 'Oceania',
  'Papua New Guinea': 'Oceania', 'Samoa': 'Oceania', 'Solomon Islands': 'Oceania',
  'Tonga': 'Oceania', 'Tuvalu': 'Oceania', 'Vanuatu': 'Oceania',
};

// Get famous person for a country
export const getFamousPerson = (country: string): string | null => {
  return countryFamousPeople[country] || null;
};

// Get continent for a country
export const getContinent = (country: string): string | null => {
  return countryContinent[country] || null;
};

// Map name mapping: Dataset Name -> GeoJSON Name
// This mapping is EXHAUSTIVE and based on the actual country names in the world-atlas TopoJSON file.
const countryMapping: Record<string, string> = {
  // Americas
  'United States': 'United States of America',
  'United States of America': 'United States of America',
  'USA': 'United States of America',
  'Dominican Republic': 'Dominican Rep.',

  // Africa
  'DR Congo': 'Dem. Rep. Congo',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Congo': 'Congo',
  'Tanzania': 'Tanzania', // Same name
  'Central African Republic': 'Central African Rep.',
  'South Sudan': 'S. Sudan',
  'Western Sahara': 'W. Sahara',
  'Equatorial Guinea': 'Eq. Guinea',
  'Ivory Coast': "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  'Eswatini': 'eSwatini', // Lowercase 'e' in GeoJSON
  'Swaziland': 'eSwatini',
  'Guinea-Bissau': 'Guinea-Bissau', // Same name

  // Europe
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  'North Macedonia': 'Macedonia', // GeoJSON uses 'Macedonia'
  'Macedonia': 'Macedonia',

  // Asia
  'Laos': 'Laos', // GeoJSON uses 'Laos' not 'Lao PDR'
  'Myanmar': 'Myanmar', // Same name
  'Vietnam': 'Vietnam', // Same name
  'Viet Nam': 'Vietnam',
  'Brunei': 'Brunei', // Same name
  'Brunei Darussalam': 'Brunei',
  'Syria': 'Syria', // Same name
  'Syrian Arab Republic': 'Syria',
  'Iran': 'Iran', // Same name
  'North Korea': 'North Korea', // Same name
  'South Korea': 'South Korea', // Same name
  'Taiwan': 'Taiwan', // Same name

  // Oceania
  'Solomon Islands': 'Solomon Is.',
  'Papua New Guinea': 'Papua New Guinea', // Same name

  // Other
  'Falkland Islands': 'Falkland Is.',
  'The Bahamas': 'Bahamas',
  'Bahamas': 'Bahamas',
  'Gambia': 'Gambia', // Same name
  'Russia': 'Russia', // Same name
};

/**
 * Get the name used in the Map GeoJSON for a given country name.
 * Essential for highlighting the correct polygon on the map.
 */
export const getMapCountryName = (name: string): string => {
  return countryMapping[name] || name;
};

// Reverse mapping: GeoJSON Name -> Game Name (for converting clicked country back to game name)
const reverseCountryMapping: Record<string, string> = {
  'United States of America': 'United States',
  'Dominican Rep.': 'Dominican Republic',
  'Dem. Rep. Congo': 'DR Congo',
  'Central African Rep.': 'Central African Republic',
  'S. Sudan': 'South Sudan',
  'W. Sahara': 'Western Sahara',
  'Eq. Guinea': 'Equatorial Guinea',
  "Côte d'Ivoire": 'Ivory Coast',
  'eSwatini': 'Eswatini',
  'Bosnia and Herz.': 'Bosnia and Herzegovina',
  'Macedonia': 'North Macedonia',
  'Solomon Is.': 'Solomon Islands',
  'Falkland Is.': 'Falkland Islands',
};

/**
 * Convert a GeoJSON country name back to the game's country name.
 * Used when clicking on a country in the map.
 */
export const getGameCountryName = (geoJsonName: string): string => {
  return reverseCountryMapping[geoJsonName] || geoJsonName;
};

export const normalizeCountryName = getMapCountryName;

// Country coordinates for precise zooming
export const countryCoordinates: Record<string, { coordinates: [number, number]; zoom: number }> = {
  'Afghanistan': { coordinates: [67, 33], zoom: 3 },
  'Albania': { coordinates: [20, 41], zoom: 4 },
  'Algeria': { coordinates: [3, 28], zoom: 2.5 },
  'Angola': { coordinates: [18, -12], zoom: 2.5 },
  'Argentina': { coordinates: [-64, -34], zoom: 2 },
  'Armenia': { coordinates: [45, 40], zoom: 4 },
  'Australia': { coordinates: [133, -27], zoom: 1.8 },
  'Austria': { coordinates: [14, 47], zoom: 4 },
  'Azerbaijan': { coordinates: [48, 40], zoom: 3.5 },
  'Bahamas': { coordinates: [-77, 25], zoom: 4 },
  'Bangladesh': { coordinates: [90, 24], zoom: 3.5 },
  'Belarus': { coordinates: [28, 53], zoom: 3.5 },
  'Belgium': { coordinates: [4, 51], zoom: 4.5 },
  'Belize': { coordinates: [-88, 17], zoom: 4 },
  'Benin': { coordinates: [2, 10], zoom: 3.5 },
  'Bhutan': { coordinates: [90, 27], zoom: 4 },
  'Bolivia': { coordinates: [-64, -17], zoom: 2.5 },
  'Bosnia and Herzegovina': { coordinates: [18, 44], zoom: 4 },
  'Botswana': { coordinates: [24, -22], zoom: 3 },
  'Brazil': { coordinates: [-52, -10], zoom: 1.5 },
  'Brunei': { coordinates: [114, 4], zoom: 4.5 },
  'Bulgaria': { coordinates: [25, 43], zoom: 4 },
  'Burkina Faso': { coordinates: [-2, 12], zoom: 3.5 },
  'Burundi': { coordinates: [30, -3], zoom: 4 },
  'Cambodia': { coordinates: [105, 13], zoom: 3.5 },
  'Cameroon': { coordinates: [12, 6], zoom: 3 },
  'Canada': { coordinates: [-106, 56], zoom: 1.3 },
  'Central African Republic': { coordinates: [21, 7], zoom: 2.8 },
  'Chad': { coordinates: [19, 15], zoom: 2.5 },
  'Chile': { coordinates: [-71, -35], zoom: 1.8 },
  'China': { coordinates: [105, 35], zoom: 1.5 },
  'Colombia': { coordinates: [-72, 4], zoom: 2.5 },
  'Congo': { coordinates: [15, -1], zoom: 3 },
  'Costa Rica': { coordinates: [-84, 10], zoom: 4 },
  'Croatia': { coordinates: [16, 45], zoom: 4 },
  'Cuba': { coordinates: [-79, 22], zoom: 3.5 },
  'Cyprus': { coordinates: [33, 35], zoom: 4.5 },
  'Czechia': { coordinates: [15, 50], zoom: 4 },
  'Denmark': { coordinates: [10, 56], zoom: 4 },
  'Djibouti': { coordinates: [43, 12], zoom: 4 },
  'Dominican Republic': { coordinates: [-70, 19], zoom: 4 },
  'DR Congo': { coordinates: [23, -3], zoom: 2.2 },
  'Ecuador': { coordinates: [-78, -1], zoom: 3.5 },
  'Egypt': { coordinates: [30, 27], zoom: 2.8 },
  'El Salvador': { coordinates: [-89, 14], zoom: 4 },
  'Equatorial Guinea': { coordinates: [10, 2], zoom: 4 },
  'Eritrea': { coordinates: [39, 15], zoom: 3.5 },
  'Estonia': { coordinates: [26, 59], zoom: 4 },
  'Eswatini': { coordinates: [31, -26], zoom: 4.5 },
  'Ethiopia': { coordinates: [40, 9], zoom: 2.5 },
  'Fiji': { coordinates: [178, -18], zoom: 4 },
  'Finland': { coordinates: [26, 64], zoom: 2.5 },
  'France': { coordinates: [2, 47], zoom: 3 },
  'Gabon': { coordinates: [12, -1], zoom: 3.5 },
  'Gambia': { coordinates: [-15, 13], zoom: 4.5 },
  'Georgia': { coordinates: [43, 42], zoom: 4 },
  'Germany': { coordinates: [10, 51], zoom: 3 },
  'Ghana': { coordinates: [-1, 8], zoom: 3.5 },
  'Greece': { coordinates: [22, 39], zoom: 3.5 },
  'Guatemala': { coordinates: [-90, 15], zoom: 4 },
  'Guinea': { coordinates: [-10, 11], zoom: 3.5 },
  'Guinea-Bissau': { coordinates: [-15, 12], zoom: 4 },
  'Guyana': { coordinates: [-59, 5], zoom: 3.5 },
  'Haiti': { coordinates: [-72, 19], zoom: 4 },
  'Honduras': { coordinates: [-86, 15], zoom: 4 },
  'Hungary': { coordinates: [20, 47], zoom: 4 },
  'Iceland': { coordinates: [-19, 65], zoom: 3.5 },
  'India': { coordinates: [79, 21], zoom: 2 },
  'Indonesia': { coordinates: [120, -2], zoom: 1.8 },
  'Iran': { coordinates: [53, 32], zoom: 2.5 },
  'Iraq': { coordinates: [44, 33], zoom: 3 },
  'Ireland': { coordinates: [-8, 53], zoom: 4 },
  'Israel': { coordinates: [35, 31], zoom: 4 },
  'Italy': { coordinates: [12, 43], zoom: 3 },
  'Ivory Coast': { coordinates: [-5, 8], zoom: 3.5 },
  'Jamaica': { coordinates: [-77, 18], zoom: 4.5 },
  'Japan': { coordinates: [138, 36], zoom: 2.5 },
  'Jordan': { coordinates: [36, 31], zoom: 4 },
  'Kazakhstan': { coordinates: [67, 48], zoom: 2 },
  'Kenya': { coordinates: [38, 1], zoom: 3 },
  'Kuwait': { coordinates: [48, 29], zoom: 4.5 },
  'Kyrgyzstan': { coordinates: [75, 41], zoom: 3.5 },
  'Laos': { coordinates: [103, 18], zoom: 3.5 },
  'Latvia': { coordinates: [25, 57], zoom: 4 },
  'Lebanon': { coordinates: [36, 34], zoom: 4.5 },
  'Lesotho': { coordinates: [29, -29], zoom: 4.5 },
  'Liberia': { coordinates: [-10, 7], zoom: 4 },
  'Libya': { coordinates: [17, 27], zoom: 2.5 },
  'Lithuania': { coordinates: [24, 55], zoom: 4 },
  'Luxembourg': { coordinates: [6, 50], zoom: 5 },
  'Madagascar': { coordinates: [47, -19], zoom: 2.8 },
  'Malawi': { coordinates: [34, -13], zoom: 3.5 },
  'Malaysia': { coordinates: [109, 4], zoom: 2.5 },
  'Mali': { coordinates: [-4, 17], zoom: 2.5 },
  'Mauritania': { coordinates: [-10, 20], zoom: 2.5 },
  'Mexico': { coordinates: [-102, 24], zoom: 2 },
  'Moldova': { coordinates: [29, 47], zoom: 4 },
  'Mongolia': { coordinates: [103, 46], zoom: 2 },
  'Montenegro': { coordinates: [19, 43], zoom: 4.5 },
  'Morocco': { coordinates: [-6, 32], zoom: 3 },
  'Mozambique': { coordinates: [35, -18], zoom: 2.5 },
  'Myanmar': { coordinates: [96, 20], zoom: 2.5 },
  'Namibia': { coordinates: [17, -22], zoom: 2.5 },
  'Nepal': { coordinates: [84, 28], zoom: 3.5 },
  'Netherlands': { coordinates: [5, 52], zoom: 4.5 },
  'New Zealand': { coordinates: [174, -41], zoom: 2.5 },
  'Nicaragua': { coordinates: [-85, 13], zoom: 4 },
  'Niger': { coordinates: [10, 17], zoom: 2.5 },
  'Nigeria': { coordinates: [8, 10], zoom: 2.5 },
  'North Korea': { coordinates: [127, 40], zoom: 3.5 },
  'North Macedonia': { coordinates: [22, 42], zoom: 4.5 },
  'Norway': { coordinates: [9, 62], zoom: 2 },
  'Oman': { coordinates: [56, 21], zoom: 3 },
  'Pakistan': { coordinates: [69, 30], zoom: 2.5 },
  'Panama': { coordinates: [-80, 9], zoom: 4 },
  'Papua New Guinea': { coordinates: [145, -6], zoom: 3 },
  'Paraguay': { coordinates: [-58, -23], zoom: 3 },
  'Peru': { coordinates: [-76, -10], zoom: 2.5 },
  'Philippines': { coordinates: [122, 12], zoom: 2.5 },
  'Poland': { coordinates: [19, 52], zoom: 3 },
  'Portugal': { coordinates: [-8, 39], zoom: 3.5 },
  'Qatar': { coordinates: [51, 26], zoom: 4.5 },
  'Romania': { coordinates: [25, 46], zoom: 3.5 },
  'Russia': { coordinates: [100, 60], zoom: 1.2 },
  'Rwanda': { coordinates: [30, -2], zoom: 4.5 },
  'Saudi Arabia': { coordinates: [45, 24], zoom: 2.2 },
  'Senegal': { coordinates: [-14, 14], zoom: 3.5 },
  'Serbia': { coordinates: [21, 44], zoom: 4 },
  'Sierra Leone': { coordinates: [-12, 9], zoom: 4 },
  'Singapore': { coordinates: [104, 1], zoom: 5 },
  'Slovakia': { coordinates: [20, 49], zoom: 4 },
  'Slovenia': { coordinates: [15, 46], zoom: 4.5 },
  'Somalia': { coordinates: [46, 5], zoom: 2.8 },
  'South Africa': { coordinates: [25, -29], zoom: 2.5 },
  'South Korea': { coordinates: [128, 36], zoom: 4 },
  'South Sudan': { coordinates: [30, 7], zoom: 3 },
  'Spain': { coordinates: [-4, 40], zoom: 3 },
  'Sri Lanka': { coordinates: [81, 8], zoom: 4 },
  'Sudan': { coordinates: [30, 15], zoom: 2.5 },
  'Suriname': { coordinates: [-56, 4], zoom: 4 },
  'Sweden': { coordinates: [16, 62], zoom: 2.2 },
  'Switzerland': { coordinates: [8, 47], zoom: 4.5 },
  'Syria': { coordinates: [38, 35], zoom: 3.5 },
  'Taiwan': { coordinates: [121, 24], zoom: 4 },
  'Tajikistan': { coordinates: [71, 39], zoom: 4 },
  'Tanzania': { coordinates: [35, -6], zoom: 2.8 },
  'Thailand': { coordinates: [101, 15], zoom: 2.8 },
  'Togo': { coordinates: [1, 8], zoom: 4 },
  'Trinidad and Tobago': { coordinates: [-61, 11], zoom: 4.5 },
  'Tunisia': { coordinates: [10, 34], zoom: 3.5 },
  'Turkey': { coordinates: [35, 39], zoom: 2.5 },
  'Turkmenistan': { coordinates: [59, 39], zoom: 3 },
  'Uganda': { coordinates: [32, 1], zoom: 3.5 },
  'Ukraine': { coordinates: [32, 49], zoom: 2.5 },
  'United Arab Emirates': { coordinates: [54, 24], zoom: 4 },
  'United Kingdom': { coordinates: [-2, 54], zoom: 3 },
  'United States': { coordinates: [-98, 39], zoom: 1.5 },
  'Uruguay': { coordinates: [-56, -33], zoom: 3.5 },
  'Uzbekistan': { coordinates: [64, 41], zoom: 2.8 },
  'Venezuela': { coordinates: [-66, 7], zoom: 2.8 },
  'Vietnam': { coordinates: [106, 16], zoom: 2.8 },
  'Yemen': { coordinates: [48, 16], zoom: 3 },
  'Zambia': { coordinates: [28, -14], zoom: 3 },
  'Zimbabwe': { coordinates: [30, -19], zoom: 3.5 },
};

// Get country coordinates for zooming
export const getCountryCoordinates = (country: string): { coordinates: [number, number]; zoom: number } | null => {
  return countryCoordinates[country] || null;
};

// Get all countries
export const getAllCountries = (): string[] => {
  return Object.keys(countryFamousPeople);
};

// Get random country
export const getRandomCountry = (): string => {
  const countries = getAllCountries();
  return countries[Math.floor(Math.random() * countries.length)];
};

// Get random unplayed country
export const getRandomUnplayedCountry = (guessedCountries: string[]): string | null => {
  const countries = getAllCountries().filter(c => !guessedCountries.includes(c));
  if (countries.length === 0) return null;
  return countries[Math.floor(Math.random() * countries.length)];
};
