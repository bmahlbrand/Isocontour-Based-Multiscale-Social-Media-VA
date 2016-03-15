Topic_lense = function(lense_id, map_svg, overlay_svg, geo_bbox, start_time, end_time){

	this.lense_id = lense_id;

	this.map_svg = map_svg;
	this.overlay_svg = overlay_svg;
	this.map_g = null;
	this.overlay_g = null;

	this.arc_width = 30;
	this.title_width = 20;
	this.label_width = 20;
	this.band_width = this.arc_width + this.title_width;

	//constants for radius:
	this.min_cluster_radius = 8;
	this.max_cluster_radius = 25;
	//abstract point
	this.thres_cluster_radius = -1;

	//cluster inner circle size;
	this.cluster_inner_circle_radius = 4;

	this.cluster_mode = Topic_lense.CLUSTER_MODE.N_C_F_R;

	this.band_default_color = "#333333";
	this.band_highlight_color = "#b2182b";

	this.text_default_color = "#2166ac";
	this.text_highlight_color = "#b2182b";

	this.thread_color = "#b2182b";

	this.topic_series_margin = 5;

	this.sts = Topic_lense.status.ACTIVE;

	//cluster <-> topic distribution matrix, dynamically changing based on map interaction; entry value in the interval [0, 1]
	this.candidate_clusters = [];
	//previous clusters;
	this.cached_candidate_clusters = [];

	this.topic_clusters_matrix = [];
	this.term_clusters_matrix = [];
	this.topic_terms = [];
	
	//a term may have multiple positions;
	this.text_position = {};
	
	this.highlighted_topics = [];
	
	this.focus_cluster = [];
	this.hover_one_cluster = null;
	
	this.topic_lense_data = new Topic_lense_model(this.lense_id, geo_bbox, this, start_time, end_time);
	this.pixel_bbox = Canvas_manager.instance().geo_bbox_to_pixel_bbox(this.topic_lense_data.get_geo_bbox());

	this.map_g = this.map_svg.append("g")
					.attr("transform", "translate(" + this.pixel_bbox.center.x + "," + this.pixel_bbox.center.y + ")");


};

Topic_lense.prototype.get_db = function(){
	return this.topic_lense_data.get_db();
};

Topic_lense.prototype.set_sts = function(sts){
	this.sts = sts;
};


Topic_lense.prototype.update_time_range = function(start_time, end_time){
	this.topic_lense_data.set_time_range(start_time, end_time);
	
	//cannot update here, every update should call canvas_manager's update() function;
	//this.update();
};

//flag: zoom in, zoom out or paninteraction;
Topic_lense.prototype.update = function(flag){

	//tried to differ pan and zoom so that when panning, the highlighted clusters are still maintained.
	//however, this turns out not working because when panning, the index of clusters are updated and by saving indexes, we cannot retrieve the previous highlighted clusters

	if(this.sts == Topic_lense.status.SLEEP)
		return;

	//this condition should be throwed away.
	else if(this.sts == Topic_lense.status.NORMAL){
		
		// this.pixel_bbox = Canvas_manager.instance().geo_bbox_to_pixel_bbox(this.topic_lense_data.get_geo_bbox());
		// var g = this.map_svg.append("g")
		// 			.attr("transform", "translate(" + this.pixel_bbox.center.x + "," + this.pixel_bbox.center.y + ")")

		// var mode = this.get_mode();
		// if( mode == Topic_lense.geo_mode.EMPTY )
		// 	return;

		// if( mode == Topic_lense.geo_mode.CONTEXT ){
		// 	//context mode, to-do list;
		// 	this.draw_abstract_point(g);

		// }else{
		// 	//focus mode:

		// 	this.update_calculation();

		// 	this.draw_arc(g, false);
		// 	this.draw_cluster(g);
		// 	this.draw_threads(g);
		// }

	}else{

		//do not update pixel_bbox;

		//this.pixel_bbox = Canvas_manager.instance().geo_bbox_to_pixel_bbox(this.topic_lense_data.get_geo_bbox());
		this.clear_focus_cluster();

		this.cached_candidate_clusters = this.candidate_clusters;
		this.candidate_clusters = [];

		/**************************************/
		/**************map svg*****************/
		/**************************************/

		//remove convex hull
		this.map_svg.selectAll(".hull").remove();
		//remove concave hull
		this.map_svg.selectAll(".concaveHull").remove();
		this.map_svg.selectAll(".tmp_concaveHull").remove();
		
		//step 1: remove clusters in current map layer
		this.map_svg.selectAll(".cluster_pie_chart").remove();

		this.map_svg.selectAll(".tmp_hull").remove();
		//step 1: remove clusters in current map layer
		this.map_svg.selectAll(".tmp_cluster_pie_chart").remove();

		//redraw the previous clusters in the new zoom/pan level with new position
		if(Topic_lense.enable_transition == true){
			this.cached_candidate_clusters = this.update_previous_cluster(this.cached_candidate_clusters);
			this.fade_in_cluster(this.map_g, this.map_svg, false, this.cached_candidate_clusters, flag);
		}
		/***************************************************/
		/*****recalculate clusters based on new zoom level**/
		/***************************************************/

		//for both zoom and pan;
		this.topic_clusters_matrix = [];
		this.term_clusters_matrix = [];
		this.text_position = {};
		this.topic_terms = [];

		this.update_calculation();

		//calculate common clusters of different zoom/pan levels
		var common_idx = interset_array_object_property(this.cached_candidate_clusters, this.candidate_clusters, 'identifier');

		//fade out previous clusters
		if(Topic_lense.enable_transition == true){

			this.fade_out_cluster(common_idx, flag);
		}
		//fade in new clusters
		var common_idx = interset_array_object_property(this.candidate_clusters, this.cached_candidate_clusters, 'identifier');
		
		this.fade_in_cluster(this.map_g, this.map_svg, true, this.candidate_clusters, common_idx, flag);
		//this.fade_in_convex_hull(this.map_svg, this.candidate_clusters);

		/**************************************/
		/***********overlap svg****************/
		/**************************************/

		this.overlay_svg.selectAll("*").remove();
		
		this.overlay_g = this.overlay_svg.append("g")
					.attr("transform", "translate(" + this.pixel_bbox.center.x + "," + this.pixel_bbox.center.y + ")");

		//draw visual masks on overlay svg;
		this.draw_mask(this.overlay_svg);
		
		//draw lense on overlay svg;
		this.draw_arc(this.overlay_g, true);

		//output("arc, text, time-series rendering done");
		

		//hover terms/threads
		this.clear_hover_terms();
		
		this.hover_terms_draw_threads();


	}

};

//called in app controller;
Topic_lense.prototype.update_geo_bbox = function(){

	//update geo_bbox
	this.topic_lense_data.set_geo_bbox(Canvas_manager.instance().pixel_bbox_to_geo_bbox(this.pixel_bbox, 100));

	console.log("pixel bbox: "+this.pixel_bbox.to_plain_string());
	console.log("geo bbox: "+this.topic_lense_data.get_geo_bbox().to_plain_string());

};

// Topic_lense.prototype.update_previous_cluster = function(cached_clusters){

// 	cached_clusters.forEach(function(entry){

// 		//recalculate pixel position based on new zoom/pan level;
// 		entry.pixel_bbox = Canvas_manager.instance().geo_bbox_to_pixel_bbox(entry.geo_bbox);
// 		var cp_p_bbox = jQuery.extend(true, {}, entry.pixel_bbox);
// 		entry.vis_bbox = cp_p_bbox;
	
// 	});

// 	// cached_clusters = this.select_candidate_cluster(cached_clusters);
// 	return cached_clusters;

// };
Topic_lense.prototype.update_previous_cluster = function(cached_clusters){

	cached_clusters.forEach(function(entry){

		var p_center = Canvas_manager.instance().geo_p_to_pixel_p( {x:entry.g_center[0], y:entry.g_center[1]} );
		
		entry.p_center = [p_center.x, p_center.y];
	
	});

	// cached_clusters = this.select_candidate_cluster(cached_clusters);
	return cached_clusters;

};

Topic_lense.prototype.update_calculation = function(){

	var pixel_bbox = this.pixel_bbox;

	//get clusters;
	//var clusters = TweetsDataManager.instance().get_geo_clusters().data;
	var rst = Canvas_manager.instance().topic_lense_manager.get_pixel_points();
	var curr_cluster = new SpatialClustering(rst[0], rst[1], rst[2], false);
	console.log("number of clusters in the current scale:" + curr_cluster.length);

	// var rst = Canvas_manager.instance().topic_lense_manager.get_pixel_points(1);
	// var cluster_1_step = new SpatialClustering(rst[0], rst[1], rst[2], true);
	// console.log("number of clusters in the next scale:" + cluster_1_step.length);
	//var clusters = curr_cluster.concat(cluster_1_step);
	var clusters = curr_cluster;

	/*********************/
	/*  filter cluster   */
	/*********************/

	var candidate_clusters = [];

	clusters.forEach(function(entry){

		if(pixel_bbox.intersects_by_circle(entry.pixel_bbox)){

			//vis_bbox is normalized after calling select_candidate_cluster(), real_bbox remains the actual bbox, in order to compute number of tweets in the bbox;
			//candidate_clusters.push({geo_bbox:entry.bbox, pixel_bbox:p_bbox, ids:entry.ids, vis_bbox:cp_p_bbox, identifier:ident, latlon:entry.latlon });
			entry.identifier = generate_identifier(entry.ids);
			//entry.vis_bbox = jQuery.extend(true, {}, entry.pixel_bbox);
			candidate_clusters.push(entry);
		}
	});

	this.candidate_clusters = candidate_clusters;
	//add field population in the below function;
	//this.candidate_clusters = this.topic_lense_data.get_population(this.candidate_clusters);
	this.candidate_clusters = this.select_candidate_cluster(this.candidate_clusters);
	
	/*********************************/
	/*    init topic cluster matrix  */
	/*********************************/

	var tmp = this.topic_lense_data.get_topic_cluster_matrix(this.candidate_clusters);
	
	this.topic_clusters_matrix = tmp.topic_clusters_matrix;
	
	//find min and max for each topic;
	var topic_min = tmp.topic_min, topic_max = tmp.topic_max;

	var global_topic_min = Math.min.apply(null, Object.keys(topic_min).map(function(k){return topic_min[k]}) );
	var global_topic_max = Math.max.apply(null, Object.keys(topic_max).map(function(k){return topic_max[k]}) );

	/**************************************/
	/*  init token/keyword cluster matrix */
	/**************************************/

	this.term_clusters_matrix = this.topic_lense_data.get_term_cluster_matrix(this.candidate_clusters);

	/**************************************/
	/*  get ranked terms for each topic   */
	/**************************************/

	var all_terms = [];

	this.term_clusters_matrix.forEach(function(entry){
		all_terms = all_terms.concat(entry);
	});

	this.topic_terms = this.topic_lense_data.get_topic_terms(all_terms);


	/***************************************/
	/*********update tree volume************/
	/***************************************/

	var tree_vol = this.topic_lense_data.get_topic_dist(true);
	$('[ng-controller="EMTree_controller"]').scope().update_tree_volume(tree_vol);
	
	/***************************************/
	/*********update time series************/
	/***************************************/

	this.topic_lense_data.update_time_series();

	var data = this.topic_lense_data.construct_time_series();
	$('[ng-controller="ts_controller"]').scope().refresh_chart(data, this.topic_lense_data.min_time, this.topic_lense_data.max_time);

	/***************************************/
	/*********display in table************/
	/***************************************/
	$('[ng-controller="EMTable_controller"]').scope().display(this.topic_lense_data.retrieve_data_current_cache());


};


Topic_lense.prototype.draw_mask = function(svg){

	var pixel_bbox = this.pixel_bbox;
	var that = this;

	svg.append('svg:defs')
		.call(function (defs) {
	      
	      defs.append('svg:mask')
	        .attr('id', 'lense-mask')
	    	// .attr('width', svg.attr("width"))
	  		// .attr('height', svg.attr("height"))
	  		// .attr('x', 0)
	  		// .attr('y', 0)
	        .call(function(mask){
	        
	          // mask.append('svg:rect')
	          //   .attr('width', pixel_bbox.get_radius()*2)
	          //   .attr('height', pixel_bbox.get_radius()*2)
	          //   .attr('x', pixel_bbox.get_center().get_x()-pixel_bbox.get_radius())
	          //   .attr('y', pixel_bbox.get_center().get_y()-pixel_bbox.get_radius())
	          //   .attr('fill', '#ffffff');
	          mask.append('svg:rect')
	          		.attr('width', svg.attr("width"))
	  				.attr('height', svg.attr("height"))
	  				.attr('x', 0)
	  				.attr('y', 0)
	  				.attr('fill', '#ffffff');

	  		  mask.append('svg:circle')
	            .attr('cx', pixel_bbox.get_center().get_x())
	            .attr('cy', pixel_bbox.get_center().get_y())
	            .attr('r', pixel_bbox.get_radius()+that.band_width)
	            .attr('fill', '#000000');
	        
	        });
	    });

	svg.append('svg:rect')
		.attr("id", "mask_rect")
	  	.attr('width', svg.attr("width"))
	  	.attr('height', svg.attr("height"))
	  	.attr('x', 0)
	  	.attr('y', 0)
	  	.attr('fill', '#888888')
	  	.attr('opacity', 0.5)
	  	.attr('mask', 'url(#lense-mask)')
	  	.attr('pointer-events', 'none')
	  	.moveToBack(); //The pointer event can go through the overlay.
};

Topic_lense.prototype.draw_abstract_point = function(g){

	var pixel_bbox = this.pixel_bbox;

	var bbox = g.append("circle")
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", pixel_bbox.get_radius())
                .style("stroke", "red")
                .style("fill", "none");
};

Topic_lense.prototype.draw_arc = function(g, time_series_flag){

	var that = this;

	var num_of_topics = this.topic_lense_data.get_topic_length();
	var delta = 2*Math.PI / num_of_topics;
	var start = 0;
	var margin = 0.5 / 360.0 * (2*Math.PI);

	var width = time_series_flag? this.band_width : 5;
	var fill = "#dae0f1";
	var stroke = that.band_default_color;
	var opacity = 0.9;

	var label_start = new XDate(this.topic_lense_data.min_time_constant);
	label_start = label_start.toString('d HH:mm');
	var label_end = new XDate(this.topic_lense_data.max_time_constant);
	label_end = label_end.toString('d HH:mm');
	var label_mid = new XDate( (this.topic_lense_data.min_time_constant.getTime() + this.topic_lense_data.max_time_constant.getTime()) * 0.5 );
	label_mid = label_mid.toString('d HH:mm');

	for(var i=0; i<num_of_topics; i++){

		var reverseFlag = ( start + 0.5*delta > Math.PI * 0.5 && start + 0.5*delta < Math.PI * 1.5 ) ? true : false;

		var arc = d3.svg.arc()
					   	.innerRadius(this.pixel_bbox.get_radius()-this.label_width)
					    .outerRadius(this.pixel_bbox.get_radius()+width)
					    .startAngle( start + margin )
					    .endAngle( start + delta - margin );

		var arc_label = d3.svg.arc()
					   	.innerRadius(this.pixel_bbox.get_radius()-this.label_width)
					    .outerRadius(this.pixel_bbox.get_radius())
					    .startAngle( start + margin )
					    .endAngle( start + delta - margin );

		var arc_reverse = d3.svg.arc()
					   	.innerRadius(this.pixel_bbox.get_radius()-this.label_width)
					    .outerRadius(this.pixel_bbox.get_radius()+width)
					    .startAngle( start + delta - margin )
					    .endAngle( start + margin );

		// var title_arc = d3.svg.arc()
		// 			   	.innerRadius(this.pixel_bbox.get_radius()+this.arc_width)
		// 			    .outerRadius(this.pixel_bbox.get_radius()+width)
		// 			    .startAngle( start + margin )
		// 			    .endAngle( start + delta - margin );

		start += delta;

		// g.append("path")
		// 	.attr("id", "topic_title_"+i)
		// 	.attr("d", title_arc)
		// 	.attr("opacity", opacity)
		// 	.style("fill", "#a6bddb")
		// 	.style("stroke", "#aaaaaa")
		// 	.style("pointer-events", "none");

		g.append("path")
			.attr("id", "topic_arc_"+i)
			.attr("d", arc)
			.attr("opacity", opacity)
			.style("fill", fill)
			.style("stroke", stroke)
			.style("stroke-width", 2);

		g.append("path")
			.attr("id", "topic_arc_reverse_"+i)
			.attr("d", arc_reverse)
			.attr("opacity", 0);
			//.style("pointer-events", "all");
			// .on("click", function(){

			// 	var id = parseInt(this.id.split('_')[2]);
			// 	that.switch_highlight_topic(id);
				
			// 	that.hover_arcs();
			// 	//that.hover_cluster();

			// 	//show all tweets related to this cate;
			// 	var cluster_ids = [];
			// 	var tweet_ids = [];

			// 	cluster_ids = that.matrix_operation.get_cluster_by_topic(that.topic_clusters_matrix, id);

			// 	cluster_ids.forEach(function(id){
			// 		tweet_ids = tweet_ids.concat(that.candidate_clusters[id].ids);
			// 	});

				
			// });

			//add arc label:
			g.append("path")
				.attr("d", arc_label)
				.attr("opacity", 0.5)
				.style("fill", "none")
				.style("stroke", stroke)
				.style("stroke-width", 2)
				.style("pointer-events", "all");

			// .on("mouseover", function(){

			// 	var id = parseInt(this.id.split('_')[2]);
				
			// 	// d3.select("#"+this.id).style("stroke", highlight_stroke);
			// 	// d3.selectAll(".bargroup_"+id).style("fill", "red").style("stroke", "red");

			// 	// var cluster_ids = that.matrix_operation.get_cluster_by_topic(that.topic_clusters_matrix, id);
			// 	// that.hover_cluster(cluster_ids);

			// 	// console.log("hover on topic "+id);
			// 	that.switch_highlight_topic(id);
			// 	that.hover_arcs();

			// })
			// .on("mouseout", function(){

			// 	var id = parseInt(this.id.split('_')[2]);

			// 	d3.select("#"+this.id).style("stroke", stroke)
			// 	d3.selectAll(".bargroup_"+id).style("fill", "grey").style("stroke", "grey");

			// 	that.hover_cluster(null);

			// 	console.log("hover off topic "+id);
			// });

		//append title of the category;
		g.append("text")
			.attr("id", "topic_title_"+i)
		    .attr("x", 8)
		    .attr("dy", reverseFlag?-8:18)
		    .attr("fill", function(d){

		    	//just black title
		    	return "#000";

		    	var cate = that.topic_lense_data.get_topics()[i].cate;
		    	var mapping = $('[ng-controller="map_controller"]').scope().get_color_scheme();
	          	if( mapping.domain().indexOf(cate) != -1)
	            	return mapping(cate);
	          	else
	            	return "#000";
		    })
		    .style("font-size", "20px")
		    .style("text-anchor", "middle")
		  .append("textPath")
		    .attr("class", "textpath")
		    .attr("startOffset","25%")
		    .attr("xlink:href", reverseFlag?"#"+"topic_arc_reverse_"+i:"#"+"topic_arc_"+i)
		    .text(that.topic_lense_data.get_topics()[i].name);

		//label for text:
		var label_color = "#034e7b";
		g.append("text")
		    .attr("x", 8)
		    .attr("dy", 62)
		    .attr("fill", label_color)
		    .style("font-size", "12px")
		    .style("text-anchor", "middle")
		  .append("textPath")
		    .attr("class", "textpath")
		    .attr("startOffset","2%")
		    .attr("xlink:href", "#"+"topic_arc_"+i)
		    .text(label_start);

		g.append("text")
		    .attr("x", 8)
		    .attr("dy", 64)
		    .attr("fill", label_color)
		    .style("font-size", "12px")
		    .style("text-anchor", "middle")
		  .append("textPath")
		    .attr("class", "textpath")
		    .attr("startOffset","46%")
		    .attr("xlink:href", "#"+"topic_arc_"+i)
		    .text(label_end);

		g.append("text")
		    .attr("x", 8)
		    .attr("dy", 64)
		    .attr("fill", label_color)
		    .style("font-size", "12px")
		    .style("text-anchor", "middle")
		  .append("textPath")
		    .attr("class", "textpath")
		    .attr("startOffset","23%")
		    .attr("xlink:href", "#"+"topic_arc_"+i)
		    .text(label_mid);

		//draw text:
		this.draw_text(g, this.pixel_bbox.get_radius()+this.band_width, start-delta+margin, start-margin, this.topic_terms[i]);

		if(time_series_flag)
			this.draw_time_series(g, this.arc_width, i, this.pixel_bbox.get_radius(), start-delta+margin, start-margin, this.topic_lense_data.get_topics()[i].time_series, 0, this.topic_lense_data.get_max_bin());
	}

	//quick fix:
	//this.hover_arcs();

};

Topic_lense.prototype.draw_time_series = function(g, width, topic_index, radius, start_angle, end_angle, time_series, min_range, max_range){

	// var reverse = false;
	// if((start_angle + end_angle)*0.5 > Math.PI)
	// 	reverse = true;
	var that = this;
	
	/*********global max**********/
	// max_range = Math.max.apply(null, time_series);

	// var linear_map = d3.scale.linear()
	// 					.domain([min_range, max_range])
 //    					.range([0, 1]);
   	/*********global max**********/

	/*********local max**********/
	var linear_map = d3.scale.linear()
						.domain([0, 1, max_range])
    					.range([0, 0.2, 1]);
   	/*********local max**********/
   	
	var delta = (end_angle-start_angle) / time_series.length;
	var start = start_angle;

	var bar_group = g.append("g");
	//draw time-series as tiny arc segments;

	var tip = d3.tip()
  		.attr('class', 'd3-tip')
  		.offset([-10, 0])
  		.html(function(d) {
    		return "Time: " + this.time.toString("d HH:mm") + "<br>Volume:" + this.volume;
  	});

  	g.call(tip);

	for(var i=0; i<time_series.length; i++){

		//draw time-series if volumn is larger than 0
		if( time_series[i] > 0 ){
			
			var arc = d3.svg.arc()
					   	.innerRadius(radius)
					    .outerRadius(radius+(width-this.topic_series_margin)*linear_map(time_series[i]))
					    .startAngle( start )
					    .endAngle( start+delta );

			bar_group.append("path")
				.attr("id", "ts_"+topic_index+"_barindex_"+i+"_"+time_series[i])
				.attr("class", "bargroup bargroup_"+topic_index+" "+"ts_"+topic_index+"_barindex_"+i)
				.attr("d", arc)
				.style("fill", that.band_default_color)
				.style("stroke", that.band_default_color)
				.style("pointer-events", "all")
				.on("mouseover", function(){
		  		
		  			var t_index = parseInt(this.id.split('_')[3]);
		  			var v = parseInt(this.id.split('_')[4]);

		  			d3.select(this).style("stroke", "#ff6666").style("fill", "#ff6666");
		  			tip.time = that.topic_lense_data.time_series_array[t_index];
		  			tip.volume = v;
		  			tip.show();

		  		}).on("mouseout", function(){
		  		
		  			d3.select(this).style("stroke", that.band_default_color).style("fill", that.band_default_color);
		  			tip.hide();
		  		});
		};

		start += delta;
	}
};

Topic_lense.prototype.draw_text = function(g, radius, start_angle, end_angle, terms_weights){

	var that = this;
	var terms = terms_weights.map(function(ele){ return ele[0]; });
	var weights = terms_weights.map(function(ele){ return ele[1]; });

	/********** term weight to transparency **********/
	// var color = d3.scale.linear()
	// 					.domain([Math.min.apply(null, weights), Math.max.apply(null, weights)])
 //    					.range(["#74a9cf", "#023858"]);
    /***************************************************/

	var font_size = 28.0;
	var highlight_font_size = 32.0;

	var num_of_term_to_render = radius * (end_angle - start_angle - 10*(Math.PI/180.0) ) / font_size;
	num_of_term_to_render = Math.min(num_of_term_to_render, terms.length);
	
	var angle = (end_angle + start_angle)*0.5;
	var delta_angle = font_size / radius;

	var direction = -1;
	for(var i=0;i<num_of_term_to_render; i++){

		if(weights[i] < 2)
			continue;

		var flag_left_half = ( angle >= Math.PI && angle <= 2*Math.PI ) ? true : false;

		var local_angle = Math.PI*0.5-angle;
		var translate_x = (radius+5)*Math.cos(local_angle);
		var translate_y = (radius+5)*Math.sin(Math.PI*0.5-angle)*(-1);

		var rotate_angle = -local_angle;
		rotate_angle = rotate_angle*(180/Math.PI);
		if(flag_left_half)
			rotate_angle += 180;

		g.append("text")
		  .attr("class", "topic_term" + " " + "topic_term_"+jqSelector(terms[i]))
		  .style("fill", that.text_default_color)
		  // .style("stroke", that.text_default_color)
		  // .style("stroke-width", "2")
		  .style("font-size", font_size+"px")
		  .style("opacity", 1.0)
		  .style("pointer-events", "all")
		  .attr("text-anchor", flag_left_half?"end":"start")
		  .attr("alignment-baseline", "middle")
		  .attr("transform", "translate("+ translate_x +","+ translate_y +") rotate(" + rotate_angle +")")
		  .text(terms[i].replace(/_/g, ' '))
		  .on("mouseover", function(){
		  	
		  	d3.select(this).style("font-size", highlight_font_size+"px")
		  					.style("font-weight", "bolder")
		  					.style("fill","b2182b");

		  	var keyword = this.textContent;
		  	//retrieve from clusters;
		  	var cst = [];

		  	that.term_clusters_matrix.forEach(function(entry, idx){
		  		
		  		for(var ii=0; ii<entry.length; ii++){
		  			if(keyword in entry[ii]){
		  				cst.push(idx);
		  				break;
		  			}
		  		}
		  	});

		  	cst = unique_array(cst);
		  	that.focus_cluster = cst;
		  	that.no_hover_terms_draw_threads();

		  })
		  .on("mouseout", function(){

		  	d3.select(this).style("font-size", font_size+"px")
		  					.style("font-weight", "normal")
		  					.style("fill", that.text_default_color);

		  	that.clear_focus_cluster();
		  	//that.hover_terms_draw_threads();
		  	that.no_hover_terms_draw_threads();
		  
		  });
		
		/**********************/
		/* init text position */
		/**********************/

		var translate_x_no_width = this.pixel_bbox.get_radius()*Math.cos(local_angle);
		var translate_y_no_width = this.pixel_bbox.get_radius()*Math.sin(Math.PI*0.5-angle)*(-1);

		var text_pos = {x:translate_x_no_width, y:translate_y_no_width, norm:(end_angle + start_angle)*0.5};

		if( terms[i] in this.text_position)
			this.text_position[terms[i]].push(text_pos);
		else
			this.text_position[terms[i]] = [text_pos];

		//console.log("text:"+terms[i]+"; angle:"+angle+"; x:"+this.text_position[terms[i]].x+"; y:"+this.text_position[terms[i]].y);

		direction = direction*(-1);
		angle = angle + direction*(i+1)*delta_angle;
	}

};

Topic_lense.prototype.hover_arcs = function(){

	//reset all;
	var that = this;
	var topic_length = this.topic_lense_data.get_topic_length();

	for(var i=0;i<topic_length;i++){
		d3.select("#topic_arc_"+i).style("stroke", that.band_default_color);
		d3.select("#topic_title_"+i).style("fill", that.band_default_color);
		d3.selectAll(".bargroup_"+i).style("fill", that.band_default_color).style("stroke", that.band_default_color);
	}

	var ids = this.highlighted_topics;

	ids.forEach(function(id){

		d3.select("#topic_arc_"+id).style("stroke", that.band_highlight_color);
		d3.select("#topic_title_"+id).style("fill", that.band_highlight_color);
		d3.selectAll(".bargroup_"+id).style("fill", that.band_highlight_color).style("stroke", that.band_highlight_color);

	});

};

Topic_lense.prototype.hover_cluster = function(){

	//focus on one cluster;
	if(this.focus_cluster.length > 0){

		d3.selectAll(".cluster_pie_chart").attr("opacity", 0.5);
		d3.selectAll(".concaveHull").attr("opacity", 0.5);

		this.focus_cluster.forEach(function(ele){

			d3.select("#concaveHull_"+ele).attr("opacity", 1.0);
			d3.select("#concaveHull_"+ele).moveToFront();

			d3.select("#cluster_pie_chart_"+ele).attr("opacity", 1.0);
			d3.select("#cluster_pie_chart_"+ele).moveToFront();
		});

		return;
	}else{
		
		d3.selectAll(".cluster_pie_chart").attr("opacity", 1.0);
		d3.selectAll(".concaveHull").attr("opacity", 1.0);

	}

	if(this.highlighted_topics.length <= 0){
		d3.selectAll(".cluster_pie_chart").attr("opacity", 1.0);
		return;
	}

	var that = this;
	var cluster_ids = [];
	var tweet_ids = []

	this.highlighted_topics.forEach(function(id){

		cluster_ids = cluster_ids.concat(that.matrix_operation.get_cluster_by_topic(that.topic_clusters_matrix, id));

	});

	d3.selectAll(".cluster_pie_chart").attr("opacity", 0.4);

	for(var i=0;i<cluster_ids.length;i++){
		d3.select("#cluster_pie_chart_"+cluster_ids[i]).attr("opacity", 1.0);
		d3.select("#cluster_pie_chart_"+cluster_ids[i]).moveToFront();
	}

};

Topic_lense.prototype.hover_terms_draw_threads = function(){
	this.hover_cluster();
	this.hover_terms();
	this.hover_time_series();
	this.draw_threads();
}

Topic_lense.prototype.no_hover_terms_draw_threads = function(){
	this.hover_cluster();
	this.hover_time_series();
}

/*****************************************************/
/******************hover terms begins*****************/
/*****************************************************/

Topic_lense.prototype.hover_terms = function(){

	//get current indexes for clusters;
	var that = this;
	var ids = this.focus_cluster.slice();
	if(this.hover_one_cluster != null && ids.indexOf(this.hover_one_cluster) == -1 )
		ids.push(this.hover_one_cluster);

	var terms = [];
	ids.forEach(function(ele){

		that.term_clusters_matrix[ele].forEach(function(entry){
			terms = terms.concat(Object.keys(entry));
		});

	});
	
	terms = unique_array(terms);
	this._hover_terms(terms);

}

Topic_lense.prototype.clear_hover_terms = function(){
	d3.selectAll(".topic_term").style("fill", this.text_default_color);
}

Topic_lense.prototype.hover_time_series = function(){

	var that = this;
	d3.selectAll(".bargroup").style("fill", that.band_default_color).style("stroke", that.band_default_color);
	
	var ids = this.focus_cluster.slice();
	if(this.hover_one_cluster != null && ids.indexOf(this.hover_one_cluster) == -1 )
		ids.push(this.hover_one_cluster);

	var msg_ids = [];
	ids.forEach(function(ele){

		msg_ids = msg_ids.concat(that.candidate_clusters[ele].ids);

	});
	
	msg_ids = unique_array(msg_ids);

	rst = this.topic_lense_data.get_ts_cate_by_id(msg_ids);

	var cate_timestamp = {};
	rst.forEach(function(entry){

		var time = entry[0]
		cates = entry[1];

		cates.forEach(function(cate){
			//not the current cate;
			if(that.topic_lense_data.cached_topic_keys.indexOf(cate) == -1)
				return;
			if((cate in cate_timestamp) == false)
				cate_timestamp[cate] = [];

			cate_timestamp[cate].push(time);
		});
	});

	//return cate_timestamp;
	for(var key in cate_timestamp){
		if(cate_timestamp.hasOwnProperty(key)){

			date_arr = cate_timestamp[key];
			date_arr.forEach(function(entry, idx){
				date_arr[idx] = that.topic_lense_data.get_idx_from_time_series_array(entry);
			});
			
			var bar_indexes = unique_array(date_arr);

			//hover here;
			var idx_topic = that.topic_lense_data.find_index_by_cate(key);
			bar_indexes.forEach(function(bar_idx){
				
				//disable that for now;
				d3.selectAll(".ts_"+idx_topic+"_barindex_"+bar_idx).style("stroke", "#ff6666").style("fill", "#ff6666");
			});
		}
	}

	//get time-series here;



}

Topic_lense.prototype._hover_terms = function(terms){

	var that = this;

	if(terms != null){
		d3.selectAll(".topic_term").style("fill", that.text_default_color);
		for(var i=0;i<terms.length;i++){
			// d3.select("#topic_term_"+jqSelector(terms[i])).style("fill", "red");
			d3.selectAll(".topic_term_"+jqSelector(terms[i])).style("fill", that.text_highlight_color);
		}
	}
};


/*****************************************************/
/*******************hover terms ends******************/
/*****************************************************/

/*****************************************************/
/*************draw thread functions begins************/
/*****************************************************/

Topic_lense.prototype.draw_threads = function(){

	//draw thread for all highlighted clusters:
	// var g = this.map_g;
	// var that = this;
	
	// var ids = this.focus_cluster.slice();
	// if(this.hover_one_cluster != null && ids.indexOf(this.hover_one_cluster) == -1 )
	// 	ids.push(this.hover_one_cluster);

	// this.clear_threads(g);
	// ids.forEach(function(ele){
	// 	that._draw_thread_for_one_cluster(g, ele);
	// });

	//draw threads only for the hovered one:
	var g = this.map_g;
	var that = this;
	this.clear_threads(g);
	if(this.hover_one_cluster != null)
		this._draw_thread_for_one_cluster(g, this.hover_one_cluster);
}

Topic_lense.prototype.clear_threads = function(g){
	g.selectAll(".thread_svg").remove();
}

Topic_lense.prototype._draw_thread_for_one_cluster = function(g, cluster_id){

	var that = this;
	if(cluster_id != null){

		var terms = [];

		that.term_clusters_matrix[cluster_id].forEach(function(entry){
			terms = terms.concat(Object.keys(entry));
		});

		terms = intersect_arrays(terms, Object.keys(this.text_position));

		for(var index in terms){

			this.text_position[terms[index]].forEach(function(entry){

				var text_pos_x = entry.x;
				var text_pos_y = entry.y;
				var norm = entry.norm;

				//var cluster_x = that.candidate_clusters[cluster_id].vis_bbox.center.x - that.pixel_bbox.center.x;
				//var cluster_y = that.candidate_clusters[cluster_id].vis_bbox.center.y - that.pixel_bbox.center.y;
				var cluster_x = that.candidate_clusters[cluster_id].p_center[0] - that.pixel_bbox.center.x;
				var cluster_y = that.candidate_clusters[cluster_id].p_center[1] - that.pixel_bbox.center.y;				

				var dis = 0.3 * Math.sqrt((text_pos_x-cluster_x)*(text_pos_x-cluster_x) + (text_pos_y-cluster_y)*(text_pos_y-cluster_y));

				var start_p = [cluster_x, cluster_y];

				/*********************/
				/*set control point 1*/
				/*********************/

				var cp1 = [cluster_x + Math.sin(norm)*dis, cluster_y - Math.cos(norm)*dis];

				/***********************/
				/* set control point 2 */
				/***********************/

				var norm_new = triangle(text_pos_x, text_pos_y, 0, 0);

				var cp2 = [text_pos_x + norm_new.cos*dis, text_pos_y + norm_new.sin*dis];
				
				var end_p = [text_pos_x, text_pos_y];

				g.append("circle")
					.attr("class", "thread_svg")
					.attr("cx", text_pos_x)
					.attr("cy", text_pos_y)
					.attr("r", 2)
	                .style("stroke", that.thread_color)
	                .style("fill", that.thread_color);

		  //    	g.append("line")
		  //   		.attr("class", "thread_svg")
				// 	.attr("x1", cluster_x)
				// 	.attr("y1", cluster_y)
				// 	.attr("x2", cp1[0])
				// 	.attr("y2", cp1[1])
		  //           .style("stroke", "red")
		  //           .style("fill", "red");

		  //       g.append("line")
		  //   		.attr("class", "thread_svg")
				// 	.attr("x1", text_pos_x)
				// 	.attr("y1", text_pos_y)
				// 	.attr("x2", cp2[0])
				// 	.attr("y2", cp2[1])
		  //           .style("stroke", "red")
		  //           .style("fill", "red");

		        var cps = [start_p, cp1, cp2, end_p];

		        var bezierLine = d3.svg.line()
								    .x(function(d) { return d[0]; })
								    .y(function(d) { return d[1]; })
								    .interpolate("basis");
				g.append('path')
					.attr("class", "thread_svg")
			        .attr("d", bezierLine(cps))
			        .attr("stroke", that.thread_color)
			        .attr("stroke-width", 2)
			        .attr("stroke-opacity", 0.6)
			        .attr("fill", "none")
			        .moveToBack();

		    });
		}

	}
};

/*****************************************************/
/************draw thread functions ends***************/
/*****************************************************/

Topic_lense.prototype.fade_out_cluster = function(excluded_id, flag){

	var that = this;

	d3.selectAll('.cluster_pie_chart')
		.attr("id", function(){
			return 'tmp_' + this.id;
		})
		.attr("class", "tmp_cluster_pie_chart");

	//remove pies;
	d3.selectAll('.tmp_cluster_pie_chart')
		.selectAll('.arc')
		.selectAll('path')
		.on("mouseover", function(){

		})
		.transition()
		.duration(that.get_glyph_transition_param(flag).duration)
		.delay(that.get_glyph_transition_param(flag).delay)
		.attr('opacity', function(d){
			cluster_id = parseInt(this.id.split('_')[3]);
			if( excluded_id.indexOf(cluster_id) != -1 )
				return 1;
			else
				return 0;
		})
		.remove();


	//remove central circle;
	d3.selectAll('.tmp_cluster_pie_chart')
		.selectAll('circle')
		.transition()
		.duration(that.get_glyph_transition_param(flag).duration)
		.delay(that.get_glyph_transition_param(flag).delay)
		.attr('opacity', function(d){
			cluster_id = parseInt(this.id.split('_')[3]);
			if( excluded_id.indexOf(cluster_id) != -1 )
				return 1;
			else
				return 0;
		})
		.remove();

	//TO-DO remove pies;
	d3.selectAll('.tmp_cluster_pie_chart')
		.transition()
		.delay(that.get_glyph_transition_param(flag).duration + that.get_glyph_transition_param(flag).delay)
		.remove();

	if(Topic_lense.enable_outline){
		// //remove hulls;
		// d3.selectAll('.hull')
		// 	.attr("id", function(){
		// 		return 'tmp_' + this.id;
		// 	})
		// 	.attr("class", "tmp_hull");

		// d3.selectAll('.tmp_hull')
		// 	.transition()
		// 	.duration(that.get_hull_transition_param(flag).duration)
		// 	.delay(that.get_hull_transition_param(flag).delay)
		// 	.attr('opacity', function(d){
		// 		cluster_id = parseInt(this.id.split('_')[2]);
		// 		if( excluded_id.indexOf(cluster_id) != -1 )
		// 			return 1;
		// 		else
		// 			return 0;
		// 	})
		// 	.remove();

		//remove hulls;
		d3.selectAll('.concaveHull')
			.attr("id", function(){
				return 'tmp_' + this.id;
			})
			.attr("class", "tmp_concaveHull");

		d3.selectAll('.tmp_concaveHull')
			.transition()
			.duration(that.get_hull_transition_param(flag).duration)
			.delay(that.get_hull_transition_param(flag).delay)
			.attr('opacity', function(d){
				cluster_id = parseInt(this.id.split('_')[2]);
				if( excluded_id.indexOf(cluster_id) != -1 )
					return 1;
				else
					return 0;
			})
			.remove();
	}

	d3.timer.flush();
}

Topic_lense.prototype.fade_in_cluster = function(g, non_translated_g, is_play, clusters, excluded_id, flag){

	var that = this;
	var pixel_bbox = this.pixel_bbox;

	var sizes = clusters.map(function ( entry ) { return entry.ids.length; });
	var size_max = Math.max.apply(null, sizes);
	/*********************/
	/*   draw pie chart  */
	/*********************/
	var duration, delay;
	var duration2, delay2;

	var largest_sector = 0;

	this.topic_clusters_matrix.forEach(function(entry){

		entry.forEach(function(entry1){
			if(entry1 > largest_sector)
				largest_sector = entry1;
		});

	});


	for(var i=0; i<clusters.length; i++){

		/**************************/
	    /******config timer********/
	    /**************************/

	    // if(clusters[i].ids.length <= 1)
	    // 	continue;

		if(is_play == false ){
			duration = 0;
			delay = 0;
			duration2 = 0;
			delay2 = 0;
		}
		else if( excluded_id.indexOf(i) != -1 ){
			duration = 0;
			delay = 0;
			duration2 = 0;
			delay2 = 0;
		}
		// if flag == 0 or 1,(zoom event), still need to perform animation even the cluster is in the excluded_id list;
		//otherwise, the concave hulls of different scale will show at the same time;
		// else if( excluded_id.indexOf(i) != -1 && flag == 2 ){
		// 	duration = 0;
		// 	delay = 0;
		// 	duration2 = 0;
		// 	delay2 = 0;
		// }
		else{
			duration = that.get_glyph_transition_param(flag).duration;
			delay = that.get_glyph_transition_param(flag).delay;
			duration2 = that.get_hull_transition_param(flag).duration;
			delay2 = that.get_hull_transition_param(flag).delay;
		}

		/**************************/
	    /******config timer********/
	    /**************************/

		// var pie_data = [12,234,576,8,0,8,90];

		var pie_data = this.topic_clusters_matrix[i].slice();
		//var pie_data1 = this.topic_clusters_matrix[i].slice();

		//just for user study:
		// if(i >= 2)
		// 	continue;
		// size_max = 100;
		// if(i == 0){
		// 	pie_data = [15, 20, 20, 15];
		// }else if(i == 1){
		// 	pie_data = [15, 0, 5, 40];
		// }
		//just for user study:


		/*****************************************/
		/********topic based min/max**************/
		/*****************************************/
		
		// pie_data.forEach(function(entry, index){

		// 	if(topic_max[index] > 0)
		// 		pie_data[index] = pie_data[index]*1.0/topic_max[index];
		// 	else
		// 		pie_data[index] = 0;
		// });

		/*****************************************/
		/*************global min/max**************/
		/*****************************************/
		
		// pie_data.forEach(function(entry, index){
		// 	// pie_data[index] = (entry==0?0:1);
		// 	if(global_topic_max > 0)
		// 		pie_data[index] = pie_data[index]*1.0/global_topic_max;
		// 	else
		// 		pie_data[index] = 0;
		// });

		/*****************************************/
		/********cluster centric min/max**********/
		/*****************************************/
		
		// var cluster_max = Math.max.apply(null, pie_data);
		// var cluster_min = Math.min.apply(null, pie_data);
		
		// pie_data.forEach(function(entry, index){
		// 	if(cluster_max > 0)
		// 		pie_data[index] = pie_data[index]*1.0/cluster_max;
		// 	else
		// 		pie_data[index] = 0;
		// });

		
		//check if the radius of this cluster is less than the thres_cluster_radius. if so, only draw an abstract point;
		// if( clusters[i].vis_bbox.get_radius() <= that.thres_cluster_radius ){
		// 	//reduce pie_data to one element;
		// 	var sum = pie_data.reduce(function(a, b) { return a + b; });
		// 	var avg = sum / pie_data.length;
		// 	pie_data = [avg];

		// }

		/*********************************/
		/**previous circle normalization**/
		/*********************************/

  //   	var radius = d3.scale.linear()
		// 				.domain([0, 1])
		// 				//.range([Math.max(8, clusters[i].vis_bbox.get_radius()*0.5), Math.max(20, clusters[i].vis_bbox.get_radius()*1.0)]);
  //   					.range([clusters[i].vis_bbox.get_radius()*0.5, clusters[i].vis_bbox.get_radius()*1.0]);
		
		// var color = d3.scale.linear()
		// 					.domain([0, 1])
		// 					.range(["white", "green"]);

		/*********************************/
		/**previous circle normalization**/
		/*********************************/
    	
    	/*********************************/
		/**current circle normalization***/
		/*********************************/
		console.log(largest_sector);
		var const_sector = largest_sector;

		var shift = that.cluster_inner_circle_radius;
    	var radius = d3.scale.linear()
    					// .base(Math.E)
    					.domain([0, 1, const_sector, largest_sector])
    					.range([ 2, 2 + Topic_lense.glyph_size_delta , 18 + Topic_lense.glyph_size_delta, 18 + Topic_lense.glyph_size_delta ]);

		var color = d3.scale.linear()
							// .base(Math.E)
							.domain([0, 1, const_sector, largest_sector])
							.range(["white", "#dff4d7", "green", "green"]);

		var radius_cluster = d3.scale.linear()
    					.domain([1, size_max])
    					.range([3, 20]);

		/*********************************/
		/**current circle normalization***/
		/*********************************/
		var arc;
		var large_radius = -1;

		if (Topic_lense.glyph_index == Topic_lense.glyph_type.TYPE_1) {
  			
  			arc = d3.svg.arc().outerRadius( function(d){

  				//handle log with domain having 0;
  				var r;
  				if( d.data == 0 ) r = 3;
  				else
  					r = radius(d.data)+shift;
  				
  				large_radius = Math.max(large_radius, r);
  				return r;
  			} ).innerRadius(0);
		
		}
		else if(Topic_lense.glyph_index == Topic_lense.glyph_type.TYPE_2){
		
			arc = d3.svg.arc().outerRadius( function(d){ return 15; } ).innerRadius(0);
		}
		else{
		
			var r = radius_cluster(clusters[i].ids.length);
			arc = d3.svg.arc().outerRadius( function(d){ return r; } ).innerRadius(0);
		}

		var pie = d3.layout.pie()
    						.sort(null)
    						.value(function(d) { return 10; });

    	var pie_svg = g.append("g")
    				   .attr("id", "cluster_pie_chart_"+i)
    				   .attr("class", "cluster_pie_chart")
      			 	   //.attr("transform", "translate(" + (clusters[i].vis_bbox.center.x - pixel_bbox.center.x) + "," + (clusters[i].vis_bbox.center.y - pixel_bbox.center.y) + ")");
      			 	   .attr("transform", "translate(" + (clusters[i].p_center[0] - pixel_bbox.center.x) + "," + (clusters[i].p_center[1] - pixel_bbox.center.y) + ")");

      	var pie_chart = pie_svg.selectAll(".arc")
      			   .data(pie(pie_data))
      			   .enter().append("g")
      			   .attr("class", "arc");

      	var cluster_index = i;
  		
  		pie_chart.append("path")
  				 .attr("d", arc)
  				 .attr("id", function(d, i) { return "cluster_pie_chart_"+cluster_index+"_topic_sector_"+i; })
  				 .attr("opacity", 0)
  				 .style("fill", function(d, i) { return color(d.data); })
  				 .style("stroke-width", 1)
  				 .style("stroke", "purple")
  				 .on("click", function(){

  				 	var cluster_index = parseInt(this.id.split('_')[3]);
  				 	var cate_index = that.topic_lense_data.get_topics()[parseInt(this.id.split('_')[6])].cate;

  				 	//display all tweets in this cluster <--> display tweets related to a category
				 	var rst = that.topic_lense_data.filter_by_id_cate(clusters[cluster_index].ids, null);
				 	$('[ng-controller="EMTable_controller"]').scope().display(rst);

  				 })
  				 .on("mouseover", function(){
					
					var cluster_index = parseInt(this.id.split('_')[3]);
					//alert(that.topic_clusters_matrix[cluster_index]);

  				 	//check if the pie is transparent, if so, do not enable mouse hover.
  				 	//d3 doesn't work fine here, use jquery instead:
  				 	//var flag = d3.select("#cluster_pie_chart_"+cluster_index).css("opacity")>0.8?true:false;
  				 	
  				 	//var flag = $("#cluster_pie_chart_"+cluster_index).css("opacity")>0.8?true:false;
  				 	// if(flag == false)
  				 	// 	return;

  				 	that.hover_one_cluster = cluster_index;
  				 	that.focus_cluster.push(cluster_index);

  				 	//draw threads:
					that.hover_terms_draw_threads();

					// that.hover_cluster();

					//show corresponding tweet dots;
					var rst = that.topic_lense_data.filter_by_id_cate(clusters[cluster_index].ids, null);
					$('[ng-controller="map_controller"]').scope().render_dots(rst);

  				 }).on("mouseout", function(){

					//draw threads:
					that.hover_one_cluster = null;
					that.focus_cluster = [];
					that.hover_terms_draw_threads();

					//render all dots;
					$('[ng-controller="map_controller"]').scope().render_dots();

					//that.hover_cluster();

  				 }).on('contextmenu', d3.contextMenu(that.get_menu(i), {
					onOpen: function() {
						console.log('opened!');
					},
					onClose: function() {
						console.log('closed!');
					}
				})).transition().duration(duration).delay(delay).attr("opacity", 1);

		if (Topic_lense.glyph_index != Topic_lense.glyph_type.TYPE_3) {

			var c = "white";

			if(Topic_lense.glyph_index == Topic_lense.glyph_type.TYPE_2){
				var color_loc = d3.scale.linear()
					.domain([0, size_max])
					.range(["white", "orange"]);
				c = color_loc(clusters[i].ids.length);
			}


			//add a small circle in the center;
			pie_svg.append("circle")
						.attr("id", function(d) { return "cluster_pie_chart_"+cluster_index+"_circle"; })
						.attr("class", "cluster_circle")
						.attr("cx", 0)
						.attr("cy", 0)
						.attr("r", that.cluster_inner_circle_radius + Topic_lense.glyph_size_delta*0.3 )
						.attr("opacity", 0)
						.style("stroke", "purple")
						.style("stroke-width", 1)
						.style("fill", c)
						.attr('pointer-events', 'none')
						// .on("mouseover", function(){
					
						// 	var cluster_index = parseInt(this.id.split('_')[3]);

		  		// 		 	that.hover_one_cluster = cluster_index;
		  		// 		 	//draw threads:
						// 	that.hover_terms_draw_threads();

						// 	//show corresponding tweet dots;
						// 	var rst = that.topic_lense_data.filter_by_id_cate(clusters[cluster_index].ids, null);
						// 	//$('[ng-controller="map_controller"]').scope().render_dots(rst);

		  		// 		})
						// .on("mouseout", function(){

						// 	//draw threads:
						// 	that.hover_one_cluster = null;
						// 	that.hover_terms_draw_threads();

		  		// 		})
		  		// 		.on('contextmenu', d3.contextMenu(that.get_menu(i), {
						// 	onOpen: function() {
						// 		console.log('opened!');
						// 	},
						// 	onClose: function() {
						// 		console.log('closed!');
						// 	}
						// }))
						.transition().duration(duration).delay(delay).attr("opacity", 1);
		}

		/**************************/
	    /*******convex hull********/
	    /**************************/
	    
	    if(Topic_lense.enable_outline){
		    //draw convex hull:
			// var screen_vertices = clusters[i].poly;

			// //do not need to translate here;
			// var hull = non_translated_g.append("path")
			// 		    .attr("class", "hull")
			// 		    .attr("id", "hull_" + i)
			// 		    .attr("opacity", 0)
			// 		    .moveToBack();
			// hull.datum(screen_vertices).attr("d", function(d) { return "M" + d.join("L") + "Z"; });
			// hull.transition().duration(duration2).delay(delay2).attr("opacity", 1);

			//if(clusters[i].poly.length >= 3)
				//this.drawConcaveHull(non_translated_g, clusters[i].poly, clusters[i].child?"red":"steelblue");
			
			var large_radius = large_radius + 2;
			var glyph_bbox = [];

			glyph_bbox.push([ clusters[i].p_center[0]-large_radius, clusters[i].p_center[1]-large_radius ],
							[ clusters[i].p_center[0]-large_radius, clusters[i].p_center[1]+large_radius ],
							[ clusters[i].p_center[0]+large_radius, clusters[i].p_center[1]+large_radius ],
							[ clusters[i].p_center[0]+large_radius, clusters[i].p_center[1]-large_radius ]);

			var poly = [];
			if( clusters[i].g_poly === null ){
				//
				poly = SpatialClustering.getPoly(clusters[i].pix_pts.concat(glyph_bbox));
				poly = SpatialClustering.smoothPoly(poly);

				var g_poly = [];
				poly.forEach(function(ele){
					var g = Canvas_manager.instance().pixel_p_to_geo_p( {x:ele[0], y:ele[1]} );
					g_poly.push([g.x, g.y]);
				});
				clusters[i].g_poly = g_poly;
			}
			else{
				clusters[i].g_poly.forEach(function(ele){
					var p = Canvas_manager.instance().geo_p_to_pixel_p( {x:ele[0], y:ele[1]} );
					poly.push([p.x, p.y]);
				});
			}

			if(poly.length >= 3)
				this.drawConcaveHull(i, non_translated_g, poly, "steelblue", duration2, delay2);

		}

	    /**************************/
	    /*******convex hull********/
	    /**************************/
	}

	d3.timer.flush();

	//this.hover_cluster();

};

Topic_lense.prototype.drawConcaveHull = function(idx, svg, pts, color, duration2, delay2){

	console.log("convex hull");
	// var line = d3.svg.line();
	// line.interpolate("cardinal-closed");

	var lineFunction = d3.svg.line()
                         .x(function(d) { return d[0]; })
                         .y(function(d) { return d[1]; })
                         .interpolate("cardinal-closed");

    var hull = svg.append("path")
			    	.attr("class", "concaveHull")
			    	.attr("id", "concaveHull_"+idx)
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", color)
			    	.attr("stroke-width", 2)
			    	.attr("fill", "none")
			    	.attr("opacity", 0)
					.moveToBack();

	hull.transition().duration(duration2).delay(delay2).attr("opacity", 1);

};

Topic_lense.prototype.select_candidate_cluster = function(clusters){

	//the bbox in clusters is the pixel_bbox corresponding to its geo_bbox;
	var that = this;
	if(clusters.length == 0)
		return clusters;

	/***********************************************/
	/********render based on volume begin***********/
	/***********************************************/

	clusters.sort(function(a, b) {return b.ids.length - a.ids.length; });

	//do not need vis bbox here;	
	// var max_size = clusters[0].ids.length;

	// var radius_scale;
	// if(1 == max_size)
	// 	//return max radius;
	// 	radius_scale = d3.scale.sqrt().domain([1,max_size]).range([that.max_cluster_radius, that.max_cluster_radius]);
	// else
	// 	radius_scale = d3.scale.sqrt().domain([1,max_size]).range([that.min_cluster_radius, that.max_cluster_radius]);

 //    clusters.forEach(function(entry){
 //    	//the bbox is transformed based on the volumn of the cluster.
 //    	var radius = radius_scale(entry.ids.length);
 //    	entry.vis_bbox.setExtents(radius, radius);

 //    });

	return clusters;

	/***********************************************/
	/********render based on volume end ************/
	/***********************************************/

	/*****************************************************************/
	/********render based on normalization by population begin********/
	/*****************************************************************/

	// clusters.sort(function(a, b) {return b.ids.length / b.population - a.ids.length / a.population; });
	
	// var max_size = clusters[0].ids.length / clusters[0].population;

	// var radius_scale = d3.scale.sqrt().domain([0, max_size]).range([that.min_cluster_radius, that.max_cluster_radius]);

 //    clusters.forEach(function(entry){
 //    	//the bbox is transformed based on the volumn of the cluster.
 //    	entry.vis_bbox.setExtents( radius_scale(entry.ids.length/entry.population), radius_scale(entry.ids.length/entry.population) );

 //    });
	// return clusters;

	/***************************************************************/
	/********render based on normalization by population end********/
	/***************************************************************/


};

/******************************/
/***  highlight topic manager  */
/*******************************/
Topic_lense.prototype.switch_highlight_topic = function(id){

	var index = this.highlighted_topics.indexOf(id);

	if( index == -1)
		this.highlighted_topics.push(id);
	else{
		this.highlighted_topics.splice(index, 1);
	}

};

Topic_lense.prototype.add_focus_cluster = function(idx){
	if(this.focus_cluster.indexOf(idx) == -1)
		this.focus_cluster.push(idx);
};
Topic_lense.prototype.clear_focus_cluster = function(){
	this.focus_cluster = []
};
Topic_lense.prototype.remove_focus_cluster = function(idx){
	var index = this.focus_cluster.indexOf(idx);
	if( index != -1 )
		this.focus_cluster.splice(index, 1);
};

Topic_lense.prototype.get_mode = function(){

	if(this.pixel_bbox == null)
		return Topic_lense.geo_mode.EMPTY;

	var radius = this.pixel_bbox.get_radius();

	if(radius <= 0)
		return Topic_lense.geo_mode.EMPTY;

	if(radius <= Topic_lense.geo_granularity_thred)
		return Topic_lense.geo_mode.CONTEXT;
	else
		return Topic_lense.geo_mode.FOCUS;

};

Topic_lense.prototype.get_status = function(){
	return this.sts;
};


/*********************************************************/
/*************** context menu operation ******************/
/*********************************************************/

//input is the index of the cluster;
Topic_lense.prototype.get_menu = function(i){

	var that = this;
	var menu = [
		{
			title: 'set',
			action: function(elm, d) {
				that.add_focus_cluster(i);
				that.hover_terms_draw_threads();
			}
		},
		{
			title: 'unset',
			action: function(elm, d) {
				that.remove_focus_cluster(i);
				that.hover_terms_draw_threads();

			}
		},
		{
			title: 'cancel',
			action: function(elm, d, i) {
				//console.log('You have clicked cancel.');
			}
		}
	];

	return menu;

};

Topic_lense.prototype.find_similar_cluster = function(id){

	var similar_cluster = [];
 	var topic_vec = this.topic_clusters_matrix[id];

 	this.topic_clusters_matrix.forEach(function(ele, idx){

 		if(idx != id && cosine_similarity(ele, topic_vec) > 0.8)
 			similar_cluster.push(idx);
	});

	return similar_cluster;

};

/******************************************/
/***  topic data primitive operation  ****/
/******************************************/

Topic_lense.prototype.add_topic = function(topic){

	this.topic_lense_data.add_topic(topic);
};

Topic_lense.prototype.matrix_operation = {

	get_cluster_by_topic : function(matrix, id){

		var rst = [];
		var threshold = 0;
		for(var i=0; i<matrix.length; i++){
			if(matrix[i][id] != null && matrix[i][id] > threshold )
				rst.push(i);
		}

		return rst;
	},
};

Topic_lense.prototype.get_glyph_transition_param = function(interaction_type){

	if(Topic_lense.enable_transition == false)
		return {delay:0, duration:0}

	var delay;
	var duration = Topic_lense.cluster_fade_duration_glyph;
	
	if(interaction_type == OlMapView.INTERACTION.ZOOM_IN){
		delay = Topic_lense.cluster_fade_delay_init;

	}else if(interaction_type == OlMapView.INTERACTION.ZOOM_OUT){
		delay = Topic_lense.cluster_fade_delay_init + Topic_lense.cluster_fade_duration_hull;

	}else if(interaction_type == OlMapView.INTERACTION.PAN){
		delay = Topic_lense.cluster_fade_delay_init;
	}
	return {delay:delay, duration:duration};

};

Topic_lense.prototype.get_hull_transition_param = function(interaction_type){

	if(Topic_lense.enable_transition == false)
		return {delay:0, duration:0}

	var delay;
	var duration = Topic_lense.cluster_fade_duration_hull;
	
	if(interaction_type == OlMapView.INTERACTION.ZOOM_IN){
		delay = Topic_lense.cluster_fade_delay_init + Topic_lense.cluster_fade_duration_glyph;

	}else if(interaction_type == OlMapView.INTERACTION.ZOOM_OUT){
		delay = Topic_lense.cluster_fade_delay_init;

	}else if(interaction_type == OlMapView.INTERACTION.PAN){
		delay = Topic_lense.cluster_fade_delay_init;
	}
	return {delay:delay, duration:duration};

};

// 00 no circle, fixed radius  01 no circle, varying radius
// 10 has circle, fixed radius 11 has circle, varying radius

Topic_lense.CLUSTER_MODE = { N_C_F_R : 0, N_C_V_R : 1,
							 Y_C_F_R : 2, Y_C_V_R : 3 };

Topic_lense.geo_mode = { EMPTY:-1, CONTEXT: 0, FOCUS: 1 };
Topic_lense.status = { SLEEP:-1, NORMAL: 0, ACTIVE: 1 };

Topic_lense.geo_granularity_thred = 50;

Topic_lense.cluster_fade_delay_init = 1000;

//duration for glyphs
Topic_lense.cluster_fade_duration_glyph = 2000;

//duration for hulls;
Topic_lense.cluster_fade_duration_hull = 2000;

Topic_lense.glyph_type = {TYPE_1: 0, TYPE_2: 1, TYPE_3: 2};
Topic_lense.glyph_index = Topic_lense.glyph_type.TYPE_1;

Topic_lense.enable_transition = true;
Topic_lense.enable_outline = true;

Topic_lense.glyph_size_delta = 2;