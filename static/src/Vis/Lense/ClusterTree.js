ClusterTree = function(){

	this.clusters = [];
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
		that.clusters = msg;
	});

};

ClusterTree.prototype.getClusters = function(){
	return this.clusters;
};

ClusterTree.prototype.getTweets = function(){
	return this.tweets;
};
