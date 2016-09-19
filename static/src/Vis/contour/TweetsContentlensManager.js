// Vector2 = function() { this.x = 0; this.y = 0; };

// Vector2.prototype = {
//     length : function() { return Math.sqrt(this.x * this.x + this.y * this.y); },
//     sqrLength : function() { return this.x * this.x + this.y * this.y; },
//     normalize : function() { var inv = 1/this.length(); this.x *= inv; this.y *= inv; },
//     normalizePara : function(length) { var inv = Math.sqrt(this.x*this.x+this.y*this.y)/length; if(inv != 0 ) {this.x /= inv; this.y /= inv;} },
//     negate : function() { this.x = -this.x; this.y = -this.y; },
//     scale: function(scale) { this.x *= scale; this.y *= scale; return this},
//     setVect : function(v) { this.x = v.x; this.y = v.y; },
//     set : function(x,y) {this.x = x; this.y = y; },
//     add : function(v) { this.x += v.x; this.y += v.y; },
// 	sub : function(v) { this.x -= v.x; this.y -= v.y; },
//     multiply : function(f) { this.x *= f, this.y *= f; },
//     rotateLeft : function() { var tmpx = this.x ; var tmpy = this.y ; this.x = 0.707*tmpx + 0.707*tmpy ; this.y = 0.707*tmpx - 0.707*tmpy ;},
//     rotateRight : function() { var tmpx = this.x ; var tmpy = this.y ; this.x = 0.707*tmpx - 0.707*tmpy ; this.y = 0.707*tmpx + 0.707*tmpy ;},
//     returnX : function() {return this.x; },
//     returnY : function() {return this.y; }, 
//     divide : function(f) { var invf = 1/f; this.x *= invf; this.y *= invf; },
//     dot : function(v) { return this.x * v.x + this.y * v.y; },
//     toString: function() { var output="[ "+this.x+", "+this.y+" ]"; return output;},
//     dist: function(v) { var tx = v.x - this.x ; var ty = v.y - this.y ; return Math.sqrt(tx * tx + ty * ty)  }
// };

Box = function(){
	this.center = new Vector2();
	this.extents = new Vector2();
};

Box.prototype = {
	set: function(center,extents) { this.center = center; this.extents = extents; },
	setSep: function(cx,cy,ex,ey) { this.center.x = cx; this.center.y = cy; this.extents.x = ex; this.extents.y = ey; },
	setCenter: function(cx,cy) { this.center.x = cx; this.center.y = cy;},
	setBox: function(b) {this.center = b.center; this.extents = b.extents;},
	intersects: function(box) {
		var retVar = false;
		tmpVect = new Vector2();
		tmpVect.setVect(box.center);
		tmpVect.sub(this.center);
		retVar = ( Math.abs( tmpVect.x ) <= ( this.extents.x + box.extents.x ) ) && ( Math.abs( tmpVect.y ) <= ( this.extents.y + box.extents.y ) );
		return retVar;
	},
	contains: function(point){
		var retVar = false;

		tmpVect = new Vector2();
		tmpVect.setVect(point);
		tmpVect.sub(this.center);
		tmpVect.x = Math.abs( tmpVect.x );
		tmpVect.y = Math.abs( tmpVect.y );
		if( tmpVect.x < this.extents.x && tmpVect.y < this.extents.y ) {
			retVar = true;
		}
		return retVar;
	},
	containsLink: function(point){
		var retVar = false;

		tmpVect = new Vector2();
		tmpVect.setVect(point);
		shift = new Vector2();
		shift.set(0,this.extents.y-10);
		shift.add(this.center);
		tmpVect.sub(shift);
		tmpVect.x = Math.abs( tmpVect.x );
		tmpVect.y = Math.abs( tmpVect.y );
		if( tmpVect.x < this.extents.x && tmpVect.y < 15 ) {
			retVar = true;
		}
		return retVar;		
		
		
	},
	
	toString: function(){
		var output = "box[ Center" + this.center.toString() + ", Extents" + this.extents.toString() + " ]";
		return output;
	}
	
};





TweetsContentlensManager = function(map, DBmanager){
	this.layer = new OpenLayers.Layer.Vector("Tweets Contentlens Layer", {
                styleMap: new OpenLayers.StyleMap({'default':{
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.2,
                    strokeWidth: 3,
                    fillColor: "#FF0000",
                    fillOpacity: 0.5,
                    //pointRadius: 6,
                    //pointerEvents: "visiblePainted",
                    label : "${name}",
                    fontColor: "${favColor}",
                    fontSize: "${fontsize}",
                    fontFamily: "Tahoma, Geneva, sans-serif",
                    //fontWeight: "bold",
                    labelAlign: "${align}",
                    labelOutlineColor: "white",
                    labelOutlineWidth: 2
                }})//,
                //renderers: renderer
            });
	
	this.multiContentlensLayer = new Array();
	this.map = map;
	this.contentlensLock = false;
	this.const_maxFont = 20;
	this.const_minFont = 16;
	this.fontUnitWidth = new Array(50);
	this.fontUnitHeight = new Array(50);
	this.manualFontSize();
	this.radius = 30;
	this.DBmanager = DBmanager;
	this.wordsNumber = 15;
	this.fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984; describe latitude/longitude coordinates;
	this.toProjection   = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection; describe coordinates in meters in x/y;
		
	//this.initFontSize("Arial",5,30);
}

TweetsContentlensManager.prototype = {
	stateInLayerSwitcher: function(flag){
		this.layer.displayInLayerSwitcher = flag;
	},
	getLayer: function(){
		return this.layer;
	},
	addMultiContentlens: function(){
		
		if(this.layer.features.length <= 1){ 
			this.layer.removeAllFeatures();
			return false;
		}
		if(this.multiContentlensLayer.length >= 3){
			//this.layer.removeAllFeatures();
			return false;
		}
		
		
		this.setContentlensLock(true);
		
		try{
			var newLayer = new OpenLayers.Layer.Vector("Tweets Mulcontentlens Layer"+this.multiContentlensLayer.length, {
					styleMap: new OpenLayers.StyleMap({'default':{
						strokeColor: "#FF0000",
						strokeOpacity: 0.2,
						strokeWidth: 3,
						fillColor: "#FF0000",
						fillOpacity: 0.5,
						//pointRadius: 6,
						//pointerEvents: "visiblePainted",
						label : "${name}",
						
						fontColor: "${favColor}",
						fontSize: "${fontsize}",
						fontFamily: "Tahoma, Geneva, sans-serif",
						//fontWeight: "bold",
						labelAlign: "${align}",
						labelOutlineColor: "white",
						labelOutlineWidth: 2
					}})//,
					//renderers: renderer
				});
			
			for(t=0; t< this.layer.features.length; t++){
				
				if(t == 0)
					newLayer.addFeatures([this.layer.features[0]]);
				else{
				
					var point = new OpenLayers.Geometry.Point(this.layer.features[t].geometry.x, this.layer.features[t].geometry.y);
					var feature_point = new OpenLayers.Feature.Vector(point);
						
					feature_point.attributes = {
						name: this.layer.features[t].attributes.name,
						favColor: 'blue',
						fontsize: this.layer.features[t].attributes.fontsize,
						align: "cb"
					};
			
					newLayer.addFeatures([feature_point]);
				}
			}
			
			//newLayer.addFeatures(this.layer.features);
			
			this.multiContentlensLayer.push(newLayer);
			this.map.addLayer(newLayer);
			
		}catch(err){
			//alert(err);
			return false;
		}finally{
			this.layer.removeAllFeatures();
			this.setContentlensLock(false);
			return true;
		}
		
	},
	refreshMulContentlens: function(){

		var map = this.map;
		
		if(this.multiContentlensLayer.length <= 0) return;
		
		var preMulContentlens = this.multiContentlensLayer;
		this.multiContentlensLayer = new Array();
		
		for(var t=0;t<preMulContentlens.length;t++){
			
			this.map.removeLayer(preMulContentlens[t]);
			
			var lonlat = preMulContentlens[t].features[0].attributes.description.split(" ");
			
			var tmpPoint = new OpenLayers.Geometry.Point(parseFloat(lonlat[0]), parseFloat(lonlat[1])).transform(this.fromProjection, this.toProjection);
			var tt = map.getPixelFromLonLat(new OpenLayers.LonLat(tmpPoint.x,tmpPoint.y));
			
			this.renderbyPixelCoordinates(tt.x, tt.y);
			this.addMultiContentlens();
				
		}
		
		this.layer.removeAllFeatures();
		
	},
	deleteMulContentlens: function(pix,piy){

		var map = this.map;

		for(var t=this.multiContentlensLayer.length-1; t>=0; t--){
			
			var lonlat = this.multiContentlensLayer[t].features[0].attributes.description.split(" ");
			
			var tmpPoint = new OpenLayers.Geometry.Point(parseFloat(lonlat[0]), parseFloat(lonlat[1])).transform(this.fromProjection, this.toProjection);
			var tt = map.getPixelFromLonLat(new OpenLayers.LonLat(tmpPoint.x,tmpPoint.y));
			
			if ((pix-tt.x)*(pix-tt.x) + (piy-tt.y)*(piy-tt.y) < parseFloat(this.radius)*parseFloat(this.radius) ){
				
				this.multiContentlensLayer[t].removeAllFeatures();
				this.map.removeLayer(this.multiContentlensLayer[t]);
				
				var tmp = this.multiContentlensLayer[t];
				this.multiContentlensLayer[t] = this.multiContentlensLayer[this.multiContentlensLayer.length-1];
				this.multiContentlensLayer[this.multiContentlensLayer.length-1] = tmp;
				this.multiContentlensLayer.pop();
				
			}
		}
		
		
		
	},
	renderbyPixelCoordinates: function(pix, piy){

		var map = this.map;
		
		var pixel = new Object();
		pixel.x = pix;
		pixel.y = piy;
		
		var lonlat = map.getLonLatFromPixel( pixel );
		var lonlatTransf = lonlat.transform(this.map.getProjectionObject(), this.fromProjection);
		
		var PixelB = new Object();
		PixelB.x = pixel.x + parseInt(this.radius);
		PixelB.y = pixel.y + parseInt(this.radius);
				
		var lonlatB = map.getLonLatFromPixel( PixelB );
		var lonlatTransfB = lonlatB.transform(this.map.getProjectionObject(), this.fromProjection);
		
		// var bbox = new Box();
		// bbox.setSep(lonlatTransf.lat, lonlatTransf.lon, Math.abs(lonlatTransf.lat - lonlatTransfB.lat), Math.abs(lonlatTransf.lon - lonlatTransfB.lon));
		
		//var filteredArray = this.DBmanager.retrieveDataByBBox(bbox);
		
		// var filteredArray = [
		// 						"aaa bbb ccc ddd",
		// 						"aaa bbb eee fff",
		// 						"aaa hhh jjj kkk"
		// 					];
		var filteredArray = $('[ng-controller="map_controller"]').scope().getMap().getFilteredArray(pix, piy);

		this.renderContentlens(lonlatTransf.lat, lonlatTransf.lon, pixel.x, pixel.y, this.wordsNumber, filteredArray);
		
	},
	setContentlensLock: function(bool){
		this.contentlensLock = bool;
	},
	getLock: function(){
		return this.contentlensLock;
	},
	renderContentlens: function(lat, lon, pixelx, pixely, wordsNumber, filteredArray){

		var map = this.map;
		
		try{
			this.layer.removeAllFeatures();
		
			var tmpPoint = new OpenLayers.Geometry.Point(lon, lat).transform(this.fromProjection, this.toProjection);
				
			var featurePoint = new OpenLayers.Feature.Vector(
  				 	tmpPoint,
    				{ description: lon+" "+lat },
    				{ externalGraphic: 'img/search.png', graphicHeight: 60, graphicWidth: 60, graphicXOffset: -30, graphicYOffset: -30 }
			);
			
			this.layer.addFeatures([featurePoint]);
			
			if(filteredArray.length <= 0){
				throw "no data available";
			}
			
			var words = new Object();
			var count = new Array();
				
			var patt = new RegExp(/[a-zA-Z0-9]/gi);
			
			//computation of contentlens;
			if( filteredArray.length != 1){
				for(k = 0; k < filteredArray.length; k++){
						
					var tmpArray = filteredArray[k].split(" ");
					
					for(j = 0; j < tmpArray.length; j++){
						
						//if(tmpArray[j].indexOf("@") != -1) continue;
						
						/*if(tmpArray[j].indexOf("#") == 0)
							tmpArray[j] = tmpArray[j].substring(1,tmpArray[j].length);*/
						
						if(tmpArray[j].indexOf("@") == 0)
							continue;
						
						if(!patt.test(tmpArray[j]))
							continue;

						if( tmpArray[j] in words ){
							words[tmpArray[j]] = words[tmpArray[j]] + 1;
						}else{
							words[tmpArray[j]] = 1;
						}
					}
				}
			}else{
				words[filteredArray[0]] = 1;
			}
				
			
			
			var sortArray = new Array();
				
			for (var key in words) {	 
				 sortArray.push({key:key, value:words[key]});
			}
				
			sortArray.sort(function(a,b){return b.value-a.value});
				
			var sortedWords = new Array();
			var sortedWordsFont = new Array();
			var maxValue = sortArray[0].value;
				
			if(sortArray.length < wordsNumber) wordsNumber = sortArray.length;
			var minValue = sortArray[wordsNumber-1>0?wordsNumber-1:0].value;

			//test:
			var strTest = "";
			for(test = 0; test<wordsNumber; test++){
				strTest += sortArray[test].key + " " + sortArray[test].value + " ";
			}
			/*console.log(strTest);*/
			
			for(k = 0; k < wordsNumber; k++){
					
				sortedWords.push(sortArray[k].key);
				if(maxValue != minValue)
					sortedWordsFont.push(Math.floor( (sortArray[k].value - minValue) / (maxValue - minValue) * (this.const_maxFont - this.const_minFont) + this.const_minFont));
				else
					sortedWordsFont.push((this.const_minFont+this.const_maxFont)/2);
				//alert(sortedWordsFont[k]);
			}
				
				//compute layout;
			var wordsBBox = new Array();
			for(k=0; k<sortedWordsFont.length; k++){
				var tt = new Box();
				tt.setSep(0, 0, this.fontUnitWidth[sortedWordsFont[k]] * sortedWords[k].length * 0.5, this.fontUnitHeight[sortedWordsFont[k]] * 0.5);
				wordsBBox.push(tt);
			}
				
			this.contentlensLayoutFunc(wordsBBox, pixelx, pixely);
			//visualize begins
			for(k = 0; k < sortedWords.length; k++) {
				
				//var tk = sortedWords.length - 1- k;
				//var pixel = new OpenLayers.Pixel(pixelx+contentlensLayout.offsetX[tk],pixely+contentlensLayout.offsetY[tk]);
				var tk = k;
				var pixel = new OpenLayers.Pixel(wordsBBox[k].center.x,wordsBBox[k].center.y);
		
				var lonlat = map.getLonLatFromPixel(pixel);
				var lonlatTransf = lonlat.transform(map.getProjectionObject(), this.fromProjection);
				
			  	var point = new OpenLayers.Geometry.Point(lonlatTransf.lon, lonlatTransf.lat).transform(this.fromProjection, this.toProjection);
				var feature_point = new OpenLayers.Feature.Vector(point);
		    		
		    	feature_point.attributes = {
        	       	name: sortedWords[tk],
        	       	favColor: 'blue',
          	     	fontsize: sortedWordsFont[tk],
                	align: "cb"
       	   		};
		
				this.layer.addFeatures([feature_point]);
			}
		
		
		}catch(err){
			//alert(err);
		
		}finally{
			this.setContentlensLock(false);
		}
	},
	contentlensLayoutFunc: function(BBox, pixelx, pixely){
		
		for(t = 0; t < BBox.length; t++){
		
			// setup
			var angle = -90.0;
			var steps = 360;
			var out = 1;
			var tForward = 10;
			var radius = 45;
			var i = 0;
			var collision = "t";
			while (i < steps && collision == "t") {
			
				collision = "f";
				var px = pixelx + Math.cos(angle*Math.PI/180.0) * radius;
				var py = pixely + Math.sin(angle*Math.PI/180.0) * radius;
			
				BBox[t].setCenter(Math.floor(px),Math.floor(py));
				//alert(t+" "+BBox[t])
			
				for(tt = 0; tt < BBox.length; tt++){
				
					if( t == tt) continue;
				
					if (BBox[t].intersects(BBox[tt])) {
						collision = "t";
						break;
					}
				}
			
				angle += tForward;
				radius += out;
				i++;
			}
		}
		
	},
	clearFeatures: function(){
		this.layer.removeAllFeatures();
	},
	initFontSize: function(fontName, fontSizeMin, fontSizeMax){
	
		for(t=fontSizeMin;t<=fontSizeMax;t++){
		
		var textParam = t + "px " + fontName;
	
		var svg = d3.select("body").append("svg:svg");
		var text = svg.append("svg:text")
  	 				  .style("opacity", 0)
		              .style("font", textParam)
   	 	              .text("H");

		var bbox = text.node().getBBox();
	
		this.fontUnitWidth[t] = Math.floor(bbox.width);
		this.fontUnitHeight[t] = Math.floor(bbox.height);
		//alert("font"+this.fontUnitWidth[t]+" "+this.fontUnitHeight[t]);
		d3.select("svg").remove();
	
		//alert(t+" "+this.fontUnitWidth[t]+" "+this.fontUnitHeight[t]);
		}
	
	},
	manualFontSize: function(){
		this.fontUnitWidth[5] = 4;
		this.fontUnitHeight[5] = 6;
		this.fontUnitWidth[6] = 4;
		this.fontUnitHeight[6] = 6;
		this.fontUnitWidth[7] = 5;
		this.fontUnitHeight[7] = 7;
		this.fontUnitWidth[8] = 6;
		this.fontUnitHeight[8] = 10;
		this.fontUnitWidth[9] = 7;
		this.fontUnitHeight[9] = 12;
		this.fontUnitWidth[10] = 7;
		this.fontUnitHeight[10] = 13;
		this.fontUnitWidth[11] = 7;
		this.fontUnitHeight[11] = 14;
		this.fontUnitWidth[12] = 9;
		this.fontUnitHeight[12] = 15;
		this.fontUnitWidth[13] = 9;
		this.fontUnitHeight[13] = 16;
		this.fontUnitWidth[14] = 9;
		this.fontUnitHeight[14] = 16;
		this.fontUnitWidth[15] = 10;
		this.fontUnitHeight[15] = 17;
		this.fontUnitWidth[16] = 11;
		this.fontUnitHeight[16] = 18;
		this.fontUnitWidth[17] = 11;
		this.fontUnitHeight[17] = 19;
		this.fontUnitWidth[18] = 13;
		this.fontUnitHeight[18] = 21;
		this.fontUnitWidth[19] = 13;
		this.fontUnitHeight[19] = 22;
		this.fontUnitWidth[20] = 13;
		this.fontUnitHeight[20] = 23;
		this.fontUnitWidth[21] = 14;
		this.fontUnitHeight[21] = 24;
		this.fontUnitWidth[22] = 16;
		this.fontUnitHeight[22] = 25;
		this.fontUnitWidth[23] = 17;
		this.fontUnitHeight[23] = 26;
		this.fontUnitWidth[24] = 17;
		this.fontUnitHeight[24] = 27;
		
	}
};