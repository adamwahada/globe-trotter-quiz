/**
 * Localized hints data for all supported languages.
 * Provides translations for capitals, famous players, and famous singers.
 */

import { Language } from './translations';

export interface LocalizedHintData {
  capital: {
    en: string;
    fr: string;
    ar: string;
  };
  famousPlayer?: {
    en: string;
    fr: string;
    ar: string;
  };
  famousSinger?: {
    en: string;
    fr: string;
    ar: string;
  };
  famousPerson?: {
    en: string;
    fr: string;
    ar: string;
  };
}

/**
 * Localized hints for countries.
 * Key is the canonical English country name.
 * Only includes countries with meaningful localized data.
 */
export const localizedHints: Record<string, LocalizedHintData> = {
  // === AFRICA ===
  'Algeria': {
    capital: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر العاصمة' },
    famousPlayer: { en: 'Riyad Mahrez', fr: 'Riyad Mahrez', ar: 'رياض محرز' },
    famousSinger: { en: 'Cheb Khaled', fr: 'Cheb Khaled', ar: 'الشاب خالد' },
  },
  'Egypt': {
    capital: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' },
    famousPlayer: { en: 'Mohamed Salah', fr: 'Mohamed Salah', ar: 'محمد صلاح' },
    famousSinger: { en: 'Amr Diab', fr: 'Amr Diab', ar: 'عمرو دياب' },
    famousPerson: { en: 'Cleopatra', fr: 'Cléopâtre', ar: 'كليوباترا' },
  },
  'Morocco': {
    capital: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
    famousPlayer: { en: 'Achraf Hakimi', fr: 'Achraf Hakimi', ar: 'أشرف حكيمي' },
    famousSinger: { en: 'Saad Lamjarred', fr: 'Saad Lamjarred', ar: 'سعد لمجرد' },
  },
  'Tunisia': {
    capital: { en: 'Tunis', fr: 'Tunis', ar: 'تونس العاصمة' },
    famousPlayer: { en: 'Wahbi Khazri', fr: 'Wahbi Khazri', ar: 'وهبي الخزري' },
    famousSinger: { en: 'Latifa', fr: 'Latifa', ar: 'لطيفة' },
  },
  'South Africa': {
    capital: { en: 'Pretoria', fr: 'Pretoria', ar: 'بريتوريا' },
    famousPlayer: { en: 'Steven Pienaar', fr: 'Steven Pienaar', ar: 'ستيفن بينار' },
    famousSinger: { en: 'Master KG', fr: 'Master KG', ar: 'ماستر كي جي' },
    famousPerson: { en: 'Nelson Mandela', fr: 'Nelson Mandela', ar: 'نيلسون مانديلا' },
  },
  'Nigeria': {
    capital: { en: 'Abuja', fr: 'Abuja', ar: 'أبوجا' },
    famousPlayer: { en: 'Victor Osimhen', fr: 'Victor Osimhen', ar: 'فيكتور أوسيمين' },
    famousSinger: { en: 'Burna Boy', fr: 'Burna Boy', ar: 'بورنا بوي' },
  },
  'Senegal': {
    capital: { en: 'Dakar', fr: 'Dakar', ar: 'داكار' },
    famousPlayer: { en: 'Sadio Mané', fr: 'Sadio Mané', ar: 'ساديو ماني' },
    famousSinger: { en: "Youssou N'Dour", fr: "Youssou N'Dour", ar: 'يوسو ندور' },
  },
  'Ivory Coast': {
    capital: { en: 'Yamoussoukro', fr: 'Yamoussoukro', ar: 'ياموسوكرو' },
    famousPlayer: { en: 'Didier Drogba', fr: 'Didier Drogba', ar: 'ديدييه دروغبا' },
    famousSinger: { en: 'Alpha Blondy', fr: 'Alpha Blondy', ar: 'ألفا بلوندي' },
  },
  'Ghana': {
    capital: { en: 'Accra', fr: 'Accra', ar: 'أكرا' },
    famousPlayer: { en: 'Asamoah Gyan', fr: 'Asamoah Gyan', ar: 'أسامواه جيان' },
    famousSinger: { en: 'Sarkodie', fr: 'Sarkodie', ar: 'ساركودي' },
  },
  'Kenya': {
    capital: { en: 'Nairobi', fr: 'Nairobi', ar: 'نيروبي' },
    famousPlayer: { en: 'Eliud Kipchoge', fr: 'Eliud Kipchoge', ar: 'إليود كيبتشوغي' },
    famousSinger: { en: 'Sauti Sol', fr: 'Sauti Sol', ar: 'ساوتي سول' },
  },
  'Ethiopia': {
    capital: { en: 'Addis Ababa', fr: 'Addis-Abeba', ar: 'أديس أبابا' },
    famousPlayer: { en: 'Haile Gebrselassie', fr: 'Haile Gebrselassie', ar: 'هيلي غبريسلاسي' },
    famousSinger: { en: 'Aster Aweke', fr: 'Aster Aweke', ar: 'أستر أويكي' },
  },

  // === EUROPE ===
  'France': {
    capital: { en: 'Paris', fr: 'Paris', ar: 'باريس' },
    famousPlayer: { en: 'Kylian Mbappé', fr: 'Kylian Mbappé', ar: 'كيليان مبابي' },
    famousSinger: { en: 'Edith Piaf', fr: 'Édith Piaf', ar: 'إديث بياف' },
    famousPerson: { en: 'Napoleon Bonaparte', fr: 'Napoléon Bonaparte', ar: 'نابليون بونابرت' },
  },
  'Germany': {
    capital: { en: 'Berlin', fr: 'Berlin', ar: 'برلين' },
    famousPlayer: { en: 'Manuel Neuer', fr: 'Manuel Neuer', ar: 'مانويل نوير' },
    famousSinger: { en: 'Rammstein', fr: 'Rammstein', ar: 'رامشتاين' },
    famousPerson: { en: 'Albert Einstein', fr: 'Albert Einstein', ar: 'ألبرت أينشتاين' },
  },
  'United Kingdom': {
    capital: { en: 'London', fr: 'Londres', ar: 'لندن' },
    famousPlayer: { en: 'David Beckham', fr: 'David Beckham', ar: 'ديفيد بيكهام' },
    famousSinger: { en: 'Adele', fr: 'Adele', ar: 'أديل' },
    famousPerson: { en: 'William Shakespeare', fr: 'William Shakespeare', ar: 'وليام شكسبير' },
  },
  'Spain': {
    capital: { en: 'Madrid', fr: 'Madrid', ar: 'مدريد' },
    famousPlayer: { en: 'Sergio Ramos', fr: 'Sergio Ramos', ar: 'سيرجيو راموس' },
    famousSinger: { en: 'Enrique Iglesias', fr: 'Enrique Iglesias', ar: 'إنريكي إغليسياس' },
    famousPerson: { en: 'Pablo Picasso', fr: 'Pablo Picasso', ar: 'بابلو بيكاسو' },
  },
  'Italy': {
    capital: { en: 'Rome', fr: 'Rome', ar: 'روما' },
    famousPlayer: { en: 'Francesco Totti', fr: 'Francesco Totti', ar: 'فرانشيسكو توتي' },
    famousSinger: { en: 'Andrea Bocelli', fr: 'Andrea Bocelli', ar: 'أندريا بوتشيللي' },
    famousPerson: { en: 'Leonardo da Vinci', fr: 'Léonard de Vinci', ar: 'ليوناردو دافنشي' },
  },
  'Portugal': {
    capital: { en: 'Lisbon', fr: 'Lisbonne', ar: 'لشبونة' },
    famousPlayer: { en: 'Cristiano Ronaldo', fr: 'Cristiano Ronaldo', ar: 'كريستيانو رونالدو' },
    famousSinger: { en: 'Amália Rodrigues', fr: 'Amália Rodrigues', ar: 'أماليا رودريغيش' },
  },
  'Netherlands': {
    capital: { en: 'Amsterdam', fr: 'Amsterdam', ar: 'أمستردام' },
    famousPlayer: { en: 'Virgil van Dijk', fr: 'Virgil van Dijk', ar: 'فيرجيل فان دايك' },
    famousSinger: { en: 'Tiesto', fr: 'Tiësto', ar: 'تيستو' },
    famousPerson: { en: 'Vincent van Gogh', fr: 'Vincent van Gogh', ar: 'فنسنت فان غوخ' },
  },
  'Belgium': {
    capital: { en: 'Brussels', fr: 'Bruxelles', ar: 'بروكسل' },
    famousPlayer: { en: 'Kevin De Bruyne', fr: 'Kevin De Bruyne', ar: 'كيفن دي بروين' },
    famousSinger: { en: 'Stromae', fr: 'Stromae', ar: 'سترومي' },
  },
  'Sweden': {
    capital: { en: 'Stockholm', fr: 'Stockholm', ar: 'ستوكهولم' },
    famousPlayer: { en: 'Zlatan Ibrahimović', fr: 'Zlatan Ibrahimović', ar: 'زلاتان إبراهيموفيتش' },
    famousSinger: { en: 'ABBA', fr: 'ABBA', ar: 'أبا' },
  },
  'Poland': {
    capital: { en: 'Warsaw', fr: 'Varsovie', ar: 'وارسو' },
    famousPlayer: { en: 'Robert Lewandowski', fr: 'Robert Lewandowski', ar: 'روبرت ليفاندوفسكي' },
    famousPerson: { en: 'Marie Curie', fr: 'Marie Curie', ar: 'ماري كوري' },
  },
  'Russia': {
    capital: { en: 'Moscow', fr: 'Moscou', ar: 'موسكو' },
    famousPlayer: { en: 'Andrey Arshavin', fr: 'Andreï Archavine', ar: 'أندريه أرشافين' },
    famousPerson: { en: 'Peter the Great', fr: 'Pierre le Grand', ar: 'بطرس الأكبر' },
  },
  'Turkey': {
    capital: { en: 'Ankara', fr: 'Ankara', ar: 'أنقرة' },
    famousPlayer: { en: 'Hakan Çalhanoğlu', fr: 'Hakan Çalhanoğlu', ar: 'هاكان تشالهان أوغلو' },
    famousSinger: { en: 'Tarkan', fr: 'Tarkan', ar: 'طاركان' },
  },
  'Greece': {
    capital: { en: 'Athens', fr: 'Athènes', ar: 'أثينا' },
    famousPerson: { en: 'Aristotle', fr: 'Aristote', ar: 'أرسطو' },
  },
  'Norway': {
    capital: { en: 'Oslo', fr: 'Oslo', ar: 'أوسلو' },
    famousPlayer: { en: 'Erling Haaland', fr: 'Erling Haaland', ar: 'إرلينغ هالاند' },
    famousSinger: { en: 'A-ha', fr: 'A-ha', ar: 'آها' },
  },

  // === ASIA ===
  'Japan': {
    capital: { en: 'Tokyo', fr: 'Tokyo', ar: 'طوكيو' },
    famousPerson: { en: 'Hayao Miyazaki', fr: 'Hayao Miyazaki', ar: 'هاياو ميازاكي' },
  },
  'China': {
    capital: { en: 'Beijing', fr: 'Pékin', ar: 'بكين' },
    famousPerson: { en: 'Confucius', fr: 'Confucius', ar: 'كونفوشيوس' },
  },
  'India': {
    capital: { en: 'New Delhi', fr: 'New Delhi', ar: 'نيودلهي' },
    famousPerson: { en: 'Mahatma Gandhi', fr: 'Mahatma Gandhi', ar: 'المهاتما غاندي' },
  },
  'South Korea': {
    capital: { en: 'Seoul', fr: 'Séoul', ar: 'سيول' },
    famousSinger: { en: 'BTS', fr: 'BTS', ar: 'بي تي إس' },
    famousPerson: { en: 'BTS', fr: 'BTS', ar: 'بي تي إس' },
  },
  'North Korea': {
    capital: { en: 'Pyongyang', fr: 'Pyongyang', ar: 'بيونغ يانغ' },
    famousPerson: { en: 'Kim Il-sung', fr: 'Kim Il-sung', ar: 'كيم إل سونغ' },
  },
  'Saudi Arabia': {
    capital: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' },
    famousPerson: { en: 'King Abdulaziz', fr: 'Roi Abdelaziz', ar: 'الملك عبدالعزيز' },
  },
  'United Arab Emirates': {
    capital: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبوظبي' },
    famousPerson: { en: 'Sheikh Zayed', fr: 'Cheikh Zayed', ar: 'الشيخ زايد' },
  },
  'Iran': {
    capital: { en: 'Tehran', fr: 'Téhéran', ar: 'طهران' },
    famousPerson: { en: 'Cyrus the Great', fr: 'Cyrus le Grand', ar: 'كورش الكبير' },
  },
  'Iraq': {
    capital: { en: 'Baghdad', fr: 'Bagdad', ar: 'بغداد' },
  },
  'Syria': {
    capital: { en: 'Damascus', fr: 'Damas', ar: 'دمشق' },
  },
  'Lebanon': {
    capital: { en: 'Beirut', fr: 'Beyrouth', ar: 'بيروت' },
    famousSinger: { en: 'Fairuz', fr: 'Fairouz', ar: 'فيروز' },
  },
  'Jordan': {
    capital: { en: 'Amman', fr: 'Amman', ar: 'عمّان' },
    famousPerson: { en: 'King Hussein', fr: 'Roi Hussein', ar: 'الملك حسين' },
  },
  'Palestine': {
    capital: { en: 'Ramallah (de facto)', fr: 'Ramallah (de facto)', ar: 'رام الله (بحكم الأمر الواقع)' },
    famousSinger: { en: 'Mohammed Assaf', fr: 'Mohammed Assaf', ar: 'محمد عساف' },
  },
  'Pakistan': {
    capital: { en: 'Islamabad', fr: 'Islamabad', ar: 'إسلام آباد' },
    famousPerson: { en: 'Muhammad Ali Jinnah', fr: 'Muhammad Ali Jinnah', ar: 'محمد علي جناح' },
  },
  'Thailand': {
    capital: { en: 'Bangkok', fr: 'Bangkok', ar: 'بانكوك' },
  },
  'Vietnam': {
    capital: { en: 'Hanoi', fr: 'Hanoï', ar: 'هانوي' },
    famousPerson: { en: 'Ho Chi Minh', fr: 'Hô Chi Minh', ar: 'هو تشي منه' },
  },
  'Indonesia': {
    capital: { en: 'Jakarta', fr: 'Jakarta', ar: 'جاكرتا' },
  },
  'Malaysia': {
    capital: { en: 'Kuala Lumpur', fr: 'Kuala Lumpur', ar: 'كوالالمبور' },
  },
  'Philippines': {
    capital: { en: 'Manila', fr: 'Manille', ar: 'مانيلا' },
  },

  // === AMERICAS ===
  'United States': {
    capital: { en: 'Washington, D.C.', fr: 'Washington', ar: 'واشنطن العاصمة' },
    famousPlayer: { en: 'LeBron James', fr: 'LeBron James', ar: 'ليبرون جيمس' },
    famousSinger: { en: 'Taylor Swift', fr: 'Taylor Swift', ar: 'تايلور سويفت' },
    famousPerson: { en: 'George Washington', fr: 'George Washington', ar: 'جورج واشنطن' },
  },
  'Canada': {
    capital: { en: 'Ottawa', fr: 'Ottawa', ar: 'أوتاوا' },
    famousPlayer: { en: 'Alphonso Davies', fr: 'Alphonso Davies', ar: 'ألفونسو ديفيز' },
    famousSinger: { en: 'The Weeknd', fr: 'The Weeknd', ar: 'ذا ويكند' },
    famousPerson: { en: 'Justin Bieber', fr: 'Justin Bieber', ar: 'جاستن بيبر' },
  },
  'Mexico': {
    capital: { en: 'Mexico City', fr: 'Mexico', ar: 'مكسيكو سيتي' },
    famousSinger: { en: 'Luis Miguel', fr: 'Luis Miguel', ar: 'لويس ميغيل' },
  },
  'Brazil': {
    capital: { en: 'Brasília', fr: 'Brasilia', ar: 'برازيليا' },
    famousPlayer: { en: 'Neymar', fr: 'Neymar', ar: 'نيمار' },
    famousSinger: { en: 'Anitta', fr: 'Anitta', ar: 'أنيتا' },
    famousPerson: { en: 'Pelé', fr: 'Pelé', ar: 'بيليه' },
  },
  'Argentina': {
    capital: { en: 'Buenos Aires', fr: 'Buenos Aires', ar: 'بوينس آيرس' },
    famousPlayer: { en: 'Lionel Messi', fr: 'Lionel Messi', ar: 'ليونيل ميسي' },
    famousPerson: { en: 'Lionel Messi', fr: 'Lionel Messi', ar: 'ليونيل ميسي' },
  },
  'Colombia': {
    capital: { en: 'Bogotá', fr: 'Bogota', ar: 'بوغوتا' },
    famousPlayer: { en: 'James Rodríguez', fr: 'James Rodríguez', ar: 'خاميس رودريغيز' },
    famousSinger: { en: 'Shakira', fr: 'Shakira', ar: 'شاكيرا' },
  },
  'Chile': {
    capital: { en: 'Santiago', fr: 'Santiago', ar: 'سانتياغو' },
    famousPlayer: { en: 'Alexis Sánchez', fr: 'Alexis Sánchez', ar: 'أليكسيس سانشيز' },
    famousPerson: { en: 'Pablo Neruda', fr: 'Pablo Neruda', ar: 'بابلو نيرودا' },
  },
  'Peru': {
    capital: { en: 'Lima', fr: 'Lima', ar: 'ليما' },
    famousPlayer: { en: 'Paolo Guerrero', fr: 'Paolo Guerrero', ar: 'باولو غيريرو' },
  },
  'Cuba': {
    capital: { en: 'Havana', fr: 'La Havane', ar: 'هافانا' },
    famousSinger: { en: 'Celia Cruz', fr: 'Celia Cruz', ar: 'سيليا كروز' },
    famousPerson: { en: 'Fidel Castro', fr: 'Fidel Castro', ar: 'فيدل كاسترو' },
  },
  'Jamaica': {
    capital: { en: 'Kingston', fr: 'Kingston', ar: 'كينغستون' },
    famousPlayer: { en: 'Usain Bolt', fr: 'Usain Bolt', ar: 'أوساين بولت' },
    famousSinger: { en: 'Bob Marley', fr: 'Bob Marley', ar: 'بوب مارلي' },
  },
  'Puerto Rico': {
    capital: { en: 'San Juan', fr: 'San Juan', ar: 'سان خوان' },
    famousPlayer: { en: 'Roberto Clemente', fr: 'Roberto Clemente', ar: 'روبرتو كليمنتي' },
    famousSinger: { en: 'Bad Bunny', fr: 'Bad Bunny', ar: 'باد باني' },
  },

  // === OCEANIA ===
  'Australia': {
    capital: { en: 'Canberra', fr: 'Canberra', ar: 'كانبرا' },
    famousPlayer: { en: 'Tim Cahill', fr: 'Tim Cahill', ar: 'تيم كاهيل' },
    famousSinger: { en: 'Sia', fr: 'Sia', ar: 'سيا' },
  },
  'New Zealand': {
    capital: { en: 'Wellington', fr: 'Wellington', ar: 'ويلينغتون' },
    famousPlayer: { en: 'Dan Carter', fr: 'Dan Carter', ar: 'دان كارتر' },
    famousSinger: { en: 'Lorde', fr: 'Lorde', ar: 'لورد' },
  },

  // === TERRITORIES ===
  'Greenland': {
    capital: { en: 'Nuuk', fr: 'Nuuk', ar: 'نوك' },
  },
  'Hong Kong': {
    capital: { en: 'Hong Kong', fr: 'Hong Kong', ar: 'هونغ كونغ' },
    famousPerson: { en: 'Jackie Chan', fr: 'Jackie Chan', ar: 'جاكي شان' },
  },
};

/**
 * Get a localized hint value.
 * Returns the hint in the specified language, falling back to English if not available.
 */
export const getLocalizedHint = (
  country: string,
  hintType: 'capital' | 'famousPlayer' | 'famousSinger' | 'famousPerson',
  language: Language
): string | null => {
  const hint = localizedHints[country]?.[hintType];
  if (!hint) return null;
  return hint[language] || hint.en;
};

/**
 * Check if a country has localized hints available.
 */
export const hasLocalizedHints = (country: string): boolean => {
  return !!localizedHints[country];
};
