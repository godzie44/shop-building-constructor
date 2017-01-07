/**
 * Created by godzie@yandex.ru.
 * Date: 7.07.2016
 */

'use strict';


function ConstructorError(message) {
    this.message = (
        message || ""
    );
}

ConstructorError.prototype = new Error();

/**
 * generate unique id
 * @returns {string}
 */
fabric.generateUID = function () {
    return '_' + Math.random().toString(36).substr(2, 9);
};

let isCompare = function (a1, a2) {
    let a1c = a1.slice(0);
    let a2c = a2.slice(0);
    a1c.sort();
    a2c.sort();
    return a1c.length == a2c.length && a1c.every((v, i)=>v === a2c[i])
};

/**
 * buildin main abstract
 */
let building = {

    init: function (canvas, controls) {

        this.canvas = canvas;
        this.floors = [];
        this.stairs = new ConnectStructure('stair', canvas);
        this.elevators = new ConnectStructure('elevator', canvas);
        this.travolators = new ConnectStructure('travolator', canvas);
        this.rooms = new RoomManager(canvas);
        this.compass = new CompassManager(canvas);

        this.userInterface = controls;

        this.userInterface.init(canvas, this);

        canvas.refreshGrid();
    },


    saveRoom(name, instance){
        this.rooms.add(name, this.activeFloorName, instance);
    },

    _saveActiveFloor() {
        if (this.activeFloorName) {
            this._rewriteFloor(this.activeFloorName, this._minimizeFloorData(this.canvas.toObject().objects));
        }
    },

    addFloor: function (number) {
        this.floors.push(this.getDummyFloor(number));
        this.userInterface.addFloor(number);
    },

    _floorByNumber(number){
        return this.floors.find(el => el.number === number);
    },

    _rewriteFloor(number, value){
        this.floors[this.floors.indexOf(this._floorByNumber(number))] = value;
    },

    switchFloor: function (number) {
        this._saveActiveFloor();
        try {
            this.canvas.clear();
        }
        catch (e) {
        }
        this.canvas.refreshGrid();

        if (this.isDummyFloor(number)) {

        } else {
            this._expandMapData(this._floorByNumber(number));
        }

        this.canvas.renderAll();
        this._showConnectors(number);
        this.rooms.showOnFloor(number);
        this.compass.showOnFloor();
        return this.activeFloorName = number;
    },

    isDummyFloor(number){
        if (!this._floorByNumber(number)) {
            return true;
        }

        let floor = this._floorByNumber(number);
        return floor.walls.length === 0 && floor.readers.length === 0 && floor.stacks.length === 0 && floor.beacons.length === 0;
    },

    _showConnectors: function (floor) {
        this.stairs.showOnFloor(floor);
        this.elevators.showOnFloor(floor);
        this.travolators.showOnFloor(floor);
    },

    deleteFloor: function (number) {
        if (number === this.activeFloorName) {
            throw new ConstructorError("delete active floor");
        }
        delete this.floors[this.floors.indexOf(this._floorByNumber(number))];
    },

    load: function (schema) {
        try {
            let data = JSON.parse(schema);
            let floors = data.floors;

            this.userInterface.setFloorList(floors);
            this.floors = data.floors;

            this.stairs.data = data.stairs;
            this.elevators.data = data.elevators;
            this.travolators.data = data.travolators;
            this.rooms.data = data.rooms;
            if (data.compass !== undefined) {
                this.compass.data = data.compass;
            } else {
                this.compass.data = [];
            }

            this.switchFloor(this.floors[0].number);
        }
        catch (e) {
            this.activeFloorName = '1';
            this.addFloor(this.activeFloorName);
            this.switchFloor(this.activeFloorName);
        }
    },

    save(){
        this._saveActiveFloor();

        let building = {};
        let floors = this.floors;

        building.floors = floors;
        building.stairs = this.stairs.data;
        building.elevators = this.elevators.data;
        building.travolators = this.travolators.data;
        building.compass = this.compass.data[0];
        building.rooms = this.rooms.data;

        return JSON.stringify(building);
    },

    _expandMapData: function (data, active = true) {
        for (let obj of data.walls) {
            WallConstructor.createFromObject(this.canvas, obj, active);
            for (let window of obj.windows) {
                WindowConstructor.createFromObject(this.canvas, window, active);
            }
            for (let door of obj.doors) {
                DoorConstructor.createFromObject(this.canvas, door, active);
            }
        }
        for (let obj of data.beacons) {
            BeaconConstructor.createFromObject(this.canvas, obj);
        }
        for (let obj of data.readers) {
            ReaderConstructor.createFromObject(this.canvas, obj);
        }
        for (let obj of data.stacks) {
            StackConstructor.createFromObject(this.canvas, obj);
        }
    },

    getDummyFloor(number){
        let floor = {};
        floor.number = number;
        floor.walls = [];
        floor.beacons = [];
        floor.readers = [];
        floor.stacks = [];
        return floor;
    },

    _minimizeFloorData(objects){
        let floor = this.getDummyFloor(this.activeFloorName);

        for (let obj of objects) {
            let newObj;
            let childObj;
            switch (obj.type) {
                case 'wallLine':
                {
                    newObj = {
                        x1: Math.round(obj.x1),
                        x2: Math.round(obj.x2),
                        y1: Math.round(obj.y1),
                        y2: Math.round(obj.y2),
                        id: obj.id,
                        doors: [],
                        windows: []
                    };
                    for (let obj2 of objects) {
                        if(obj2.type === 'wallObjectLine' && obj2.owner == obj.id){
                            childObj = {
                                distanceStart: Math.round(obj2.distanceStart),
                                distanceEnd: Math.round(obj2.distanceEnd),
                                owner: obj2.owner,
                                id: obj2.id
                            };
                            if (obj2.instance === 'window') {
                                newObj.windows.push(childObj);
                            } else {
                                newObj.doors.push(childObj);
                            }
                        }
                    }

                    floor.walls.push(newObj);
                    break;
                }
                case 'beacon':
                {
                    newObj = {
                        x: Math.round(obj.left),
                        y: Math.round(obj.top),
                        name: obj.name,
                        heightAboveTheFloor: obj.heightAboveTheFloor,
                        uuid: obj.uuid,
                        major: obj.major,
                        minor: obj.minor,
                        password: obj.password,
                        id: obj.id
                    };
                    floor.beacons.push(newObj);
                    break;
                }
                case 'reader':
                {
                    newObj = {
                        x: Math.round(obj.left),
                        y: Math.round(obj.top),
                        heightAboveTheFloor: obj.heightAboveTheFloor,
                        mac: obj.mac,
                        id: obj.id
                    };
                    floor.readers.push(newObj);
                    break;
                }
                case 'stack':
                {
                    newObj = {
                        x: Math.round(obj.left),
                        y: Math.round(obj.top),
                        scaleX: obj.scaleX,
                        scaleY: obj.scaleY,
                        id: obj.id
                    };
                    floor.stacks.push(newObj);
                    break;
                }
                default:
                    newObj = null;
            }
        }

        return floor;
    },

    loadStackData(data){
        if (Array.isArray(data) && data.length === 0) {
            this.stackData = {};
        } else {
            this.stackData = data;
        }
    },

    addStack(id){
        if (this.stackData[id] === undefined) {
            this.stackData[id] = [];
        }
    },

    deleteStack(id){
        delete this.stackData[id];
    },

    addProductToStack(product, stack){
        this.stackData[stack].push(product);
    },

    deleteProductFromStack(product, stack){
        this.stackData[stack].splice(this.stackData[stack].indexOf(product), 1);
    },

    getObjectsJson: function (objectType) {
        this._saveActiveFloor();
        let floors = this.floors;

        let list = {};
        for (let floor of floors) {
            list[floor.number] = floor[objectType];
        }

        return JSON.stringify(list);
    },
}


/**
 * before delete event
 */
fabric.Object.prototype.beforeDelete = function () {
    return 0;
};

/**
 * @var unique id of object
 */
fabric.Object.prototype.id = null;

/**
 * @inheritdoc
 */
fabric.Object.prototype.toObject = (function (toObject) {
    return function () {
        return fabric.util.object.extend(toObject.call(this), {
            id: this.id
        });
    };
})(fabric.Object.prototype.toObject);

/**
 * @inheritdoc
 */
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

/**
 * @inheritdoc
 */
fabric.Canvas.prototype.loadFromJSON = (function (method) {
    return function (json) {
        let result = method.call(this, json);
        this.refreshGrid();
        return result;
    };
})(fabric.Canvas.prototype.loadFromJSON);

/**
 * @link https://github.com/kangax/fabric.js/issues/3104
 * @inheritdoc
 */
fabric.Canvas.prototype._enlivenObjects = function (objects, callback, reviver) {
    var _this = this;

    if (!objects || objects.length === 0) {
        callback && callback();
        return;
    }

    var renderOnAddRemove = this.renderOnAddRemove;
    this.renderOnAddRemove = false;

    fabric.util.enlivenObjects(objects, function (enlivenedObjects) {
        enlivenedObjects.forEach(function (obj, index) {
            _this.insertAt(obj, index, false);
        });

        _this.renderOnAddRemove = renderOnAddRemove;
        callback && callback();
    }, null, reviver);
};

/**
 * sort objects before render all. This makes rules like z-index
 * @inheritdoc
 */
fabric.Canvas.prototype.renderAll = (function (method) {
    return function () {
        function sortObject(canvas) {

            if (canvas._objects[canvas._objects.length - 1] instanceof fabric.Object && canvas._objects[canvas._objects.length - 1].type !== 'wallNode') {
                for (let obj of canvas._objects) {
                    if (obj.type === 'wallNode') {
                        canvas._objects.splice(canvas._objects.indexOf(obj), 1);
                        canvas._objects.push(obj);
                    }

                    if (obj.type === 'wallLine') {
                        canvas._objects.splice(canvas._objects.indexOf(obj), 1);
                        canvas._objects.unshift(obj);
                    }
                }

                for (let obj of canvas._objects) {
                    if (obj.type === 'gridLineX' || obj.type === 'gridLineY') {
                        canvas._objects.splice(canvas._objects.indexOf(obj), 1);
                        canvas._objects.unshift(obj);
                    }
                }
            }
        }

        if (this._objects !== undefined) {
            sortObject(this);
        }


        return method.call(this);
    };
})(fabric.Canvas.prototype.renderAll);

/**
 * @param id
 * @returns fabric.Object
 */
fabric.Canvas.prototype.findById = function (id) {
    return this.getObjects().find(function (o) {
        return o.id === id;
    });
};


fabric.Canvas.prototype.gridStep = settings.GRID.STEP.LARGE_ZOOM;

/**
 * draw background grid
 * @param {number} step step in px
 */
fabric.Canvas.prototype.refreshGrid = function () {
    let zoomValue = this.getZoom();
    let topLeftPointReal = {
        x: (
               -this.viewportTransform[4]
           ) / zoomValue,
        y: (
               -this.viewportTransform[5]
           ) / zoomValue
    };

    let gridStep = settings.GRID.STEP.LARGE_ZOOM;
    let strokeWidth = settings.GRID.STROKE_WIDTH.LARGE_ZOOM;

    if (zoomValue <= 0.3) {
        gridStep = settings.GRID.STEP.LOW_ZOOM;
        strokeWidth = settings.GRID.STROKE_WIDTH.LARGE_ZOOM;
    } else if (zoomValue < 0.8) {
        gridStep = settings.GRID.STEP.MEDIUM_ZOOM;
        strokeWidth = settings.GRID.STROKE_WIDTH.MEDIUM_ZOOM;
    }

    //округляем точку начала рисования до кратности шагу рисования, добавляем 1 дополнительный шаг
    let topLeftPoint = {
        x: topLeftPointReal.x - (
            topLeftPointReal.x % gridStep
        ) - gridStep,
        y: topLeftPointReal.y - (
            topLeftPointReal.y % gridStep
        ) - gridStep
    };

    let screenWidth = this.getWidth() / zoomValue + gridStep;
    let screenHeight = this.getHeight() / zoomValue + gridStep;

    let gridLineX = this.getObjects('gridLineX');
    let gridLineY = this.getObjects('gridLineY');


    let self = this;
    let createGrid = function () {
        self.renderOnAddRemove = false;
        for (let x = topLeftPoint.x; x < topLeftPoint.x + screenWidth; x += gridStep) {
            let line = gridLineX.find(el => el.x1 === x);
            if (line !== undefined) {
                line.set({
                    y1: topLeftPoint.y,
                    y2: topLeftPoint.y + screenHeight
                });
                continue;
            }

            let xLine = new fabric.Line([x, topLeftPoint.y, x, topLeftPoint.y + screenHeight], {
                type: 'gridLineX',
                fill: 'gray',
                stroke: 'gray',
                strokeWidth: (
                                 x % (
                                     gridStep * 5
                                 )
                             ) === 0 ? strokeWidth * 3 : strokeWidth,
                selectable: false,
                excludeFromExport: true
            });

            xLine.hoverCursor = 'default';
            self.add(xLine);
        }
        for (let y = topLeftPoint.y; y < topLeftPoint.y + screenHeight; y += gridStep) {
            let line = gridLineY.find(el => el.y1 === y);
            if (line !== undefined) {
                line.set({
                    x1: topLeftPoint.x,
                    x2: topLeftPoint.x + screenWidth
                });
                continue;
            }

            let yLine = new fabric.Line([topLeftPoint.x, y, topLeftPoint.x + screenWidth, y], {
                type: 'gridLineY',
                fill: 'gray',
                stroke: 'gray',
                strokeWidth: (
                                 y % (
                                     gridStep * 5
                                 )
                             ) === 0 ? strokeWidth * 3 : strokeWidth,
                selectable: false,
                excludeFromExport: true
            });

            yLine.hoverCursor = 'default';
            self.add(yLine);
        }
        self.renderOnAddRemove = true;
    };


    if (gridLineX.length === 0 && gridLineY.length === 0) {
        createGrid();
        return;
    }

    if (this.gridStep !== gridStep) {
        this.renderOnAddRemove = false;
        this.remove(...gridLineX);
        this.remove(...gridLineY);
        this.renderOnAddRemove = true;
        gridLineX = [];
        gridLineY = [];
        this.gridStep = gridStep;
    }

    createGrid();
};

/**
 * node of the wall
 * @class
 */
fabric.WallNode = fabric.util.createClass(fabric.Circle, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            top: options.top,
            left: options.left,
            fill: settings.WALL.NODE.FILL,
            stroke: settings.WALL.NODE.STROKE,
            radius: settings.WALL.NODE.RADIUS,
            strokeWidth: settings.WALL.NODE.STROKE_WIDTH,
            hasControls: false
        }));


        this.type = 'wallNode';
        this.instance = 'wall';
        this.id = options.id ? options.id : fabric.generateUID();


        this.inLines = options.inLines;
        this.outLines = options.outLines;

        options.lineIn && this.connectWallLineIn(options.lineIn);
        options.lineOut && this.connectWallLineOut(options.lineOut);

        this.on('modified', function () {
            for (let id of this.inLines) {
                let inLine = this.canvas.findById(id);
                inLine.deletePrompt();
            }

            for (let id of this.outLines) {
                let outLine = this.canvas.findById(id);
                outLine.deletePrompt();
            }

            this.canvas.forEachObject((obj) => {
                if (obj === this || obj.type !== 'wallNode') return;
                if (this.intersectsWithObject(obj)) {
                    obj.remove();
                    this.set({
                        left: obj.left,
                        top: obj.top
                    });
                    this.bringToFront();

                    for (let inLine of obj.inLines) {
                        this.connectWallLineIn(this.canvas.findById(inLine));
                    }
                    for (let outLine of obj.outLines) {
                        this.connectWallLineOut(this.canvas.findById(outLine));
                    }

                    this.triggerMoving();
                }
            });
        });

        this.on('moving', function (options) {
            let pointer = this.canvas.getPointer(options.e);

            let blockedX = false, blockedY = false;

            let afterModify = {
                x: 0,
                y: 0
            };

            for (let id of this.inLines) {
                let inLine = this.canvas.findById(id);
                if (inLine) {
                    let modifyLine = GeometryHelper.convertToRightAngle({
                        x1: inLine.x1,
                        y1: inLine.y1,
                        x2: pointer.x,
                        y2: pointer.y
                    });

                    if (modifyLine.x2 !== pointer.x || modifyLine.y2 !== pointer.y) {
                        if (modifyLine.x2 === pointer.x) {
                            blockedY = true;
                            afterModify.y = modifyLine.y2;
                        }
                        if (modifyLine.y2 === pointer.y) {
                            blockedX = true;
                            afterModify.x = modifyLine.x2;
                        }
                    }
                }
            }

            for (let id of this.outLines) {
                let outLine = this.canvas.findById(id);
                if (outLine) {
                    let modifyLine = GeometryHelper.convertToRightAngle({
                        x1: outLine.x2,
                        y1: outLine.y2,
                        x2: pointer.x,
                        y2: pointer.y
                    });

                    if (modifyLine.x2 !== pointer.x || modifyLine.y2 !== pointer.y) {
                        if (modifyLine.x2 === pointer.x) {
                            blockedY = true;
                            afterModify.y = modifyLine.y2;
                        }
                        if (modifyLine.y2 === pointer.y) {
                            blockedX = true;
                            afterModify.x = modifyLine.x2;
                        }
                    }
                }
            }

            this.setCoords();

            this.triggerMoving();

            // on other wallNode hover effects
            this.canvas.forEachObject((obj) => {
                if (obj === this || obj.type !== 'wallNode') return;
                obj.setOpacity(this.intersectsWithObject(obj) ? 0.7 : 1);
                obj.set({radius: this.intersectsWithObject(obj) ? 15 : settings.WALL.NODE.RADIUS});
            });
        });


    },

    triggerMoving(){
        for (let inLine of this.inLines) {
            this.canvas.findById(inLine).trigger('ownerMove', {target: this});
        }
        for (let outLine of this.outLines) {
            this.canvas.findById(outLine).trigger('ownerMove', {target: this});
        }
    },

    /**
     * @param {fabric.WallLine} line
     */
    deleteChildLine(line){
        this.deleteOutLine(line);
        this.deleteInLine(line);
    },

    deleteOutLine(line){
        let lineIndex = this.outLines.indexOf(line.id);
        if (lineIndex !== -1) {
            this.outLines.splice(lineIndex, 1);
        }
    },

    deleteInLine(line){
        let lineIndex = this.inLines.indexOf(line.id);
        if (lineIndex !== -1) {
            this.inLines.splice(lineIndex, 1);
        }
    },

    /**
     * connect inbox line to node
     * @param {fabric.WallLine} line
     */
    connectWallLineIn(line){
        this.inLines.push(line.id);
        line.addInOwner(this);
    },

    /**
     * connect outbox line to node
     * @param {fabric.WallLine} line
     */
    connectWallLineOut(line){
        this.outLines.push(line.id);
        line.addOutOwner(this);
    },


    /**
     * actions before delete
     */
    beforeDelete: function () {

        for (let id of this.inLines) {
            let inLine = this.canvas.findById(id);
            if (inLine) {
                for (let i = 0; i < inLine.owners.length; i++) {
                    if (inLine.owners[i] !== this.id) {
                        let owner = this.canvas.findById(inLine.owners[i]);
                        owner.outLines.splice(owner.outLines.indexOf(id), 1);
                    }
                }

                for (let i = 0; i < inLine.childs.length; i++) {
                    let child = this.canvas.findById(inLine.childs[i]);
                    child.beforeDelete();
                    child.remove();
                }

                inLine.remove();
            }
        }

        for (let id of this.outLines) {
            let outLine = this.canvas.findById(id);
            if (outLine) {
                for (let i = 0; i < outLine.owners.length; i++) {
                    if (outLine.owners[i] !== this.id) {
                        let owner = this.canvas.findById(outLine.owners[i]);
                        owner.inLines.splice(owner.inLines.indexOf(id), 1);
                    }
                }

                for (let i = 0; i < outLine.childs.length; i++) {
                    let child = this.canvas.findById(outLine.childs[i]);
                    child.beforeDelete();
                    child.remove();
                }
                outLine.remove();
            }
        }
    },

    /**
     * call when canvas save in JSON
     * @returns {*|Object}
     */
    toObject: function () {
        return {
            left: this.left,
            top: this.top,
            type: this.type,
            id: this.id,
            inLines: this.inLines,
            instance: this.instance,
            outLines: this.outLines,
        };
    }

});

/**
 * Returns fabric.WallNode instance from an object representation
 * @static
 * @param {Object} object Object to create an instance from
 * @return fabric.WallNode instance of fabric.WallNode
 */
fabric.WallNode.fromObject = function (object) {
    return new fabric.WallNode(object);
};

/**
 * line of the wall
 * @class
 */
fabric.WallLine = fabric.util.createClass(fabric.Line, {
    initialize: function (coords, options) {
        this.callSuper('initialize', coords, fabric.util.object.extend(options, {
            stroke: settings.WALL.LINE.STROKE,
            perPixelTargetFind: settings.WALL.LINE.PER_PIXEL_TARGET_FIND,
            strokeWidth: settings.WALL.LINE.STROKE_WIDTH
        }));
        this.hasControls = this.hasBorders = false;
        this.prompt = null;
        this.type = 'wallLine';
        this.instance = 'wall';
        this.id = options.id ? options.id : fabric.generateUID();
        this.owners = options.owners;
        this.childs = options.childs;
        /**
         * @param {fabric.Object} child
         */
        this.addChild = function (child) {
            this.childs.push(child.id);
        };

        /**
         * @param {fabric.WallNode} owner
         */
        this.addInOwner = function (owner) {
            this.owners[1] = owner.id;
        };

        /**
         * @param {fabric.WallNode} owner
         */
        this.addOutOwner = function (owner) {
            this.owners[0] = owner.id;
        };

        this.on('added', function () {
            let lineCoords = {
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            };
            let long = GeometryHelper.getLineLong(lineCoords);
            let isVisible = long > 100;
            let textPoint = GeometryHelper.getMiddlePoint(lineCoords);
            let angle = GeometryHelper.getLineAngel({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            });
            this.text = new fabric.Text(Math.floor(long).toString(), {
                fontWeight: settings.WALL.LINE.TEXT.FONT_WEIGHT,
                fontSize: settings.WALL.LINE.TEXT.FONT_SIZE,
                excludeFromExport: true,
                visible: isVisible,
                left: textPoint.x,
                top: textPoint.y,
                fill: settings.WALL.LINE.TEXT.FILL,
                angle: angle,
                selectable: false,
                owner: this
            });
            this.canvas.add(this.text);
            this.text.setCoords();
        });

        this.on('ownerMove', function (e) {
            if (e.target.inLines.indexOf(this.id) !== -1) {
                this.showPrompt('end');
            } else {
                this.showPrompt('start');
            }


            this._redraw();
        });

        this.on('removed', function () {
            for (let childId of this.childs) {
                let child = this.canvas.findById(childId);
                child.trigger('ownerRemoved', {target: this});
            }
        });

        this.on('childRemoved', function (e) {
            this.childs.splice(this.childs.indexOf(e.target.id), 1);
        });
    },

    _redraw(){
        let outOwner = this.canvas.findById(this.owners[0]),
            inOwner = this.canvas.findById(this.owners[1]);
        this.set({
            x1: outOwner.left,
            y1: outOwner.top,
            x2: inOwner.left,
            y2: inOwner.top
        });
        this.setCoords();

        for (let childId of this.childs) {
            let child = this.canvas.findById(childId);
            child.trigger('ownerMove', {target: this});
        }
    },

    getOwner(i){
        return this.canvas.findById(this.owners[i]);
    },

    getChild(i){
        return this.canvas.findById(this.childs[i]);
    },

    hasOwner(id){
        return this.owners.indexOf(id) !== -1;
    },

    remove() {
        if (this.text) {
            this.text.remove();
        }
        this.deletePrompt();
        this.callSuper('remove');
    },

    showPrompt(position){
        let textPoint;

        let offsetTop = this.canvas.getZoom() < 1.1 ? 10 * (
            1.4 / this.canvas.getZoom()
        ) : 14;
        let offset = this.canvas.getZoom() < 1 ? 30 * (
            1.2 / this.canvas.getZoom()
        ) : 50;

        if (position === 'start') {
            textPoint = GeometryHelper.getPointOnLine({
                x1: this.x2,
                y1: this.y2,
                x2: this.x1,
                y2: this.y1
            }, offset, offsetTop);
        } else {
            textPoint = GeometryHelper.getPointOnLine({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            }, offset, offsetTop);
        }

        let angle = GeometryHelper.getLineAngel({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        });
        let long = Math.floor(
            GeometryHelper.getLineLong({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            }));

        if (this.prompt !== null) {
            if (long < 30) {
                this.prompt.visible ? this.prompt.visible = false : null;
                return;
            } else {
                !this.prompt.visible ? this.prompt.visible = true : null;
            }
        }

        let fontSize = this.canvas.getZoom() < 1 ? 18 * (
            1 / this.canvas.getZoom()
        ) : 18;
        if (this.prompt === null) {
            this.prompt = new fabric.Text(long.toString(), {
                fontWeight: settings.WALL.LINE.PROMPT.FONT_WEIGHT,
                fontSize: fontSize,
                excludeFromExport: true,
                left: textPoint.x,
                top: textPoint.y,
                visible: long >= 30,
                fill: settings.WALL.LINE.PROMPT.FILL,
                angle: angle,
                selectable: false
            });
            this.canvas.add(this.prompt);
        } else {
            if (long !== this.prompt.getText()) {
                this.prompt.set({
                    fontSize: fontSize,
                    left: textPoint.x,
                    top: textPoint.y,
                    angle: angle,
                    text: long.toString()
                });
            }
        }
    },

    deletePrompt() {
        try {
            this.prompt.remove();
            this.prompt = null;
        }
        catch (e) {
            this.prompt = null;
        }
    },

    /**
     * execute when wall line long change
     * @private
     */
    _refreshLong() {
        if (!this.text) {
            return this;
        }

        let long = Math.floor(GeometryHelper.getLineLong({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        }));

        if (long < 100) {
            return this.text.set({visible: false});
        }


        if (!this.text.visible) {
            this.text.set({visible: true});
        }
        let textPoint = GeometryHelper.getMiddlePoint({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        });
        let angle = GeometryHelper.getLineAngel({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        });

        this.text.set({
            left: textPoint.x,
            top: textPoint.y,
            angle: angle
        });
        this.text.setText(long.toString());

    },

    set: function (key, value) {
        this.callSuper('set', key, value);
        this._refreshLong();
    },

    toObject: function () {
        return {
            x1: this.x1,
            x2: this.x2,
            y1: this.y1,
            y2: this.y2,
            owners: this.owners,
            childs: this.childs,
            id: this.id,
            type: this.type
        };
    }
});

/**
 * Returns fabric.WallLine instance from an object representation
 * @static
 * @param {Object} object to create an instance from
 * @return fabric.WallLine instance of fabric.WallLine
 */
fabric.WallLine.fromObject = function (object) {
    var points = [object.x1, object.y1, object.x2, object.y2];
    return new fabric.WallLine(points, object);
};

/**
 * windows and doors nodes
 * @class
 */
fabric.WallObjectNode = fabric.util.createClass(fabric.Circle, {
    initialize: function (options) {
        this.callSuper('initialize', options);
        this.type = 'wallObjectNode';
        this.id = options.id ? options.id : fabric.generateUID();

        if (options.line instanceof fabric.Object) {
            this.line = options.line.id;
            options.line.addControls(this);
        } else {
            this.line = options.line;
            this.getLine.addControls(this);
        }

        this.hasControls = false;
        this.nodeType = options.nodeType;

        this.getLine = function () {
            return this.canvas.findById(this.line);
        };

        this.on('moving', function (e) {
            if (e.e !== null) {
                let parent = this.getLine().getOwner();
                let pointer = this.canvas.getPointer(e.e);
                let {x,y} = GeometryHelper.putPointOnLine({
                    x: pointer.x,
                    y: pointer.y
                }, {
                    x1: parent.x1,
                    y1: parent.y1,
                    x2: parent.x2,
                    y2: parent.y2
                });

                this.left = x;
                this.top = y;
            }
            this.getLine().trigger('controlMove', {target: this});
        });

        this.on('ownerMove', function (e) {
            if (this.nodeType === 'end') {
                this.left = e.target.x2;
                this.top = e.target.y2;
            } else {
                this.left = e.target.x1;
                this.top = e.target.y1;
            }
            this.setCoords();
        });

        this.on('removed', function () {
            let line = this.getLine();
            if (line) {
                line.trigger('controlRemoved', {target: this});
            }
        });

        this.on('ownerRemoved', function () {
            this.remove();
        });
    },

    toObject: function () {
        return {
            left: this.left,
            top: this.top,
            type: this.type,
            id: this.id,
            instance: this.instance,
            parent: this.parent,
            line: this.line,
            nodeType: this.nodeType
        };
    }
});

/**
 * Returns fabric.WallObjectNode instance from an object representation
 * @static
 * @param {Object} object Object to create an instance from
 * @return fabric.WallObjectNode instance of fabric.WallObjectNode
 */
fabric.WallObjectNode.fromObject = function (object) {

    if (object.instance === 'window') {
        return WindowConstructor._createObjectNode(object.left, object.top, object.line, object.nodeType, object.parent,
            object.id);
    } else {
        return DoorConstructor._createObjectNode(object.left, object.top, object.line, object.nodeType, object.parent,
            object.id);
    }
    //return new fabric.WallObjectNode(object);
};

/**
 * windows and doors lines
 * @class
 */
fabric.WallObjectLine = fabric.util.createClass(fabric.Line, {
    initialize: function (coords, options) {
        let startPoint = GeometryHelper.getPointOnLineByLong(
            {
                x1: options.owner.x1,
                y1: options.owner.y1,
                x2: options.owner.x2,
                y2: options.owner.y2
            },
            options.distance);
        let endPoint = GeometryHelper.getPointOnLineByLong(
            {
                x1: options.owner.x1,
                y1: options.owner.y1,
                x2: options.owner.x2,
                y2: options.owner.y2
            }, options.long);

        this.callSuper('initialize', [startPoint.x, startPoint.y, endPoint.x, endPoint.y], options);

        this.type = 'wallObjectLine';
        this.id = options.id ? options.id : fabric.generateUID();
        this.hasControls = this.hasBorders = false;
        this.controls = [];


        this.addOwner = function (owner) {
            owner.addChild(this);
            return this.owner = owner.id;
        };

        this.owner = this.addOwner(options.owner);

        this.addControls = function (control) {
            return this.controls.push(control.id);
        };

        this.getControl = function (id) {
            return this.canvas.findById(id);
        };

        this.on('ownerMove', function (e) {
            this._redraw();
            for (let controlId of this.controls) {
                this.getControl(controlId).trigger('ownerMove', {target: this});
            }
        });

        this.on('controlMove', function (e) {
            let owner = this.getOwner();
            let long = GeometryHelper.getLineLong(
                {
                    x1: owner.x1,
                    y1: owner.y1,
                    x2: e.target.left,
                    y2: e.target.top
                });
            if (e.target.nodeType === 'end') {
                this.set({long: long});
            } else {
                this.set({distance: long});
            }
        });

        this.on('added', function () {
            let lineCoords = {
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            };
            let long = Math.floor(Math.abs(this.long - this.distance));
            let isVisible = long > 50;
            let textPoint = GeometryHelper.getMiddlePoint(lineCoords);
            let angle = GeometryHelper.getLineAngel({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            });
            this.text = new fabric.Text(Math.floor(long).toString(), {
                fontWeight: settings.WALL_OBJECT.LINE.FONT_WEIGHT,
                fontSize: settings.WALL_OBJECT.LINE.FONT_SIZE,
                excludeFromExport: true,
                visible: isVisible,
                left: textPoint.x,
                top: textPoint.y,
                fill: settings.WALL_OBJECT.LINE.FILL,
                angle: angle,
                selectable: false
            });
            this.canvas.add(this.text);
            this.text.setCoords();
        });

        this.on('longChange', function () {
            this._redraw();
        })

        this.on('removed', function () {
            for (let controlId of this.controls) {
                let control = this.getControl(controlId);
                if (control) {
                    control.trigger('ownerRemoved', {target: this});
                }
            }
            this.getOwner().trigger('childRemoved', {target: this});
        });

        this.on('controlRemoved', function () {
            this.remove();
        });

        this.on('ownerRemoved', function () {
            this.remove();
        });


    },

    changeOwner(owner){
        this.getOwner().trigger('childRemoved', {target: this});
        this.addOwner(owner);
        for (let controlId of this.controls) {
            let control = this.getControl(controlId);
            if (control.nodeType === 'end') {
                this.long = GeometryHelper.getLineLong(
                    {
                        x1: owner.x1,
                        y1: owner.y1,
                        x2: control.left,
                        y2: control.top
                    });
            } else {
                this.distance = GeometryHelper.getLineLong(
                    {
                        x1: owner.x1,
                        y1: owner.y1,
                        x2: control.left,
                        y2: control.top
                    });
            }
        }

    },

    getOwner(){
        return this.canvas.findById(this.owner);
    },

    _redraw(){
        let owner = this.canvas.findById(this.owner);
        let startPoint = GeometryHelper.getPointOnLineByLong(
            {
                x1: owner.x1,
                y1: owner.y1,
                x2: owner.x2,
                y2: owner.y2
            }, this.distance);
        let endPoint = GeometryHelper.getPointOnLineByLong(
            {
                x1: owner.x1,
                y1: owner.y1,
                x2: owner.x2,
                y2: owner.y2
            }, this.long);
        this.set({
            x1: startPoint.x,
            y1: startPoint.y,
            x2: endPoint.x,
            y2: endPoint.y
        });
        this._refreshLong();
    },

    _refreshLong() {
        if (!this.text) {
            return this;
        }

        let long = Math.floor(Math.abs(this.long - this.distance));

        if (long < 50) {
            return this.text.set({visible: false});
        }

        if (!this.text.visible) {
            this.text.set({visible: true});
        }
        let textPoint = GeometryHelper.getMiddlePoint({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        });
        let angle = GeometryHelper.getLineAngel({
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        });

        this.text.set({
            left: textPoint.x,
            top: textPoint.y,
            angle: angle
        });
        this.text.setText(long.toString());


    },


    set: function (key, value) {
        if (key.hasOwnProperty('long') || key.hasOwnProperty('distance')) {
            this.trigger('longChange', {e: null});
        }
        this.callSuper('set', key, value);
    },

    remove() {
        if (this.text) {
            this.text.remove();
        }
        this.callSuper('remove');
    },

    toObject: function () {
        return {
            type: this.type,
            id: this.id,
            distanceStart: this.distance,
            distanceEnd: this.long,
            instance: this.instance,
            owner: this.owner
        };
    }
});

/**
 * Returns fabric.WallObjectLine instance from an object representation
 * @static
 * @param {Object} object Object to create an instance from
 * @return fabric.WallObjectLine instance of fabric.WallObjectLine
 */
fabric.WallObjectLine.fromObject = function (object) {
    var points = [object.x1, object.y1, object.x2, object.y2];
    let obj;
    if (object.instance === 'window') {
        obj = WindowConstructor._createObjectLine(points, object.id);
    } else {
        obj = DoorConstructor._createObjectLine(points, object.id);
    }

    obj.owners = object.owners;
    return obj;
};

/**
 * @class
 */
fabric.Beacon = fabric.util.createClass(fabric.Circle, {

    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            fill: settings.BEACON.FILL,
            stroke: settings.BEACON.STROKE,
            radius: settings.BEACON.RADIUS,
            strokeWidth: settings.BEACON.STROKE_WIDTH
        }));
        this.hasControls = false;
        this.id = options.id ? options.id : fabric.generateUID();
        this.type = 'beacon';
        this.heightAboveTheFloor = options.heightAboveTheFloor;

    },

    _animateBeacon2: function (step) {
        if (this.radius < settings.BEACON.RADIUS) {
            this.direction = 'up';
        }

        if (this.radius > settings.BEACON.ANIMATION.MAX_RADIUS) {
            this.direction = 'down';
        }

        step = this.direction === 'up' ? step : -1 * step;
        this.set({radius: this.radius + step});
    },

    /**
     * @depricated
     * @private
     */
    _animateBeacon: function () {
        (function animate(beacon, animateStep) {
            beacon.radius = 6;
            beacon.animate('radius', '+=' + animateStep, {
                // onChange: beacon.canvas.renderAll.bind(beacon.canvas),
                duration: 1000,
                easing: fabric.util.ease.easeOutBounce,
                onComplete: function () {
                    if (beacon.canvas.findById(beacon.id)) {
                        animate(beacon, animateStep);
                    }
                }
            });
        })(this, 4);
    },

    toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'),
            {
                heightAboveTheFloor: this.heightAboveTheFloor,
                name: this.name,
                uuid: this.uuid,
                major: this.major,
                minor: this.minor,
                password: this.password
            });
    }
});

fabric.Beacon.fromObject = function (object) {
    return new fabric.Beacon(object);
};

/**
 * @class
 */
fabric.Reader = fabric.util.createClass(fabric.Circle, {

    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            fill: settings.READER.FILL,
            stroke: settings.READER.STROKE,
            radius: settings.READER.RADIUS,
            strokeWidth: settings.READER.STROKE_WIDTH
        }));
        this.hasControls = false;
        this.id = options.id ? options.id : fabric.generateUID();
        this.type = 'reader';
        this.heightAboveTheFloor = options.heightAboveTheFloor;

    },

    _animateBeacon2: function (step) {
        if (this.radius < settings.READER.RADIUS) {
            this.direction = 'up';
        }

        if (this.radius > settings.READER.ANIMATION.MAX_RADIUS) {
            this.direction = 'down';
        }

        step = this.direction === 'up' ? step : -1 * step;
        this.set({radius: this.radius + step});
    },

    toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'),
            {
                heightAboveTheFloor: this.heightAboveTheFloor,
                mac: this.mac
            });
    }
});

fabric.Reader.fromObject = function (object) {
    return new fabric.Reader(object);
};

/**
 * @class
 */
fabric.Stack = fabric.util.createClass(fabric.Rect, {

    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            width: settings.STACK.WIDTH,
            height: settings.STACK.HEIGHT,
            fill: settings.STACK.FILL
        }));

        this.id = options.id ? options.id : fabric.generateUID();
        this.type = 'stack';

        this.on('rotating', ()=> {
            let recomendedAngle = GeometryHelper.recomendedAngleForSimpleObject(this.angle);
            if (recomendedAngle !== this.angle) {
                this.set({angle: recomendedAngle});
                this.setCoords();
            }
        });

        building.addStack(this.id);

        this.on('removed', ()=> {
            building.deleteStack(this.id);
        });
    },

    toObject: function () {
        return this.callSuper('toObject');
    }
});

fabric.Stack.fromObject = function (object) {
    return new fabric.Stack(object);
};

/**
 * @class
 */
fabric.Stair = fabric.util.createClass(fabric.Object, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            excludeFromExport: true
        }));

        this.type = 'stair';
        this.on('selected', () => {
            building.stairs.onclick(this.id);
        });

        this.on('moving', () => {
            building.stairs.onMoving(this.id, this.left, this.top);
        });

        this.on('rotating', ()=> {
            let recomendedAngle = GeometryHelper.recomendedAngleForSimpleObject(this.angle);
            if (recomendedAngle !== this.angle) {
                this.set({angle: recomendedAngle});
                this.setCoords();
            }
            building.stairs.onRotating(this.id, this.angle);
        });

        this.on('scaling', ()=> {
            building.stairs.onScale(this.id, this.scaleX, this.scaleY);
        });

        this.width = 80;
        this.height = 70;

        this.w1 = 80;
        this.h1 = 35;
    },

    beforeDelete: function () {
        building.stairs.deleteById(this.id);
    },

    _render: function (ctx) {
        ctx.fillRect(-this.w1 / 2, -this.h1, 80, 1);
        ctx.fillRect(-this.w1 / 2, this.h1, 80, 1);

        ctx.fillRect(40, -35, 1, 72);
        ctx.fillRect(-this.w1 / 2, 3, 80, 1);
        ctx.fillRect(-this.w1 / 2, -3, 80, 1);
        ctx.fillRect(-40, -35, 1, 72);
        for (let i = -40; i < 40; i += 5) {
            ctx.fillRect(i, -35, 1, 32);
        }

        for (let i = -40; i < 40; i += 5) {
            ctx.fillRect(i, 3, 1, 32);
        }
    }

});

/**
 * @class
 */
fabric.Elevator = fabric.util.createClass(fabric.Object, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            excludeFromExport: true
        }));

        this.type = 'elevator';
        this.on('selected', () => {
            building.elevators.onclick(this.id);
        });

        this.on('moving', () => {
            building.elevators.onMoving(this.id, this.left, this.top);
        });

        this.on('rotating', ()=> {
            let recomendedAngle = GeometryHelper.recomendedAngleForSimpleObject(this.angle);
            if (recomendedAngle !== this.angle) {
                this.set({angle: recomendedAngle});
                this.setCoords();
            }
            building.elevators.onRotating(this.id, this.angle);
        });

        this.on('scaling', ()=> {
            building.elevators.onScale(this.id, this.scaleX, this.scaleY);
        });

        this.width = 60;
        this.height = 60;

        this.w1 = 60;
        this.h1 = 30;
    },

    beforeDelete: function () {
        building.elevators.deleteById(this.id);
    },

    _render: function (ctx) {
        ctx.fillRect(-this.w1 / 2, -this.h1, 60, 2);
        ctx.fillRect(-this.w1 / 2, this.h1 - 2, 60, 2);
        ctx.fillRect(-this.w1 / 2, -this.h1, 2, 60);
        ctx.fillRect(this.w1 / 2 - 2, -this.h1, 2, 60);

        ctx.beginPath();
        ctx.moveTo(-this.w1 / 2, -this.h1);
        ctx.lineTo(-this.w1 / 2 + 60, this.h1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-this.w1 / 2 + 60, -this.h1);
        ctx.lineTo(-this.w1 / 2, this.h1);
        ctx.stroke();

    }

});

/**
 * @class
 */
fabric.Travolator = fabric.util.createClass(fabric.Object, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            excludeFromExport: true
        }));

        this.type = 'travolator';
        this.on('selected', () => {
            building.travolators.onclick(this.id);
        });

        this.on('moving', () => {
            building.travolators.onMoving(this.id, this.left, this.top);
        });

        this.on('rotating', ()=> {
            let recomendedAngle = GeometryHelper.recomendedAngleForSimpleObject(this.angle);
            if (recomendedAngle !== this.angle) {
                this.set({angle: recomendedAngle});
                this.setCoords();
            }
            building.travolators.onRotating(this.id, this.angle);
        });

        this.on('scaling', ()=> {
            building.travolators.onScale(this.id, this.scaleX, this.scaleY);
        });

        this.width = -30;
        this.height = 150;

        this.w1 = 30;
        this.h1 = 75;
    },

    beforeDelete: function () {
        building.travolators.deleteById(this.id);
    },

    _render: function (ctx) {
        if (this.direction === 'up') {
            //дверь
            ctx.fillRect(-this.w1 / 2, this.h1 - 2, 30, 2);
            ctx.fillRect(-this.w1 / 2, this.h1 - 50, 32, 2);
            ctx.fillRect(-this.w1 / 2, this.h1, 2, -50);
            ctx.fillRect(-this.w1 / 2 + 30, this.h1, 2, -50);

            //поручень
            ctx.fillRect(-this.w1 / 2 + 30 - 5, this.h1 - 17, 2, -110);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 22, 1, -95);
            ctx.fillRect(-this.w1 / 2 + 30 - 2, this.h1 - 22, 1, -125);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 22, 7, 1);

            //обрезающая линия
            ctx.beginPath();
            ctx.moveTo(-this.w1 / 2 + 1, this.h1 - 15);
            ctx.lineTo(-this.w1 / 2 + 30 - 2, this.h1 - 150);
            ctx.stroke();

            //ступеньки
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 100, -4, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 90, -6, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 80, -8, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 70, -10, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 60, -12, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 50, -14, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 40, -16, 1);
            ctx.fillRect(-this.w1 / 2 + 30 - 8, this.h1 - 30, -18, 1);

            ctx.beginPath();
            ctx.moveTo(0, 92);
            ctx.lineTo(10, 80);
            ctx.lineTo(-10, 80);
            ctx.fill();

        } else {
            //дверь
            ctx.fillRect(-this.w1 / 2, -this.h1, 30, 2);
            ctx.fillRect(-this.w1 / 2, -this.h1 + 48, 30, 2);
            ctx.fillRect(-this.w1 / 2, -this.h1, 2, 50);
            ctx.fillRect(-this.w1 / 2 + 30, -this.h1, 2, 50);

            //поручень
            ctx.fillRect(-this.w1 / 2 + 5, -this.h1 + 10, 2, 110);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 15, 1, 95);
            ctx.fillRect(-this.w1 / 2 + 2, -this.h1 + 15, 1, 125);
            ctx.fillRect(-this.w1 / 2 + 2, -this.h1 + 15, 6, 1);

            //обрезающая линия
            ctx.beginPath();
            ctx.moveTo(-this.w1 / 2 + 30, -this.h1 + 5);
            ctx.lineTo(-this.w1 / 2 + 3, -this.h1 + 140);
            ctx.stroke();

            //ступеньки
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 90, 4, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 80, 6, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 70, 8, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 60, 10, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 50, 12, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 40, 14, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 30, 16, 1);
            ctx.fillRect(-this.w1 / 2 + 8, -this.h1 + 20, 18, 1);

            ctx.beginPath();
            ctx.moveTo(0, -80);
            ctx.lineTo(10, -92);
            ctx.lineTo(-10, -92);
            ctx.fill();
        }
    }

});

/**
 * @class
 */
fabric.RulerControl = fabric.util.createClass(fabric.Object, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            excludeFromExport: true,
            hasControls: false
        }));

        this.controlType = options.controlType;
        this.controlLine = null;
        this.width = 20;
        this.height = 20;

        this.on('moving', function () {
            this.controlLine.trigger('controlMove', {target: this});
        });

        this.on('added', function () {
            this.canvas.moveTo(this, 10000);
        });

        this.on('removed', function () {
            this.controlLine.trigger('controlRemoved', {});
        });
    },

    addControlLine: function (line) {
        this.controlLine = line;
    },

    _render: function (ctx) {
        if (this.controlType === 'start') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(12, 10);
            ctx.lineTo(12, -10);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-12, 10);
            ctx.lineTo(-12, -10);
            ctx.fill();
        }
    }


});

/**
 * @class
 */
fabric.RulerLine = fabric.util.createClass(fabric.Line, {
    initialize: function (coords, options) {
        this.callSuper('initialize', coords, fabric.util.object.extend(options, {
            stroke: 'red',
            perPixelTargetFind: settings.WALL.LINE.PER_PIXEL_TARGET_FIND,
            strokeWidth: 4,
            excludeFromExport: true,
            selectable: true,
            strokeDashArray: [8, 8],
            selectable: false
        }));
        this.controls = [];
        this.text = null;

        this.on('controlRemoved', function () {
            for (let c of this.controls) {
                if (c) {
                    c.remove();
                }
                this.text.remove();
                this.remove();
            }
        });

        this.on('movingOnCreate', function () {
            this.setCoords();

            let lineCoords = {
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            };

            this.refreshText({
                x: this.x2,
                y: this.y2
            });
            let angle = GeometryHelper.getLineAngel(lineCoords);
            this.controls[0].set({angle: angle});
        });


        this.refreshText = (preferPoint = null) => {
            let lineCoords = {
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            };

            let long = GeometryHelper.getLineLong(lineCoords);
            let textPoint;
            if (preferPoint === null) {
                textPoint = GeometryHelper.getMiddlePoint(lineCoords);
            } else {
                textPoint = preferPoint;
            }

            let angle = GeometryHelper.getLineAngel({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            });

            this.text.setText(Math.floor(long).toString());
            this.text.set({
                left: textPoint.x + 20,
                top: textPoint.y + 20,
                angle: angle
            });
        };

        this.on('createEnd', function () {
            let angle = GeometryHelper.getLineAngel({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            });
            this.refreshText();
            this.controls[1].set({angle: angle});
        });

        this.on('controlMove', function (e) {
            let control = e.target;
            if (control.controlType === 'start') {
                this.set({
                    x1: control.left,
                    y1: control.top
                });
            } else {
                this.set({
                    x2: control.left,
                    y2: control.top
                });
            }
            let angle = GeometryHelper.getLineAngel({
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            });

            for (let c of this.controls) {
                c.set({angle: angle});
            }

            this.refreshText();
        });

        this.on('added', function () {
            this.canvas.moveTo(this, 1);

            let lineCoords = {
                x1: this.x1,
                y1: this.y1,
                x2: this.x2,
                y2: this.y2
            };

            let textPoint = GeometryHelper.getMiddlePoint(lineCoords);
            this.text = new fabric.Text('', {
                fontWeight: settings.WALL.LINE.TEXT.FONT_WEIGHT,
                fontSize: settings.WALL.LINE.TEXT.FONT_SIZE,
                excludeFromExport: true,
                left: textPoint.x,
                top: textPoint.y,
                fill: 'red',
                selectable: false
            });
            this.canvas.add(this.text);
            this.text.setCoords();
        });


    },

    addControl: function (control) {
        this.controls.push(control);
    }
});

/**
 * @class
 */
fabric.Compass = fabric.util.createClass(fabric.Object, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            hasControls: false,
            hasBorders: false,
            excludeFromExport: true
        }));
        this.type = 'compass';

        this.getVisualAngle = function () {
            let angle;
            if (this.angle <= -90) {
                angle = -1 * Math.round(this.angle) - 90;
            } else if (this.angle <= 180 && this.angle >= 0) {
                angle = 270 - Math.round(this.angle);
            } else if (this.angle < 0 && this.angle > -90) {
                angle = -1 * Math.round(this.angle) + 270;
            }
            return (
                       360 - angle
                   ).toString() + ' °';
        }

        this.text = new fabric.Text(this.getVisualAngle(), {
            fontWeight: settings.COMPASS.TEXT.FONT_WEIGHT,
            fontSize: settings.COMPASS.TEXT.FONT_SIZE,
            excludeFromExport: true,
            left: this.left,
            top: this.top + 40,
            fill: settings.COMPASS.TEXT.FILL,
            selectable: false
        });

        this.on('moving', () => {
            building.compass.onMoving(this.left, this.top);
            this.text.set({
                left: this.left,
                top: this.top + 40
            });
        });

        this.on('rotating', ()=> {
            this.text.setText(this.getVisualAngle());
        });

        this.on('selected', () => {
            let pointer = this.canvas.getPointer();
            let navLine = this._navLine = new fabric.Line([this.left, this.top, pointer.x, pointer.y], {
                stroke: settings.WALL.LINE.STROKE,
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                excludeFromExport: true,
                selectable: false
            });
            this.canvas.add(
                navLine
            );

            this.canvas.on('mouse:move', () => {
                let pointer = this.canvas.getPointer();
                navLine.set({
                    x1: this.left,
                    y1: this.top,
                    'x2': pointer.x,
                    'y2': pointer.y
                });
                let lineAngle = GeometryHelper.getLineAngel(
                    {
                        x1: navLine.x1,
                        y1: navLine.y1,
                        x2: navLine.x2,
                        y2: navLine.y2
                    });

                this.set({angle: lineAngle});
                this.trigger('rotating', {target: this});
                navLine.setCoords();
                this.canvas.renderAll();
            });

            this.canvas.on('selection:cleared', ()=> {
                building.compass.onRotating(this.angle);
                navLine.remove();
                this.canvas.off('mouse:move');
            });
        });

        this.on('added', () => {

            this.canvas.add(this.text);
            this.text.setCoords();
        });


        this.width = -30;
        this.height = 150;

        this.w1 = 30;
        this.h1 = 75;
    },

    beforeDelete: function () {
        if (this._navLine) {
            this._navLine.remove();
        }

        this.canvas.off('selection:cleared');

        building.compass.clear();
    },

    _render: function (ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(28, 0);
        ctx.lineTo(-22, -20);
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(-20, 20);
        ctx.lineTo(-9, 0);

        ctx.stroke();
    }

});

/**
 * @class
 */
fabric.Elevator = fabric.util.createClass(fabric.Object, {
    initialize: function (options) {
        this.callSuper('initialize', fabric.util.object.extend(options, {
            excludeFromExport: true
        }));

        this.type = 'elevator';
        this.on('selected', () => {
            building.elevators.onclick(this.id);
        });

        this.on('moving', () => {
            building.elevators.onMoving(this.id, this.left, this.top);
        });

        this.on('rotating', ()=> {
            let recomendedAngle = GeometryHelper.recomendedAngleForSimpleObject(this.angle);
            if (recomendedAngle !== this.angle) {
                this.set({angle: recomendedAngle});
                this.setCoords();
            }
            building.elevators.onRotating(this.id, this.angle);
        });

        this.on('scaling', ()=> {
            building.elevators.onScale(this.id, this.scaleX, this.scaleY);
        });

        this.width = 60;
        this.height = 60;

        this.w1 = 60;
        this.h1 = 30;
    },

    beforeDelete: function () {
        building.elevators.deleteById(this.id);
    },

    _render: function (ctx) {
        ctx.fillRect(-this.w1 / 2, -this.h1, 60, 2);
        ctx.fillRect(-this.w1 / 2, this.h1 - 2, 60, 2);
        ctx.fillRect(-this.w1 / 2, -this.h1, 2, 60);
        ctx.fillRect(this.w1 / 2 - 2, -this.h1, 2, 60);

        ctx.beginPath();
        ctx.moveTo(-this.w1 / 2, -this.h1);
        ctx.lineTo(-this.w1 / 2 + 60, this.h1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-this.w1 / 2 + 60, -this.h1);
        ctx.lineTo(-this.w1 / 2, this.h1);
        ctx.stroke();

    }

});


/**
 * manager for rooms
 * @class
 */
class RoomManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.elements = [];
    }

    get data() {
        return this.elements;
    }

    set data(elements) {
        this.elements = elements;
    }

    getByName(name) {
        return this.elements.find(function (el) {
            return el.name === name;
        });
    }

    deleteByName(name, trigger = true) {
        if (trigger) {
            this.canvas.trigger('roomDelete', {instance: this.getByName(name)});
        }

        this.elements.splice(this.elements.indexOf(this.getByName(name)), 1);
    }


    _findByInstance(instance) {
        return this.elements.find(function (el) {
            return isCompare(instance, el.instance);
        });
    }

    add(name, floor, instance, display = true) {
        if (display) {
            let oldRoom = this._findByInstance(instance);
            if (oldRoom) {
                let text = this.canvas.getObjects('text').find(function (o) {
                    return o.getText() === oldRoom.name;
                });
                text.remove();
            }

            let points = roomFinder.createPolygon(this.canvas, instance);
            let xList = [], yList = [];
            for (let j = 0; j < points.length; j++) {
                xList.push(points[j][0]);
                yList.push(points[j][1]);
            }
            let textPoint = GeometryHelper.getPoligonCenterPoint(instance.length, xList, yList);
            this.canvas.add(
                this.text = new fabric.Text(name, {
                    fontWeight: settings.ROOM.TEXT.FONT_WEIGHT,
                    fontSize: settings.ROOM.TEXT.FONT_SIZE,
                    excludeFromExport: true,
                    left: textPoint.x,
                    top: textPoint.y,
                    fill: settings.ROOM.TEXT.FILL,
                    hasControls: false,
                    hasBorders: false
                })
            );

            var self = this;
            this.text.on('removed', function () {
                self.deleteByName(this.getText());
            });
        }
        this.elements.push({
            name: name,
            floor: floor,
            instance: instance
        });

        this.canvas.trigger('roomAdd', {instance: this.getByName(name)});
    }

    showOnFloor(number) {
        var self = this;
        for (let element of this.elements) {
            if (element.floor.indexOf(number) !== -1) {
                let points = roomFinder.createPolygon(this.canvas, element.instance);
                let xList = [], yList = [];
                for (let j = 0; j < points.length; j++) {
                    xList.push(points[j][0]);
                    yList.push(points[j][1]);
                }
                let textPoint = GeometryHelper.getPoligonCenterPoint(element.instance.length, xList, yList);
                this.canvas.add(
                    this.text = new fabric.Text(element.name, {
                        fontWeight: settings.ROOM.TEXT.FONT_WEIGHT,
                        fontSize: settings.ROOM.TEXT.FONT_SIZE,
                        excludeFromExport: true,
                        left: textPoint.x,
                        top: textPoint.y,
                        fill: settings.ROOM.TEXT.FILL,
                        hasControls: false,
                        hasBorders: false
                    })
                );

                this.text.on('removed', function () {
                    self.deleteByName(this.getText());
                });
            }
        }
    }
}

/**
 * manager for compass
 * @class
 */
class CompassManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.elements = [];
    }

    get data() {
        let elements = this.elements;
        if (elements && elements.length > 0) {
            elements[0].x = Math.round(elements[0].x);
            elements[0].y = Math.round(elements[0].y);
            elements[0].angle = Math.round(elements[0].angle);
        }
        return elements;
    }

    clear() {
        this.elements = [];
    }

    set data(elements) {
        this.elements = elements;
    }

    isOnCanvas() {
        return this.elements !== undefined && this.elements.length === 1;
    }

    onRotating(angle) {
        this.elements[0].angle = angle;
    }

    onMoving(x, y) {
        this.elements[0].x = x;
        this.elements[0].y = y;
    }

    add(x, y, angle) {
        if (this.elements.length > 1) {
            throw new ConstructorError('must be only 1 compass');
        }
        this.elements.push({
            x: x,
            y: y,
            angle: angle
        });
    }

    showOnFloor() {
        if (!this.isOnCanvas()) {
            return;
        }

        let compass = new fabric.Compass({
            left: this.elements[0].x,
            top: this.elements[0].y,
            angle: this.elements[0].angle
        });
        this.canvas.add(
            compass
        );
    }
}


/**
 * manager for stairs, elevators and etc...
 * @class
 */
class ConnectStructure {
    constructor(displayDesigner, canvas) {
        this.canvas = canvas;
        this.displayDesigner = displayDesigner;
        this.elements = [];
    }

    get data() {
        return this.elements;
    }

    set data(elements) {
        this.elements = elements;
    }

    getById(id) {
        return this.elements.find(function (el) {
            return el.id === id;
        });
    }

    add(position, floors, id = null, display = true, direction = null, angle = 0, scaleX = 1, scaleY = 1) {

        id = id ? id : fabric.generateUID();
        if (display) {
            this.canvas.add(
                StructuresDisplayFactory.create(this.displayDesigner,
                    {
                        left: position.left,
                        top: position.top,
                        id: id,
                        direction: direction,
                        angle: angle,
                        scaleX: scaleX,
                        scaleY: scaleY
                    })
            )
        }
        return this.elements.push(
            {
                position: position,
                floors: floors,
                id: id,
                angle: angle,
                scaleX: scaleX,
                scaleY: scaleY
            });
    }


    onclick(structureId) {
        let structure = this.getById(structureId);
        console.log(structure.floors);
    }

    onRotating(structureId, angle) {
        let structure = this.getById(structureId);
        structure.angle = angle;
    }

    onMoving(structureId, left, top) {
        let structure = this.getById(structureId);
        structure.position = {
            left: left,
            top: top
        };
    }

    onScale(structureId, scaleX, scaleY) {
        let structure = this.getById(structureId);
        structure.scaleX = scaleX;
        structure.scaleY = scaleY;
    }

    deleteById(id) {
        this.elements.splice(this.elements.indexOf(this.getById(id)), 1);
    }

    showOnFloor(number) {
        for (let element of this.elements) {
            if (element.floors.indexOf(number) !== -1) {
                let top = element.position.top, left = element.position.left;

                let direction = 'up';
                if (Math.max(...element.floors) == number) {
                    direction = 'down';
                }
                let displayElement = StructuresDisplayFactory.create(this.displayDesigner, {
                    left: left,
                    top: top,
                    id: element.id,
                    angle: element.angle,
                    scaleX: element.scaleX,
                    scaleY: element.scaleY,
                    direction: direction
                });
                this.canvas.add(displayElement);
            }
        }
    }
}

/**
 * create canvas object for connect structure
 * @class
 */
class StructuresDisplayFactory {
    static _classesMapping() {
        return {
            'stair': fabric.Stair,
            'elevator': fabric.Elevator,
            'travolator': fabric.Travolator
        }
    }

    static create(name, args) {
        return new (
            StructuresDisplayFactory._classesMapping()
        )[name](args);
    }
}


class AbstractConstructor {
    constructor() {

    }

    defaultExit() {
        throw new TypeError("Method not implemented");
    }

    externalExit() {
        throw new TypeError("Method not implemented");
    }

    switchToWorkState() {
        this.state = 'work';
    }

    switchToFinishState() {
        this.state = 'finish';
    }

    stopConstruct() {
        switch (this.state) {
            case 'work' :
                return this.externalExit();
            case 'finish' :
                return this.defaultExit();
            default :
                return this.defaultExit();
        }
    }

    get touch() {
        throw new TypeError("Method not implemented");
    }
}

class DefaultState extends AbstractConstructor {

    constructor(canvas) {

        super();
        this.canvas = canvas;
        this.switchToWorkState();
        canvas.selection = true;
        canvas.hoverCursor = 'move';
        canvas.defaultCursor = 'default';
    }

    get touch() {
        return function () {
            return false
        };
    }

    externalExit() {
        this.canvas.selection = false;
        this.canvas.deactivateAll().renderAll();
        return 0;
    }

    defaultExit() {
        this.canvas.selection = false;
        this.canvas.deactivateAll().renderAll();
        return 0;
    }

}

class WallNodeConstructor {

    static construct(canvas, options) {

        if (!options.target || (options.target.type !== 'wallLine' && options.target.type !== 'text')) {
            throw new ConstructorError('Node must be created only on wallNode Object');
        }

        let parentLine = options.target;


        let pointer = canvas.getPointer(options.e);

        if (tool.get() instanceof WallConstructor && tool.get()._lineOut !== null) {

            if (options.target.type === 'text') {
                if (!options.target.owner) {
                    throw new ConstructorError('Node must be created only on wallNode Object');
                }
                parentLine = options.target.owner;
            }

            pointer = {
                x: tool.get()._lineOut.x2,
                y: tool.get()._lineOut.y2
            };
        }

        pointer = GeometryHelper.putPointOnLine(pointer,
            {
                x1: parentLine.x1,
                y1: parentLine.y1,
                x2: parentLine.x2,
                y2: parentLine.y2
            });
        //create leftLine and rightLine (using parent line owners nodes)
        let leftLine = WallConstructor._createWallLine(
            [parentLine.getOwner(0).left, parentLine.getOwner(0).top, pointer.x, pointer.y]);
        canvas.add(leftLine);

        let rightLine = WallConstructor._createWallLine(
            [pointer.x, pointer.y, parentLine.getOwner(1).left, parentLine.getOwner(1).top]);
        canvas.add(rightLine);

        // connect new lines to owners
        for (let i in parentLine.owners) {
            let outlineIndex = parentLine.getOwner(i).outLines.indexOf(parentLine.id);
            if (outlineIndex !== -1) {
                parentLine.getOwner(i).outLines.splice(outlineIndex, 1);
                parentLine.getOwner(i).connectWallLineOut(leftLine);
            }
            let inlineIndex = parentLine.getOwner(i).inLines.indexOf(parentLine.id);
            if (inlineIndex !== -1) {
                parentLine.getOwner(i).inLines.splice(inlineIndex, 1);
                parentLine.getOwner(i).connectWallLineIn(rightLine);
            }
        }

        let childs = parentLine.childs.slice();

        //spread parent line childs between new lines
        for (let i in childs) {
            let child = canvas.findById(childs[i]);
            let lineLeftSegment = {
                x1: leftLine.x1,
                y1: leftLine.y1,
                x2: leftLine.x2,
                y2: leftLine.y2
            };
            if (GeometryHelper.isPointOnLineSegment({
                    x: child.x1,
                    y: child.y1
                }, lineLeftSegment)
                && GeometryHelper.isPointOnLineSegment({
                    x: child.x2,
                    y: child.y2
                }, lineLeftSegment)
            ) {
                child.changeOwner(leftLine);
            } else {
                child.changeOwner(rightLine);
            }
        }

        parentLine.remove();

        let node = WallConstructor._createWallNode(pointer.x, pointer.y, leftLine, rightLine);
        canvas.add(node);

        if (tool.get() instanceof WallConstructor) {
            options.target = node;
            canvas.trigger('mouse:up', options);
        }

    }


}

class WallConstructor extends AbstractConstructor {
    constructor(canvas) {
        super();
        this._refreshWork();
        this.canvas = canvas;
        canvas.on('mouse:over', e => {
            if (e.target !== null && e.target.type === 'wallNode') {
                this.hoverEl = e.target;
                e.target.set({
                    radius: 12,
                    strokeWidth: 7
                });
                canvas.renderAll();
            } else if (this.hoverEl) {
                this.hoverEl.set({
                    radius: 8,
                    strokeWidth: 5
                });
                this.hoverEl = null;
                canvas.renderAll();
            }
        });

        this.hint1 = new fabric.Text('0', {
            fontWeight: settings.INTEREST_POINT.TEXT.FONT_WEIGHT,
            fontSize: settings.INTEREST_POINT.TEXT.FONT_SIZE,
            excludeFromExport: true,
            left: 0,
            top: 0,
            fill: settings.INTEREST_POINT.TEXT.FILL,
            visible: false,
            selectable: false
        });
        this.hint2 = new fabric.Text('0', {
            fontWeight: settings.INTEREST_POINT.TEXT.FONT_WEIGHT,
            fontSize: settings.INTEREST_POINT.TEXT.FONT_SIZE,
            excludeFromExport: true,
            left: 0,
            top: 0,
            fill: settings.INTEREST_POINT.TEXT.FILL,
            visible: false,
            selectable: false
        });

        canvas.add(this.hint1);
        canvas.add(this.hint2);

        let self = this;

        this.refreshConstructorHint = function (e) {
            if (e.target !== null && e.target.type === 'wallLine') {
                let pointer = canvas.getPointer(e.e);

                let xposr = pointer.x, xposl = pointer.x, ypost = pointer.y, yposb = pointer.y;

                let angle = GeometryHelper.getLineAngel(
                    {
                        x1: e.target.x1,
                        x2: e.target.x2,
                        y1: e.target.y1,
                        y2: e.target.y2
                    });
                if (angle >= 45 && angle <= 135) {
                    ypost = pointer.y + 30;
                    yposb = pointer.y - 30;
                } else if (angle >= -135 && angle <= -45) {
                    ypost = pointer.y - 30;
                    yposb = pointer.y + 30;
                } else if (angle > 135 || angle < -135) {
                    xposr = pointer.x - 30;
                    xposl = pointer.x + 30;
                } else if (angle > -45 && angle < 45) {
                    xposr = pointer.x + 30;
                    xposl = pointer.x - 30;
                }

                angle === 180 ? angle = 0 : angle = angle;

                self.hint1.setText(Math.round(
                    GeometryHelper.getLineLong({
                        x1: e.target.x1,
                        x2: pointer.x,
                        y1: e.target.y1,
                        y2: pointer.y
                    }))
                    .toString());
                self.hint1.set({
                    visible: true,
                    left: xposl,
                    top: yposb,
                    angle: angle
                });

                self.hint2.setText(Math.round(
                    GeometryHelper.getLineLong({
                        x1: pointer.x,
                        x2: e.target.x2,
                        y1: pointer.y,
                        y2: e.target.y2
                    }))
                    .toString());
                self.hint2.set({
                    visible: true,
                    left: xposr,
                    top: ypost,
                    angle: angle
                });

            }
            else {
                self.hint1.set({visible: false});
                self.hint2.set({visible: false});
            }
        };

        canvas.on('mouse:move', this.refreshConstructorHint);
        canvas.hoverCursor = 'cell';
        canvas.defaultCursor = 'cell';
    }

    externalExit() {
        this.canvas.off('mouse:over');
        this.canvas.off('mouse:move');
        this._lineOut.remove();
        this.hint1.remove();
        this.hint2.remove();
        return 0;
    }

    defaultExit() {
        this.canvas.off('mouse:over');
        this.canvas.off('mouse:move');
        this.hint1.remove();
        this.hint2.remove();
        return 0;
    }

    _refreshWork() {
        this._lineIn = this._lineOut = null;
        this._startNode = null;
    }

    static _createWallNode(left, top, lineIn, lineOut, active = true) {

        let wallNode = new fabric.WallNode({
            left: left,
            top: top,
            outLines: [],
            inLines: [],
            lineIn: lineIn,
            lineOut: lineOut,
        });

        if (!active) {
            wallNode.selectable = false;
        }

        return wallNode;
    }

    static _createWallLine(coords, id = null, active = true) {
        let wallLine = new fabric.WallLine(coords, {
            owners: [],
            childs: [],
            id: id
        });

        if (!active) {
            wallLine.selectable = false;
            wallLine.excludeFromExport = true;
        }

        return wallLine;
    }

    static createFromObject(canvas, object, active = true) {

        let findNodeByCoords = function (x, y) {
            return canvas.getObjects('wallNode').find((obj) => {
                return obj.left === x && obj.top === y;
            });
        };


        let wallLine = WallConstructor._createWallLine([object.x1, object.y1, object.x2, object.y2], object.id, active);
        canvas.add(wallLine);

        let outNode = findNodeByCoords(object.x1, object.y1);
        if (outNode) {
            outNode.connectWallLineOut(wallLine);
        } else {
            canvas.add(WallConstructor._createWallNode(object.x1, object.y1, null, wallLine, active));
        }

        let inNode = findNodeByCoords(object.x2, object.y2);
        if (inNode) {
            inNode.connectWallLineIn(wallLine);
        } else {
            canvas.add(WallConstructor._createWallNode(object.x2, object.y2, wallLine, null, active));
        }
    }

    /**
     * on wall node click strategy
     * @param canvas
     * @param options
     * @private
     */
    _onWallNodeClick(canvas, options) {
        if (this._startNode === options.target) {
            canvas.off('mouse:move');
            canvas.on('mouse:move', this.refreshConstructorHint);
            this._startNode.deleteChildLine(this._lineOut);
            this._lineOut.remove();
            this._refreshWork();
        } else if (this._startNode === null) {
            let pointer = {
                x: options.target.left,
                y: options.target.top
            };
            let lineOut = this._lineOut = WallConstructor._createWallLine([pointer.x, pointer.y, pointer.x, pointer.y]);
            canvas.add(this._lineOut);
            this._startNode = options.target;
            this._startNode.connectWallLineOut(lineOut);
            canvas.on('mouse:move', function (options) {
                let pointer = canvas.getPointer(options.e);
                let modifyLine = GeometryHelper.convertToRightAngle({
                    x1: lineOut.x1,
                    y1: lineOut.y1,
                    x2: pointer.x,
                    y2: pointer.y
                });
                modifyLine = GeometryHelper.diffLine({
                    x1: modifyLine.x1,
                    y1: modifyLine.y1,
                    x2: modifyLine.x2,
                    y2: modifyLine.y2
                }, 5);
                lineOut.set({
                    'x2': modifyLine.x2,
                    'y2': modifyLine.y2
                });
                lineOut.showPrompt('end');
                lineOut.setCoords();
                canvas.renderAll();
            });
        } else {
            this._lineOut.deletePrompt();
            options.target.connectWallLineIn(this._lineOut);
            canvas.off('mouse:move');
            canvas.on('mouse:move', this.refreshConstructorHint);
            this._lineOut.set({
                'x2': options.target.left,
                'y2': options.target.top
            });
            this._refreshWork();
        }
    }

    /**
     * on void filed click strategy
     * @param canvas
     * @param options
     * @private
     */
    _onVoidFieldClick(canvas, options) {
        /**
         * @var {fabric.Point}
         */
        let pointer;

        this._lineIn = this._lineOut;

        //node coords must be end of line coords, not coords of click
        if (this._lineIn !== null) {
            this._lineIn.deletePrompt();
            pointer = new fabric.Point(this._lineIn.x2, this._lineIn.y2);
        } else {
            pointer = canvas.getPointer(options.e);
        }

        let lineOut = this._lineOut = WallConstructor._createWallLine([pointer.x, pointer.y, pointer.x, pointer.y]);
        canvas.add(this._lineOut);

        this._startNode = WallConstructor._createWallNode(pointer.x, pointer.y, this._lineIn, this._lineOut);
        canvas.add(this._startNode);
        canvas.off('mouse:move');
        canvas.on('mouse:move', this.refreshConstructorHint);
        canvas.on('mouse:move', function (options) {
            let pointer = canvas.getPointer(options.e);
            let modifyLine = GeometryHelper.convertToRightAngle({
                x1: lineOut.x1,
                y1: lineOut.y1,
                x2: pointer.x,
                y2: pointer.y
            });
            modifyLine = GeometryHelper.diffLine({
                x1: modifyLine.x1,
                y1: modifyLine.y1,
                x2: modifyLine.x2,
                y2: modifyLine.y2
            }, 5);

            lineOut.set({
                'x2': modifyLine.x2,
                'y2': modifyLine.y2
            });
            lineOut.setCoords();
            lineOut.showPrompt('end');
            canvas.renderAll();
        });
    }

    _constructStep(canvas, options) {
        if (options.e.button === 2) {
            return 0;
        }

        if (options.target !== null && options.target.type === 'wallLine' && options.target !== this._lineOut) {
            return 0;
        }

        if (options.target !== null && options.target.type === 'text') {
            return 0;
        }

        if (options.target !== null && options.target.type === 'wallNode') {
            if (this._startNode !== null) {
                this.switchToFinishState();
            } else {
                this.switchToWorkState();
            }
            this._onWallNodeClick(canvas, options);

        } else {
            this.switchToWorkState();
            this._onVoidFieldClick(canvas, options);
        }
    }

    get touch() {
        return this._constructStep;
    }
}


class AbstractWallObjectConstructor extends AbstractConstructor {
    constructor(canvas) {
        super();

        this.canvas = canvas;
        this._refreshWork();

        canvas.hoverCursor = 'cell';
        canvas.defaultCursor = 'not-allowed';
    }

    defaultExit() {
        return 0;
    }

    externalExit() {
        this._startNode.beforeDelete();
        this._startNode.remove();
        this._line.remove();
        return 0;
    }

    _refreshWork() {
        this._startNode = null;
        this._line = null;
    }

    static _createObjectNode(left, top, line, nodeType, parent) {
        throw new TypeError("Method not implemented");
    }

    static _createObjectLine(coords) {
        throw new TypeError("Method not implemented");
    }


    get touch() {
        return this._constructObject;
    }


    _constructObject(canvas, options) {

        if (options.target === null && this._startNode === null) {
            throw new ConstructorError("object must be on the wall");
        }


        if (this._startNode === null) {
            if (options.target.type === 'wallLine' && options.target.instance === 'wall') {
                this.switchToWorkState();
                let pointer = this.canvas.getPointer();
                let owner = options.target;

                pointer = GeometryHelper.putPointOnLine({
                    x: pointer.x,
                    y: pointer.y
                }, {
                    x1: owner.x1,
                    y1: owner.y1,
                    x2: owner.x2,
                    y2: owner.y2
                });

                let distance = GeometryHelper.getLineLong({
                    x1: options.target.x1,
                    y1: options.target.y1,
                    x2: pointer.x,
                    y2: pointer.y
                });

                let line = this._line = this.constructor._createObjectLine(distance, distance, owner);
                canvas.add(this._line);

                let startNode = this._startNode = this.constructor._createObjectNode(pointer.x, pointer.y, this._line,
                    'start');
                canvas.add(this._startNode);

                canvas.on('mouse:move', function () {
                    let pointer = this.getPointer();
                    let {x,y} = GeometryHelper.putPointOnLine({
                        x: pointer.x,
                        y: pointer.y
                    }, {
                        x1: owner.x1,
                        y1: owner.y1,
                        x2: owner.x2,
                        y2: owner.y2
                    });
                    let long = GeometryHelper.getLineLong({
                        x1: owner.x1,
                        y1: owner.y1,
                        x2: pointer.x,
                        y2: pointer.y
                    });
                    line.set({long: long});
                    canvas.renderAll();
                });
            } else {
                throw new ConstructorError("object must be on the wall");
            }

        } else {
            this.switchToFinishState();
            let point = {
                x: this._line.x2,
                y: this._line.y2
            }
            canvas.off('mouse:move');
            canvas.add(
                this.constructor._createObjectNode(point.x, point.y, this._line, 'end'));
            this._refreshWork();
        }
    }
}

class WindowConstructor extends AbstractWallObjectConstructor {
    constructor(canvas) {
        super(canvas);
    }

    static _createObjectNode(left, top, line, nodeType, id = null, active = true) {
        let windowNode = new fabric.WallObjectNode({
            instance: 'window',
            left: left,
            top: top,
            strokeWidth: settings.WALL_OBJECT.WINDOW.NODE.STROKE_WIDTH,
            radius: settings.WALL_OBJECT.WINDOW.NODE.RADIUS,
            fill: settings.WALL_OBJECT.WINDOW.NODE.FILL,
            stroke: settings.WALL_OBJECT.WINDOW.NODE.STROKE,
            nodeType: nodeType,
            line: line,
            id: id
        });

        if (!active) {
            windowNode.selectable = false;
        }

        return windowNode;
    }

    static _createObjectLine(distanceStart, distanceEnd, owner, id = null, active = true) {
        let windowLine = new fabric.WallObjectLine([], {
            instance: 'window',
            fill: settings.WALL_OBJECT.WINDOW.LINE.FILL,
            stroke: settings.WALL_OBJECT.WINDOW.LINE.STROKE,
            strokeWidth: settings.WALL_OBJECT.WINDOW.LINE.STROKE_WIDTH,
            owner: owner,
            distance: distanceStart,
            long: distanceEnd,
            id: id
        });

        if (!active) {
            windowLine.selectable = false;
            windowLine.excludeFromExport = true;
        }

        return windowLine;
    }

    static createFromObject(canvas, object, active = true) {
        let line = WindowConstructor._createObjectLine(object.distanceStart, object.distanceEnd,
            canvas.findById(object.owner), object.id, active);
        canvas.add(line);

        canvas.add(WindowConstructor._createObjectNode(line.x1, line.y1, line,
            'start', null, active));
        canvas.add(WindowConstructor._createObjectNode(line.x2, line.y2, line,
            'end', null, active));
    }
}

class DoorConstructor extends AbstractWallObjectConstructor {
    constructor(canvas) {
        super(canvas);
    }

    static _createObjectNode(left, top, line, nodeType, id = null, active = true) {
        let doorNode = new fabric.WallObjectNode({
            instance: 'door',
            left: left,
            top: top,
            strokeWidth: settings.WALL_OBJECT.DOOR.NODE.STROKE_WIDTH,
            radius: settings.WALL_OBJECT.DOOR.NODE.RADIUS,
            fill: settings.WALL_OBJECT.DOOR.NODE.FILL,
            stroke: settings.WALL_OBJECT.DOOR.NODE.STROKE,
            line: line,
            nodeType: nodeType,
            id: id
        });

        if (!active) {
            doorNode.selectable = false;
        }

        return doorNode;
    }

    static _createObjectLine(distanceStart, distanceEnd, owner, id = null, active = true) {
        let doorLine = new fabric.WallObjectLine([], {
            instance: 'door',
            fill: settings.WALL_OBJECT.DOOR.LINE.FILL,
            stroke: settings.WALL_OBJECT.DOOR.LINE.STROKE,
            strokeWidth: settings.WALL_OBJECT.DOOR.LINE.STROKE_WIDTH,
            owner: owner,
            distance: distanceStart,
            long: distanceEnd,
            id: id
        });

        if (!active) {
            doorLine.selectable = false;
            doorLine.excludeFromExport = true;
        }

        return doorLine;
    }

    static createFromObject(canvas, object, active = true) {
        let line = DoorConstructor._createObjectLine(object.distanceStart, object.distanceEnd,
            canvas.findById(object.owner), object.id, active);
        canvas.add(line);

        canvas.add(DoorConstructor._createObjectNode(line.x1, line.y1, line,
            'start', null, active));
        canvas.add(DoorConstructor._createObjectNode(line.x2, line.y2, line,
            'end', null, active));
    }

}

class BeaconConstructor extends AbstractConstructor {
    constructor(canvas) {
        super();

        canvas.defaultCursor = 'cell';
        canvas.hoverCursor = 'cell';
    }

    defaultExit() {
        return 0;
    }

    externalExit() {
        return 0;
    }

    get touch() {
        return this.createBeacon;
    }

    _createOnCanva(data) {
        let pointer = this.canvas.getPointer(this.options.e);
        let beacon = new fabric.Beacon({

            top: pointer.y,
            left: pointer.x,
            heightAboveTheFloor: data.height,
            uuid: data.uuid,
            name: data.name,
            major: data.major,
            minor: data.minor,
            password: data.password
        });

        this.canvas.add(
            beacon
        );
    }

    _onError() {
        return null;
    }

    createBeacon(canvas, options) {

        this.canvas = canvas;
        this.options = options;
        building.userInterface.showBeaconCreateForm(this._createOnCanva.bind(this), this._onError);
    }


    static createFromObject(canvas, object) {
        let beacon = new fabric.Beacon({
            top: object.y,
            left: object.x,
            heightAboveTheFloor: object.heightAboveTheFloor,
            uuid: object.uuid,
            name: object.name,
            major: object.major,
            minor: object.minor,
            id: object.id,
            password: object.password
        });

        canvas.add(
            beacon
        );
    }
}

class ReaderConstructor extends AbstractConstructor {
    constructor(canvas) {
        super();

        canvas.defaultCursor = 'cell';
        canvas.hoverCursor = 'cell';
    }

    defaultExit() {
        return 0;
    }

    externalExit() {
        return 0;
    }

    get touch() {
        return this.createReader;
    }

    _createOnCanva(data) {
        let pointer = this.canvas.getPointer(this.options.e);
        let reader = new fabric.Reader({

            top: pointer.y,
            left: pointer.x,
            heightAboveTheFloor: data.height,
            mac: data.mac
        });

        this.canvas.add(
            reader
        );
    }

    _onError() {
        return null;
    }

    createReader(canvas, options) {
        this.canvas = canvas;
        this.options = options;
        building.userInterface.showReaderCreateForm(this._createOnCanva.bind(this), this._onError);
    }


    static createFromObject(canvas, object) {
        let reader = new fabric.Reader({
            top: object.y,
            left: object.x,
            heightAboveTheFloor: object.heightAboveTheFloor,
            mac: object.mac,
            id: object.id
        });

        canvas.add(
            reader
        );
    }
}

class StackConstructor extends AbstractConstructor {
    constructor(canvas) {
        super();
        canvas.defaultCursor = 'cell';
        canvas.hoverCursor = 'cell';
    }

    defaultExit() {
        return false;
    }

    get touch() {
        return this.createStack;
    }

    createStack(canvas, options) {
        let pointer = canvas.getPointer(options.e);
        let stack = new fabric.Stack({
            left: pointer.x,
            top: pointer.y
        });

        canvas.add(
            stack
        );
    }

    static createFromObject(canvas, object) {
        let stack = new fabric.Stack({
            left: object.x,
            top: object.y,
            scaleX: object.scaleX,
            scaleY: object.scaleY,
            id: object.id
        });

        canvas.add(
            stack
        );

    }
}

class ConnectingStructureConstructor extends AbstractConstructor {
    constructor(canvas, listType) {
        super();

        building.userInterface.showFloorsChoiceList(listType, this._setFloors.bind(this), this._onError);

        canvas.hoverCursor = 'cell';
        canvas.defaultCursor = 'cell';
    }

    _onError() {
        building.userInterface.switchBrush();
    }

    _setFloors(floors) {
        this.floors = floors;
    }

    defaultExit() {
        return 0;
    }

    externalExit() {
        return 0;
    }

    get touch() {
        return this.createStructure;
    }
}

class StairConstructor extends ConnectingStructureConstructor {
    constructor(canvas) {
        super(canvas, 'checkbox');
    }

    createStructure(canvas, options) {
        let pointer = canvas.getPointer(options.e);
        building.stairs.add({
            left: pointer.x,
            top: pointer.y
        }, this.floors);
        building.userInterface.switchBrush();
    }
}

class ElevatorConstructor extends ConnectingStructureConstructor {
    constructor(canvas) {
        super(canvas, 'checkbox');
    }

    createStructure(canvas, options) {
        let pointer = canvas.getPointer(options.e);
        building.elevators.add({
            left: pointer.x,
            top: pointer.y
        }, this.floors);
        building.userInterface.switchBrush();
    }
}

class TravolatorConstructor extends ConnectingStructureConstructor {
    constructor(canvas) {
        super(canvas, 'radiobuttons');
    }

    _setFloors(floors) {
        this.floors = [building.activeFloorName, floors[0]];
    }

    createStructure(canvas, options) {
        let pointer = canvas.getPointer(options.e);
        let direction = 'up';
        if (parseInt(this.floors[0]) > parseInt(this.floors[1])) {
            direction = 'down';
        }

        building.travolators.add({
            left: pointer.x,
            top: pointer.y
        }, this.floors, null, true, direction);

        building.userInterface.switchBrush();
    }
}

class RoomTool extends AbstractConstructor {
    constructor(canvas) {
        super();
        this.canvas = canvas;
        try {
            roomFinder.init(canvas);
        }
        catch (e) {
            return null;
        }

        this.selectArea = null;
        this.hoverRoom = null;
        this.canvas.on('mouse:move', options => {
            let pointer = this.canvas.getPointer(options.e);
            let removeHover = true;
            let self = this;
            let accessAreas = [];
            let accessRooms = [];
            for (let room of roomFinder.exRoomList) {
                let xList = [], yList = [];

                let points = roomFinder.createPolygon(canvas, room);

                for (let point of points) {
                    xList.push(point[0]);
                    yList.push(point[1]);
                }

                if (GeometryHelper.isPointOnPoligon(room.length, xList, yList, pointer)) {
                    accessAreas.push(GeometryHelper.getPoligonArea(xList.length, xList, yList));
                    accessRooms.push(room);
                }
            }

            if (accessRooms.length !== 0) {
                let room = accessRooms[accessAreas.indexOf(Math.min(...accessAreas))];
                displayRoom(room, roomFinder.createPolygon(canvas, room));
            }

            function displayRoom(room, polygon) {

                removeHover = false;

                if (room !== self.hoverRoom) {
                    if (self.selectArea !== null) {
                        self.selectArea.remove();
                    }

                    self.hoverRoom = room;

                    let points = [];

                    for (let i = 0; i < polygon.length; i++) {
                        points.push({
                            x: polygon[i][0],
                            y: polygon[i][1]
                        });
                    }

                    self.selectArea = new fabric.Polygon(points, {
                        stroke: settings.ROOM.STROKE,
                        strokeWidth: settings.ROOM.STROKE_WIDTH,
                        selectable: false,
                        fill: settings.ROOM.FILL,
                        opacity: settings.ROOM.OPACITY,
                        originX: 'left',
                        originY: 'top',
                        excludeFromExport: true,
                        type: 'roomHover',
                        instance: room
                    });
                    canvas.add(self.selectArea);
                }
            }

            if (removeHover) {
                if (this.selectArea !== null) {
                    this.selectArea.remove();
                    this.selectArea = null;
                    this.hoverRoom = null;
                }
            }
        });


    }

    defaultExit() {
        this.canvas.off('mouse:move');
        if (this.selectArea !== null) {
            this.selectArea.remove();
        }
        return 0;
    }

    externalExit() {
        this.canvas.off('mouse:move');
        if (this.selectArea !== null) {
            this.selectArea.remove();
        }
        return 0;
    }

    addRoom(canvas, options) {
        if (options.target !== null && options.target.type === 'roomHover') {
            let number = prompt('Номер помещения', '');
            building.saveRoom(number, options.target.instance);
        }
    }

    get touch() {
        return this.addRoom;
    }
}

class GuideLineConstructor extends AbstractConstructor {
    constructor(canvas, type) {
        super();
        this.canvas = canvas;
        this.type = type;
    }

    defaultExit() {
        return null;
    }

    externalExit() {
        return null;
    }

    addGuideLine(canvas, options) {
        if (options.e.button === 2) {
            return null;
        }
        let pointer = canvas.getPointer(options.e);
        building.userInterface.guideLineManager.add(pointer, this.type);
        building.userInterface.switchBrush();
    }


    get touch() {
        return this.addGuideLine;
    }
}

class CompassConstructor extends AbstractConstructor {
    constructor(canvas, type) {
        super();
        this.canvas = canvas;
        this._navLine = null;
    }

    defaultExit() {
        return null;
    }

    externalExit() {
        this.canvas.off('mouse:move');
        this._navLine.remove();
        this._navLine = null;
        this._compass = null;
        return null;
    }

    addCompass(canvas, options) {

        let pointer = canvas.getPointer(options.e);

        if (building.compass.isOnCanvas()) {
            throw new ConstructorError('Compass allready in constructor');
        }

        if (this._navLine === null) {
            this.switchToWorkState();

            let compass = this._compass = new fabric.Compass({
                left: pointer.x,
                top: pointer.y
            });
            canvas.add(
                compass
            );

            let navLine = this._navLine = new fabric.Line([compass.left, compass.top, pointer.x, pointer.y], {
                stroke: settings.WALL.LINE.STROKE,
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                excludeFromExport: true,
                selectable: false
            });
            canvas.add(
                navLine
            );
            canvas.on('mouse:move', function () {
                let pointer = this.getPointer();
                navLine.set({
                    'x2': pointer.x,
                    'y2': pointer.y
                });
                let lineAngle = GeometryHelper.getLineAngel(
                    {
                        x1: navLine.x1,
                        y1: navLine.y1,
                        x2: navLine.x2,
                        y2: navLine.y2
                    });

                compass.set({angle: lineAngle});
                compass.trigger('rotating', {target: compass});
                navLine.setCoords();
                canvas.renderAll();
            });
        } else {
            canvas.off('mouse:move');
            this._navLine.remove();
            this._navLine = null;
            this.switchToFinishState();
            building.compass.add(this._compass.left, this._compass.top, this._compass.angle);
        }

    }

    static createFromObject(canvas, obj) {
        let compass = new fabric.Compass({
            left: obj.x,
            top: obj.y,
            angle: obj.angle
        });
        canvas.add(compass);
    }


    get touch() {
        return this.addCompass;
    }
}

class RulerConstructor extends AbstractConstructor {
    constructor(canvas) {
        super();
        this.canvas = canvas;
        this.startRulerControl = null;
        this.rulerLine = null;
    }

    addRuler(canvas, options) {
        if (this.startRulerControl === null) {
            this.switchToWorkState();
            let pointer = canvas.getPointer(options.e);

            let startRulerControl = this.startRulerControl = new fabric.RulerControl({
                left: pointer.x,
                top: pointer.y,
                controlType: 'start'
            });

            let rulerLine = this.rulerLine = new fabric.RulerLine([startRulerControl.left, startRulerControl.top, startRulerControl.left, startRulerControl.top], {});

            rulerLine.addControl(startRulerControl);
            startRulerControl.addControlLine(rulerLine);

            canvas.add(startRulerControl);
            canvas.add(rulerLine);


            canvas.renderAll();
            setTimeout(() => {
                canvas.on('mouse:move', function (e) {

                    let pointer = canvas.getPointer(e.e);
                    let endPoint = GeometryHelper.getPointOnLineByLong(
                        {
                            x1: rulerLine.x1,
                            y1: rulerLine.y1,
                            x2: pointer.x,
                            y2: pointer.y
                        },
                        GeometryHelper.getLineLong({
                            x1: rulerLine.x1,
                            y1: rulerLine.y1,
                            x2: pointer.x,
                            y2: pointer.y
                        }) - 10);
                    rulerLine.set({
                        'x2': pointer.x,
                        'y2': pointer.y
                    });
                    rulerLine.trigger('movingOnCreate', {});
                    canvas.renderAll();
                });
            }, 10);

        } else {
            this.startRulerControl = null;

            let endRulerControl = new fabric.RulerControl({
                left: this.rulerLine.x2,
                top: this.rulerLine.y2,
                controlType: 'end'
            });

            this.rulerLine.addControl(endRulerControl);
            endRulerControl.addControlLine(this.rulerLine);

            canvas.add(endRulerControl);
            this.rulerLine.trigger('createEnd', {});
            this.rulerLine = null;
            canvas.off('mouse:move');
            this.switchToFinishState();
        }

    }

    defaultExit() {
        return null;
    }

    externalExit() {
        canvas.off('mouse.move');
        return null;
    }

    get touch() {
        return this.addRuler;
    }

}

class RemoveCommand {
    static execute(object) {
        object.beforeDelete();
        object.remove();
    }
}


var roomFinder = {
    roomList: [],
    /**
     * @param {fabric.Canvas} canvas
     */
    init: function (canvas) {
        let nodes = canvas.getObjects('wallNode');

        this.canvas = canvas;
        let {vertexList, edgeList} = this.mapNodes(nodes);

        let searchResults = this.searchCycles(vertexList, edgeList);
        let rooms = searchResults.catalogCycles;
        let hashes = searchResults.hashes;

        if (rooms.length === 0) {
            throw new ConstructorError('rooms not finded');
        }

        /**
         * удаляем повторяющиеся циклы
         * @param rooms
         */
        function deleteDuplicateRooms(rooms, hashes) {

            let result = [rooms[0]];
            let resultHash = [hashes[0]];

            for (let i = 1; i < rooms.length; i++) {
                let flag = true;
                for (let j = 0; j < result.length; j++) {
                    if (hashes[i] === resultHash[j]) {
                        flag = false;
                        break;
                    }
                }

                if (flag) {
                    result.push(rooms[i]);
                    resultHash.push(hashes[i]);
                }
            }

            return result;
        }


        rooms = deleteDuplicateRooms(rooms, hashes);


        /**
         * удаляем циклы которые включают в себя другие циклы
         * @param rooms
         */
        function deleteGeneralCycles(rooms) {
            let generalCycle = [];

            //считаем площади комнат
            let areas = [];
            let xLists = [];
            let yLists = [];
            for (let i = 0; i < rooms.length; i++) {
                let ixList = [], iyList = [];
                for (let k = 0; k < rooms[i].length; k++) {
                    ixList.push(vertexList[rooms[i][k]].x);
                    iyList.push(vertexList[rooms[i][k]].y);
                }
                xLists.push(ixList);
                yLists.push(iyList);
                areas.push(GeometryHelper.getPoligonArea(rooms[i].length, ixList, iyList));
            }


            for (let i = 0; i < rooms.length; i++) {
                if (generalCycle.indexOf(i) !== -1) {
                    continue;
                }
                for (let j = 0; j < rooms.length; j++) {
                    if (i !== j && generalCycle.indexOf(j) === -1) {

                        if (areas[i] > areas[j]) {
                            continue;
                        }

                        let isGeneral = true;
                        //условие - все точки проверочного цикла внутри проверяемого
                        for (let k = 0; k < rooms[i].length; k++) {

                            if (rooms[j].indexOf(rooms[i][k]) === -1) {
                                if (!GeometryHelper.isPointOnPoligon(rooms[j].length, xLists[j], yLists[j],
                                        vertexList[rooms[i][k]])) {
                                    isGeneral = false;
                                    break;
                                }
                            }

                        }

                        //условие - хотя бы 1 точка общая точка e проверочного и проверяемого
                        let hasJointPoint = false;
                        for (let k = 0; k < rooms[i].length; k++) {
                            for (let h = 0; h < rooms[j].length; h++) {
                                if (vertexList[rooms[i][k]].x === vertexList[rooms[j][h]].x
                                    && vertexList[rooms[i][k]].y === vertexList[rooms[j][h]].y) {
                                    hasJointPoint = true;
                                    break;
                                }
                            }
                            if (hasJointPoint) {
                                break;
                            }
                        }

                        if (!hasJointPoint) {
                            isGeneral = false;
                        }

                        if (isGeneral) {
                            let randPoint = GeometryHelper.getPoligonCenterPoint(rooms[i].length, xLists[i],
                                yLists[i]);
                            let isEnclosed = false;
                            if (GeometryHelper.isPointOnPoligon(rooms[i].length, xLists[i], yLists[i], randPoint)) {
                                if (GeometryHelper.isPointOnPoligon(rooms[j].length, xLists[j], yLists[j], randPoint)) {
                                    isEnclosed = true;
                                }
                            } else {
                                isEnclosed = true;
                            }

                            if (isEnclosed) {
                                generalCycle.push(j);
                            }
                        }


                    }
                }
            }

            return rooms.filter((el, i) => generalCycle.indexOf(i) === -1);
        }


        rooms = deleteGeneralCycles(rooms);

        this.exRoomList = [];
        let wallLines = canvas.getObjects('wallLine');
        for (let i = 0; i < rooms.length; i++) {
            let room = [];
            for (let j = 0; j < rooms[i].length; j++) {
                room.push(vertexList[rooms[i][j]]);
            }

            let xList = [], yList = [];
            for (let j = 0; j < rooms[i].length; j++) {
                xList.push(vertexList[rooms[i][j]].x);
                yList.push(vertexList[rooms[i][j]].y);
            }

            let exRoom = [];
            for (let wallLine of wallLines) {
                for (let node of room) {
                    if (wallLine.hasOwner(node.id)) {
                        for (let nNode of room) {
                            if (node !== nNode && wallLine.hasOwner(nNode.id)) {
                                if (exRoom.indexOf(wallLine.id) === -1) {
                                    exRoom.push(wallLine.id);
                                }
                            }
                        }
                    }
                }
            }
            this.exRoomList.push(exRoom);
        }

    },

    createPolygon: function (canvas, room) {

        let points = [];

        function createPath(startWall, coordType) {
            let point = coordType === 1 ? [startWall.x1, startWall.y1] : [startWall.x2, startWall.y2];
            for (let i = 0; i < points.length; i++) {
                if (isCompare(points[i], point)) {
                    return;
                }
            }


            points.push(point);
            let findPoint;
            coordType === 1 ? findPoint = {
                x: startWall.x2,
                y: startWall.y2
            } : findPoint = {
                x: startWall.x1,
                y: startWall.y1
            };

            for (let i = 0; i < room.length; i++) {
                let wall = canvas.findById(room[i]);
                if (wall === startWall) {
                    continue;
                }

                if (wall.x1 === findPoint.x && wall.y1 === findPoint.y) {
                    createPath(wall, 1);
                    return;
                }

                if (wall.x2 === findPoint.x && wall.y2 === findPoint.y) {
                    createPath(wall, 2);
                    return;
                }
            }
        }


        createPath(canvas.findById(room[0]), 1);
        return points;
    },

    searchCycles: function (vertexList, edgeList) {


        var catalogCycles = [];
        var hashes = [];
        let color = [];
        var minCyclesLength = [];
        for (let i = 0; i < vertexList.length; i++) {

            for (let k = 0; k < vertexList.length; k++) {
                color[k] = 1;
            }

            let cycle = [];

            cycle.push(i);

            var minCicle = [];
            DFSMINcycle(i, i, edgeList, color, -1, cycle);
            minCyclesLength.push(minCicle.length);
        }

        var maxLength = Math.max(...minCyclesLength);

        for (let i = 0; i < vertexList.length; i++) {

            for (let k = 0; k < vertexList.length; k++) {
                color[k] = 1;
            }

            let cycle = [];

            cycle.push(i);

            for (let k = 0; k < vertexList.length; k++) {
                color[k] = 1;
            }
            DFScycle(i, i, edgeList, color, -1, cycle);
        }

        function getHash(s) {
            let result = 0;
            for (let i = 0; i < s.length; i++) {
                result += Math.pow(s[i], 3);
            }
            return result;
        }

        function DFScycle(u, endV, E, color, unavailableEdge, cycle) {
            if (u !== endV)
                color[u] = 2;
            else if (cycle.length >= 2) {
                let s = [];
                for (let i = 0; i < cycle.length - 1; i++) {
                    s.push(cycle[i]);
                }
                let hash = getHash(s);

                catalogCycles.push(s);
                hashes.push(hash);

                return;
            }

            if (cycle.length > maxLength) {
                return;
            }

            for (let w = 0; w < E.length; w++) {
                if (w == unavailableEdge)
                    continue;
                if (color[E[w].v2] == 1 && E[w].v1 == u) {
                    let cycleNEW = cycle.slice(0);
                    cycleNEW.push(E[w].v2);
                    DFScycle(E[w].v2, endV, E, color, w, cycleNEW);
                    color[E[w].v2] = 1;
                }
                else if (color[E[w].v1] == 1 && E[w].v2 == u) {
                    let cycleNEW = cycle.slice(0);
                    cycleNEW.push(E[w].v1);
                    DFScycle(E[w].v1, endV, E, color, w, cycleNEW);
                    color[E[w].v1] = 1;
                }
            }
        }

        function DFSMINcycle(u, endV, E, color, unavailableEdge, cycle) {
            if (u !== endV)
                color[u] = 2;
            else if (cycle.length >= 2) {
                let s = [];
                for (let i = 0; i < cycle.length - 1; i++) {
                    s.push(cycle[i]);
                }
                minCicle = s;

                return;
            }

            if (cycle.length >= minCicle.length && minCicle.length !== 0) {
                return;
            }

            for (let w = 0; w < E.length; w++) {
                if (w == unavailableEdge)
                    continue;
                if (color[E[w].v2] == 1 && E[w].v1 == u) {
                    let cycleNEW = cycle.slice(0);
                    cycleNEW.push(E[w].v2);
                    DFSMINcycle(E[w].v2, endV, E, color, w, cycleNEW);
                    color[E[w].v2] = 1;
                }
                else if (color[E[w].v1] == 1 && E[w].v2 == u) {
                    let cycleNEW = cycle.slice(0);
                    cycleNEW.push(E[w].v1);
                    DFSMINcycle(E[w].v1, endV, E, color, w, cycleNEW);
                    color[E[w].v1] = 1;
                }
            }
        }

        return {
            catalogCycles: catalogCycles,
            hashes: hashes
        };
    },

    mapNodes: function (nodes) {
        let vertex = [];
        let edges = [];
        for (let node of nodes) {

            vertex.push({
                id: node.id,
                x: node.left,
                y: node.top
            });

        }

        for (let node of nodes) {
            let mainVertex = vertex.find(function (el, i) {
                if (el.id === node.id) return true;
            });

            for (let inLine of node.inLines) {
                let line = node.canvas.findById(inLine);
                let friendNode = line.getOwner(0);
                let friendVertex = vertex.find(function (el) {
                    if (el.id === friendNode.id) return true;
                });
                edges.push({
                    v1: vertex.indexOf(mainVertex),
                    v2: vertex.indexOf(friendVertex)
                });
            }

            for (let outLine of node.outLines) {
                let line = node.canvas.findById(outLine);
                let friendNode = line.getOwner(1);
                let friendVertex = vertex.find(function (el) {
                    if (el.id === friendNode.id) return true;
                });
                edges.push({
                    v1: vertex.indexOf(mainVertex),
                    v2: vertex.indexOf(friendVertex)
                });
            }
        }

        function deleteDuplicates(edges) {
            let result = [edges[0]];
            for (let i = 1; i < edges.length; i++) {
                let flag = false;
                for (let j = 0; j < result.length; j++) {
                    if ((
                            result[j].v1 === edges[i].v1 && result[j].v2 === edges[i].v2
                        ) ||
                        (
                            result[j].v1 === edges[i].v2 && result[j].v2 === edges[i].v1
                        )) {
                        flag = true;
                        break;
                    }
                }

                if (!flag) {
                    result.push(edges[i]);
                }
            }
            return result;
        }

        if (edges.length !== 0) {
            edges = deleteDuplicates(edges);
        }

        return {
            vertexList: vertex,
            edgeList: edges
        };
    }
};

var tool = {
    _tool: null,
    set: function (toolName, canvas) {
        if (this.active()) {
            this._tool.stopConstruct();
        }
        this._tool = createTool(toolName, canvas);
    },
    get: function () {
        return this._tool;
    },
    active: function () {
        return this._tool !== null;
    }
};

var createTool = function (toolName, canvas) {
    switch (toolName) {
        case 'wall':
            return new WallConstructor(canvas);
        case 'window':
            return new WindowConstructor(canvas);
        case 'door':
            return new DoorConstructor(canvas);
        case 'beacon':
            return new BeaconConstructor(canvas);
        case 'stack':
            return new StackConstructor(canvas);
        case 'stair':
            return new StairConstructor(canvas);
        case 'elevator':
            return new ElevatorConstructor(canvas);
        case 'travolator':
            return new TravolatorConstructor(canvas);
        case 'room-select':
            return new RoomTool(canvas);
        case 'nothing':
            return new DefaultState(canvas);
        case 'guide-line-horizontal':
            return new GuideLineConstructor(canvas, 'horizontal');
        case 'guide-line-vertical':
            return new GuideLineConstructor(canvas, 'vertical');
        case 'compass':
            return new CompassConstructor(canvas);
        case 'ruler':
            return new RulerConstructor(canvas);
        case 'reader':
            return new ReaderConstructor(canvas);
        default :
            throw new ConstructorError('constructor not implemented');
    }
};

/**
 * add dblcick event
 */
(function () {

    var addListener = fabric.util.addListener;
    var removeListener = fabric.util.removeListener;

    fabric.CanvasEx = fabric.util.createClass(fabric.Canvas, /** @lends fabric.Canvas */ {
        tapholdThreshold: 2000,

        _bindEvents: function () {
            var self = this;

            self.callSuper('_bindEvents');

            self._onDoubleClick = self._onDoubleClick.bind(self);
            self._onTapHold = self._onTapHold.bind(self);
        },

        _onDoubleClick: function (e) {
            var self = this;

            var target = self.findRealTarget(e);
            self.fire('mouse:dblclick', {
                target: target,
                e: e
            });

            if (target && !self.isDrawingMode) {
                // To unify the behavior, the object's double click event does not fire on drawing mode.
                target.fire('object:dblclick', {
                    e: e
                });
            }
        },

        _onTapHold: function (e) {
            var self = this;

            var target = self.findRealTarget(e);
            self.fire('touch:taphold', {
                target: target,
                e: e
            });

            if (target && !self.isDrawingMode) {
                // To unify the behavior, the object's tap hold event does not fire on drawing mode.
                target.fire('taphold', {
                    e: e
                });
            }

            if (e.type === 'touchend' && self.touchStartTimer != null) {
                clearTimeout(self.touchStartTimer);
            }
        },

        _onMouseDown: function (e) {
            var self = this;

            self.callSuper('_onMouseDown', e);

            if (e.type === 'touchstart') {
                var touchStartTimer = setTimeout(function () {
                    self._onTapHold(e);
                    self.isLongTap = true;
                }, self.tapholdThreshold);

                self.touchStartTimer = touchStartTimer;

                return;
            }

            var isTargetGroup = false;
            var target = self.findTarget(e);
            if (target !== undefined && target._objects !== undefined) {
                isTargetGroup = true;
            }

            // Add right click support and group object click support.
            if (e.which === 3 || (
                    isTargetGroup && self.fireEventForObjectInsideGroup
                )) {
                // Skip group to find the real object.
                var target = self.findRealTarget(e);

                if (!isTargetGroup || !self.fireEventForObjectInsideGroup) {
                    // Canvas event only for right click. For group object, the super method already fired a canvas event.
                    self.fire('mouse:down', {
                        target: target,
                        e: e
                    });
                }

                if (target && !self.isDrawingMode) {
                    // To unify the behavior, the object's mouse down event does not fire on drawing mode.
                    target.fire('mousedown', {
                        e: e
                    });
                }
            }
        },

        _onMouseUp: function (e) {
            var self = this;

            self.callSuper('_onMouseUp', e);

            if (e.type === 'touchend') {
                // Process tap hold.
                if (self.touchStartTimer != null) {
                    clearTimeout(self.touchStartTimer);
                }

                // Process long tap.
                if (self.isLongTap) {
                    self._onLongTapEnd(e);
                    self.isLongTap = false;
                }

                // Process double click
                var now = new Date().getTime();
                var lastTouch = self.lastTouch || now + 1;
                var delta = now - lastTouch;
                if (delta < 300 && delta > 0) {
                    // After we detct a doubletap, start over
                    self.lastTouch = null;

                    self._onDoubleTap(e);
                } else {
                    self.lastTouch = now;
                }

                return;
            }
        },

        _onDoubleTap: function (e) {
            var self = this;

            var target = self.findRealTarget(e);
            self.fire('touch:doubletap', {
                target: target,
                e: e
            });

            if (target && !self.isDrawingMode) {
                // To unify the behavior, the object's double tap event does not fire on drawing mode.
                target.fire('object:doubletap', {
                    e: e
                });
            }
        },

        _onLongTapEnd: function (e) {
            var self = this;

            var target = self.findRealTarget(e);
            self.fire('touch:longtapend', {
                target: target,
                e: e
            });

            if (target && !self.isDrawingMode) {
                // To unify the behavior, the object's long tap end event does not fire on drawing mode.
                target.fire('object:longtapend', {
                    e: e
                });
            }
        },

        _initEventListeners: function () {
            var self = this;
            self.callSuper('_initEventListeners');

            addListener(self.upperCanvasEl, 'dblclick', self._onDoubleClick);
        },

        _checkTargetForGroupObject: function (obj, pointer) {
            if (obj &&
                obj.visible &&
                obj.evented &&
                this._containsPointForGroupObject(pointer, obj)) {
                if ((
                        this.perPixelTargetFind || obj.perPixelTargetFind
                    ) && !obj.isEditing) {
                    var isTransparent = this.isTargetTransparent(obj, pointer.x, pointer.y);
                    if (!isTransparent) {
                        return true;
                    }
                }
                else {
                    return true;
                }
            }
        },

        _containsPointForGroupObject: function (pointer, target) {
            var xy = this._normalizePointer(target, pointer);

            // http://www.geog.ubc.ca/courses/klink/gis.notes/ncgia/u32.html
            // http://idav.ucdavis.edu/~okreylos/TAship/Spring2000/PointInPolygon.html
            return (
                target.containsPoint(xy) || target._findTargetCorner(pointer)
            );
        },

        _adjustPointerAccordingToGroupObjects: function (originalPointer, group) {
            var groupObjects = group._objects;
            var objectLength = groupObjects.length;
            if (objectLength <= 0) {
                return originalPointer;
            }

            var minLeft = 99999;
            var minTop = 99999;

            var i;
            for (i = 0; i < objectLength; i++) {
                var obj = groupObjects[i];
                if (minLeft > obj.left) {
                    minLeft = obj.left;
                }

                if (minTop > obj.top) {
                    minTop = obj.top;
                }
            }

            originalPointer.x += minLeft - group.left;
            originalPointer.y += minTop - group.top;

            return originalPointer;
        },

        findRealTarget: function (e) {
            var self = this;
            var target;
            if (!self.fireEventForObjectInsideGroup) {
                target = self.findTarget(e);
            }
            else {
                // Skip group to find the real object.
                var target = self.findTarget(e, true);
                if (target !== undefined && target._objects !== undefined) {
                    var pointer = self.getPointer(e, true);
                    var objects = target._objects;
                    pointer = self._adjustPointerAccordingToGroupObjects(pointer, target);
                    var i = objects.length;
                    while (i--) {
                        if (self._checkTargetForGroupObject(objects[i], pointer)) {
                            target = objects[i];

                            break;
                        }
                    }
                }
            }

            return target;
        },

        removeListeners: function () {
            var self = this;
            self.callSuper('removeListeners');

            removeListener(self.upperCanvasEl, 'dblclick', self._onDoubleClick);
        },

        fireEventForObjectInsideGroup: false
    });
})();
