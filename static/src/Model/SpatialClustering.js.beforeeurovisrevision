SpatialClustering = function(p_rst, ids, g_rst, convertToCurrMap){
	
	var dbscan = new DBSCAN();
	var cluster = dbscan.run(p_rst, 15, 3);
	
	var rst = [];
	var sizes = [];

	cluster.forEach(function(ele){

		var _ids = [];
		var geos = [];
		var pixels = [];

		var pixels_for_poly = [];

		//average of pixel coordinates;
		var p_avg = [0,0];

		ele.forEach(function(e){

			_ids.push(ids[e]);

			geos.push([g_rst[e][0], g_rst[e][1]]);

			var pts;
			if(convertToCurrMap){
				pts = Canvas_manager.instance().geo_p_to_pixel_p( {x:g_rst[e][0], y:g_rst[e][1]} );
				pts = [ pts.x, pts.y ];
			}
			else
				pts = [ p_rst[e][0], p_rst[e][1] ];

			pixels.push(pts);

			pixels_for_poly.push([ p_rst[e][0], p_rst[e][1] ]);

			p_avg = [ p_avg[0] + pts[0], p_avg[1] + pts[1] ];

		});

		p_avg = [ p_avg[0] / ele.length, p_avg[1] / ele.length ];

		var geo_bbox = SpatialClustering.getBBox(geos);
		var pixel_bbox = SpatialClustering.getBBox(pixels);

		var poly = SpatialClustering.getPoly(pixels_for_poly);

		//when detecting the poly, we still want to do it based on the original map(next scale).
		//then we get the pixel position of the point in the current map scale(current scale);
		if(convertToCurrMap)
			poly = SpatialClustering.convertPolyBetweenScale(poly, 1);
		else{
			poly = poly;
		}

		poly = SpatialClustering.smoothPoly(poly);

		if(poly.length > 2){
			
			rst.push({
				geo_bbox: geo_bbox,
				pixel_bbox: pixel_bbox,
				ids: _ids,
				geo_pts: geos,
				pix_pts: pixels,
				size: ele.length,
				poly: poly,
				center: [ p_avg[0], p_avg[1] ],
				child: convertToCurrMap?true:false
			});
		}
		else{

			if(!convertToCurrMap){

			//here we deal with clusters that have cover tiny region, usually a set of points of the same location.
			//since we cannot generate poly for this case. We manually draw a circle of fixed size to represent the region.
			//Note that for this case, we do not deal with multi-scale, since even at different scale, they still have no valid poly.
				rst.push({
					geo_bbox: geo_bbox,
					pixel_bbox: pixel_bbox,
					ids: _ids,
					geo_pts: geos,
					pix_pts: pixels,
					size: ele.length,
					poly: SpatialClustering.forceGeneratePoly([p_avg[0], p_avg[1]]),
					center: [ p_avg[0], p_avg[1] ],
					child: convertToCurrMap?true:false
				});
			}
		}

	});
	return rst;

};

SpatialClustering.forceGeneratePoly = function(center){

	var delta = 10;
	var bbox = new BBox();
	bbox.setSep(center[0], center[1], delta, delta);
	return bbox.get_points();
};

SpatialClustering.smoothPoly = function(poly){

	if(poly.length <= 0)
		return [];

	//relax poly --> if two adjacent points are near each other, remove them;
	var len = poly.length;
	var i = 1;
	var thres = 8;

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


SpatialClustering.getPoly = function(pixels){

	if(pixels.length < 3)
		return [];

	return hull(pixels, 80);

};

//originalZoom is the next level scale;
SpatialClustering.convertPolyBetweenScale = function(poly, originalZoom){

	var geo_pts = [];
	poly.forEach(function(ele){
		geo_pts.push(Canvas_manager.instance().pixel_p_to_geo_p({ x:ele[0],y:ele[1] }, originalZoom));
	});

	var rst = [];
	geo_pts.forEach(function(ele){
		var pt = Canvas_manager.instance().geo_p_to_pixel_p(ele);
		rst.push([pt.x, pt.y]);
	});

	return rst;

}


SpatialClustering.printPoly = function(poly){

	var tmp = [];
	poly.forEach(function(ele){
		tmp.push("[" + ele[0] + "," + ele[1] + "]");
	});
	return "[" + tmp.join(",") + "]";

};

SpatialClustering.getBBox = function(tdArr){

	var xs = tdArr.map(function(ele){
		return ele[0];
	});
	
	var ys = tdArr.map(function(ele){
		return ele[1];
	});

	var min_x = Math.min.apply(null, xs);
	var max_x = Math.max.apply(null, xs);

	var min_y = Math.min.apply(null, ys);
	var max_y = Math.max.apply(null, ys);

	var bbox = new BBox();
	bbox.setSep( (max_x+min_x)*0.5, (max_y+min_y)*0.5, (max_x-min_x)*0.5, (max_y-min_y)*0.5 );

	return bbox;

};