export const categories = [
  { id: 'all', label: 'Tout' },
  { id: 'valorant', label: 'Valorant' },
  { id: 'lol', label: 'League of Legends' },
  { id: 'fc26', label: 'FC 26 Coins' },
  { id: 'fc27', label: 'FC 27' },
  { id: 'pubg', label: 'PUBG' },
  { id: 'warzone', label: 'Warzone' },
  { id: 'r6', label: 'Rainbow Six' },
  { id: 'roblox', label: 'Roblox' },
  { id: 'freefire', label: 'Free Fire' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'battlenet', label: 'Battle.net' },
  { id: 'steamfresh', label: 'Steam Fresh Account' },
  { id: 'steam-games', label: 'Steam Games' },
  { id: 'battlenet-games', label: 'Battle.net Games' },
  { id: 'xbox-games', label: 'Xbox Games' },
  { id: 'ps5-games', label: 'PS5 Games' },
  { id: 'ai-tools', label: 'AI Tools' },
  { id: 'other', label: 'Autres' },
]

// Menus navigation (style top-up store) : menu -> IDs produits.
// Les menus vides sont masqués auto. Envoie-moi la répartition exacte et je l'ajuste.
export const MENUS = [
  { id: 'topup', icon: 'Gamepad2', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Top-Up Games', en: 'Top-Up Games', ar: 'شحن الألعاب' }, products: [] },
  { id: 'login', icon: 'KeyRound', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Login Games', en: 'Login Games', ar: 'ألعاب الدخول' }, products: ['fc27-pc', 'fc27-ps5'] },
  { id: 'accounts', icon: 'User', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Accounts', en: 'Accounts', ar: 'حسابات' }, products: [] },
  { id: 'giftcards', icon: 'Gift', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Gift Cards', en: 'Gift Cards', ar: 'بطاقات الهدايا' }, products: ['val-1', 'pubg-1', 'ff-1', 'wz-1', 'r6-1', 'fc26-1', 'lol-1', 'steam-1', 'roblox-1', 'bnet-1', 'psn-1', 'xbox-1'] },
  { id: 'steamfresh', icon: 'Sparkles', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Steam Fresh Account', en: 'Steam Fresh Account', ar: 'حسابات ستيم جديدة' }, products: ['sf-fc27'] },
  { id: 'steam', icon: 'Monitor', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Steam Wallet Euro', en: 'Steam Wallet Euro', ar: 'Steam Wallet Euro' }, products: ['steam-1', 'stm-usd'] },
  { id: 'subs', icon: 'Crown', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Subscriptions', en: 'Subscriptions', ar: 'اشتراكات' }, products: ['netflix-1'] },
  { id: 'ai-tools', icon: 'Sparkles', chip: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200', label: { fr: 'AI Tools', en: 'AI Tools', ar: 'أدوات الذكاء الاصطناعي' }, products: ['gemini-pro-18m', 'capcut-pro-1m'] },
  { id: 'games', icon: 'Gamepad2', chip: 'bg-violet-500/10 border-violet-500/20 text-violet-200', label: { fr: 'Games', en: 'Games', ar: 'ألعاب' }, products: [], children: ['steam-games', 'battlenet-games', 'xbox-games', 'ps5-games'] },
]

export const initialProducts = [
  {
    id: 'val-1', category: 'valorant', name: 'Valorant Points', subtitle: 'VP • Livraison instantanée',
    image: 'https://images.g2a.com/300x400/1x1x1/valorant-gift-card-10-usd-riot-key-latam-i10000206410010/6a355b9399534a69b7985242',
    badge: 'HOT', description: 'Recharge ton compte Valorant en quelques secondes. Code officiel Riot. Carte EU.',
    variants: [
      { id: 'val-eu10', label: 'Carte 10€', price: 38.00 },
      { id: 'val-eu15', label: 'Carte 15€', price: 60.00 },
      { id: 'val-eu20', label: 'Carte 20€', price: 77.00 },
      { id: 'val-eu25', label: 'Carte 25€', price: 96.00 },
      { id: 'val-eu35', label: 'Carte 35€', price: 135.00 },
      { id: 'val-eu50', label: 'Carte 50€', price: 197.00 },
    ],
    stock: 124, rating: 4.9
  },
  {
    id: 'lol-1', category: 'lol', name: 'League of Legends RP', subtitle: 'Cartes € • Europe',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNztnpwTexsNw2a58jD4GD3VukhzYqPHAouBNgep7nzA&s=10',
    badge: 'BEST SELLER', description: 'Débloque skins, champions et chromas. Code valable Europe.',
    variants: [
      { id: 'lol-eu10', label: 'Carte 10€', price: 38.00 },
      { id: 'lol-eu15', label: 'Carte 15€', price: 59.00 },
      { id: 'lol-eu20', label: 'Carte 20€', price: 78.00 },
      { id: 'lol-eu25', label: 'Carte 25€', price: 96.00 },
      { id: 'lol-eu35', label: 'Carte 35€', price: 135.00 },
      { id: 'lol-eu50', label: 'Carte 50€', price: 195.00 },
      { id: 'lol-eu100', label: 'Carte 100€', price: 380.00 },
    ],
    stock: 89, rating: 4.8
  },
  {
    id: 'fc26-1', category: 'fc26', name: 'FC 26 Coins Ultimate Team', subtitle: 'Livraison 5-15 min • PS / Xbox / PC',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhPfUeZMBSqKcCZINmj7HGMN4nDmh3OVPLURigP-u5bg&s=10',
    badge: 'NEW', description: 'Coins pour FC 26 UT. Méthode sécurisée Player Auction, garantie anti-ban.',
    variants: [
      { id: 'fc-50k', label: '50K Coins', price: 9.99 },
      { id: 'fc-100k', label: '100K Coins', price: 18.99 },
      { id: 'fc-300k', label: '300K Coins', price: 49.99 },
      { id: 'fc-700k', label: '700K Coins', price: 104.99 },
      { id: 'fc-1m', label: '1M Coins', price: 139.99 },
    ],
    stock: 42, rating: 4.7
  },
  {
    id: 'fc27-pc', category: 'fc27', name: 'FC 27 PC – Steam Full Access', subtitle: 'Compte complet • Version PC',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhc6Hl7O2D2ZMM5mGE1Ou40bK_4_xPxWdJW8VsQ7faUHqHInv68ByFjCMH&s=10',
    badge: 'NEW', description: 'Compte Steam FC 27 version PC en plein accès : email et mot de passe modifiables, jeu à vie. Livraison 5-30 min avec identifiants + guide d’activation.',
    variants: [
      { id: 'fc27-pc-std', label: 'Standard Edition – Full Access', price: 130.00 },
      { id: 'fc27-pc-ult', label: 'Ultimate Edition – Full Access', price: 240.00 },
    ],
    stock: 25, rating: 5.0
  },
  {
    id: 'fc27-ps5', category: 'fc27', name: 'FC 27 PS5 – PSN', subtitle: 'Compte complet • Version PS5',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHFwBgEcKi_xb22H3SlkrPBNlUjsOwHxCey-epDjbKyQ&s=10',
    badge: 'NEW', description: 'FC 27 version PS5 (compte PSN) : Standard ou Ultimate, accès complet. Livraison 5-30 min avec identifiants + guide d’activation.',
    variants: [
      { id: 'fc27-ps5-std', label: 'Standard Edition – PSN', price: 240.00 },
      { id: 'fc27-ps5-ult', label: 'Ultimate Edition – PSN', price: 340.00 },
    ],
    stock: 20, rating: 5.0
  },
  {
    id: 'pubg-1', category: 'pubg', name: 'PUBG Mobile UC', subtitle: 'Unknown Cash',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2k0Xlx3K5dZvgyfn4R20bh_OFVCv93xOJkyMmx-g-Zg&s=10',
    badge: null, description: 'UC pour PUBG Mobile. Compatible Global. ID joueur requis à la livraison pour méthode directe, ou code.',
    variants: [
      { id: 'pubg-60', label: '60 UC', price: 0.99 },
      { id: 'pubg-325', label: '325 UC', price: 4.99 },
      { id: 'pubg-660', label: '660 UC', price: 9.99 },
      { id: 'pubg-1800', label: '1800 UC', price: 24.99 },
      { id: 'pubg-3850', label: '3850 UC', price: 49.99 },
    ],
    stock: 210, rating: 4.8
  },
  {
    id: 'wz-1', category: 'warzone', name: 'Warzone COD Points', subtitle: 'CP • Toutes plateformes',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZyqv8ihFLqe-huGX1idY3forMuHcN39UzhSDqVNCQ4g&s=10',
    badge: 'HOT', description: 'COD Points pour Warzone / Modern Warfare. Débloque Battle Pass, skins et bundles. Livraison instantanée.',
    variants: [
      { id: 'wz-500', label: '500 CP', price: 19.00 },
      { id: 'wz-1100', label: '1100 CP', price: 38.00 },
      { id: 'wz-2400', label: '2400 CP', price: 75.00 },
      { id: 'wz-5000', label: '5000 CP', price: 145.00 },
    ],
    stock: 78, rating: 4.8
  },
  {
    id: 'r6-1', category: 'r6', name: 'Rainbow Six Credits', subtitle: 'R6 Credits • Ubisoft',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBN2ACWqqVPyzbeCQUHPa9BmoN5rgkkccXtbNxOohIYg&s',
    badge: 'NEW', description: 'Crédits R6 pour Rainbow Six Siege. Opérateurs élite, skins et Battle Pass. Code Ubisoft.',
    variants: [
      { id: 'r6-600', label: '600 Credits', price: 18.00 },
      { id: 'r6-1200', label: '1200 Credits', price: 35.00 },
      { id: 'r6-2670', label: '2670 Credits', price: 72.00 },
      { id: 'r6-4920', label: '4920 Credits', price: 125.00 },
    ],
    stock: 54, rating: 4.7
  },
  {
    id: 'roblox-1', category: 'roblox', name: 'Roblox Gift Card', subtitle: 'Robux & Premium',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyCcKCRn3kSwAHeU7aumRfEv7QvfvG639Rn5HkcsNUiA&s=10',
    badge: null, description: 'Carte Roblox officielle. Échangeable en Robux ou abonnement Premium.',
    variants: [
      { id: 'rbx-eu10', label: 'Roblox 10€', price: 40.00 },
      { id: 'rbx-eu20', label: 'Roblox 20€', price: 78.00 },
    ],
    stock: 67, rating: 4.9
  },
  {
    id: 'ff-1', category: 'freefire', name: 'Free Fire Diamonds', subtitle: 'Garena • Instantané',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd5HuED_JGEoLag7MWcOoH5IXb-RT85bqifrp5p71oBQ&s=10',
    badge: 'PROMO', description: 'Diamants Free Fire. Livraison par ID ou code.',
    variants: [
      { id: 'ff-100', label: '100 Diamonds', price: 5.00 },
      { id: 'ff-210', label: '210 Diamonds', price: 10.00 },
      { id: 'ff-520', label: '520 Diamonds', price: 21.00 },
      { id: 'ff-1080', label: '1080 Diamonds', price: 42.00 },
      { id: 'ff-2200', label: '2200 Diamonds', price: 80.00 },
    ],
    stock: 150, rating: 4.6
  },
  {
    id: 'netflix-1', category: 'netflix', name: 'Netflix E-Card', subtitle: 'Abonnement Prépayé',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80&auto=format&fit=crop',
    badge: null, description: 'Carte Netflix France. Compatible Essentiel, Standard et Premium. Durée selon formule.',
    variants: [
      { id: 'nfx-25', label: '25 TND', price: 25.00 },
      { id: 'nfx-50', label: '50 TND', price: 50.00 },
      { id: 'nfx-100', label: '100 TND', price: 100.00 },
    ],
    stock: 33, rating: 4.8
  },
  {
    id: 'psn-1', category: 'other', name: 'PlayStation Store Card', subtitle: 'PSN Wallet FR',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&q=80&auto=format&fit=crop',
    badge: null, description: 'Recharge portefeuille PSN. Jeux, add-ons, PS Plus.',
    variants: [
      { id: 'psn-eu10', label: 'Carte 10€', price: 42.00 },
      { id: 'psn-eu20', label: 'Carte 20€', price: 82.00 },
      { id: 'psn-eu25', label: 'Carte 25€', price: 105.00 },
      { id: 'psn-eu50', label: 'Carte 50€', price: 202.00 },
      { id: 'psn-eu100', label: 'Carte 100€', price: 398.00 },
    ],
    stock: 55, rating: 4.9
  },
  {
    id: 'xbox-1', category: 'other', name: 'Xbox Gift Card', subtitle: 'Microsoft Store',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdUTxVzAMksOUL5_nc1gzb-P20RB_y8e27POgEpdp2LQ&s',
    badge: null, description: 'Pour Game Pass, jeux et contenus Xbox & PC.',
    variants: [
      { id: 'xbx-eu10', label: 'Carte 10€', price: 39.00 },
      { id: 'xbx-eu15', label: 'Carte 15€', price: 58.00 },
      { id: 'xbx-eu20', label: 'Carte 20€', price: 75.00 },
      { id: 'xbx-eu25', label: 'Carte 25€', price: 95.00 },
      { id: 'xbx-eu30', label: 'Carte 30€', price: 115.00 },
      { id: 'xbx-eu50', label: 'Carte 50€', price: 190.00 },
      { id: 'xbx-eu100', label: 'Carte 100€', price: 380.00 },
    ],
    stock: 40, rating: 4.7
  },
  {
    id: 'steam-1', category: 'other', name: 'Steam Wallet Euro', subtitle: 'Cartes € • Europe',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBt5pqA1fBJMEFHNDI_MsG9_INeuXR-mb-TOtzdLTcsw&s=10',
    badge: null, description: 'Code Steam Wallet à activer sur votre compte Steam.',
    variants: [
      { id: 'stm-eu10', label: 'Carte 10€', price: 45.00 },
      { id: 'stm-eu15', label: 'Carte 15€', price: 60.00 },
      { id: 'stm-eu20', label: 'Carte 20€', price: 84.00 },
      { id: 'stm-eu25', label: 'Carte 25€', price: 105.00 },
      { id: 'stm-eu35', label: 'Carte 35€', price: 145.00 },
      { id: 'stm-eu50', label: 'Carte 50€', price: 220.00 },
      { id: 'stm-eu100', label: 'Carte 100€', price: 430.00 },
    ],
    stock: 71, rating: 4.9
  },
  {
    id: 'bnet-1', category: 'battlenet', name: 'Battle.net Gift Card', subtitle: 'Cartes € • Europe',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxpXqKxg_9IdZaofj07PB2EW0EOxCkrD3E2J6dX5Rqzw&s=10',
    badge: 'NEW', description: 'Cartes Battle.net Europe pour jeux Blizzard et solde Battle.net.',
    variants: [
      { id: 'bnet-eu20', label: 'Carte 20€', price: 80.00 },
      { id: 'bnet-eu50', label: 'Carte 50€', price: 200.00 },
    ],
    stock: 50, rating: 4.8
  },
  {
    id: 'sf-fc27', category: 'steamfresh', name: 'EA FC 27 — Fresh Account', subtitle: '0H Played • Full Access',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQReH_mDCUQAdNNtUM4zFpCRmDeInuB9-ggZWxMZtkWxQ&s',
    badge: 'NEW', description: 'Compte Steam fresh : 0H Played • Full Access • Can Change Data (email + mot de passe modifiables).',
    variants: [
      { id: 'sf-fc27-std', label: 'Standard Edition', price: 135.00 },
    ],
    stock: 20, rating: 5.0
  },
  {
    id: 'stm-usd', category: 'other', name: 'Steam Wallet Dollars', subtitle: 'Cartes $ • USA',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBt5pqA1fBJMEFHNDI_MsG9_INeuXR-mb-TOtzdLTcsw&s=10',
    badge: null, description: 'Code Steam Wallet USD à activer sur votre compte Steam.',
    variants: [
      { id: 'stm-usd10', label: 'Carte 10$', price: 40.00 },
      { id: 'stm-usd20', label: 'Carte 20$', price: 77.00 },
      { id: 'stm-usd30', label: 'Carte 30$', price: 120.00 },
      { id: 'stm-usd50', label: 'Carte 50$', price: 190.00 },
      { id: 'stm-usd100', label: 'Carte 100$', price: 380.00 },
    ],
    stock: 50, rating: 4.9
  },
  {
    id: 'stmg-1', category: 'steam-games', name: 'GTA V Premium Edition', subtitle: 'Jeu Steam • Clé Europe',
    image: '', badge: null, description: 'Grand Theft Auto V Premium Edition — clé Steam Europe.',
    variants: [{ id: 'stmg-1-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'stmg-2', category: 'steam-games', name: 'Elden Ring', subtitle: 'Jeu Steam • Clé Europe',
    image: '', badge: null, description: 'Elden Ring — clé Steam Europe.',
    variants: [{ id: 'stmg-2-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'stmg-3', category: 'steam-games', name: 'Red Dead Redemption 2', subtitle: 'Jeu Steam • Clé Europe',
    image: '', badge: null, description: 'Red Dead Redemption 2 — clé Steam Europe.',
    variants: [{ id: 'stmg-3-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'stmg-4', category: 'steam-games', name: 'Cyberpunk 2077', subtitle: 'Jeu Steam • Clé Europe',
    image: '', badge: null, description: 'Cyberpunk 2077 — clé Steam Europe.',
    variants: [{ id: 'stmg-4-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'stmg-5', category: 'steam-games', name: "Baldur's Gate 3", subtitle: 'Jeu Steam • Clé Europe',
    image: '', badge: null, description: "Baldur's Gate 3 — clé Steam Europe.",
    variants: [{ id: 'stmg-5-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'stmg-6', category: 'steam-games', name: 'Rust', subtitle: 'Jeu Steam • Clé Europe',
    image: '', badge: null, description: 'Rust — clé Steam Europe.',
    variants: [{ id: 'stmg-6-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'bnetg-1', category: 'battlenet-games', name: 'Diablo IV', subtitle: 'Jeu Battle.net • Europe',
    image: '', badge: null, description: 'Diablo IV — clé Battle.net Europe.',
    variants: [{ id: 'bnetg-1-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'bnetg-2', category: 'battlenet-games', name: 'Diablo II Resurrected', subtitle: 'Jeu Battle.net • Europe',
    image: '', badge: null, description: 'Diablo II Resurrected — clé Battle.net Europe.',
    variants: [{ id: 'bnetg-2-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'bnetg-3', category: 'battlenet-games', name: 'World of Warcraft — 60 jours', subtitle: 'Battle.net • Abonnement',
    image: '', badge: null, description: 'World of Warcraft — 60 jours de jeu, Battle.net Europe.',
    variants: [{ id: 'bnetg-3-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'bnetg-4', category: 'battlenet-games', name: 'Call of Duty: Black Ops 6', subtitle: 'Jeu Battle.net • Europe',
    image: '', badge: null, description: 'Call of Duty: Black Ops 6 — clé Battle.net Europe.',
    variants: [{ id: 'bnetg-4-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'bnetg-5', category: 'battlenet-games', name: 'Overwatch 2 — Pack pièces', subtitle: 'Battle.net • Europe',
    image: '', badge: null, description: 'Overwatch 2 — pack de pièces, Battle.net Europe.',
    variants: [{ id: 'bnetg-5-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'bnetg-6', category: 'battlenet-games', name: 'StarCraft Remastered', subtitle: 'Jeu Battle.net • Europe',
    image: '', badge: null, description: 'StarCraft Remastered — clé Battle.net Europe.',
    variants: [{ id: 'bnetg-6-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'xboxg-1', category: 'xbox-games', name: 'Forza Horizon 5', subtitle: 'Jeu Xbox • Europe',
    image: '', badge: null, description: 'Forza Horizon 5 — clé Xbox Europe.',
    variants: [{ id: 'xboxg-1-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'xboxg-2', category: 'xbox-games', name: 'Starfield', subtitle: 'Jeu Xbox • Europe',
    image: '', badge: null, description: 'Starfield — clé Xbox Europe.',
    variants: [{ id: 'xboxg-2-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'xboxg-3', category: 'xbox-games', name: 'Sea of Thieves', subtitle: 'Jeu Xbox • Europe',
    image: '', badge: null, description: 'Sea of Thieves — clé Xbox Europe.',
    variants: [{ id: 'xboxg-3-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'xboxg-4', category: 'xbox-games', name: 'Halo Infinite — Campagne', subtitle: 'Jeu Xbox • Europe',
    image: '', badge: null, description: 'Halo Infinite Campagne — clé Xbox Europe.',
    variants: [{ id: 'xboxg-4-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'xboxg-5', category: 'xbox-games', name: 'Gears 5', subtitle: 'Jeu Xbox • Europe',
    image: '', badge: null, description: 'Gears 5 — clé Xbox Europe.',
    variants: [{ id: 'xboxg-5-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'xboxg-6', category: 'xbox-games', name: 'Minecraft', subtitle: 'Jeu Xbox • Europe',
    image: '', badge: null, description: 'Minecraft — clé Xbox Europe.',
    variants: [{ id: 'xboxg-6-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'ps5g-1', category: 'ps5-games', name: 'God of War Ragnarök', subtitle: 'Jeu PS5 • Europe',
    image: '', badge: null, description: 'God of War Ragnarök — PS5 Europe.',
    variants: [{ id: 'ps5g-1-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'ps5g-2', category: 'ps5-games', name: "Marvel's Spider-Man 2", subtitle: 'Jeu PS5 • Europe',
    image: '', badge: null, description: "Marvel's Spider-Man 2 — PS5 Europe.",
    variants: [{ id: 'ps5g-2-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'ps5g-3', category: 'ps5-games', name: 'Horizon Forbidden West', subtitle: 'Jeu PS5 • Europe',
    image: '', badge: null, description: 'Horizon Forbidden West — PS5 Europe.',
    variants: [{ id: 'ps5g-3-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'ps5g-4', category: 'ps5-games', name: 'The Last of Us Part II Remastered', subtitle: 'Jeu PS5 • Europe',
    image: '', badge: null, description: 'The Last of Us Part II Remastered — PS5 Europe.',
    variants: [{ id: 'ps5g-4-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'ps5g-5', category: 'ps5-games', name: 'Ghost of Tsushima Director’s Cut', subtitle: 'Jeu PS5 • Europe',
    image: '', badge: null, description: 'Ghost of Tsushima Director’s Cut — PS5 Europe.',
    variants: [{ id: 'ps5g-5-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'ps5g-6', category: 'ps5-games', name: 'Gran Turismo 7', subtitle: 'Jeu PS5 • Europe',
    image: '', badge: null, description: 'Gran Turismo 7 — PS5 Europe.',
    variants: [{ id: 'ps5g-6-std', label: 'Standard', price: 0.00 }],
    stock: 20, rating: 4.8
  },
  {
    id: 'gemini-pro-18m', category: 'ai-tools', name: 'Google AI Pro Subscription', subtitle: '18 Months • Activation Link (Global)',
    image: 'https://ztcshop.github.io/ZTC-shop/google-ai-pro.jpg',
    badge: 'NEW', description: 'Google One Subscription Pro 5TB Activation link (CONTACT US IN CHAT FOR BULK OFFERS). Activate Google One (Gemini Pro) ON YOUR OWN GOOGLE ACCOUNT! Special Offer, DURATION = 1 + 17 MONTHS (total 18 Months offer). Plan Warranty Duration: 1 Month FROM DATE OF PURCHASE.',
    variants: [
      { id: 'gai-18m', label: '18 Months – Activation Link', price: 40.00 },
    ],
    stock: 50, rating: 5.0
  },
  {
    id: 'capcut-pro-1m', category: 'ai-tools', name: 'CapCut Pro Subscription (PC)', subtitle: '1 Month • Private Account (Global)',
    image: 'https://ztcshop.github.io/ZTC-shop/capcut-pro.jpg',
    badge: 'NEW', description: 'Edit High-Quality Videos. Hundreds of Special Effects. No Watermark. Unlimited Video Exports. Why Should You Buy Now? Limited Offer - Only for ZTC-shop Purchases. Special Price Just For You. Get Full Access to All Features Immediately. Premium! All Devices.',
    variants: [
      { id: 'cc-1m', label: '1 Month – Private Account', price: 25.00 },
    ],
    stock: 50, rating: 5.0
  },
]
