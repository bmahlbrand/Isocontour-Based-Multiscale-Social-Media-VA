FDTreeCanvas = function(width, height, canvas){

	//vis styling
	this.width = width;
	this.height = height;

	this.canvas = canvas;

	this.init();

};

FDTreeCanvas.prototype.init = function() {

};

//https://github.com/d3/d3-3.x-api-reference/blob/master/Force-Layout.md
//https://bl.ocks.org/mbostock/1062288 [collapsible force layout]
//understanding the parameter of force-directed layout: http://bl.ocks.org/sathomas/11550728
FDTreeCanvas.prototype.forceLayout = function(nodes, edges, treeNode){

	//calculate attributes;
	var treeNodeList = treeNode.toList();
	var vols = treeNodeList.map(function(val){ return val.getVol(); });

	/*******************************************node configuration*********************************************/
	//linear scale;
	// var nodeSize = d3.scale.linear()
	// 						.domain([_.min(vols), _.max(vols)])
	// 						.range([3,20]);
	//log scale;
	var nodeSize = d3.scale.log()
							.base(Math.E)
							.domain([_.min(vols), _.max(vols)])
							.range([3,20]);

	var nodeCharge = d3.scale.linear()
							.domain([_.min(vols), _.max(vols)])
							.range([-30,-120]);
	/**********************************************************************************************************/

	/*******************************************edge configuration*********************************************/
	var zoomLevel = treeNodeList.map(function(val){ return parseInt(val.cluster['clusterId'].split("_")[0]); });

	var nodeChildren = nodes.map(function(val){ return val.children.length; });

	//based on zoom level
	// var linkDis = d3.scale.linear()
	// 						.domain([_.min(zoomLevel), _.max(zoomLevel)])
	// 						.range([200,10]);

	//based on number of children of the parent node;
	var linkDis = d3.scale.linear()
							.domain([_.min(nodeChildren), _.max(nodeChildren)])
							.range([8,200]);

	/**********************************************************************************************************/

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
						    .charge(function(d) {
						    	return nodeCharge(d.vol);
						    	// return d.children ? -d.vol / 10 : -30; 
						    })
    						.linkDistance(function(d) {

    							// var level = parseInt(d.source.id.split("_")[0]);
    							// return linkDis(level);
    							var numChild = parseInt(d.target.children.length);
    							return linkDis(numChild) + nodeSize(d.target.vol) + nodeSize(d.source.vol);
    							// return d.target.children ? 80 : 15; 
    						})
						    .size([that.width, that.height])
						    .on("tick", ticked);

	// var simulation = d3.forceSimulation()
	// 				    .force("link", d3.forceLink().id(function(d) { return d.id; }))
	// 				    .force("charge", d3.forceManyBody())
	// 				    .force("center", d3.forceCenter(that.width / 2, that.height / 2));

	var link = svg.append("g")
					//.attr("class", "FDEdges")
					.selectAll("line")
					.data(edges)
					.enter().append("line")
					.attr("id", function(i){
						return "FDEdges__"+ i.source.id + "__" + i.target.id;
					})
					.attr("class", "FDEdges")
					.attr("stroke-width", 1)
					.attr("stroke-opacity", 0.8)
					.attr("stroke", "#aaa");
	
	var node = svg.append("g")
					//.attr("class", "FDNodes")
					.selectAll("circle")
					.data(nodes)
					.enter().append("circle")
					.attr("id", function(i){
						return "FDNodes_"+ i.id;
					})
					.attr("class", "FDNodes")
					.attr("r", function(i){
						return nodeSize(i.vol);
					})
					.attr("stroke", "#000")
  					.attr("stroke-width", 0.5)
					.attr("fill", function(i){
						return "#eee";
					})
					.style("cursor", "hand")
					.call(force.drag);

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

//update layout, this function is only called when the program starts or when the canvas is switched to this FDTree one;
FDTreeCanvas.prototype.preUpdate = function(){

	//clear canvas;
	this.canvas.selectAll("*").remove();

	//get tree node(root or node specified by user)
	var treeNode = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);
	var nodeEdge = treeNode.getNodeEdge();

	this.forceLayout(nodeEdge[0], nodeEdge[1], treeNode);

};


/***************************************************************/
FDTreeCanvas.prototype.hoverNode = function(){

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();

	var defaultFill = TreeCanvas.dfNodeFill;

	d3.selectAll(".FDNodes")
		.attr("fill", defaultFill);

	acNodes.forEach(function(val){
		
		var level = val.split("_")[0];
		var highlightFill = contourColorFill()(parseInt(level));

		d3.select("#FDNodes_"+val)
			.attr("fill", highlightFill);
	});

};

FDTreeCanvas.prototype.hoverEdges = function(){
	
	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();

	var defaultStroke = TreeCanvas.dfEdgeStroke;
	var hilightedStroke = TreeCanvas.hlEdgeStroke;

	d3.selectAll(".FDEdges")
		.attr("stroke", function(){
			
			var tks = this.id.split("__");
			var source = tks[1];
			var target = tks[2];
			if( acNodes.indexOf(source) != -1 && acNodes.indexOf(target) != -1 )
				return hilightedStroke;
			else
				return defaultStroke;

		})
		.attr("stroke-width", function(){
			
			var tks = this.id.split("__");
			var source = tks[1];
			var target = tks[2];
			if( acNodes.indexOf(source) != -1 && acNodes.indexOf(target) != -1 )
				return TreeCanvas.hlEdgeStrokeWidth;
			else
				return TreeCanvas.dfEdgeStrokeWidth;

		});

};

FDTreeCanvas.prototype.update = function(){

	this.hoverEdges();
	this.hoverNode();

};