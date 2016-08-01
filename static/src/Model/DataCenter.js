DataCenter = function(){

	//hard coded for now
	this.rootID = treeRootId;
	
	//filter options:
	this.volRange = [Number.MIN_VALUE, Number.MAX_VALUE];
	this.focusID = this.rootID;
	this.focusCates = [];

	//cluster dictionary, key: cluster id
	this.clusters = {};
	this.filterClusters = {};

	// tweet dictionary, key: tweet id
	this.tweets = {};
	this.categories = [];
	//this.keywordCate = {};
	this.keywordAnalyzer = new KeywordAnalyzer();

	this.root = null;
};

DataCenter.prototype.init = function(){

	//init database;
	this.loadTweets();
	this.loadClusters();

	//init tree
	this.root = this.initTree();

	this.filterTree();

	this.root.sortChildren();

}

/*************************************************************************************/
/**************************** cluster filter operation *******************************/
/*************************************************************************************/

DataCenter.prototype.setRange = function(min, max){

	this.volRange = [min, max];

	this.filterTree();
	$('[ng-controller="app_controller"]').scope().masterUpdate();

};

DataCenter.prototype.setFocusID = function(id){
	this.focusID = id;

	//just for now:
	$('[ng-controller="app_controller"]').scope().masterUpdate();
};

DataCenter.prototype.setFocusCate = function(cates){

	if(cates.length <= 0)
		this.focusCates = [];
	else
		this.focusCates = _.uniq(cates);

	//just for now:
	$('[ng-controller="app_controller"]').scope().masterUpdate();
};

//current only have volume range filter, will add other filters later
//not decided whether we need to copy the tree
DataCenter.prototype.filterTree = function(){

	this.root.filterTree(this.volRange[0], this.volRange[1]);


};

/*************************************************************************************/

/*************************************************************************************/
/***************************** cluster list operation ********************************/
/*************************************************************************************/

//not used for now;
// DataCenter.prototype.getClusters = function(){

// 	//TO-DO: only return the cluster that pass the filter
// 	return this.clusters;
// };

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

	if(tweets.length <= 0)
		return {};

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
		url: tweetDataFile,
		//url: "http://"+ip_address+"/EMcategory_cache",
		// data: $.param({ start_time: case_study[default_case].start_time,
		// 				end_time: case_study[default_case].end_time,
		// 				case_index: default_case
		// 			  }),

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
			t.created_at = entry.created_at;

			t.cate = {};
			t.lemmed_text = entry.lemmed_text.split(" ");

			t.text = entry.text;
			t.tokens = entry.tokens;

			//tfidf -> dict {word:tfidf value}
			t.tfidf = entry.tfidf;

			entry.cate.forEach(function(val){
				t.cate[val] = true;
			});

			//initialize global category array;
			that.categories = union_arrays(that.categories, entry.cate);
			that.categories.sort();
			//end
			
			tweets[entry.tweet_id] = t;

			//keyword options:
			/*****************1: cate keywords******************/
			t.keywords = Object.keys(entry.tokens);

			/****************2: keyword rule*********************/
			// t.keywords = t.lemmed_text.filter(function(val){
			// 										if(stopList.hasOwnProperty(val.toLowerCase()))
			// 											return false;
			// 										if( !isNaN(parseInt(val)) || !isNaN(parseFloat(val)))
			// 											return false;
			// 										if(val.startsWith("http"))
			// 											return false;
			// 										if(val.startsWith("@"))
			// 											return false;
			// 										//no letters
			// 										if(!/[a-zA-Z]/.test(val))
			// 											return false;
			// 										return true;
			// 									});

			/****************3 tf-idf value*********************/
			// t.keywords = Object.keys(t.tfidf)
			// 								.filter(function(val){
			// 									if(stopList.hasOwnProperty(val.toLowerCase()))
			// 										return false;
			// 									if( !isNaN(parseInt(val)) || !isNaN(parseFloat(val)))
			// 										return false;
			// 									if(val.startsWith("http"))
			// 										return false;
			// 									if(val.startsWith("@"))
			// 										return false;
			// 									//no letters
			// 									if(!/[a-zA-Z]/.test(val))
			// 										return false;
			// 									return true;
			// 								});

			t.keywords.forEach(function(word){
				that.keywordAnalyzer.addKeyword(word, Object.keys(t.cate));
			});
			//that.keywordAnalyzer.addKeyword();

		});

		that.tweets = tweets;
	});
};

DataCenter.prototype.loadClusters = function(){

	var that = this;

	$.ajax({
		method: "GET",
		dataType: "json",
		//url: "http://"+ip_address+"/getCluster",
		url: clusterTreeFile,
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

			if( cluster['hullIds'].length > 1 )
				console.log("Fatal error: multiple polygons");

			//since we disabled to simplifying polygon feature in the server side, we do not have multiple polygons for a simple cluster.
			//hence, the length of cluster['hullIds'] is guaranteed to be 1
			cluster['hullIds'] = cluster['hullIds'][0] || [];

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
DataCenter.instance().init();