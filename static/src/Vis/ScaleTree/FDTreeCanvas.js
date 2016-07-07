FDTreeCanvas = function(){

	//vis styling
	this.width = ScaleTreeCanvas.WIDTH;
	this.height = ScaleTreeCanvas.HEIGHT;

	this.canvas = null;
	this.div = "#FDTreeCanvasView";

	this.init();

};

FDTreeCanvas.prototype.init = function() {
	
	var that = this;

	this.canvas = d3.select(that.div)
			    	.append("svg")
			    	.attr("id", "FDTreeCanvasSvg")
			    	.attr("width", that.width)
			    	.attr("height", that.height)
			    	;
};

//https://github.com/d3/d3-3.x-api-reference/blob/master/Force-Layout.md
//https://bl.ocks.org/mbostock/1062288 [collapsible force layout]
FDTreeCanvas.prototype.forceLayout = function(nodes, edges){

	var that = this;
	var svg = this.canvas;

	var force = d3.layout.force()
						    // .linkStrength(0.1)
						    // .friction(0.9)
						    // .linkDistance(20)
						    // .charge(-30)
						    // .gravity(0.1)
						    // .theta(0.8)
						    // .alpha(0.1)
						    .charge(function(d) { return d.children ? -d.vol / 100 : -30; })
    						.linkDistance(function(d) { return d.target.children ? 80 : 15; })
						    .size([that.width, that.height])
						    .on("tick", ticked);

	// var simulation = d3.forceSimulation()
	// 				    .force("link", d3.forceLink().id(function(d) { return d.id; }))
	// 				    .force("charge", d3.forceManyBody())
	// 				    .force("center", d3.forceCenter(that.width / 2, that.height / 2));

	var link = svg.append("g")
					.attr("class", "edges")
					.selectAll("line")
					.data(edges)
					.enter().append("line")
					.attr("stroke-width", 1)
					.attr("stroke-opacity", 0.3)
					.attr("stroke", "#d6604d");
	
	var node = svg.append("g")
					.attr("class", "nodes")
					.selectAll("circle")
					.data(nodes)
					.enter().append("circle")
					.attr("r", function(i){
						return Math.max(Math.sqrt(i.vol) / 3, 5);
					})
					.attr("stroke", "#000")
  					.attr("stroke-width", .5)
					.attr("fill", function(i){
						var level = i.id.split("_")[0];
						return contourColorFill()(parseInt(level));
					});

	force.nodes(nodes)
			.links(edges)
			.start();

  	function ticked(){

  		link.attr("x1", function(d) { return d.source.x; })
  			.attr("y1", function(d) { return d.source.y; })
  			.attr("x2", function(d) { return d.target.x; })
  			.attr("y2", function(d) { return d.target.y; });

    	node.attr("cx", function(d) { return d.x; })
    		.attr("cy", function(d) { return d.y; });
    }					

}

FDTreeCanvas.prototype.update = function(){

	//clear canvas;
	this.canvas.selectAll("*").remove();

	//get tree node(root or node specified by user)
	var treeNode = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);
	var nodeEdge = treeNode.getNodeEdge();

	this.forceLayout(nodeEdge[0], nodeEdge[1]);


};