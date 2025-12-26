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
    rulesSubtitle: 'Master the game in 4 simple steps',
    ruleStep1Title: 'Roll the Dice',
    ruleStep1Desc: 'Start your turn by rolling the dice to get a random country from around the world.',
    ruleStep2Title: 'Identify the Highlight',
    ruleStep2Desc: 'Look at the map to see which country is highlighted, then click it to enter its name.',
    ruleStep3Title: 'Earn Points',
    ruleStep3Desc: 'Get 3 points for correct answers, 2 for nearby countries. Wrong guesses earn nothing!',
    ruleStep4Title: 'Use Hints Wisely',
    ruleStep4Desc: 'Stuck? Use a hint for help, but it costs 1 point. Strategy matters!',

    // Scoring
    scoringTitle: 'Scoring System',
    scoringSubtitle: 'Every point counts towards victory',
    pointsCorrect: 'Correct Answer',
    pointsCorrectDesc: 'You nailed it! Full points awarded.',
    pointsClose: 'Close Answer',
    pointsCloseDesc: 'Almost there! Minor typo or small mistake.',
    pointsHint: 'Used Hint',
    pointsHintDesc: 'Each hint you use costs 1 point.',
    pointsSkip: 'Skip / Wrong Answer',
    pointsSkipDesc: 'No points. Try next one!',

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

    // Features Section
    featureMultiplayer: 'Multiplayer',
    featureMultiplayerDesc: 'Challenge 2-4 friends in real-time geography battles',
    featureInteractiveMap: 'Interactive Map',
    featureInteractiveMapDesc: 'Click, zoom, and explore the world map to find countries',
    featureLeaderboard: 'Leaderboard',
    featureLeaderboardDesc: 'Track your progress and compete for the top spot',

    // CTA Section
    ctaTitle: 'Ready to Test Your Knowledge?',
    ctaSubtitle: 'Join thousands of players from around the world in the ultimate geography challenge.',

    // Footer
    footerText: '© 2024 World Quiz. Test your geography knowledge.',

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
    duplicateJoinError: 'You are already in this session',
    lonePlayerTitle: "You're All Alone!",
    lonePlayerDesc: 'The other players have left. This session will be closed. Please quit to join a new one.',
    waitForOthers: 'Wait for Players',
    fairnessTitle: 'Extra Time for Fairness',
    fairnessDesc: 'Time is up! To keep the game fair, remaining players have one last suggestion so everyone plays the same number of turns.',
    sessionConflictTitle: 'Session Conflict',
    sessionConflictDesc: 'You have been disconnected because your account is active in another tab or device.',
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
    rulesSubtitle: 'Maîtrisez le jeu en 4 étapes simples',
    ruleStep1Title: 'Lancez le Dé',
    ruleStep1Desc: 'Commencez votre tour en lançant le dé pour obtenir un pays aléatoire du monde entier.',
    ruleStep2Title: 'Identifiez le Pays',
    ruleStep2Desc: 'Regardez la carte pour voir quel pays est mis en évidence, puis cliquez dessus pour entrer son nom.',
    ruleStep3Title: 'Gagnez des Points',
    ruleStep3Desc: 'Obtenez 3 points pour les bonnes réponses, 2 pour les pays proches. Les mauvaises réponses ne rapportent rien !',
    ruleStep4Title: 'Utilisez les Indices avec Sagesse',
    ruleStep4Desc: "Bloqué ? Utilisez un indice pour de l'aide, mais ça coûte 1 point. La stratégie compte !",

    // Scoring
    scoringTitle: 'Système de Points',
    scoringSubtitle: 'Chaque point compte pour la victoire',
    pointsCorrect: 'Réponse Correcte',
    pointsCorrectDesc: 'Bravo ! Points complets attribués.',
    pointsClose: 'Réponse Proche',
    pointsCloseDesc: 'Presque ! Petite faute ou erreur mineure.',
    pointsHint: 'Indice Utilisé',
    pointsHintDesc: 'Chaque indice utilisé coûte 1 point.',
    pointsSkip: 'Passer / Mauvaise Réponse',
    pointsSkipDesc: 'Pas de points. Essayez le suivant !',

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

    // Features Section
    featureMultiplayer: 'Multijoueur',
    featureMultiplayerDesc: 'Défiez 2-4 amis en batailles de géographie en temps réel',
    featureInteractiveMap: 'Carte Interactive',
    featureInteractiveMapDesc: 'Cliquez, zoomez et explorez la carte du monde pour trouver les pays',
    featureLeaderboard: 'Classement',
    featureLeaderboardDesc: 'Suivez votre progression et visez la première place',

    // CTA Section
    ctaTitle: 'Prêt à Tester Vos Connaissances ?',
    ctaSubtitle: 'Rejoignez des milliers de joueurs du monde entier dans le défi ultime de géographie.',

    // Footer
    footerText: '© 2024 Quiz Mondial. Testez vos connaissances en géographie.',

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
    duplicateJoinError: 'Vous êtes déjà dans cette session',
    lonePlayerTitle: 'Vous êtes seul !',
    lonePlayerDesc: 'Les autres joueurs sont partis. Cette session va être fermée. Veuillez quitter pour en rejoindre une nouvelle.',
    waitForOthers: 'Attendre des joueurs',
    fairnessTitle: 'Temps additionnel pour l\'équité',
    fairnessDesc: 'Le temps est écoulé ! Pour garantir l\'équité, les autres joueurs ont une dernière suggestion afin que tout le monde joue le même nombre de tours.',
    sessionConflictTitle: 'Conflit de session',
    sessionConflictDesc: 'Vous avez été déconnecté car votre compte est actif dans un autre onglet ou appareil.',
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
    rulesSubtitle: 'أتقن اللعبة في 4 خطوات بسيطة',
    ruleStep1Title: 'ارمِ النرد',
    ruleStep1Desc: 'ابدأ دورك برمي النرد للحصول على دولة عشوائية من حول العالم.',
    ruleStep2Title: 'ضع تخمينك',
    ruleStep2Desc: 'انقر على خريطة العالم للعثور على الدولة التي تعتقد أنها صحيحة واختيارها.',
    ruleStep3Title: 'اكسب النقاط',
    ruleStep3Desc: 'احصل على 3 نقاط للإجابات الصحيحة، 2 للدول القريبة. التخمينات الخاطئة لا تكسب شيئاً!',
    ruleStep4Title: 'استخدم التلميحات بحكمة',
    ruleStep4Desc: 'عالق؟ استخدم تلميحاً للمساعدة، لكنه يكلف نقطة واحدة. الاستراتيجية مهمة!',

    // Scoring
    scoringTitle: 'نظام النقاط',
    scoringSubtitle: 'كل نقطة تحسب نحو الفوز',
    pointsCorrect: 'إجابة صحيحة',
    pointsCorrectDesc: 'أحسنت! نقاط كاملة.',
    pointsClose: 'إجابة قريبة',
    pointsCloseDesc: 'قريب جداً! خطأ بسيط أو صغير.',
    pointsHint: 'استخدام تلميح',
    pointsHintDesc: 'كل تلميح تستخدمه يكلف نقطة واحدة.',
    pointsSkip: 'تخطي / إجابة خاطئة',
    pointsSkipDesc: 'لا نقاط. جرب التالي!',

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

    // Features Section
    featureMultiplayer: 'متعدد اللاعبين',
    featureMultiplayerDesc: 'تحدى 2-4 أصدقاء في معارك جغرافية مباشرة',
    featureInteractiveMap: 'خريطة تفاعلية',
    featureInteractiveMapDesc: 'انقر وكبّر واستكشف خريطة العالم للعثور على الدول',
    featureLeaderboard: 'لوحة المتصدرين',
    featureLeaderboardDesc: 'تتبع تقدمك وتنافس على المركز الأول',

    // CTA Section
    ctaTitle: 'مستعد لاختبار معرفتك؟',
    ctaSubtitle: 'انضم إلى آلاف اللاعبين من حول العالم في تحدي الجغرافيا النهائي.',

    // Footer
    footerText: '© 2024 مسابقة العالم. اختبر معرفتك الجغرافية.',

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
    duplicateJoinError: 'أنت موجود بالفعل في هذه الجلسة',
    lonePlayerTitle: 'أنت وحيد هنا!',
    lonePlayerDesc: 'غادر اللاعبون الآخرون. سيتم إغلاق هذه الجلسة. يرجى المغادرة للانضمام إلى جلسة جديدة.',
    waitForOthers: 'انتظار الآخرين',
    fairnessTitle: 'وقت إضافي من أجل العدالة',
    fairnessDesc: 'انتهى الوقت! لضمان عدالة اللعبة، لدى اللاعبين المتبقين اقتراح أخير حتى يلعب الجميع نفس عدد الأدوار.',
    sessionConflictTitle: 'تعارض في الجلسة',
    sessionConflictDesc: 'لقد تم فصلك لأن حسابك نشط في علامة تبويب أو جهاز آخر.',
  },
};

export type TranslationKey = keyof typeof translations.en;
