document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const nestedTable = document.getElementById('nestedTable');
    const connectionStatus = document.getElementById('connectionStatus');
    const refreshBtn = document.getElementById('refreshTable');
    const toggleExpandBtn = document.getElementById('toggleExpandBtn');
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    
    // Данные приложения (изначально пустые)
    let roomsData = [];
    let isConnected = false;
    let isAllExpanded = false;

    uploadFilesBtn.addEventListener('click', function() {
        if (!isConnected) {
        alert('Нет подключения к серверу');
        return;
        }

        // Переходим на страницу
        console.log('🔗 Переход на страницу выбора файлов...');
        window.location.href = '/art2';
    });

    // Имитация подключения к серверу
    function connectToServer() {
        console.log('🔄 Подключение к серверу...');

        setTimeout(() => {
        console.log('✅ Подключение установлено');
        isConnected = true;
        connectionStatus.innerHTML = `
            <i class="fas fa-check-circle" style="color: #28a745;"></i>
            <span>Подключено к серверу</span>
        `;
        connectionStatus.className = 'connection-status connected';
        
        // После подключения запрашиваем данные
        loadDataFromServer();
        }, 2000);
    }
    
    // Функция для загрузки данных из rooms.json
    function loadDataFromServer() {
        console.log('📥 Загрузка данных из rooms.json...');
        
        // Показываем сообщение о загрузке
        nestedTable.innerHTML = `
        <div class="loading-message">
            <div class="spinner"></div>
            <h4>Загрузка данных...</h4>
            <p>Получение информации о комнатах и компьютерах</p>
        </div>
        `;

        fetch('rooms.json?t=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки rooms.json');
            return response.json();
        })
        .then(data => {
            // Проверяем: если data массив — используем напрямую, если объект с ключом "rooms" — берем data.rooms
            if (Array.isArray(data)) {
            roomsData = data;
            } else if (data.rooms && Array.isArray(data.rooms)) {
            roomsData = data.rooms;
            } else {
            throw new Error('Некорректный формат rooms.json');
            }
            renderNestedTable(); // отрисовка таблицы
        })
        .catch(err => {
            console.error('Ошибка загрузки rooms.json:', err);
            alert('Не удалось загрузить данные комнат. Проверьте наличие файла rooms.json и правильность пути.');
        });
    }

    // Показать сообщение об ошибке
    function showErrorMessage(message) {
        connectionStatus.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
        <span>${message}</span>
        `;
        connectionStatus.className = 'connection-status error';
        
        nestedTable.innerHTML = `
        <div class="empty-message">
            <i class="fas fa-exclamation-triangle fa-2x mb-3" style="color: #dc3545;"></i>
            <h4>Ошибка загрузки</h4>
            <p>${message}</p>
        </div>
        `;
    }

    // Инициализация приложения
    function initApp() {
        // Начинаем подключение к серверу
        connectToServer();
        
        // Обработчики кнопок таблицы
        refreshBtn.addEventListener('click', function() {
        if (!isConnected) {
            alert('Нет подключения к серверу');
            return;
        }
        loadDataFromServer();
        });
        
        // Обработчик переключения развертывания/свертывания
        toggleExpandBtn.addEventListener('click', function() {
        if (roomsData.length === 0) {
            alert('Данные еще не загружены');
            return;
        }
        
        isAllExpanded = !isAllExpanded;
        
        roomsData.forEach(room => {
            room.expanded = isAllExpanded;
            room.computers.forEach(computer => {
            computer.expanded = isAllExpanded;
            });
        });
        
        // Обновляем состояние кнопки
        if (isAllExpanded) {
            toggleExpandBtn.classList.add('expanded');
        } else {
            toggleExpandBtn.classList.remove('expanded');
        }
        
        renderNestedTable();
        });
    }
    
    // Функция отрисовки вложенной таблицы
    function renderNestedTable() {
        if (roomsData.length === 0) {
        nestedTable.innerHTML = `
            <div class="empty-message">
            <i class="fas fa-door-closed fa-2x mb-3"></i>
            <h4>Нет данных</h4>
            <p>Комнаты и компьютеры не найдены</p>
            </div>
        `;
        return;
        }
        
        nestedTable.innerHTML = roomsData.map(room => `
        <div class="room-row ${room.expanded ? 'expanded' : ''}" data-room-id="${room.id}">
            <div class="room-header">
            <div class="room-info">
                <div class="triangle-icon"></div>
                <span class="room-name">${room.name}</span>
                <span class="room-code">${room.code}</span>
            </div>
            <div class="room-stats">
                <span><i class="fas fa-desktop"></i> ${room.computers.length} компьютеров</span>
                <span><i class="fas fa-file"></i> ${getTotalFilesInRoom(room)} файлов</span>
            </div>
            </div>
        </div>
        ${room.expanded ? `
            <div class="room-computers">
            ${room.computers.map(computer => `
                <div class="computer-row ${computer.expanded ? 'expanded' : ''}" data-computer-id="${computer.id}">
                <div class="computer-header">
                    <div class="computer-info">
                    <div class="triangle-icon triangle-icon-blue"></div>
                    <div class="computer-status status-${computer.status}"></div>
                    <div>
                        <div class="computer-name">${computer.name}</div>
                        <div class="computer-ip">${computer.ip}</div>
                    </div>
                    </div>
                    <div class="computer-stats">
                    <div class="last-active">${computer.lastActive}</div>
                    <span><i class="fas fa-file"></i> ${computer.files.length} файлов</span>
                    </div>
                </div>

                </div>
                ${computer.expanded ? `
                <div class="files-history">
                    ${computer.files.length > 0 ? `
                    <table class="files-table">
                        <thead>
                        <tr>
                            <th>Файл</th>
                            <th>Размер</th>
                            <th>Тип</th>
                            <th>Статус</th>
                        </tr>
                        </thead>
                        <tbody>
                        ${computer.files.map(file => `
                            <tr class="file-row">
                            <td>
                                <div class="file-info">
                                <i class="fas fa-file${getFileIcon(file.type)} file-icon"></i>
                                <div class="file-details">
                                    <div class="file-name">${file.name}</div>
                                </div>
                                </div>
                            </td>
                            <td>${file.size}</td>
                            <td>${file.type}</td>
                            <td>
                                <span class="status-badge status-${file.status}">
                                ${getStatusText(file.status)}
                                </span>
                            </td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                    ` : `
                    <div class="empty-message" style="padding-left: 80px;">
                        <i class="fas fa-inbox fa-lg mb-2"></i>
                        <p>На этом компьютере нет файлов</p>
                    </div>
                    `}
                </div>
                ` : ''}
            `).join('')}
            </div>
        ` : ''}
        `).join('');
        
        // Добавляем обработчики кликов для разворачивания/сворачивания
        nestedTable.querySelectorAll('.room-row').forEach(row => {
        row.addEventListener('click', function() {
            const roomId = parseInt(this.dataset.roomId);
            const room = roomsData.find(r => r.id === roomId);
            if (room) {
            room.expanded = !room.expanded;
            renderNestedTable();
            }
        });
        });
        
        nestedTable.querySelectorAll('.computer-row').forEach(row => {
        row.addEventListener('click', function(e) {
            e.stopPropagation();
            const computerId = parseInt(this.dataset.computerId);
            const computer = findComputerById(computerId);
            if (computer) {
            computer.expanded = !computer.expanded;
            renderNestedTable();
            }
        });
        });
    }
    
    // Вспомогательные функции
    function getFileIcon(fileType) {
        const icons = {
        'PDF документ': '-pdf',
        'Word документ': '-word',
        'Excel таблица': '-excel',
        'Архив': '-archive',
        'Изображение': '-image',
        'Python скрипт': '-code',
        'База данных': '-database'
        };
        return icons[fileType] || '';
    }
    
    function getStatusText(status) {
        const statusMap = {
        'pending': 'В обработке',
        'uploaded': 'Загружен',
        'error': 'Ошибка'
        };
        return statusMap[status] || status;
    }
    
    function findComputerById(computerId) {
        for (const room of roomsData) {
        const computer = room.computers.find(comp => comp.id === computerId);
        if (computer) return computer;
        }
        return null;
    }
    
    function getTotalFilesInRoom(room) {
        return room.computers.reduce((total, computer) => total + computer.files.length, 0);
    }
    
    // Инициализация приложения
    initApp();
    });