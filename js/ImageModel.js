/**
 * Represents image model for movements, rotations and scales
 * @constructor
 * @param {number} imgW - real (not scaled) image width.
 * @param {number} imgH - real (not scaled) image height.
 * @param {object} settings - model settings
 * @param {boolean} settings.fitIn - change scale and position to fit image in guide frame (if true, performs once at init time)
 */
function ImageModel(imgW, imgH, settings) {
    this.guide = { w: 190,  h: 244  }; /* направляющая рамка, менять можно, но только при инициализации, дальше неизменно */
    this.image = { w: imgW, h: imgH }; /* после загрузки картинки эти значения больше не меняются, хотя ничего страшного не произойдет если поменять */
    this.scaleFactor = 1;

    this.angle = 0;
    this.midpoint = { x: this.image.w / 2, y: this.image.h / 2 };

    if (settings.fitIn) {
        this._fitIn();
    }
}
ImageModel.prototype._fitIn = function() {
    var wScale = this.guide.w / this.image.w;
    var hScale = this.guide.h / this.image.h;

    this.scaleFactor = Math.max(wScale, hScale);

    // чтобы показать пользователю что картинку можно скейлить, сделаем ее чуть больше guide-рамки
    //var overlapScale = 1.2;
    //this.scaleFactor *= overlapScale;
};
ImageModel.prototype._unscale = function(scaled) {
    var unscaled = {};

    ['x', 'y', 'w', 'h'].forEach(function(key) {
        if (scaled[key] !== undefined) {
            unscaled[key] = scaled[key] / this.scaleFactor;
        }
    }.bind(this));

    return unscaled;
};
ImageModel.prototype.move = function(from, to) {
    from = this._unscale(from);
    to = this._unscale(to);

    var delta = {
        x: to.x - from.x,
        y: to.y - from.y
    };

    // повернем вектор delta на угол -this.angle
    // например, если пользователь повернул картинку на 90гр то координаты x и y должны поменяться местами
    // иначе у пользователя будет взрыв мозга
    var deltaRotated = {
        x: delta.x * Math.cos(-this.angle) - delta.y * Math.sin(-this.angle),
        y: delta.x * Math.sin(-this.angle) + delta.y * Math.cos(-this.angle)
    };

    this.midpoint.x -= deltaRotated.x;
    this.midpoint.y -= deltaRotated.y;
};
ImageModel.prototype.rotate = function(from, to, around) {
    from = this._unscale(from);
    to = this._unscale(to);
    around = this._unscale(around);

    var A = { x: from.x - around.x, y: from.y - around.y };
    var B = { x: to.x   - around.x, y: to.y   - around.y };
    // посчитаем скалярное произведение 2-мя способами:
    // 1. через координаты векторов
    var dotProduct = A.x * B.x + A.y * B.y;
    // 2. через длины векторов и угол между ними
    var absA = Math.sqrt(A.x * A.x + A.y * A.y);
    var absB = Math.sqrt(B.x * B.x + B.y * B.y);
    // откуда и найдем угол между ними
    var deltaAngle = Math.acos(dotProduct / (absA * absB));

    // чтобы найти знак deltaAngle, посчитаем векторное произведение - определитель матрицы, столбцы которой построены
    // из координат соответсвенно вектора, от которого поворачиваемся, и вектора, к которому поворачиваемся,
    // т.к. система координат левая, то со знаком минус (на самом деле не так - надо разобраться почему),
    var crossProduct = A.x * B.y - B.x * A.y;
    deltaAngle *= Math.sign(crossProduct);

    this.angle += deltaAngle;
};
ImageModel.prototype.rotateBy = function(angle) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var around = { x: 0, y: 0 };
    var from = { x: 1, y: 0 };
    var to = {
        x: from.x * cos - from.y * sin,
        y: from.x * sin + from.y * cos
    };

    this.rotate(from, to, around);
};
ImageModel.prototype.scale = function(from, to, around) {
    from = this._unscale(from);
    to = this._unscale(to);
    around = this._unscale(around);

    var A = { x: from.x - around.x, y: from.y - around.y };
    var B = { x: to.x   - around.x, y: to.y   - around.y };
    var absA = Math.sqrt(A.x * A.x + A.y * A.y);
    var absB = Math.sqrt(B.x * B.x + B.y * B.y);

    var deltaScale = absB / absA;

    this.scaleFactor *= deltaScale;
};
ImageModel.prototype.scaleBy = function(percent) {
    this.scaleFactor *= 1 + percent;
};

ImageModel.prototype._movePoint = function(point, to) {
    return {
        x: point.x + to.x,
        y: point.y + to.y
    };
};
ImageModel.prototype._rotatePoint = function(point, angle) {
    return {
        x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
        y: point.x * Math.sin(angle) + point.y * Math.cos(angle)
    };
};

/**
 * Move and (maybe) scale image to avoid blank areas
 */
ImageModel.prototype.align = function() {
    // TODO: По-хорошему, чтобы избавиться от непонятного кода, который идет далее, пора уже выделять новые классы,
    // TODO: типа Point(x: number, y: number), Vector(begin: Point, end: Point) и Rect(v1: Point, v2: Point, v3: Point, v4: Point)
    // TODO: с методами Point.prototype.rotate(angle), Vector.prototype.rotate(angle) и Rect.prototype.rotate(angle).
    // TODO: А тажже полезно иметь класс Transformation который на основе вышеуказанных классов позволял бы переводить
    // TODO: всё из одной системы координат, допустим связанной с картинкой, в другую систему координат, связанную с
    // TODO: рамкой, (и при этом повернутую и сдвинутую относительно первой) и обратно - это сильно упростило бы код всего ImageModel

    // переводим вершины guide-а в систему координат, связанную с картинкой
    // для чего сначала восстановим размеры guide-а без учета scaleFactor-а
    var guideUnscaled = this._unscale(this.guide);
    // затем поместим центр guide-а в левый верхний угол картики
    var guideVertexes = [
        {x: -guideUnscaled.w/2, y: -guideUnscaled.h/2}, // top left
        {x:  guideUnscaled.w/2, y: -guideUnscaled.h/2}, // top right
        {x:  guideUnscaled.w/2, y:  guideUnscaled.h/2}, // bottom right
        {x: -guideUnscaled.w/2, y:  guideUnscaled.h/2}  // bottom left
    ].map(function(vertex) {
        // после чего повернем guide
        return this._rotatePoint(vertex, -this.angle);
    }.bind(this)).map(function(vertex) {
        // и вернем его в this.midpoint
        return this._movePoint(vertex, this.midpoint);
    }.bind(this));

    // теперь находим 4-х угольный guideBoundingBox стороны которого должны быть параллельны сторонам картинки
    var xSorted = Array.from(guideVertexes).sort(function(a, b) { return a.x - b.x });
    var ySorted = Array.from(guideVertexes).sort(function(a, b) { return a.y - b.y });
    var guideBoundingBox = {
        //topLeft: { x: xSorted[0].x, y: ySorted[0].y },
        //bottomRight: { x: xSorted[3].x, y: ySorted[3].y },
        x: xSorted[0].x,
        y: ySorted[0].y,
        w: xSorted[3].x - xSorted[0].x,
        h: ySorted[3].y - ySorted[0].y
    };

    // если масштаба недостаточно, сначала меняем scaleFactor, а потом всё перезапускаем по второму кругу
    // иначе как не двигай, картинка никогда не покроет guideBoundingBox
    var deltaScale = Math.max(guideBoundingBox.w / this.image.w, guideBoundingBox.h / this.image.h);
    if (deltaScale > 1) {
        this.scaleFactor *= deltaScale;
        this.align();
        return;
    }

    var deltaMove = {x: 0, y: 0};
    // масштаба достаточно, но guideBoundingBox все еще не покрыт картинкой слева
    if (guideBoundingBox.x < 0) {
        deltaMove.x = -guideBoundingBox.x;
    // или справа
    } else if (guideBoundingBox.x + guideBoundingBox.w - this.image.w > 0) {
        deltaMove.x = -(guideBoundingBox.x + guideBoundingBox.w - this.image.w);
    }
    // аналогично сверху или снизу
    if (guideBoundingBox.y < 0) {
        deltaMove.y = -guideBoundingBox.y;
    } else if (guideBoundingBox.y + guideBoundingBox.h - this.image.h > 0) {
        deltaMove.y = -(guideBoundingBox.y + guideBoundingBox.h - this.image.h);
    }

    // возвращаемся в систему координат, связанную с рамкой
    deltaMove = this._rotatePoint(deltaMove, this.angle);
    deltaMove.x *= this.scaleFactor;
    deltaMove.y *= this.scaleFactor;

    // и двигаем картинку так, чтобы не осталось пустых областей
    this.move({x: deltaMove.x, y: deltaMove.y}, {x: 0, y: 0});
};