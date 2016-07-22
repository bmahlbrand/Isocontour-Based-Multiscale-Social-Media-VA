//small multiples visualization
ClusterSignature = function() {
	this.signatures = {};
};

ClusterSignature.prototype.init = function() {

};

ClusterSignature.prototype.load = function() {

	for (var i = 0; i < clusters.length; i++) {
		var key = clusters[i].keys()[0];
		this.signatures[key]['area'] = this.getArea(clusters[i].hulls);
		this.signatures[key]['tweetVolume'] = clusters[i].hullIds;
	}

};

ClusterSignature.prototype.getPointsFromTweetIds = function(tweetIds) {
	var points = [];

	for (var i = 0; i < tweetIds.length; i++) {
		var key = tweetIds[i];
		var tweet = DataCenter.instance().tweets[key];

		var x = tweet.lon;
		var y = tweet.lat;

		points.push([x,y]);
	}

	return points;
};

ClusterSignature.prototype.loadIndex = function(i) {
	var key = clusters[i].keys()[0];
	this.signatures[key]['area'] = this.getArea(clusters[i].ids);
	this.signatures[key]['tweetVolume'] = clusters[i].hullIds.length;
};

//shoelace formula
ClusterSignature.prototype.getArea = function(clusterPoints) {
	
	var sum = 0.0;
	var length = clusterPoints.length;
	
	if (length < 3) {
		return sum;
	}

	clusterPoints.forEach(function(d1, i1) {
		i2 = (i1 + 1) % length;
		d2 = clusterPoints[i2];
		sum += (d2[1] * d1[0]) - (d1[1] * d2[0]);
	});

	return sum / 2;

};

//grab the minimap view
ClusterSignature.prototype.getView = function(clusterPoints) {

};


/*************************************************************************************/
ClusterSignature.the_instance = null;

ClusterSignature.instance = function(){

	if(ClusterSignature.the_instance == null)
		ClusterSignature.the_instance = new ClusterSignature();
	return ClusterSignature.the_instance;

};

//init ClusterSig
ClusterSignature.instance();
ClusterSignature.instance().init();