PolygonLayerManager = function(map){
	
	this.map = map;

	this.layer = new OpenLayers.Layer.Vector("Polygon Layer");
	this.control = new OpenLayers.Control.DrawFeature(this.layer, OpenLayers.Handler.RegularPolygon, {handlerOptions: {sides: 40}, featureAdded: this.spatialSelection });

	this.map.addLayer(this.layer);
	this.map.addControl(this.control);

}

PolygonLayerManager.prototype = {
	getLayer: function(){
		return this.layer;	
	},
	getControl: function(){
		return this.control;
	},
	spatialSelection: function(event){
		
		var fromProjection = new OpenLayers.Projection("EPSG:4326"); // Transform from WGS 1984; describe latitude/longitude coordinates;
		var toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection; describe coordinates in meters in x/y;
			
		var bounds = (event.geometry.transform(toProjection, fromProjection)).getVertices();
		
		if(bounds.length <= 2) { alert("error polygon"); return; }
		
		try{
			//need to add time range;
			$('[ng-controller="map_controller"]').scope().add_region_to_canvas(bounds);

		}catch(err){
			console.error(err);
		}finally{
			this.layer.removeAllFeatures();
		}
	},
	activateControl: function(){
		this.control.activate();
	},
	deactivateControl: function(){
		this.control.deactivate();
	},
	clearLayer: function(){
		this.layer.removeAllFeatures();
	}
	
};