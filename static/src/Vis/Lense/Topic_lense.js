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

	var currRelativeLevel = $('[ng-controller="map_controller"]').scope().getMap().map.getZoom() 
							- ( case_study[default_case].zoom + case_study[default_case].startLevel ) ;

	//only see adjacent 3 levels
	var visLevelRange = [ currRelativeLevel-2, currRelativeLevel+1 ];
	
	// get the clusters of all levels;
	var clusterMatrix = ClusterTree.instance().getClustersByLevels();
	//filter based on vis levels
	clusterMatrix = clusterMatrix.filter(function(clusters, i){ return i >= visLevelRange[0] && i <= visLevelRange[1]; });

	for(var level=0; level<clusterMatrix.length; level++){

		var clusters = clusterMatrix[level];

		//calculate the smoothed concave hull;
		clusters.forEach(function(cluster, i){

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
			clusters[i]['hulls'] = Topic_lense.getConcaveHull(clusters[i]['hullIds']);

			//optimized results save in clusters[i]['optimizedHulls']
			clusters[i]['optimizedHulls'] = [];

		});

	}

	//perform overlapping removal;
	if(Topic_lense.minOverlap)
		//only change clusters[i]['optimizedHulls']
		clusterMatrix = HullLayout.minimizeOverlap(clusterMatrix);

	//Draw concave hulls;
	clusterMatrix.forEach(function(clusters){

		clusters.forEach(function(cluster){

			var hulls = cluster['optimizedHulls'];

			hulls.forEach(function(hull){
				
				if( that.filterHull(hull) ){
					//temporarily, blue color, null id;
					that.drawConcaveHull(cluster['clusterId'], hull, "blue");
				}
			});
		});

	});
};

Topic_lense.prototype.filterHull = function(hull){

	//check valid hull
	if(hull.length < 6)
		return false;

	var aabb = PolyK.GetAABB(hull);

	if(aabb.width < 5 || aabb.height < 5 )
		return false;

	return true;
};

Topic_lense.prototype.drawConcaveHull = function(id, pts, color){

	pts = HullLayout.odArrTo2dArr(pts);

	var that = this;
	var svg = this.map_svg;


	var lineFunction = null;

	if(Topic_lense.MODE == Topic_lense.INTERMODE.BASIS){
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("basis-closed");
	}else{
		lineFunction = d3.svg.line()
						.x(function(d) { return d[0]; })
                        .y(function(d) { return d[1]; })
                        .interpolate("cardinal-closed")
                        .tension(Topic_lense.tension);
	}

    var hull = svg.append("path")
    				.attr("id", "hull_" + id)
			    	.attr("class", "concaveHull")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", color)
			    	.attr("stroke-width", 2)
			    	.attr("fill", "none")
			    	.attr("opacity", 1)
			    	.on("mouseover", function(){

			    		//tweets inside the hull;
			    		var cluster_id = this.id.substring(5,this.id.length);
			    		console.log(cluster_id);

			    		var ids = ClusterTree.instance().getClusters()[cluster_id]['ids'];
			    		var tweets = ClusterTree.instance().getTweetsByIds(ids);
			    		
			    		$('[ng-controller="map_controller"]').scope().render_dots(tweets, "red");

			    		//cate distribution
			    		console.log(ClusterTree.instance().distOfCate(tweets));

			    		//tweets on the boundary:
			    		var ids = [];
			    		ClusterTree.instance().getClusters()[cluster_id]['hullIds'].forEach(function(idlist){
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
				pts.push(pt.x);
				pts.push(pt.y)
			});

			rst.push(pts.slice(0, pts.length-2));
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
Topic_lense.tension = 0.7;
Topic_lense.minOverlap = true;
Topic_lense.INTERMODE = { BASIS:0, CARDINAL:1 };
Topic_lense.MODE = Topic_lense.INTERMODE.CARDINAL;
/******************  parameter setup  **********************/