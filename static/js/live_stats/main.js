import { initPlayerTags, clearAllPlayers } from './features/players.js';
import { initZoneFields, flipCourt, setupActionButtonsForAllZones, setupFieldEvents } from './features/court.js';
import { initModal, initSettingsModal } from './ui/modals.js';
import { initScoreControls } from './features/score.js';
import { updateServeUI, updateZone1Actions } from './ui/serve-ui.js';

// Экспортируем функции в глобальную область
window.setupFieldEvents = setupFieldEvents;
window.flipCourt = flipCourt;
window.clearAllPlayers = clearAllPlayers;

document.addEventListener('DOMContentLoaded', function() {
    initPlayerTags();
    initZoneFields();
    initModal();
    initScoreControls();
    updateServeUI();
    updateZone1Actions();
    initSettingsModal();
    setupActionButtonsForAllZones();
});