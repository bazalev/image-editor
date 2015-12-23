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

}



var guideFrame = document.getElementById('guide_frame');
var guideImg = document.getElementById('guide_img');
var canvas = document.getElementById('canvas');

//TODO: HTML-specific code with magic constants (frame border width = 5px, frame width = 190 and frame height = 244)
var guideRect = guideFrame.getBoundingClientRect();
var globalMidpointX = window.pageXOffset + guideRect.left + 5 + 190 / 2;
var globalMidpointY = window.pageYOffset + guideRect.top + 5 + 244 / 2;


guideImg.onload = function () {
    window.model = new ImageModel(guideImg.width, guideImg.height, true);

    // perform guide view
    updateImage(guideImg, model);

    // perform source view
    updateCanvas(guideImg, model, canvas);

    var moveImg = new DnD(guideImg, {
        drag: function(from, to) {
            model.move(from, to);

            // perform guide view
            updateImage(guideImg, model);

            // perform source view
            updateCanvas(guideImg, model, canvas);
        }
    });

    var rotateImg = new DnD(guideImg, {
        modifier: 'alt',
        drag: function(from, to) {
            model.rotate(from, to, { x: globalMidpointX, y: globalMidpointY });

            // perform guide view
            updateImage(guideImg, model);

            // perform source view
            updateCanvas(guideImg, model, canvas);
        }
    });

    var scaleImg = new DnD(guideImg, {
        modifier: 'shift',
        drag: function(from, to) {
            model.scale(from, to, { x: globalMidpointX, y: globalMidpointY });

            // perform guide view
            updateImage(guideImg, model);

            // perform source view
            updateCanvas(guideImg, model, canvas);
        }
    });
};