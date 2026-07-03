/**
 * Rose Thema - Extensie voor Open Planner Studio
 * 
 * Voegt een elegant rose-kleurenschema toe aan de UI.
 * Dit thema gebruikt warme rose tinten (#e83e8c, #f8bbd9) gecombineerd
 * met zachte paarse accenten voor een professionele, rustige uitstraling.
 */

const sdk = require('open-planner-studio');

// Rose thema kleurendefinities
const ROSE_THEME = {
  // Primaire kleuren
  primary: '#e83e8c',           // Diep rose - hoofdaccentkleur
  primaryLight: '#f8bbd9',     // Licht rose - achtergronden, highlights
  primaryDark: '#c2185b',      // Donker rose - hover, actieve states
  
  // Secundaire kleuren (accent)
  secondary: '#9c27b0',         // Diep paars - secundair accent
  secondaryLight: '#e1bee7',   // Licht paars
  
  // Achtergrondkleuren
  background: '#fafafa',       // Bijna wit - hoofdachtergrond
  surface: '#ffffff',           // Wit - kaarten, panelen
  
  // Tekstkleuren
  textPrimary: '#212121',       // Donker grijs - primaire tekst
  textSecondary: '#757575',    // Medium grijs - secundaire tekst
  textDisabled: '#bdbdbd',     // Licht grijs - disabled tekst
  
  // Border kleuren
  border: '#e0e0e0',           // Licht grijs - borders
  divider: '#bdbdbd',          // Dividers
  
  // Status kleuren
  success: '#4caf50',           // Groen
  warning: '#ff9800',           // Oranje
  error: '#f44336',             // Rood
  info: '#2196f3',              // Blauw
  
  // Specifieke UI elementen
  ribbonBackground: '#f8bbd9', // Licht rose achtergrond voor ribbon
  ribbonText: '#c2185b',       // Donker rose tekst in ribbon
  ribbonHover: '#e83e8c',      // Rose hover effect
  
  // Tabel/lijst kleuren
  tableHeader: '#f8bbd9',       // Rose tabel headers
  tableRowEven: '#fff8fa',      // Zeer licht rose voor even rijen
  tableRowOdd: '#ffffff',       // Wit voor oneven rijen
  tableRowHover: '#fce4ec',    // Licht rose hover op rijen
  
  // Knop kleuren
  buttonPrimary: '#e83e8c',     // Rose primaire knoppen
  buttonPrimaryHover: '#c2185b',
  buttonSecondary: '#9c27b0',   // Paars secundaire knoppen
  buttonSecondaryHover: '#7b1fa2',
  
  // Input velden
  inputBorder: '#e83e8c',       // Rose border voor focus
  inputFocus: '#f8bbd9',        // Licht rose achtergrond bij focus
};

// Genereer CSS string uit het thema object
function generateThemeCSS(theme) {
  return `
    /* ============================================
     * Rose Thema - Open Planner Studio
     * ============================================ */
    
    /* Root CSS variabelen overschrijven */
    :root {
      /* Primaire kleuren */
      --ops-color-primary: ${theme.primary};
      --ops-color-primary-light: ${theme.primaryLight};
      --ops-color-primary-dark: ${theme.primaryDark};
      
      /* Secundaire kleuren */
      --ops-color-secondary: ${theme.secondary};
      --ops-color-secondary-light: ${theme.secondaryLight};
      
      /* Achtergronden */
      --ops-color-background: ${theme.background};
      --ops-color-surface: ${theme.surface};
      
      /* Tekst */
      --ops-color-text-primary: ${theme.textPrimary};
      --ops-color-text-secondary: ${theme.textSecondary};
      --ops-color-text-disabled: ${theme.textDisabled};
      
      /* Borders & Dividers */
      --ops-color-border: ${theme.border};
      --ops-color-divider: ${theme.divider};
      
      /* Status kleuren */
      --ops-color-success: ${theme.success};
      --ops-color-warning: ${theme.warning};
      --ops-color-error: ${theme.error};
      --ops-color-info: ${theme.info};
    }
    
    /* Ribbon specifieke stijlen */
    .ops-ribbon {
      background-color: ${theme.ribbonBackground} !important;
    }
    
    .ops-ribbon .tab-button {
      color: ${theme.ribbonText} !important;
    }
    
    .ops-ribbon .tab-button:hover,
    .ops-ribbon .tab-button.active {
      background-color: ${theme.ribbonHover} !important;
      color: white !important;
    }
    
    /* Tabel stijlen */
    .ops-data-table thead tr {
      background-color: ${theme.tableHeader} !important;
    }
    
    .ops-data-table tbody tr:nth-child(even) {
      background-color: ${theme.tableRowEven} !important;
    }
    
    .ops-data-table tbody tr:nth-child(odd) {
      background-color: ${theme.tableRowOdd} !important;
    }
    
    .ops-data-table tbody tr:hover {
      background-color: ${theme.tableRowHover} !important;
    }
    
    /* Knoppen */
    .ops-button.primary {
      background-color: ${theme.buttonPrimary} !important;
      border-color: ${theme.buttonPrimary} !important;
      color: white !important;
    }
    
    .ops-button.primary:hover {
      background-color: ${theme.buttonPrimaryHover} !important;
      border-color: ${theme.buttonPrimaryHover} !important;
    }
    
    .ops-button.secondary {
      background-color: ${theme.buttonSecondary} !important;
      border-color: ${theme.buttonSecondary} !important;
      color: white !important;
    }
    
    .ops-button.secondary:hover {
      background-color: ${theme.buttonSecondaryHover} !important;
      border-color: ${theme.buttonSecondaryHover} !important;
    }
    
    /* Input velden */
    .ops-input:focus,
    .ops-select:focus {
      border-color: ${theme.inputBorder} !important;
      box-shadow: 0 0 0 2px ${theme.inputFocus} !important;
    }
    
    /* Scrollbars */
    ::-webkit-scrollbar-thumb {
      background-color: ${theme.primaryLight} !important;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.primary} !important;
    }
    
    /* Status badges */
    .ops-badge.success {
      background-color: ${theme.success} !important;
    }
    
    .ops-badge.warning {
      background-color: ${theme.warning} !important;
    }
    
    .ops-badge.error {
      background-color: ${theme.error} !important;
    }
    
    .ops-badge.info {
      background-color: ${theme.info} !important;
    }
    
    /* Side panel */
    .ops-side-panel {
      background-color: ${theme.surface} !important;
      border-left: 2px solid ${theme.primaryLight} !important;
    }
    
    /* Toolbar */
    .ops-toolbar {
      background-color: ${theme.ribbonBackground} !important;
      border-bottom: 1px solid ${theme.primaryLight} !important;
    }
    
    /* Calendar/Gantt chart accenten */
    .ops-gantt-chart .task-bar {
      border-radius: 4px !important;
    }
    
    .ops-gantt-chart .task-bar:hover {
      filter: brightness(95%) !important;
    }
    
    /* Hoofd achtergrond */
    .ops-app-container {
      background-color: ${theme.background} !important;
    }
    
    /* Card componenten */
    .ops-card {
      border: 1px solid ${theme.border} !important;
      box-shadow: 0 2px 4px rgba(232, 62, 140, 0.1) !important;
    }
    
    /* Dialog/Modal */
    .ops-dialog .header {
      background-color: ${theme.primaryLight} !important;
      color: ${theme.primaryDark} !important;
    }
    
    /* Tab panelen */
    .ops-tabs .tab-active {
      border-bottom-color: ${theme.primary} !important;
      color: ${theme.primary} !important;
    }
    
    /* Overige focus states */
    :focus-visible {
      outline: 2px solid ${theme.primary} !important;
      outline-offset: 2px !important;
    }
    
    /* Selectie kleur */
    ::selection {
      background-color: ${theme.primaryLight} !important;
      color: ${theme.primaryDark} !important;
    }
    
    /* Links */
    a {
      color: ${theme.primary} !important;
    }
    
    a:hover {
      color: ${theme.primaryDark} !important;
    }
    
    /* Icoon kleuren */
    .ops-icon {
      color: ${theme.textSecondary} !important;
    }
    
    .ops-icon:hover {
      color: ${theme.primary} !important;
    }
    
    /* Loaders/Spinners */
    .ops-spinner {
      border-top-color: ${theme.primary} !important;
    }
    
    /* Notificaties */
    .ops-notification.info {
      border-left-color: ${theme.info} !important;
      background-color: rgba(33, 150, 243, 0.1) !important;
    }
    
    .ops-notification.success {
      border-left-color: ${theme.success} !important;
      background-color: rgba(76, 175, 80, 0.1) !important;
    }
    
    .ops-notification.warning {
      border-left-color: ${theme.warning} !important;
      background-color: rgba(255, 152, 0, 0.1) !important;
    }
    
    .ops-notification.error {
      border-left-color: ${theme.error} !important;
      background-color: rgba(244, 67, 54, 0.1) !important;
    }
  `;
}

module.exports = {
  onLoad(api) {
    // Toon melding dat thema geladen is
    api.ui.showNotification(
      `Rose Thema geladen (host v${sdk.version}). Welkom in een wereld van rose tinten!`,
      'info'
    );

    // Injecteer de CSS voor het thema
    const themeCSS = generateThemeCSS(ROSE_THEME);
    api.ui.injectStyles(themeCSS, 'rose-thema-styles');

    // Voeg een ribbon-knop toe om het thema te toggleen
    // (Optioneel: als de host dit ondersteunt)
    api.ui.addRibbonButton({
      tab: 'view',
      group: 'Thema',
      label: 'Rose',
      tooltip: 'Activeer het Rose thema',
      icon: '🌹',
      onClick: () => {
        // Her-injecteer de CSS (voor het geval het verwijderd was)
        api.ui.injectStyles(themeCSS, 'rose-thema-styles');
        api.ui.showNotification('Rose thema geactiveerd!', 'info');
      },
    });
  },

  onUnload() {
    // Verwijder de geïnjecteerde CSS
    // (De host zou dit automatisch moeten doen bij uitschakelen)
  },
};
