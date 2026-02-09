import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jwtVerify, importX509, decodeProtectedHeader } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================
// SCORING LOGIC (server-side, cannot be tampered by clients)
// ============================================================

type Language = 'en' | 'fr' | 'ar';

interface LocalizedCountry {
  en: string;
  fr: string;
  ar: string;
  aliases?: {
    en?: string[];
    fr?: string[];
    ar?: string[];
  };
}

// Complete localized country names database
const localizedCountryNames: Record<string, LocalizedCountry> = {
  // AFRICA
  'Algeria': { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر', aliases: { ar: ['الجزاير', 'جزائر'] } },
  'Angola': { en: 'Angola', fr: 'Angola', ar: 'أنغولا', aliases: { ar: ['انغولا'] } },
  'Benin': { en: 'Benin', fr: 'Bénin', ar: 'بنين' },
  'Botswana': { en: 'Botswana', fr: 'Botswana', ar: 'بوتسوانا' },
  'Burkina Faso': { en: 'Burkina Faso', fr: 'Burkina Faso', ar: 'بوركينا فاسو' },
  'Burundi': { en: 'Burundi', fr: 'Burundi', ar: 'بوروندي' },
  'Cabo Verde': { en: 'Cabo Verde', fr: 'Cap-Vert', ar: 'الرأس الأخضر', aliases: { en: ['cape verde'], fr: ['cap vert'], ar: ['راس الاخضر', 'الرأس الاخضر'] } },
  'Cameroon': { en: 'Cameroon', fr: 'Cameroun', ar: 'الكاميرون', aliases: { ar: ['كاميرون'] } },
  'Central African Republic': { en: 'Central African Republic', fr: 'République Centrafricaine', ar: 'جمهورية أفريقيا الوسطى', aliases: { en: ['car', 'c.a.r.'], fr: ['centrafrique', 'rca'], ar: ['افريقيا الوسطى'] } },
  'Chad': { en: 'Chad', fr: 'Tchad', ar: 'تشاد' },
  'Comoros': { en: 'Comoros', fr: 'Comores', ar: 'جزر القمر', aliases: { ar: ['القمر'] } },
  'Congo': { en: 'Congo', fr: 'Congo', ar: 'الكونغو', aliases: { en: ['republic of congo', 'congo brazzaville', 'congo-brazzaville'], fr: ['congo brazzaville', 'republique du congo'], ar: ['كونغو', 'كونغو برازافيل'] } },
  'DR Congo': { en: 'DR Congo', fr: 'RD Congo', ar: 'جمهورية الكونغو الديمقراطية', aliases: { en: ['democratic republic of the congo', 'democratic republic of congo', 'drc', 'congo kinshasa', 'zaire'], fr: ['republique democratique du congo', 'congo kinshasa', 'zaire', 'rdc'], ar: ['الكونغو الديمقراطية', 'كونغو كينشاسا'] } },
  'Djibouti': { en: 'Djibouti', fr: 'Djibouti', ar: 'جيبوتي' },
  'Egypt': { en: 'Egypt', fr: 'Égypte', ar: 'مصر', aliases: { fr: ['egypte'] } },
  'Equatorial Guinea': { en: 'Equatorial Guinea', fr: 'Guinée Équatoriale', ar: 'غينيا الاستوائية', aliases: { en: ['eq guinea', 'eq. guinea'], fr: ['guinee equatoriale'] } },
  'Eritrea': { en: 'Eritrea', fr: 'Érythrée', ar: 'إريتريا', aliases: { fr: ['erythree'], ar: ['اريتريا'] } },
  'Eswatini': { en: 'Eswatini', fr: 'Eswatini', ar: 'إسواتيني', aliases: { en: ['swaziland'], fr: ['swaziland'], ar: ['سوازيلاند', 'اسواتيني'] } },
  'Ethiopia': { en: 'Ethiopia', fr: 'Éthiopie', ar: 'إثيوبيا', aliases: { fr: ['ethiopie'], ar: ['اثيوبيا', 'الحبشة'] } },
  'Gabon': { en: 'Gabon', fr: 'Gabon', ar: 'الغابون', aliases: { ar: ['غابون'] } },
  'Gambia': { en: 'Gambia', fr: 'Gambie', ar: 'غامبيا', aliases: { en: ['the gambia'] } },
  'Ghana': { en: 'Ghana', fr: 'Ghana', ar: 'غانا' },
  'Guinea': { en: 'Guinea', fr: 'Guinée', ar: 'غينيا', aliases: { fr: ['guinee'] } },
  'Guinea-Bissau': { en: 'Guinea-Bissau', fr: 'Guinée-Bissau', ar: 'غينيا بيساو', aliases: { en: ['guinea bissau'], fr: ['guinee bissau', 'guinee-bissau'] } },
  'Ivory Coast': { en: 'Ivory Coast', fr: "Côte d'Ivoire", ar: 'ساحل العاج', aliases: { en: ["cote d'ivoire", 'cote divoire'], fr: ['cote divoire'] } },
  'Kenya': { en: 'Kenya', fr: 'Kenya', ar: 'كينيا' },
  'Lesotho': { en: 'Lesotho', fr: 'Lesotho', ar: 'ليسوتو' },
  'Liberia': { en: 'Liberia', fr: 'Libéria', ar: 'ليبيريا', aliases: { fr: ['liberia'] } },
  'Libya': { en: 'Libya', fr: 'Libye', ar: 'ليبيا' },
  'Madagascar': { en: 'Madagascar', fr: 'Madagascar', ar: 'مدغشقر' },
  'Malawi': { en: 'Malawi', fr: 'Malawi', ar: 'مالاوي' },
  'Mali': { en: 'Mali', fr: 'Mali', ar: 'مالي' },
  'Mauritania': { en: 'Mauritania', fr: 'Mauritanie', ar: 'موريتانيا' },
  'Mauritius': { en: 'Mauritius', fr: 'Maurice', ar: 'موريشيوس', aliases: { fr: ['ile maurice'] } },
  'Morocco': { en: 'Morocco', fr: 'Maroc', ar: 'المغرب', aliases: { ar: ['مغرب'] } },
  'Mozambique': { en: 'Mozambique', fr: 'Mozambique', ar: 'موزمبيق' },
  'Namibia': { en: 'Namibia', fr: 'Namibie', ar: 'ناميبيا' },
  'Niger': { en: 'Niger', fr: 'Niger', ar: 'النيجر', aliases: { ar: ['نيجر'] } },
  'Nigeria': { en: 'Nigeria', fr: 'Nigeria', ar: 'نيجيريا', aliases: { fr: ['nigéria'] } },
  'Rwanda': { en: 'Rwanda', fr: 'Rwanda', ar: 'رواندا' },
  'Sao Tome and Principe': { en: 'Sao Tome and Principe', fr: 'Sao Tomé-et-Príncipe', ar: 'ساو تومي وبرينسيبي', aliases: { en: ['sao tome'], fr: ['sao tome', 'sao tome et principe'] } },
  'Senegal': { en: 'Senegal', fr: 'Sénégal', ar: 'السنغال', aliases: { fr: ['senegal'], ar: ['سنغال'] } },
  'Seychelles': { en: 'Seychelles', fr: 'Seychelles', ar: 'سيشل' },
  'Sierra Leone': { en: 'Sierra Leone', fr: 'Sierra Leone', ar: 'سيراليون' },
  'Somalia': { en: 'Somalia', fr: 'Somalie', ar: 'الصومال', aliases: { ar: ['صومال'] } },
  'Somaliland': { en: 'Somaliland', fr: 'Somaliland', ar: 'أرض الصومال', aliases: { ar: ['ارض الصومال'] } },
  'South Africa': { en: 'South Africa', fr: 'Afrique du Sud', ar: 'جنوب أفريقيا', aliases: { ar: ['جنوب افريقيا'] } },
  'South Sudan': { en: 'South Sudan', fr: 'Soudan du Sud', ar: 'جنوب السودان', aliases: { en: ['s sudan', 's. sudan'] } },
  'Sudan': { en: 'Sudan', fr: 'Soudan', ar: 'السودان', aliases: { ar: ['سودان'] } },
  'Tanzania': { en: 'Tanzania', fr: 'Tanzanie', ar: 'تنزانيا' },
  'Togo': { en: 'Togo', fr: 'Togo', ar: 'توغو' },
  'Tunisia': { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
  'Uganda': { en: 'Uganda', fr: 'Ouganda', ar: 'أوغندا', aliases: { ar: ['اوغندا'] } },
  'Western Sahara': { en: 'Western Sahara', fr: 'Sahara Occidental', ar: 'الصحراء الغربية', aliases: { en: ['w sahara', 'w. sahara'], ar: ['صحراء غربية'] } },
  'Zambia': { en: 'Zambia', fr: 'Zambie', ar: 'زامبيا' },
  'Zimbabwe': { en: 'Zimbabwe', fr: 'Zimbabwe', ar: 'زيمبابوي' },
  // EUROPE
  'Albania': { en: 'Albania', fr: 'Albanie', ar: 'ألبانيا' },
  'Andorra': { en: 'Andorra', fr: 'Andorre', ar: 'أندورا' },
  'Armenia': { en: 'Armenia', fr: 'Arménie', ar: 'أرمينيا', aliases: { fr: ['armenie'] } },
  'Austria': { en: 'Austria', fr: 'Autriche', ar: 'النمسا' },
  'Azerbaijan': { en: 'Azerbaijan', fr: 'Azerbaïdjan', ar: 'أذربيجان', aliases: { fr: ['azerbaidjan'] } },
  'Belarus': { en: 'Belarus', fr: 'Biélorussie', ar: 'بيلاروسيا', aliases: { fr: ['bielorussie', 'belarus'] } },
  'Belgium': { en: 'Belgium', fr: 'Belgique', ar: 'بلجيكا' },
  'Bosnia and Herzegovina': { en: 'Bosnia and Herzegovina', fr: 'Bosnie-Herzégovine', ar: 'البوسنة والهرسك', aliases: { en: ['bosnia', 'bosnia herzegovina', 'bih'], fr: ['bosnie', 'bosnie herzegovine'] } },
  'Bulgaria': { en: 'Bulgaria', fr: 'Bulgarie', ar: 'بلغاريا' },
  'Croatia': { en: 'Croatia', fr: 'Croatie', ar: 'كرواتيا' },
  'Cyprus': { en: 'Cyprus', fr: 'Chypre', ar: 'قبرص' },
  'Czechia': { en: 'Czechia', fr: 'Tchéquie', ar: 'التشيك', aliases: { en: ['czech republic', 'czech'], fr: ['republique tcheque', 'tcheque', 'tchequie'] } },
  'Denmark': { en: 'Denmark', fr: 'Danemark', ar: 'الدنمارك' },
  'Estonia': { en: 'Estonia', fr: 'Estonie', ar: 'إستونيا' },
  'Finland': { en: 'Finland', fr: 'Finlande', ar: 'فنلندا' },
  'France': { en: 'France', fr: 'France', ar: 'فرنسا' },
  'Georgia': { en: 'Georgia', fr: 'Géorgie', ar: 'جورجيا', aliases: { fr: ['georgie'] } },
  'Germany': { en: 'Germany', fr: 'Allemagne', ar: 'ألمانيا' },
  'Greece': { en: 'Greece', fr: 'Grèce', ar: 'اليونان', aliases: { fr: ['grece'] } },
  'Hungary': { en: 'Hungary', fr: 'Hongrie', ar: 'المجر' },
  'Iceland': { en: 'Iceland', fr: 'Islande', ar: 'آيسلندا' },
  'Ireland': { en: 'Ireland', fr: 'Irlande', ar: 'أيرلندا' },
  'Italy': { en: 'Italy', fr: 'Italie', ar: 'إيطاليا' },
  'Kosovo': { en: 'Kosovo', fr: 'Kosovo', ar: 'كوسوفو' },
  'Latvia': { en: 'Latvia', fr: 'Lettonie', ar: 'لاتفيا' },
  'Liechtenstein': { en: 'Liechtenstein', fr: 'Liechtenstein', ar: 'ليختنشتاين' },
  'Lithuania': { en: 'Lithuania', fr: 'Lituanie', ar: 'ليتوانيا' },
  'Luxembourg': { en: 'Luxembourg', fr: 'Luxembourg', ar: 'لوكسمبورغ' },
  'Malta': { en: 'Malta', fr: 'Malte', ar: 'مالطا' },
  'Moldova': { en: 'Moldova', fr: 'Moldavie', ar: 'مولدوفا' },
  'Monaco': { en: 'Monaco', fr: 'Monaco', ar: 'موناكو' },
  'Montenegro': { en: 'Montenegro', fr: 'Monténégro', ar: 'الجبل الأسود', aliases: { fr: ['montenegro'] } },
  'Netherlands': { en: 'Netherlands', fr: 'Pays-Bas', ar: 'هولندا', aliases: { en: ['holland'], fr: ['hollande'] } },
  'North Macedonia': { en: 'North Macedonia', fr: 'Macédoine du Nord', ar: 'مقدونيا الشمالية', aliases: { en: ['macedonia', 'n macedonia', 'fyrom'], fr: ['macedoine', 'macedoine du nord'] } },
  'Norway': { en: 'Norway', fr: 'Norvège', ar: 'النرويج', aliases: { fr: ['norvege'] } },
  'Poland': { en: 'Poland', fr: 'Pologne', ar: 'بولندا' },
  'Portugal': { en: 'Portugal', fr: 'Portugal', ar: 'البرتغال' },
  'Romania': { en: 'Romania', fr: 'Roumanie', ar: 'رومانيا' },
  'Russia': { en: 'Russia', fr: 'Russie', ar: 'روسيا', aliases: { en: ['russian federation'] } },
  'San Marino': { en: 'San Marino', fr: 'Saint-Marin', ar: 'سان مارينو' },
  'Serbia': { en: 'Serbia', fr: 'Serbie', ar: 'صربيا' },
  'Slovakia': { en: 'Slovakia', fr: 'Slovaquie', ar: 'سلوفاكيا' },
  'Slovenia': { en: 'Slovenia', fr: 'Slovénie', ar: 'سلوفينيا', aliases: { fr: ['slovenie'] } },
  'Spain': { en: 'Spain', fr: 'Espagne', ar: 'إسبانيا' },
  'Sweden': { en: 'Sweden', fr: 'Suède', ar: 'السويد', aliases: { fr: ['suede'] } },
  'Switzerland': { en: 'Switzerland', fr: 'Suisse', ar: 'سويسرا' },
  'Turkey': { en: 'Turkey', fr: 'Turquie', ar: 'تركيا' },
  'Ukraine': { en: 'Ukraine', fr: 'Ukraine', ar: 'أوكرانيا' },
  'United Kingdom': { en: 'United Kingdom', fr: 'Royaume-Uni', ar: 'المملكة المتحدة', aliases: { en: ['uk', 'u.k.', 'great britain', 'britain', 'england', 'gb'], fr: ['royaume uni', 'angleterre', 'grande bretagne'] } },
  'Vatican City': { en: 'Vatican City', fr: 'Vatican', ar: 'الفاتيكان', aliases: { en: ['vatican', 'holy see'] } },
  'Faroe Islands': { en: 'Faroe Islands', fr: 'Îles Féroé', ar: 'جزر فارو', aliases: { en: ['faroes'], fr: ['iles feroe', 'feroe'] } },
  'Gibraltar': { en: 'Gibraltar', fr: 'Gibraltar', ar: 'جبل طارق' },
  // ASIA
  'Afghanistan': { en: 'Afghanistan', fr: 'Afghanistan', ar: 'أفغانستان', aliases: { ar: ['افغانستان'] } },
  'Bahrain': { en: 'Bahrain', fr: 'Bahreïn', ar: 'البحرين', aliases: { fr: ['bahrein'], ar: ['بحرين'] } },
  'Bangladesh': { en: 'Bangladesh', fr: 'Bangladesh', ar: 'بنغلاديش' },
  'Bhutan': { en: 'Bhutan', fr: 'Bhoutan', ar: 'بوتان' },
  'Brunei': { en: 'Brunei', fr: 'Brunei', ar: 'بروناي', aliases: { en: ['brunei darussalam'] } },
  'Cambodia': { en: 'Cambodia', fr: 'Cambodge', ar: 'كمبوديا' },
  'China': { en: 'China', fr: 'Chine', ar: 'الصين', aliases: { ar: ['صين'] } },
  'Hong Kong': { en: 'Hong Kong', fr: 'Hong Kong', ar: 'هونغ كونغ', aliases: { en: ['hongkong', 'hk'], ar: ['هونج كونج'] } },
  'India': { en: 'India', fr: 'Inde', ar: 'الهند', aliases: { ar: ['هند'] } },
  'Indonesia': { en: 'Indonesia', fr: 'Indonésie', ar: 'إندونيسيا', aliases: { fr: ['indonesie'], ar: ['اندونيسيا'] } },
  'Iran': { en: 'Iran', fr: 'Iran', ar: 'إيران', aliases: { en: ['persia', 'islamic republic of iran'], ar: ['ايران'] } },
  'Iraq': { en: 'Iraq', fr: 'Irak', ar: 'العراق', aliases: { ar: ['عراق'] } },
  'Israel': { en: 'Israel', fr: 'Israël', ar: 'إسرائيل', aliases: { fr: ['israel'], ar: ['اسرائيل'] } },
  'Japan': { en: 'Japan', fr: 'Japon', ar: 'اليابان', aliases: { ar: ['يابان'] } },
  'Jordan': { en: 'Jordan', fr: 'Jordanie', ar: 'الأردن', aliases: { ar: ['اردن', 'الاردن'] } },
  'Kazakhstan': { en: 'Kazakhstan', fr: 'Kazakhstan', ar: 'كازاخستان' },
  'Kuwait': { en: 'Kuwait', fr: 'Koweït', ar: 'الكويت', aliases: { fr: ['koweit'], ar: ['كويت'] } },
  'Kyrgyzstan': { en: 'Kyrgyzstan', fr: 'Kirghizistan', ar: 'قيرغيزستان' },
  'Laos': { en: 'Laos', fr: 'Laos', ar: 'لاوس', aliases: { en: ['lao', 'lao pdr', "lao people's democratic republic"] } },
  'Lebanon': { en: 'Lebanon', fr: 'Liban', ar: 'لبنان' },
  'Macau': { en: 'Macau', fr: 'Macao', ar: 'ماكاو' },
  'Malaysia': { en: 'Malaysia', fr: 'Malaisie', ar: 'ماليزيا' },
  'Maldives': { en: 'Maldives', fr: 'Maldives', ar: 'المالديف', aliases: { ar: ['مالديف'] } },
  'Mongolia': { en: 'Mongolia', fr: 'Mongolie', ar: 'منغوليا' },
  'Myanmar': { en: 'Myanmar', fr: 'Myanmar', ar: 'ميانمار', aliases: { en: ['burma'], fr: ['birmanie'], ar: ['بورما'] } },
  'Nepal': { en: 'Nepal', fr: 'Népal', ar: 'نيبال', aliases: { fr: ['nepal'] } },
  'North Korea': { en: 'North Korea', fr: 'Corée du Nord', ar: 'كوريا الشمالية', aliases: { en: ['n korea', 'dprk', "democratic people's republic of korea"], fr: ['coree du nord'] } },
  'Oman': { en: 'Oman', fr: 'Oman', ar: 'عُمان', aliases: { ar: ['عمان'] } },
  'Pakistan': { en: 'Pakistan', fr: 'Pakistan', ar: 'باكستان' },
  'Palestine': { en: 'Palestine', fr: 'Palestine', ar: 'فلسطين', aliases: { en: ['palestinian territories', 'west bank', 'gaza'] } },
  'Philippines': { en: 'Philippines', fr: 'Philippines', ar: 'الفلبين', aliases: { ar: ['فلبين'] } },
  'Qatar': { en: 'Qatar', fr: 'Qatar', ar: 'قطر' },
  'Saudi Arabia': { en: 'Saudi Arabia', fr: 'Arabie Saoudite', ar: 'المملكة العربية السعودية', aliases: { en: ['saudi', 'ksa'], ar: ['السعودية', 'سعودية'] } },
  'Singapore': { en: 'Singapore', fr: 'Singapour', ar: 'سنغافورة' },
  'South Korea': { en: 'South Korea', fr: 'Corée du Sud', ar: 'كوريا الجنوبية', aliases: { en: ['s korea', 'korea', 'republic of korea', 'rok'], fr: ['coree du sud', 'coree'] } },
  'Sri Lanka': { en: 'Sri Lanka', fr: 'Sri Lanka', ar: 'سريلانكا' },
  'Syria': { en: 'Syria', fr: 'Syrie', ar: 'سوريا', aliases: { en: ['syrian arab republic'], ar: ['سورية'] } },
  'Taiwan': { en: 'Taiwan', fr: 'Taïwan', ar: 'تايوان', aliases: { en: ['republic of china', 'roc', 'chinese taipei'], fr: ['taiwan'] } },
  'Tajikistan': { en: 'Tajikistan', fr: 'Tadjikistan', ar: 'طاجيكستان' },
  'Thailand': { en: 'Thailand', fr: 'Thaïlande', ar: 'تايلاند', aliases: { fr: ['thailande'] } },
  'Timor-Leste': { en: 'Timor-Leste', fr: 'Timor oriental', ar: 'تيمور الشرقية', aliases: { en: ['east timor', 'timor'], fr: ['timor leste', 'timor-leste'] } },
  'Turkmenistan': { en: 'Turkmenistan', fr: 'Turkménistan', ar: 'تركمانستان', aliases: { fr: ['turkmenistan'] } },
  'United Arab Emirates': { en: 'United Arab Emirates', fr: 'Émirats Arabes Unis', ar: 'الإمارات العربية المتحدة', aliases: { en: ['uae', 'u.a.e.', 'emirates'], fr: ['emirats arabes unis', 'eau'], ar: ['الامارات', 'امارات'] } },
  'Uzbekistan': { en: 'Uzbekistan', fr: 'Ouzbékistan', ar: 'أوزبكستان', aliases: { fr: ['ouzbekistan'], ar: ['اوزبكستان'] } },
  'Vietnam': { en: 'Vietnam', fr: 'Viêt Nam', ar: 'فيتنام', aliases: { en: ['viet nam'], fr: ['vietnam'] } },
  'Yemen': { en: 'Yemen', fr: 'Yémen', ar: 'اليمن', aliases: { fr: ['yemen'], ar: ['يمن'] } },
  // NORTH AMERICA
  'Antigua and Barbuda': { en: 'Antigua and Barbuda', fr: 'Antigua-et-Barbuda', ar: 'أنتيغوا وباربودا', aliases: { en: ['antigua'] } },
  'Bahamas': { en: 'Bahamas', fr: 'Bahamas', ar: 'الباهاما', aliases: { en: ['the bahamas'] } },
  'Barbados': { en: 'Barbados', fr: 'Barbade', ar: 'باربادوس' },
  'Belize': { en: 'Belize', fr: 'Belize', ar: 'بليز' },
  'Canada': { en: 'Canada', fr: 'Canada', ar: 'كندا' },
  'Costa Rica': { en: 'Costa Rica', fr: 'Costa Rica', ar: 'كوستاريكا' },
  'Cuba': { en: 'Cuba', fr: 'Cuba', ar: 'كوبا' },
  'Dominica': { en: 'Dominica', fr: 'Dominique', ar: 'دومينيكا' },
  'Dominican Republic': { en: 'Dominican Republic', fr: 'République Dominicaine', ar: 'جمهورية الدومينيكان', aliases: { en: ['dominican rep', 'dr'], fr: ['republique dominicaine'] } },
  'El Salvador': { en: 'El Salvador', fr: 'Salvador', ar: 'السلفادور' },
  'Grenada': { en: 'Grenada', fr: 'Grenade', ar: 'غرينادا' },
  'Guatemala': { en: 'Guatemala', fr: 'Guatemala', ar: 'غواتيمالا' },
  'Haiti': { en: 'Haiti', fr: 'Haïti', ar: 'هايتي', aliases: { fr: ['haiti'] } },
  'Honduras': { en: 'Honduras', fr: 'Honduras', ar: 'هندوراس' },
  'Jamaica': { en: 'Jamaica', fr: 'Jamaïque', ar: 'جامايكا', aliases: { fr: ['jamaique'] } },
  'Mexico': { en: 'Mexico', fr: 'Mexique', ar: 'المكسيك' },
  'Nicaragua': { en: 'Nicaragua', fr: 'Nicaragua', ar: 'نيكاراغوا' },
  'Panama': { en: 'Panama', fr: 'Panama', ar: 'بنما' },
  'Puerto Rico': { en: 'Puerto Rico', fr: 'Porto Rico', ar: 'بورتوريكو', aliases: { en: ['pr'] } },
  'Saint Kitts and Nevis': { en: 'Saint Kitts and Nevis', fr: 'Saint-Kitts-et-Nevis', ar: 'سانت كيتس ونيفيس', aliases: { en: ['st kitts', 'st. kitts'] } },
  'Saint Lucia': { en: 'Saint Lucia', fr: 'Sainte-Lucie', ar: 'سانت لوسيا', aliases: { en: ['st lucia', 'st. lucia'] } },
  'Saint Vincent and the Grenadines': { en: 'Saint Vincent and the Grenadines', fr: 'Saint-Vincent-et-les-Grenadines', ar: 'سانت فنسنت والغرينادين', aliases: { en: ['st vincent', 'st. vincent'] } },
  'Trinidad and Tobago': { en: 'Trinidad and Tobago', fr: 'Trinité-et-Tobago', ar: 'ترينيداد وتوباغو', aliases: { en: ['trinidad', 't&t'] } },
  'United States': { en: 'United States', fr: 'États-Unis', ar: 'الولايات المتحدة', aliases: { en: ['usa', 'u.s.a.', 'us', 'u.s.', 'america', 'united states of america'], fr: ['etats-unis', 'etats unis', 'amerique'] } },
  'Greenland': { en: 'Greenland', fr: 'Groenland', ar: 'غرينلاند' },
  'Bermuda': { en: 'Bermuda', fr: 'Bermudes', ar: 'برمودا' },
  'Cayman Islands': { en: 'Cayman Islands', fr: 'Îles Caïmans', ar: 'جزر كايمان', aliases: { fr: ['iles caimans'] } },
  'Aruba': { en: 'Aruba', fr: 'Aruba', ar: 'أروبا' },
  'Curaçao': { en: 'Curaçao', fr: 'Curaçao', ar: 'كوراساو', aliases: { en: ['curacao'] } },
  'U.S. Virgin Islands': { en: 'U.S. Virgin Islands', fr: 'Îles Vierges américaines', ar: 'جزر العذراء الأمريكية', aliases: { en: ['us virgin islands', 'usvi', 'american virgin islands'], fr: ['iles vierges americaines'] } },
  'British Virgin Islands': { en: 'British Virgin Islands', fr: 'Îles Vierges britanniques', ar: 'جزر العذراء البريطانية', aliases: { en: ['bvi'], fr: ['iles vierges britanniques'] } },
  // SOUTH AMERICA
  'Argentina': { en: 'Argentina', fr: 'Argentine', ar: 'الأرجنتين' },
  'Bolivia': { en: 'Bolivia', fr: 'Bolivie', ar: 'بوليفيا' },
  'Brazil': { en: 'Brazil', fr: 'Brésil', ar: 'البرازيل', aliases: { fr: ['bresil'] } },
  'Chile': { en: 'Chile', fr: 'Chili', ar: 'تشيلي' },
  'Colombia': { en: 'Colombia', fr: 'Colombie', ar: 'كولومبيا' },
  'Ecuador': { en: 'Ecuador', fr: 'Équateur', ar: 'الإكوادور', aliases: { fr: ['equateur'] } },
  'French Guiana': { en: 'French Guiana', fr: 'Guyane française', ar: 'غويانا الفرنسية', aliases: { en: ['guyane'], fr: ['guyane', 'guyane francaise'] } },
  'Guyana': { en: 'Guyana', fr: 'Guyana', ar: 'غيانا' },
  'Paraguay': { en: 'Paraguay', fr: 'Paraguay', ar: 'باراغواي' },
  'Peru': { en: 'Peru', fr: 'Pérou', ar: 'بيرو', aliases: { fr: ['perou'] } },
  'Suriname': { en: 'Suriname', fr: 'Suriname', ar: 'سورينام' },
  'Uruguay': { en: 'Uruguay', fr: 'Uruguay', ar: 'أوروغواي' },
  'Venezuela': { en: 'Venezuela', fr: 'Venezuela', ar: 'فنزويلا' },
  'Falkland Islands': { en: 'Falkland Islands', fr: 'Îles Malouines', ar: 'جزر فوكلاند', aliases: { en: ['falklands', 'malvinas', 'islas malvinas'], fr: ['malouines', 'iles malouines'] } },
  // OCEANIA
  'Australia': { en: 'Australia', fr: 'Australie', ar: 'أستراليا' },
  'Fiji': { en: 'Fiji', fr: 'Fidji', ar: 'فيجي' },
  'Kiribati': { en: 'Kiribati', fr: 'Kiribati', ar: 'كيريباتي' },
  'Marshall Islands': { en: 'Marshall Islands', fr: 'Îles Marshall', ar: 'جزر مارشال', aliases: { fr: ['iles marshall'] } },
  'Micronesia': { en: 'Micronesia', fr: 'Micronésie', ar: 'ميكرونيزيا', aliases: { en: ['federated states of micronesia', 'fsm'], fr: ['micronesie'] } },
  'Nauru': { en: 'Nauru', fr: 'Nauru', ar: 'ناورو' },
  'New Zealand': { en: 'New Zealand', fr: 'Nouvelle-Zélande', ar: 'نيوزيلندا', aliases: { en: ['nz', 'aotearoa'], fr: ['nouvelle zelande'] } },
  'Palau': { en: 'Palau', fr: 'Palaos', ar: 'بالاو' },
  'Papua New Guinea': { en: 'Papua New Guinea', fr: 'Papouasie-Nouvelle-Guinée', ar: 'بابوا غينيا الجديدة', aliases: { en: ['png', 'papua'], fr: ['papouasie nouvelle guinee'] } },
  'Samoa': { en: 'Samoa', fr: 'Samoa', ar: 'ساموا' },
  'Solomon Islands': { en: 'Solomon Islands', fr: 'Îles Salomon', ar: 'جزر سليمان', aliases: { en: ['solomons'], fr: ['iles salomon'] } },
  'Tonga': { en: 'Tonga', fr: 'Tonga', ar: 'تونغا' },
  'Tuvalu': { en: 'Tuvalu', fr: 'Tuvalu', ar: 'توفالو' },
  'Vanuatu': { en: 'Vanuatu', fr: 'Vanuatu', ar: 'فانواتو' },
  'New Caledonia': { en: 'New Caledonia', fr: 'Nouvelle-Calédonie', ar: 'كاليدونيا الجديدة', aliases: { fr: ['nouvelle caledonie'] } },
  'French Polynesia': { en: 'French Polynesia', fr: 'Polynésie française', ar: 'بولينيزيا الفرنسية', aliases: { en: ['tahiti'], fr: ['polynesie francaise', 'tahiti'] } },
  'Guam': { en: 'Guam', fr: 'Guam', ar: 'غوام' },
  'American Samoa': { en: 'American Samoa', fr: 'Samoa américaines', ar: 'ساموا الأمريكية', aliases: { fr: ['samoa americaines'] } },
  'Northern Mariana Islands': { en: 'Northern Mariana Islands', fr: 'Îles Mariannes du Nord', ar: 'جزر ماريانا الشمالية', aliases: { en: ['northern marianas', 'cnmi'], fr: ['iles mariannes du nord', 'mariannes'] } },
  'Antarctica': { en: 'Antarctica', fr: 'Antarctique', ar: 'القارة القطبية الجنوبية' },
};

// ============================================================
// TEXT NORMALIZATION AND MATCHING
// ============================================================

const containsArabic = (str: string): boolean =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str);

const removeAccents = (str: string): string => {
  if (containsArabic(str)) return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const normalizeForMatch = (str: string): string => {
  const trimmed = str.toLowerCase().trim();
  if (containsArabic(trimmed)) {
    return trimmed
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return removeAccents(trimmed)
    .replace(/['']/g, "'")
    .replace(/[-–—]/g, ' ')
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ');
};

const removeArabicArticle = (str: string): string => {
  if (str.startsWith('ال')) return str.slice(2);
  return str;
};

const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// Build lookup maps at module load time
const buildLookupMaps = () => {
  const maps: Record<Language, Record<string, string>> = { en: {}, fr: {}, ar: {} };
  Object.entries(localizedCountryNames).forEach(([canonicalName, localized]) => {
    (['en', 'fr', 'ar'] as Language[]).forEach(lang => {
      const name = localized[lang];
      if (name) maps[lang][normalizeForMatch(name)] = canonicalName;
      const aliases = localized.aliases?.[lang] || [];
      aliases.forEach(alias => { maps[lang][normalizeForMatch(alias)] = canonicalName; });
    });
  });
  return maps;
};

const countryLookupMaps = buildLookupMaps();

const matchCountryInput = (input: string, language: Language): string | null => {
  const normalized = normalizeForMatch(input);
  if (countryLookupMaps[language][normalized]) return countryLookupMaps[language][normalized];
  if (containsArabic(normalized)) {
    const withoutArticle = removeArabicArticle(normalized);
    if (withoutArticle !== normalized && countryLookupMaps.ar[withoutArticle]) return countryLookupMaps.ar[withoutArticle];
    for (const [key, value] of Object.entries(countryLookupMaps.ar)) {
      const keyWithoutArticle = removeArabicArticle(key);
      if (keyWithoutArticle === normalized || keyWithoutArticle === withoutArticle) return value;
    }
  }
  if (language !== 'en' && countryLookupMaps.en[normalized]) return countryLookupMaps.en[normalized];
  for (const lang of ['en', 'fr', 'ar'] as Language[]) {
    if (countryLookupMaps[lang][normalized]) return countryLookupMaps[lang][normalized];
  }
  return null;
};

const isExactMatch = (input: string, targetCountry: string, language: Language): boolean => {
  return matchCountryInput(input, language) === targetCountry;
};

const isCloseMatch = (input: string, targetCountry: string, language: Language): boolean => {
  const normalizedInput = normalizeForMatch(input);
  const targetLocalized = localizedCountryNames[targetCountry];
  if (!targetLocalized) return false;
  const targetName = normalizeForMatch(targetLocalized[language] || targetLocalized.en);
  if (normalizedInput.length >= 4 && targetName.length >= 4) {
    if (targetName.includes(normalizedInput) || normalizedInput.includes(targetName)) return true;
  }
  const distance = levenshteinDistance(normalizedInput, targetName);
  const threshold = Math.min(2, Math.floor(targetName.length / 4));
  return distance > 0 && distance <= threshold;
};

// Legacy normalization fallback
const normalizeCountryName = (name: string): string => {
  const normalized = removeAccents(name.toLowerCase().trim());
  const variations: Record<string, string> = {
    'usa': 'united states', 'us': 'united states', 'united states of america': 'united states',
    'uk': 'united kingdom', 'great britain': 'united kingdom', 'england': 'united kingdom',
    'uae': 'united arab emirates', 'drc': 'democratic republic of the congo',
    'dr congo': 'democratic republic of the congo', 'korea': 'south korea', 'holland': 'netherlands',
  };
  return variations[normalized] || normalized;
};

const fuzzyMatch = (guess: string, correct: string, threshold = 1): boolean => {
  return levenshteinDistance(guess, correct) <= threshold;
};

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

function validateAndScore(
  guess: string,
  correctCountry: string,
  language: Language
): { correct: boolean; points: number; matchType: 'exact' | 'close' | 'wrong' } {
  // Validate inputs
  if (!guess || typeof guess !== 'string' || guess.length > 100) {
    return { correct: false, points: 0, matchType: 'wrong' };
  }
  if (!correctCountry || !localizedCountryNames[correctCountry]) {
    return { correct: false, points: 0, matchType: 'wrong' };
  }
  if (!['en', 'fr', 'ar'].includes(language)) {
    return { correct: false, points: 0, matchType: 'wrong' };
  }

  // Check exact match via localized lookup
  if (isExactMatch(guess, correctCountry, language)) {
    return { correct: true, points: 3, matchType: 'exact' };
  }

  // Check close match (typos)
  if (isCloseMatch(guess, correctCountry, language)) {
    return { correct: true, points: 2, matchType: 'close' };
  }

  // Legacy fallback matching
  const normalizedGuess = normalizeCountryName(guess);
  const normalizedCorrect = normalizeCountryName(correctCountry);
  if (normalizedGuess === normalizedCorrect) {
    return { correct: true, points: 3, matchType: 'exact' };
  }
  if (fuzzyMatch(normalizedGuess, normalizedCorrect, 1)) {
    return { correct: true, points: 2, matchType: 'close' };
  }

  return { correct: false, points: 0, matchType: 'wrong' };
}

// ============================================================
// FIREBASE AUTH VERIFICATION
// ============================================================

const FIREBASE_PROJECT_ID = 'lovable-quiz-map';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> | null = null;
let certsCacheExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certsCacheExpiry) {
    return cachedCerts;
  }
  const response = await fetch(GOOGLE_CERTS_URL);
  const cacheControl = response.headers.get('cache-control');
  const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1];
  cachedCerts = await response.json();
  certsCacheExpiry = Date.now() + (maxAge ? parseInt(maxAge) * 1000 : 3600000);
  return cachedCerts!;
}

async function verifyFirebaseToken(authHeader: string | null): Promise<{ uid: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const header = decodeProtectedHeader(token);
    if (!header.kid) return null;
    const certs = await getGoogleCerts();
    const cert = certs[header.kid];
    if (!cert) return null;
    const publicKey = await importX509(cert, 'RS256');
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload.sub) return null;
    return { uid: payload.sub };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

// ============================================================
// HTTP HANDLER
// ============================================================


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Firebase authentication
    const authUser = await verifyFirebaseToken(req.headers.get('Authorization'));
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { guess, correctCountry, language } = body;

    if (!guess || !correctCountry || !language) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: guess, correctCountry, language' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = validateAndScore(guess, correctCountry, language);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('validate-guess error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
