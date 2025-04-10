// Новый main.js с исправлениями
import {
    initPlayerTags,
    clearAllPlayers,
    placePlayerOnField,
    returnPlayerToBench,
    resetField,
    openSubstitutionModal,      // модальное окно замены
    substitutePlayer            // модальное окно замены
} from './players.js';

import {
    initZoneFields,
    flipCourt,
    setupActionButtonsForAllZones,
    setupFieldEvents,
    setupActionButtons
} from './court.js';

import {
    initModal,
    initSettingsModal,
    openRemoveModal,
    showAttackOptionsModal,
    modalManager
} from './modals.js';

import {
    initScoreControls,
    updateScoreDisplay
} from './score.js';

import {
    updateServeUI,
    updateZone1Actions
} from './serve-ui.js';

import {
    initSubstitutions
} from './substitutions.js';

import {
    recordPlayerAction,
    startLongPress,
    endLongPress,
    cancelLongPress,
    handleAttackPlusClick
} from './actions.js';

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
// модальное окно замены
window.openSubstitutionModal = openSubstitutionModal;
window.substitutePlayer = substitutePlayer;

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