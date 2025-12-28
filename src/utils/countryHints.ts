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
export const europeHints: CountryHint[] = [
  {
    "country": "Albania",
    "iso_code": "AL",
    "capital": "Tirana",
    "famous_player_hint": "Elseid Hysaj",
    "famous_singer_hint": "Dua Lipa"
  },
  {
    "country": "Andorra",
    "iso_code": "AD",
    "capital": "Andorra la Vella",
    "famous_player_hint": "Ildefons Lima",
    "famous_singer_hint": "Mónica Naranjo (association)"
  },
  {
    "country": "Armenia",
    "iso_code": "AM",
    "capital": "Yerevan",
    "famous_player_hint": "Henrikh Mkhitaryan",
    "famous_singer_hint": "Aram MP3"
  },
  {
    "country": "Austria",
    "iso_code": "AT",
    "capital": "Vienna",
    "famous_player_hint": "David Alaba",
    "famous_singer_hint": "Falco"
  },
  {
    "country": "Azerbaijan",
    "iso_code": "AZ",
    "capital": "Baku",
    "famous_player_hint": "Qara Qarayev",
    "famous_singer_hint": "Aysel Teymurzadeh"
  },
  {
    "country": "Belarus",
    "iso_code": "BY",
    "capital": "Minsk",
    "famous_player_hint": "Alexander Hleb",
    "famous_singer_hint": "Max Korzh"
  },
  {
    "country": "Belgium",
    "iso_code": "BE",
    "capital": "Brussels",
    "famous_player_hint": "Kevin De Bruyne",
    "famous_singer_hint": "Stromae"
  },
  {
    "country": "Bosnia and Herzegovina",
    "iso_code": "BA",
    "capital": "Sarajevo",
    "famous_player_hint": "Edin Džeko",
    "famous_singer_hint": "Dino Merlin"
  },
  {
    "country": "Bulgaria",
    "iso_code": "BG",
    "capital": "Sofia",
    "famous_player_hint": "Hristo Stoichkov",
    "famous_singer_hint": "Azis"
  },
  {
    "country": "Croatia",
    "iso_code": "HR",
    "capital": "Zagreb",
    "famous_player_hint": "Luka Modrić",
    "famous_singer_hint": "Severina"
  },
  {
    "country": "Cyprus",
    "iso_code": "CY",
    "capital": "Nicosia",
    "famous_player_hint": "Giorgos Efrem",
    "famous_singer_hint": "Anna Vissi"
  },
  {
    "country": "Czech Republic",
    "iso_code": "CZ",
    "capital": "Prague",
    "famous_player_hint": "Pavel Nedvěd",
    "famous_singer_hint": "Karel Gott"
  },
  {
    "country": "Denmark",
    "iso_code": "DK",
    "capital": "Copenhagen",
    "famous_player_hint": "Christian Eriksen",
    "famous_singer_hint": "Aqua"
  },
  {
    "country": "Estonia",
    "iso_code": "EE",
    "capital": "Tallinn",
    "famous_player_hint": "Ragnar Klavan",
    "famous_singer_hint": "Kerli"
  },
  {
    "country": "Finland",
    "iso_code": "FI",
    "capital": "Helsinki",
    "famous_player_hint": "Teemu Pukki",
    "famous_singer_hint": "Nightwish"
  },
  {
    "country": "France",
    "iso_code": "FR",
    "capital": "Paris",
    "famous_player_hint": "Kylian Mbappé",
    "famous_singer_hint": "Edith Piaf / Stromae"
  },
  {
    "country": "Georgia",
    "iso_code": "GE",
    "capital": "Tbilisi",
    "famous_player_hint": "Khvicha Kvaratskhelia",
    "famous_singer_hint": "Sofia Nizharadze"
  },
  {
    "country": "Germany",
    "iso_code": "DE",
    "capital": "Berlin",
    "famous_player_hint": "Manuel Neuer",
    "famous_singer_hint": "Rammstein"
  },
  {
    "country": "Greece",
    "iso_code": "GR",
    "capital": "Athens",
    "famous_player_hint": "Giorgos Karagounis",
    "famous_singer_hint": "Sakis Rouvas"
  },
  {
    "country": "Hungary",
    "iso_code": "HU",
    "capital": "Budapest",
    "famous_player_hint": "Ferenc Puskás",
    "famous_singer_hint": "Kati Wolf"
  },
  {
    "country": "Iceland",
    "iso_code": "IS",
    "capital": "Reykjavik",
    "famous_player_hint": "Gylfi Sigurðsson",
    "famous_singer_hint": "Björk"
  },
  {
    "country": "Ireland",
    "iso_code": "IE",
    "capital": "Dublin",
    "famous_player_hint": "Roy Keane",
    "famous_singer_hint": "U2"
  },
  {
    "country": "Italy",
    "iso_code": "IT",
    "capital": "Rome",
    "famous_player_hint": "Francesco Totti",
    "famous_singer_hint": "Andrea Bocelli"
  },
  {
    "country": "Kosovo",
    "iso_code": "XK",
    "capital": "Pristina",
    "famous_player_hint": "Milot Rashica",
    "famous_singer_hint": "Rita Ora"
  },
  {
    "country": "Latvia",
    "iso_code": "LV",
    "capital": "Riga",
    "famous_player_hint": "Kārlis Skrastiņš",
    "famous_singer_hint": "Aminata"
  },
  {
    "country": "Liechtenstein",
    "iso_code": "LI",
    "capital": "Vaduz",
    "famous_player_hint": "Mario Frick",
    "famous_singer_hint": "Christine Lauterburg"
  },
  {
    "country": "Lithuania",
    "iso_code": "LT",
    "capital": "Vilnius",
    "famous_player_hint": "Arvydas Sabonis",
    "famous_singer_hint": "The Roop"
  },
  {
    "country": "Luxembourg",
    "iso_code": "LU",
    "capital": "Luxembourg City",
    "famous_player_hint": "Aurélien Joachim",
    "famous_singer_hint": "Anne Klein"
  },
  {
    "country": "Malta",
    "iso_code": "MT",
    "capital": "Valletta",
    "famous_player_hint": "Michael Mifsud",
    "famous_singer_hint": "Ira Losco"
  },
  {
    "country": "Moldova",
    "iso_code": "MD",
    "capital": "Chișinău",
    "famous_player_hint": "Alexandru Epureanu",
    "famous_singer_hint": "Zdob și Zdub"
  },
  {
    "country": "Monaco",
    "iso_code": "MC",
    "capital": "Monaco",
    "famous_player_hint": "Charles Leclerc (sports icon)",
    "famous_singer_hint": "Grace Kelly (historic association)"
  },
  {
    "country": "Montenegro",
    "iso_code": "ME",
    "capital": "Podgorica",
    "famous_player_hint": "Stevan Jovetić",
    "famous_singer_hint": "Sergej Ćetković"
  },
  {
    "country": "Netherlands",
    "iso_code": "NL",
    "capital": "Amsterdam",
    "famous_player_hint": "Virgil van Dijk",
    "famous_singer_hint": "Tiesto"
  },
  {
    "country": "North Macedonia",
    "iso_code": "MK",
    "capital": "Skopje",
    "famous_player_hint": "Goran Pandev",
    "famous_singer_hint": "Toše Proeski"
  },
  {
    "country": "Norway",
    "iso_code": "NO",
    "capital": "Oslo",
    "famous_player_hint": "Erling Haaland",
    "famous_singer_hint": "A-ha"
  },
  {
    "country": "Poland",
    "iso_code": "PL",
    "capital": "Warsaw",
    "famous_player_hint": "Robert Lewandowski",
    "famous_singer_hint": "Doda"
  },
  {
    "country": "Portugal",
    "iso_code": "PT",
    "capital": "Lisbon",
    "famous_player_hint": "Cristiano Ronaldo",
    "famous_singer_hint": "Amália Rodrigues"
  },
  {
    "country": "Romania",
    "iso_code": "RO",
    "capital": "Bucharest",
    "famous_player_hint": "Gheorghe Hagi",
    "famous_singer_hint": "Inna"
  },
  {
    "country": "Russia",
    "iso_code": "RU",
    "capital": "Moscow",
    "famous_player_hint": "Andrey Arshavin",
    "famous_singer_hint": "Alla Pugacheva"
  },
  {
    "country": "San Marino",
    "iso_code": "SM",
    "capital": "San Marino",
    "famous_player_hint": "Andy Selva",
    "famous_singer_hint": "Valentina Monetta"
  },
  {
    "country": "Serbia",
    "iso_code": "RS",
    "capital": "Belgrade",
    "famous_player_hint": "Nemanja Vidić",
    "famous_singer_hint": "Željko Joksimović"
  },
  {
    "country": "Slovakia",
    "iso_code": "SK",
    "capital": "Bratislava",
    "famous_player_hint": "Marek Hamšík",
    "famous_singer_hint": "Kristina Pelakova"
  },
  {
    "country": "Slovenia",
    "iso_code": "SI",
    "capital": "Ljubljana",
    "famous_player_hint": "Jan Oblak",
    "famous_singer_hint": "Magnifico"
  },
  {
    "country": "Spain",
    "iso_code": "ES",
    "capital": "Madrid",
    "famous_player_hint": "Sergio Ramos",
    "famous_singer_hint": "Enrique Iglesias"
  },
  {
    "country": "Sweden",
    "iso_code": "SE",
    "capital": "Stockholm",
    "famous_player_hint": "Zlatan Ibrahimović",
    "famous_singer_hint": "ABBA"
  },
  {
    "country": "Switzerland",
    "iso_code": "CH",
    "capital": "Bern",
    "famous_player_hint": "Xherdan Shaqiri",
    "famous_singer_hint": "DJ Bobo"
  },
  {
    "country": "Turkey",
    "iso_code": "TR",
    "capital": "Ankara",
    "famous_player_hint": "Hakan Çalhanoğlu",
    "famous_singer_hint": "Tarkan"
  },
  {
    "country": "Ukraine",
    "iso_code": "UA",
    "capital": "Kyiv",
    "famous_player_hint": "Andriy Shevchenko",
    "famous_singer_hint": "Ruslana"
  },
  {
    "country": "United Kingdom",
    "iso_code": "GB",
    "capital": "London",
    "famous_player_hint": "David Beckham",
    "famous_singer_hint": "Adele"
  },
  {
    "country": "Vatican City",
    "iso_code": "VA",
    "capital": "Vatican City",
    "famous_player_hint": "N/A",
    "famous_singer_hint": "Vatican Choir"
  }
]
;
export const asiaHints: CountryHint[] = [
  {"country":"Australia","iso_code":"AU","capital":"Canberra","famous_player_hint":"Tim Cahill","famous_singer_hint":"Sia"},
  {"country":"Fiji","iso_code":"FJ","capital":"Suva","famous_player_hint":"Waisale Serevi","famous_singer_hint":"Laisa Vulakoro"},
  {"country":"Kiribati","iso_code":"KI","capital":"South Tarawa","famous_player_hint":"David Collins","famous_singer_hint":"Ritei Tenaua"},
  {"country":"Marshall Islands","iso_code":"MH","capital":"Majuro","famous_player_hint":"Track Olympic icons","famous_singer_hint":"Local traditional artists"},
  {"country":"Micronesia","iso_code":"FM","capital":"Palikir","famous_player_hint":"Athletics icons","famous_singer_hint":"Island musicians"},
  {"country":"Nauru","iso_code":"NR","capital":"Yaren (de facto)","famous_player_hint":"Weightlifting champions","famous_singer_hint":"Traditional"},
  {"country":"New Zealand","iso_code":"NZ","capital":"Wellington","famous_player_hint":"Dan Carter","famous_singer_hint":"Lorde"},
  {"country":"Palau","iso_code":"PW","capital":"Ngerulmud","famous_player_hint":"Island sports icons","famous_singer_hint":"Folk musicians"},
  {"country":"Papua New Guinea","iso_code":"PG","capital":"Port Moresby","famous_player_hint":"Rugby legends","famous_singer_hint":"O-Shen"},
  {"country":"Samoa","iso_code":"WS","capital":"Apia","famous_player_hint":"Brian Lima","famous_singer_hint":"J Boog (heritage)"},
  {"country":"Solomon Islands","iso_code":"SB","capital":"Honiara","famous_player_hint":"Benjamin Totori","famous_singer_hint":"Sharzy"},
  {"country":"Tonga","iso_code":"TO","capital":"Nuku'alofa","famous_player_hint":"Jonah Lomu (heritage)","famous_singer_hint":"Kingdom singers"},
  {"country":"Tuvalu","iso_code":"TV","capital":"Funafuti","famous_player_hint":"Regional athletes","famous_singer_hint":"Island songs"},
  {"country":"Vanuatu","iso_code":"VU","capital":"Port Vila","famous_player_hint":"Football rising stars","famous_singer_hint":"Vanessa Quai"}
]
;
export const northAmericaHints: CountryHint[] = [
  {"country":"Antigua and Barbuda","iso_code":"AG","capital":"St. John's","famous_player_hint":"Viv Richards","famous_singer_hint":"Burning Flames"},
  {"country":"Bahamas","iso_code":"BS","capital":"Nassau","famous_player_hint":"Buddy Hield","famous_singer_hint":"Lenny Kravitz"},
  {"country":"Barbados","iso_code":"BB","capital":"Bridgetown","famous_player_hint":"Kemar Roach","famous_singer_hint":"Rihanna"},
  {"country":"Belize","iso_code":"BZ","capital":"Belmopan","famous_player_hint":"Deon McCaulay","famous_singer_hint":"Supafrankie"},
  {"country":"Canada","iso_code":"CA","capital":"Ottawa","famous_player_hint":"Alphonso Davies","famous_singer_hint":"The Weeknd"},
  {"country":"Costa Rica","iso_code":"CR","capital":"San José","famous_player_hint":"Keylor Navas","famous_singer_hint":"Debi Nova"},
  {"country":"Cuba","iso_code":"CU","capital":"Havana","famous_player_hint":"José Abreu","famous_singer_hint":"Celia Cruz"},
  {"country":"Dominica","iso_code":"DM","capital":"Roseau","famous_player_hint":"Alick Athanaze","famous_singer_hint":"Ophelia Marie"},
  {"country":"Dominican Republic","iso_code":"DO","capital":"Santo Domingo","famous_player_hint":"David Ortiz","famous_singer_hint":"Juan Luis Guerra"},
  {"country":"El Salvador","iso_code":"SV","capital":"San Salvador","famous_player_hint":"Jorge González","famous_singer_hint":"Alvaro Torres"},
  {"country":"Grenada","iso_code":"GD","capital":"St. George's","famous_player_hint":"Kirani James","famous_singer_hint":"Dash"},
  {"country":"Guatemala","iso_code":"GT","capital":"Guatemala City","famous_player_hint":"Carlos Ruiz","famous_singer_hint":"Gaby Moreno"},
  {"country":"Haiti","iso_code":"HT","capital":"Port-au-Prince","famous_player_hint":"Duckens Nazon","famous_singer_hint":"Wyclef Jean"},
  {"country":"Honduras","iso_code":"HN","capital":"Tegucigalpa","famous_player_hint":"Wilson Palacios","famous_singer_hint":"Guillermo Anderson"},
  {"country":"Jamaica","iso_code":"JM","capital":"Kingston","famous_player_hint":"Usain Bolt","famous_singer_hint":"Bob Marley"},
  {"country":"Mexico","iso_code":"MX","capital":"Mexico City","famous_player_hint":"Hugo Sánchez","famous_singer_hint":"Luis Miguel"},
  {"country":"Nicaragua","iso_code":"NI","capital":"Managua","famous_player_hint":"Juan Barrera","famous_singer_hint":"Luis Enrique"},
  {"country":"Panama","iso_code":"PA","capital":"Panama City","famous_player_hint":"Luis Tejada","famous_singer_hint":"Rubén Blades"},
  {"country":"Saint Kitts and Nevis","iso_code":"KN","capital":"Basseterre","famous_player_hint":"Atiba Harris","famous_singer_hint":"Infamus"},
  {"country":"Saint Lucia","iso_code":"LC","capital":"Castries","famous_player_hint":"Darren Sammy","famous_singer_hint":"Destra (regional)"},
  {"country":"Saint Vincent and the Grenadines","iso_code":"VC","capital":"Kingstown","famous_player_hint":"Sunil Ambris","famous_singer_hint":"Kevin Lyttle"},{"country":"Trinidad and Tobago","iso_code":"TT","capital":"Port of Spain","famous_player_hint":"Dwight Yorke","famous_singer_hint":"Nicki Minaj"},{"country":"United States","iso_code":"US","capital":"Washington, D.C.","famous_player_hint":"LeBron James","famous_singer_hint":"Taylor Swift"}];
export const southAmericaHints: CountryHint[] = [
  {"country":"Argentina","iso_code":"AR","capital":"Buenos Aires","famous_player_hint":"Lionel Messi","famous_singer_hint":"Lali"},
  {"country":"Bolivia","iso_code":"BO","capital":"Sucre / La Paz","famous_player_hint":"Marco Etcheverry","famous_singer_hint":"Los Kjarkas"},
  {"country":"Brazil","iso_code":"BR","capital":"Brasília","famous_player_hint":"Neymar","famous_singer_hint":"Anitta"},
  {"country":"Chile","iso_code":"CL","capital":"Santiago","famous_player_hint":"Alexis Sánchez","famous_singer_hint":"Mon Laferte"},
  {"country":"Colombia","iso_code":"CO","capital":"Bogotá","famous_player_hint":"James Rodríguez","famous_singer_hint":"Shakira"},
  {"country":"Ecuador","iso_code":"EC","capital":"Quito","famous_player_hint":"Antonio Valencia","famous_singer_hint":"Julio Jaramillo"},
  {"country":"Guyana","iso_code":"GY","capital":"Georgetown","famous_player_hint":"Clive Lloyd","famous_singer_hint":"Eddy Grant"},
  {"country":"Paraguay","iso_code":"PY","capital":"Asunción","famous_player_hint":"Roque Santa Cruz","famous_singer_hint":"Luan"},
  {"country":"Peru","iso_code":"PE","capital":"Lima","famous_player_hint":"Paolo Guerrero","famous_singer_hint":"Susana Baca"},
  {"country":"Suriname","iso_code":"SR","capital":"Paramaribo","famous_player_hint":"Clarence Seedorf (heritage)","famous_singer_hint":"Max Nijman"},
  {"country":"Uruguay","iso_code":"UY","capital":"Montevideo","famous_player_hint":"Luis Suárez","famous_singer_hint":"Jorge Drexler"},
  {"country":"Venezuela","iso_code":"VE","capital":"Caracas","famous_player_hint":"Juan Arango","famous_singer_hint":"Nacho"}
]
;
export const oceaniaHints: CountryHint[] = [
  {"country":"Australia","iso_code":"AU","capital":"Canberra","famous_player_hint":"Tim Cahill","famous_singer_hint":"Sia"},
  {"country":"Fiji","iso_code":"FJ","capital":"Suva","famous_player_hint":"Waisale Serevi","famous_singer_hint":"Laisa Vulakoro"},
  {"country":"Kiribati","iso_code":"KI","capital":"South Tarawa","famous_player_hint":"David Collins","famous_singer_hint":"Ritei Tenaua"},
  {"country":"Marshall Islands","iso_code":"MH","capital":"Majuro","famous_player_hint":"Track Olympic icons","famous_singer_hint":"Local traditional artists"},
  {"country":"Micronesia","iso_code":"FM","capital":"Palikir","famous_player_hint":"Athletics icons","famous_singer_hint":"Island musicians"},
  {"country":"Nauru","iso_code":"NR","capital":"Yaren (de facto)","famous_player_hint":"Weightlifting champions","famous_singer_hint":"Traditional"},
  {"country":"New Zealand","iso_code":"NZ","capital":"Wellington","famous_player_hint":"Dan Carter","famous_singer_hint":"Lorde"},
  {"country":"Palau","iso_code":"PW","capital":"Ngerulmud","famous_player_hint":"Island sports icons","famous_singer_hint":"Folk musicians"},
  {"country":"Papua New Guinea","iso_code":"PG","capital":"Port Moresby","famous_player_hint":"Rugby legends","famous_singer_hint":"O-Shen"},
  {"country":"Samoa","iso_code":"WS","capital":"Apia","famous_player_hint":"Brian Lima","famous_singer_hint":"J Boog (heritage)"},
  {"country":"Solomon Islands","iso_code":"SB","capital":"Honiara","famous_player_hint":"Benjamin Totori","famous_singer_hint":"Sharzy"},
  {"country":"Tonga","iso_code":"TO","capital":"Nuku'alofa","famous_player_hint":"Jonah Lomu (heritage)","famous_singer_hint":"Kingdom singers"},
  {"country":"Tuvalu","iso_code":"TV","capital":"Funafuti","famous_player_hint":"Regional athletes","famous_singer_hint":"Island songs"},
  {"country":"Vanuatu","iso_code":"VU","capital":"Port Vila","famous_player_hint":"Football rising stars","famous_singer_hint":"Vanessa Quai"}
]
;

// Combine all continents (will be expanded as user provides more data)
export const allCountryHints: CountryHint[] = [
  ...africaHints,
  ...europeHints,
  ...asiaHints,
  ...northAmericaHints,
  ...southAmericaHints,
  ...oceaniaHints, 
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
