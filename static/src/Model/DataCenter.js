DataCenter = function(){

	//cluster dictionary, key: cluster id
	this.clusters = {};

	// tweet dictionary, key: tweet id
	this.tweets = {};

	this.loadTweets();
	this.loadClusters();

	//hard coded for now
	this.rootID = "10_0";

	//init tree
	this.root = this.initTree();

	this.root.sortChildren();

	
};

/*************************************************************************************/
/***************************** cluster list operation ********************************/
/*************************************************************************************/

DataCenter.prototype.getClusters = function(){

	//this will later add filtering options
	//TO-DO
	return this.clusters;
};

/*************************************************************************************/

/*************************************************************************************/
/***************************** cluster tree operation ********************************/
/*************************************************************************************/
DataCenter.prototype.getTree = function(){
	return this.root;
};

DataCenter.prototype.initTree = function(){

	var rt = new CTreeNode(this.clusters[this.rootID]);
	rt.addChild(this.clusters);
	return rt;
};

/*************************************************************************************/

/*************************************************************************************/
/********************************* tweet operation ***********************************/
/*************************************************************************************/

DataCenter.prototype.getTweets = function(){
	return this.tweets;
};

DataCenter.prototype.getTweetsByIds = function(ids){
	
	var that = this;
	var rst = [];

	ids.forEach(function(id){
		if(that.tweets[id] !== null )
			rst.push(that.tweets[id]);
	});

	return rst;
};

//distribution of categories;
DataCenter.prototype.distOfCate = function(tweets){
	
	var cateArr = tweets.map(function(val){ return Object.keys(val.cate); });
	cateArr = cateArr.reduce(function(prev, next){ return prev.concat(next); });
	return _.countBy(cateArr);

};


/******************************************************************************************/

/*************************************************************************************/
/********************************* Ajax call operation *******************************/
/*************************************************************************************/

DataCenter.prototype.loadTweets = function(){

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

DataCenter.prototype.loadClusters = function(){

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

			//calculate central position of the cluster;
			var lats = [], lons = [];
			cluster['ids'].forEach(function(val){
				lats.push(that.tweets[val].lat);
				lons.push(that.tweets[val].lon);
			});
			cluster['center'] = { lat:arrAvg(lats), lon:arrAvg(lons) };

		});
	});

};

/*************************************************************************************/
DataCenter.the_instace = null;

DataCenter.instance = function(){

	if(DataCenter.the_instace == null)
		DataCenter.the_instace = new DataCenter();
	return DataCenter.the_instace;

};

//init DataCenter
DataCenter.instance();
//the reason why this function is not put in the constructor is
//the function body calls the DataCenter.instance(), which can cause function call loop;
DataCenter.instance().root.calcStatScore();