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
var canvas     = document.getElementById('canvas');

guideImages[0].onload = function () {
    var imgW = guideImages[0].width;
    var imgH = guideImages[0].height;
    var model = new ImageModel(imgW, imgH, { fitIn: true });
    updateView(model, guideImages, canvas);

    Array.from(guideImages, function(img) {
        return new DnD(img, {
            drag: function(from, to) {
                model.move(from, to);
                updateView(model, guideImages, canvas);
            },
            dragend: function() {
                model.align();
                updateView(model, guideImages, canvas);
            }
        });
    });

    Array.from(guideImages, function(img) {
        return new DnD(img, {
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
    });

    Array.from(guideImages, function(img) {
        return new DnD(img, {
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
    });
};