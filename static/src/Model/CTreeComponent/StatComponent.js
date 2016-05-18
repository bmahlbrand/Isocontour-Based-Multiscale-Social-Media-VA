StatComponent = function(tweets){
	this.tweets = tweets;
	this.cateDist = this.calCateDist(this.tweets);
};

StatComponent.prototype.calCateDist = function(){

	var cateDup = [];
	this.tweets.forEach(function(id){
		cateDup = cateDup.concat(Object.keys(DataCenter.instance().tweets[id].cate));
	});
	
	//get distribution
	var dist = _.countBy(cateDup);

	//add entry for the cates that are 0
	DataCenter.instance().categories.forEach(function(cate){

		if(cate in dist)
			return;
		dist[cate] = 0;
	});

	return dist;
}

StatComponent.prototype.getCateDist = function(){
	return this.cateDist;
}