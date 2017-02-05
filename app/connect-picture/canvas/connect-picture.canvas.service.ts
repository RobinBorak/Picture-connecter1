import { Injectable } from '@angular/core';

@Injectable()
export class PictureCanvasService {

	constructor() { }

	isTouch: boolean = !!('ontouchstart' in window);
	PAINT_START: string = this.isTouch ? 'touchstart' : 'mousedown';
	PAINT_MOVE: string = this.isTouch ? 'touchmove' : 'mousemove';
	PAINT_END: string = this.isTouch ? 'touchend' : 'mouseup';
	canvasDrawRef;
	canvasPictureRef;
	linesSaved = [];
	lineCurrent = [];
	imagesDrawn = []; //array object
	isPainting: boolean = false;

	canvasNew=(divId, pictureData)=>{
		let canvasContainer = document.getElementById(divId);
		let canvas = document.createElement('canvas');
		canvas.height = 1000;
		canvas.width = 1000;
		canvas.id = 'canvas-main';
		canvasContainer.appendChild(canvas);

		this.canvasPictureRef = canvas;
		let ctx = canvas.getContext("2d");

		//px
		let imageOptions = {
			offsetX: 0,
			offsetY: 0,
			height: 200,
			width: 200,
			xPadding: 150,
			yPadding: 25
		};

		for (let i = 0; i<pictureData.length; i++) {
			let picture = pictureData[i];
			console.log(picture.name);
			let image = new Image();
			image.onload = (function(img, pictureIndex, imagesDrawn) {
				return function(){
					console.log('picture loaded: ', pictureData[pictureIndex].name);
					ctx.drawImage(
						img, 
						imageOptions.offsetX, 
						imageOptions.offsetY, 
						imageOptions.height, 
						imageOptions.width
					);
					imagesDrawn.push(Object.assign({},imageOptions));
					imagesDrawn[imagesDrawn.length-1].picture = pictureData[pictureIndex]
					if((imagesDrawn.length+1)%2===0){
						imageOptions.offsetX = imageOptions.width + imageOptions.xPadding;
					}else{
						imageOptions.offsetX = 0;
					}
					if((imagesDrawn.length+1)%3===0){
						imageOptions.offsetY += imageOptions.height + imageOptions.yPadding;
					}else{
						
					}
						
						
				}
				//2nd picture add offsetY heigth+yPadding
			})(image, i, this.imagesDrawn);
			image.src = "data:image/ png;base64," + picture.image;
		}

		return ctx;
	}

	canvasListenersInit(divId){
		
		let canvasContainer = document.getElementById(divId);
		let canvas = document.createElement('canvas');
		canvas.height = 1000;
		canvas.width = 1000;
		canvas.id = 'canvas-draw';
		canvas.style.cssText = 'position: absolute;top: 0;left: 0;cursor:crosshair;';
		canvas.getContext("2d").lineWidth = 8;
		canvasContainer.appendChild(canvas);

		this.canvasDrawRef = canvas;

		this.canvasDrawRef.addEventListener(this.PAINT_START, this.setPoints, false);
		this.canvasDrawRef.addEventListener(this.PAINT_END, this.endPoints, false);
	}

	setPoints=(e)=>{
		console.log(e);
		e.preventDefault();
		this.canvasDrawRef.addEventListener(this.PAINT_MOVE, this.paint, false);
		this.paint(e);
	}

	endPoints=(e)=>{
		console.log("endPoints: ", e);
		this.canvasDrawRef.removeEventListener(this.PAINT_MOVE, this.paint, false);
		this.isPainting = false;

		//Get picture starting with this.lineCurrent[0]x&y cords
		let pictureStart = this.drawnImageByCoordsGet(this.lineCurrent[0]);
		let pictureEnd = this.drawnImageByCoordsGet(this.lineCurrent[this.lineCurrent.length-1]);
		if(pictureStart && pictureEnd && !pictureStart.isComplete && !pictureEnd.isComplete && pictureStart.picture.id === pictureEnd.picture.related[0].picture.id){
			//success
			pictureStart.isComplete = pictureEnd.isComplete = true;
			this.drawSuccessCircle(pictureStart);
			this.drawSuccessCircle(pictureEnd);
			this.linesSaved.push(this.lineCurrent);
			console.log("this.linesSaved: ", this.linesSaved);
			console.log("this.lineCurrent: ", this.lineCurrent);
		}

		this.lineCurrent = [];
		this.reDraw();
	}

	drawnImageByCoordsGet=(coords)=>{

		for(let picture of this.imagesDrawn){
			if(coords.x > picture.offsetX && 
			   coords.x < picture.offsetX+picture.width &&
			   coords.y > picture.offsetY &&
			   coords.y < picture.offsetY+picture.height){

				   return picture;

			   }
		}

		return false;

	}

	drawSuccessCircle=(pictureObj)=>{
		let canvas = this.canvasPictureRef.getContext("2d");
		
		let centerX = pictureObj.offsetX + (pictureObj.width/2);
		let centerY = pictureObj.offsetY + (pictureObj.height/2);
		canvas.strokeStyle = canvas.fillStyle = 'green';
		canvas.beginPath();

		canvas.font='150px Glyphicon';
		//Draw one of the Font Awesome characters on the canvas:
		// specify the desired character code with the Unicode prefix (\u) 
		canvas.fillText('✔',centerX,centerY);

		canvas.arc(centerX,centerY,100,0,2*Math.PI);
		canvas.stroke();

	}

	paint=(e)=>{

		let canvas = this.canvasDrawRef.getContext("2d");
		
		let coords = this.coordsGet(e);
		this.lineCurrent.push(coords);

		if (!this.isPainting) {
			canvas.beginPath();
			canvas.moveTo(coords.x, coords.y);
			this.isPainting = true;
		} else {
			canvas.lineTo(coords.x, coords.y);
			canvas.stroke();
		}



	}

	reDraw=()=>{
		this.clearCanvas();
		let linesToDraw = this.linesSaved;
		let canvas = this.canvasDrawRef.getContext("2d");

		if(!linesToDraw.length) return;
		for(let line of linesToDraw){
			canvas.beginPath();
			canvas.moveTo(line[0].x,line[0].y);

			for(let cords of line){
				canvas.lineTo(cords.x, cords.y);
			}
			canvas.stroke();
		}
	}
	
	clearCanvas(){
		let canvas = this.canvasDrawRef.getContext("2d");
		canvas.beginPath();
		canvas.clearRect(0, 0, this.canvasDrawRef.width, this.canvasDrawRef.height);
	}

	coordsGet(e){
		let isTouch = this.isTouch;
		let returnPoints = {
			x: 0,
			y: 0
		}
		if(isTouch){
			returnPoints.x = e.changedTouches[0].pageX - this.getOffset(e.target).left;
			returnPoints.y = e.changedTouches[0].pageY - this.getOffset(e.target).top;
		} else {
			returnPoints.x = e.offsetX !== undefined ? e.offsetX : e.layerX;
			returnPoints.y = e.offsetY !== undefined ? e.offsetY : e.layerY;
		}
		return returnPoints;
	}

	getOffset( elem ) {
		var offsetTop = 0;
		var offsetLeft = 0;
		do {
		if ( !isNaN( elem.offsetLeft ) )
		{
						offsetTop += elem.offsetTop;
			offsetLeft += elem.offsetLeft;
		}
				elem = elem.offsetParent;
		} while( elem );
		return {
				left:offsetLeft,
				top: offsetTop
			};
	};



}