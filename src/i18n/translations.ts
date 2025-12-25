export type Language = 'en' | 'fr' | 'ar';

export const translations = {
  en: {
    // Navigation & Branding
    appName: 'World Quiz',
    logo: 'World Quiz',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    createAccount: 'Create Account',
    welcomeBack: 'Welcome Back',
    joinUs: 'Join the Adventure',
    
    // Landing Page
    heroTitle: 'Test Your World Knowledge',
    heroSubtitle: 'Challenge friends in real-time geography battles',
    startGame: 'Start Game',
    howToPlay: 'How to Play',
    learnMore: 'Learn More',
    
    // Rules
    rulesTitle: 'Game Rules',
    rule1: 'Roll the dice to randomly select a country',
    rule2: 'Click on the map where you think the country is located',
    rule3: 'Earn points based on accuracy',
    rule4: 'Use hints if you need help (costs 1 point)',
    
    // Scoring
    scoringTitle: 'Scoring System',
    pointsCorrect: '3 Points - Correct Answer',
    pointsClose: '2 Points - Close Answer (minor typo)',
    pointsHint: '-1 Point - Using a hint',
    pointsSkip: '0 Points - Skip',
    
    // Game Settings
    createSession: 'Create Session',
    joinSession: 'Join Session',
    sessionCode: 'Session Code',
    enterCode: 'Enter 6-digit code',
    participants: 'Number of Players',
    gameDuration: 'Game Duration',
    minutes: 'minutes',
    confirm: 'Confirm',
    cancel: 'Cancel',
    
    // Waiting Room
    waitingRoom: 'Waiting Room',
    waitingForPlayers: 'Waiting for players...',
    playersJoined: 'Players Joined',
    shareCode: 'Share this code with friends',
    readyToStart: 'Ready to Start?',
    voteYes: 'Vote Yes',
    startGame2: 'Start Game',
    timeRemaining: 'Time Remaining',
    
    // Gameplay
    yourTurn: "It's Your Turn!",
    waitingTurn: 'Waiting for {player} to play...',
    rollDice: 'Roll Dice',
    guessCountry: 'Guess the Country',
    enterGuess: 'Enter your guess...',
    submit: 'Submit',
    skip: 'Skip',
    useHint: 'Use Hint (-1 pt)',
    famousPerson: 'Famous Person (-1 pt)',
    revealLetter: 'Reveal Letter',
    currentScore: 'Current Score',
    timeLeft: 'Time Left',
    rollComplete: 'Dice rolled! Click the country you think it is!',
    clickCountryToGuess: 'Click on the map to make your guess',
    nextPlayerTurn: "{player}'s turn now!",
    timeUp: "Time's up! Moving to next player...",
    points: 'points',
    turnSkipped: 'Turn skipped',
    hintUsed: 'Hint used: -1 point',
    
    // Map Controls
    recenter: 'Recenter Map',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    focusContinent: 'Focus Continent',
    
    // Leaderboard
    leaderboard: 'Leaderboard',
    rank: 'Rank',
    player: 'Player',
    score: 'Score',
    countriesGuessed: 'Countries',
    
    // Results
    gameOver: 'Game Over!',
    finalResults: 'Final Results',
    winner: 'Winner',
    playAgain: 'Play Again',
    backToHome: 'Back to Home',
    
    // Profile
    profile: 'Profile',
    editProfile: 'Edit Profile',
    gameHistory: 'Game History',
    statistics: 'Statistics',
    achievements: 'Achievements',
    totalGames: 'Total Games',
    winRate: 'Win Rate',
    avgScore: 'Average Score',
    selectAvatar: 'Select Avatar',
    selectColor: 'Select Color',
    save: 'Save',
    
    // Notifications
    playerJoined: '{player} joined the session',
    playerLeft: '{player} left the session',
    correctGuess: '{player} guessed correctly! +{points} points',
    wrongGuess: '{player} guessed wrong',
    skipped: '{player} skipped',
    usedHint: '{player} used a hint',
    gameStarting: 'Game is starting!',
    sessionCreated: 'Session created! Code: {code}',
    
    // Errors
    invalidCode: 'Invalid session code',
    sessionFull: 'Session is full',
    sessionStarted: 'Session has already started',
    networkError: 'Network error. Please try again.',
    authRequired: 'Please sign in to continue',
    invalidCredentials: 'Invalid email or password',
    emailExists: 'Email already registered',
    
    // Tooltips
    tooltipDice: 'Roll to select a random country',
    tooltipRecenter: 'Reset map to full view',
    tooltipContinent: 'Zoom to the continent of selected country',
    tooltipLeaderboard: 'View current rankings',
    tooltipHint: 'Reveal first letter (costs 1 point)',
    tooltipFamousPerson: 'Show a famous person from this country (costs 1 point)',
    tooltipSkip: 'Skip this turn (0 points)',
    tooltipSubmit: 'Submit your answer',
    tooltipQuit: 'Leave the current game',
    
    // Misc
    loading: 'Loading...',
    or: 'or',
    close: 'Close',
    quitGame: 'Quit Game',
    confirmQuit: 'Are you sure you want to quit?',
    yes: 'Yes',
    no: 'No',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
  },
  
  fr: {
    // Navigation & Branding
    appName: 'Quiz Mondial',
    logo: 'Quiz Mondial',
    
    // Auth
    signIn: 'Se Connecter',
    signUp: "S'inscrire",
    signOut: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    username: "Nom d'utilisateur",
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: "Pas encore de compte ?",
    hasAccount: 'Déjà un compte ?',
    createAccount: 'Créer un compte',
    welcomeBack: 'Bon retour',
    joinUs: "Rejoignez l'aventure",
    
    // Landing Page
    heroTitle: 'Testez Vos Connaissances',
    heroSubtitle: 'Défiez vos amis en géographie en temps réel',
    startGame: 'Commencer',
    howToPlay: 'Comment Jouer',
    learnMore: 'En savoir plus',
    
    // Rules
    rulesTitle: 'Règles du Jeu',
    rule1: 'Lancez le dé pour sélectionner un pays au hasard',
    rule2: 'Cliquez sur la carte où vous pensez que le pays se trouve',
    rule3: 'Gagnez des points selon votre précision',
    rule4: "Utilisez des indices si besoin (coûte 1 point)",
    
    // Scoring
    scoringTitle: 'Système de Points',
    pointsCorrect: '3 Points - Réponse correcte',
    pointsClose: '2 Points - Réponse proche (petite faute)',
    pointsHint: "-1 Point - Utilisation d'un indice",
    pointsSkip: '0 Points - Passer',
    
    // Game Settings
    createSession: 'Créer une Session',
    joinSession: 'Rejoindre une Session',
    sessionCode: 'Code de Session',
    enterCode: 'Entrez le code à 6 chiffres',
    participants: 'Nombre de Joueurs',
    gameDuration: 'Durée de la Partie',
    minutes: 'minutes',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    
    // Waiting Room
    waitingRoom: "Salle d'Attente",
    waitingForPlayers: 'En attente de joueurs...',
    playersJoined: 'Joueurs Connectés',
    shareCode: 'Partagez ce code avec vos amis',
    readyToStart: 'Prêt à Commencer ?',
    voteYes: 'Voter Oui',
    startGame2: 'Démarrer la Partie',
    timeRemaining: 'Temps Restant',
    
    // Gameplay
    yourTurn: "C'est Votre Tour !",
    waitingTurn: 'En attente de {player}...',
    rollDice: 'Lancer le Dé',
    guessCountry: 'Devinez le Pays',
    enterGuess: 'Entrez votre réponse...',
    submit: 'Valider',
    skip: 'Passer',
    useHint: 'Indice (-1 pt)',
    famousPerson: 'Personnalité (-1 pt)',
    revealLetter: 'Révéler une lettre',
    currentScore: 'Score Actuel',
    timeLeft: 'Temps Restant',
    rollComplete: 'Dé lancé ! Cliquez sur le pays que vous pensez être !',
    clickCountryToGuess: 'Cliquez sur la carte pour deviner',
    nextPlayerTurn: "C'est au tour de {player} !",
    timeUp: "Temps écoulé ! Passage au joueur suivant...",
    points: 'points',
    turnSkipped: 'Tour passé',
    hintUsed: 'Indice utilisé : -1 point',
    
    // Map Controls
    recenter: 'Recentrer la Carte',
    zoomIn: 'Zoom Avant',
    zoomOut: 'Zoom Arrière',
    focusContinent: 'Focus Continent',
    
    // Leaderboard
    leaderboard: 'Classement',
    rank: 'Rang',
    player: 'Joueur',
    score: 'Score',
    countriesGuessed: 'Pays',
    
    // Results
    gameOver: 'Fin de Partie !',
    finalResults: 'Résultats Finaux',
    winner: 'Gagnant',
    playAgain: 'Rejouer',
    backToHome: "Retour à l'Accueil",
    
    // Profile
    profile: 'Profil',
    editProfile: 'Modifier le Profil',
    gameHistory: 'Historique des Parties',
    statistics: 'Statistiques',
    achievements: 'Succès',
    totalGames: 'Total de Parties',
    winRate: 'Taux de Victoire',
    avgScore: 'Score Moyen',
    selectAvatar: 'Choisir un Avatar',
    selectColor: 'Choisir une Couleur',
    save: 'Sauvegarder',
    
    // Notifications
    playerJoined: '{player} a rejoint la session',
    playerLeft: '{player} a quitté la session',
    correctGuess: '{player} a bien deviné ! +{points} points',
    wrongGuess: '{player} s\'est trompé',
    skipped: '{player} a passé',
    usedHint: '{player} a utilisé un indice',
    gameStarting: 'La partie commence !',
    sessionCreated: 'Session créée ! Code: {code}',
    
    // Errors
    invalidCode: 'Code de session invalide',
    sessionFull: 'La session est complète',
    sessionStarted: 'La session a déjà commencé',
    networkError: 'Erreur réseau. Veuillez réessayer.',
    authRequired: 'Veuillez vous connecter pour continuer',
    invalidCredentials: 'Email ou mot de passe invalide',
    emailExists: 'Email déjà enregistré',
    
    // Tooltips
    tooltipDice: 'Lancez pour sélectionner un pays au hasard',
    tooltipRecenter: 'Réinitialiser la vue de la carte',
    tooltipContinent: 'Zoomer sur le continent du pays sélectionné',
    tooltipLeaderboard: 'Voir le classement actuel',
    tooltipHint: 'Révéler la première lettre (coûte 1 point)',
    tooltipFamousPerson: 'Montrer une personnalité de ce pays (coûte 1 point)',
    tooltipSkip: 'Passer ce tour (0 points)',
    tooltipSubmit: 'Valider votre réponse',
    tooltipQuit: 'Quitter la partie en cours',
    
    // Misc
    loading: 'Chargement...',
    or: 'ou',
    close: 'Fermer',
    quitGame: 'Quitter la Partie',
    confirmQuit: 'Êtes-vous sûr de vouloir quitter ?',
    yes: 'Oui',
    no: 'Non',
    soundOn: 'Son Activé',
    soundOff: 'Son Désactivé',
  },
  
  ar: {
    // Navigation & Branding
    appName: 'مسابقة العالم',
    logo: 'مسابقة العالم',
    
    // Auth
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    username: 'اسم المستخدم',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    createAccount: 'إنشاء حساب',
    welcomeBack: 'مرحباً بعودتك',
    joinUs: 'انضم إلى المغامرة',
    
    // Landing Page
    heroTitle: 'اختبر معرفتك بالعالم',
    heroSubtitle: 'تحدى أصدقاءك في معارك جغرافية مباشرة',
    startGame: 'ابدأ اللعبة',
    howToPlay: 'كيف تلعب',
    learnMore: 'اعرف المزيد',
    
    // Rules
    rulesTitle: 'قواعد اللعبة',
    rule1: 'ارمِ النرد لاختيار دولة عشوائية',
    rule2: 'انقر على الخريطة حيث تعتقد أن الدولة موجودة',
    rule3: 'اكسب نقاطاً بناءً على الدقة',
    rule4: 'استخدم التلميحات إذا احتجت المساعدة (تكلف نقطة واحدة)',
    
    // Scoring
    scoringTitle: 'نظام النقاط',
    pointsCorrect: '3 نقاط - إجابة صحيحة',
    pointsClose: '2 نقاط - إجابة قريبة (خطأ بسيط)',
    pointsHint: '-1 نقطة - استخدام تلميح',
    pointsSkip: '0 نقاط - تخطي',
    
    // Game Settings
    createSession: 'إنشاء جلسة',
    joinSession: 'الانضمام لجلسة',
    sessionCode: 'رمز الجلسة',
    enterCode: 'أدخل الرمز المكون من 6 أرقام',
    participants: 'عدد اللاعبين',
    gameDuration: 'مدة اللعبة',
    minutes: 'دقائق',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    
    // Waiting Room
    waitingRoom: 'غرفة الانتظار',
    waitingForPlayers: 'في انتظار اللاعبين...',
    playersJoined: 'اللاعبون المنضمون',
    shareCode: 'شارك هذا الرمز مع أصدقائك',
    readyToStart: 'مستعد للبدء؟',
    voteYes: 'صوت بنعم',
    startGame2: 'ابدأ اللعبة',
    timeRemaining: 'الوقت المتبقي',
    
    // Gameplay
    yourTurn: 'دورك!',
    waitingTurn: 'في انتظار {player}...',
    rollDice: 'ارمِ النرد',
    guessCountry: 'خمّن الدولة',
    enterGuess: 'أدخل تخمينك...',
    submit: 'إرسال',
    skip: 'تخطي',
    useHint: 'تلميح (-1 نقطة)',
    famousPerson: 'شخصية مشهورة (-1 نقطة)',
    revealLetter: 'كشف حرف',
    currentScore: 'النتيجة الحالية',
    timeLeft: 'الوقت المتبقي',
    rollComplete: 'تم رمي النرد! انقر على الدولة التي تعتقد أنها!',
    clickCountryToGuess: 'انقر على الخريطة للتخمين',
    nextPlayerTurn: 'دور {player} الآن!',
    timeUp: 'انتهى الوقت! الانتقال للاعب التالي...',
    points: 'نقاط',
    turnSkipped: 'تم تخطي الدور',
    hintUsed: 'تم استخدام التلميح: -1 نقطة',
    
    // Map Controls
    recenter: 'إعادة توسيط الخريطة',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    focusContinent: 'التركيز على القارة',
    
    // Leaderboard
    leaderboard: 'لوحة المتصدرين',
    rank: 'الترتيب',
    player: 'اللاعب',
    score: 'النتيجة',
    countriesGuessed: 'الدول',
    
    // Results
    gameOver: 'انتهت اللعبة!',
    finalResults: 'النتائج النهائية',
    winner: 'الفائز',
    playAgain: 'العب مرة أخرى',
    backToHome: 'العودة للرئيسية',
    
    // Profile
    profile: 'الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    gameHistory: 'سجل الألعاب',
    statistics: 'الإحصائيات',
    achievements: 'الإنجازات',
    totalGames: 'إجمالي الألعاب',
    winRate: 'معدل الفوز',
    avgScore: 'متوسط النقاط',
    selectAvatar: 'اختر صورة رمزية',
    selectColor: 'اختر لوناً',
    save: 'حفظ',
    
    // Notifications
    playerJoined: 'انضم {player} إلى الجلسة',
    playerLeft: 'غادر {player} الجلسة',
    correctGuess: 'أجاب {player} بشكل صحيح! +{points} نقاط',
    wrongGuess: 'أخطأ {player}',
    skipped: 'تخطى {player}',
    usedHint: 'استخدم {player} تلميحاً',
    gameStarting: 'اللعبة تبدأ!',
    sessionCreated: 'تم إنشاء الجلسة! الرمز: {code}',
    
    // Errors
    invalidCode: 'رمز الجلسة غير صالح',
    sessionFull: 'الجلسة ممتلئة',
    sessionStarted: 'الجلسة بدأت بالفعل',
    networkError: 'خطأ في الشبكة. حاول مرة أخرى.',
    authRequired: 'يرجى تسجيل الدخول للمتابعة',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    emailExists: 'البريد الإلكتروني مسجل بالفعل',
    
    // Tooltips
    tooltipDice: 'ارمِ لاختيار دولة عشوائية',
    tooltipRecenter: 'إعادة ضبط عرض الخريطة',
    tooltipContinent: 'تكبير على قارة الدولة المحددة',
    tooltipLeaderboard: 'عرض الترتيب الحالي',
    tooltipHint: 'كشف الحرف الأول (تكلف نقطة)',
    tooltipFamousPerson: 'إظهار شخصية مشهورة من هذه الدولة (تكلف نقطة)',
    tooltipSkip: 'تخطي هذا الدور (0 نقاط)',
    tooltipSubmit: 'إرسال إجابتك',
    tooltipQuit: 'مغادرة اللعبة الحالية',
    
    // Misc
    loading: 'جاري التحميل...',
    or: 'أو',
    close: 'إغلاق',
    quitGame: 'مغادرة اللعبة',
    confirmQuit: 'هل أنت متأكد من المغادرة؟',
    yes: 'نعم',
    no: 'لا',
    soundOn: 'الصوت مفعّل',
    soundOff: 'الصوت مغلق',
  },
};

export type TranslationKey = keyof typeof translations.en;
