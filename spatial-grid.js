// spatial-grid.js
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    getCellKey(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }
    
    insert(object, x, y) {
        const key = this.getCellKey(x, y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(object);
    }
    
    query(x, y, radius) {
        const results = [];
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        const radiusInCells = Math.ceil(radius / this.cellSize);
        
        for (let i = cellX - radiusInCells; i <= cellX + radiusInCells; i++) {
            for (let j = cellY - radiusInCells; j <= cellY + radiusInCells; j++) {
                const key = `${i},${j}`;
                const cell = this.grid.get(key);
                if (cell) {
                    results.push(...cell);
                }
            }
        }
        
        return results;
    }
    
    clear() {
        this.grid.clear();
    }
}