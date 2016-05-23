//small multiples visualization
ClusterSignature = function() {
	this.signatures = {};
};

ClusterSignature.prototype.load = function() {

	for (var i = 0; i < clusters.length; i++) {
		var key = clusters[i].keys()[0];
		this.signatures[key]['area'] = this.getArea(clusters[i].hulls);
		this.signatures[key]['tweetVolume'] = clusters[i].hullIds;
	}

};

ClusterSignature.prototype.loadIndex = function(i) {
	var key = clusters[i].keys()[0];
	this.signatures[key]['area'] = this.getArea(clusters[i].hulls);
	this.signatures[key]['tweetVolume'] = clusters[i].hullIds;
}

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

	//return angular.controller('map_controller').$scope.createDummyPath(clusters[i].hulls).;

};

//grab the minimap view
ClusterSignature.prototype.getView = function(clusterPoints) {

};