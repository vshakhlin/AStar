/**
 * Библиотека
 */
var Djagat = (function() {
    var context = null;
    return {
        /**
         * Событие готовности приложения. Запускается по событию загрузки окна
         * @param {Function} fn Функция, которая запускается после загрузки
         * @event
         */
        onReady: function(fn) {
            window.onload = fn;
        },
        /**
         * Создание экзепляра объекта на основе переданного
         * @param {Object} obj объект на основе которго создается экземпляр
         * @param {Object} params параметры для нинициализаци объекта
         * @returns {F}
         */
        create: function(obj, params) {
            var F = function() {};
            F.prototype = obj;
            var newObj = new F();
            newObj.constructor(params);
            return newObj;
        },
        /**
         * Создание холста для рисования
         * @param {String} id id элемена для отображения холста
         * @param {Number} width ширина холста
         * @param {Number} height высота холста
         */
        createCanvas: function(id, width, height) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            document.getElementById(id).appendChild(canvas);
            context = canvas.getContext('2d');
        },
        /**
         * Вохвращает контекст холста
         * @returns {Object} контекст
         */
        getContext: function() {
            return context;
        },
        /**
         * Получение Dom элемената по id
         * @param {String} id id элемента
         * @return Dom элемент
         */
        getEl: function(id) {
            return document.getElementById(id);
        }
    }
}());
Djagat.path = Djagat.path || {};

/**
 * Модуль поиск пути алгоритмом A*
 * Пример использования:
 var path = Djagat.path.AStar.findPath({
        startX: 2,
        startY: 3,
        endX: 7,
        endY: 6,
        map: map,
        obstacles: [1],
        diagonal: false,
        context: context,
        cellSize: cellSize
    });
 */
Djagat.path.AStar = (function() {
    /**
     * private
     * @type {Array} deltasSimple Направления движения влево, вправо, вверх и вниз
     */
    var deltasSimple = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    /**
     * private
     * @type {Array} deltasDiagonal Направления движения с диагоналями, по восьми направлениям
     */
    var deltasDiagonal = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

    /**
     * private
     * @type {Array} openList открытый список
     */
    var openList = null;

    /**
     * private
     * @type {Array} closeList закрытый список
     */
    var closeList = null;

    /**
     * Функция проверяет находиться ли уже узел с координатами x и y в открытом или закрытом списке
     * private
     * @param {Array} list список
     * @param {Number} x кооридната x
     * @param {Number} y кооридната y
     * @return {Number} i возвращает номер найденого узла в списке или -1 если не нашли
     */
    function isAlreadyList(list, x, y) {
        for (var i = 0, len = list.length; i < len; i++) {
            if (list[i].x == x && list[i].y == y) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Сортируем открытый список по возрастанию стоимости клетки (F)
     * private
     * @param {Object} a узел
     * @param {Object} b узел
     * @return {Number} возвращает 1 если F первого узла больше F второго -1 в обратном случае и 0 если они равны
     */
    function sortList(a, b) {
        if (a.f > b.f) { return 1; }
        else if (a.f < b.f) { return -1; }
        else { return 0; }
    }

    return {
        constructor: function(params) {
        },

        /**
         * Поиск пути
         * @param {Object} params Параметры для расчета пути:
         * {
         *  {Number} startX кооридната x стартовой точки
         *  {Number} startY кооридната y стартовой точки
         *  {Number} endX кооридната x конечной точки
         *  {Number} endY кооридната y конечной точки
         *  {Array} map карта, массив точек или массив массивов точек
         *  {Array} obstacles массив значений непроходимых препядствий
         *  {Boolean} diagonal возможно ли прохождение по диагоналям
         * }
         * @returns {Array} Массив точек найденого пути
         */
        findPath: function(params) {
            var i, x, y, g1, g2;
            // Инициализируем открытый и закрытый списки
            openList = [];
            closeList = [];
            // Координата x стартовой точки
            var startX = params.startX || 0;
            // Координата y стартовой точки
            var startY = params.startY || 0;
            // Координата x конечной точки
            var endX = params.endX || 0;
            // Координата y конечной точки
            var endY = params.endY || 0;
            // Карта может быть как в виде массива массивов, так и в виде одинарного массива
            var map = params.map;
            // Массив значений непроходимых препядствий
            var obstacles = params.obstacles;
            // Флаг какая карта, если в виде массива массивов isSimpleMap = false, если в виде одинарного массива isSimpleMap = true
            var isSimpleMap = !(map[0].length > 0);
            // Ширина и высота карты
            var mapWidth, mapHeight;
            if (isSimpleMap) {
                mapWidth = mapHeight = Math.sqrt(map.length);
            } else {
                mapWidth = map.length;
                mapHeight = map[0].length;
            }
            // Направления движения, выбираются в зависимости от флага diagonal - возможно ли прохождение по диагоналям
            var deltas = params.diagonal ? deltasDiagonal : deltasSimple;
            var deltasLength = deltas.length;
            // Контекст для рисования и размер ячейки
            // TODO: Эти параметры можно удалить, они нужны только для демонтрации работы
            var context = params.context;
            var cellSize = params.cellSize;

            // Инициализируем стартовый узел
            var startNode = Djagat.create(Djagat.path.Node, { x: startX, y: startY });
            // Добавляем начальный узел к открытому списку
            openList.push(startNode);
            var currentNode;
            // Делаем текущим первый узел из открытого списка и удаляем его оттуда.
            while (currentNode = openList.shift()) {
                // Перемещаем его в закрытый список
                closeList.push(currentNode);
                // Проверяем достигли ли мы уже конечной точки
                if(currentNode.x == endX && currentNode.y == endY) {
                    var curr = currentNode;
                    var path = [];
                    // Проходимся по всем родителям начиная от текущей точки, это и будет наш путь
                    while(curr.parent) {
                        path.push(curr);
                        curr = curr.parent;
                    }
                    // Возвращаем найденный путь, предварительно поменяв порядок элементов на обратный (задом-наперед)
                    return path.reverse();
                }
                // Проходми по всем направлениям
                for (i = 0; i < deltasLength; i++) {
                    // Координаты соседней точки в зависимости от направления
                    x =  currentNode.x + deltas[i][0];
                    y =  currentNode.y + deltas[i][1];
                    // Проверяем входит ли точка в пределы карты
                    if (x >= 0 && y >= 0 && x < mapWidth && y < mapHeight) {
                        // Если точка проходима и не находиться в закрытом списке
                        var isAlreadyClose = isAlreadyList(closeList, x, y);
                        var currentCellMap = isSimpleMap ? map[x*mapWidth+y] : map[x][y];
                        if (obstacles.indexOf(currentCellMap) === -1 && isAlreadyClose === -1) {
                            // Если точка еще не в открытом списке
                            var isAlreadyOpen = isAlreadyList(openList, x, y);
                            if (isAlreadyOpen === -1) {
                                // Создаем соседнюю точку
                                var neighbor = Djagat.create(Djagat.path.Node, { x: x, y: y });
                                // Делаем текущую клетку родительской для это клетки
                                neighbor.parent = currentNode;
                                // Рассчитываем H - эвристическое значение расстояния от ТЕКУЩЕЙ клетки до КОНЕЧНОЙ (только по вертикали или горизонтали, и не учитываются преграды на пути)
                                neighbor.calculateH(endX, endY);
                                // Рассчитываем G - стоимость передвижения из стартовой точки A к данной клетке, следуя найденному пути к этой клетке
                                neighbor.g = currentNode.g + neighbor.calculateG(currentNode.x, currentNode.y);
                                // Рассчитываем f как сумму g и h
                                neighbor.f = neighbor.g + neighbor.h;
                                // Добавляем к открытому списку
                                openList.push(neighbor);
                                // Рисуем f, g и h на клетке
                                // TODO: Эти код можно удалить, он нужны только для демонтрации работы
                                context.fillStyle = "#000000";
                                context.font = (cellSize/6)+"px Arial";
                                context.fillText(neighbor.f, x * cellSize + 5, y * cellSize + 10);
                                context.fillText(neighbor.g, x * cellSize + 5, y * cellSize + cellSize - 5);
                                context.fillText(neighbor.h, x * cellSize + cellSize - 14, y * cellSize + cellSize - 5);
                            }
                            // Если точка уже в открытом списке то проверяем, не дешевле ли будет путь через эту клетку
                            else {
                                g1 = openList[isAlreadyOpen].g;
                                // Пересчитываем G для ячейки из открытого списка относительно текущей ячейки
                                g2 = currentNode.g + openList[isAlreadyOpen].calculateG(currentNode.x, currentNode.y);
                                // Для сравнения используем стоимость G
                                if (g1 > g2) {
                                    // Если это так, то меняем родителя клетки на текущую клетку
                                    openList[isAlreadyOpen].parent = currentNode;
                                    // Устанавливаем новое пересчитанное g
                                    openList[isAlreadyOpen].g = g2;
                                }
                            }
                        }
                    }
                }
                // Сортируем список по возрастанию F
                if (openList.length > 1) {
                    openList.sort(sortList);
                }
            }
            // Если путь не найден, возвращаем пустой массив
            return [];
        }
    }
}());

/**
 * Модуль узел.
 * Всмопокательный модуль для расчета поиска пути в модуле @link Djagat.path.AStar
 * Каждый узел имеет координаты x и y, необходимые для расчета параметры f, g и h и родительский узел
 */
Djagat.path.Node = (function() {
    return {
        /** @type {Number} x координата x узла */
        x: 0,
        /** @type {Number} y координата y узла */
        y: 0,
        /** @type {Number} g стоимость передвижения из одного узла к данному узлу */
        g: 0,
        /** @type {Number} h эвристическое значение расстояния от ТЕКУЩЕГО узла до КОНЕЧНОГО (только по вертикали или горизонтали, и не учитываются преграды на пути) */
        h: 0,
        /** @type {Number} f сумма h и g */
        f: 0,
        /** @type {Node} parent родительский узел */
        parent: null,

        /**
         * Конструктор
         * @constructor         *
         * @param {Object} params Параметры x и y координаты узла
         */
        constructor: function(params) {
            this.x = params.x || 0;
            this.y = params.y || 0;
        },

        /**
         * Расчитывает H - эвристическое значение расстояния от ТЕКУЩЕЙ клетки до КОНЕЧНОЙ (только по вертикали или горизонтали, и не учитываются преграды на пути)
         * @param {Number} endX кооридната x конечной точки
         * @param {Number} endY кооридната y конечной точки
         */
        calculateH: function(endX, endY) {
            this.h = (Math.abs(this.x - endX) + Math.abs(this.y - endY)) * 10;
        },

        /**
         * Расчитывает G - стоимость передвижения из стартовой точки A к данной клетке, следуя найденному пути к этой клетке
         * @param {Number} currentX кооридната x текущей точки
         * @param {Number} currentY кооридната y текущей точки
         * @return {Number} возвращает 14 если перемещене по диагонали и 10 если то вертикале или горизонтали
         */
        calculateG: function (currentX, currentY) {
            if (this.x != currentX && this.y != currentY) {
                return 14;
            }
            return 10;
        }
    }
}());
