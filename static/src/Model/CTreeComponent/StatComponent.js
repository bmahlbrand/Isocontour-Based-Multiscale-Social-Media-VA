StatComponent = function(tweets){
	this.tweets = tweets;
};

//normalized distribution;
StatComponent.prototype.calCateDist = function(cate){

	var cateDup = [];
	this.tweets.forEach(function(id){
		cate = intersect_arrays( DataCenter.instance().focusCates, Object.keys(DataCenter.instance().tweets[id].cate) );
		cateDup = cateDup.concat(cate);
	});
	
	//get distribution
	var dist = _.countBy(cateDup);

	//add entry for the cates that are 0
	DataCenter.instance().focusCates.forEach(function(cate){

		if(cate in dist)
			return;
		dist[cate] = 0;
	});

	var values =  _.values(dist);
	var sum = values.reduce(function(a, b) { return a + b; }, 0);
	if(sum <= 0)
		return dist;

	for(var c in dist)
		dist[c] = dist[c] / sum;

	return dist;
};

//calculate the distance between two vectors (atually two dist that has the same set of keys -- focusedCates);
//the distance should be in the range of [0,1]
StatComponent.vecDist = function(id1, id2){

	var dist1 = DataCenter.instance().getTree().getNodeById(id1).stat.calCateDist(DataCenter.instance().focusCates);
	var dist2 = DataCenter.instance().getTree().getNodeById(id2).stat.calCateDist(DataCenter.instance().focusCates);

	var sum = 0;
	for(var c in dist1)
		sum += Math.pow(dist1[c]-dist2[c], 2);
	return Math.sqrt(sum);

};