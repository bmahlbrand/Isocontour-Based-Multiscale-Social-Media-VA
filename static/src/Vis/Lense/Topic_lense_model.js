Topic_lense_model = function(model_id, geo_bbox, topic_lense, start_time, end_time){

	this.model_id = model_id;

	//geo_bbox changes when user zoom or pan the map;
	this.geo_bbox = geo_bbox;

	this.topic_lense = topic_lense;
	this.tweetsDB = new TAFFY();
	
	//holds all topic information that are loaded in the client;
	this.global_topics = this.init_global_topics();

	//only holds topics that are visualized in the map view.
	this.cached_topics = [];

	//holds key of topics that should be in cached_topics;
	//by default;
	this.cached_topic_keys = EMTerms.instance().get_default_cates();

	this.start_time_string = start_time;
	this.end_time_string = end_time;

	this.min_time_constant = new Date(Date.parse(start_time));
	this.max_time_constant = new Date(Date.parse(end_time));

	this.min_time_current = this.min_time_constant;
	this.max_time_current = this.max_time_constant;

	//threshold to show in the perimeter;
	this.term_freq_threshold = 0;

	//time-series bin unit (minute);
	//long
	//this.bin_unit = 60*4;

	this.minute_span = ( this.max_time_constant - this.min_time_constant ) / (1000*60);
	this.bin_unit = Math.ceil( this.minute_span / 150 );
	this.bin_length = ( this.max_time_constant.getTime() - this.min_time_constant.getTime() ) / (1000*60*this.bin_unit)

	this.time_series_array = this.get_time_series_array();

	this.data_cache = null;

};

Topic_lense_model.prototype.get_color_mapping = function() {

  // var color = d3.scale.ordinal()
  //     .range(["#001c9c","#9c8305","#fc8d59","#101b4d","#475003","#d3c47c"]);
// var color = d3.scale.ordinal()
//      .range(["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69"]);
  // var color = d3.scale.ordinal()
  //     .range(["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc"]);
	var color = d3.scale.ordinal()
      .range(["#e41a1c","#4daf4a","#984ea3","#ff7f00","#ffff33", "#377eb8"]);

    var color = d3.scale.ordinal()
    	.range(["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc"]);

	var color = d3.scale.ordinal()
    	.range(["#fb8072", "#8dd3c7", "#fdb462", "#80b1d3", "#bebada", "ffffb3"]);

    // var color = d3.scale.ordinal()
    //   .range(["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f"]);
    
    color.domain(this.cached_topic_keys);

    return color;
};

Topic_lense_model.prototype.get_current_key = function() {
	return this.cached_topic_keys;
};

/***************************************/
/**** global/cached topics operation****/
/***************************************/
Topic_lense_model.prototype.init_global_topics = function(){
	
	var rst = {};

	var term2name = EMTerms.instance().get_term2name();
	for(var key in term2name){
		rst[key] = {cate:key, name:term2name[key]};
	}
	return rst;

};

Topic_lense_model.prototype.get_geo_bbox = function(){
	return this.geo_bbox;
};
Topic_lense_model.prototype.set_geo_bbox = function(geo_bbox){
	this.geo_bbox = geo_bbox;
};

Topic_lense_model.prototype.get_topics = function(){
	return this.cached_topics;
};

Topic_lense_model.prototype.get_topic_length = function(){
	return this.cached_topics.length;
};

Topic_lense_model.prototype.get_global_topics = function(){
	return this.global_topics;
};

Topic_lense_model.prototype.global_to_cached = function(cached_topic_keys){

	this.cached_topic_keys = cached_topic_keys;

	var that = this;
	var cached_topics = [];
	this.cached_topic_keys.forEach(function(entry){

		if(entry in that.global_topics)
			cached_topics.push(that.global_topics[entry]);
	});

	this.cached_topics = cached_topics;

};

Topic_lense_model.prototype.find_index_by_cate = function(cate){
	
	var index = -1;
	this.get_topics().forEach(function (value, i) {
    	if(value.cate == cate)
    		index = i;
	});
	return index;
};


/***************************************/
/**** database primitive operation  ****/
/***************************************/

Topic_lense_model.prototype.insert = function(tweet){

	if(tweet.created_at > this.max_time_constant || tweet.created_at < this.min_time_constant)
		return;

	var lat = parseFloat(tweet.geolocation.split(',')[0]);
	var lng = parseFloat(tweet.geolocation.split(',')[1]);

	this.tweetsDB.insert({
		"tweet_id":tweet.tweet_id,
		"user_id":tweet.user_id,
		"created_at":tweet.created_at,
		"lng":lng,
		"lat":lat,
		"text":tweet.text,
		"screen_name": tweet.screen_name,
		"cate": tweet.cate,
		"tokens": tweet.tokens,
		"lemmed_text": tweet.lemmed_text
	});

};

/***************************************/
/**** database primitive operation  ****/
/***************************************/

Topic_lense_model.prototype.clear = function(){
	return this.tweetsDB().remove();
};

Topic_lense_model.prototype.count = function(){
	return this.tweetsDB().count();
};

Topic_lense_model.prototype.get_db = function(){
	return this.tweetsDB;
};

Topic_lense_model.prototype.get_terms = function(ids){

	var reg_str = ids.join("|");
	
	var reg = new RegExp(reg_str);

	var result = this.tweetsDB().filter({tweet_id:{regex:reg}}).select("tokens");

	return result;

};

Topic_lense_model.prototype.get_ts_cate_by_id = function(ids){

	if(ids.length <= 0)
		return [];

	var reg_str = ids.join("|");
	
	var reg = new RegExp(reg_str);

	var result = this.tweetsDB().filter({tweet_id:{regex:reg}}).select("created_at", "cate");

	return result;

};

Topic_lense_model.prototype.filter_by_id_cate = function(ids, cate){

	if(ids.length <= 0)
		return "";

	var reg_str = ids.join("|");
	
	var reg = new RegExp(reg_str);

	var result = this.tweetsDB().filter({tweet_id:{regex:reg}});

	if( typeof(cate) === 'undefined' || cate == null ){
		//do nothing;
	}else{
		result = result.filter(function(){
			for(var key in this.cate){
				if( this.cate[key].indexOf(cate) != -1)
					return true;
			}
			return false;
		});
	}
	return result;
};

Topic_lense_model.prototype.set_time_range = function(start_time, end_time){

	this.min_time_current = start_time;
	this.max_time_current = end_time;
}

Topic_lense_model.prototype.retrieve_data = function(cate_arr, min_time, max_time){

	var that = this;
	var rst = this.tweetsDB();

	var min_lng = that.geo_bbox.get_center().x - that.geo_bbox.get_extent().x;
	var max_lng = that.geo_bbox.get_center().x + that.geo_bbox.get_extent().x;
	var min_lat = that.geo_bbox.get_center().y - that.geo_bbox.get_extent().y;
	var max_lat = that.geo_bbox.get_center().y + that.geo_bbox.get_extent().y;

	rst = rst.filter({created_at:{lte:max_time}}, {created_at:{gte:min_time}});
	rst = rst.filter({lat:{lte:max_lat}}, {lat:{gte:min_lat}});
	rst = rst.filter({lng:{lte:max_lng}}, {lng:{gte:min_lng}});

	if(cate_arr == null || cate_arr.length <= 0)
		return rst;
	else{

		rst = rst.filter(function(){
			var common_ele = intersect_arrays(cate_arr, this.cate);
			if(common_ele.length > 0)
				return true;
			else
				return false;
		});
	}

	return rst;

};

Topic_lense_model.prototype.retrieve_data_current = function(){

	var min_time = this.min_time_current;
	var max_time = this.max_time_current;
		
	this.data_cache = this.retrieve_data(this.cached_topic_keys, min_time, max_time);

	return this.data_cache;
		
};

Topic_lense_model.prototype.retrieve_data_current_cache = function(){

	if(this.data_cache == null)
		return this.retrieve_data_current();
	else
		return this.data_cache;
}


//get all the data inside the bbox. the result is used as nominator for normalization;
Topic_lense_model.prototype.get_population = function(clusters){

	clusters.forEach(function(entry){
		entry.population = 0;
	});

	var rst = this.retrieve_data(null, this.min_time_current, this.max_time_current).select("lng", "lat");
	
	rst.forEach(function(ele){
		clusters.forEach(function(entry){
			if(entry.geo_bbox.contains(ele[0], ele[1]))
				entry.population += 1;
		});
	});

	clusters.forEach(function(entry){
		entry.population = Math.max(entry.population, entry.ids.length);
	});

	return clusters;

};

Topic_lense_model.prototype.get_topic_dist = function(global_or_cached, ids){

	var result = null;
	var db = this.retrieve_data(null, this.min_time_current, this.max_time_current);

	if( typeof(ids) === 'undefined' ){
		result = db.select("cate");
	}
	else{
		var reg_str = ids.join("|");
		var reg = new RegExp(reg_str);
		result = db.filter({tweet_id:{regex:reg}}).select("cate");
	}
	
	var topic_dist_arr = {};
	if(global_or_cached){
		
		var topics = this.get_global_topics();
		Object.keys(this.get_global_topics()).forEach(function(entry){
			topic_dist_arr[entry] = 0;
		});

	}else{

		var topics = this.get_topics();
		for(var i=0;i<topics.length;i++)
			topic_dist_arr[topics[i].cate] = 0;
	}

	result.forEach(function(entry){

		entry.forEach(function(_entry){
			topic_dist_arr[_entry]++;
		});
	});

	return topic_dist_arr;

};
//cluster <-> topic distribution matrix, dynamically changing based on map interaction; entry value in the interval [0, 1]
Topic_lense_model.prototype.get_topic_cluster_matrix = function(clusters){

	var that = this;
	//length equals to cluster size;
	topic_clusters_matrix = [];

	var cate_arr = that.cached_topics.map(function(entry){ return entry.cate; });
	
	for(var i=0; i<clusters.length; i++){
		
		var tmp_arr = [], topic_dist = that.get_topic_dist(false, clusters[i].ids);
		
		cate_arr.forEach(function(entry){
			if(entry in topic_dist)
				tmp_arr.push(topic_dist[entry]);
			else
				tmp_arr.push(0);
		});

		topic_clusters_matrix.push(tmp_arr);
	}

	//find min and max for each topic;
	topic_min = {}, topic_max = {};
	for(var i=0; i<this.get_topics().length; i++){

		var tmp = topic_clusters_matrix.map(function(ele) { return ele[i]; });
		var min = Math.min.apply(null, tmp);
		var max = Math.max.apply(null, tmp);
		topic_min[i] = min;
		topic_max[i] = max;
	}

	return {topic_clusters_matrix:topic_clusters_matrix, topic_min:topic_min, topic_max:topic_max};
};

Topic_lense_model.prototype.get_term_cluster_matrix = function(clusters){

	//length equals to cluster size;
	term_clusters_matrix = [];
	
	for(var i=0; i<clusters.length; i++)
		term_clusters_matrix.push( this.get_terms(clusters[i].ids) );

	return term_clusters_matrix;
};

Topic_lense_model.prototype.get_topic_terms = function(terms){

	var that = this;
	var topic_terms = [];

	that.get_topics().forEach(function(entry){
		topic_terms.push({});
	});

	// terms.forEach(function(entry){
	// 	var cate = EMTerms.instance().from_term_get_cate(entry);

	// 	cate.forEach(function(ele){
	// 		//check if this category is in cached_topic_keys;
	// 		var idx = that.find_index_by_cate(ele);
	// 		if(idx != -1){
	// 			//this term should be visualized, calculate its frequency:
	// 			try{
	// 				if(entry in topic_terms[idx])
	// 					topic_terms[idx][entry] = topic_terms[idx][entry] + 1;
	// 				else
	// 					topic_terms[idx][entry] = 1;
				
	// 			}catch(e){
	// 				console.log(e);
	// 			}
	// 		}

	// 	});
	// });
	
	terms.forEach(function(entry){

		for(var term in entry){
			
			cates = entry[term];

			cates.forEach(function(cate){

				var idx = that.find_index_by_cate(cate);
			
				if(idx != -1){
					
					//this term should be visualized, calculate its frequency:
					try{
						if(term in topic_terms[idx])
							topic_terms[idx][term] = topic_terms[idx][term] + 1;
						else
							topic_terms[idx][term] = 1;
				
					}catch(e){
						console.log(e);
					}
				}

			});
		}

	});


	//covert list of object [{term:freq}...] to list of terms [term...], sorted by frequency;
	topic_terms.forEach(function(entry, idx){
		var terms = Object.keys(entry);
		var terms = terms.map(function(ele){ return [ele, entry[ele]] }).sort(function(a,b){ return b[1]-a[1]; });
		
		var filtered_term = terms.filter(function(ele){ return ele[1] > that.term_freq_threshold; });

		if( true || filtered_term.length <= 0 )
			topic_terms[idx] = terms;
		else
			topic_terms[idx] = filtered_term;
	});

	return topic_terms;

};


/******************************/
/****time series operation*****/
/******************************/

//this function assume every tweet has index for topics already. If users manually create topics, the index should be genereted before calling this func.
Topic_lense_model.prototype.update_time_series = function(){

	for(var idx in this.get_topics()){
		
		var cate = this.get_topics()[idx].cate;
		var time_series = this.get_cate_time_series(cate);

		this.get_topics()[idx].time_series = time_series.time_series;
		this.get_topics()[idx].time_series_max = time_series.time_series_max;
		this.get_topics()[idx].time_series_min = time_series.time_series_min;
	}

};

//for time-series chart vis;
Topic_lense_model.prototype.construct_time_series = function(){
	

	//for individual time series:
	// var len = this.get_topics()[0].time_series.length;
	// var bin = this.bin_unit;

	// var dates = [];

	// var date = new XDate(this.min_time);
	
	// for(var i=0;i<len;i++){
	//   dates.push( date.toString('d HH:mm'));
	//   date.addMinutes(bin);
	// }

	// var rst = [];

	// for(var idx in this.get_topics()){

	// 	rst.push([]);

	// 	var cate = this.get_topics()[idx].cate;
		
	// 	this.get_topics()[idx].time_series.forEach(function(val, i){
	// 		rst[idx].push({});
	// 		rst[idx][i][cate] = val;
	// 		rst[idx][i]['datetime'] = dates[i];
			
	// 	});
	// }
	// return rst;

	//for combined time series;
	var len = this.get_topics()[0].time_series.length;
	var bin = this.bin_unit;

	var rst = [];

	var date = new XDate(this.min_time_constant);


	
	for(var i=0;i<len;i++){
	  
	  rst.push({});
	  rst[i].datetime = date.toString('d HH:mm');
	  rst[i].datetime_epoch = date.toDate();
	  
	  date.addMinutes(bin);
	}

	for(var idx in this.get_topics()){

		var cate = this.get_topics()[idx].cate;
		
		this.get_topics()[idx].time_series.forEach(function(val, i){		
			rst[i][cate] = val;
		});
	}
	return rst;

}

Topic_lense_model.prototype.get_idx_from_time_series_array = function(date) {

	for(var i=0;i<this.time_series_array.length;i++){

		if(this.time_series_array[i] <= date && date < this.time_series_array[i+1] )
			return i;
	}
	return -1;

};

Topic_lense_model.prototype.get_time_series_array = function() {

	var time_series_array = [];
	var date = new XDate(this.min_time_constant);

	for(var i=0;i<this.bin_length;i++){

		time_series_array.push(date);
	  
	  date = new XDate(date);
	  date.addMinutes(this.bin_unit);
	
	}

	return time_series_array;
};


Topic_lense_model.prototype.get_cate_time_series = function(cate){

	var result = this.retrieve_data(null, this.min_time_constant, this.max_time_constant).select("cate", "created_at");

	var time_series = [];
	result.forEach(function(entry){
		if(entry[0].indexOf(cate) != -1)
			time_series.push(entry[1]);
	});
	
	var bins = bin_time_series(time_series, this.min_time_constant, this.max_time_constant, this.bin_unit);

	return {time_series:bins.bins, time_series_max:bins.max, time_series_min:bins.min};

};

Topic_lense_model.prototype.get_max_bin = function(){

	var maxes = this.get_topics().map( function(entry){ return entry.time_series_max} );

	return Math.max.apply(null, maxes);

};


/******************************************/
/***  topic data primitive operation  *****/
/******************************************/

// Topic_lense_model.prototype.add_topic = function(terms){

// 	var topic = {};
// 	topic.index = "" + this.topics.length;
// 	topic.terms = terms;

// 	this.topics.push(topic);

// 	//add topic index in tweet db;
// 	this.tweetsDB().update(function(){
		
// 		var overlap = intersect_arrays(this.tokens, terms);
// 		if(overlap.length <= 0)
// 			return this;
// 		else{
// 			this.topic_index = this.topic_index.concat(parseInt(topic.index));
// 			return this;
// 		}

// 	});

// 	this.set_topic_time_series(topic.index);

// };

Topic_lense_model.prototype.load_data = function(start_time_string, end_time_string, is_his){

	var that = this;

	var radius = distance(that.geo_bbox.get_center().get_x(),
							that.geo_bbox.get_center().get_y(),
							that.geo_bbox.get_center().get_x()+that.geo_bbox.get_extent().get_x(),
							that.geo_bbox.get_center().get_y());

	$.ajax({
		method: "GET",
		dataType: "json",
		url: "http://"+ip_address+"/EMcategory_cache",
		data: $.param({ graphID: that.model_id,
						radius: radius,
						center: that.geo_bbox.get_center().toString_reverse(),
						start_time: start_time_string,
						end_time: end_time_string,
						case_index: default_case
					 }),

		headers : { 'Content-Type': 'application/json' },
		async: false
	})
	.done(function( msg ) {

		var tweets = msg.tweets;

		tweets.forEach(function(entry){

			
			// if(entry.created_at > "2013-04-15T20:20:00Z")
			// 	return;
			// if(entry.created_at > "2013-04-15T22:30:00Z")
			// 	return;
			// if(entry.created_at > "2013-04-15T23:35:00Z")
			// 	return;
			if(entry.created_at > "2014-10-19T03:40:00Z")
				return;

			entry.geolocation = entry.geolocation.lat + "," + entry.geolocation.lon;
			entry.user_id = 0;
			entry.screen_name = "";
			entry.created_at = new Date(Date.parse(entry.created_at));
			
			that.insert(entry);


		});

		if(is_his){
			that.global_to_cached(that.cached_topic_keys);
		}
		
		console.log("finished");

	});

};

function clean_terms(arr){

	rst = [];
	
	arr.forEach(function(entry){
		rst.push(entry.replace(/\W/g, ''));
	});

	return rst;
}



function distance(lon1, lat1, lon2, lat2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2-lat1).toRad();  // Javascript functions in radians
  var dLon = (lon2-lon1).toRad(); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

function union_arrays(x, y) {
	 var obj = {};
	for (var i = x.length-1; i >= 0; -- i)
		obj[x[i]] = x[i];
	for (var i = y.length-1; i >= 0; -- i)
		obj[y[i]] = y[i];
	var res = [];
	for (var k in obj) {
	if (obj.hasOwnProperty(k))
		res.push(obj[k]);
	}
	
	/*
	if(x.length + y.length != res.length)
	{
		alert("inter!");
	}
	*/
	return res;
}	

function intersect_arrays(arr1, arr2){
		
	var results = [];

	for (var i = 0; i < arr1.length; i++) {
		if (arr2.indexOf(arr1[i]) !== -1) {
    		results.push(arr1[i]);
		}
	}
	return results;
}

function unique_array(arr){

	var u_arr = [];
	$.each(arr, function(i, el){
    	if($.inArray(el, u_arr) === -1) u_arr.push(el);
	});

	return u_arr;
}

function triangle(x1, y1, x2, y2){

	// var tan = (y2-y1)*1.0/(x2-x1);
	// var radian = Math.atan(tan);

	// return {sin:Math.sin(radian), cos:Math.cos(radian)};

	var y = 1.0*(y2 - y1);
	var x = 1.0*(x2 - x1);
	var dis = Math.sqrt(x*x+y*y);
	return {sin:y/dis, cos:x/dis};

}

function jqSelector(str){

	try{
		str = str.replace(/ /g,"_");
		return str.replace(/([?<>;&,\.\+\*\~':"\!\^#$%@{}\[\]\(\)=>\|])/g, '\\$1');
	}catch(e){
		console.log(e);
	}
}

function bin_time_series(time_series, min_time, max_time, bin_unit){

	var bin_num = ( max_time.getTime() - min_time.getTime() ) / (1000*60*bin_unit);
	
	var binned = d3.layout.histogram()
							.range([min_time,max_time])
							.bins(bin_num)
							(time_series);

	var binned_volume = binned.map( function(ele){return ele.length});
	
	var binned_max = Math.max.apply(null, binned_volume);
	var binned_min = Math.min.apply(null, binned_volume);

	return {bins:binned_volume, max:binned_max, min:binned_min};

}

function output(input){
	var m = new Date();
	var dateString = m.getUTCMinutes() + ":" + m.getUTCSeconds();
	console.log(input + " " + dateString);
}

function cosine_similarity(v1, v2){

	var dot = numeric.dot(v1, v2);
	var v1_length = Math.sqrt(numeric.dot(v1,v1));
	var v2_length = Math.sqrt(numeric.dot(v2,v2));

	if(v1_length <= 0.001 || v2_length <= 0.001)
		return 0;

	return dot * 1.0 / ( v1_length * v2_length );

}

function generate_identifier(arr){

	arr.sort();
	var len = arr.length > 50 ? 50 : arr.length;
	var subarr = arr.slice(0, len);

	return subarr.join('_');

}

//arr1, arr2: order is sensitive. it returns the index based on arr1;
function interset_array_object_property(arr1, arr2, prop_name){

	var values = {};
	arr2.forEach(function(entry){
		values[entry[prop_name]] = true;
	});

	var idxes = [];

	arr1.forEach(function(entry, idx){
		if(entry[prop_name] in values)
			idxes.push(idx);
	});

	return idxes;
}