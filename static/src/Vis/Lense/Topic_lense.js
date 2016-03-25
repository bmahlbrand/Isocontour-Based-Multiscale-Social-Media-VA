Topic_lense = function(lense_id, map_svg, overlay_svg, geo_bbox, start_time, end_time){

	this.lense_id = lense_id;

	this.map_svg = map_svg;
	this.overlay_svg = overlay_svg;
	ClusterTree.instance();

	this.colorScheme = null;



	this.initColorScheme();
};

Topic_lense.prototype.initColorScheme = function(){

	this.colorScheme = d3.scale
						.linear()
						.domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
								case_study[default_case].endLevel + case_study[default_case].zoom ])
						// .range(["#08519c", "#eff3ff"]);
						.range(["#0000ff","#ff0000"]);
};

Topic_lense.prototype.clear = function(){
	this.map_svg.selectAll(".concaveHull").remove();
};

Topic_lense.prototype.update = function(){

	this.clear();

	var that = this;
	//copy clusters, do not change the original value;
	var clusters = Object.keys(ClusterTree.instance().getClusters()).map(function (key) {return ClusterTree.instance().getClusters()[key]});

	var boundaries = [];
	//calculate the smoothed concave hull;
	clusters.forEach(function(cluster, i){

		/****************** filter clusters based on zoom level ***************************/
		// check zoom level
		// var zoomLevel = $('[ng-controller="map_controller"]').scope().getMap().map.getZoom();
		// if( Math.abs(zoomLevel - cluster['zoom']) > 1 )
		// 	return;
		// if(cluster['zoom'] != 10)
		// 	return;
		/****************** filter clusters based on zoom level ***************************/

		var pixelPts = [];
		var ids = cluster['ids'];

		// convert geo points to pixel points;
		// ids.forEach(function(id){

		// 	var tweets = ClusterTree.instance().getTweets();
		// 	var p = Canvas_manager.instance().geo_p_to_pixel_p({x:tweets[id].lon, y:tweets[id].lat});	
		// 	pixelPts.push([p.x, p.y]);
		// });

		//clusters[i]['pixelPts'] = pixelPts;
		clusters[i]['hulls'] = Topic_lense.getConcaveHull(clusters[i]['hullIds']);
		boundaries = boundaries.concat(clusters[i]['hulls']);

		//draw concave hulls
		// clusters[i]['hulls'].forEach(function(hull, i){
			
		// 	if( hull.length>3 ){
		// 		var c = that.colorScheme(cluster['zoom']);
		// 		that.drawConcaveHull(cluster['clusterId'], hull, c);
		// 	}
		// });		


	});

	//perform overlapping removal;
	boundaries = HullLayout.minOverlap(boundaries);

	//Draw concave hulls;
	boundaries.forEach(function(hull){
		if( hull.length>3 ){
			//temporarily, blue color, null id;
			that.drawConcaveHull(null, hull, "blue");
		}

	});
};

Topic_lense.prototype.drawConcaveHull = function(id, pts, color){


	var that = this;
	var svg = this.map_svg;

	var lineFunction = d3.svg.line()
                         .x(function(d) { return d[0]; })
                         .y(function(d) { return d[1]; })
                         .interpolate("cardinal-closed")
                         .tension(Topic_lense.tension);
                         // .interpolate("basis-closed");

    var hull = svg.append("path")
    				.attr("id", id)
			    	.attr("class", "concaveHull")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", color)
			    	.attr("stroke-width", 2)
			    	.attr("fill", "none")
			    	.attr("opacity", 1)
			    	.on("mouseover", function(){

			    		//tweets inside the hull;

			    		var ids = ClusterTree.instance().getClusters()[this.id]['ids'];
			    		var tweets = ClusterTree.instance().getTweetsByIds(ids);
			    		console.log(ids);
			    		
			    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");

			    		//tweets on the boundary:
			    		var ids = [];
			    		ClusterTree.instance().getClusters()[this.id]['hullIds'].forEach(function(idlist){
			    			ids = ids.concat(idlist);
			    		});

			    		var tweets = ClusterTree.instance().getTweetsByIds(ids);
			    		
			    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "blue");


		  			}).on("mouseout", function(){
		  				$('[ng-controller="map_controller"]').scope().clear_dots();
		  			});

};

//if not valid, return [];
Topic_lense.getConcaveHull = function(idsList){

	// get hull using js function. input: poly.
	// if(poly.length < 3)
	// 	return [];

	// // 1->concave; Infinity->convex.
	// var poly = hull(poly, 100);
	// return Topic_lense.smoothPoly(poly);


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

			var tweets = ClusterTree.instance().getTweets();
			var pts = [];
			ids.forEach(function(id){
				var pt = Canvas_manager.instance().geo_p_to_pixel_p({x:tweets[id].lon, y:tweets[id].lat});	
				pts.push([pt.x, pt.y]);
			});

			rst.push(pts.slice(0, pts.length-1));
		}

	});

	return rst;
};


Topic_lense.smoothPoly = function(poly){

	if(poly.length <= 0)
		return [];

	//relax poly --> if two adjacent points are near each other, remove them;
	var len = poly.length;
	var i = 1;
	var thres = 10;

	while(i<len){

		var p0 = poly[i-1];
		var p1 = poly[i];

		//remove points;
		if( Math.abs(p0[0]-p1[0])<=thres && Math.abs(p0[1]-p1[1])<=thres ){
			poly.splice(i,1);
			len--;
		}
		else{
			i++;
		}
	}

	//remove the last point, since it is the same as the first point;
	if(poly.length > 0)
		poly.splice(poly.length-1, 1);

	return poly;
};

/******************  parameter setup  **********************/
Topic_lense.tension = 0.8;


/******************  parameter setup  **********************/