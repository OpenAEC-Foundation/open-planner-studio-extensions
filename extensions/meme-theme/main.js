/**
 * Meme Theme — visuele make-over voor Open Planner Studio.
 *
 * Injecteert een <style>-blok dat de theme-CSS-variabelen van de app overschrijft
 * zodra een marker-klasse op <html> staat. De ribbon-knop onder tab "Start" zet
 * het theme aan/uit; de voorkeur wordt bewaard in api.settings.
 *
 * Alleen visueel: er wordt niets in de planningsdata of de store gemuteerd.
 * Bij onUnload worden de marker-klasse en het <style>-blok netjes verwijderd.
 */

const ACTIVE_CLASS = 'ops-meme-theme-on';
const STYLE_ID = 'ops-meme-theme-style';
const SETTINGS_KEY = 'enabled';

const MEME_CSS = `
/* ── Theme tokens overschrijven ─────────────────────────────────────────── */
html.${ACTIVE_CLASS} {
  --theme-bg:               #FFE800 !important;
  --theme-surface:          #FFB300 !important;
  --theme-surface-alt:      #FFC947 !important;
  --theme-surface-elevated: #FF8F00 !important;
  --theme-hover:            #FFEB3B !important;
  --theme-border:           #111111 !important;
  --theme-border-light:     #4A4A4A !important;
  --theme-text:             #000000 !important;
  --theme-text-dim:         #2C2C2C !important;
  --theme-accent:           #FF00D4 !important;
  --theme-accent-hover:     #C700A8 !important;
  --theme-accent-on:        #FFFF00 !important;

  --font-body:    "Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive !important;
  --font-heading: "Impact", "Anton", "Bebas Neue", "Comic Sans MS", cursive !important;
  --font-code:    "Comic Sans MS", "Comic Sans", monospace !important;
}

/* ── Impact-font met zwarte text-shadow op ribbon ──────────────────────── */
html.${ACTIVE_CLASS} .ribbon-tab,
html.${ACTIVE_CLASS} .ribbon-btn-label,
html.${ACTIVE_CLASS} .ribbon-group-label {
  font-family: "Impact", "Comic Sans MS", sans-serif !important;
  font-weight: 900 !important;
  letter-spacing: 1.5px !important;
  text-transform: uppercase !important;
  text-shadow: 1px 1px 0 #000, 2px 2px 0 rgba(0,0,0,0.45) !important;
}

/* ── Dikke zwarte randen met harde schaduw op cards/panelen ────────────── */
html.${ACTIVE_CLASS} [class*="card"],
html.${ACTIVE_CLASS} [class*="panel"],
html.${ACTIVE_CLASS} [class*="surface"]:not([class*="surface-alt"]):not([class*="surface-elevated"]) {
  border: 2px solid #000 !important;
  box-shadow: 4px 4px 0 #000 !important;
  border-radius: 0 !important;
}

/* ── Inputs in Comic Sans met gestreepte achtergrond ───────────────────── */
html.${ACTIVE_CLASS} input,
html.${ACTIVE_CLASS} select,
html.${ACTIVE_CLASS} textarea {
  font-family: "Comic Sans MS", cursive !important;
  background: #FFF !important;
  color: #000 !important;
  border: 2px dashed #000 !important;
  border-radius: 0 !important;
}

/* ── Waggelende iconen ─────────────────────────────────────────────────── */
html.${ACTIVE_CLASS} .ribbon-btn-icon,
html.${ACTIVE_CLASS} svg.lucide,
html.${ACTIVE_CLASS} svg[class*="lucide"] {
  animation: ops-meme-wobble 2.8s ease-in-out infinite !important;
  transform-origin: center !important;
  display: inline-block !important;
}

@keyframes ops-meme-wobble {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25%      { transform: rotate(-12deg) scale(1.18); }
  50%      { transform: rotate(8deg)  scale(0.92); }
  75%      { transform: rotate(-4deg) scale(1.12); }
}

/* ── Schuine streep-achtergrond op de body ─────────────────────────────── */
html.${ACTIVE_CLASS} body {
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0,
    transparent 18px,
    rgba(255, 0, 212, 0.12) 18px,
    rgba(255, 0, 212, 0.12) 36px
  ) !important;
}

/* ── Kritieke taken knipogen ───────────────────────────────────────────── */
html.${ACTIVE_CLASS} [class*="critical"],
html.${ACTIVE_CLASS} [class*="task-critical"] {
  animation: ops-meme-blink 1.2s steps(2, end) infinite !important;
}

@keyframes ops-meme-blink {
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0.55; }
}
`;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = MEME_CSS;
  document.head.appendChild(style);
}

function removeStyle() {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

function isActive() {
  return document.documentElement.classList.contains(ACTIVE_CLASS);
}

function setActive(active) {
  document.documentElement.classList.toggle(ACTIVE_CLASS, active);
}

module.exports = {
  onLoad(api) {
    injectStyle();

    const initiallyEnabled = api.settings.get(SETTINGS_KEY, false);
    setActive(initiallyEnabled);

    api.ui.addRibbonButton({
      tab: 'start',
      group: 'Meme',
      label: 'Meme toggle',
      tooltip: 'Zet het meme-theme aan of uit (Comic Sans + Impact + knalgeel)',
      onClick: () => {
        const now = !isActive();
        setActive(now);
        api.settings.set(SETTINGS_KEY, now);
        api.ui.showNotification(
          now
            ? '🤣 Meme-theme ACTIEF!1! Comic Sans aangezet.'
            : '😏 Meme-theme uit. Normale typografie hersteld.',
          'info'
        );
      },
    });

    if (initiallyEnabled) {
      api.ui.showNotification('🤣 Meme-theme geladen (ingeschakeld).', 'info');
    }
  },

  onUnload() {
    setActive(false);
    removeStyle();
  },
};
