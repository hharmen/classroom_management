// sync.js
// Упрощенная версия - работает через proxy на основном сервере

// --------------------------------------------
// 1) Синхронизация комнат через proxy
// --------------------------------------------
async function syncRooms() {
    console.log("🔄 Синхронизация комнат с удалённым сервером...");
    
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
            <span>Синхронизация с сервером...</span>
        `;
    }

    try {
        const response = await fetch('/sync_rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("✅ " + result.message);
        
        // Обновляем статус подключения
        if (statusElement) {
            statusElement.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <span>${result.message}</span>
            `;
            statusElement.className = 'connection-status connected';
        }
        
        // Показываем уведомление об успехе с информацией о сервере
        const serverInfo = result.remote_server ? ` (сервер: ${result.remote_server})` : '';
        showNotification(result.message + serverInfo, 'success');
        
        // Обновляем данные на странице без перезагрузки
        updatePageData();
        
    } catch (err) {
        console.error("❌ Ошибка синхронизации:", err);
        
        // Обновляем статус подключения
        if (statusElement) {
            statusElement.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                <span>Ошибка синхронизации: ${err.message}</span>
            `;
            statusElement.className = 'connection-status error';
        }
        
        showNotification(`Ошибка синхронизации: ${err.message}`, 'error');
    }
}

// --------------------------------------------
// 2) Обновление данных на странице без перезагрузки
// --------------------------------------------
async function updatePageData() {
    console.log("📊 Обновление данных на странице...");
    
    try {
        // Загружаем обновленные данные
        const response = await fetch('/rooms');
        if (!response.ok) {
            throw new Error('Не удалось загрузить обновленные данные');
        }
        
        const roomsData = await response.json();
        console.log("✅ Получены обновленные данные:", roomsData);
        
        // Обновляем таблицу на странице Art.html
        if (typeof renderNestedTable === 'function') {
            // Сохраняем текущее состояние развертывания
            const currentExpandedState = saveExpandedState();
            
            // Обновляем данные
            window.roomsData = roomsData;
            
            // Восстанавливаем состояние развертывания
            restoreExpandedState(currentExpandedState);
            
            // Перерисовываем таблицу
            renderNestedTable();
            
            showNotification('Данные успешно обновлены', 'success');
        } else {
            console.log("⚠ Функция renderNestedTable не найдена, возможно это не страница Art.html");
        }
        
    } catch (err) {
        console.error("❌ Ошибка обновления данных:", err);
        showNotification('Ошибка обновления данных: ' + err.message, 'error');
    }
}

// --------------------------------------------
// 3) Отправка selected.json через proxy
// --------------------------------------------
async function sendSelectedToServer() {
    console.log("📤 Отправляем selected.json на удалённый сервер...");

    try {
        const response = await fetch('/save_selected', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ " + result.message);
        
        // 🔥 ВЫВОДИМ ИНФОРМАЦИЮ О СЕРВЕРЕ
        const serverInfo = result.remote_server ? ` (сервер: ${result.remote_server})` : '';
        if (result.remote_response && result.remote_response.saved_to_file) {
            showNotification(`${result.message} - сохранено в ${result.remote_response.saved_to_file}${serverInfo}`, 'success');
        } else {
            showNotification(result.message + serverInfo, 'success');
        }
        
    } catch (err) {
        console.error("❌ Ошибка отправки selected.json:", err);
        showNotification(`Ошибка отправки selected.json: ${err.message}`, 'error');
    }
}

// --------------------------------------------
// 4) Получение информации о сервере
// --------------------------------------------
async function getServerInfo() {
    try {
        const response = await fetch('/server_info');
        if (response.ok) {
            const info = await response.json();
            console.log("📡 Информация о сервере:", info);
            return info;
        }
    } catch (err) {
        console.log("⚠ Не удалось получить информацию о сервере");
    }
    return null;
}

// --------------------------------------------
// 5) Вспомогательные функции
// --------------------------------------------
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    const backgroundColor = type === 'success' ? '#28a745' : 
                           type === 'error' ? '#dc3545' : '#17a2b8';
    notification.style.backgroundColor = backgroundColor;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-triangle' : 
                           'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// --------------------------------------------
// 6) Сохранение и восстановление состояния развертывания
// --------------------------------------------
function saveExpandedState() {
    if (!window.roomsData) return null;
    
    const state = {
        rooms: {},
        computers: {}
    };
    
    window.roomsData.forEach(room => {
        state.rooms[room.id] = room.expanded;
        room.computers.forEach(computer => {
            state.computers[computer.id] = computer.expanded;
        });
    });
    
    return state;
}

function restoreExpandedState(state) {
    if (!state || !window.roomsData) return;
    
    window.roomsData.forEach(room => {
        if (state.rooms.hasOwnProperty(room.id)) {
            room.expanded = state.rooms[room.id];
        }
        room.computers.forEach(computer => {
            if (state.computers.hasOwnProperty(computer.id)) {
                computer.expanded = state.computers[computer.id];
            }
        });
    });
}

// --------------------------------------------
// 7) Добавление кнопки синхронизации в интерфейс
// --------------------------------------------
function addSyncButton() {
    // Проверяем, есть ли уже кнопка
    if (document.getElementById('syncButton')) {
        return;
    }
    
    // Создаем кнопку синхронизации
    const syncButton = document.createElement('button');
    syncButton.id = 'syncButton';
    syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> Синхронизировать';
    syncButton.className = 'btn btn-warning header-button';
    syncButton.style.marginLeft = '10px';
    syncButton.onclick = syncRooms;
    
    // Добавляем кнопку в заголовок
    const headerButtons = document.querySelector('.header-buttons');
    if (headerButtons) {
        headerButtons.appendChild(syncButton);
    }
    
    // Для страницы Art2.html добавляем кнопку в другой раздел
    const roomsControls = document.querySelector('.rooms-controls');
    if (roomsControls && !document.getElementById('syncButtonArt2')) {
        const syncButtonArt2 = document.createElement('button');
        syncButtonArt2.id = 'syncButtonArt2';
        syncButtonArt2.innerHTML = '<i class="fas fa-sync-alt"></i> Синхронизировать';
        syncButtonArt2.className = 'control-btn control-btn-primary';
        syncButtonArt2.onclick = syncRooms;
        roomsControls.appendChild(syncButtonArt2);
    }
}

// --------------------------------------------
// 8) Автоматическая синхронизация при загрузке (ТОЛЬКО ДЛЯ Art.html)
// --------------------------------------------
function shouldAutoSync() {
    // Автосинхронизация только для главной страницы Art.html
    // и только если данных еще нет или они устарели
    const isMainPage = window.location.pathname === '/' || 
                      window.location.pathname === '/index.html' || 
                      window.location.pathname === '/Art.html';
    
    if (!isMainPage) return false;
    
    // Проверяем, есть ли уже данные на странице
    const nestedTable = document.getElementById('nestedTable');
    if (nestedTable && nestedTable.querySelector('.room-row')) {
        console.log("📊 Данные уже загружены, пропускаем автосинхронизацию");
        return false;
    }
    
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 sync.js загружен");
    
    // Получаем информацию о сервере
    getServerInfo().then(info => {
        if (info) {
            console.log(`📡 Настроен удаленный сервер: ${info.remote_server}`);
        }
    });
    
    // Добавляем кнопки синхронизации
    addSyncButton();
    
    // Автоматическая синхронизация только при необходимости
    if (shouldAutoSync()) {
        console.log("🔧 Запуск автоматической синхронизации...");
        setTimeout(syncRooms, 1000);
    } else {
        console.log("⏭ Пропуск автоматической синхронизации");
        
        // Просто обновляем статус подключения
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <span>Подключено к серверу (данные загружены)</span>
            `;
            statusElement.className = 'connection-status connected';
        }
    }
});

// --------------------------------------------
// 9) Глобальные функции для вызова из других скриптов
// --------------------------------------------
window.syncRooms = syncRooms;
window.sendSelectedToServer = sendSelectedToServer;
window.showNotification = showNotification;
window.updatePageData = updatePageData;

console.log("✅ sync.js инициализирован");