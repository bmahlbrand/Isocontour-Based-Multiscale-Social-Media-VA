ContourVis = function(map_svg){

	this.map_svg = map_svg;

};

ContourVis.prototype.clear = function(){
	this.map_svg.selectAll("*").remove();
};

ContourVis.prototype.updateGeoBbox = function(){

	//perform minimizing overlapping algorithm;
	var tree = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);
	tree.resetFlags();
	tree.getPixelCoords();
	tree.samplePoints();
	tree.filterNodesForMinOlp();
	tree.minOlp();

	//update activenode list;
	//for the concept of activenode, please find it in the app_controller file;
	tree.filterNodesForVis();

	var clist = tree.toList();

	clist = clist.filter(function(val){
		return val.cluster['visFlag'];
	});

	var activeNodes = clist.map(function(val){ return val.cluster['clusterId']; });

	//acNode list;
	$('[ng-controller="app_controller"]').scope().setAcNodes(activeNodes);


};

ContourVis.prototype.update = function(){

	var that = this;

	this.clear();

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();

	var tree = DataCenter.instance().getTree().getNodeById(DataCenter.instance().focusID);
	tree.drawContour(acNodes);

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

ContourVis.prototype.createLineFunc = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

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

	return lineFunction(pts);

}

// ContourVis.prototype.createLineFuncLinear = function(pts){

// 	pts = HullLayout.odArrTo2dArr(pts);

// 	var lineFunction = null;

// 	lineFunction = d3.svg.line()
// 					.x(function(d) { return d[0]; })
//                     .y(function(d) { return d[1]; })
//                     .interpolate("linear-closed");

// 	return lineFunction(pts);

// }

//use mask to exlude children hull area when rendering the current hull
ContourVis.prototype.drawConcaveHull = function(id, zoom, curLineFunc, ChildsLineFuncArr){

	var that = this;
	var svg = this.map_svg;

	var node = DataCenter.instance().getTree().getNodeById(id);

	var _fillColor = null;
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.BOUND)
		_fillColor = "none";
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSINGLE || ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSEQUENTIAL)
		_fillColor = contourColorFill()(zoom);
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.STATSCORE)
		//disabled for now
		_fillColor = contourColorFill()(zoom);

	var _stroke = contourColorStroke()(zoom);

	// create mask function:
	var mask_id = 'lense_mask_' + id;
	svg.append('defs')
		.call(function (defs){

	    defs.append('mask')
	        .attr('id', mask_id)
	        .call(function(mask){
		          
		        mask.append('rect')
	          		.attr('width', svg.attr("width"))
	  				.attr('height', svg.attr("height"))
	  				.attr('x', 0)
	  				.attr('y', 0)
	  				.attr('fill', '#ffffff');

				ChildsLineFuncArr.forEach(function(c){

					mask.append('path')
						.attr("d", c)
	            		.attr('fill', '#000000');
				});
	        
	        });
    	});


	/*******************************************render area inside the hull*******************************************/
    var hull = svg.append("path")
    				.attr("id", "hull_" + id)
			    	.attr("class", "concaveHull "+"hull_"+id)
			    	.attr("d", curLineFunc)
			    	.attr("fill", _fillColor)
			    	.attr("fill-opacity", 0.6)
			    	.attr('mask', 'url(#' +mask_id+ ')')
			    	.on("click", function(){

			    		var id = this.id.substring(5,this.id.length);
	                    $('[ng-controller="table_controller"]').scope().displayMsgByClusterId(id);
	                    console.log(id);
	                    console.log(node.stat.getCateDist());

			    	})
			    	.on("mouseover", function(){
			    		
			    		/*************************************draw optimized dots************************************/
			    		var cluster_id = this.id.substring(5, this.id.length);
			    		var dots = DataCenter.instance().getTree().getNodeById(cluster_id).cluster['hulls'];
			    		for(var i=0; i<dots.length/2; i++){
			    			svg.append("circle")
			    				.attr('class', 'control_point')
			    				.attr('cx', dots[2*i])
			    				.attr('cy', dots[2*i+1])
			    				.attr('r', 5)
			    				.attr('fill', 'red');
			    		}

			    		/*************************************draw actual tweet dots************************************/
			    		// //tweets inside the hull;
			    		// var cluster_id = this.id.substring(5, this.id.length);
			    		// console.log(cluster_id);

			    		// var ids = DataCenter.instance().getTree().getNodeById(cluster_id).cluster['ids'];
			    		// var tweets = DataCenter.instance().getTweetsByIds(ids);
			    		
			    		// $('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");

			    		// //cate distribution
			    		// console.log(DataCenter.instance().distOfCate(tweets));

			    		//tweets on the boundary:
			    		var ids = [];
			    		DataCenter.instance().getTree().getNodeById(cluster_id).cluster['hullIds'].forEach(function(idlist){
			    			ids = ids.concat(idlist);
			    		});

			    		var tweets = DataCenter.instance().getTweetsByIds(ids);
			    		
			    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "blue");

		  			}).on("mouseout", function(){

		  				/*************************************draw optimized dots************************************/
			    		svg.selectAll(".control_point").remove();

			    		/*************************************draw actual tweet dots************************************/

		  				$('[ng-controller="map_controller"]').scope().clear_dots();

		  			});

	/***************************************************render the boundary*************************************************/
	var selectedCate = DataCenter.instance().focusCates;
	var categories = DataCenter.instance().categories;
	var cateVol = selectedCate.map(function(val){ return node.stat.getCateDist()[val]; });
	var cateColor = selectedCate.map(function(val){ return divergentColorList()[categories.indexOf(val)] });

	this.drawStripLines(id, curLineFunc, cateVol, cateColor);

};

ContourVis.prototype.drawStripLines = function(id, lineFunc, cateVol, cateColor){

	var svg = this.map_svg;
	var strokeWidth = 5;
	var unitLength = 5;
	var defaultColor = "#aaa";

	try{

		if(cateVol.length <= 0)
			throw "no cates selected";

		var nonZeroArr = cateVol.filter(function(val){ return val > 0 ? true : false; });

		if(nonZeroArr.length <= 0)
			throw "no non-zero data for the selected cates;";

		var min = nonZeroArr.min();
		//normalize the array based on the non-zero min value;
		cateVol = cateVol.map(function(val){ return Math.round(val / min); });
		//multiply by unit length;
		cateVol = cateVol.map(function(val){ return val*unitLength; });

		var sum = cateVol.reduce(function(a, b){return a+b;});

		var offset = 0;
		cateVol.forEach(function(cate, idx){

			if(cate < 0.1)
				return;

			var dashArray = cate + ", " + (sum-cate);
			var dashOffset = offset;
			offset += cate;

			svg.append("path")
				.attr("class", "stripline_" + id + "_" + idx)
				.attr("d", lineFunc)
		    	.attr("stroke", cateColor[idx])
		    	.attr("stroke-width", strokeWidth)
		    	.style("stroke-dasharray", dashArray)
		    	//the offset is the reverse direction of the common thinking.
		    	.style("stroke-dashoffset", dashOffset*(-1))
		    	.attr("fill", "none");
		});

	}catch(err){

		console.error(err);

		//just draw regular line, do not add strip
		svg.append("path")
				.attr("class", "stripline_" + id + "_0")
				.attr("d", lineFunc)
		    	.attr("stroke", defaultColor)
		    	.attr("stroke-width", strokeWidth)
		    	.attr("fill", "none");

	}


};

// the difference between filterHullForMinOlp(O) and filterHullForVis(V) is:
// O require that part of the poly should be inside the viewport
// V require that the poly should overlap with the viewport rectangle
// O's requirement is stronger
//return value [0]: is valid or not; [1]: hull coords: [2]:whether force extended;
ContourVis.filterHullForMinOlp = function(hull){

	//no points;
	if(hull.length <= 0)
		return [false, hull, false];

	//one or two points not draw for now;
	if(hull.length < 6)
		return [false, hull, true];
		// return [false, ContourVis.extendHull(hull), true];

	//too small not draw for now;
	var aabb = PolyK.GetAABB(hull);
	if(aabb.width < 6 || aabb.height < 6 )
		return [false, hull, true];
		// return [false, ContourVis.extendHull(hull), true];

	//area too small not draw for now;
	var area = PolyK.GetArea(hull);
	if( Math.abs(area) <= 100 )
		return [false, hull, true];
		// return [false, ContourVis.extendHull(hull), true];

	//check vertices in the viewport
	for(var i=0; i<hull.length/2; i++){

		var x = hull[2*i];
		var y = hull[2*i+1];
		if( (x > 0 && x < ContourVis.DIMENSION) && (y > 0 && y < ContourVis.DIMENSION) ){

			if(hull.length < 8)
				console.log(hull.length);
			return [true, hull, false];
		}
	}

	return [false, hull, false];
};

// enlarge the area of hull if it is too small;
ContourVis.extendHull = function(hull){

	var xs = [], ys = [];
	for(var i=0; i<hull.length/2; i++){
		xs.push(hull[2*i]);
		ys.push(hull[2*i+1]);
	}
	xs = arrAvg(xs);
	ys = arrAvg(ys);

	var r = 3;

	return [ xs+r, ys+r, xs+r, ys-r, xs-r, ys-r, xs-r, ys+r ];

};

ContourVis.filterHullForVis = function(hull, flagForMinOlp){

	//not valid hull
	if(hull.length < 6)
		return false;

	//too small
	var aabb = PolyK.GetAABB(hull);
	if(aabb.width < 5 || aabb.height < 5 )
		return false;

	//area two small
	var area = PolyK.GetArea(hull);
	if( Math.abs(area) <= 100 )
		return false;

	//check overlapping [dirty codes, need improvement later;]
	var s = ContourVis.DIMENSION;
	var viewports = [0,0,0,s,s,0,s,s];

	for(var i=0; i<viewports.length/2; i++){

		var x = viewports[2*i];
		var y = viewports[2*i+1];
		
		if(PolyK.ContainsPoint(hull,x,y))
			return true;
	}

	for(var i=0; i<hull.length/2; i++){

		var x = hull[2*i];
		var y = hull[2*i+1];
		if( (x > 0 && x < ContourVis.DIMENSION) && (y > 0 && y < ContourVis.DIMENSION) )
			return true && flagForMinOlp;
	}

	return false;
};

//if not valid, return [];
ContourVis.getPixelCoords = function(ids){

	// get hull using js function. input: poly.
	// if(poly.length < 3)
	// 	return [];

	// // 1->concave; Infinity->convex.
	// var poly = hull(poly, 100);
	// return ContourVis.smoothPoly(poly);


	// get hull from json file;
	var tweets = DataCenter.instance().getTweets();
	var pts = [];
	ids.forEach(function(id){
		var pt = Canvas_manager.instance().geo_p_to_pixel_p({x:tweets[id].lon, y:tweets[id].lat});	
		pts.push(pt.x);
		pts.push(pt.y)
	});

	if(pts.length > 2)
		pts = pts.slice(0, pts.length-2);
	
	return pts;
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
ContourVis.INTERMODE = { BASIS:0, CARDINAL:1 };
ContourVis.MODE = ContourVis.INTERMODE.CARDINAL;
ContourVis.DIMENSION = 1024;

ContourVis.CONTOURMODE = { BOUND:0, FILLSINGLE:1, FILLSEQUENTIAL:2, STATSCORE:3 };
ContourVis.CONTOUR = ContourVis.CONTOURMODE.FILLSEQUENTIAL;


/******************  parameter setup  **********************/
ContourVis.prototype.createDummyLine = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

	// lineFunction = d3.svg.line()
	// 					.x(function(d) { return d[0]; })
	// 		            .y(function(d) { return d[1]; })
	// 		            .interpolate("linear-closed");

	var lineFunction = null;
	
	if(ContourVis.MODE == ContourVis.INTERMODE.BASIS){
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("basis-closed");
	} else {
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("cardinal-closed")
                        .tension(ContourVis.tension);
	}

	return lineFunction;

};

ContourVis.prototype.createDummyPath = function(pts){

	pts = HullLayout.odArrTo2dArr(pts);

	var that = this;
	var svg = this.map_svg;

	var lineFunction = this.createDummyLine(pts);

    var hull = svg.append("path")
			    	.attr("class", "dummyPath")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", "#FFF")
			    	.attr("opacity", 0);
	return hull;

};
