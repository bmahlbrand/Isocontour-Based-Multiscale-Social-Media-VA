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

HullLayout.checkIntesect = function(parent, child){

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

HullLayout.pointEdgeDisThres = 3;
HullLayout.shrinkIteration = 15;

HullLayout.lineCenter = function(x1, y1, x2, y2){
	return [ (x1+x2)*0.5, (y1+y2)*0.5 ];
};


HullLayout._shrinkPartialPoly = function(parent, child){

	var iteration = 0;
	do{
		var isChange = false;
		iteration += 1;

		var len = child.length/2;
		for(var i=0; i<len; i++){
			
			var x = child[2*i];
			var y = child[2*i+1];

			var rst = PolyK.ClosestEdge(parent, x, y);

			if(rst.dist < HullLayout.pointEdgeDisThres){

				var left = (i-1+len)%len;
				var right = (i+1+len)%len;

				var center1 = HullLayout.lineCenter(x, y, child[2*left], child[2*left+1]);
				var center2 = HullLayout.lineCenter(x, y, child[2*right], child[2*right+1]);

				var center = HullLayout.lineCenter(center1[0], center1[1], center2[0], center2[1]);

				child[2*i] = center[0];
				child[2*i+1] = center[1];

				isChange = true;
			}
		}

	}while( isChange == true && iteration < HullLayout.shrinkIteration );

	// console.log("iteration time: "+iteration);
	return child;

};

//parents 2d array,  child 1d array;
HullLayout.minimizeParentChildOverlap = function(parents, child){

	//since one cluster can have multiple polys(rare case), here comes the parents
	//find the parent that contains the child
	var parent = [];
	parents.forEach(function(p){
		if( HullLayout.checkIntesect(p, child) )
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
	child = HullLayout._shrinkPartialPoly(parent, child);

	return child;
};

HullLayout.minimizeOverlap = function(clusterMatrix){

	//polys: 2D matrix;
	//As is ensured in the server side, hulls in the same level do not have overlapping issues;

	clusterMatrix.forEach(function(clusters, level){


		// create array to store parent polys, note that level i does not have parents.
		var parentsPolys = [];
		if(level != 0){
			// i-1 means parent level;
			clusterMatrix[level-1].forEach(function(cluster){
				var hulls = cluster['hulls'];
				parentsPolys = parentsPolys.concat(hulls);
			});
		}
		
		//perform minimization here;
		clusters.forEach(function(cluster){

			// console.log(cluster['clusterId']);

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

	return clusterMatrix;
}