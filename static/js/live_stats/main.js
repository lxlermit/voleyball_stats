import { initPlayerTags, clearAllPlayers } from './features/players.js';
import { initZoneFields, flipCourt, setupActionButtonsForAllZones, setupFieldEvents } from './features/court.js';
import { initModal, initSettingsModal } from './ui/modals.js';
import { initScoreControls } from './features/score.js';
import { updateServeUI, updateZone1Actions } from './ui/serve-ui.js';
import { initSubstitutions } from './features/substitutions.js';
import { initTeamManagement } from './features/team_management_on_court.js';

// Для ----- Модальное окно замены игроков в зонах на площадке
import { initPlayers } from './features/players.js';
import { modalManager } from './features/modals.js';

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
    initSubstitutions();
    initTeamManagement();
    // window.modalManager = modalManager; // Делаем доступным глобально ----- Модальное окно замены игроков в зонах на площадке
});