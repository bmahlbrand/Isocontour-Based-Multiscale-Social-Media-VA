TreeCanvas = function(){
	this.canvas = null;

	this.init();
};

TreeCanvas.prototype.init = function(){

	//initialize canvas;
	this.canvas = d3.select(TreeCanvas.div)
			    	.append("svg")
			    	.attr("id", "treeCanvasSvg")
			    	.attr("width", TreeCanvas.WIDTH)
			    	.attr("height", TreeCanvas.HEIGHT)
			    	;

	//initialize canvas;
	this.scaleTreeCanvas = new ScaleTreeCanvas(TreeCanvas.WIDTH, TreeCanvas.HEIGHT, this.canvas);
	this.fdTreeCanvas = new FDTreeCanvas(TreeCanvas.WIDTH, TreeCanvas.HEIGHT, this.canvas);

	this.preUpdate();

};

TreeCanvas.prototype.getCanvas = function(type) {

	if( type === null || type === undefined ){
	
		if(TreeCanvas.MODE == TreeCanvas.MODES.FDTREE)
			return this.fdTreeCanvas;
		else
			return this.scaleTreeCanvas;
	}
	else{
	
		if(type == TreeCanvas.MODES.FDTREE)
			return this.fdTreeCanvas;
		else
			return this.scaleTreeCanvas;
	}
};


TreeCanvas.prototype.preUpdate = function() {
	if(TreeCanvas.MODE == TreeCanvas.MODES.FDTREE)
		this.fdTreeCanvas.preUpdate();
};

TreeCanvas.prototype.update = function() {
	if(TreeCanvas.MODE == TreeCanvas.MODES.FDTREE)
		this.fdTreeCanvas.update();
	else
		this.scaleTreeCanvas.update();
};

TreeCanvas.prototype.switchCanvas = function(mode){
	if(TreeCanvas.MODE == mode)
		return;
	else{
		TreeCanvas.MODE = mode;
		this.preUpdate();
		this.update();
	}

}


TreeCanvas.WIDTH = 700;
TreeCanvas.HEIGHT = 500;
TreeCanvas.div = "#treeCanvas";

TreeCanvas.dfNodeFill = "#eee";
TreeCanvas.dfEdgeStroke = "#aaa";
TreeCanvas.dfEdgeStrokeWidth = 1;

TreeCanvas.hlEdgeStroke = "#fdbb84";
TreeCanvas.hlEdgeStrokeWidth = 3;


TreeCanvas.MODES = { SCALETREE:0, FDTREE:1 };
TreeCanvas.MODE = TreeCanvas.MODES.SCALETREE;