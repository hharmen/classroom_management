document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.getElementById('backBtn');
    const selectAllAppsBtn = document.getElementById('selectAllAppsBtn');

    backBtn.addEventListener('click', function() {
        window.location.href = './';
    });

    selectAllAppsBtn.addEventListener('click', function() {
        if (!window.readyApps || window.readyApps.length === 0) {
            return;
        }
        
        const allSelected = window.readyApps.every(app => app.selected);
        
        window.readyApps.forEach(app => {
            app.selected = !allSelected;
        });
        
        if (window.renderAppsArt2) {
            window.renderAppsArt2();
        }
        if (window.updateDownloadAllButtonArt2) {
            window.updateDownloadAllButtonArt2();
        }
    });

    function loadRoomsData() {
        fetch('/rooms')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки rooms.json');
                return response.json();
            })
            .then(data => {
                window.roomsData = data;

                if (window.roomsData && Array.isArray(window.roomsData)) {
                    window.roomsData.forEach(room => {
                        if (room.computers && Array.isArray(room.computers)) {
                            room.computers.forEach(computer => {
                                if (computer.selected === undefined) {
                                    computer.selected = false;
                                }
                            });
                        }
                    });
                }
                
                if (window.renderRoomsArt2) window.renderRoomsArt2();
                if (window.updateSelectedCountArt2) window.updateSelectedCountArt2();
                if (window.updateDownloadAllButtonArt2) window.updateDownloadAllButtonArt2();
            })
            .catch(err => {
                document.getElementById('roomsGrid').innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Ошибка загрузки данных комнат
                    </div>
                `;
            });
    }

    function loadAppsData() {
        fetch('/apps')
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки apps.json');
                return response.json();
            })
            .then(data => {
                window.readyApps = data;

                if (window.readyApps && Array.isArray(window.readyApps)) {
                    window.readyApps.forEach(app => {
                        if (app.selected === undefined) {
                            app.selected = false;
                        }
                    });
                }
                
                if (window.renderAppsArt2) window.renderAppsArt2();
                if (window.updateDownloadAllButtonArt2) window.updateDownloadAllButtonArt2();
            })
            .catch(err => {
                document.getElementById('appsGrid').innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Ошибка загрузки данных приложений
                    </div>
                `;
            });
    }

    loadRoomsData();
    loadAppsData();
});