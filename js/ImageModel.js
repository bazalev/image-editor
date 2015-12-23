function ImageModel(imgW, imgH, accomodate) {
    this.guide = { w: 190,  h: 244  }; /* направляющая рамка, менять можно, но только при инициализации, дальше неизменно */
    this.image = { w: imgW, h: imgH }; /* после загрузки картинки эти значения больше не меняются, хотя ничего страшного не произойдет если поменять */
    this.scaleFactor = 1;

    this.angle = 0;
    this.midpoint = { x: this.image.w / 2, y: this.image.h / 2 };

    if (accomodate) {
        this._accomodate();
    }
}
ImageModel.prototype._accomodate = function() {
    var wScale = this.guide.w / this.image.w;
    var hScale = this.guide.h / this.image.h;

    this.scaleFactor = Math.max(wScale, hScale);

    // чтобы показать пользователю что картинку можно скейлить, сделаем ее чуть больше guide-рамки
    var overlapScale = 1.2;
    this.scaleFactor *= overlapScale;
};
ImageModel.prototype._unscale = function(point) {
    return {
        x: point.x / this.scaleFactor,
        y: point.y / this.scaleFactor
    };
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