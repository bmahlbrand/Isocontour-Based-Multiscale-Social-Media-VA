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

CTreeNode.prototype.getTreeByLevels = function(){

	if(this.children.length <= 0)
		return [this];

	var rst = [];
	this.children.forEach(function(val){

		var _rst = val.getTreeByLevels();

		_rst.forEach(function(_val, i){
			if(rst.length <= i)
				rst.push([]);

			rst[i] = rst[i].concat(_val);
		});
	});

	rst.unshift([this]);
	return rst;

};

CTreeNode.prototype.sortChildren = function(){

	if( CTreeNode.SORT == CTreeNode.SORTMODE.VOLUME ){

		this.children.sort(function(a,b){
			if(a.cluster.ids.length < b.cluster.ids.length)
				return 1;
			if(a.cluster.ids.length > b.cluster.ids.length)
				return -1;
			return +0;

		});

		this.children.forEach(function(val){
			val.sortChildren();
		});
	}

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

	this.vis.setBbox(bbox.center.x, bbox.center.y, bbox.extents.x, bbox.extents.y);

	if(this.children.length <= 0)
		return;
	else{
		//set the bbox for children;
		var sum = 0;
		this.children.forEach(function(val){
			sum += VisComponent.scale()(val.getVol());
		});

		var left = bbox.getLeft();
		var width = bbox.getWidth();
		var height = bbox.getHeight();

		this.children.forEach(function(val){

			var w = width * VisComponent.scale()(val.getVol()) / sum;
			var b = new BBox(left+w/2, bbox.get_center().y + space + height, w/2, height/2 );
			val.setBbox(b, space);
			left += w;
		});
	}
}

CTreeNode.prototype.drawBbox = function(){

	$('[ng-controller="ScaleTreeCtrl"]').scope().getScaleTreeCanvas().drawRect(this.cluster.clusterId, this.vis.getBbox());

	this.children.forEach(function(val){
		val.drawBbox();
	});

};

CTreeNode.prototype.drawLinkage = function(){

	if(this.children.length <= 0)
		return;

	var bbox = this.vis.getBbox();

	this.children.forEach(function(val){

		var _bbox = val.getVis().getBbox();
		var space = _bbox.getTop() - bbox.getBottom();
		//end points
		var p1 = [bbox.get_center().x, bbox.getBottom()];
		var p2 = [_bbox.get_center().x, _bbox.getTop()];
		//bezier control points
		var p125 = [bbox.get_center().x, bbox.getBottom()+space*0.5 ];
		var p175 = [_bbox.get_center().x, _bbox.getTop()-space*0.5 ];

		$('[ng-controller="ScaleTreeCtrl"]').scope().getScaleTreeCanvas().drawBCurve([p1, p125, p175, p2]);
		
		val.drawLinkage();

	});

};



VisComponent = function(){
	this.bbox = null;
};

VisComponent.prototype.setBbox = function(cx, cy, ex, ey){
	this.bbox = new BBox(cx, cy, ex, ey);
};

VisComponent.prototype.getBbox = function(){
	return this.bbox;
};

// x between [1, infinity]
VisComponent.logScale = function(x){
	return Math.log(x+1);
};

VisComponent.linearScale = function(x){
	return x;
};

VisComponent.scale = function(){

	if(VisComponent.SCALE == VisComponent.SCALEMODE.LOG)
		return VisComponent.logScale;
	else if(VisComponent.SCALE == VisComponent.SCALEMODE.LINEAR)
		return VisComponent.linearScale;
};

VisComponent.SCALEMODE = {LOG:0, LINEAR:1};
VisComponent.SCALE = VisComponent.SCALEMODE.LINEAR;

CTreeNode.SORTMODE = { VOLUME:0 }
CTreeNode.SORT = CTreeNode.SORTMODE.VOLUME;