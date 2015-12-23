/*
 * Drag and Drop
 */
function DnD (element, settings) {
    this.dragstartCallbacks = [];
    this.dragCallbacks = [];
    this.dragendCallbacks = [];
    this.element = element;
    this.settings = settings || {};
    if (this.settings.dragstart) {
        this.dragstartCallbacks.push(this.settings.dragstart);
    }
    if (this.settings.drag) {
        this.dragCallbacks.push(this.settings.drag);
    }
    if (this.settings.dragend) {
        this.dragendCallbacks.push(this.settings.dragend);
    }

    this.bindedDragstart = this._dragstart.bind(this);
    this.bindedDrag = this._drag.bind(this);
    this.bindedDragend = this._dragend.bind(this);

    document.addEventListener('mousedown', this.bindedDragstart);
}
DnD.prototype.bind = function(phaseName, callback) {
    this[phaseName + 'Callbacks'].push(callback);
};
DnD.prototype._checkModifier = function(e) {
    // if settings.modifier not set start drag and drop only when none of the modifier key pressed
    var modifierPressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
    if (!this.settings.modifier && !modifierPressed) {
        return true;
    }
    if (this.settings.modifier && e[this.settings.modifier + 'Key']) {
        return true;
    }
    return false;
};
DnD.prototype._callback = function(name) {
    var callbackArgs = [].slice.call(arguments, 1);
    this[name+'Callbacks'].forEach(function(callback) {
        callback.apply(this.element, callbackArgs);
    }.bind(this));
};
DnD.prototype._dragstart = function(event) {
    event.preventDefault();

    if (event.target !== this.element) return;

    // если инициализировали, например, с { modifier: 'shift' }, то Drag and Drop стартует только с зажатым Shift-ом
    if (!this._checkModifier(event)) return;

    this.prevPageX = event.pageX;
    this.prevPageY = event.pageY;
    document.addEventListener('mousemove', this.bindedDrag);
    document.addEventListener('mouseup', this.bindedDragend);
    this._callback('dragstart');
};
DnD.prototype._drag = function(event) {
    event.preventDefault();

    this._callback('drag', { x: this.prevPageX, y: this.prevPageY }, { x: event.pageX, y: event.pageY });

    this.prevPageX = event.pageX;
    this.prevPageY = event.pageY;
};
DnD.prototype._dragend = function(event) {
    event.preventDefault();

    document.removeEventListener('mousemove', this.bindedDrag);
    document.removeEventListener('mouseup', this.bindedDragend);
    this._callback('dragend');
};