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
  'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM', 'Congo': 'CG', 'Costa Rica': 'CR',
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

export const normalizeCountryName = getMapCountryName;

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
