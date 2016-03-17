Topic_lense = function(lense_id, map_svg, overlay_svg, geo_bbox, start_time, end_time){

	this.lense_id = lense_id;

	this.map_svg = map_svg;
	this.overlay_svg = overlay_svg;
	this.clusterTree = new ClusterTree();

	this.colorScheme = d3.scale
						.linear()
						.domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
								case_study[default_case].endLevel + case_study[default_case].zoom ])
						.range(["#08519c", "#eff3ff"]);

};

Topic_lense.prototype.clear = function(){
	this.map_svg.selectAll(".concaveHull").remove();
};

Topic_lense.prototype.update = function(){

	this.clear();

	var that = this;
	//copy clusters, do not change the original value;
	var clusters = $.extend(true, [], this.clusterTree.getClusters());

	//calculate the smoothed concave hull;
	clusters.forEach(function(cluster, i){

		var pixelPts = [];
		var ids = cluster['ids'];
		ids.forEach(function(id){

			var tweets = that.clusterTree.getTweets();
			var p = Canvas_manager.instance().geo_p_to_pixel_p({x:tweets[id].lon, y:tweets[id].lat});	
			pixelPts.push([p.x, p.y]);
		});
		clusters[i]['pixelPts'] = pixelPts;
		clusters[i]['smoothHull'] = Topic_lense.getConcaveHull(pixelPts);
	});

	//render the concavehul;
	clusters.forEach(function(cluster){

		if( cluster['smoothHull'].length>3 ){
			var c = that.colorScheme(cluster['zoom']);
			that.drawConcaveHull(cluster['smoothHull'], c);
		}
	});
};

Topic_lense.prototype.drawConcaveHull = function(pts, color){

	var svg = this.map_svg;

	var lineFunction = d3.svg.line()
                         .x(function(d) { return d[0]; })
                         .y(function(d) { return d[1]; })
                         .interpolate("cardinal-closed");

    var hull = svg.append("path")
			    	.attr("class", "concaveHull")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", color)
			    	.attr("stroke-width", 2)
			    	.attr("fill", "none")
			    	.attr("opacity", 1);

};

//if not valid, return [];
Topic_lense.getConcaveHull = function(poly){

	if(poly.length < 3)
		return [];

	// 1->concave; Infinity->convex.
	var poly = hull(poly, 100);
	return Topic_lense.smoothPoly(poly);

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