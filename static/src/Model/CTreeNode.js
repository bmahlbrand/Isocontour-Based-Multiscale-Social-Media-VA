CTreeNode = function(cluster){
	this.cluster = cluster;
	this.children = [];
	//store all the children in the allChildren list;
	//this design avoids copying the whole tree for filter option.
	this.allChildren = [];
	this.vis = new VisComponent();
	this.stat = new StatComponent(cluster['ids']);
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

//only have volume for now, atually only filter out based on min value;
CTreeNode.prototype.filterTree = function(min, max){
	
	this.children = [];

	var that = this;
	this.allChildren.forEach(function(val){
		if(val.getVol() >= min)
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
	var keywords = this.cluster['keywordsFreq'];
	var sorted = Object.keys(keywords)
						.filter(function(val){
							var tCates = Object.keys(DataCenter.instance().keywordCate[val]);
							var inter = intersect_arrays(cates, tCates);
							return inter.length>0?true:false;
						})
						.sort(function(a,b){return keywords[b]-keywords[a]; });
	return sorted.length >= topK ? sorted.slice(0, topK) : sorted;
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

CTreeNode.prototype.getPixelCoords = function(){

	this.cluster['hulls'] = ContourVis.getPixelCoords(this.cluster['hullIds']);
	
	this.children.forEach(function(val){
		val.getPixelCoords();
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

		var rst = ContourVis.hullInViewport(this.cluster['hulls']);

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

	if( p.cluster['minOlpFlag'] == true ){

		this.children.forEach(function(val){
			if( val.cluster['minOlpFlag'] == true ){

				var rst = HullLayout.minimizeOverlap(p.cluster['hulls'], val.cluster['hulls']);
				
				p.cluster['hulls'] = rst.p;
				val.cluster['hulls'] = rst.c;
			}
		});
	}

	this.children.forEach(function(val){
		val.minOlp();
	});

};

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

	var isChild = childsLineFuncArr.length > 0 ? false : true;

	$('[ng-controller="map_controller"]').scope().getCV().drawHull(id, zoom, currLineFunc, childsLineFuncArr, isChild);

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