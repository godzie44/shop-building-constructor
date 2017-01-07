/**
 * Created by godzie@yandex.ru on 27.10.2016.
 */


/**
 * @namespace
 */
class GeometryHelper {
    /**
     * находим точку пересечения 2х прямых
     * @param line1
     * @param line2
     * @param state
     */
    static getInserectPoint(line1, line2) {
        let state = -2;
        let result = {};
        //Если знаменатель (n) равен нулю, то прямые параллельны.
        //Если и числитель (m или w) и знаменатель (n) равны нулю, то прямые совпадают.
        //Если нужно найти пересечение отрезков, то нужно лишь проверить, лежат ли ua и ub на промежутке [0,1].
        //Если какая-нибудь из этих двух переменных 0 <= ui <= 1, то соответствующий отрезок содержит точку пересечения.
        //Если обе переменные приняли значения из [0,1], то точка пересечения прямых лежит внутри обоих отрезков.
        let m = ((line2.x2 - line2.x1) * (line1.y1 - line2.y1) - (line2.y2 - line2.y1) * (line1.x1 - line2.x1));
        let w = ((line1.x2 - line1.x1) * (line1.y1 - line2.y1) - (line1.y2 - line1.y1) * (line1.x1 - line2.x1));
        let n = ((line2.y2 - line2.y1) * (line1.x2 - line1.x1) - (line2.x2 - line2.x1) * (line1.y2 - line1.y1));

        let Ua = m / n;
        let Ub = w / n;

        if ((n == 0) && (m != 0)) {
            state = -1; //Прямые параллельны (не имеют пересечения)
        }
        else if ((m == 0) && (n == 0)) {
            state = 0; //Прямые совпадают
        }
        else {
            //Прямые имеют точку пересечения
            result.x = line1.x1 + Ua * (line1.x2 - line1.x1);
            result.y = line1.y1 + Ua * (line1.y2 - line1.y1);

            // Проверка попадания в интервал
            let a = result.X >= line1.x1, b = result.x <= line1.x1, c = result.x >= line2.x1, d = result.x <= line2.x1;
            let e = result.Y >= line1.y1, f = result.y <= line1.y1, g = result.y >= line2.y1, h = result.y <= line2.y1;

            if (((a || b) && (c || d)) && ((e || f) && (g || h))) {
                state = 1; //Прямые имеют точку пересечения
            }
        }
        return {
            point: result,
            state: state
        };
    }

    /**
     * находим точку находящуюся на расстояние diff от начала line и лежащую на line
     * @param line
     * @param diff
     */
    static getDiffPoint(line, diff) {
        let long = GeometryHelper.getLineLong(line);
        let k = diff / long
        let x = line.x1 + (line.x2 - line.x1) * k;
        let y = line.y1 + (line.y2 - line.y1) * k;
        return {
            x: x,
            y: y
        };
    }

    /**
     * находим 2 точки перпендикулярных отрезку и находящихся на расстояние diff от точки point
     * @param line
     * @param point
     * @param diff
     * @returns {*[]}
     */
    static getPerpeniducularPoints(line, point, diff) {
        let angle = GeometryHelper.getLineAngel(line);
        angle = (angle + 90) * Math.PI / 180;
        let newPoint1 = {
            x: point.x + diff,
            y: point.y
        };
        let newPoint2 = {
            x: point.x - diff,
            y: point.y
        };

        let x = point.x + (newPoint1.x - point.x) * Math.cos(angle) - (newPoint1.y - point.y) * Math.sin(angle);
        let y = point.y + (newPoint1.x - point.x) * Math.sin(angle) + (newPoint1.y - point.y) * Math.cos(angle);
        newPoint1 = {
            x: x,
            y: y
        };

        x = point.x + (newPoint2.x - point.x) * Math.cos(angle) - (newPoint2.y - point.y) * Math.sin(angle);
        y = point.y + (newPoint2.x - point.x) * Math.sin(angle) + (newPoint2.y - point.y) * Math.cos(angle);
        newPoint2 = {
            x: x,
            y: y
        };
        return [newPoint1, newPoint2];
    }


    /**
     * get point and line then converts the coordinates of the point that it may be on the line
     * @static
     * @param point
     * @param line
     * @returns {{x: number, y: number}}
     */
    static putPointOnLine(point, line) {
        let {x1,y1,x2,y2} = line;

        let xSpeed = Math.abs(1 - (
                x2 / x1
            ));
        let ySpeed = Math.abs(1 - (
                y2 / y1
            ));

        let {x, y} = point;
        if (xSpeed < ySpeed) {
            x = Math.round((
                               (
                                   y - y1
                               ) / (
                                   y2 - y1
                               )
                           ) * (
                               x2 - x1
                           ) + x1);
        } else {
            y = Math.round((
                               (
                                   x - x1
                               ) / (
                                   x2 - x1
                               )
                           ) * (
                               y2 - y1
                           ) + y1);
        }

        let maxX = Math.max(x1, x2);
        if (x > maxX) {
            x = maxX;
        }

        let minX = Math.min(x1, x2);
        if (x < minX) {
            x = minX;
        }

        let maxY = Math.max(y1, y2);
        if (y > maxY) {
            y = maxY;
        }

        let minY = Math.min(y1, y2);
        if (y < minY) {
            y = minY;
        }

        return new Point(x, y);
    }

    static inPointOnLine(point, line) {
        let {x1,y1,x2,y2} = line;
        return (
                   (
                       point.x - x1
                   ) / (
                       x2 - x1
                   )
               ) == (
                   (
                       point.y - y1
                   ) / (
                       y2 - y1
                   )
               );
    }

    static diffLine(line, diff) {
        let angle = GeometryHelper.getLineAngel(line);
        if (angle >= 45 && angle <= 135) {
            line.y2 -= diff;
        } else if (angle >= -135 && angle <= -45) {
            line.y2 += diff;
        } else if (angle > 135 || angle < -135) {
            line.x2 += diff;
        } else if (angle > -45 && angle < 45) {
            line.x2 -= diff;
        }
        return line;
    }

    /**
     * get long if line
     * @static
     * @param coords
     * @returns {number}
     */
    static getLineLong(coords) {
        return Math.sqrt(Math.pow(coords.x2 - coords.x1, 2) + Math.pow(coords.y2 - coords.y1, 2));
    }

    static getDirectedLineLong(coords) {
        let angle = GeometryHelper.getLineAngel(coords);
        let long = Math.sqrt(Math.pow(coords.x2 - coords.x1, 2) + Math.pow(coords.y2 - coords.y1, 2));
        if (angle < -90 || angle === 180) {
            return long;
        } else if (angle < 0 && angle >= -90) {
            return long;
        } else if (angle <= 90 && angle >= 0) {
            return -long;
        } else if (angle < 180 && angle > 90) {
            return -long;
        }
    }


    /**
     * find closes line to point
     * @param lines array of line
     * @param point
     * @returns line
     */
    static getClosetsLine(lines, point) {
        let distances = [];

        for (let i = 0; i < lines.length; i++) {
            let middlePoint = GeometryHelper.getMiddlePoint({
                x1: lines[i].x1,
                x2: lines[i].x2,
                y1: lines[i].y1,
                y2: lines[i].y2
            });

            distances.push(
                GeometryHelper.getLineLong({
                    x1: middlePoint.x,
                    y1: middlePoint.y,
                    x2: point.x,
                    y2: point.y
                }));
        }

        let minDistanceLineIndex = distances.indexOf(Math.min(...distances));
        return lines[minDistanceLineIndex];
    }

    /**
     * get middle point of the line
     * @static
     * @param line
     * @returns {{x: number, y: number}}
     */
    static getMiddlePoint(line) {
        return {
            x: (
                   line.x1 + line.x2
               ) / 2,
            y: (
                   line.y1 + line.y2
               ) / 2
        };
    }

    /**
     * @param line
     * @param offset
     * @param offsetTop
     */
    static getPointOnLine(line, offset, offsetTop) {
        let angle = GeometryHelper.getLineAngel(line);
        if ((
                angle >= 45 && angle <= 135
            )) {
            let y = line.y2 - offset;
            let x = Math.round((
                                   (
                                       y - line.y1
                                   ) / (
                                       line.y2 - line.y1
                                   )
                               ) * (
                                   line.x2 - line.x1
                               ) + line.x1);
            return {
                x: x - offsetTop,
                y: y
            };
        } else if ((
                angle >= -135 && angle <= -45
            )) {
            let y = line.y2 + offset;
            let x = Math.round((
                                   (
                                       y - line.y1
                                   ) / (
                                       line.y2 - line.y1
                                   )
                               ) * (
                                   line.x2 - line.x1
                               ) + line.x1);
            return {
                x: x + offsetTop,
                y: y
            };
        } else if ((
                angle > 135 || angle < -135
            )) {
            let x = line.x2 + offset;
            let y = Math.round((
                                   (
                                       x - line.x1
                                   ) / (
                                       line.x2 - line.x1
                                   )
                               ) * (
                                   line.y2 - line.y1
                               ) + line.y1);
            return {
                x: x,
                y: y + offsetTop
            };
        } else if ((
                angle > -45 && angle < 45
            )) {
            let x = line.x2 - offset;
            let y = Math.round((
                                   (
                                       x - line.x1
                                   ) / (
                                       line.x2 - line.x1
                                   )
                               ) * (
                                   line.y2 - line.y1
                               ) + line.y1);
            return {
                x: x,
                y: y - offsetTop
            };
        }

    }

    /**
     * find point on line from x1,y1 used long
     * @param line
     * @param long
     */
    static getPointOnLineByLong(line, long) {
        let angle = GeometryHelper.getLineAngel(line);

        if (angle < -90 || angle === 180) {
            long = -long;
        } else if (angle < 0 && angle >= -90) {
            long = long;
        } else if (angle <= 90 && angle >= 0) {
            long = long;
        } else if (angle < 180 && angle > 90) {
            long = -long;
        }

        let tgA = (
                      line.y2 - line.y1
                  ) / (
                      line.x2 - line.x1
                  );
        let dx = long * Math.cos(Math.atan(tgA));
        let dy = long * Math.sin(Math.atan(tgA));
        return new Point(line.x1 + dx, line.y1 + dy);
    }

    /**
     * get angle by the  line [0;0] [inf;0] and entry line
     * @static
     * @param line
     * @returns {*|Number}
     */
    static getLineAngel(line) {
        return fabric.util.radiansToDegrees(Math.atan2(line.y2 - line.y1, line.x2 - line.x1));
    }

    static getLinesAngel(line1, line2) {
        let dx1 = line1.x1 - line1.x2;
        let dy1 = line1.y1 - line1.y2;
        let dx2 = line2.x2 - line2.x1;
        let dy2 = line2.y2 - line2.y1;

        let a = dx1 * dy2 - dy1 * dx2;
        let b = dx1 * dx2 + dy1 * dy2;
        return fabric.util.radiansToDegrees(Math.atan2(a, b));
    }

    /**
     * меняем коордианты линии чтобы она шла слева на право
     */
    static normilizeLine(line) {
        if (line.x1 > line.x2) {
            return new Line(line.x2, line.y2, line.x1, line.y1);
        }

        return line;
    }

    /**
     * получаем точку на расстояние length от цента с углом angle
     * @param center
     * @param angle
     * @param length
     * @returns {Point}
     */
    static getPointByAngleAndLength(center, angle, length) {
        let x = center.x + length * Math.cos(fabric.util.degreesToRadians(angle));
        let y = center.y - length * Math.sin(fabric.util.degreesToRadians(angle));
        return new Point(x, y);
    }

    /**
     * получаем список угол перпендикулярных заданному в 4х четвертях
     * @param angle
     */
    static getAngleListByFourth(angle) {
        let angle1 = 0;
        if (angle >= 0 && angle < 90) {
            angle1 = angle;
        } else if (angle => 90) {
            angle1 = angle - 90;
        } else if (angle1 >= -90 && angle < 0) {
            angle1 = angle + 90;
        } else if (angle1 < -90) {
            angle1 = angle1 + 180;
        }

        return [
            angle1 + 90, angle1, angle1 - 90, angle1 - 180
        ];
    }

    /**
     * check is point on the line segment (before use this point must be in the line!)
     * @static
     * @param point
     * @param line
     * @returns {boolean}
     */
    static isPointOnLineSegment(point, line) {
        let {x1,y1,x2,y2} = line;

        //get vectors
        let v1 = {
            x: x1 - point.x,
            y: y1 - point.y
        };
        let v2 = {
            x: x2 - point.x,
            y: y2 - point.y
        };

        return (
                   v1.x * v2.x + v1.y * v2.y
               ) <= 0;
    }

    /**
     * if line angel close to 90,0,180,-90 grad - then conver line to right angel
     * @param line
     * @returns {line}
     */
    static convertToRightAngle(line) {
        let {x1,y1,x2,y2} = line;
        let realAngel = GeometryHelper.getLineAngel(line);
        let lineLong = GeometryHelper.getLineLong(line);
        let delta = lineLong < 200 ? 2 : (
            lineLong < 1000 ? 1 : (
                lineLong < 8000 ? 0.5 : 0.2
            )
        );

        if (realAngel > 90 - delta && realAngel < 90 + delta) {
            line.x2 = (
                          (
                              y2 - y1
                          ) / Math.tan(Math.PI / 2)
                      ) + x1;
        } else if (realAngel > -90 - delta && realAngel < -90 + delta) {
            line.x2 = (
                          (
                              y2 - y1
                          ) / Math.tan(-(
                          Math.PI / 2
                          ))
                      ) + x1;
        } else if (realAngel > -delta && realAngel < delta) {
            line.y2 = (
                          (
                              x2 - x1
                          ) * Math.tan(0)
                      ) + y1;
        } else if (realAngel > 180 - delta || realAngel < -180 + delta) {
            line.y2 = (
                          (
                              x2 - x1
                          ) * Math.tan(Math.PI)
                      ) + y1;
        }
        return line;
    }

    /**
     * check is point on poligon
     * @param pointCount
     * @param xList all x coords of polygon dots
     * @param yList all y coords of polygon dots
     * @param point
     * @returns {bool}
     */
    static isPointOnPoligon(pointCount, xList, yList, point) {
        let i, j, c = 0;
        let {x,y} = point;
        for (i = 0, j = pointCount - 1; i < pointCount; j = i++) {
            if ((
                    (
                        (
                            yList [i] <= y
                        ) && (
                            y < yList [j]
                        )
                    ) || (
                        (
                            yList [j] <= y
                        ) && (
                            y < yList [i]
                        )
                    )
                ) &&
                (
                    x < (
                            xList [j] - xList [i]
                        ) * (
                            y - yList [i]
                        ) / (
                            yList [j] - yList [i]
                        ) + xList [i]
                ))
                c = !c;
        }

        return c;
    }

    /**
     * area of poligon
     * @param pointCount
     * @param xList all x coords of polygon dots
     * @param yList
     * @returns {number}
     */
    static getPoligonArea(pointCount, xList, yList) {
        let s = xList[0] * (
                yList[1] - yList[pointCount - 1]
            );
        for (let i = 1; i < pointCount - 1; i++) {
            s += xList[i] * (
                    yList[i + 1] - yList[i - 1]
                );
        }
        s += xList[pointCount - 1] * (
                yList[0] - yList[pointCount - 1 - 1]
            );

        return Math.abs(s / 2);
    }

    /**
     * get center of poligon
     * @param pointCount
     * @param xList all x coords of polygon dots
     * @param yList all y coords of polygon dots
     * @returns {{x: number, y: number}}
     */
    static getPoligonCenterPoint(pointCount, xList, yList) {
        let min_x = Math.min(...xList),
            max_x = Math.max(...xList),
            min_y = Math.min(...yList),
            max_y = Math.max(...yList);

        return {
            x: min_x + (
                           max_x - min_x
                       ) / 2,
            y: min_y + (
                           max_y - min_y
                       ) / 2
        };
    }

    static recomendedAngleForSimpleObject(angle) {
        if (angle > 82 && angle < 98) {
            return 90;
        } else if (angle > 352 || angle < 8) {
            return 0;
        } else if (angle > 262 && angle < 278) {
            return 270;
        } else if (angle > 172 && angle < 188) {
            return 180;
        }
        return angle;
    }


    /**
     * проверка пересечения отрезков
     * @param line1
     * @param line2
     * @returns bool
     */
    static isLinesCross(line1, line2) {
        let area = function (a, b, c) {
            return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        }

        let intersect_1 = function (a, b, c, d) {
            if (a > b) {
                let s1 = a;
                a = b;
                b = s1;
            }
            if (c > d) {
                let s2 = c;
                c = d;
                d = s2;
            }
            return Math.max(a, c) <= Math.min(b, d);
        }

        let a = {
            x: line1.x1,
            y: line1.y1
        };
        let b = {
            x: line1.x2,
            y: line1.y2
        };
        let c = {
            x: line2.x1,
            y: line2.y1
        };
        let d = {
            x: line2.x2,
            y: line2.y2
        };

        return intersect_1(a.x, b.x, c.x, d.x)
               && intersect_1(a.y, b.y, c.y, d.y)
               && area(a, b, c) * area(a, b, d) <= 0
               && area(c, d, a) * area(c, d, b) <= 0;
    }

    /**
     * проверка линий на паллельность друг другу
     * @param line1
     * @param line2
     * @returns {boolean}
     */
    static isLinesParallel(line1, line2) {
        let dx1 = line1.x2 - line1.x1, dy1 = line1.y2 - line1.y1; // Длина проекций первой линии на ось x и y
        let dx2 = line2.x2 - line2.x1, dy2 = line2.y2 - line2.y1; // Длина проекций второй линии на ось x и y
        let dxx = line1.x1 - line2.x1, dyy = line1.y1 - line2.y1;
        let div;
        div = dy2 * dx1 - dx2 * dy1;
        return div == 0;
    }

    /**
     * проверка видят ли две точки друг друга
     * @param point1
     * @param point2
     * @param obstructionList
     */
    static isVisible(point1, point2, obstructionList) {
        let targetLine = new Line(point1.x, point1.y, point2.x, point2.y);
        for (let line of obstructionList) {
            //делим нашу пряму на 2 параллельные n = 20
            let startPoints = GeometryHelper.getPerpeniducularPoints(line, new Point(line.x1, line.y1), 20);
            let endPoints = GeometryHelper.getPerpeniducularPoints(line, new Point(line.x2, line.y2), 20);

            if (GeometryHelper.isLinesCross(targetLine, new Line(startPoints[0].x, startPoints[0].y, endPoints[0].x, endPoints[0].y))) {
                return false;
            }

            if (GeometryHelper.isLinesCross(targetLine, new Line(startPoints[1].x, startPoints[1].y, endPoints[1].x, endPoints[1].y))) {
                return false;
            }

            if (GeometryHelper.isLinesCross(targetLine, line)) {
                return false;
            }
        }
        return true;
    }

    static fabricAngleToReal(angle) {
        if (angle > 0) {
            return 360 - angle;
        } else if (angle < 0) {
            return -angle;
        } else {
            return angle;
        }
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Line {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    }
}