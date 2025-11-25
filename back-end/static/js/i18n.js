// Internationalization (i18n) support for English and French
const translations = {
  en: {
    // Navigation
    navHome: "Home",
    navCustomers: "Customers",
    navProducts: "Products",
    navReports: "Reports",
    navSelfCheckout: "Self-Checkout",

    // Home page
    homeTitle: "System Control",
    homeSubtitle: "Monitor sensors and control devices",
    fridge1: "Fridge 1 (DHT11)",
    fridge2: "Fridge 2 (DHT11)",
    temperature: "Temperature",
    humidity: "Humidity",
    reading: "Reading...",
    fanControl1: "Fan Control 1",
    fanControl2: "Fan Control 2",
    deactivated: "Deactivated",
    activated: "Activated",
    turnOn: "Turn ON",
    turnOff: "Turn OFF",
    ambientContext: "Ambient Context",
    noMotion: "No motion detected",
    max: "max",
    min: "min",
    emailStatus: "Email Status",
    emailSent: "Email Sent",
    thresholdSettings: "Threshold Settings",
    highThreshold: "High Threshold",
    lowThreshold: "Low Threshold",
    editThreshold: "Edit Threshold",
    cancel: "Cancel",
    save: "Save",

    // Customers page
    customersTitle: "Customer Management",
    customersSubtitle: "Add and manage customer information",
    addNewCustomer: "Add New Customer",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phoneNumber: "Phone Number",
    rewardsPoints: "Rewards Points",
    addCustomer: "Add Customer",
    clear: "Clear",
    customerDatabase: "Customer Database",
    refresh: "Refresh",
    id: "ID",
    phone: "Phone",
    points: "Points",
    producer: "Company",
    actions: "Actions",
    loadingCustomers: "Loading customers...",
    edit: "Edit",
    delete: "Delete",
    password: "Password",

    // Products page
    productsTitle: "Product Management",
    productsSubtitle: "Add and manage product inventory",
    addNewProduct: "Add New Product",
    productName: "Product Name",
    price: "Price",
    epc: "EPC",
    upc: "UPC",
    availableStock: "Available Stock",
    category: "Category",
    pointsWorth: "Points Worth",
    producerCompany: "Producer Company",
    addProduct: "Add Product",
    productDatabase: "Product Database",
    name: "Name",
    stock: "Stock",
    loadingProducts: "Loading products...",

    // Reports page
    reportsTitle: "Reports & Analytics",
    reportsSubtitle: "System performance and data insights",
    environmentalData: "Environmental Data",
    environmentalDataDesc: "Temperature and humidity trends over time",
    customerAnalytics: "Customer Analytics",
    customerAnalyticsDesc: "Customer registration and rewards statistics",
    systemPerformance: "System Performance",
    systemPerformanceDesc: "Device uptime and operational metrics",
    fanUsage: "Fan Usage",
    fanUsageDesc: "Climate control activation history",
    viewReport: "View Report",
    
    // Report filters and details
    startDate: "Start Date",
    endDate: "End Date",
    applyFilters: "Apply Filters",
    resetFilters: "Reset",
    avgTemperature: "Avg Temperature",
    avgHumidity: "Avg Humidity",
    totalCustomers: "Total Customers",
    newCustomers: "New Customers",
    totalRewardsDistributed: "Total Rewards Distributed",
    avgRewards: "Avg Rewards",
    topCustomers: "Top Customers",
    purchases: "Purchases",
    totalSpent: "Total Spent",
    productSales: "Product Sales",
    productSalesDesc: "Best-selling products and revenue analysis",
    productName: "Product Name",
    quantitySold: "Qty Sold",
    transactions: "Transactions",
    revenue: "Revenue",
    allCategories: "All Categories",
    totalTransactions: "Total Transactions",
    totalRevenue: "Total Revenue",
    avgTransaction: "Avg Transaction",
    deviceUptime: "Device Uptime (days)",
    sensorReadings: "Sensor Readings",
    avgTemp: "Avg Temperature",
    date: "Date",

    // Self-Checkout page
    selfCheckoutTitle: "Self-Checkout",
    selfCheckoutSubtitle: "Scan your items to complete your purchase",
    itemDescription: "Item Description",
    quantity: "Quantity",
    scanItem: "Scan Item",
    subtotal: "Subtotal",
    pointsEarned: "Points Earned",
    totalPointsBalance: "Total Points Balance",
    total: "Total",
    pay: "Pay Now",
    clearCart: "Clear Cart",
    noItems: "No items scanned yet",
    scanToBegin: "Scan an item to begin",
    remove: "Remove", // Added remove button translation

    // Login/Register
    signIn: "Sign In",
    password: "Password",
    forgotPassword: "Forgot Password?",
    dontHaveAccount: "Don't have an account?",
    register: "Register",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    resetPassword: "Reset Password",
    resetPasswordSubtitle:
      "Enter your registered email address below and we'll send you a link to reset your password.",
    sendResetEmail: "Send Reset Email",
    rememberedPassword: "Remembered your password?",
    backToSignIn: "Back to Sign In",
    logout: "Logout",

    // Customer Account page
    account: "Account",
    accountDetails: "Account Details",
    purchaseHistoryTitle: "Purchase History",
    spendingSummary: "Spending Summary",
    profileTitle: "Profile",
    welcome: "Welcome",
    emailLabel: "Email:",
    rewardsPointsLabel: "Rewards Points:",
    membershipNumber: "Membership #:",
    joinedLabel: "Joined:",
    receipt: "Receipt",
    noPurchases: "No purchases yet.",
    receiptDetails: "Receipt Details",
    close: "Close",
    exportPdf: "Export as PDF",

    // Footer
    footer: "© 2025 ConnectedSmarties. All rights reserved.",

    // Messages
    required: "* Required fields",
    // Search / Purchase History
    searchPlaceholder: "Search items...",
    purchased: "Purchased",
    times: "times",
    details: "Details",
    noResults: "No results found.",
  },
  fr: {
    // Navigation
    navHome: "Accueil",
    navCustomers: "Clients",
    navProducts: "Produits",
    navReports: "Rapports",
    navSelfCheckout: "Caisse Libre-Service",

    // Home page
    homeTitle: "Contrôle du Système",
    homeSubtitle: "Surveiller les capteurs et contrôler les appareils",
    fridge1: "Frigo 1 (DHT11)",
    fridge2: "Frigo 2 (DHT11)",
    temperature: "Température",
    humidity: "Humidité",
    reading: "Lecture...",
    fanControl1: "Contrôle Ventilateur 1",
    fanControl2: "Contrôle Ventilateur 2",
    deactivated: "Désactivé",
    activated: "Activé",
    turnOn: "Allumer",
    turnOff: "Éteindre",
    ambientContext: "Contexte Ambiant",
    noMotion: "Aucun mouvement détecté",
    max: "max",
    min: "min",
    emailStatus: "Statut Email",
    emailSent: "Email Envoyé",
    thresholdSettings: "Paramètres de Seuil",
    highThreshold: "Seuil Élevé",
    lowThreshold: "Seuil Bas",
    editThreshold: "Modifier le Seuil",
    cancel: "Annuler",
    save: "Enregistrer",

    // Customers page
    customersTitle: "Gestion des Clients",
    customersSubtitle: "Ajouter et gérer les informations des clients",
    addNewCustomer: "Ajouter un Nouveau Client",
    firstName: "Prénom",
    lastName: "Nom de Famille",
    email: "Courriel",
    phoneNumber: "Numéro de Téléphone",
    rewardsPoints: "Points de Récompense",
    addCustomer: "Ajouter un Client",
    clear: "Effacer",
    customerDatabase: "Base de Données Clients",
    refresh: "Actualiser",
    id: "ID",
    phone: "Téléphone",
    points: "Points",
    producer: "Companie",
    actions: "Actions",
    loadingCustomers: "Chargement des clients...",
    edit: "Modifier",
    delete: "Supprimer",
    password: "Mot de Passe",

    // Products page
    productsTitle: "Gestion des Produits",
    productsSubtitle: "Ajouter et gérer l'inventaire des produits",
    addNewProduct: "Ajouter un Nouveau Produit",
    productName: "Nom du Produit",
    price: "Prix",
    epc: "EPC",
    upc: "UPC",
    availableStock: "Stock Disponible",
    category: "Catégorie",
    pointsWorth: "Valeur en Points",
    producerCompany: "Companie Productrice",
    addProduct: "Ajouter un Produit",
    productDatabase: "Base de Données Produits",
    name: "Nom",
    stock: "Stock",
    loadingProducts: "Chargement des produits...",

    // Reports page
    reportsTitle: "Rapports et Analytiques",
    reportsSubtitle: "Performance du système et aperçus des données",
    environmentalData: "Données Environnementales",
    environmentalDataDesc: "Tendances de température et d'humidité au fil du temps",
    customerAnalytics: "Analytiques Clients",
    customerAnalyticsDesc: "Statistiques d'inscription et de récompenses des clients",
    systemPerformance: "Performance du Système",
    systemPerformanceDesc: "Métriques opérationnelles et temps de disponibilité des appareils",
    fanUsage: "Utilisation du Ventilateur",
    fanUsageDesc: "Historique d'activation du contrôle climatique",
    viewReport: "Voir le Rapport",
    
    // Report filters and details
    startDate: "Date de Début",
    endDate: "Date de Fin",
    applyFilters: "Appliquer les Filtres",
    resetFilters: "Réinitialiser",
    avgTemperature: "Temp. Moy.",
    avgHumidity: "Humidité Moy.",
    totalCustomers: "Total Clients",
    newCustomers: "Nouveaux Clients",
    totalRewardsDistributed: "Total Récompenses Distribuées",
    avgRewards: "Récompenses Moy.",
    topCustomers: "Meilleurs Clients",
    purchases: "Achats",
    totalSpent: "Total Dépensé",
    productSales: "Ventes de Produits",
    productSalesDesc: "Analyse des produits les plus vendus et revenus",
    productName: "Nom du Produit",
    quantitySold: "Qté Vendue",
    transactions: "Transactions",
    revenue: "Revenu",
    allCategories: "Toutes les Catégories",
    totalTransactions: "Total Transactions",
    totalRevenue: "Revenu Total",
    avgTransaction: "Transaction Moy.",
    deviceUptime: "Disponibilité Appareil (jours)",
    sensorReadings: "Lectures Capteur",
    avgTemp: "Temp. Moy.",
    date: "Date",

    // Self-Checkout page
    selfCheckoutTitle: "Caisse Libre-Service",
    selfCheckoutSubtitle: "Scannez vos articles pour finaliser votre achat",
    itemDescription: "Description de l'Article",
    quantity: "Quantité",
    scanItem: "Scanner l'Article",
    subtotal: "Sous-total",
    pointsEarned: "Points Gagnés",
    totalPointsBalance: "Solde Total de Points",
    total: "Total",
    pay: "Payer Maintenant",
    clearCart: "Vider le Panier",
    noItems: "Aucun article scanné",
    scanToBegin: "Scannez un article pour commencer",
    remove: "Retirer", 

    // Login/Register
    signIn: "Se Connecter",
    password: "Mot de Passe",
    forgotPassword: "Mot de passe oublié?",
    dontHaveAccount: "Vous n'avez pas de compte?",
    register: "S'inscrire",
    createAccount: "Créer un Compte",
    haveAccount: "Vous avez déjà un compte?",
    resetPassword: "Réinitialiser le Mot de Passe",
    resetPasswordSubtitle:
      "Entrez votre adresse courriel enregistrée ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
    sendResetEmail: "Envoyer le Lien de Réinitialisation",
    rememberedPassword: "Vous vous souvenez de votre mot de passe?",
    backToSignIn: "Retour à la Connexion",
    logout: "Se déconnecter",

    // Customer Account page
    account: "Compte",
    accountDetails: "Détails du Compte",
    purchaseHistoryTitle: "Historique des Achats",
    spendingSummary: "Résumé des Dépenses",
    profileTitle: "Profil",
    welcome: "Bienvenue",
    emailLabel: "Courriel :",
    rewardsPointsLabel: "Points de Récompense :",
    membershipNumber: "N° d'Adhésion :",
    joinedLabel: "Inscrit le :",
    receipt: "Reçu",
    noPurchases: "Aucun achat pour le moment.",
    receiptDetails: "Détails du Reçu",
    close: "Fermer",
    exportPdf: "Exporter en PDF",

    // Footer
    footer: "© 2025 ConnectedSmarties. Tous droits réservés.",

    // Messages
    required: "* Champs obligatoires",
    // Search / Purchase History
    searchPlaceholder: "Rechercher des articles...",
    purchased: "Acheté",
    times: "fois",
    details: "Détails",
    noResults: "Aucun résultat.",
  },
}

// Get current language from localStorage or default to English
function getCurrentLanguage() {
  return localStorage.getItem("language") || "en"
}

// Set language
function setLanguage(lang) {
  localStorage.setItem("language", lang)
  updatePageLanguage()
}

// Get translation
function t(key) {
  const lang = getCurrentLanguage()
  return translations[lang][key] || translations.en[key] || key
}

// Update all text on the page
function updatePageLanguage() {
  const elements = document.querySelectorAll("[data-i18n]")
  elements.forEach((element) => {
    const key = element.getAttribute("data-i18n")
    const translation = t(key)

    // Update text content or placeholder based on element type
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      if (element.hasAttribute("placeholder")) {
        element.placeholder = translation
      }
    } else {
      element.textContent = translation
    }
  })

  // Update the language toggle button
  updateLanguageToggle()
}

// Update language toggle button state
function updateLanguageToggle() {
  const currentLang = getCurrentLanguage()
  const toggleBtn = document.getElementById("lang-toggle")
  if (toggleBtn) {
    toggleBtn.textContent = currentLang.toUpperCase()
    toggleBtn.setAttribute("aria-label", currentLang === "en" ? "Switch to French" : "Passer à l'anglais")
  }
}

// Toggle between languages
function toggleLanguage() {
  const currentLang = getCurrentLanguage()
  const newLang = currentLang === "en" ? "fr" : "en"
  setLanguage(newLang)
}

// Initialize language on page load
document.addEventListener("DOMContentLoaded", () => {
  updatePageLanguage()
})

// Export translation function for other modules
export { setLanguage, getCurrentLanguage, updatePageLanguage, toggleLanguage, t }

// Expose module API to window so non-module scripts / inline handlers can use it
if (typeof window !== "undefined") {
  window.setLanguage = setLanguage
  window.getCurrentLanguage = getCurrentLanguage
  window.updatePageLanguage = updatePageLanguage
  window.toggleLanguage = toggleLanguage
  window.t = t
}
