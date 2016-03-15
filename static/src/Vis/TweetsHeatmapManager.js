TweetsHeatmapManager = function(){

	this.layer = new OpenLayers.Layer.Vector("Tweets Heatmap Layer", {
                opacity: 0.3,
                renderers: ['Heatmap'],
                strategies: [new OpenLayers.Strategy.Cluster({distance: 50})],
                rendererOptions: {
                    weight: function(feature) {
                        var weight = 0,
                            features = feature.cluster;

                        for (var i = 0, len = features.length; i < len; i++) {
                            weight += features[i].attributes.count; // `count` from data array.
                        }
                        return (weight ? Math.log(weight) : 0);
                    },
                    heatmapConfig: {
                    	radius : 5
                    }
                },
                preFeatureInsert: function(feature) {
                	// this.set("radius",5);
                	// console.log("did");
                }
    });

	this.renderNum = 30000;

	this.feature_cache = [];
};

TweetsHeatmapManager.prototype = {
	
	//pxs and pyx are geo coordinates(lat,lon)
	refreshMap: function(geo_points) {

		var that = this;
		this.layer.removeAllFeatures();

		var heatmapData = new Array();
	
		//initialize lonlatarray based on pxs and pys, and do filter based on geobound

		for(var i = 0; i< geo_points.length; i++){
			var tt = new Object();
			tt.lat = geo_points[i].lat;
			tt.lng = geo_points[i].lng;
			tt.tweet_id = geo_points[i].id;
			tt.count = 1;
			heatmapData.push(tt);
		}

		console.log("Render heatmap, data length:"+ heatmapData.length);
	
		var data = heatmapData;
		var datalen = data.length,
    	features = [];
    	var sphericalMercatorProj = new OpenLayers.Projection('EPSG:900913');
		var geographicProj = new OpenLayers.Projection('EPSG:4326');
    
		while (datalen--) {
        	var g = new OpenLayers.Geometry.Point(data[datalen].lng, data[datalen].lat);
            g.transform(geographicProj, sphericalMercatorProj);

            features.push(new OpenLayers.Feature.Vector(g, {count: data[datalen].count}, {details:data[datalen]}));
    	}
	 
	 	// this.getLayer().set("radius",5);
	 	
		this.layer.addFeatures(features);
	 	this.feature_cache = this.getFeatures();
	 	//this.layer.removeAllFeatures();

	 	// if (min == -1 || max == -1)
	 	// 	return;

	 // 	var featureBuffer = this.getFeatures();
	 // 	var to_remove = [];

	 // 	for (var i = 0; i < featureBuffer.length; i++)
		// 	if (featureBuffer[i].cluster.length < min
		// 		|| featureBuffer[i].cluster.length > max)
		// 		to_remove.push(featureBuffer[i]);

		// this.layer.removeFeatures(to_remove);
	},
	getLayer: function(){
		return this.layer;
	},
	getFeatures: function() {
		return this.layer.features;
	},
	clearFeatures: function(){
		this.layer.removeAllFeatures();
	},

	get_clusters: function(){

		var clusters = [];
		var features = this.feature_cache;
		var max_cluster_size = 0;

		var total_cnt = 0;
		for(var i=0; i<features.length; i++){

			var lngs = Object.keys( features[i].cluster ).map(function ( key ) { return features[i].cluster[key].style.details.lng; });
			var lats = Object.keys( features[i].cluster ).map(function ( key ) { return features[i].cluster[key].style.details.lat; });
			var ids = Object.keys( features[i].cluster ).map(function ( key ) { return features[i].cluster[key].style.details.tweet_id; });

			var sum_lng = lngs.reduce(function(a, b) {return a+b;});
			var sum_lat = lats.reduce(function(a, b) {return a+b;});

			var min_lat = Math.min.apply(null, lats), max_lat = Math.max.apply(null, lats), min_lng = Math.min.apply(null, lngs), max_lng = Math.max.apply(null, lngs);

			var size = lngs.length;
			var bbox = new BBox();
			var extent_x = Math.max(Math.abs(sum_lng/size - max_lng), Math.abs(sum_lng/size - min_lng));
			var extent_y = Math.max(Math.abs(sum_lat/size - max_lat), Math.abs(sum_lat/size - min_lat));

			bbox.setSep(sum_lng/size, sum_lat/size, extent_x, extent_y);
			// console.log(sum_lng/size+" "+sum_lat/size);

			clusters[i] = {bbox:bbox, size:size, ids:ids, latlon:{lats:lats, lngs:lngs}};

			total_cnt += ids.length;

			max_cluster_size = Math.max(max_cluster_size, size);

		}

		console.log("num of clusters: "+features.length);
		console.log("totol_cnt:" + total_cnt);

		return {data:clusters, max_size:max_cluster_size};

	},
};