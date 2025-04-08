
// Функциональные модули
import {
  initPlayerTags,
  clearAllPlayers,
  initPlayers
} from './features/players.js';

import {
  initZoneFields,
  flipCourt,
  setupActionButtonsForAllZones,
  setupFieldEvents,
  initCourt
} from './features/court.js';

import {
  initModal,
  initSettingsModal,
  initModals
} from './ui/modals.js';

import {
  initScore,
  initScoreControls
} from './features/score.js';

// UI модули
import {
  updateServeUI,
  updateZone1Actions,
  initServeUI
} from './ui/serve-ui.js';

// Экспорт в глобальную область
window.setupFieldEvents = setupFieldEvents;
window.flipCourt = flipCourt;
window.clearAllPlayers = clearAllPlayers;

document.addEventListener('DOMContentLoaded', () => {
  // Инициализация базовых систем
  initModals();       // Новая система модалок
  initModal();        // Старая система модалок
  initSettingsModal();

  // Площадка и игроки
  initCourt();
  initZoneFields();
  initPlayerTags();
  initPlayers();

  // Счет и действия
  initScore();
  initScoreControls();
  setupActionButtonsForAllZones();

  // Подача
  initServeUI();
  updateServeUI();
  updateZone1Actions();

  // Глобальный доступ
  window.state = state;
  window.constants = constants;
});