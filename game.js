//--------------------------------------------    Beginning Scene   -------------------------------------------------
var difficulty = 0;
var bgm, scoreSound, megaScoreSound, gameEndSound;
class Begin extends Phaser.Scene {

    constructor() {
        super('Begin');
    }

    preload() {
        this.load.image('background', 'assets/background.jpg');
        this.load.audio('bgm', 'assets/background.wav');
        this.load.audio('score', 'assets/Score.wav');
        this.load.audio('mega', 'assets/MegaScore.wav');
        this.load.audio('stop', 'assets/Stop.wav');

        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
    }
    create() {
        this.add.image(300, 480, 'background');
        bgm = this.sound.add('bgm', 0.8, true);
        scoreSound = this.sound.add('score', 1, false);
        megaScoreSound = this.sound.add('mega', 1, false);
        gameEndSound = this.sound.add('stop', 1, false);
        bgm.play();

        this.add.text(165, 300, "Please select a level", { font: '30px Arial', fill: '#000000' });
        const restart = new Button(this.cameras.main.centerX, 540, 'Go!', this, () => startGame(this));

        // -------   Create a dropdown list --------
        var stringOption = false;
        var options;
        if (stringOption) {
            options = ['A', 'B', 'C', 'D'];
        } else {
            options = [
                { text: 'Junior', value: 5 },
                { text: 'Intermediate', value: 6 },
                { text: 'Senior', value: 7 },
                { text: 'Tech-Lead', value: 8 },
            ]
        }

        var print = this.add.text(0, 0, '');
        var dropDownList = this.rexUI.add.dropDownList({
            x: 300, y: 400,

            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 0, COLOR_PRIMARY),
            icon: this.rexUI.add.roundRectangle(0, 0, 20, 20, 10, COLOR_LIGHT),
            text: CreateTextObject(this, '-- Select --').setFixedSize(150, 0),

            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
                icon: 10
            },

            options: options,

            list: {
                createBackgroundCallback: function (scene) {
                    return scene.rexUI.add.roundRectangle(0, 0, 2, 2, 0, COLOR_DARK);
                },
                createButtonCallback: function (scene, option, index, options) {
                    var text = (stringOption) ? option : option.text;
                    var button = scene.rexUI.add.label({
                        background: scene.rexUI.add.roundRectangle(0, 0, 2, 2, 0),

                        text: CreateTextObject(scene, text),

                        space: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10,
                            icon: 10
                        }
                    });
                    button.value = (stringOption) ? undefined : option.value;

                    return button;
                },

                // scope: dropDownList
                onButtonClick: function (button, index, pointer, event) {
                    // Set label text, and value
                    this.text = button.text;
                    this.value = button.value;
                    difficulty = button.value;
                    //print.text += `Select ${button.text}, value=${button.value}\n`;
                },

                // scope: dropDownList
                onButtonOver: function (button, index, pointer, event) {
                    button.getElement('background').setStrokeStyle(1, 0xffffff);
                },

                // scope: dropDownList
                onButtonOut: function (button, index, pointer, event) {
                    button.getElement('background').setStrokeStyle();
                },
            },

            setValueCallback: function (dropDownList, value, previousValue) {
                console.log(value);
            },
            value: undefined

        })
            .layout();
    }
}
var CreateTextObject = function (scene, text) {
    return scene.add.text(0, 0, text, { fontSize: 20 })
}

var startGame = function (sce) {
    if (difficulty < 5) {
        sce.add.text(220, 430, "You have to choose one!", { font: '15px Arial', fill: '#ff0000' });
    } else {
        sce.scene.start('Game');
    }
}

//------------------------------------------------   Game Scene   ---------------------------------------------------------------------///
const COLOR_PRIMARY = 0x03a9f4;
const COLOR_LIGHT = 0x67daff;
const COLOR_DARK = 0x000000;
const COLOR_ARRAY = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff, 0x000000, 0xffffff];
var board;
var colorArray, ballArray;
var clickedBallColor = -1, clickedBallArray = new Array();
var lineArray = new Array();
var mouse, mouseDown = 0;
var timeText, timedEvent;
var score = 0, scoreText;

class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        })
    }


    preload() {
        this.load.image('background', 'assets/background.jpg');
        this.load.scenePlugin({
            key: 'rexboardplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexboardplugin.min.js',
            sceneKey: 'rexBoard'
        });
    }

    create() {
        this.add.image(300, 480, 'background');

        var gridGraphics = this.add.graphics({
            lineStyle: {
                width: 1,
                color: COLOR_DARK,
                alpha: 1
            }
        });

        colorArray = new Array(9).fill(new Array(12));
        ballArray = new Array(9).fill(new Array(12));
        for (var i = 0; i < 9; i++) {
            colorArray[i] = colorArray[i].slice();
            ballArray[i] = ballArray[i].slice();
            for (var j = 0; j < 12; j++) {
                colorArray[i][j] = -1;
            }
        }

        board = this.rexBoard.add.board({
            grid: getHexagonGrid(this),
            width: 9,
            height: 12
        })
            .forEachTileXY(function (tileXY, board) {
                var points = board.getGridPoints(tileXY.x, tileXY.y, true);
                gridGraphics.strokePoints(points, true);
            }, this);

        board
            .setInteractive()
            .on('tiledown', function (pointer, tileXY) {
                Phaser.Actions.Call(board.tileZToChessArray(0), function (gameObject) {
                    gameObject.destroy();
                });

                if (!board.contains(tileXY.x, tileXY.y)) {
                    return;
                }
            }, this)

        initializeBoard(this);

        this.input.on('pointerdown', (pointer) => {
            mouseDown++;
        });
        this.input.on('pointerup', (pointer) => {
            mouseDown--;
        });
        this.input.on('pointermove', (pointer) => {
            mouse = pointer;
        });

        this.initialTime = 60;
        timeText = this.add.text(110, 30, 'Time: ' + this.initialTime, { font: '36px Arial', fill: '#000000' });
        timedEvent = this.time.addEvent({ delay: 1000, callback: timePass, callbackScope: this, loop: true });
        scoreText = this.add.text(360, 30, 'Score: ' + score, { font: '36px Arial', fill: '#000000' });
        this.time.addEvent({ delay: 60000, loop: false, callback: () => { gameEnd(this); } });
    }


    update() {
        if (mouseDown < 0 || mouseDown > 1) {
            mouseDown = 0;
        }

        var arrayLength = clickedBallArray.length;
        if (mouseDown && checkMouseInBoard()) {
            var tileXY = board.worldXYToTileXY(mouse.x, mouse.y);
            //get the tile in current mouse position
            var ball = ballArray[tileXY.x][tileXY.y];
            //get the ball object in current tile
            var color = colorArray[tileXY.x][tileXY.y];
            //get the color of the current ball object
            var lastBall = clickedBallArray[arrayLength - 1];
            if (arrayLength == 0) {
                // if the connected ball array is empty then put the first ball clicked into the array 
                clickedBallArray.push(ball);
                clickedBallColor = color;
            }
            else if (!_.isEqual(lastBall, ball) && Phaser.Math.Distance.BetweenPoints(lastBall, ball) <= 66) {
                // if the current selected ball is not the same as the last one & they are neighbours
                if (color == clickedBallColor) {
                    if (clickedBallArray.includes(ball)) {
                        if (clickedBallArray.indexOf(ball) == 0) {
                            drawLine(this, lastBall.x, lastBall.y, ball.x, ball.y);
                            console.log("delete all!");
                            deleteAll(this, clickedBallColor);
                        }
                    } else {
                        drawLine(this, lastBall.x, lastBall.y, ball.x, ball.y);
                        clickedBallArray.push(ball);
                    }
                }
            } else {
                console.log("onPressing");
            }
        } else {
            if (arrayLength != 0) {
                deleteSelected(arrayLength);
            } else {
                //checkIfMove(this);
                initializeBoard(this);
            }
        }

    }
}

var gameEnd = function (scene) {
    gameEndSound.play();
    scene.scene.start("End");
}

var getHexagonGrid = function (scene) {
    // generate a Hexgon Grid
    var staggeraxis = 'x';
    var staggerindex = 'odd';
    var grid = scene.rexBoard.add.hexagonGrid({
        x: 45,
        y: 368,
        cellWidth: 60,
        cellHeight: 66,
        staggeraxis: staggeraxis,
        staggerindex: staggerindex
    })
    return grid;
};

var checkMouseInBoard = function () {
    if (mouse.x > 15 && mouse.x < 555 && mouse.y > 180 && mouse.y < 950) {
        return true;
    } else {
        return false;
    }
}

var initializeBall = function (scene, tileX, tileY, color) {
    var worldXY = board.tileXYToWorldXY(tileX, tileY)
    var ball = scene.add.circle(worldXY.x, worldXY.y, 15, color).setStrokeStyle(1.5, 0xefc53f);
    scene.physics.add.existing(ball);
    ball.body.setAllowGravity(false);
    ballArray[tileX][tileY] = ball;
}

var initializeBoard = function (scene) {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 12; j++) {
            if (colorArray[i][j] == -1) {
                var rnd = Math.floor(Math.random() * difficulty);
                initializeBall(scene, i, j, COLOR_ARRAY[rnd]);
                colorArray[i][j] = rnd;
            }
        }
    }
}

var drawLine = function (scene, obj1x, obj1y, obj2x, obj2y) {
    var line = scene.add.line(0, 0, obj1x, obj1y, obj2x, obj2y, 0x000000).setOrigin(0);
    line.setLineWidth(3);
    lineArray.push(line);
}

var deleteAll = function (scene, color) {
    var count = 0;
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 12; j++) {
            if (colorArray[i][j] == color) {
                ballArray[i][j].destroy();
                colorArray[i][j] = -1;
                count++;
            }
        }
    }
    scored(count);
    scene.cameras.main.flash();
    megaScoreSound.play();
}

var deleteSelected = function (arrayLength) {
    if (arrayLength > 1) {
        clickedBallArray.forEach(element => {
            var tileXY = board.worldXYToTileXY(element.x, element.y);
            colorArray[tileXY.x][tileXY.y] = -1;
            element.destroy();
        });
        lineArray.forEach(element => element.destroy());
    }
    scored(arrayLength);
    clickedBallArray = [];
    lineArray = [];
    scoreSound.play()
}

var timePass = function () {
    this.initialTime -= 1; // One second
    timeText.setText('Time: ' + this.initialTime);
}

var scored = function (points) {
    score += points;
    scoreText.setText('Score: ' + score);
}

var checkIfMove = function (scene) {
    // update balls position on the map
    for (var i = 0; i < 9; i++) {
        for (var j = 1; j < 12; j++) {
            if (colorArray[i][j] == -1 && colorArray[i][j - 1] != -1) {
                // for each check if current tile is empty & the upper one is not
                colorArray[i][j] = colorArray[i][j - 1];
                // set current tile's color = the upper tile
                colorArray[i][j - 1] = -1;
                // set the upper tile to empty
                moveBall(scene, ballArray[i][j - 1], i, j);
                // call the move function
                ballArray[i][j] = ballArray[i][j - 1];
                // update the ball object array
            }
        }
    }
    scene.time.addEvent({ delay: 320, loop: false, callback: () => { refillBall(scene); } });
}

var moveBall = function (scene, ball, tileX, tileY) {
    var target = board.tileXYToWorldXY(tileX, tileY);
    scene.physics.moveToObject(ball, target, 200);
    scene.time.addEvent({ delay: 320, loop: false, callback: () => { ball.body.reset(target.x, target.y); } });
}

var refillBall = function (scene) {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 12; j++) {
            if (colorArray[i][j] == -1) {
                var rnd = Math.floor(Math.random() * difficulty);
                var worldXY = board.tileXYToWorldXY(i, j)
                var ball = scene.add.circle(worldXY.x, 300, 15, COLOR_ARRAY[rnd]).setStrokeStyle(1.5, 0xefc53f);
                scene.physics.add.existing(ball);
                ball.body.setAllowGravity(false);
                var target = board.tileXYToWorldXY(i, 0);
                scene.physics.moveToObject(ball, target, 200);
                scene.time.addEvent({ delay: 320, loop: false, callback: () => { ball.body.reset(target.x, target.y); } });
                colorArray[i][0] = rnd;
                ballArray[i][0] = ball;
            }
        }
    }
}


//------------------------------------------------------   GameOver Scene   ---------------------------------------------------------------
var button;
class End extends Phaser.Scene {

    constructor() {
        super('End');
    }

    preload() {
        this.load.image('background', 'assets/background.jpg');
    }
    create() {
        this.add.image(300, 480, 'background');
        this.add.text(140, 250, 'You scored ' + score + ' points', { font: '36px Arial', fill: '#000000' });
        const restart = new Button(this.cameras.main.centerX, 400, 'Restart', this, () => restartGame(this));
        const quit = new Button(this.cameras.main.centerX, 500, 'Quit', this, () => game.destroy(true, false));
    }
}

var restartGame = function (sce) {
    clickedBallColor = -1,
        score = 0;
    mouseDown = 0;
    difficulty = 0;
    bgm.stop();
    sce.scene.start('Begin');
}

class Button {
    constructor(x, y, label, scene, callback) {
        const button = scene.add.text(x, y, label, { font: '24px Arial', bold: true })
            .setOrigin(0.5)
            .setPadding(15)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => callback())
            .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => button.setStyle({ fill: '#FFF' }));
    }
}


//--------------------------------------------------------   Game Config   --------------------------------------------------------- 
var config = {
    type: Phaser.AUTO,
    parent: 'Begin',
    width: 600,
    height: 960,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: [Begin, Game, End]
};

var game = new Phaser.Game(config);