// Новый main.js с исправлениями
import {
    initPlayerTags,
    clearAllPlayers,
    placePlayerOnField,
    returnPlayerToBench,
    resetField
} from './features/players.js';

import {
    initZoneFields,
    flipCourt,
    setupActionButtonsForAllZones,
    setupFieldEvents,
    setupActionButtons
} from './features/court.js';

import {
    initModal,
    initSettingsModal,
    openRemoveModal,
    showAttackOptionsModal,
    modalManager
} from './features/modals.js';

import {
    initScoreControls,
    updateScoreDisplay
} from './features/score.js';

import {
    updateServeUI,
    updateZone1Actions
} from './features/serve-ui.js';

import {
    initSubstitutions
} from './features/substitutions.js';

import {
    recordPlayerAction,
    startLongPress,
    endLongPress,
    cancelLongPress,
    handleAttackPlusClick
} from './features/actions.js';

// Единый глобальный экспорт
window.setupFieldEvents = setupFieldEvents;
window.flipCourt = flipCourt;
window.clearAllPlayers = clearAllPlayers;
window.placePlayerOnField = placePlayerOnField;
window.returnPlayerToBench = returnPlayerToBench;
window.openRemoveModal = openRemoveModal;
window.showAttackOptionsModal = showAttackOptionsModal;
window.recordPlayerAction = recordPlayerAction;
window.startLongPress = startLongPress;
window.endLongPress = endLongPress;
window.cancelLongPress = cancelLongPress;
window.handleAttackPlusClick = handleAttackPlusClick;
window.modalManager = modalManager;

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
});