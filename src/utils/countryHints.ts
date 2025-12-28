// Extended country hints data with capitals, famous players, and famous singers
// Organized by continent for easier management

export interface CountryHint {
  country: string;
  iso_code: string;
  capital: string;
  famous_player_hint: string;
  famous_singer_hint: string;
}

// Africa hints data
export const africaHints: CountryHint[] = [
  { country: "Algeria", iso_code: "DZ", capital: "Algiers", famous_player_hint: "Riyad Mahrez", famous_singer_hint: "Cheb Khaled" },
  { country: "Angola", iso_code: "AO", capital: "Luanda", famous_player_hint: "Akwá", famous_singer_hint: "Anselmo Ralph" },
  { country: "Benin", iso_code: "BJ", capital: "Porto-Novo", famous_player_hint: "Stéphane Sessègnon", famous_singer_hint: "Angélique Kidjo" },
  { country: "Botswana", iso_code: "BW", capital: "Gaborone", famous_player_hint: "Dipsy Selolwane", famous_singer_hint: "Vee Mampeezy" },
  { country: "Burkina Faso", iso_code: "BF", capital: "Ouagadougou", famous_player_hint: "Jonathan Pitroipa", famous_singer_hint: "Floby" },
  { country: "Burundi", iso_code: "BI", capital: "Gitega", famous_player_hint: "Saido Berahino", famous_singer_hint: "Kidum" },
  { country: "Cabo Verde", iso_code: "CV", capital: "Praia", famous_player_hint: "Nani (heritage)", famous_singer_hint: "Cesária Évora" },
  { country: "Cameroon", iso_code: "CM", capital: "Yaoundé", famous_player_hint: "Samuel Eto'o", famous_singer_hint: "Petit-Pays" },
  { country: "Central African Republic", iso_code: "CF", capital: "Bangui", famous_player_hint: "Geoffrey Kondogbia", famous_singer_hint: "Idylle Mamba" },
  { country: "Chad", iso_code: "TD", capital: "N'Djamena", famous_player_hint: "Nambatingue Toko", famous_singer_hint: "Mounira Mitchala" },
  { country: "Comoros", iso_code: "KM", capital: "Moroni", famous_player_hint: "Ali Ahamada", famous_singer_hint: "Mohamed Hassan" },
  { country: "Democratic Republic of Congo", iso_code: "CD", capital: "Kinshasa", famous_player_hint: "Cédric Bakambu", famous_singer_hint: "Fally Ipupa" },
  { country: "Republic of the Congo", iso_code: "CG", capital: "Brazzaville", famous_player_hint: "Thievy Bifouma", famous_singer_hint: "Roga Roga" },
  { country: "Congo", iso_code: "CG", capital: "Brazzaville", famous_player_hint: "Thievy Bifouma", famous_singer_hint: "Roga Roga" },
  { country: "Djibouti", iso_code: "DJ", capital: "Djibouti City", famous_player_hint: "Ahmed Ali", famous_singer_hint: "Amina" },
  { country: "Egypt", iso_code: "EG", capital: "Cairo", famous_player_hint: "Mohamed Salah", famous_singer_hint: "Amr Diab" },
  { country: "Equatorial Guinea", iso_code: "GQ", capital: "Malabo", famous_player_hint: "Emilio Nsue", famous_singer_hint: "Zahara" },
  { country: "Eritrea", iso_code: "ER", capital: "Asmara", famous_player_hint: "Henok Goitom", famous_singer_hint: "Helen Meles" },
  { country: "Eswatini", iso_code: "SZ", capital: "Mbabane", famous_player_hint: "Dennis Masina", famous_singer_hint: "Zakes Bantwini" },
  { country: "Ethiopia", iso_code: "ET", capital: "Addis Ababa", famous_player_hint: "Haile Gebrselassie", famous_singer_hint: "Aster Aweke" },
  { country: "Gabon", iso_code: "GA", capital: "Libreville", famous_player_hint: "Pierre-Emerick Aubameyang", famous_singer_hint: "Patience Dabany" },
  { country: "Gambia", iso_code: "GM", capital: "Banjul", famous_player_hint: "Musa Barrow", famous_singer_hint: "Jaliba Kuyateh" },
  { country: "Ghana", iso_code: "GH", capital: "Accra", famous_player_hint: "Asamoah Gyan", famous_singer_hint: "Sarkodie" },
  { country: "Guinea", iso_code: "GN", capital: "Conakry", famous_player_hint: "Naby Keïta", famous_singer_hint: "Mory Kanté" },
  { country: "Guinea-Bissau", iso_code: "GW", capital: "Bissau", famous_player_hint: "Bacary Sagna", famous_singer_hint: "Manecas Costa" },
  { country: "Ivory Coast", iso_code: "CI", capital: "Yamoussoukro", famous_player_hint: "Didier Drogba", famous_singer_hint: "Alpha Blondy" },
  { country: "Kenya", iso_code: "KE", capital: "Nairobi", famous_player_hint: "Eliud Kipchoge", famous_singer_hint: "Sauti Sol" },
  { country: "Lesotho", iso_code: "LS", capital: "Maseru", famous_player_hint: "Lehlohonolo Seema", famous_singer_hint: "Tšepho Tshola" },
  { country: "Liberia", iso_code: "LR", capital: "Monrovia", famous_player_hint: "George Weah", famous_singer_hint: "Takun J" },
  { country: "Libya", iso_code: "LY", capital: "Tripoli", famous_player_hint: "Ahmed Benali", famous_singer_hint: "Mohamed Hassan" },
  { country: "Madagascar", iso_code: "MG", capital: "Antananarivo", famous_player_hint: "Jérôme Mombris", famous_singer_hint: "Rossy" },
  { country: "Malawi", iso_code: "MW", capital: "Lilongwe", famous_player_hint: "Gabadinho Mhango", famous_singer_hint: "Lazarus" },
  { country: "Mali", iso_code: "ML", capital: "Bamako", famous_player_hint: "Frederic Kanoute", famous_singer_hint: "Salif Keita" },
  { country: "Mauritania", iso_code: "MR", capital: "Nouakchott", famous_player_hint: "Bessam", famous_singer_hint: "Noura Mint Seymali" },
  { country: "Mauritius", iso_code: "MU", capital: "Port Louis", famous_player_hint: "Bruno Julie", famous_singer_hint: "Alain Ramanisum" },
  { country: "Morocco", iso_code: "MA", capital: "Rabat", famous_player_hint: "Achraf Hakimi", famous_singer_hint: "Saad Lamjarred" },
  { country: "Mozambique", iso_code: "MZ", capital: "Maputo", famous_player_hint: "Eusébio", famous_singer_hint: "Lizha James" },
  { country: "Namibia", iso_code: "NA", capital: "Windhoek", famous_player_hint: "Collin Benjamin", famous_singer_hint: "Gazza" },
  { country: "Niger", iso_code: "NE", capital: "Niamey", famous_player_hint: "Moussa Maâzou", famous_singer_hint: "Tal National" },
  { country: "Nigeria", iso_code: "NG", capital: "Abuja", famous_player_hint: "Victor Osimhen", famous_singer_hint: "Burna Boy" },
  { country: "Rwanda", iso_code: "RW", capital: "Kigali", famous_player_hint: "Meddie Kagere", famous_singer_hint: "Meddy" },
  { country: "Sao Tome and Principe", iso_code: "ST", capital: "São Tomé", famous_player_hint: "Luís Leal", famous_singer_hint: "Filipe Santo" },
  { country: "Senegal", iso_code: "SN", capital: "Dakar", famous_player_hint: "Sadio Mané", famous_singer_hint: "Youssou N'Dour" },
  { country: "Seychelles", iso_code: "SC", capital: "Victoria", famous_player_hint: "Kevin Betsy", famous_singer_hint: "AUZOU" },
  { country: "Sierra Leone", iso_code: "SL", capital: "Freetown", famous_player_hint: "Kei Kamara", famous_singer_hint: "Drizilik" },
  { country: "Somalia", iso_code: "SO", capital: "Mogadishu", famous_player_hint: "Mo Farah", famous_singer_hint: "K'naan" },
  { country: "South Africa", iso_code: "ZA", capital: "Pretoria", famous_player_hint: "Steven Pienaar", famous_singer_hint: "Master KG" },
  { country: "South Sudan", iso_code: "SS", capital: "Juba", famous_player_hint: "Luol Deng", famous_singer_hint: "Emmanuel Jal" },
  { country: "Sudan", iso_code: "SD", capital: "Khartoum", famous_player_hint: "Haitham Mustafa", famous_singer_hint: "Mohammed Wardi" },
  { country: "Tanzania", iso_code: "TZ", capital: "Dodoma", famous_player_hint: "Mbwana Samatta", famous_singer_hint: "Diamond Platnumz" },
  { country: "Togo", iso_code: "TG", capital: "Lomé", famous_player_hint: "Emmanuel Adebayor", famous_singer_hint: "Toofan" },
  { country: "Tunisia", iso_code: "TN", capital: "Tunis", famous_player_hint: "Wahbi Khazri", famous_singer_hint: "Latifa" },
  { country: "Uganda", iso_code: "UG", capital: "Kampala", famous_player_hint: "Denis Onyango", famous_singer_hint: "Eddy Kenzo" },
  { country: "Zambia", iso_code: "ZM", capital: "Lusaka", famous_player_hint: "Kalusha Bwalya", famous_singer_hint: "Macky 2" },
  { country: "Zimbabwe", iso_code: "ZW", capital: "Harare", famous_player_hint: "Peter Ndlovu", famous_singer_hint: "Jah Prayzah" },
];

// Combine all continents (will be expanded as user provides more data)
export const allCountryHints: CountryHint[] = [
  ...africaHints,
];

// Create a lookup map for quick access by country name
const countryHintsMap: Record<string, CountryHint> = {};
allCountryHints.forEach(hint => {
  countryHintsMap[hint.country] = hint;
});

// Get hint data for a country
export const getCountryHintData = (country: string): CountryHint | null => {
  return countryHintsMap[country] || null;
};

// Get capital for a country
export const getCountryCapital = (country: string): string | null => {
  const hint = countryHintsMap[country];
  return hint ? hint.capital : null;
};

// Get famous player for a country
export const getFamousPlayer = (country: string): string | null => {
  const hint = countryHintsMap[country];
  return hint ? hint.famous_player_hint : null;
};

// Get famous singer for a country
export const getFamousSinger = (country: string): string | null => {
  const hint = countryHintsMap[country];
  return hint ? hint.famous_singer_hint : null;
};

// Check if a country has extended hints available
export const hasExtendedHints = (country: string): boolean => {
  return !!countryHintsMap[country];
};
