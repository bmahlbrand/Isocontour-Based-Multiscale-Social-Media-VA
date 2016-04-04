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

CTreeNode.prototype._getClustersByLevels = function(level, rst){

	//deal with the current node
	while(rst.length <= level)
		rst.push([]);

	rst[level].push(this.cluster);

	this.children.forEach(function(val){
		val._getClustersByLevels(level+1, rst);
	});

};

CTreeNode.prototype.getType = function(){
	return this.type;
};

CTreeNode.prototype.setType = function(type){
	this.type = type;
};

CTreeNode.prototype.getVis = function(){
	return this.vis;
};

CTreeNode.nodeType = { NON_LEAF: 1, LEAF:2};

VisComponent = function(){
	this.bbox = null;
};

VisComponent.prototype.setBbox = function(cx, cy, ex, ey){
	this.bbox = new BBox(cx, cy, ex, ey);
};