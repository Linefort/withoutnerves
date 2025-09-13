// app.js
// Элементы
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const videoBackground = document.getElementById('video-background');
const backgroundMusic = document.getElementById('background-music');
const loadMessage = document.getElementById('load-message');

// Состояние
const points = [];
const mouse = { x: null, y: null, radius: CONFIG.mouseRadius };
let started = false;
let animationId = null;
let spatialGrid = null;

// Инициализация
function init() {
    setupCanvas();
    setupEventListeners();
    createPoints();
    
    if (CONFIG.useSpatialGrid) {
        spatialGrid = new SpatialGrid(CONFIG.gridCellSize);
    }
    
    animate();
}

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setupEventListeners() {
    document.addEventListener('click', startExperience);
    document.addEventListener('keydown', startExperience);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    videoBackground.addEventListener('loadeddata', () => console.log("Видео загружено"));
    videoBackground.addEventListener('error', handleVideoError);
    backgroundMusic.addEventListener('error', handleAudioError);
}

function handleMouseMove(event) {
    mouse.x = event.x;
    mouse.y = event.y;
}

function handleResize() {
    setupCanvas();
    createPoints();
    
    if (CONFIG.useSpatialGrid) {
        spatialGrid = new SpatialGrid(CONFIG.gridCellSize);
    }
}

function handleVideoError() {
    loadMessage.textContent = "Ошибка загрузки видео";
    document.getElementById('video-container').style.display = 'none';
}

function handleAudioError() {
    loadMessage.textContent = "Ошибка загрузки аудио";
    console.log('Аудио не загрузилось');
}

function startExperience() {
    if (started) return;
    
    started = true;
    loadMessage.textContent = "Starting...";
    
    videoBackground.play().catch(console.error);
    playAudioFromTime(CONFIG.audioStartTime);
    
    setTimeout(() => loadMessage.style.display = 'none', 2000);
    
    document.removeEventListener('click', startExperience);
    document.removeEventListener('keydown', startExperience);
}

function playAudioFromTime(time) {
    backgroundMusic.volume = CONFIG.audioVolume;
    backgroundMusic.currentTime = time;
    backgroundMusic.loop = true;
    
    backgroundMusic.play().catch(e => {
        console.log("Ошибка воспроизведения аудио:", e);
        
        backgroundMusic.addEventListener('canplaythrough', () => {
            backgroundMusic.volume = CONFIG.audioVolume;
            backgroundMusic.currentTime = time;
            backgroundMusic.play().catch(console.error);
        }, { once: true });
    });
}

function createPoints() {
    points.length = 0; // Очищаем массив
    const numberOfPoints = (canvas.width * canvas.height) / CONFIG.pointCountDivisor;
    
    for (let i = 0; i < numberOfPoints; i++) {
        points.push(new Point(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        ));
    }
}

// Оптимизированная функция анимации
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Обновление spatial grid
    if (CONFIG.useSpatialGrid) {
        spatialGrid.clear();
        for (const point of points) {
            spatialGrid.insert(point, point.x, point.y);
        }
    }
    
    // Обновление и отрисовка точек
    for (let i = 0; i < points.length; i++) {
        points[i].update(canvas, mouse);
        points[i].draw(ctx);
    }
    
    // Соединение точек
    if (CONFIG.useSpatialGrid) {
        // Используем spatial grid для оптимизации
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const nearbyPoints = spatialGrid.query(point.x, point.y, CONFIG.connectionDistance);
            
            for (const otherPoint of nearbyPoints) {
                if (point === otherPoint) continue;
                
                const dx = point.x - otherPoint.x;
                const dy = point.y - otherPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.connectionDistance) {
                    drawConnection(point, otherPoint, distance);
                }
            }
            
            // Соединение точек с курсором
            if (mouse.x !== null && mouse.y !== null) {
                const dx = point.x - mouse.x;
                const dy = point.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.cursorDistance) {
                    drawCursorConnection(point, distance);
                }
            }
        }
    } else {
        // Старый метод (для fallback)
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dx = points[i].x - points[j].x;
                const dy = points[i].y - points[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.connectionDistance) {
                    drawConnection(points[i], points[j], distance);
                }
            }
            
            // Соединение точек с курсором
            if (mouse.x !== null && mouse.y !== null) {
                const dx = points[i].x - mouse.x;
                const dy = points[i].y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.cursorDistance) {
                    drawCursorConnection(points[i], distance);
                }
            }
        }
    }
    
    animationId = requestAnimationFrame(animate);
}

function drawConnection(pointA, pointB, distance) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(52, 152, 219, ${1 - distance/CONFIG.connectionDistance})`;
    ctx.lineWidth = 0.7;
    ctx.moveTo(pointA.x, pointA.y);
    ctx.lineTo(pointB.x, pointB.y);
    ctx.stroke();
}

function drawCursorConnection(point, distance) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(149, 165, 166, ${1 - distance/CONFIG.cursorDistance})`;
    ctx.lineWidth = 0.8;
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
}

// Запуск приложения
window.addEventListener('load', () => {
    backgroundMusic.preload = "auto";
    init();
});

// Очистка при размонтировании
window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
});