
function intializeCanvasApp(physicsManager, logger) {
	'use strict';

	var World = physicsManager.World,
		Body = physicsManager.Body,
		Edge = physicsManager.Edge,
		Vertex = physicsManager.Vertex,
		Vector = physicsManager.Vector;


	// Represents a Game object	
	function GameObject(body, image) {
		return {
			"body"  : body,
			"image" : image,
			"xOff"  : -(image.width/2),
			"yOff"  : -(image.height/2)
		};
	}
	
	
	function GameManager(canvas) {
		var context,
			time,
			world,
			timeinc,
			ground,
			gameObjects,
			COLOR,
			DEGREE_TO_RADIAN,
			ROOT_OF_TWO;

		function drawScreen() {
			context.fillStyle = "#000000";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.strokeStyle = "#000000";
			context.strokeRect(0, 0, canvas.width, canvas.height);
			context.strokeStyle = "#00ff00";

			context.drawImage(ground, 0, 400);
			
			for (var i=0; i<gameObjects.length; i++) {
				var gObj = gameObjects[i];
				context.setTransform(1, 0, 0, 1, 0, 0);
				context.translate(gObj.body.center.x, gObj.body.center.y);
				context.rotate(gObj.body.angle);
				context.drawImage(gObj.image, gObj.xOff, gObj.yOff);
				context.setTransform(1, 0, 0, 1, 0, 0);
			}
		}


		function gameLoop() {
			drawScreen();
			time += timeinc;
			world.letTheWorldRun(10,time);
		}


		function createBox(originVertex, side, degree, world) {
			var vertex2 = new Vertex(side*Math.cos(DEGREE_TO_RADIAN*degree) + originVertex.position.x, 
				side*Math.sin(DEGREE_TO_RADIAN*degree) + originVertex.position.y);
			var vertex3 = new Vertex(ROOT_OF_TWO*side*Math.cos(DEGREE_TO_RADIAN*(degree+45)) + originVertex.position.x, 
				ROOT_OF_TWO*side*Math.sin(DEGREE_TO_RADIAN*(degree+45)) + originVertex.position.y);
			var vertex4 = new Vertex(side*Math.cos(DEGREE_TO_RADIAN*(degree+90)) + originVertex.position.x, 
				side*Math.sin(DEGREE_TO_RADIAN*(degree+90)) + originVertex.position.y);

			return new Body([originVertex, vertex2, vertex3, vertex4], 
				[[0,1,true],[1,2,true],[2,3,true],[3,0,true],[0,2,false],[1,3,false]],
				{baseIndex:2, reverse:true},
				world);
		}


		function initGame() {
			context = canvas.getContext("2d");
			time = 0;
			timeinc = 1;
			gameObjects = [];
			COLOR = "#0000ff";
			DEGREE_TO_RADIAN = Math.PI/180;
			ROOT_OF_TWO = Math.sqrt(2);
			
			world = new World(canvas.width, canvas.height-200, new Vector(0, 0.5), new Vector(0.01, 0));
			world.time = time;
			
			var crates = [];
			for (var i = 0; i < 4; i++) {
				var boxImage = new Image();
				boxImage.src = "images/crate" + i + ".png";
				crates.push(boxImage);
			}
			
			boxImage.onload = function() {
				canvas.onclick = function(event) {
					var mouseCoords = canvas.relMouseCoords(event);
					if( mouseCoords.x > 50 && mouseCoords.x < world.worldMaxX - 50
						&& mouseCoords.y > 50 && mouseCoords.y < world.worldMaxY - 50) {
						var box = createBox(new Vertex(mouseCoords.x, mouseCoords.y), 
							98, 
							Math.floor(Math.random()*360),
							world);
						gameObjects.push(new GameObject(box, crates[Math.floor(Math.random()*crates.length)]));
					}
				}
			}
			
			ground = new Image();
			ground.src = "images/ground.png";
			ground.onload = function() {				
				setInterval(gameLoop, 1);
			}
		}

		return {
			"startGame" : initGame
		};
	}

	// Adds mouse coordinate translation to Canvas prototype
	function attachMouseHandler() { 

		function relMouseCoords(event) {
		    var totalOffsetX = 0;
		    var totalOffsetY = 0;
		    var canvasX = 0;
		    var canvasY = 0;
		    var currentElement = this;

		    do {
		        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
		        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
		    }
		    while(currentElement = currentElement.offsetParent);

		    canvasX = event.pageX - totalOffsetX;
		    canvasY = event.pageY - totalOffsetY;

		    return { x: canvasX, y: canvasY };
		}

		HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
	}


	function initialize() {		
		var theCanvas = document.getElementById("theCanvas");
		if( !theCanvas || !theCanvas.getContext ) {
			logger.log("Canvas element not available.");
			return;
		}

		attachMouseHandler();
		var gameManager = new GameManager(theCanvas);
		gameManager.startGame();
	}

	initialize();
}