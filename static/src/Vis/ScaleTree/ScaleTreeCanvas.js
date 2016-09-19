ScaleTreeCanvas = function(width, height, canvas){

	//vis styling
	this.width = width;
	this.height = height;

	this.nodeHeight = 40;

	this.treeMarginX = 30;

	this.TREE_TYPE = ScaleTreeCanvas.TREE_TYPE_MODE.NODELINK;
	this.node_vis = ScaleTreeCanvas.NODE_VIS_MODE.GEO_FILTER;
	this.NODE_TYPE = ScaleTreeCanvas.NODE_TYPE_MODE.RECT;

	this.scaleBoundFlag = false;
	//vis styling

	this.canvas = canvas;

	this.scaleBounds = [];

	this.init();

}

ScaleTreeCanvas.prototype.init = function() {

};

ScaleTreeCanvas.prototype.setBbox = function(treeNode){

	var level = treeNode.getHeight();

	var centerX = this.width/2;
	var centerY = this.height / level / 2;
	var w = this.width/2 - this.treeMarginX;
	var h = this.height / level / 2;

	//initial bbox
	var bbox = new BBox(centerX, centerY, w, h);
	treeNode.setBbox(bbox);

};

/**************************actual rendering function for tree node -- render rectangle*************************/
ScaleTreeCanvas.prototype.drawRect = function(id, bbox){

	var that = this;

	var node = DataCenter.instance().getTree().getNodeById(id);
	//draw node;
	var rectangle = this.canvas.append("rect")
								.attr("id", "node_"+id)
								.attr("class", "treeNode")
	                            .attr("x", bbox.getLeft())
	                            .attr("y", bbox.getTop())
	                            .attr("width", bbox.getWidth())
	                            .attr("height", bbox.getHeight())
	                            .attr("stroke", "#000")
  								.attr("stroke-width", 0.5)
	                            .attr("fill", "none")
	                            .on("click", function(){

	                            	var id = this.id.substring(5,this.id.length);
	                            	$('[ng-controller="table_controller"]').scope().displayMsgByClusterId(id);
	                            	console.log(id);

	                            })
	                            // .on("mouseover", function(){
	                            // 	$('[ng-controller="app_controller"]').scope().addHlNode(id);
	                            // })
	                            // .on("mouseout", function(){
	                            // 	$('[ng-controller="app_controller"]').scope().removeHlNode(id);
	                            // })
	                            .on('contextmenu', d3.contextMenu(that.get_menu(id)) );
};


/**************************actual rendering function for tree node -- render circle*************************/
ScaleTreeCanvas.prototype.drawCircle = function(id, bbox){

	var that = this;

	var margin = 1;
	var radius = bbox.getHeight() / 2 - margin;

	var node = DataCenter.instance().getTree().getNodeById(id);
	//draw node;
	var rectangle = this.canvas.append("circle")
								.attr("id", "node_"+id)
								.attr("class", "treeNode")
	                            .attr("cx", bbox.getCenter().x)
	                            .attr("cy", bbox.getCenter().y)
	                            .attr("r", radius)
	                            .attr("stroke", "#000")
  								.attr("stroke-width", 0.5)
	                            .attr("fill", "none")
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
	
	this.drawPieChart(id, [bbox.getCenter().x, bbox.getCenter().y], radius);

};


ScaleTreeCanvas.prototype.drawPieChart = function(id, center, radius) {

	var node = DataCenter.instance().getTree().getNodeById(id);
	var rst = node.stat.generateAndNormalizeCateAndColorForVis();

	if(rst == null)
		return;
	
	var arc = d3.svg.arc().outerRadius( function(d){ return radius; } ).innerRadius(0);

	var pie_svg = this.canvas.append("g")
    				   .attr("id", "cluster_pie_chart_"+id)
    				   .attr("class", "cluster_pie_chart")
      			 	   //.attr("transform", "translate(" + (clusters[i].vis_bbox.center.x - pixel_bbox.center.x) + "," + (clusters[i].vis_bbox.center.y - pixel_bbox.center.y) + ")");
      			 	   .attr("transform", "translate(" + center[0] + "," + center[1] + ")");

	var pie = d3.layout.pie()
							.sort(null)
							.value(function(d) { return d; });

  	var pie_chart = pie_svg.selectAll(".arc")
							   .data(pie(rst[0]))
							   .enter().append("g")
							   .attr("class", "arc");

	pie_chart.append("path")
				 .attr("d", arc)
				 //.attr("id", function(d, i) { return "cluster_pie_chart_"+id+"_topic_sector_"+i; })
				 .attr("id", function(d, i) { return "cluster_pie_chart_"+id; })
				 .attr("opacity", 1)
				 .style("fill", function(d, i) { return rst[1][i]; })
				 .style("stroke-width", 0.5)
				 .style("stroke", "#aaa")
				 .on("click", function(){

				 	var id = this.id.substring(18, this.id.length);
				 	var node = DataCenter.instance().getTree().getNodeById(id);
					var rst = node.stat.generateAndNormalizeCateAndColorForVis();
					alert(rst[0]);

				 });

};


ScaleTreeCanvas.prototype.get_menu = function(id){

	var that = this;

	var menu = [
		{
			title: 'focus on me',
			action: function() {
	             DataCenter.instance().setFocusID(id);
			}
		},
		{
			title: 'reset focus',
			action: function() {
	             DataCenter.instance().setFocusID(DataCenter.instance().rootID);
			}
		},
		{
			title: 'set',
			action: function() {
	            $('[ng-controller="app_controller"]').scope().addHlNode(id);
			}
		},
		{
			title: 'unset',
			action: function() {
				$('[ng-controller="app_controller"]').scope().removeHlNode(id);
			}
		},
		{
			title: 'moveTo',
			action: function() {

				var node = DataCenter.instance().getTree().getNodeById(id);

				$('[ng-controller="map_controller"]').scope().getMap().moveTo(node.cluster.center.lon, node.cluster.center.lat, node.cluster.zoom);
			}
		},
		{
			title: 'cancel',
			action: function() {
			}
		}
	];

	return menu;

};

/**************************actual rendering function for tree edge -- render bcurve or linear*************************/
ScaleTreeCanvas.prototype.drawBCurve = function(pid, cid, pts){

	var lineType = ScaleTreeCanvas.linkType == 0 ? 'basis' : 'linear';

	var lineFunction = d3.svg.line()
		                      .x(function(d) { return d[0]; })
		                      .y(function(d) { return d[1]; })
		                      .interpolate(lineType);
    
    var lineGraph = this.canvas.append("path")
    							.attr("id", "link__"+pid+"__"+cid)
    							.attr("class", "treeLinkage")
		                        .attr("d", lineFunction(pts))
		                        .attr("fill", "none")
		                        .attr("stroke-opacity", 0.8)
		                        .attr("opacity", 1);

};

/**************************************draw legend for zoom level**************************************/
ScaleTreeCanvas.prototype.drawScaleBound = function(treeNode){

	//var init_level = case_study[default_case].startLevel + case_study[default_case].zoom;
	//var end_level = case_study[default_case].endLevel + case_study[default_case].zoom;
	//var level = end_level - init_level + 1;
	var init_level = treeNode.cluster['zoom'];
	var level = treeNode.getHeight();
	var end_level = init_level + level - 1;

	for(var i=init_level; i<=end_level; i++){

		var yMargin = 5;

		var centerX = this.width/2;
		var centerY = this.height / level * (i - init_level + 0.5);
		var w = this.width/2;
		var h = this.height / level * 0.5 - yMargin;
		
		var bbox = new BBox(centerX, centerY, w, h);

		var color = contourColorFill()(i);
		var opac = 0.2;

		/**************************************************/
		/***********mode 1: entire fill********************/
		/**************************************************/

		// this.canvas.append("rect")
  //                   .attr("x", bbox.getLeft())
  //                   .attr("y", bbox.getTop())
  //                   .attr("width", bbox.getWidth())
  //                   .attr("height", bbox.getHeight())
  //                   .attr("stroke", color)
  //                   .attr("fill", color)
  //                   .attr("stroke-width", 1)
  //                   .attr("opacity", 0.3);


  		/**************************************************/
		/***********mode 2: side-by-side box***************/
		/**************************************************/

		var bw = 5;
		var boxLeft = new BBox(centerX * bw / w, centerY, bw, h);
		var boxRight = new BBox( 2*w - centerX * bw / w, centerY, bw, h);

		this.canvas.append("rect")
	                  .attr("x", boxLeft.getLeft())
	                  .attr("y", boxLeft.getTop())
	                  .attr("width", boxLeft.getWidth())
	                  .attr("height", boxLeft.getHeight())
	                  .attr("stroke", color)
	                  .attr("fill", color)
	                  .attr("stroke-width", 1)
	                  .attr("opacity", 1);

	    this.canvas.append("rect")
	                  .attr("x", boxRight.getLeft())
	                  .attr("y", boxRight.getTop())
	                  .attr("width", boxRight.getWidth())
	                  .attr("height", boxRight.getHeight())
	                  .attr("stroke", color)
	                  .attr("fill", color)
	                  .attr("stroke-width", 1)
	                  .attr("opacity", 1);
		
		/**************************************************/
		/***********mode 3: color gradient******************/
		/**************************************************/
		
        //mode 3: color gradient;
  //       var gradient = this.canvas.append("defs")
		//   .append("linearGradient")
		//     .attr("id", "backGrad")
		//     .attr("x1", "0%")
		//     .attr("x2", "100%")
		//     .attr("spreadMethod", "pad");

		// gradient.append("stop")
		//     .attr("offset", "0%")
		//     .attr("stop-color", color)
		//     .attr("stop-opacity", opac);

		// gradient.append("stop")
		//     .attr("offset", "5%")
		//     .attr("stop-color", "#fff")
		//     .attr("stop-opacity", opac);

		// gradient.append("stop")
		//     .attr("offset", "95%")
		//     .attr("stop-color", "#fff")
		//     .attr("stop-opacity", opac);

		// gradient.append("stop")
		//     .attr("offset", "100%")
		//     .attr("stop-color", color)
		//     .attr("stop-opacity", opac);

		// this.canvas.append("rect")
		// 			.attr("x", bbox.getLeft())
		// 			.attr("y", bbox.getTop())
		// 			.attr("width", bbox.getWidth())
		// 			.attr("height", bbox.getHeight())
		// 		    .style("fill", "url(#backGrad)");

	}

};

/*************************************generic wrapper for tree node rendering*************************************************/
ScaleTreeCanvas.prototype.drawTreeNode = function(id, visBbox, bbox){

	if( this.TREE_TYPE == ScaleTreeCanvas.TREE_TYPE_MODE.NODELINK ){

		if( this.NODE_TYPE == ScaleTreeCanvas.NODE_TYPE_MODE.RECT )
			this.drawRect(id, visBbox);
		else if( this.NODE_TYPE = ScaleTreeCanvas.NODE_TYPE_MODE.CIRC )
			this.drawCircle(id, visBbox);
	}
	else if( this.TREE_TYPE == ScaleTreeCanvas.TREE_TYPE_MODE.ICICLE ){

		this.drawRect(id, bbox);
	}

};

/*************************************generic wrapper for tree node/highlight rendering*************************************/
ScaleTreeCanvas.prototype.drawNodes = function(treeNode){

	treeNode.drawNodes();

	this.hoverNode();
};

/*************************************highlight background of tree node*************************************/
// ScaleTreeCanvas.prototype.drawBgRect = function(bbox){

// 	var that = this;

// 	var color = "#ccc";
// 	//draw node;
// 	var rectangle = this.canvas.append("rect")
// 								.attr("class", "nodeBG")
// 	                            .attr("x", bbox.getLeft())
// 	                            .attr("y", bbox.getTop())
// 	                            .attr("width", bbox.getWidth())
// 	                            .attr("height", bbox.getHeight())
// 	                            .attr("stroke", "none")
// 	                            .attr("fill", color)
// 	                            .attr("fill-opacity", 0.4);
// };

// ScaleTreeCanvas.prototype.drawBackground = function(treeNode){

// 	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();
// 	treeNode.drawBackground(acNodes);

// };

/***************************************************************/
ScaleTreeCanvas.prototype.hoverNode = function(){

	if(this.node_vis == ScaleTreeCanvas.NODE_TYPE_MODE.CIRC)
		return;

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();
	var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes();

	var defaultOpac = 0.3;
	var hlOpac = 1.0;

	var defaultFill = TreeCanvas.dfNodeFill;

	// d3.selectAll(".treeNode")
	// 	.attr("stroke-opacity", defaultOpac)
	// 	.attr("fill-opacity", defaultOpac);

	// acNodes.forEach(function(val){
		
	// 	d3.select("#node_"+val)
	// 		.attr("stroke-opacity", hlOpac)
	// 		.attr("fill-opacity", hlOpac);
	// });
	d3.selectAll(".treeNode")
		.attr("fill", defaultFill);

	acNodes.forEach(function(id){
		
		var level = id.split("_")[0];

		var _fillColor;
		if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.DENSITY){
			var density = DataCenter.instance().getTree().getNodeById(id).stat.getDensity();
			_fillColor = contourColorFill()(density);
		}
		else{
			_fillColor = contourColorFill()(level);
		}

		d3.select("#node_"+id)
			.attr("fill", _fillColor);
	});

	// hlNodes = intersect_arrays(acNodes, hlNodes);

	// hlNodes.forEach(function(val){
		
	// 	d3.select("#node_"+val)
	// 		.attr("stroke-opacity", hlOpac)
	// 		.attr("fill-opacity", hlOpac);
	// });

};

ScaleTreeCanvas.prototype.drawLinkage = function(treeNode){

	if( this.TREE_TYPE == ScaleTreeCanvas.TREE_TYPE_MODE.NODELINK ){
		treeNode.drawLinkage();
		this.hoverLinkage();
	}
	
};

ScaleTreeCanvas.prototype.hoverLinkage = function(){
	
	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();
	var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes();

	var defaultStroke = TreeCanvas.dfEdgeStroke;
	var hilightedStroke = TreeCanvas.hlEdgeStroke;

	d3.selectAll(".treeLinkage")
		.attr("stroke", function(){
			
			var tks = this.id.split("__");
			var pid = tks[1];
			var cid = tks[2];
			if( acNodes.indexOf(pid) != -1 && acNodes.indexOf(cid) != -1 )
				return hilightedStroke;
			else
				return defaultStroke;

		})
		.attr("stroke-width", function(d){

			var tks = this.id.split("__");
			var pid = tks[1];
			var cid = tks[2];
			if( acNodes.indexOf(pid) != -1 && acNodes.indexOf(cid) != -1 )
				return TreeCanvas.hlEdgeStrokeWidth;
			else
				return TreeCanvas.dfEdgeStrokeWidth;
		});

};

ScaleTreeCanvas.prototype.update = function(){

	//clear canvas;
	this.canvas.selectAll("*").remove();

	//get tree node(root or node specified by user)
	var treeNode = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);

	//calculate the bbox of each node
	this.setBbox(treeNode);

	//draw legend of the zoom level;
	if(this.scaleBoundFlag)
		this.drawScaleBound(treeNode);

	//this.drawBackground(treeNode);

	//draw edges and nodes;
	this.drawLinkage(treeNode);
	this.drawNodes(treeNode);

};

/*******************global variables that define the view-level properties*******************/
ScaleTreeCanvas.linkType = 1; // 0 for B curve, 1 for linear line;

ScaleTreeCanvas.NODE_VIS_MODE = { GEO_FILTER:0, STAT:1 };

ScaleTreeCanvas.NODE_TYPE_MODE = { RECT:0, CIRC:1 };

ScaleTreeCanvas.TREE_TYPE_MODE = { NODELINK:0, ICICLE:1 };

/***********************************************************************************/