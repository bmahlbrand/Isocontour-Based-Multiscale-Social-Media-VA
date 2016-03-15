OlMapViewHelper = function(){

	this.map = null;
	this.fromProjection = new OpenLayers.Projection("EPSG:4326");
	this.toProjection   = new OpenLayers.Projection("EPSG:900913");

	this.baseLayer = null;
	this.init();
};

OlMapViewHelper.prototype.init = function() {
	/*	init map:  */
	var copyThis = this;

	this.map = new OpenLayers.Map("mapViewHelper", {

					projection: new OpenLayers.Projection("EPSG:900913"),
                    displayProjection: new OpenLayers.Projection("EPSG:4326")
                });

    this.baseLayer = new OpenLayers.Layer.OSM('OSM Map');

	this.map.addLayer(this.baseLayer);

    this.map.setCenter(
	    new OpenLayers.LonLat(0,0).transform(
	        new OpenLayers.Projection("EPSG:4326"),
	        copyThis.map.getProjectionObject()
	    ), 5
	);

};

OlMapViewHelper.prototype.config = function(center, zoom){

	// this.map.setCenter(
	//     new OpenLayers.LonLat( center[0], center[1] ).transform(
	//         new OpenLayers.Projection("EPSG:4326"),
	//         copyThis.map.getProjectionObject()
	//     ), zoom
	// );

	this.map.setCenter(center, zoom);

};

OlMapViewHelper.prototype.getMap = function(){
	return this.map;
};