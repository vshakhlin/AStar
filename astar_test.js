/**
 * Функция рисует клетки, расставляет препятствия задает начальную и конечную точку и запускает поиск пути
 * @param {Object} context Контекст для рисования
 * @param {Number} mapSize Размер карты
 * @param {Number} cellSize Размер ячейки
 */
function draw(context, mapSize, cellSize) {
    /** @type {Number} Счетчик ячеек */
    var countCell = 0;
    /** @type {Number} @constant Стена, непроходимое препятствие */
    var WALL = 1;
    /** @type {Number} @constant Начальная точка */
    var START = 2;
    /** @type {Number} @constant Конечная точка */
    var END = 3;
    /** @type {Array} Карта. Массив из n элементов, поле mapSize на mapSize клеток */
    var map = new Array(mapSize*mapSize);
    // Создание карты
    for (var indexMap = 0; indexMap < map.length; indexMap++) {
        map[indexMap] = 0;
    }
    // Генерирация стен случайным образом
    for (var wall=0; wall<40; wall++) {
        map[Math.floor(Math.random()*map.length)] = WALL;
    }
    // Генерирация начальной и конечной точки
    /** @type {Number} Начальная точка */
    var start = Math.floor(Math.random()*map.length);
    /** @type {Number} Конечная точка */
    var end = Math.floor(Math.random()*map.length);

    // Начальная точка не должна равняться конечной
    if (start == end) {
        start++;
    }
    map[start] = START;
    map[end] = END;

    // Устанавливается шрифт
    context.font = (cellSize/4)+"px Arial";
    // Отрисовка карты. Стены черные, Начальная точка зеленая, конечная красная
    for (var row = 0; row < mapSize; row++) {
        for (var col = 0; col < mapSize; col++) {
            switch (map[row*mapSize + col]) {
                case WALL:
                    context.fillStyle = "#000000";
                    break;
                case START:
                    context.fillStyle = "#008000";
                    break;
                case END:
                    context.fillStyle = "#cc0000";
                    break;
                default:
                    if ((row + col) % 2 == 0) {
                        context.fillStyle = "#e5e5e5";
                    } else {
                        context.fillStyle = "#ffffff";
                    }
                    break;
            }
            context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
            // Установка цвета шрифта. Если стена, то белый, во всех остальных случаях черный
            if (map[row*mapSize + col] == WALL) {
                context.fillStyle = "#ffffff";
            } else {
                context.fillStyle = "#000000";
            }
            // Выводиться номер ячейки на экран
            context.fillText(++countCell, row * cellSize + cellSize / 2 - 10, col * cellSize + cellSize / 2 + 5);
        }
    }
    // Расчитываеться путь
    var path = Djagat.path.AStar.findPath({
        startX: Math.floor(start/mapSize),
        startY: start % mapSize,
        endX: Math.floor(end/mapSize),
        endY: end % mapSize,
        map: map,
        obstacles: [WALL],
        diagonal: Djagat.getEl('isDiagonal').checked,
        context: context,
        cellSize: cellSize
    });
    // Если путь найден
    if (path.length != 0) {
        // Устанавливается цвета и шрифты
        context.fillStyle = "#008000";
        context.fillRect(Math.floor(start/mapSize) * cellSize, start%mapSize * cellSize, cellSize, cellSize);
        context.fillStyle = "#000000";
        context.font = (cellSize/4)+"px Arial";
        context.fillText("0", Math.floor(start/mapSize) * cellSize + cellSize / 2 - 5, start%mapSize * cellSize + cellSize / 2 + 5);
        // Проход в цикле по всем точкам из массива пути и отображение их на экране
        for (var indexPath = 0, pathLen = path.length; indexPath < pathLen; indexPath++) {
            var x = path[indexPath].x;
            var y = path[indexPath].y;
            var g = path[indexPath].g;
            var h = path[indexPath].h;
            var f = path[indexPath].f;
            if (indexPath == (path.length-1)) {
                context.fillStyle = "#cc0000";
            } else {
                context.fillStyle = "#808080";
            }
            context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            context.fillStyle = "#000000";
            context.font = (cellSize/4)+"px Arial";
            context.fillText(""+(parseInt(indexPath)+1), x * cellSize + cellSize / 2 - 5, y * cellSize + cellSize / 2 + 5);
            context.font = (cellSize/6)+"px Arial";
            context.fillText(f, x * cellSize + 5, y * cellSize + 10);
            context.fillText(g, x * cellSize + 5, y * cellSize + cellSize - 5);
            context.fillText(h, x * cellSize + cellSize - 14, y * cellSize + cellSize - 5);
        }
    }
}

Djagat.onReady(function() {
    // Размер ячейки
    var cellSize = 64;
    // Размер карты
    var mapSize = 10;
    // Создаем и добавляем на страницу элемент canvas на нем будет происходить все рисование
    Djagat.createCanvas('canvas', cellSize * mapSize, cellSize * mapSize);
    draw(Djagat.getContext(), mapSize, cellSize);
    Djagat.getEl('restart').onclick = function () { draw(Djagat.getContext(), mapSize, cellSize); };
});
