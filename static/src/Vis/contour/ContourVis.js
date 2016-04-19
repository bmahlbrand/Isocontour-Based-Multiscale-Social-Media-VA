ContourVis = function(map_svg, overlay_svg, geo_bbox, start_time, end_time){

	this.map_svg = map_svg;

	//not used currently in this version;
	this.overlay_svg = overlay_svg;

};

ContourVis.prototype.clear = function(){
	this.map_svg.selectAll("*").remove();
};

ContourVis.prototype.updateGeoBbox = function(){

	var that = this;

	//var currRelativeLevel = $('[ng-controller="map_controller"]').scope().getMap().map.getZoom() 
							// - ( case_study[default_case].zoom + case_study[default_case].startLevel ) ;

	//only see adjacent 3 levels
	//var visLevelRange = [ currRelativeLevel-2, currRelativeLevel+1 ];
	
	// get the clusters of all levels;
	var cNodeMatrix = DataCenter.instance().getTree().getTreeByLevels();
	//filter based on vis levels
	//clusterMatrix = clusterMatrix.filter(function(clusters, i){ return i >= visLevelRange[0] && i <= visLevelRange[1]; });

	for(var level=0; level<cNodeMatrix.length; level++){

		var cnodes = cNodeMatrix[level];

		//calculate the smoothed concave hull;
		cnodes.forEach(function(cnode){

			var cluster = cnode.cluster;

			/****************** filter clusters based on zoom level ***************************/
			// check zoom level
			// var zoomLevel = $('[ng-controller="map_controller"]').scope().getMap().map.getZoom();
			// if( Math.abs(zoomLevel - cluster['zoom']) > 1 )
			// 	return;
			// if(cluster['zoom'] != 13)
			// 	return;
			/****************** filter clusters based on zoom level ***************************/

			//clusters[i]['pixelPts'] = pixelPts;
			//2d array contains 1d poly
			cluster['hulls'] = ContourVis.getConcaveHull(cluster['hullIds']);

			//optimized results save in clusters[i]['optimizedHulls']
			cluster['optimizedHulls'] = [];

		});

	}

	//perform overlapping removal;
	if(ContourVis.minOverlap)
		//only change clusters[i]['optimizedHulls']
		cNodeMatrix = HullLayout.minimizeOverlap(cNodeMatrix);


	var drawedIds = [];
	//Draw concave hulls;
	cNodeMatrix.forEach(function(cnodes){

		cnodes.forEach(function(cnode){

			var cluster = cnode.cluster;

			var hulls = cluster['optimizedHulls'];

			hulls.forEach(function(hull){
				
				if( that.filterHull(hull) ){
					//temporarily, blue color, null id;
					//that.drawConcaveHull(cluster['clusterId'], hull, "blue");
					drawedIds.push(cluster['clusterId']);
				}
			});
		});
	});

	//acNode list;
	$('[ng-controller="app_controller"]').scope().setAcNodes(drawedIds);

};

ContourVis.prototype.update = function(){

	var that = this;

	this.clear();

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();

	//draw hull
	var clist = DataCenter.instance().getTree().toList();

	clist = clist.filter(function(val){
		return acNodes.indexOf(val.cluster['clusterId']) != -1;
	});

	clist.forEach(function(val){

		var hulls = val.cluster['optimizedHulls'];

		hulls.forEach(function(hull){
			//acual rendering function
			
			var strokeColor = contourColorStroke()(val.cluster['zoom']);
			var fillColor = contourColorFill()(val.cluster['zoom']);

			that.drawConcaveHull(val.cluster['clusterId'], hull, strokeColor, fillColor);
		});

	});

	//hover hull
	//var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes();
	//this.hoverHull(hlNodes);

};


//if clusterIdlist is empty, reset;
// ContourVis.prototype.hoverHull = function(clusterIdlist){

// 	if(clusterIdlist.length <= 0){
// 		d3.selectAll(".concaveHull")
// 			.attr("opacity", 1);
// 		return;
// 	}

// 	d3.selectAll(".concaveHull")
// 		.attr("opacity", 0);

// 	clusterIdlist.forEach(function(val){

// 		d3.selectAll(".hull_"+val)
// 			.attr("opacity", 1);
// 	});

// };

ContourVis.prototype.drawConcaveHull = function(id, pts, strokeColor, fillColor){

	pts = HullLayout.odArrTo2dArr(pts);

	var that = this;
	var svg = this.map_svg;

	var lineFunction = null;

	if(ContourVis.MODE == ContourVis.INTERMODE.BASIS){
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("basis-closed");
	}else{
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("cardinal-closed")
                        .tension(ContourVis.tension);
	}

	var _fillColor = null;
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.BOUND)
		_fillColor = "none";
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSINGLE || ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSEQUENTIAL)
		_fillColor = fillColor;

    var hull = svg.append("path")
    				.attr("id", "hull_" + id)
			    	.attr("class", "concaveHull "+"hull_"+id)
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", strokeColor)
			    	.attr("stroke-width", 3)
			    	.attr("fill", _fillColor)
			    	.attr("fill-opacity", 0.4)
			    	.on("mouseover", function(){

			    		//tweets inside the hull;
			    		var cluster_id = this.id.substring(5, this.id.length);
			    		console.log(cluster_id);

			    		var ids = DataCenter.instance().getClusters()[cluster_id]['ids'];
			    		var tweets = DataCenter.instance().getTweetsByIds(ids);
			    		
			    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");

			    		//cate distribution
			    		console.log(DataCenter.instance().distOfCate(tweets));

			    		//tweets on the boundary:
			    		var ids = [];
			    		DataCenter.instance().getClusters()[cluster_id]['hullIds'].forEach(function(idlist){
			    			ids = ids.concat(idlist);
			    		});

			    		var tweets = DataCenter.instance().getTweetsByIds(ids);
			    		
			    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "blue");
						
						//$('[ng-controller="app_controller"]').scope().addHlNode(cluster_id);

		  			}).on("mouseout", function(){

		  				$('[ng-controller="map_controller"]').scope().clear_dots();

		  				var cluster_id = this.id.substring(5,this.id.length);
		  				//$('[ng-controller="app_controller"]').scope().removeHlNode(cluster_id);

		  			});

};


ContourVis.prototype.filterHull = function(hull){

	//not valid hull
	if(hull.length < 6)
		return false;

	var aabb = PolyK.GetAABB(hull);

	if(aabb.width < 5 || aabb.height < 5 )
		return false;

	//check in the viewport;
	var flag = false;
	for(var i=0; i<hull.length/2; i++){

		var x = hull[2*i];
		var y = hull[2*i+1];
		if( (x > 0 && x < ContourVis.DIMENSION) && (y > 0 && y < ContourVis.DIMENSION) )
			flag = true;
	}

	return flag;
};
//if not valid, return [];
ContourVis.getConcaveHull = function(idsList){

	// get hull using js function. input: poly.
	// if(poly.length < 3)
	// 	return [];

	// // 1->concave; Infinity->convex.
	// var poly = hull(poly, 100);
	// return ContourVis.smoothPoly(poly);


	// get hull from json file;

	if(idsList.length <= 0)
		return [];

	var rst = [];
	idsList.forEach(function(ids){
		
		if(ids.length <= 3){
			//no hull;
			//theorotically this will not happen since this is already checked in the server side;
			rst.push([]);
		}
		else{

			var tweets = DataCenter.instance().getTweets();
			var pts = [];
			ids.forEach(function(id){
				var pt = Canvas_manager.instance().geo_p_to_pixel_p({x:tweets[id].lon, y:tweets[id].lat});	
				pts.push(pt.x);
				pts.push(pt.y)
			});

			rst.push(pts.slice(0, pts.length-2));
		}

	});

	return rst;
};

// not called in the current version
// ContourVis.smoothPoly = function(poly){

// 	if(poly.length <= 0)
// 		return [];

// 	//relax poly --> if two adjacent points are near each other, remove them;
// 	var len = poly.length;
// 	var i = 1;
// 	var thres = 10;

// 	while(i<len){

// 		var p0 = poly[i-1];
// 		var p1 = poly[i];

// 		//remove points;
// 		if( Math.abs(p0[0]-p1[0])<=thres && Math.abs(p0[1]-p1[1])<=thres ){
// 			poly.splice(i,1);
// 			len--;
// 		}
// 		else{
// 			i++;
// 		}
// 	}

// 	//remove the last point, since it is the same as the first point;
// 	if(poly.length > 0)
// 		poly.splice(poly.length-1, 1);

// 	return poly;
// };

/******************  parameter setup  **********************/
ContourVis.tension = 0.7;
ContourVis.minOverlap = true;
ContourVis.INTERMODE = { BASIS:0, CARDINAL:1 };
ContourVis.MODE = ContourVis.INTERMODE.CARDINAL;
ContourVis.DIMENSION = 1024;

ContourVis.CONTOURMODE = { BOUND:0, FILLSINGLE:1, FILLSEQUENTIAL:2 };
ContourVis.CONTOUR = ContourVis.CONTOURMODE.FILLSEQUENTIAL;


/******************  parameter setup  **********************/

ContourVis.prototype.createDummyPath = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

	var that = this;
	var svg = this.map_svg;

	var lineFunction = null;

	if(ContourVis.MODE == ContourVis.INTERMODE.BASIS){
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("basis-closed");
	}else{
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("cardinal-closed")
                        .tension(ContourVis.tension);
	}

    var hull = svg.append("path")
			    	.attr("class", "dummyPath")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", "#FFF")
			    	.attr("opacity", 0);
	return hull;

};