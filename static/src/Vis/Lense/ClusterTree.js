ClusterTree = function(){

	//cluster dictionary, key: cluster id;
	this.clusters = {};

	this.tweets = {};

	this.loadTweets();
	this.loadClusters();

	//cluster tree:

	//hard coded for now
	this.rootID = "10_0";

	this.root = this.initClusterTree();
	
};

/*************************************************************************************/
/******************************* cluster operation ***********************************/
/*************************************************************************************/

ClusterTree.prototype.loadClusters = function(){

	var that = this;

	$.ajax({
		method: "GET",
		dataType: "json",
		url: "http://"+ip_address+"/getCluster",
		headers : { 'Content-Type': 'application/json' },
		async: false
	})
	.done(function( msg ) {
		msg.forEach(function(cluster){
			that.clusters[cluster['clusterId']] = cluster;
		});
	});

};

ClusterTree.prototype.getClusters = function(){

	//this will later add filtering options
	//TO-DO
	return this.clusters;
};

/*************************************************************************************/

/*************************************************************************************/
/***************************** cluster tree operation ********************************/
/*************************************************************************************/
ClusterTree.prototype.getClusterTree = function(){
	return this.root;
};

ClusterTree.prototype.getClustersByLevels = function(){
	var rst = [];
	this.root._getClustersByLevels(0, rst);
	return rst;
};

ClusterTree.prototype.initClusterTree = function(){

	var rt = new CTreeNode(this.clusters[this.rootID]);
	rt.addChild(this.clusters);
	return rt;
};

CTreeNode = function(cluster){
	this.cluster = cluster;
	this.children = [];
	this.type = CTreeNode.nodeType.NON_LEAF;
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

CTreeNode.nodeType = { NON_LEAF: 1, LEAF:2};

/*************************************************************************************/

/*************************************************************************************/
/********************************* tweet operation ***********************************/
/*************************************************************************************/

ClusterTree.prototype.loadTweets = function(){

	var that = this;

	$.ajax({
		method: "GET",
		dataType: "json",
		url: "http://"+ip_address+"/EMcategory_cache",
		data: $.param({ start_time: case_study[default_case].start_time,
						end_time: case_study[default_case].end_time,
						case_index: default_case
					  }),

		headers : { 'Content-Type': 'application/json' },
		async: false
	})
	.done(function(msg){

		var tweets = {};

		msg.tweets.forEach(function(entry){

			var t = {};
			t.tweet_id = entry.tweet_id;
			t.lat = parseFloat(entry.geolocation.lat);
			t.lon = parseFloat(entry.geolocation.lon);
			
			t.cate = {};
			entry.cate.forEach(function(val){
				t.cate[val] = true;
			});
			
			tweets[entry.tweet_id] = t;

		});

		that.tweets = tweets;
	});
};

ClusterTree.prototype.getTweets = function(){
	return this.tweets;
};

ClusterTree.prototype.getTweetsByIds = function(ids){
	
	var that = this;
	var rst = [];

	ids.forEach(function(id){
		if(that.tweets[id] !== null )
			rst.push(that.tweets[id]);
	});

	return rst;
};

ClusterTree.prototype.distOfCate = function(tweets){
	
	var cateArr = tweets.map(function(val){ return Object.keys(val.cate); });
	cateArr = cateArr.reduce(function(prev, next){ return prev.concat(next); });
	return _.countBy(cateArr);

};


/***********************************************************************************/

ClusterTree.the_instace = null;

ClusterTree.instance = function(){

	if(ClusterTree.the_instace == null)
		ClusterTree.the_instace = new ClusterTree();
	return ClusterTree.the_instace;

};