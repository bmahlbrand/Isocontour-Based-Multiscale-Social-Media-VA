Topic_lense_manager = function(map_svg, overlay_svg){

	this.lense_db = [];

	this.map_svg =map_svg;
	this.overlay_svg = overlay_svg;

};

Topic_lense_manager.prototype.add_lense = function(geo_bbox, start_time, end_time){

	var topic_lense = new Topic_lense(this.lense_db.length, this.map_svg, this.overlay_svg, geo_bbox, start_time, end_time);
	this.lense_db.push(topic_lense);

};

Topic_lense_manager.prototype.set_sts = function(flag, id){

	if(flag == Topic_lense.status.ACTIVE){

		this.lense_db.forEach(function(entry){
			entry.set_sts(Topic_lense.status.SLEEP);
		});

		this.lense_db[id].set_sts(Topic_lense.status.ACTIVE);
	}

	if(flag == Topic_lense.status.NORMAL){

		this.lense_db.forEach(function(entry){
			entry.set_sts(Topic_lense.status.NORMAL);
		});
	}

	this.update(false);

};

Topic_lense_manager.prototype.add_topic = function(topic, id){

	if(id >= this.lense_db.length || id < 0 || topic == null || topic.length <= 0)
		return;

	this.lense_db[id].add_topic(topic);
	this.update(false);

};

Topic_lense_manager.prototype.update = function(flag){

	this.lense_db.forEach( function(entry){
		entry.update(flag);
	});

};

Topic_lense_manager.prototype.size = function(){
	return this.lense_db.length;

};

Topic_lense_manager.prototype.get_geo_points = function(){

	if( this.lense_db.length <= 0 )
		return [];

	var rst = [];

	for(var i =0;i<this.lense_db.length;i++){

		var geo_arr = this.lense_db[i].topic_lense_data.retrieve_data_current();
		rst = rst.concat(geo_arr.select("tweet_id", "lat", "lng"));
	}
	return rst;

};

Topic_lense_manager.prototype.get_pixel_points = function(zoomLevel){

	var rst = this.get_geo_points();

	var p_rst = [];
	var ids = [];
	var g_rst = [];

	for(var i=0; i<rst.length; i++){
		var p = rst[i];
		g_rst.push([p[2], p[1]]);
		var pp = Canvas_manager.instance().geo_p_to_pixel_p({x:p[2], y:p[1]}, zoomLevel);
		ids.push(p[0]);
		p_rst.push([pp.x, pp.y]);
	}

	return [p_rst, ids, g_rst];

};