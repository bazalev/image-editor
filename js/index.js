function updateImage(image, model) {
    image.style.transformOrigin = model.guide.w / 2 +'px ' + model.guide.h / 2 + 'px';
    image.style.transform =
        'scale(' + model.scaleFactor + ') ' +
        'rotate(' + model.angle +  'rad) ' +
        'translate(' + (model.guide.w / 2 - model.midpoint.x) + 'px, ' + (model.guide.h / 2 - model.midpoint.y) + 'px)';
}

function updateCanvas(image, model, canvas) {
    canvas.width = model.guide.w / model.scaleFactor;
    canvas.height = model.guide.h / model.scaleFactor;
    var ctx = canvas.getContext('2d');

    // before each mouse drag reset transformations
    ctx.setTransform(1, 0, 0, 1, model.guide.w / (2 * model.scaleFactor) - model.midpoint.x, model.guide.h / (2 * model.scaleFactor) - model.midpoint.y);

    // rotate around midpoint
    ctx.translate(model.midpoint.x, model.midpoint.y);
    ctx.rotate(model.angle);
    ctx.translate(-model.midpoint.x, -model.midpoint.y);

    ctx.drawImage(image, 0, 0, model.image.w, model.image.h, 0, 0, model.image.w, model.image.h);
}

function updateView(model, guideImages, canvas) {
    if (!guideImages.length) {
        guideImages = [guideImages];
    }

    Array.from(guideImages, function(image) {
        updateImage(image, model);
    });

    updateCanvas(guideImages[0], model, canvas);
}

function getGlobalMidpoint(guideFrame) {
    //TODO: HTML-specific code with magic constants (frame border width = 5px, frame width = 190 and frame height = 244)
    var guideRect = guideFrame.getBoundingClientRect();
    var globalMidpointX = window.pageXOffset + guideRect.left + 5 + 190 / 2;
    var globalMidpointY = window.pageYOffset + guideRect.top + 5 + 244 / 2;

    return { x: globalMidpointX, y: globalMidpointY };
}



var guideFrame = document.getElementById('guide_frame');
var guideImages = [document.getElementById('guide_inner'), document.getElementById('guide_outer')];
// чтобы не навешивать обработчики на каждую картинку, нужен пустой <div>, который будет повторять движения картинок
// а для touch-устройст это вообще единственный способ, чтобы работало как надо
var handle = document.getElementById('handler');
guideImages.push(handle);
var canvas     = document.getElementById('canvas');

guideImages[0].onload = function () {
    var imgW = guideImages[0].width;
    var imgH = guideImages[0].height;
    handle.style.width = imgW + 'px';
    handle.style.height = imgH + 'px';
    var model = new ImageModel(imgW, imgH, {
        fitIn: true,
        angleStep: Math.PI / 2
    });
    updateView(model, guideImages, canvas);

    var moveHandle = new DnD(handle, {
        drag: function(from, to) {
            model.move(from, to);
            updateView(model, guideImages, canvas);
        },
        dragend: function() {
            model.align();
            updateView(model, guideImages, canvas);
        }
    });

    var rotateHandle = new DnD(handle, {
        modifier: 'alt',
        dragstart: function() {
            this._around = getGlobalMidpoint(guideFrame);
        },
        drag: function(from, to) {
            model.rotate(from, to, this._around);
            updateView(model, guideImages, canvas);
        },
        dragend: function() {
            model.align();
            updateView(model, guideImages, canvas);
        }
    });

    var scaleHandle = new DnD(handle, {
        modifier: 'shift',
        dragstart: function() {
            this._around = getGlobalMidpoint(guideFrame);
        },
        drag: function(from, to) {
            model.scale(from, to, this._around);
            updateView(model, guideImages, canvas);
        },
        dragend: function() {
            model.align();
            updateView(model, guideImages, canvas);
        }
    });




    function moveCallback(begin, end) {
        var beginCenter = {x: (begin[0].x + begin[1].x)/2, y: (begin[0].y + begin[1].y)/2};
        var endCenter = {x: (end[0].x + end[1].x)/2, y: (end[0].y + end[1].y)/2};
        var shift = {x: endCenter.x - beginCenter.x, y: endCenter.y - beginCenter.y};
        var from = {x: begin[0].x + shift.x, y: begin[0].y + shift.y};
        var to = {x: end[0].x, y: end[0].y};
        var around = {x: endCenter.x, y: endCenter.y};

        model.move({x: 0, y: 0}, shift);
        model.rotate(from, to, around);
        model.scale(from, to, around);
        updateView(model, guideImages, canvas);
    }
    function endCallback() {
        model.align({ useAngleStep: true });
        updateView(model, guideImages, canvas);
    }

    var prevTouches = [];
    function handleStart(event) {
        if (event.target !== handle) return;
        if (event.touches.length !== 2) return;
        event.preventDefault();

        var touches = [
            {id: event.touches[0].identifier, x: event.touches[0].pageX, y: event.touches[0].pageY},
            {id: event.touches[1].identifier, x: event.touches[1].pageX, y: event.touches[1].pageY}
        ];
        prevTouches = touches.slice();

        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
    }
    function handleMove(event) {
        if (event.touches.length !== 2) return;
        event.preventDefault();

        var touches = [
            {id: event.touches[0].identifier, x: event.touches[0].pageX, y: event.touches[0].pageY},
            {id: event.touches[1].identifier, x: event.touches[1].pageX, y: event.touches[1].pageY}
        ];

        moveCallback(prevTouches, touches);

        prevTouches = touches.slice();
    }

    function handleEnd(event) {
        event.preventDefault();

        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);

        endCallback();
    }
    document.addEventListener('touchstart', handleStart);
};