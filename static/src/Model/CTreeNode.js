CTreeNode = function(cluster){
	this.cluster = cluster;
	this.children = [];
	//store all the children in the allChildren list;
	//this design avoids copying the whole tree for filter option.
	this.allChildren = [];
	this.vis = new VisComponent();
	this.stat = new StatComponent(cluster['ids'], this);

};

CTreeNode.prototype.addChild = function(clusterArr){

	var that = this;
	var childIdx = this.cluster['children'];

	if(childIdx.length > 0){

		childIdx.forEach(function(val){
			var c = new CTreeNode(clusterArr[val]);
			c.addChild(clusterArr);
			that.children.push(c);
			//duplicate children array in the allChildren array;
			that.allChildren.push(c);
		});
	}
};

/*****************************************************************************/
/*************************** tree primitive operation*************************/
/*****************************************************************************/

CTreeNode.prototype.getHeight = function(){
	
	if(this.children.length <= 0)
		return 1;

	var rst = [];
	this.children.forEach(function(val){
		rst.push(val.getHeight());
	});

	return 1 + Math.max.apply(null, rst);
};

CTreeNode.prototype.getNumOfLeaves = function(){

	if(this.children.length <= 0)
		return 1;

	var rst = 0;
	this.children.forEach(function(val){
		rst += val.getNumOfLeaves();
	});
	return rst;
};

CTreeNode.prototype.sortChildren = function(){

	var sortFunction = null;

	if( CTreeNode.SORT == CTreeNode.SORTMODE.VOLUME ){

		sortFunction = function(a,b){
							if( a.cluster.ids.length < b.cluster.ids.length )
								return 1;
							if( a.cluster.ids.length > b.cluster.ids.length )
								return -1;
							return +0;

						};
	}
	else if( CTreeNode.SORT == CTreeNode.SORTMODE.GEO ){
		
		sortFunction = function(a,b){
							if( a.cluster.center.lon > b.cluster.center.lon )
								return 1;
							if( a.cluster.center.lon < b.cluster.center.lon )
								return -1;
							return +0;
						};
	}
	else if( CTreeNode.SORT == CTreeNode.SORTMODE.STAT ){
		
		sortFunction = function(a,b){
							if( a.cluster.score < b.cluster.score )
								return 1;
							if( a.cluster.score > b.cluster.score )
								return -1;
							return +0;
						};
	}

	this.children.sort(sortFunction);

	this.children.forEach(function(val){
		val.sortChildren();
	});

};

CTreeNode.prototype.getNodeById = function(id){

	if(this.cluster.clusterId == id)
		return this;

	var n = null;
	this.children.forEach(function(val){
		n = n || val.getNodeById(id);
	});
	return n;

};

CTreeNode.prototype.toList = function(){

	var rst = [this];

	this.children.forEach(function(val){
		rst = rst.concat(val.toList());
	});

	return rst;
};

CTreeNode.prototype.getVol = function(){
	return this.cluster.ids.length;
};

//screen space area, can be 0 
CTreeNode.prototype.getArea = function(){
	return PolyK.GetArea(this.cluster['hulls']);
};


//only have volume for now, atually only filter out based on min value;
CTreeNode.prototype.filterTree = function(min, max){
	
	this.children = [];

	var that = this;
	this.allChildren.forEach(function(val){
		if(val.getVol() >= min)
		// if(val.stat.getVolByCate(DataCenter.instance().focusCates) >= min)
			that.children.push(val);
	});

	this.children.forEach(function(val){
		val.filterTree(min, max);
	});

};

/*****************************************************************************/
/*************************** Semantic/topic operation*************************/
/*****************************************************************************/
CTreeNode.prototype.getKeywords = function(cates, topK){
	return this.stat.getKeywords(cates, topK);
};

/*****************************************************************************************/
/************************   Contour  Vis  Component    ***********************************/
/*****************************************************************************************/
CTreeNode.prototype.resetFlags = function(){

	this.cluster['minOlpFlag'] = false;
	this.cluster['visFlag'] = false;

	this.children.forEach(function(val){
		val.resetFlags();
	});

};

CTreeNode.prototype.getPixelCoords = function(doNotConvert){

	this.cluster['hulls'] = ContourVis.getPixelCoords(this.cluster['hullIds'], doNotConvert);
	
	this.children.forEach(function(val){
		val.getPixelCoords(doNotConvert);
	});

};


CTreeNode.prototype.samplePoints = function(){

	var p = this;

	p.cluster['hulls'] = HullLayout.getSampledPath(p.cluster['hulls']);

	this.children.forEach(function(val){
		val.samplePoints();
	});

};


//if flag is defined, propogate the flag to the subtree;
//the idea behind this propogation is that if a node is forcely extend, then we just set the children to be false;
CTreeNode.prototype.filterNodesForMinOlp = function(flag){

	if(flag === undefined){

		//
		var hullOrCenter = null;
		if(this.cluster['hulls'].length > 0)
			hullOrCenter = this.cluster['hulls'];
		else{
			var pt = Canvas_manager.instance().geo_p_to_pixel_p({x:this.cluster['center'].lon, y:this.cluster['center'].lat});	
			hullOrCenter = [pt.x, pt.y];
		}

		var rst = ContourVis.hullInViewport(hullOrCenter);

		this.cluster['minOlpFlag'] = rst[0];

		// valid hull
		if(rst[0] == true){
			this.cluster['hulls'] = rst[1];

			//forcely extend the hull, set children to be false;
			if(rst[2] == true){
				this.children.forEach(function(val){
					val.filterNodesForMinOlp(false);
				});
			}
			else{
				this.children.forEach(function(val){
					val.filterNodesForMinOlp();
				});
			}
		}
		//not valid hull, but still check for the subtree [previously missed this step]
		else{
			this.children.forEach(function(val){
				val.filterNodesForMinOlp();
			});
		}


	}
	else{
		this.cluster['minOlpFlag'] = flag;

		this.children.forEach(function(val){
			val.filterNodesForMinOlp(flag);
		});
	}

};

CTreeNode.prototype.minOlp = function(){

	//only if both the parent and children are having 'minOlpFlag' field turned on, we perform the overlapping minimization;

	var p = this;

	this.children.forEach(function(val){
		val.minOlp();
	});


	if( false && p.cluster['clusterId'] == '7_1')
		console.log();

	if( p.cluster['minOlpFlag'] == true ){

		var childHulls = [];
		this.children.forEach(function(val){
			if( val.cluster['minOlpFlag'] == true ){

				// var rst = HullLayout.minimizeOverlap(p.cluster['hulls'], val.cluster['hulls']);
				
				// p.cluster['hulls'] = rst.p;
				// val.cluster['hulls'] = rst.c;
				childHulls.push(val.cluster['hulls']);
			}
		});

		//var childHulls = this.children.map(function(val){ return val.cluster['hulls']; });
		p.cluster['hulls'] = HullLayout.minimizeOverlap(p.cluster['hulls'], childHulls);

	}

};


// CTreeNode.prototype.minOlp_bk = function(){

// 	//only if both the parent and children are having 'minOlpFlag' field turned on, we perform the overlapping minimization;

// 	var p = this;

// 	if( p.cluster['minOlpFlag'] == true ){

// 		this.children.forEach(function(val){
// 			if( val.cluster['minOlpFlag'] == true ){

// 				var rst = HullLayout.minimizeOverlap(p.cluster['hulls'], val.cluster['hulls']);
				
// 				p.cluster['hulls'] = rst.p;
// 				val.cluster['hulls'] = rst.c;
// 			}
// 		});
// 	}

// 	this.children.forEach(function(val){
// 		val.minOlp();
// 	});

// };

CTreeNode.prototype.filterNodesForVis = function(){

	this.cluster['visFlag'] = ContourVis.hullOverlapViewport(this.cluster['hulls'], this.cluster['minOlpFlag']);

	this.children.forEach(function(val){
		val.filterNodesForVis();
	});

};

//only draw acnodes;
CTreeNode.prototype.drawContour = function(acNodes){

	if( acNodes.indexOf(this.cluster['clusterId']) == -1 )
		return;

	// create features for the current hulls
	var hull = this.cluster['hulls'];
	var currLineFunc = $('[ng-controller="map_controller"]').scope().getCV().createLineFunc(hull);

	var id = this.cluster['clusterId'];
	var zoom = this.cluster['zoom'];

	//create features for children hulls
	var childsLineFuncArr = [];

	this.children.forEach(function(val){
		if( acNodes.indexOf(val.cluster['clusterId']) != -1 ){
			var hull = val.cluster['hulls'];
			var lf = $('[ng-controller="map_controller"]').scope().getCV().createLineFunc(hull);
			childsLineFuncArr.push(lf);
		}
	});

	//check if the current contour is leaf;
	var isChild = childsLineFuncArr.length > 0 ? false : true;
	var drawBoundaryFlag = this.cluster['minOlpFlag'];

	$('[ng-controller="map_controller"]').scope().getCV().drawHull(id, zoom, currLineFunc, hull, childsLineFuncArr, isChild, drawBoundaryFlag);

	this.children.forEach(function(val){
		val.drawContour(acNodes);
	});

};

/*****************************************************************************************/
/************************ scale tree  Vis Component   ***********************************/
/*****************************************************************************************/

CTreeNode.prototype.getVis = function(){
	return this.vis;
};

CTreeNode.prototype.setBbox = function(bbox){

	this.vis.setBbox(bbox.center.x, bbox.center.y, bbox.extents.x, bbox.extents.y);

	if(this.children.length <= 0)
		return;
	else{
		//set the bbox for children;
		var sum = 0;

		var max = 0;
		this.children.forEach(function(val){
			max = Math.max(val.getVol(), max);
		});

		this.children.forEach(function(val){
			sum += VisComponent.scale()(val.getVol(), val, max);
		});

		var left = bbox.getLeft();
		var width = bbox.getWidth();
		var height = bbox.getHeight();

		this.children.forEach(function(val){

			var w = width * VisComponent.scale()(val.getVol(), val, max) / sum;
			
			var b = new BBox(left+w/2, bbox.getCenter().y + height, w/2, height/2 );

			val.setBbox(b);
			left += w;
		});
	}
}

CTreeNode.prototype.drawNodes = function(){

	$('[ng-controller="treeCanvasCtrl"]').scope().getCanvas().drawTreeNode(this.cluster.clusterId, this.vis.getVisBbox(), this.vis.getBbox());

	this.children.forEach(function(val){
		val.drawNodes();
	});

};

// CTreeNode.prototype.drawBackground = function(ids){

// 	if( ids.indexOf(this.cluster.clusterId) != -1 )
// 		$('[ng-controller="ScaleTreeCtrl"]').scope().getScaleTreeCanvas().drawBgRect(this.vis.getBbox());

// 	this.children.forEach(function(val){
// 		val.drawBackground(ids);
// 	});

// };


CTreeNode.prototype.drawLinkage = function(){

	if(this.children.length <= 0)
		return;

	var pid = this.cluster.clusterId;

	var bbox = this.vis.getVisBbox();

	this.children.forEach(function(val){

		var _bbox = val.getVis().getVisBbox();
		var space = _bbox.getTop() - bbox.getBottom();
		//end points
		var p1 = [bbox.getCenter().x, bbox.getCenter().y];
		var p2 = [_bbox.getCenter().x, _bbox.getCenter().y];

		var midY = (bbox.getCenter().y + _bbox.getCenter().y)*0.5;
		//bezier control points
		var p125 = [bbox.getCenter().x, midY ];
		var p175 = [_bbox.getCenter().x, midY ];

		var cid = val.cluster.clusterId;
		$('[ng-controller="treeCanvasCtrl"]').scope().getCanvas().drawBCurve(pid, cid, [p1, p125, p175, p2]);
		
		val.drawLinkage();

	});

};

/*****************************************************************************************/
/******************************* FD tree Vis Component ***********************************/
/*****************************************************************************************/
CTreeNode.prototype._getNodeEdge = function(){

	if(this.children.length <= 0)
		return [ [{"id":this.cluster['clusterId'], "vol":this.getVol()}], []];

	var nodes = [ {"id":this.cluster['clusterId'], "vol":this.getVol()} ];
	var edges = [];

	var that = this;
	this.children.forEach(function(val){

		var nodeEdge = val._getNodeEdge();
		
		nodes = nodes.concat(nodeEdge[0]);
		edges = edges.concat(nodeEdge[1]);

		edges.push({"source": that.cluster['clusterId'], "target": val.cluster['clusterId']});
	});

	return [nodes, edges];

};

CTreeNode.prototype.getNodeEdge = function(){

	var nodeEdge = this._getNodeEdge();
	var nodes = nodeEdge[0];
	var edges = nodeEdge[1];

	var _edges = []
	edges.forEach(function(val){

		var n1 = $.grep(nodes, function(e){ return e.id == val.source; });
		var n2 = $.grep(nodes, function(e){ return e.id == val.target; });
		n1 = n1[0];
		n2 = n2[0];

		_edges.push( {"source":n1, "target":n2} );


		if(!n1.hasOwnProperty('children'))
			n1.children = [];
		if(!n2.hasOwnProperty('children'))
			n2.children = [];

		n1.children.push(n2);
	});

	return [nodes, _edges];
}

CTreeNode.SORTMODE = { VOLUME:0, GEO:1, STAT:2 };
CTreeNode.SORT = CTreeNode.SORTMODE.GEO;









/****************************************************************************************************/
/******************************************for user study 1******************************************/
/****************************************************************************************************/


function isPointInPoly(poly, pt){
	for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
		((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
		&& (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
		&& (c = !c);
	return c;
}

function includePoly(parent, child){

	var p = HullLayout.odArrTo2dArr(parent);
	var c = HullLayout.odArrTo2dArr(child);

	for(var i=0;i<c.length;i++){
		if(!isPointInPoly(p, c[i]))
			return false;
	}
	return true;

}

function mergeInterval(intervals) {
  if (!intervals.length) return intervals;
  intervals.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])
  var prev = intervals[0];
  var res = [prev];
  for (var curr of intervals) {
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      res.push(curr);
      prev = curr;
    }
  }
  return res;
}

function reverseBound(bigBound, bounds){

	if(bounds.length == 0)
		return [bigBound];


	var rst = [];
	
	for(var i=0; i<bounds.length; i++){

		if(i==0)
			rst.push([bounds[i][0], bigBound[0]]);
		else
			rst.push([bounds[i][0], bounds[i-1][0]]);
	}

	rst.push([bigBound[1], bounds[bounds.length-1][1]]);

	return rst;
}


//gaussian from -1 to 1;
//conver to 0 to 1

//degree from 0,1
function rnd2(degree) {

	degree = Math.ceil(degree*10) || 1;

	var sum = 0;
	for(var i=0;i<degree;i++){
		sum += Math.random();
	}

	// -1 to 1
	var rst = (sum - degree / 2) / (degree / 2);

	//0 to 1
	return (rst + 1) / 2;

}


CTreeNode.getRandomPointsInPolygon = function(poly, siblings, centralizeDegree){

	var newPoly = HullLayout.odArrTo2dArr(poly);
	var newSibsAABB = siblings.map(function(val){ return PolyK.GetAABB(val); });

	if(newPoly.length == 0)
		return [500,500];

	//to-do:
	var aabb = PolyK.GetAABB(poly);

	var flag;
	var x,y;
	do{

		centralizeDegree = 0.2;
		// x = aabb.x + aabb.width * Math.random();
		x = aabb.x + aabb.width * rnd2(centralizeDegree);

		// var cands = newSibsAABB.filter(function(val){ return x > val.x && x < val.x + val.width; })
		// 						.map(function(val){ return [val.y, val.y+val.height]; });

		// cands = mergeInterval(cands);

		// var reversed = reverseBound([aabb.y, aabb.y+aabb.height], cands);
		// var reversedSum = reversed.map(function(val){ return val[1]-val[0]; }).reduce(function(a,b){ return a[1]-a[0]+b[1]-b[0]; });

		// //dy = reversedSum * rnd2(centralizeDegree);
		// dy = reversedSum * Math.random();

		// var t;
		// for(t=0;t<reversed.length;t++){
		// 	if(dy > reversed[t][1] - reversed[t][0])
		// 		dy -= reversed[t][1] - reversed[t][0];
		// 	else{
		// 		y = dy + reversed[t][0];
		// 		break;
		// 	}
		// }
		// if(t >= reversed.length)
		// 	console.err("fatal erro in [getRandomPointsInPolygon]");
		y = aabb.y + aabb.height * rnd2(centralizeDegree);

		flag = isPointInPoly(newPoly, [x,y]);

		console.log("get point in poly");

	}while(!flag);

	return [x,y];

};

CTreeNode.boundRange =function(numOfLevels){

	if(numOfLevels == 3)
		return [1000, 300, 80];
	if(numOfLevels == 4)
		return [1200, 500, 200, 80];
	if(numOfLevels == 5)
		return [1200, 500, 200, 60, 20];
};

CTreeNode.boundBasedOnChildNum = function(num){

	var q = d3.scale.linear()
					.domain([1, UserStudyController2.vol])
					.range([50, 1200]);

	return q(num);
}



function getNumOfChildren(array){

	if(array.length == 0)
		return 0;

	var sum = array.length;
	array.forEach(function(val){
		sum += getNumOfChildren(val);
	});

	return sum;

}

function getDepth(array){

	if(array.length == 0)
		return 1;

	var sum = -1;
	array.forEach(function(val){
		sum = Math.max(sum, getDepth(val));
	});

	return sum + 1;

}


CTreeNode.prototype.genRandomBoundary = function(parentBound, totalDepth, currentDepth, childArr, zoom, siblings){

	console.log("processing: "+this.cluster.clusterId);

	var that = this;
	//size:

	var levels = [];
	for(var ii=1;ii<=totalDepth;ii++)
		levels.push(ii);

	var boundSizeScale = d3.scale.ordinal()
							.domain(levels)
							.range(CTreeNode.boundRange(totalDepth));

	// var boundSize = boundSizeScale(currentDepth);
	var boundSize = CTreeNode.boundBasedOnChildNum(getNumOfChildren(childArr)+1);

	if(parentBound.length != 0)
		boundSize = boundSize + (Math.random()-Math.random())*boundSize*0.2;

	var collision = true;

	// var exclusive = [18,31,37,34,39,35]

	// us_polys = us_polys.filter(function(val,i){ return exclusive.indexOf(i) == -1; });

	var polyIndex = Math.floor(Math.random()*us_polys.length);
	var poly = us_polys[polyIndex];
	//sample points;
	var newPoly = [];
	poly.forEach(function(val, i){

		if(i % 2 != 0)
			return;
		else{
			t = i / 2;
			if(t % 3 == 0){
				newPoly.push(poly[i]);
				newPoly.push(poly[i+1]);
			}
		}
	});

	poly = newPoly;

	//normalize poly;
	var aabb = PolyK.GetAABB(poly);

	//centralizeDegree controls the possibility of locating around the center of the cluster, [result in large area]
	var centralizeDegree = 0.8;
	var randomCenter = CTreeNode.getRandomPointsInPolygon(parentBound, siblings, childArr.length);

	var actualSize = boundSize;
	var cnt = 0;
	do{
		actualSize *= 0.9;
		var scale = actualSize / Math.max(aabb.width, aabb.height);

		var normalizedPoly = poly.map(function(val,i){
			if(i%2==0){
				//x axis:
				return (val-(aabb.x+aabb.width*0.5))*scale + randomCenter[0];
			}else{
				//y axis:
				return (val-(aabb.y+aabb.height*0.5))*scale + randomCenter[1];
			}
		});

		//relation with its parent;
		var inclusive;

		if(parentBound == null || parentBound.length == [])
			inclusive = [];
		else
			inclusive = includePoly(parentBound, normalizedPoly);

		//relation with its siblings;
		// var interset = false;
		// for(var t=0; t<siblings.length; t++){

		// 	var tmp =  intersectPolyWrapper(HullLayout.odArrTo2dArr(normalizedPoly), HullLayout.odArrTo2dArr(siblings[t]));
			
		// 	if(tmp == null || tmp == undefined || tmp.length > 0){

		// 		interset = true;
		// 		break;
		// 	}

		// }

		if( true || cnt > 20 || inclusive /*&& !interset*/ ){
			that.cluster['hulls'] = normalizedPoly;
			collision = false;
		}

		cnt++;
		console.log("has collision");

	}while(collision);

	var nextZoom = zoom + 1;

	that.children = [];
	for(var i=0;i<childArr.length; i++){

		var sibs = that.children.map(function(val){ return val.cluster['hulls']; });

		DataCenter.levelCount[nextZoom] = DataCenter.levelCount[nextZoom]+1 || 0;
		var node = new CTreeNode({clusterId:nextZoom+"_"+DataCenter.levelCount[nextZoom], ids:[], zoom:nextZoom, polyIndex:polyIndex});

		node.genRandomBoundary(that.cluster['hulls'], totalDepth, currentDepth+1, childArr[i], nextZoom, sibs);
		that.children.push(node);
	}

}