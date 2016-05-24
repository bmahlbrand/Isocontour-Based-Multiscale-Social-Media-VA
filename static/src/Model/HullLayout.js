HullLayout = function(){};

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
	return $('[ng-controller="map_controller"]').scope().createDummyPath(points)[0][0];
};

HullLayout.getSampledPath = function(points) {
	return this.samplePath(this.getPath(points));
};

// HullLayout.getLine = function(points) {
// 	return $('[ng-controller="map_controller"]').scope().createDummyLine(points);
// };

//not used for now;
// HullLayout.sampledPath = function(path) { //actually this should be the line of the path
// 	return path.interpolate(path.length, path.length * 2);
// };

HullLayout.samplePath = function(pathNode) {
	//loop through and compute sampled points based on total length of path and double points
	var pathLength = pathNode.getTotalLength();
	
	if (pathLength == 0)
		return [];

	var sampledPts = [];
	//set the termination condition to be "pathLength - HullLayout.samplePathThreshold / 2" 
	//in order to make sure that the starting and ending points are not too close;
	for (var scanLength = 0; scanLength <= pathLength - HullLayout.samplePathThreshold / 2; scanLength += HullLayout.samplePathThreshold) {
		var pt = this.pointAlongPath(pathNode, scanLength);
		sampledPts.push(pt.x);
		sampledPts.push(pt.y);
	}

	return sampledPts;
};

HullLayout.pointAlongPath = function(path, t) {
	
	var l = path.getTotalLength();
	return path.getPointAtLength(t);

};

// HullLayout._moveOutsidePts = function(parent, child){

// 	for(var i=0; i<child.length/2; i++){
		
// 		var x = child[2*i];
// 		var y = child[2*i+1];

// 		if( !PolyK.ContainsPoint(parent, x, y) ){

// 			var rst = PolyK.ClosestEdge(parent, x, y);
// 			var closedP = rst.point;
			
// 			//norm closeP to xy;
// 			var norm = rst.norm;
// 			var reverseNorm = {x:-norm.x, y:-norm.y};

// 			if( Math.abs(reverseNorm.x*reverseNorm.x + reverseNorm.y*reverseNorm.y - 1 ) > 0.1 )
// 				console.log('fatal error from HullLayout -- not normalized');

// 			//add a small offset to enforce the points INSIDE the parent hull, not ON the hull
// 			var delta = 5;

// 			//assign the closest point to the child array;
// 			x = closedP.x + delta*reverseNorm.x;
// 			y = closedP.y + delta*reverseNorm.y;
// 		}

// 		child[2*i] = x;
// 		child[2*i+1] = y;
// 	}

// 	return {p:parent, c:child};

// };

HullLayout._moveOutsidePtsBiDir = function(parent, child){

	for(var i=0; i<child.length/2; i++){
		
		var x = child[2*i];
		var y = child[2*i+1];

		if( !PolyK.ContainsPoint(parent, x, y) ){

			var rst = PolyK.ClosestEdge(parent, x, y);
			var closedP = rst.point;
			
			//norm closeP to xy;
			var norm = rst.norm;
			var reverseNorm = {x:-norm.x, y:-norm.y};

			if( Math.abs(reverseNorm.x*reverseNorm.x + reverseNorm.y*reverseNorm.y - 1 ) > 0.1 )
				console.log('fatal error from HullLayout -- not normalized');

			//add a small offset to enforce the points INSIDE the parent hull, not ON the hull
			var delta = 5;

			//assign the closest point to the child array;
			x = closedP.x + delta*reverseNorm.x;
			y = closedP.y + delta*reverseNorm.y;
		}

		child[2*i] = x;
		child[2*i+1] = y;
	}

	return {p:parent, c:child};

};

HullLayout.lineCenter = function(x1, y1, x2, y2){
	return [ (x1+x2)*0.5, (y1+y2)*0.5 ];
};

// HullLayout._shrinkPartialCurvedPoly = function(parent, child){

// 	var iteration = 0;
// 	var keepGoing;

// 	do {
// 		iteration += 1;
// 		farEnough = true;

// 		var len = child.length/2;

// 		for (var i=0; i<len; i++) {
			
// 			var x = child[2*i];
// 			var y = child[2*i+1];
// 			var path = HullLayout.getPath(child);

// 			var rst = PolyK.ClosestEdge(parent, x, y); //sample points on arc evenly, then minimize each
			
// 			if (rst.dist < HullLayout.pointEdgeDisThres) {

// 				var left = (i-1+len)%len;
// 				var right = (i+1+len)%len;
				
// 				//var p = HullLayout.closestPointOnPath(path, [x,y]);
// 				var p = [x,y];

// 				var center1 = HullLayout.lineCenter(p[0], p[1], child[2*left], child[2*left+1]);
// 				var center2 = HullLayout.lineCenter(p[0], p[1], child[2*right], child[2*right+1]);

// 				var center = HullLayout.lineCenter(center1[0], center1[1], center2[0], center2[1]);

// 				child[2*i] = center[0];
// 				child[2*i+1] = center[1];

// 				farEnough = false;
// 			}
// 		}

// 	} while ( farEnough == false && iteration < HullLayout.shrinkIteration );

// 	console.log("iteration time: "+iteration);
// 	return {p:parent, c:child};

// };

HullLayout._forceDirectedMove = function(parent, child){

	var iteration = 0;
	var keepGoing;

	do {
		iteration += 1;
		farEnough = true;

		/*********************calculate the points on child hulls that needs to be moved*************************/
		var childCand = [];

		for (var i=0; i<child.length/2; i++) {
			
			var x = child[2*i];
			var y = child[2*i+1];

			var rst = PolyK.ClosestEdge(parent, x, y);
			
			if (rst.dist < HullLayout.pointEdgeDisThres) {
				childCand.push([i, rst.norm]);

				farEnough = false;
			}
		}
		
		/*********************calculate the points on parent hulls that needs to be moved*************************/
		var parentCand = [];

		for (var i=0; i<parent.length/2; i++) {
			
			var x = parent[2*i];
			var y = parent[2*i+1];

			var rst = PolyK.ClosestEdge(child, x, y);
			
			if (rst.dist < HullLayout.pointEdgeDisThres) {
				parentCand.push([i, rst.norm]);

				farEnough = false;
			}
		}

		var delta = HullLayout.pointEdgeDisThres * 0.15;
		/***************************************update child points*****************************************/

		childCand.forEach(function(val){
			var i = val[0];
			var x = child[2*i] + delta*val[1].x;
			var y = child[2*i+1] + delta*val[1].y;

			if(PolyK.ContainsPoint(parent, x, y)){
				child[2*i] = x;
				child[2*i+1] = y;
			}else{
				child[2*i] = child[2*i] - delta*val[1].x;
				child[2*i+1] = child[2*i+1] - delta*val[1].y;
			}
		});

		/***************************************update parent points*****************************************/

		// adding the procedure of changing parent points will make it inconsistant to maintain the inclusion of parent-child relationship; 
		// parentCand.forEach(function(val){
		// 	var i = val[0];
		// 	var x = parent[2*i] + delta*val[1].x;
		// 	var y = parent[2*i+1] + delta*val[1].y;

		// 	if(PolyK.ContainsPoint(child, x, y)){
		// 		parent[2*i] = parent[2*i] - delta*val[1].x;
		// 		parent[2*i+1] = parent[2*i+1] - delta*val[1].y;
		// 	}
		// 	else{
		// 		parent[2*i] = parent[2*i] + delta*val[1].x;
		// 		parent[2*i+1] = parent[2*i+1] + delta*val[1].y;
		// 	}

		// });

	} while ( farEnough == false && iteration < HullLayout.shrinkIteration );

	console.log("iteration time: "+iteration);
	return {p:parent, c:child};

};

//check that after the optimization, the child is inclusive in the parent scope.
HullLayout._validateOpt = function(parent, child){
	
	for(var i=0; i<child.length/2; i++){
		
		var x = child[2*i];
		var y = child[2*i+1];

		if( !PolyK.ContainsPoint(parent, x, y) ){
			return {p:parent, c:[]};
		}
	}

	return {p:parent, c:child};

}

HullLayout.minimizeOverlap = function(parent, child){

	var parentChild = {p:parent, c:child};
	if(parent.length <= 0 || child.length <= 0)
		return parentChild;

	parentChild = HullLayout._moveOutsidePtsBiDir(parentChild.p, parentChild.c);
	//child = HullLayout._shrinkPartialPoly(parent, child);
	parentChild = HullLayout._forceDirectedMove(parentChild.p, parentChild.c);
	parentChild = HullLayout._validateOpt(parentChild.p, parentChild.c);

	return parentChild;

};




HullLayout.samplePathThreshold = 30; //pixel distance
HullLayout.pointEdgeDisThres = 10; //pixel distance?
HullLayout.shrinkIteration = 5;


// HullLayout.closestPointOnPath = function(pathNode, point) {
// 	var pathLength = pathNode.getTotalLength(),
// 	  precision = 8,
// 	  best,
// 	  bestLength,
// 	  bestDistance = Infinity;

// 	// linear scan for coarse approximation
// 	for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
// 		if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
// 			best = scan, bestLength = scanLength, bestDistance = scanDistance;
// 		}
// 	}
	
// 	// binary search for precise estimate
// 	precision /= 2;
// 	while (precision > 0.5) {
// 		var before,
// 		    after,
// 		    beforeLength,
// 		    afterLength,
// 		    beforeDistance,
// 		    afterDistance;
// 		if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
// 	  		best = before, bestLength = beforeLength, bestDistance = beforeDistance;
// 		} else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
// 	  		best = after, bestLength = afterLength, bestDistance = afterDistance;
// 		} else {
// 	  		precision /= 2;
// 		}
// 	}

// 	best = [best.x, best.y];
// 	best.distance = Math.sqrt(bestDistance);
// 	return best;
	
// 	function distance2(p) {
// 		var dx = p.x - point[0],
// 	    	dy = p.y - point[1];
// 		return dx * dx + dy * dy;
// 	}
// };

// HullLayout._shrinkPartialPoly = function(parent, child){

// 	var iteration = 0;
// 	var keepGoing = true;

// 	do {

// 		iteration += 1;

// 		var len = child.length/2;
// 		for (var i=0; i<len; i++) {
			
// 			var x = child[2*i];
// 			var y = child[2*i+1];

// 			var rst = PolyK.ClosestEdge(parent, x, y);

// 			if(rst.dist < HullLayout.pointEdgeDisThres) {

// 				var left = (i-1+len)%len;
// 				var right = (i+1+len)%len;

// 				var center1 = HullLayout.lineCenter(x, y, child[2*left], child[2*left+1]);
// 				var center2 = HullLayout.lineCenter(x, y, child[2*right], child[2*right+1]);

// 				var center = HullLayout.lineCenter(center1[0], center1[1], center2[0], center2[1]);

// 				child[2*i] = center[0];
// 				child[2*i+1] = center[1];

// 			} else { //terminate looping through polygon
// 				keepGoing = false;
// 			}
// 		}

// 	} while( keepGoing == true && iteration < HullLayout.shrinkIteration );

// 	// console.log("iteration time: "+iteration);
// 	return child;

// };

// //parents 2d array,  child 1d array;
// HullLayout.minimizeParentChildOverlap = function(parents, child){

// 	//since one cluster can have multiple polys(rare case), here comes the parents
// 	//find the parent that contains the child
// 	var parent = [];
// 	parents.forEach(function(p){
// 		if( HullLayout.checkIntersect(p, child) )
// 			parent.push(p);
// 	});

// 	if(parent.length == 0){
// 		console.log("find parent error" + parent.length);
// 		return [];
// 	}

// 	parent = parent[0];
// 	//parent are already located.
// 	//console.log(parent);
// 	child = HullLayout._moveOutsidePts(parent, child);
// 	// child = HullLayout._shrinkPartialCurvedPoly(parent, child);
// 	child = HullLayout._shrinkPartialPoly(parent, child);

// 	return child;
// };