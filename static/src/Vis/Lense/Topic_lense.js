Topic_lense = function(lense_id, map_svg, overlay_svg, geo_bbox, start_time, end_time){

	this.lense_id = lense_id;

	this.map_svg = map_svg;
	this.overlay_svg = overlay_svg;

};

Topic_lense.prototype.update = function(){

};

Topic_lense.prototype.update_calculation = function(){

	var pixel_bbox = this.pixel_bbox;

	//get clusters;
	//var clusters = TweetsDataManager.instance().get_geo_clusters().data;
	var rst = Canvas_manager.instance().topic_lense_manager.get_pixel_points();
	var curr_cluster = new SpatialClustering(rst[0], rst[1], rst[2], false);
	// console.log("number of clusters in the current scale:" + curr_cluster.length);

	// var rst = Canvas_manager.instance().topic_lense_manager.get_pixel_points(1);
	// var cluster_1_step = new SpatialClustering(rst[0], rst[1], rst[2], true);
	// console.log("number of clusters in the next scale:" + cluster_1_step.length);
	//var clusters = curr_cluster.concat(cluster_1_step);
	var clusters = curr_cluster;

	var candidate_clusters = [];

	clusters.forEach(function(entry){

		//vis_bbox is normalized after calling select_candidate_cluster(), real_bbox remains the actual bbox, in order to compute number of tweets in the bbox;
		//candidate_clusters.push({geo_bbox:entry.bbox, pixel_bbox:p_bbox, ids:entry.ids, vis_bbox:cp_p_bbox, identifier:ident, latlon:entry.latlon });
		entry.identifier = generate_identifier(entry.ids);
		//entry.vis_bbox = jQuery.extend(true, {}, entry.pixel_bbox);
		candidate_clusters.push(entry);
	});

	this.candidate_clusters = candidate_clusters;
	//add field population in the below function;
	//this.candidate_clusters = this.topic_lense_data.get_population(this.candidate_clusters);
	this.candidate_clusters = this.select_candidate_cluster(this.candidate_clusters);
};

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

	d3.selectAll(".arrow_img").remove();

	Topic_lense.global_clusters = clusters;

	for(var i=0; i<clusters.length; i++){
		

		/**************************/
	    /******config timer********/
	    /**************************/

		if(is_play == false ){
			duration = 0;
			delay = 0;
			duration2 = 0;
			delay2 = 0;
		}
		// if flag == 0 or 1,(zoom event), still need to perform animation even the cluster is in the excluded_id list;
		//otherwise, the concave hulls of different scale will show at the same time;
		else if( excluded_id.indexOf(i) != -1 && flag == 2 ){
			duration = 0;
			delay = 0;
			duration2 = 0;
			delay2 = 0;
		}
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
		// console.log(largest_sector);

		var shift = that.cluster_inner_circle_radius;
    	var radius = d3.scale.linear()
    					.domain([0, 1, largest_sector])
    					.range([3, 5, 15]);

		var color = d3.scale.linear()
							.domain([0, 1, largest_sector])
							.range(["white", "#c7e9c0", "#31a354"]);

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
  				var r = radius(d.data)+shift;
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
  				 	
  				 	profile.data = profile.data.concat(clusters[cluster_index].ids);
  				 	// alert("data added");
  				 	
  				 })
  				 .on("contextmenu", function (d, i) {
  				 	return;
            		d3.event.preventDefault();
            		var cluster_index = parseInt(this.id.split('_')[3]);
            		addRefine(clusters[cluster_index].ids);
            		alert("refine added");
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

  				 })
  				 .transition()
  				 .duration(duration)
  				 .delay(delay)
  				 .ease(Topic_lense.easetype)
  				 .attr("opacity", 1);

		if (Topic_lense.glyph_index != Topic_lense.glyph_type.TYPE_3) {

			var c = "white";

			// if(Topic_lense.glyph_index == Topic_lense.glyph_type.TYPE_2){
			// 	var color_loc = d3.scale.linear()
			// 		.domain([0, size_max])
			// 		.range(["white", "orange"]);
			// 	c = color_loc(clusters[i].ids.length);
			// }
			//add a small circle in the center;
			pie_svg.append("circle")
						.attr("id", function(d) { return "cluster_pie_chart_"+cluster_index+"_circle"; })
						.attr("class", "cluster_circle")
						.attr("cx", 0)
						.attr("cy", 0)
						.attr("r", that.cluster_inner_circle_radius)
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
						.transition()
						.duration(duration)
						.delay(delay)
						.ease(Topic_lense.easetype)
						.attr("opacity", 1);

				var id_here = "cluster_pie_chart_"+cluster_index+"_circle";

				// if(cen_color !== null){
				// 	console.log("find match, cluster index:" + cluster_index);

				// 	g.append("image")
			 //    				   .attr("id", "arrow_img_"+cluster_index)
			 //    				   .attr("class", "arrow_img")
			 //    				   .attr("xlink:href", "img/arrow1.png")
			 //      			 	   .attr("transform", "translate(" + (clusters[cluster_index].p_center[0] - pixel_bbox.center.x) + "," + (clusters[cluster_index].p_center[1] - pixel_bbox.center.y) + ")")
			 //      			 	   .attr("x", "10px")
				// 		      	   .attr("y", "10px")
				// 		           .attr("width", "30px")
				// 		           .attr("height", "30px")
				// 		           .style("visibility", "hidden");

				// 	// d3.timer(function(){
				// 	// 	d3.select("#" +id_here+ "").style("fill", "orange");
				// 	// 	return true;
				// 	// }, Math.max(delay+duration, delay2+duration2));

				// 	d3.timer(function(){

				// 		// d3.select("#" +id_here+ "").style("fill", "orange");
				// 		// return true;
				// 		d3.selectAll(".arrow_img").style("visibility", "visible");
				// 		return true;

				// 	}, Math.max(delay+duration, delay2+duration2));
				// }
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
				this.drawConcaveHull(non_translated_g, poly, "steelblue", duration2, delay2);

		}

	    /**************************/
	    /*******convex hull********/
	    /**************************/
	}

};

Topic_lense.prototype.drawConcaveHull = function(svg, pts, color, duration2, delay2){

	// var line = d3.svg.line();
	// line.interpolate("cardinal-closed");

	var lineFunction = d3.svg.line()
                         .x(function(d) { return d[0]; })
                         .y(function(d) { return d[1]; })
                         .interpolate("cardinal-closed");

    var hull = svg.append("path")
			    	.attr("class", "concaveHull")
			    	.attr("d", lineFunction(pts))
			    	.attr("stroke", color)
			    	.attr("stroke-width", 2)
			    	.attr("fill", "none")
			    	.attr("opacity", 0)
					.moveToBack();

	hull.transition()
	.duration(duration2)
	.delay(delay2)
	.ease(Topic_lense.easetype)
	.attr("opacity", 1);

};