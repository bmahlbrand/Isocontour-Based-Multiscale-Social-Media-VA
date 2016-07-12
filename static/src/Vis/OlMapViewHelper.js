OlMapViewHelper = function(center, zoom){

	this.maps = [];

	this.baseLayer = null;
	this.init(center, zoom);

};

OlMapViewHelper.prototype.init = function(center, zoom) {

	//create div;
	for(var i=OlMapViewHelper.startLevel; i<=OlMapViewHelper.endLevel; i++){

		//<div id="mapViewHelper" style="height:2048px;width:2048px;position:absolute;display:none;"></div>
		var m = $("<div>", { id: 'mapViewHelper'+ (zoom+i) });

		var width = OlMapViewHelper.baseSize * Math.pow(2, i);
		
		m.height(width);
		m.width(width);
		m.css("position","absolute");
		m.css("display", "block");
		m.css("z-index", 100-(zoom+i));

		$("body").append(m);
	
	}

	//create map;
	for(var i=OlMapViewHelper.startLevel; i<=OlMapViewHelper.endLevel; i++){

		var map = new OpenLayers.Map("mapViewHelper"+(zoom+i), {
						projection: new OpenLayers.Projection("EPSG:900913"),
	                    displayProjection: new OpenLayers.Projection("EPSG:4326")
	                });

	    var baseLayer = new OpenLayers.Layer.OSM('OSM Map');

		map.addLayer(baseLayer);

	    map.setCenter(
		    center, 
		    zoom + i
		);

	    this.maps.push(map);
	}

};

OlMapViewHelper.prototype.getMap = function(){
	return this.map;
};

OlMapViewHelper.fromProjection = new OpenLayers.Projection("EPSG:4326");
OlMapViewHelper.toProjection   = new OpenLayers.Projection("EPSG:900913");
OlMapViewHelper.baseSize = 1024;

OlMapViewHelper.prototype.genMultiScaleCoords = function(tweets, name){

	var that = this;
	var layers = [];

	this.maps.forEach(function(map){

		var layer = {zoom:map.getZoom()};

		var pts = [];
		
		tweets.forEach(function(t){
			var pt = map.getViewPortPxFromLonLat(new OpenLayers.LonLat(t.lon, t.lat).transform("EPSG:4326", "EPSG:900913"));
			pts.push([t.tweet_id, Math.floor(pt.x), Math.floor(pt.y)]);
		});

		layer.pts = pts;
		layers.push(layer);

		console.log('level '+map.getZoom()+' loaded');
	});

	var output = JSON.stringify(layers);

	// var element = document.createElement('a');
	// element.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURI(output));
	// element.setAttribute('download', name);
	// element.click();
	download(output, name, 'application/json');

};