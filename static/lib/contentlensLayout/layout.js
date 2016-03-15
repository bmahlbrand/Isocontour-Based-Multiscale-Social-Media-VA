ContentlensLayout = function(){
	this.offsetX;
	this.offsetY;
	this.layoutLength;
	
}

ContentlensLayout.prototype = {	
	setLayout: function(){
		this.offsetX = new Array(0,54,44,-33,-66,-72,-27,-65, 66,83,61, 17,-35,-80,-86,-100,-108,-103,-57);
		this.offsetY = new Array(0,32,67, 87, 54, 15,-46,-11,-28,-4,99,123,121, 93,-46,  62,  24, -14,-75);
		this.layoutLength = 19;
	},
	setOffset: function(ofX,ofY){
		for(t=0;t<this.offsetX.length;t++){
			this.offsetX[t] = this.offsetX[t]+ofX;
			this.offsetY[t] = this.offsetY[t]+ofY;	
		}
	},	
	setScale: function(scale){
		
		for(t=0;t<this.offsetX.length;t++){
			this.offsetX[t] = this.offsetX[t]*scale;
			this.offsetY[t] = this.offsetY[t]*scale;	
		}
			
	}
}