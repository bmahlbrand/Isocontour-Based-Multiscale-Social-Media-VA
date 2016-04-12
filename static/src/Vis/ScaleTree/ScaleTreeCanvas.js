ScaleTreeCanvas = function(){

	this.canvas = null;

	this.scaleBounds = [];

	this.init();
}

ScaleTreeCanvas.prototype.init = function() {
	
	this.canvas = d3.select(ScaleTreeCanvas.div)
			    	.append("svg")
			    	.attr("id", "ScaleTreeCanvasSvg")
			    	.attr("width", ScaleTreeCanvas.width)
			    	.attr("height", ScaleTreeCanvas.height)
			    	;
};

ScaleTreeCanvas.prototype.setBbox = function(){

	var level = DataCenter.instance().getTree().getHeight();

	var margin = ScaleTreeCanvas.treeMargin;

	var centerX = ScaleTreeCanvas.width/2;
	var centerY = ScaleTreeCanvas.height / level / 2;
	var w = ScaleTreeCanvas.width/2 - margin;
	var h = ScaleTreeCanvas.height / level / 2;

	//initial bbox
	var bbox = new BBox(centerX, centerY, w, h);
	DataCenter.instance().getTree().setBbox(bbox);

};

ScaleTreeCanvas.prototype.drawRect = function(id, bbox){

	var that = this;

	var node = DataCenter.instance().getTree().getNodeById(id);
	var color = statColor()(node.cluster['score']);
	//draw node;
	var rectangle = this.canvas.append("rect")
								.attr("id", "node_"+id)
								.attr("class", "treeNode")
	                            .attr("x", bbox.getLeft())
	                            .attr("y", bbox.getTop())
	                            .attr("width", bbox.getWidth())
	                            .attr("height", bbox.getHeight())
	                            .attr("stroke", ScaleTreeCanvas.nodeStroke)
	                            .attr("fill", color)
	                            .on("click", function(){
	                            	alert(this.id);
	                            })
	                            // .on("mouseover", function(){
	                            // 	$('[ng-controller="app_controller"]').scope().addHlNode(id);
	                            // })
	                            // .on("mouseout", function(){
	                            // 	$('[ng-controller="app_controller"]').scope().removeHlNode(id);
	                            // })
	                            .on('contextmenu', d3.contextMenu(that.get_menu(id)) );
};

ScaleTreeCanvas.prototype.get_menu = function(id){

	var that = this;

	var menu = [
		{
			title: 'set',
			action: function(elm, d) {
	            
	            $('[ng-controller="app_controller"]').scope().addHlNode(id);
			}
		},
		{
			title: 'unset',
			action: function(elm, d) {

				$('[ng-controller="app_controller"]').scope().removeHlNode(id);
			}
		},
		{
			title: 'cancel',
			action: function(elm, d, i) {
			}
		}
	];

	return menu;

};

ScaleTreeCanvas.prototype.drawBCurve = function(pts){

	var lineFunction = d3.svg.line()
		                      .x(function(d) { return d[0]; })
		                      .y(function(d) { return d[1]; })
		                      .interpolate("basis");
    
    var lineGraph = this.canvas.append("path")
    							.attr("class", "treeLinkage")
		                        .attr("d", lineFunction(pts))
		                        .attr("stroke", ScaleTreeCanvas.linkStroke)
		                        .attr("stroke-width", 1)
		                        .attr("fill", "none")
		                        .attr("opacity", 0.5);

};

ScaleTreeCanvas.prototype.drawScaleBound = function(){

	var init_level = case_study[default_case].startLevel + case_study[default_case].zoom;
	var end_level = case_study[default_case].endLevel + case_study[default_case].zoom;
	var level = end_level - init_level + 1;

	for(var i=init_level; i<=end_level; i++){

		var yMargin = 5;

		var centerX = ScaleTreeCanvas.width/2;
		var centerY = ScaleTreeCanvas.height / level * (i - init_level + 0.5);
		var w = ScaleTreeCanvas.width/2;
		var h = ScaleTreeCanvas.height / level * 0.5 - yMargin;
		var bbox = new BBox(centerX, centerY, w, h);

		var color = contourColor()(i);

		var rectangle = this.canvas.append("rect")
                            .attr("x", bbox.getLeft())
                            .attr("y", bbox.getTop())
                            .attr("width", bbox.getWidth())
                            .attr("height", bbox.getHeight())
                            .attr("stroke", color)
                            .attr("fill", color)
                            .attr("stroke-width", 3)
                            .attr("opacity", 0.1);
	}

};


ScaleTreeCanvas.prototype.drawNode = function(){

	this.setBbox();
	DataCenter.instance().getTree().drawBbox();

	this.hoverNode();

};

ScaleTreeCanvas.prototype.hoverNode = function(){

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();
	var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes();

	d3.selectAll(".treeNode")
		.attr("stroke", ScaleTreeCanvas.deAcNodeStroke)
		.attr("fill", ScaleTreeCanvas.deAcNodeFill);

	acNodes.forEach(function(val){
		
		d3.select("#node_"+val)
			.attr("stroke", ScaleTreeCanvas.nodeStroke)
			.attr("fill", ScaleTreeCanvas.nodeFill);
	});

	hlNodes = intersect_arrays(acNodes, hlNodes);

	hlNodes.forEach(function(val){
		
		d3.select("#node_"+val)
			.attr("stroke", ScaleTreeCanvas.hLNodeStroke)
			.attr("fill", ScaleTreeCanvas.hLNodeFill);
	});

};


ScaleTreeCanvas.prototype.drawLinkage = function(){

	DataCenter.instance().getTree().drawLinkage();

	this.hoverLinkage();
};

ScaleTreeCanvas.prototype.hoverLinkage = function(){

};

ScaleTreeCanvas.prototype.update = function(){

	//clear canvas;
	this.canvas.selectAll("*").remove();

	this.drawScaleBound();
	this.drawNode();
	this.drawLinkage();

	console.log("render done");

};

ScaleTreeCanvas.width = 700;
ScaleTreeCanvas.height = 700;
ScaleTreeCanvas.nodeHeight = 40;
ScaleTreeCanvas.div = "#ScaleTreeCanvasView";

ScaleTreeCanvas.treeMargin = 50;

ScaleTreeCanvas.hLNodeStroke = "#313695";
ScaleTreeCanvas.hLNodeFill = "#abd9e9";

ScaleTreeCanvas.nodeStroke = "#4575b4";
ScaleTreeCanvas.nodeFill = "#e0f3f8";

ScaleTreeCanvas.deAcNodeStroke = "#737373";
ScaleTreeCanvas.deAcNodeFill = "#f7f7f7";

ScaleTreeCanvas.linkStroke = "#b2182b";

ScaleTreeCanvas.NODE_VIS_MODE = { GEO_FILTER:0, STAT:1 };

ScaleTreeCanvas.node_vis = ScaleTreeCanvas.NODE_VIS_MODE.GEO_FILTER;

/***********************************************************************************/