VisComponent = function(){
	this.bbox = null;
	this.visBbox = null;
};

VisComponent.prototype.setBbox = function(cx, cy, ex, ey){
	
	this.bbox = new BBox(cx, cy, ex, ey);

	//shrink a little bit for visualization:
	var margin = 3;
	if(this.bbox.getWidth() > margin)
		this.bbox.getExtent().x -= margin*0.5;
	if(this.bbox.getHeight() > margin)
		this.bbox.getExtent().y -= margin*0.5;

	this.visBbox = new BBox();
	
	this.visBbox.setBox(this.bbox);
	
	var extent = this.visBbox.getExtent();
	extent.x = Math.max(extent.x - 2, 1);
	extent.y = extent.y * 0.4;
	this.visBbox.setExtents(extent.x, extent.y);

};

VisComponent.prototype.getVisBbox = function(){
	return this.visBbox;
};

VisComponent.prototype.getBbox = function(){
	return this.bbox;
};

// x between [1, infinity]
VisComponent.logScale = function(x, node, max){
	return Math.log(x+1);
};

VisComponent.linearScale = function(x, node, max){
	return x;
};

VisComponent.uniformScale = function(x, node, max){
	return node.getNumOfLeaves();

};

VisComponent.polyScale = function(x, node, max){
	return Math.sqrt(x/max)*max;
};

VisComponent.scale = function(){

	if(VisComponent.SCALE == VisComponent.SCALEMODE.LOG)
		return VisComponent.logScale;
	else if(VisComponent.SCALE == VisComponent.SCALEMODE.LINEAR)
		return VisComponent.linearScale;
	else if(VisComponent.SCALE == VisComponent.SCALEMODE.UNIFORM)
		return VisComponent.uniformScale;
	else if(VisComponent.SCALE == VisComponent.SCALEMODE.POLY)
		return VisComponent.polyScale;
};

VisComponent.SCALEMODE = {LOG:0, LINEAR:1, UNIFORM:2, POLY:3};
VisComponent.SCALE = VisComponent.SCALEMODE.LINEAR;