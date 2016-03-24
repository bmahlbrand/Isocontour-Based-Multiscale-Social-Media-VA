ClusterTree = function(){

	this.clusters = {};
	this.tweets = {};

	this.loadTweets();
	this.loadClusterTree();

};

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
			tweets[entry.tweet_id] = t;

		});

		that.tweets = tweets;
	});
};

ClusterTree.prototype.loadClusterTree = function(){

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
	return this.clusters;
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


ClusterTree.the_instace = null;

ClusterTree.instance = function(){

	if(ClusterTree.the_instace == null)
		ClusterTree.the_instace = new ClusterTree();
	return ClusterTree.the_instace;

};