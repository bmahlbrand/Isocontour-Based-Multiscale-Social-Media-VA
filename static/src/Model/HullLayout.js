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
		return child;
	}
	parent = parent[0];
	//parent are already located.
	//console.log(parent);


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

HullLayout.minimizeOverlap = function(clusterMatrix){

	//polys: 2D matrix;
	//As is ensured in the server side, hulls in the same level do not have overlapping issues;

	clusterMatrix.forEach(function(clusters, i){

		//not parent for level i, no need to minimize overlap
		if(i == 0)
			return;

		var parentsPolys = [];
		// i-1 means parent level;
		clusterMatrix[i-1].forEach(function(cluster){
			var hulls = cluster['hulls'];
			parentsPolys = parentsPolys.concat(hulls);
		});
		
		//perform minimization here;
		clusters.forEach(function(cluster){

			var hulls = cluster['hulls'];

			hulls.forEach(function(hull, i){
				var rst = HullLayout.minimizeParentChildOverlap(parentsPolys, hull);
				hulls[i] = rst;

			});

		});

	});

	return clusterMatrix;
}