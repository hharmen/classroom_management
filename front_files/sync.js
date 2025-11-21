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
// 3) 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Отправка selected.json через proxy
// --------------------------------------------
async function sendSelectedToServer() {
    console.log("📤 Проверка данных для отправки на удалённый сервер...");

    try {
        // 🔥 ПРОВЕРЯЕМ, ЕСТЬ ЛИ ВЫБРАННЫЕ ДАННЫЕ
        const response = await fetch('/selected.json?t=' + Date.now());
        const selectedData = await response.json();
        
        const hasComputers = selectedData.computers && selectedData.computers.length > 0;
        const hasApps = selectedData.apps && selectedData.apps.length > 0;
        
        if (!hasComputers && !hasApps) {
            console.log("⚠ Нет выбранных данных для отправки, просто переходим на Art2.html");
            window.location.href = '/art2';
            return;
        }
        
        console.log("📤 Отправляем selected.json на удалённый сервер...");
        const saveResponse = await fetch('/save_selected', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(errorData.error || `Ошибка сервера: ${saveResponse.status}`);
        }

        const result = await saveResponse.json();
        console.log("✅ " + result.message);
        
        // 🔥 ВЫВОДИМ ИНФОРМАЦИЮ О СЕРВЕРЕ
        const serverInfo = result.remote_server ? ` (сервер: ${result.remote_server})` : '';
        if (result.remote_response && result.remote_response.saved_to_file) {
            showNotification(`${result.message} - сохранено в ${result.remote_response.saved_to_file}${serverInfo}`, 'success');
        } else {
            showNotification(result.message + serverInfo, 'success');
        }
        
        // 🔥 ПЕРЕХОДИМ НА Art2.html ПОСЛЕ УСПЕШНОЙ ОТПРАВКИ
        setTimeout(() => {
            window.location.href = '/art2';
        }, 1000);
        
    } catch (err) {
        console.error("❌ Ошибка отправки selected.json:", err);
        showNotification(`Ошибка отправки selected.json: ${err.message}`, 'error');
        
        // 🔥 ВСЕ РАВНО ПЕРЕХОДИМ НА Art2.html ДАЖЕ ПРИ ОШИБКЕ
        setTimeout(() => {
            window.location.href = '/art2';
        }, 2000);
    }
}

// --------------------------------------------
// 4) 🔥 НОВАЯ ФУНКЦИЯ: Простой переход на Art2 без отправки данных
// --------------------------------------------
function goToArt2Page() {
    console.log("🔗 Переход на страницу выбора файлов...");
    window.location.href = '/art2';
}

// --------------------------------------------
// 5) Получение информации о сервере
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
// 6) Вспомогательные функции
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
// 7) Сохранение и восстановление состояния развертывания
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
// 8) 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Добавление кнопки синхронизации в интерфейс
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
    
    // 🔥 ИСПРАВЛЕНО: Добавляем кнопку в заголовок ТОЛЬКО на главной странице
    const isMainPage = window.location.pathname === '/' || 
                      window.location.pathname === '/index.html' || 
                      window.location.pathname === '/Art.html';
    
    if (isMainPage) {
        const headerButtons = document.querySelector('.header-buttons');
        if (headerButtons) {
            headerButtons.appendChild(syncButton);
        }
    }
    
    // 🔥 УДАЛЕНО: Создание дополнительной кнопки для Art2.html
    // чтобы избежать дублирования маленькой кнопки в секции компьютеров
}

// --------------------------------------------
// 9) 🔥 ИСПРАВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ: Разные обработчики для разных страниц
// --------------------------------------------
function initializeArtPage() {
    console.log("🎯 Инициализация страницы Art.html");
    
    // Находим кнопку загрузки файлов на Art.html
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    if (uploadFilesBtn) {
        // 🔥 ЗАМЕНЯЕМ ОБРАБОТЧИК - просто переход без отправки данных
        uploadFilesBtn.onclick = goToArt2Page;
        console.log("✅ Кнопка 'Загрузить файл на компьютеры' настроена на простой переход");
    }
}

function initializeArt2Page() {
    console.log("🎯 Инициализация страницы Art2.html");
    
    // 🔥 ИСПРАВЛЕННЫЙ КОД ДЛЯ Art2.html
    const selectAllBtn = document.getElementById('selectAllBtn');
    const refreshRoomsBtn = document.getElementById('refreshRooms');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    
    if (selectAllBtn) {
        // 🔥 ИСПРАВЛЕННЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ "ВЫБРАТЬ ВСЕ"
        selectAllBtn.addEventListener('click', function() {
            const allOnlineComputers = getAllOnlineComputers();
            const currentlySelected = getSelectedComputers().length;
            const allSelected = currentlySelected === allOnlineComputers.length;
            
            window.roomsData.forEach(room => {
                room.computers.forEach(computer => {
                    if (computer.status === 'online') {
                        computer.selected = !allSelected;
                    }
                });
            });
            
            renderRoomsArt2();
            updateSelectedCountArt2();
            updateDownloadAllButtonArt2();
        });
    }
    
    if (refreshRoomsBtn) {
        refreshRoomsBtn.addEventListener('click', function() {
            // Имитируем обновление статусов компьютеров
            window.roomsData.forEach(room => {
                room.computers.forEach(computer => {
                    if (Math.random() > 0.7) {
                        // Меняем статус для демонстрации
                        computer.status = computer.status === 'online' ? 'offline' : 'online';
                        if (computer.status === 'offline') {
                            computer.selected = false;
                        }
                    }
                });
            });
            renderRoomsArt2();
            updateSelectedCountArt2();
            updateDownloadAllButtonArt2();
            showNotification('Статусы компьютеров обновлены!', 'success');
        });
    }
    
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', function() {
            const selectedComputers = getSelectedComputers();
            const selectedApps = getSelectedApps();
            
            if (selectedComputers.length === 0) {
                alert('Пожалуйста, выберите хотя бы один компьютер для загрузки.');
                return;
            }
            
            if (selectedApps.length === 0) {
                alert('Пожалуйста, выберите хотя бы одно приложение для скачивания.');
                return;
            }
            
            const selectedData = {
                computers: selectedComputers.map(c => ({ id: c.id, name: c.name, roomId: c.roomId })),
                apps: selectedApps.map(a => ({ id: a.id, name: a.name, version: a.version }))
            };
            
            fetch('save_selected', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedData)
            })
            .then(response => {
                if (!response.ok) throw new Error('Ошибка при сохранении selected.json');
                return response.json();
            })
            .then(data => {
                alert(data.message || 'Выбор сохранён в selected.json');
                
                // Сбрасываем выбор
                window.roomsData.forEach(room => room.computers.forEach(c => c.selected = false));
                window.readyApps.forEach(a => a.selected = false);
                
                renderRoomsArt2();
                renderAppsArt2();
                updateSelectedCountArt2();
                updateDownloadAllButtonArt2();
            })
            .catch(err => {
                console.error(err);
                alert('Не удалось сохранить выбранные файлы.');
            });
        });
    }
}

// 🔥 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ Art2.html
function getAllOnlineComputers() {
    if (!window.roomsData) return [];
    return window.roomsData.flatMap(room => 
        room.computers.filter(computer => computer.status === 'online')
    );
}

function getSelectedComputers() {
    if (!window.roomsData) return [];
    return window.roomsData.flatMap(room => 
        room.computers.filter(computer => 
            computer.selected && computer.status === 'online'
        )
    );
}

function getSelectedApps() {
    if (!window.readyApps) return [];
    return window.readyApps.filter(app => app.selected);
}

function renderRoomsArt2() {
    const roomsGrid = document.getElementById('roomsGrid');
    if (!roomsGrid || !window.roomsData) return;
    
    if (window.roomsData.length === 0) {
        roomsGrid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-door-closed fa-2x mb-3"></i><br>
                У вас нет комнат
            </div>
        `;
        return;
    }

    roomsGrid.innerHTML = window.roomsData.map(room => `
        <div class="room-card">
            <div class="room-header">
                <h3 class="room-name">${room.name}</h3>
                <div class="room-code">${room.code}</div>
            </div>
            <div class="computers-list">
                ${room.computers.map(computer => {
                    const isOnline = computer.status === 'online';
                    const isSelected = computer.selected && isOnline;
                    return `
                    <div class="computer-item ${isSelected ? 'selected' : ''}" 
                        data-computer-id="${computer.id}"
                        data-room-id="${room.id}">
                      <div class="computer-info">
                        <div class="computer-checkbox ${isSelected ? 'checked' : ''} ${!isOnline ? 'disabled' : ''}">
                        </div>
                        <div class="computer-status ${isOnline ? 'status-online' : 'status-offline'}"></div>
                        <span class="computer-name">${computer.name}</span>
                      </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');

    // Добавляем обработчики кликов для всей области компьютера
    roomsGrid.querySelectorAll('.computer-item').forEach(item => {
        item.addEventListener('click', function() {
            const computerId = parseInt(this.dataset.computerId);
            const roomId = parseInt(this.dataset.roomId);
            const room = window.roomsData.find(r => r.id === roomId);
            if (room) {
                const computer = room.computers.find(c => c.id === computerId);
                const isOnline = computer.status === 'online';
                if (computer && isOnline) {
                    computer.selected = !computer.selected;
                    this.classList.toggle('selected');
                    const checkbox = this.querySelector('.computer-checkbox');
                    if (checkbox) checkbox.classList.toggle('checked');
                    updateSelectedCountArt2();
                    updateDownloadAllButtonArt2();
                }
            }
        });
    });
}

function renderAppsArt2() {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid || !window.readyApps) return;
    
    appsGrid.innerHTML = window.readyApps.map(app => `
        <div class="app-card ${app.selected ? 'selected' : ''}" data-app-id="${app.id}">
            <div class="app-header">
                <div class="app-icon">
                    <i class="${app.icon}"></i>
                </div>
                <div class="app-info">
                    <h4 class="app-name">${app.name}</h4>
                    <div class="app-version">Версия ${app.version}</div>
                </div>
                <div class="app-checkbox ${app.selected ? 'checked' : ''}">
                </div>
            </div>
            <div class="app-description">
                ${app.description}
            </div>
            <div class="app-details">
                <span class="app-size">${app.size}</span>
            </div>
            <button class="app-download-btn" data-app-name="${app.name}">
                <i class="fas fa-download"></i> Скачать
            </button>
        </div>
    `).join('');
    
    // Добавляем обработчики кликов для всей карточки приложения
    appsGrid.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('app-download-btn') && 
                !e.target.classList.contains('app-checkbox')) {
                const appId = parseInt(this.dataset.appId);
                const app = window.readyApps.find(a => a.id === appId);
                if (app) {
                    app.selected = !app.selected;
                    this.classList.toggle('selected');
                    const checkbox = this.querySelector('.app-checkbox');
                    checkbox.classList.toggle('checked');
                    updateDownloadAllButtonArt2();
                }
            }
        });
    });
    
    // Добавляем обработчики для кнопок скачивания отдельных приложений
    appsGrid.querySelectorAll('.app-download-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const appName = this.dataset.appName;
            downloadSingleApp(appName);
        });
    });
}

function updateSelectedCountArt2() {
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
        const selectedComputers = getSelectedComputers();
        selectedCount.textContent = selectedComputers.length;
    }
}

function updateDownloadAllButtonArt2() {
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const selectedFilesCount = document.getElementById('selectedFilesCount');
    const selectedComputersCount = document.getElementById('selectedComputersCount');
    
    if (!downloadAllBtn) return;
    
    const selectedComputers = getSelectedComputers();
    const selectedApps = getSelectedApps();
    const hasSelectedComputers = selectedComputers.length > 0;
    const hasSelectedApps = selectedApps.length > 0;
    
    downloadAllBtn.disabled = !hasSelectedComputers || !hasSelectedApps;
    
    if (selectedFilesCount) selectedFilesCount.textContent = selectedApps.length;
    if (selectedComputersCount) selectedComputersCount.textContent = selectedComputers.length;
    
    if (hasSelectedComputers && hasSelectedApps) {
        downloadAllBtn.innerHTML = `<i class="fas fa-download"></i> Скачать ${selectedApps.length} файлов на ${selectedComputers.length} выбранных компьютеров`;
    } else {
        downloadAllBtn.innerHTML = `<i class="fas fa-download"></i> Скачать файлы на выбранные компьютеры`;
    }
}

function downloadSingleApp(appName) {
    const app = window.readyApps.find(a => a.name === appName);
    if (app) {
        alert(`Начинается скачивание приложения: ${app.name} ${app.version}\nРазмер: ${app.size}`);
    }
}

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
    
    // 🔥 РАЗДЕЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ДЛЯ РАЗНЫХ СТРАНИЦ
    const isArtPage = window.location.pathname === '/' || 
                     window.location.pathname === '/index.html' || 
                     window.location.pathname === '/Art.html';
    
    const isArt2Page = window.location.pathname === '/art2';
    
    if (isArtPage) {
        initializeArtPage();
        
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
    } else if (isArt2Page) {
        initializeArt2Page();
    }
});

// --------------------------------------------
// 10) Глобальные функции для вызова из других скриптов
// --------------------------------------------
window.syncRooms = syncRooms;
window.sendSelectedToServer = sendSelectedToServer;
window.showNotification = showNotification;
window.updatePageData = updatePageData;
window.goToArt2Page = goToArt2Page;

// 🔥 ДОБАВЛЕНЫ ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ Art2.html
window.getAllOnlineComputers = getAllOnlineComputers;
window.getSelectedComputers = getSelectedComputers;
window.getSelectedApps = getSelectedApps;
window.renderRoomsArt2 = renderRoomsArt2;
window.renderAppsArt2 = renderAppsArt2;
window.updateSelectedCountArt2 = updateSelectedCountArt2;
window.updateDownloadAllButtonArt2 = updateDownloadAllButtonArt2;

console.log("✅ sync.js инициализирован");