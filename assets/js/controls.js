/**
 * Created by godzie@yandex.ru.
 * Date: 23.07.2016
 */

'use strict';

let controlsManager = {
    panLimits: [],
    zoomLimits: [],
    init: function (canvas, building) {
        tool.set('nothing', canvas);

        let guideLineManager = this.guideLineManager = new GuideLineManager(canvas);

        $('input[type=radio]').change(function () {
            setTimeout(() => {
                tool.set($(this).val(), canvas);
            }, 10);
        });

        $('#btn-new-floor').click(function () {
            let number = prompt('Номер этажа', '');
            building.addFloor(number);
        });

        $('select[name="floors-list"]').change(function () {
            let number = $(this).find(':selected').val();
            building.switchFloor(number);
            guideLineManager.redraw();
        });


        $('#delete').click(function () {
            RemoveCommand.execute(canvas.getActiveObject());
        });

        $('#change').click(function () {
            if (!canvas.getActiveObject()) {
                return;
            }
            if (canvas.getActiveObject().type === 'beacon') {
                var beacon = canvas.getActiveObject();
                var $form = $('#beacon-create-form');

                $form.find('input[name="BeaconCreateForm[name]"]').val(beacon.name);
                $form.find('input[name="BeaconCreateForm[height]"]').val(beacon.heightAboveTheFloor);
                $form.find('input[name="BeaconCreateForm[uuid]"]').val(beacon.uuid);
                $form.find('input[name="BeaconCreateForm[major]"]').val(beacon.major);
                $form.find('input[name="BeaconCreateForm[minor]"]').val(beacon.minor);
                $form.find('input[name="BeaconCreateForm[password]"]').val(beacon.password);
                $('#beacon-create-modal').modal('show');

                $form.on('afterValidate', function (event, messages, errorAttributes) {
                    if (errorAttributes.length === 0) {
                        var beacon = canvas.getActiveObject();
                        if (!beacon) {
                            return false;
                        }
                        beacon.name = $form.find('input[name="BeaconCreateForm[name]"]').val();
                        beacon.heightAboveTheFloor = $form.find('input[name="BeaconCreateForm[height]"]').val();
                        beacon.uuid = $form.find('input[name="BeaconCreateForm[uuid]"]').val();
                        beacon.major = $form.find('input[name="BeaconCreateForm[major]"]').val();
                        beacon.minor = $form.find('input[name="BeaconCreateForm[minor]"]').val();
                        beacon.password = $form.find('input[name="BeaconCreateForm[password]"]').val();

                        $form.off('afterValidate');
                        $('#beacon-create-modal').modal('hide');
                    }
                });

                $form.on('beforeSubmit', function (e) {
                    return false;
                });
            }

            if (canvas.getActiveObject().type === 'reader') {
                var reader = canvas.getActiveObject();
                var $form = $('#reader-create-form');


                $form.find('input[name="ReaderCreateForm[height]"]').val(reader.heightAboveTheFloor);
                $form.find('input[name="ReaderCreateForm[mac]"]').val(reader.mac);
                $('#reader-create-modal').modal('show');

                $form.on('afterValidate', function (event, messages, errorAttributes) {
                    if (errorAttributes.length === 0) {
                        var reader = canvas.getActiveObject();
                        if (!reader) {
                            return false;
                        }

                        reader.heightAboveTheFloor = $form.find('input[name="ReaderCreateForm[height]"]').val();
                        reader.mac = $form.find('input[name="ReaderCreateForm[mac]"]').val();

                        $form.off('afterValidate');
                        $('#reader-create-modal').modal('hide');
                    }
                });

                $form.on('beforeSubmit', function (e) {
                    return false;
                });
            }
        });

        $('#add-products').click(function () {

            let productsInStack = building.stackData[canvas.getActiveObject().id];

            $('input[type="checkbox"][name="product-list[]"]').each(function (i, el) {

                if (productsInStack.indexOf(parseInt($(el).val())) !== -1) {
                    $(el).prop("checked", true);
                } else {
                    $(el).prop("checked", false);
                }
            });
        });

        $('input[type="checkbox"][name="product-list[]"]').change(function () {
            if ($(this).prop("checked")) {
                building.addProductToStack(parseInt($(this).val()), canvas.getActiveObject().id);
            } else {
                building.deleteProductFromStack(parseInt($(this).val()), canvas.getActiveObject().id);
            }
        });

        $('input[type="text"][name="search-product"]').keyup(function () {
            if ($(this).val() === ' ' || $(this).val() === '') {
                $('input[type="checkbox"][name="product-list[]"]').each(function (i, el) {
                    $(el).parent().hide();
                });
                return null;
            }

            let findStr = new RegExp($(this).val(), 'ig');

            $('input[type="checkbox"][name="product-list[]"]').each(function (i, el) {
                if ($(el).parent().text().match(findStr)) {
                    $(el).parent().show();
                } else {
                    $(el).parent().hide();
                }
            });

        });

        canvas.on('object:selected', function (e) {
            $("#command-panel").show();
            if (e.target.type === 'stack') {
                $("#add-products").show();
            } else {
                $("#add-products").hide();
            }
            if (e.target.type === 'beacon' || e.target.type === 'reader') {
                $("#change").show();
            } else {
                $("#change").hide();
            }
        });

        canvas.on('selection:cleared', function () {
            $("#command-panel").hide();
        });

        canvas.on('mouse:up', function (options) {
            if (tool.active()) {
                tool.get().touch(canvas, options);
            }
        });

        let canvasSelectionState;
        let self = this;

        function startPan(event) {
            if (event.button != 2) {
                return;
            }

            canvasSelectionState = canvas.selection;
            canvas.selection = false;

            var x0 = event.screenX,
                y0 = event.screenY;

            function continuePan(event) {


                var x = event.screenX,
                    y = event.screenY;
                let panPount = new fabric.Point(-(
                                                x - x0
                    ) - canvas.viewportTransform[4],
                    -(
                    y - y0
                    ) - canvas.viewportTransform[5]);

                if (self.panLimits.length !== 0) {
                    let vp = canvas.viewportTransform;
                    if (panPount.x > self.panLimits[1] || panPount.x < self.panLimits[0]
                        || panPount.y > self.panLimits[3] || panPount.y < self.panLimits[2]) {
                        return;
                    } else {
                        canvas.relativePan({
                            x: x - x0,
                            y: y - y0
                        });
                    }
                } else {
                    canvas.relativePan({
                        x: x - x0,
                        y: y - y0
                    });
                }

                x0 = x;
                y0 = y;

                canvas.refreshGrid();

            }

            function stopPan(event) {
                canvas.selection = canvasSelectionState;
                $(window).off('mousemove', continuePan);
                $(window).off('mouseup', stopPan);
            };
            $(window).mousemove(continuePan);
            $(window).mouseup(stopPan);
            $(window).contextmenu(cancelMenu);
        };
        function cancelMenu() {
            $(window).off('contextmenu', cancelMenu);
            return false;
        };
        $(canvas.wrapperEl).mousedown(startPan);

        canvas.on('mouse:dblclick', function (options) {
            WallNodeConstructor.construct(canvas, options);
        });

        $(canvas.wrapperEl).on('mousewheel', function (e) {
            var delta = e.originalEvent.wheelDelta; // to get +/- 2%

            var posXview = e.offsetX;
            var posYview = e.offsetY;
            var zoomValue;

            if (delta < 0) {
                let oldZoom = canvas.getZoom();
                zoomValue = oldZoom / 1.1;
                zoomValue = zoomValue < 0.01 ? 0.01 : zoomValue;

                if (self.zoomLimits.length !== 0) {
                    let vph = canvas.getHeight() / canvas.viewportTransform[0];
                    let vpw = canvas.getWidth() / canvas.viewportTransform[0];
                    if (vph > self.zoomLimits[1] || vpw > self.zoomLimits[0]) {
                        return;
                    } else {
                        canvas.zoomToPoint(new fabric.Point(posXview, posYview), zoomValue);
                        canvas.refreshGrid();
                    }
                } else {
                    canvas.zoomToPoint(new fabric.Point(posXview, posYview), zoomValue);
                    canvas.refreshGrid();
                }


            }
            else if (delta > 0) {
                let oldZoom = canvas.getZoom();
                zoomValue = oldZoom * 1.1;
                zoomValue = zoomValue > 6 ? 6 : zoomValue;
                canvas.zoomToPoint(new fabric.Point(posXview, posYview), zoomValue);
                canvas.refreshGrid();
            }


            canvas.trigger("zooming");
            e.preventDefault();
        });

        /**
         * on group moving strategy:
         * change lines position automaticly
         */
        canvas.on('before:selection:cleared', function (e) {

            if (e.e !== undefined && e.target !== null && e.target.type === 'group') {
                for (let object of e.target.getObjects()) {
                    if (object.type === 'wallLine' || object.type === 'wallObjectLine') {
                        object.x1 = object.x1 + e.target.left - e.target._originalLeft;
                        object.y1 = object.y1 + e.target.top - e.target._originalTop;
                        object.x2 = object.x2 + e.target.left - e.target._originalLeft;
                        object.y2 = object.y2 + e.target.top - e.target._originalTop;
                    }
                }
            }
        });

        /**
         * on group moving strategy:
         * disable line moving when select wall line or wall object line
         * enable line moving when select group of object
         */
        canvas.on('object:selected', function (e) {
            if (e.target.type === 'wallLine' || e.target.type === 'wallObjectLine') {
                e.target.lockMovementX = true;
                e.target.lockMovementY = true;
                canvas.discardActiveObject();
            }
            if (e.target.type === 'group') {
                e.target.hasControls = false;
                for (let object of e.target.getObjects()) {
                    if (object.type === 'wallLine' || object.type === 'wallObjectLine') {
                        object.lockMovementX = false;
                        object.lockMovementY = false;
                    }
                }
            }
        });

        canvas.on('zooming', function () {

            var invertedMatrix = fabric.util.invertTransform(canvas.viewportTransform);
            var transformedLeftTop = fabric.util.transformPoint({
                x: 0,
                y: 0
            }, invertedMatrix);
            var transformedRightBot = fabric.util.transformPoint({
                x: this.width,
                y: this.height
            }, invertedMatrix);

            let lines = canvas.getObjects('guideLine');

            let zoom = this.getZoom();
            for (let line of lines) {
                let dashMultiple = zoom > 0.8 ? 2 : (
                    zoom > 0.5 ? 3 : (
                        zoom > 0.2 ? 5 : (
                            zoom > 0.1 ? 8 : (
                                zoom > 0.02 ? 16 : 24
                            )
                        )
                    )
                );
                let dashArray = [5 * dashMultiple, 5 * dashMultiple];

                let lineWidth = zoom > 4 ? 1 : (
                    zoom > 1 ? 2 : (
                        zoom > 0.8 ? 3 : (
                            zoom > 0.5 ? 4 : (
                                zoom > 0.2 ? 12 : 20
                            )
                        )
                    )
                );
                if (line.y1 === line.y2) {
                    line.set({
                        x1: transformedLeftTop.x,
                        x2: transformedRightBot.x,
                        strokeWidth: lineWidth,
                        strokeDashArray: dashArray
                    });
                } else {
                    line.set({
                        y1: transformedLeftTop.y,
                        y2: transformedRightBot.y,
                        strokeWidth: lineWidth,
                        strokeDashArray: dashArray
                    });
                }
            }
        });

        canvas.on('object:moving', function (options) {
            if (options.target.type === 'guideLine') {
                return;
            }
            let isBound = false;
            canvas.forEachObject(function (obj) {
                if (obj.type !== 'guideLine' || isBound) return;

                let pointer = canvas.getPointer(options.e);
                options.target.left = pointer.x;
                options.target.top = pointer.y;
                options.target.setCoords();
                if (options.target.intersectsWithObject(obj)) {
                    if (options.target.type === 'travolator' || options.target.type === 'stack'
                        || options.target.type === 'stair' || options.target.type === 'elevator') {

                        let {x,y} = GeometryHelper.putPointOnLine({
                            x: pointer.x,
                            y: pointer.y
                        }, {
                            x1: obj.x1,
                            y1: obj.y1,
                            x2: obj.x2,
                            y2: obj.y2
                        });

                        if (obj.y1 === obj.y2) {
                            options.target.left = x;
                            let delta = options.target.angle === 90 || options.target.angle === 270 ?
                                        options.target.getWidth() : options.target.getHeight();
                            if (options.target.type === 'travolator' && delta === options.target.getHeight()) {
                                if (options.target.direction === 'up' && pointer.y > obj.y1) {
                                    delta = -(
                                        delta / 3.4
                                    );
                                } else if (options.target.direction === 'down' && pointer.y < obj.y1) {
                                    delta = -(
                                        delta / 3.4
                                    );
                                }
                            }
                            options.target.top = pointer.y > obj.y1 ? y + delta / 2
                                : y - delta / 2;
                        } else if (obj.x1 === obj.x2) {
                            let delta = options.target.angle === 90 || options.target.angle === 270 ?
                                        options.target.getHeight() : options.target.getWidth();
                            if (options.target.type === 'travolator' && delta === options.target.getHeight()) {
                                if (options.target.direction === 'up' && pointer.x < obj.x1) {
                                    delta = -(
                                        options.target.getHeight() / 3.4
                                    );
                                } else if (options.target.direction === 'down' && pointer.x > obj.x1) {
                                    delta = -(
                                        options.target.getHeight() / 3.4
                                    );
                                }
                            }
                            options.target.left = pointer.x > obj.x1 ? x + delta / 2
                                : x - delta / 2;
                            options.target.top = y;
                        }
                        options.target.setCoords();
                    } else {
                        let {x,y} = GeometryHelper.putPointOnLine({
                            x: pointer.x,
                            y: pointer.y
                        }, {
                            x1: obj.x1,
                            y1: obj.y1,
                            x2: obj.x2,
                            y2: obj.y2
                        });
                        options.target.left = x;
                        options.target.top = y;
                        options.target.setCoords();
                    }

                    isBound = true;
                }
            });
        });
    },

    switchBrush: function (brush = 'nothing') {
        let brushControl = $('input[value="' + brush + '"]');
        brushControl.prop('checked', true);
        brushControl.trigger('change');
    },

    setFloorList: function (floors) {
        for (let floor of floors) {
            $('select[name="floors-list"]').append('<option value=' + floor.number + '>' + floor.number + '</option>');
        }
    },

    addFloor: function (name) {
        $('select[name="floors-list"]').append('<option value=' + name + '>' + name + '</option>');
    },

    onFloorChoose: function () {
        let number = $('select').find(':selected').val();
        building.switchFloor(number);
    },

    showFloorsChoiceList: function (listType = 'checkbox', onChoice, onError) {
        let content = '';

        if (listType === 'checkbox') {
            $('select[name="floors-list"]').find('option').each(function () {
                content += '<p><input type="checkbox" value="' + $(this).val() + '"> ' + $(this).val() + '</p>';
            });
        } else if (listType === 'radiobuttons') {
            $('select[name="floors-list"]').find('option').each(function () {
                if (building.activeFloorName != $(this).val()) {
                    content += '<p><input name="floors-radio-list" type="radio" value="' + $(this).val() + '"> ' + $(
                            this)
                            .val() + '</p>';
                }
            });
        } else {
            throw new Error('list type not emplemented');
        }

        $('#floor-choice-wrap').empty();
        $('#floor-choice-wrap').append(content);
        $('#floor-choice-form').modal('show');

        $('#floor-choice-submit').click(function () {
            $('#floor-choice-form').modal('hide');
        });
        $('#floor-choice-form').off('hidden.bs.modal');
        $('#floor-choice-form').on('hidden.bs.modal', function (e) {
            let floors = [];
            $("#floor-choice-wrap input:checked").each(function () {
                floors.push($(this).val());
            });
            if (floors.length === 0) {
                alert('ошибка выберите хотябы 1 этаж');
                onError();
            } else {
                onChoice(floors);
            }
        })

    },

    showBeaconCreateForm: function (onChoice, onError) {
        var $form = $('#beacon-create-form');

        $('#beacon-create-modal').modal('show');
        let formValidate = false;
        $form.on('afterValidate', function (event, messages, errorAttributes) {

            if (errorAttributes.length === 0) {
                let data = {
                    name: $form.find('input[name="BeaconCreateForm[name]"]').val(),
                    height: $form.find('input[name="BeaconCreateForm[height]"]').val(),
                    uuid: $form.find('input[name="BeaconCreateForm[uuid]"]').val(),
                    major: $form.find('input[name="BeaconCreateForm[major]"]').val(),
                    minor: $form.find('input[name="BeaconCreateForm[minor]"]').val(),
                    password: $form.find('input[name="BeaconCreateForm[password]"]').val()
                };

                onChoice(data);
                formValidate = true;
                $form.off('afterValidate');
                $('#beacon-create-modal').modal('hide');
            }
        });

        $form.on('beforeSubmit', function (e) {
            return false;
        });

        $('#beacon-create-modal').on('hidden.bs.modal', function (e) {
            if (!formValidate) {
                onError();
            }
        })
    },

    showReaderCreateForm: function (onChoice, onError) {
        var $form = $('#reader-create-form');

        $('#reader-create-modal').modal('show');
        let formValidate = false;
        $form.on('afterValidate', function (event, messages, errorAttributes) {

            if (errorAttributes.length === 0) {
                let data = {
                    height: $form.find('input[name="ReaderCreateForm[height]"]').val(),
                    mac: $form.find('input[name="ReaderCreateForm[mac]"]').val()
                };

                onChoice(data);
                formValidate = true;
                $form.off('afterValidate');
                $('#reader-create-modal').modal('hide');
            }
        });

        $form.on('beforeSubmit', function (e) {
            return false;
        });

        $('#reader-create-modal').on('hidden.bs.modal', function (e) {
            if (!formValidate) {
                onError();
            }
        })
    }

};

let animationManager = {
    start: function (canvas) {
        setTimeout(function animate() {
            for (let obj of canvas.getObjects('beacon')) {
                obj._animateBeacon2(2);
            }
            for (let obj of canvas.getObjects('reader')) {
                obj._animateBeacon2(2);
            }
            canvas.renderAll();
            setTimeout(animate, 60);
        }, 60);
    }
};

class GuideLineManager {
    constructor(canvas) {
        this.elements = [];
        this.canvas = canvas;
    }

    get data() {
        return this.elements;
    }

    set data(elements) {
        this.elements = elements;
    }

    onCoordsChange(id, coordName, value) {
        let guideLine = this.elements.find(function (el) {
            return el.id === id;
        });

        guideLine.point[coordName] = value;
    }

    add(point, type) {
        let invertedMatrix = fabric.util.invertTransform(this.canvas.viewportTransform);
        let transformedLeftTop = fabric.util.transformPoint({
            x: 0,
            y: 0
        }, invertedMatrix);
        let transformedRightBot = fabric.util.transformPoint({
            x: this.canvas.width,
            y: this.canvas.height
        }, invertedMatrix);

        let coords;
        if (type === 'horizontal') {
            coords = [transformedLeftTop.x, point.y, transformedRightBot.x, point.y];
        } else {
            coords = [point.x, transformedLeftTop.y, point.x, transformedRightBot.y];
        }

        let line = new fabric.Line(coords, {
            stroke: settings.WALL.LINE.STROKE,
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            lockMovementY: type === 'vertical',
            lockMovementX: type === 'horizontal',
            excludeFromExport: true,
            hasControls: false,
            type: 'guideLine',
            id: fabric.generateUID()
        });
        let self = this;
        line.on('moving', function (options) {
            let pointer = this.canvas.getPointer(options.e);
            if (this.x1 === this.x2) {
                this.x1 = this.x2 = pointer.x;
                self.onCoordsChange(this.id, 'x', this.x1);
            } else {
                this.y1 = this.y2 = pointer.y;
                self.onCoordsChange(this.id, 'y', this.y1);
            }
            this.setCoords();
        });
        this.canvas.add(
            line
        );

        this.elements.push({
            point: point,
            type: type,
            id: line.id
        });
    }

    redraw() {
        let invertedMatrix = fabric.util.invertTransform(this.canvas.viewportTransform);
        let transformedLeftTop = fabric.util.transformPoint({
            x: 0,
            y: 0
        }, invertedMatrix);
        let transformedRightBot = fabric.util.transformPoint({
            x: this.canvas.width,
            y: this.canvas.height
        }, invertedMatrix);
        for (let el of this.elements) {
            let coords;
            if (el.type === 'horizontal') {
                coords = [transformedLeftTop.x, el.point.y, transformedRightBot.x, el.point.y];
            } else {
                coords = [el.point.x, transformedLeftTop.y, el.point.x, transformedRightBot.y];
            }
            let line = new fabric.Line(coords, {
                stroke: settings.WALL.LINE.STROKE,
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                lockMovementY: el.type === 'vertical',
                lockMovementX: el.type === 'horizontal',
                excludeFromExport: true,
                hasControls: false,
                type: 'guideLine',
                id: el.id
            });
            let self = this;
            line.on('moving', function (options) {
                let pointer = this.canvas.getPointer(options.e);
                if (this.x1 === this.x2) {
                    this.x1 = this.x2 = pointer.x;
                    self.onCoordsChange(this.id, 'x', this.x1);
                } else {
                    this.y1 = this.y2 = pointer.y;
                    self.onCoordsChange(this.id, 'y', this.y1);
                }
                this.setCoords();
            });
            this.canvas.add(
                line
            );

        }
    }
}
