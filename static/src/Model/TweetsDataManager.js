TweetsDataManager = function(){	

	this.tweetsDB = new TAFFY();
	this.geo_clusters = null;
}

TweetsDataManager.prototype.insert = function(tweet){

	var lat = parseFloat(tweet.geolocation.split(',')[0]);
	var lng = parseFloat(tweet.geolocation.split(',')[1]);

	this.tweetsDB.insert({
		"tweet_id":tweet.tweet_id,
		"user_id":tweet.user_id,
		"created_at":tweet.created_at,
		"lng":lng,
		"lat":lat,
		"text":tweet.text,
		"screen_name": tweet.screen_name
	});
};

TweetsDataManager.prototype.clear = function(){
	return this.tweetsDB().remove();
};

TweetsDataManager.prototype.count = function(){
	return this.tweetsDB().count();
};

TweetsDataManager.prototype.get_db = function(){
	return this.tweetsDB();
};

TweetsDataManager.prototype.filter_by_geo_bound = function(bottom, top, left, right){

	var result = this.tweetsDB();

	result = result.filter({lat:{lte:top}}, {lat:{gte:bottom}}).filter({lng:{lte:right}}, {lng:{gte:left}});

	return result;
};

TweetsDataManager.prototype.filter_by_brush_extent = function(min, max) {
	
};

TweetsDataManager.prototype.set_geo_clusters = function(clusters){
	this.geo_clusters = clusters;
};

TweetsDataManager.prototype.get_geo_clusters = function(){
	return this.geo_clusters;
};

TweetsDataManager.prototype.get_geo_cluster_dist = function(){

	if( this.geo_clusters == null || this.geo_clusters.max_size <= 0)
		return {max_x:2, max_y:1, data:[], valid:false};

	var dist = [];

	var max_size = this.geo_clusters.max_size;
	var max_count = 0;

	//ignore index 0: cluster of size 0 makes no sense;
	for(var i=0; i<=max_size; i++)
		dist.push({x:i,y:0});

	for(var i=0; i<this.geo_clusters.data.length; i++){
		dist[this.geo_clusters.data[i].size].y++;
		max_count = dist[this.geo_clusters.data[i].size].y > max_count ? dist[this.geo_clusters.data[i].size].y : max_count;
	}

	return {max_x:max_size, max_y:max_count, data:dist.slice(1), valid:true};

};

TweetsDataManager.the_instance = null;

TweetsDataManager.instance = function(){

	if(TweetsDataManager.the_instance == null)
		TweetsDataManager.the_instance = new TweetsDataManager();

	return TweetsDataManager.the_instance;
};