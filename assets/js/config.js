/**
 * Created by godzie@yandex.ru on 27.10.2016.
 */

/**
 * visual settings of constructor elements
 */
const settings = {
    WALL: {
        NODE: {
            FILL: '#fff',
            STROKE: '#666',
            RADIUS: 8,
            STROKE_WIDTH: 5
        },
        LINE: {
            STROKE: 'black',
            PER_PIXEL_TARGET_FIND: true,
            STROKE_WIDTH: 15,
            TEXT: {
                FONT_WEIGHT: 'bold',
                FONT_SIZE: 14,
                FILL: 'white'
            },
            PROMPT: {
                FONT_WEIGHT: 'bold',
                FILL: '#009688'
            }
        }
    },
    WALL_OBJECT: {
        LINE: {
            FONT_WEIGHT: 'bold',
            FONT_SIZE: 14,
            FILL: 'white'
        },
        WINDOW: {
            NODE: {
                STROKE_WIDTH: 2,
                RADIUS: 11,
                FILL: 'blue',
                STROKE: 'blue'
            },
            LINE: {
                FILL: 'blue',
                STROKE: 'blue',
                STROKE_WIDTH: 15
            }
        },
        DOOR: {
            NODE: {
                STROKE_WIDTH: 2,
                RADIUS: 11,
                FILL: 'brown',
                STROKE: 'brown'
            },
            LINE: {
                FILL: 'brown',
                STROKE: 'brown',
                STROKE_WIDTH: 15
            }
        }
    },
    BEACON: {
        FILL: '#fff',
        STROKE: '#009688',
        RADIUS: 6,
        STROKE_WIDTH: 3,
        ANIMATION: {
            MAX_RADIUS: 15
        }
    },
    READER: {
        FILL: '#fff',
        STROKE: 'red',
        RADIUS: 6,
        STROKE_WIDTH: 3,
        ANIMATION: {
            MAX_RADIUS: 15
        }
    },
    STACK: {
        WIDTH: 20,
        HEIGHT: 20,
        FILL: 'blue'
    },
    ROOM: {
        STROKE: "#000000",
        STROKE_WIDTH: 5,
        FILL: 'red',
        OPACITY: 0.6,
        TEXT: {
            FONT_WEIGHT: 'bold',
            FONT_SIZE: 20,
            FILL: 'red'
        }
    },
    INTEREST_POINT: {
        TEXT: {
            FONT_WEIGHT: 'bold',
            FONT_SIZE: 20,
            FILL: '#009688'
        }
    },
    COMPASS: {
        TEXT: {
            FONT_WEIGHT: 'bold',
            FONT_SIZE: 17,
            FILL: 'red'
        }
    },
    GRID: {
        STEP: {
            LARGE_ZOOM: 10,
            MEDIUM_ZOOM: 50,
            LOW_ZOOM: 100
        },
        STROKE_WIDTH: {
            LARGE_ZOOM: 0.2,
            MEDIUM_ZOOM: 1,
            LOW_ZOOM: 2
        }
    }
};