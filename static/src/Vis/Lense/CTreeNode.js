CTreeNode = function(cluster){
	this.cluster = cluster;
	this.children = [];
	this.type = CTreeNode.nodeType.NON_LEAF;
	this.vis = new VisComponent();
};

CTreeNode.prototype.addChild = function(clusterArr){

	var that = this;
	var childIdx = this.cluster['children'];

	if(childIdx.length <= 0){
		this.type = CTreeNode.nodeType.LEAF;

	}else{
		this.type = CTreeNode.nodeType.NON_LEAF;

		childIdx.forEach(function(val){
			var c = new CTreeNode(clusterArr[val]);
			c.addChild(clusterArr);
			that.children.push(c);
		});
	}
};

CTreeNode.prototype.getHeight = function(){
	if(this.children.length <= 0)
		return 1;

	var rst = [];
	this.children.forEach(function(val){
		rst.push(val.getHeight());
	});

	return 1 + Math.max.apply(null, rst);
};

CTreeNode.prototype.getClustersByLevels = function(level, rst){

	//deal with the current node
	while(rst.length <= level)
		rst.push([]);

	rst[level].push(this.cluster);

	this.children.forEach(function(val){
		val.getClustersByLevels(level+1, rst);
	});

};

CTreeNode.prototype.getNodesByLevels = function(level, rst){

	//deal with the current node
	while(rst.length <= level)
		rst.push([]);

	rst[level].push(this);

	this.children.forEach(function(val){
		val.getNodesByLevels(level+1, rst);
	});

};

CTreeNode.prototype.getType = function(){
	return this.type;
};

CTreeNode.prototype.setType = function(type){
	this.type = type;
};

CTreeNode.prototype.getVol = function(){
	return this.cluster.ids.length;
};

CTreeNode.nodeType = { NON_LEAF: 1, LEAF:2};

/*****************************************************************************************/
/**********************************    Vis Component   ***********************************/
/*****************************************************************************************/

CTreeNode.prototype.getVis = function(){
	return this.vis;
};

CTreeNode.prototype.setBbox = function(bbox, space){


	console.log( this.cluster.clusterId +"\t"+ bbox.toString());
	this.vis.setBbox(bbox.center.x, bbox.center.y, bbox.extents.x, bbox.extents.y);

	if(this.children.length <= 0)
		return;
	else{
		//set the bbox for children;
		var sum = 0;
		this.children.forEach(function(val){
			sum += val.getVol();
		});

		var left = bbox.getLeft();
		var width = bbox.getWidth();
		var height = bbox.getHeight();

		this.children.forEach(function(val){
			var w = width * val.getVol() / sum;
			var b = new BBox(left+w/2, bbox.get_center().y + space + height, w/2, height/2 );
			val.setBbox(b, space);
			left += w;
		});
	}

}

VisComponent = function(){
	this.bbox = null;
};

VisComponent.prototype.setBbox = function(cx, cy, ex, ey){
	this.bbox = new BBox(cx, cy, ex, ey);
};

VisComponent.prototype.getBbox = function(){
	return this.bbox;
}