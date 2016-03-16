OlMapView = function(){

	this.map = null;
	this.fromProjection = new OpenLayers.Projection("EPSG:4326");
	this.toProjection   = new OpenLayers.Projection("EPSG:900913");

	this.baseLayer = null;
	this.dotLayer = null;

	//example
	// this.strategy = null;
	// this.clusters = null;

	this.features = [];
	this.tweetsHeatmapManager = null;
	// histogramManager = null;

	//polygon selection:
	this.polygon_layer = null;

};

OlMapView.prototype.init = function(div) {
	/*	init map:  */
	var copyThis = this;

	this.map = new OpenLayers.Map(div.id, {

					projection: new OpenLayers.Projection("EPSG:900913"),
                    displayProjection: new OpenLayers.Projection("EPSG:4326")
                });

	//this.baseLayer = new OpenLayers.Layer.OSM("OSM base layer");

	//grey-scale map;
    this.baseLayer = new OpenLayers.Layer.OSM('Simple OSM Map', null, {
	    eventListeners: {
	        tileloaded: function(evt) {
	            var ctx = evt.tile.getCanvasContext();
	            if (ctx) {
	                var imgd = ctx.getImageData(0, 0, evt.tile.size.w, evt.tile.size.h);
	                var pix = imgd.data;
	                for (var i = 0, n = pix.length; i < n; i += 4) {
	                	var tmp = (3 * pix[i] + 4 * pix[i + 1] + pix[i + 2]) / 8;
	                    pix[i] = pix[i + 1] = pix[i + 2] = Math.sqrt( tmp / 256.0 ) * 256;
	                }
	                ctx.putImageData(imgd, 0, 0);
	                evt.tile.imgDiv.removeAttribute("crossorigin");
	                evt.tile.imgDiv.src = ctx.canvas.toDataURL();
	            }
	        }
	    }
	});

	this.map.addLayer(this.baseLayer);

	var style = new OpenLayers.Style({
        pointRadius: "${radius}",
        fillColor: "#ffcc66",
        fillOpacity: 0.8,
        strokeColor: "#cc6633",
        strokeWidth: "${width}",
        strokeOpacity: 0.8
    }, {
        context: {
            width: function(feature) {
                return (feature.cluster) ? 2 : 1;
            },
            radius: function(feature) {
                var pix = 2;
                if(feature.cluster) {
                    pix = Math.min(feature.attributes.count, 7) + 2;
                }
                return pix;
            }
        }
    });

	/*
	init dot layer:
	*/
	this.dotLayer = new OpenLayers.Layer.Vector('Tweet Dot Layer',
			{
                styleMap: new OpenLayers.StyleMap({
					pointRadius: "${radius}",
					fillColor: "${color}",
					fillOpacity: "${opacity}",
					strokeOpacity: 0
                })//,  
				//renderers: renderer 
			});

	this.map.addLayer(this.dotLayer);

	//start example
	// this.strategy = new OpenLayers.Strategy.Cluster();
	// this.strategy.distance = 100;
 //    this.strategy.threshold = 3;
	
	// this.clusters = new OpenLayers.Layer.Vector("Clusters", {
	// 	            strategies: [this.strategy],
	// 	            styleMap: new OpenLayers.StyleMap({
	// 	                "default": style,
	// 	                "select": {
	// 	                    fillColor: "#8aeeef",
	// 	                    strokeColor: "#32a8a9"
	// 	                }
	// 	            })
	// 	        });

	// var select = new OpenLayers.Control.SelectFeature(
	//  	this.clusters, {hover: true}
	// );

    // this.map.addControl(select);
    // select.activate();
    // this.clusters.events.on({"featureselected": this.display});

    //this.map.addLayers([this.baseLayer, this.clusters]);

    var x = ( case_study[default_case].min_x + case_study[default_case].max_x ) * 0.5;
    var y = ( case_study[default_case].min_y + case_study[default_case].max_y ) * 0.5;
    var zoom = case_study[default_case].zoom;

    this.map.setCenter(
	    new OpenLayers.LonLat(x, y).transform(
	        new OpenLayers.Projection("EPSG:4326"),
	        copyThis.map.getProjectionObject()
	    ), zoom
	);

    this.tweetsHeatmapManager = new TweetsHeatmapManager();
    this.map.addLayer(this.tweetsHeatmapManager.getLayer());

	/*
	register events;
	*/
	this.map.addControl(new OpenLayers.Control.LayerSwitcher());

	this.map.events.register("moveend", copyThis.map, function(e) {
		
		Canvas_manager.instance().mapHelper.config(copyThis.map.getCenter(), e.object.zoom+1);

		$('[ng-controller="map_controller"]').scope().refresh_map();

	});

	// this.map.events.register("zoomend", copyThis.map,  function(e) {
		
	// 	$('[ng-controller="map_controller"]').scope().refresh_map(true);

	// });

	// this.map.events.register("mousemove", copyThis.map, function(e) {
	// 	var pixel = this.events.getMousePosition(e);
	// 	var lonlat = copyThis.map.getLonLatFromPixel( pixel );
	// 	var lonlatTrans = lonlat.transform(copyThis.map.getProjectionObject(), copyThis.fromProjection);

	// 	//for testing, only consider one lense;
	// 	var lense_db = Canvas_manager.instance().topic_lense_manager.lense_db;
	// 	if(lense_db.length > 0){
	// 		var rst = lense_db[0].topic_lense_data.spatial_filter(lonlat.lon, lonlat.lat, 0.0001);
	// 		console.log("spatial filtering: "+(rst.length>0?rst[0]:rst.length));
	// 	}
	// });

};

OlMapView.prototype.toggleGlyphMode = function() {
	Canvas_manager.instance().set_visibility(true);
	this.dotLayer.setVisibility(false);
	this.tweetsHeatmapManager.getLayer().setVisibility(false);
}

OlMapView.prototype.toggleHeatMapMode = function() {
	this.tweetsHeatmapManager.getLayer().setVisibility(true);
	this.dotLayer.setVisibility(false);
	Canvas_manager.instance().set_visibility(false);
}

OlMapView.prototype.toggleDotMode = function() {
	this.dotLayer.setVisibility(true);
	this.tweetsHeatmapManager.getLayer().setVisibility(false);
	Canvas_manager.instance().set_visibility(false);
}

OlMapView.prototype.toggleAllModes = function() {
	this.dotLayer.setVisibility(true);
	this.tweetsHeatmapManager.getLayer().setVisibility(true);
	Canvas_manager.instance().set_visibility(true);
}

OlMapView.prototype.getMap = function(){
	return this.map;
};

OlMapView.prototype.clear_dots = function(){
	this.dotLayer.removeAllFeatures();
}

OlMapView.prototype.render_dots = function(db){


	this.dotLayer.removeAllFeatures();
	
	var geo_arr = null;
	if (typeof db !== 'undefined') {
		geo_arr = db.select("tweet_id", "lat", "lng");
	}
	else{
		geo_arr = Canvas_manager.instance().get_lense_manager().get_geo_points();
	}

	//this.dotLayer.removeAllFeatures();

	var features_array = [];

	for(var i = 0; i < geo_arr.length; i++) {

		var point = new OpenLayers.Geometry.Point(geo_arr[i][2], geo_arr[i][1]).transform(this.fromProjection, this.toProjection);

		var feature = new OpenLayers.Feature.Vector(point);
		feature.attributes = {color: "red", opacity:0.4, radius:2};
		features_array.push(feature);
		
	}
	
	//draw bounding box;
	// if(Canvas_manager.instance().get_lense_manager().lense_db.length > 0){
	// 	var geo_bbox = Canvas_manager.instance().get_lense_manager().lense_db[0].topic_lense_data.get_geo_bbox();

	// 	var min_lng = geo_bbox.get_center().x - geo_bbox.get_extent().x;
	// 	var max_lng = geo_bbox.get_center().x + geo_bbox.get_extent().x;
	// 	var min_lat = geo_bbox.get_center().y - geo_bbox.get_extent().y;
	// 	var max_lat = geo_bbox.get_center().y + geo_bbox.get_extent().y;

	// 	pts = [[min_lng, min_lat],[min_lng, max_lat],[max_lng, min_lat],[max_lng, max_lat]];
		
	// 	for(var i = 0; i < pts.length; i++) {

	// 		var point = new OpenLayers.Geometry.Point(pts[i][0], pts[i][1]).transform(this.fromProjection, this.toProjection);

	// 		var feature = new OpenLayers.Feature.Vector(point);
	// 		feature.attributes = {color: "blue", opacity:1, radius:20};
	// 		features_array.push(feature);
			
	// 	}
	// }

	this.dotLayer.addFeatures(features_array);
	console.log("render dots map");

};

//left, right, top, bottom;
OlMapView.prototype.getGeoBound = function(){
	return this.map.getExtent().transform(this.toProjection,this.fromProjection);
};

OlMapView.prototype.getProjection = function(){
	return {from:this.fromProjection,to:this.toProjection};
};

//calculate pixel coordinates for drawing dots, reduce overlapping;
OlMapView.prototype.render_heatmap = function(){

	return;
	//var bound = this.getGeoBound();
	//var geo_arr = TweetsDataManager.instance().filter_by_geo_bound(bound.bottom, bound.top, bound.left, bound.right).select("tweet_id", "lat", "lng");
	var geo_arr = Canvas_manager.instance().get_lense_manager().get_geo_points();

	console.log("# of points for heat map: " + geo_arr.length);

	this.features = [];

	var geo_points = [];

	geo_arr.forEach(function(entry){
	
		geo_points.push({lat:entry[1], lng:entry[2], id:entry[0]});

   	});
	//var gPoint = new OpenLayers.Geometry.Point(this.geoBuffer[id].lng, this.geoBuffer[id].lat).transform(this.getProjection().from, this.getProjection().to);

	this.tweetsHeatmapManager.refreshMap(geo_points);
};

// OlMapView.prototype.reset = function() {
//     // console.log(distance);
//     this.strategy.distance = 50;
//     // this.strategy.threshold = 1;
//     this.clusters.removeFeatures(this.clusters.features);
//     this.clusters.addFeatures(this.features);
// };
            
// OlMapView.prototype.display = function(event) {
//     var f = event.feature;
//     var el = document.getElementById("output");
//     if(f.cluster) {
//         el.innerHTML = "cluster of " + f.attributes.count;
//     } else {
//         el.innerHTML = "unclustered " + f.geometry;
//     }
// };

OlMapView.prototype.addLayer = function(layer) {
	this.map.addLayer(layer);
};

OlMapView.prototype.getMapExtent = function() {
	return this.map.getExtent();
};

OlMapView.zoomLevel = case_study[default_case].zoom;
OlMapView.INTERACTION = {ZOOM_IN:0, ZOOM_OUT:1, PAN:2};
