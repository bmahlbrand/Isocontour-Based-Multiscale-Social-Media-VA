HullLayout = function(){

};

HullLayout.tdArrTo1dArr = function(hull){

	var rst = [];
	hull.forEach(function(val){
		rst = rst.concat(val);
	});
	return rst;
};

HullLayout.odArrTo2dArr = function(poly){

	var rst = [];
	for(var i=0;i<poly.length/2;i++){
		rst.push([poly[2*i], poly[2*i+1]]);
	}
	return rst;
};

HullLayout.checkIntersect = function(parent, child){

	if(parent.length == 0 || child.length == 0)
		return false;

	for(var i=0; i<child.length/2; i++){
		
		var x = child[2*i];
		var y = child[2*i+1];

		if( PolyK.ContainsPoint(parent, x, y) )
			return true;
	}
	return false;
};

HullLayout.getPath = function(points) {
	return $('[ng-controller="map_controller"]').scope().createDummyPath(points);
};

HullLayout.sampledPath = function(path) { //actually this should be the line of the path
	return path.interpolate(path.length, path.length * 2);
};

HullLayout.pointAlongPath = function(path, t) {
	var l = path.getTotalLength();
	var pt = path.getPointAtLength(l * t);

	return pt;
}

HullLayout.closestPointOnPath = function(pathNode, point) {
	var pathLength = pathNode.getTotalLength(),
	  precision = 8,
	  best,
	  bestLength,
	  bestDistance = Infinity;
	// linear scan for coarse approximation
	for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
		if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
			best = scan, bestLength = scanLength, bestDistance = scanDistance;
		}
	}
	
	// binary search for precise estimate
	precision /= 2;
	while (precision > 0.5) {
		var before,
		    after,
		    beforeLength,
		    afterLength,
		    beforeDistance,
		    afterDistance;
		if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
	  		best = before, bestLength = beforeLength, bestDistance = beforeDistance;
		} else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
	  		best = after, bestLength = afterLength, bestDistance = afterDistance;
		} else {
	  		precision /= 2;
		}
	}

	best = [best.x, best.y];
	best.distance = Math.sqrt(bestDistance);
	return best;
	
	function distance2(p) {
		var dx = p.x - point[0],
	    	dy = p.y - point[1];
		return dx * dx + dy * dy;
	}
}


HullLayout._moveOutsidePts = function(parent, child){

	for(var i=0; i<child.length/2; i++){
		
		var x = child[2*i];
		var y = child[2*i+1];

		if( !PolyK.ContainsPoint(parent, x, y) ){

			var rst = PolyK.ClosestEdge(parent, x, y);
			var closedP = rst.point;

			//assign the closest point to the child array;
			x = closedP.x;
			y = closedP.y;
		}

		child[2*i] = x;
		child[2*i+1] = y;
	}

	return child;

};

HullLayout.pointEdgeDisThres = 3; //pixel distance?
HullLayout.shrinkIteration = 15;

HullLayout.lineCenter = function(x1, y1, x2, y2){
	return [ (x1+x2)*0.5, (y1+y2)*0.5 ];
};


HullLayout._shrinkPartialCurvedPoly = function(parent, child){

	var iteration = 0;
	var keepGoing = true;

	do {
		iteration += 1;

		var len = child.length/2;
		var path = HullLayout.sampledPath(HullLayout.getPath(child));

		for (var i=0; i<len; i++) {
			
			var x = child[2*i];
			var y = child[2*i+1];

			var rst = PolyK.ClosestEdge(parent, x, y); //sample points on arc evenly, then minimize each

			if(rst.dist < HullLayout.pointEdgeDisThres) {

				var left = (i-1+len)%len;
				var right = (i+1+len)%len;

				var center1 = HullLayout.lineCenter(x, y, child[2*left], child[2*left+1]);
				var center2 = HullLayout.lineCenter(x, y, child[2*right], child[2*right+1]);

				var center = HullLayout.lineCenter(center1[0], center1[1], center2[0], center2[1]);

				child[2*i] = center[0];
				child[2*i+1] = center[1];

			} else { //terminate looping through polygon
				keepGoing = false;
			}
		}

	} while ( keepGoing == true && iteration < HullLayout.shrinkIteration );

	// console.log("iteration time: "+iteration);
	return child;

};

HullLayout._shrinkPartialPoly = function(parent, child){

	var iteration = 0;
	var keepGoing = true;

	do {
		iteration += 1;

		var len = child.length/2;
		for (var i=0; i<len; i++) {
			
			var x = child[2*i];
			var y = child[2*i+1];

			var rst = PolyK.ClosestEdge(parent, x, y);

			if(rst.dist < HullLayout.pointEdgeDisThres) {

				var left = (i-1+len)%len;
				var right = (i+1+len)%len;

				var center1 = HullLayout.lineCenter(x, y, child[2*left], child[2*left+1]);
				var center2 = HullLayout.lineCenter(x, y, child[2*right], child[2*right+1]);

				var center = HullLayout.lineCenter(center1[0], center1[1], center2[0], center2[1]);

				child[2*i] = center[0];
				child[2*i+1] = center[1];

			} else { //terminate looping through polygon
				keepGoing = false;
			}
		}

	} while( keepGoing == true && iteration < HullLayout.shrinkIteration );

	// console.log("iteration time: "+iteration);
	return child;

};

//parents 2d array,  child 1d array;
HullLayout.minimizeParentChildOverlap = function(parents, child){

	//since one cluster can have multiple polys(rare case), here comes the parents
	//find the parent that contains the child
	var parent = [];
	parents.forEach(function(p){
		if( HullLayout.checkIntersect(p, child) )
			parent.push(p);
	});

	if(parent.length == 0){
		console.log("find parent error" + parent.length);
		return [];
	}

	parent = parent[0];
	//parent are already located.
	//console.log(parent);
	child = HullLayout._moveOutsidePts(parent, child);
	child = HullLayout._shrinkPartialCurvedPoly(parent, child);

	return child;
};

HullLayout.minimizeOverlap = function(cNodeMatrix){

	//polys: 2D matrix;
	//As is ensured in the server side, hulls in the same level do not have overlapping issues;

	cNodeMatrix.forEach(function(cnodes, level){

		// create array to store parent polys, note that level i does not have parents.
		var parentsPolys = [];
		if(level != 0){
			// i-1 means parent level;
			cNodeMatrix[level-1].forEach(function(cnode){

				var cluster = cnode.cluster;
				var hulls = cluster['hulls'];
				parentsPolys = parentsPolys.concat(hulls);
			});
		}
		
		//perform minimization here;
		cnodes.forEach(function(cnode){

			var cluster = cnode.cluster;
			var hulls = cluster['hulls'];

			hulls.forEach(function(hull){

				if(level == 0){
					cluster['optimizedHulls'].push(hull);
				}else{
					var rst = HullLayout.minimizeParentChildOverlap(parentsPolys, hull);
					cluster['optimizedHulls'].push(rst);
				}
			});

		});

	});

	return cNodeMatrix;
}