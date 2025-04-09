import { initPlayerTags, clearAllPlayers } from './features/players.js';
import { initZoneFields, flipCourt, setupActionButtonsForAllZones, setupFieldEvents } from './features/court.js';
import { initModal, initSettingsModal } from './ui/modals.js';
import { initScoreControls } from './features/score.js';
import { updateServeUI, updateZone1Actions } from './ui/serve-ui.js';
import { initSubstitutions } from './features/substitutions.js'; // Измененный импорт
import { initTeamManagement } from './features/team_management.js';

// Для модального окна замены игроков в зонах на площадке
import { initPlayers } from './features/players.js';
import { modalManager } from './features/modals.js';

// Экспортируем функции в глобальную область
window.setupFieldEvents = setupFieldEvents;
window.flipCourt = flipCourt;
window.clearAllPlayers = clearAllPlayers;
window.Substitutions = Substitutions; // Добавляем Substitutions в глобальную область

document.addEventListener('DOMContentLoaded', function() {
    initPlayerTags();
    initZoneFields();
    initModal();
    initScoreControls();
    updateServeUI();
    updateZone1Actions();
    initSettingsModal();
    setupActionButtonsForAllZones();
    Substitutions.init(); // Измененный вызов
    initTeamManagement();
    initPlayers(); // Инициализация игроков

    // Инициализация модального менеджера
    // Убедитесь что modalManager действительно имеет метод init
    if (modalManager && typeof modalManager.init === 'function') {
        modalManager.init();
    } else {
        console.error('modalManager.init is not a function');
    }



});