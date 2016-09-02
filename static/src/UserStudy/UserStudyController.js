UserStudyController = function(){

};

UserStudyController.prototype.genMapCenter = function(){
	var region = us_regions[Math.floor(Math.random()*us_regions.length)];
	var lon = (region.maxlon - region.minlon)*Math.random() + region.minlon;
	var lat = (region.maxlat - region.minlat)*Math.random() + region.minlat;
	
	var lon = (region.maxlon + region.minlon)*0.5;
	var lat = (region.maxlat + region.minlat)*0.5;

	return [lon, lat];

};

UserStudyController.prototype.genZoom = function(){
	return Math.floor(Math.random()*5+8);
};

UserStudyController.prototype.getStudy2ImageWrapper = function(){

	var numOfCate = 3;
	var numOfCluster = 1;

	//vis type;
	//ContourVis.OUTLINE = ContourVis.OUTLINEMODE.CIRCLE;
	ContourVis.OUTLINE = ContourVis.OUTLINEMODE.STRIP;
	// ContourVis.OUTLINE = ContourVis.OUTLINEMODE.DASH;
	// ContourVis.OUTLINE = ContourVis.OUTLINEMODE.STACKLINE;

	this.getStudy2Image(numOfCate, numOfCluster);


};

UserStudyController.prototype.getStudy2Image = function(numOfCate, numOfCluster){

	var map = $('[ng-controller="map_controller"]').scope().getMap();
	var center = this.genMapCenter();
	var zoom = this.genZoom();
	map.moveTo(center[0], center[1], zoom);
	OlMapView.zoomLevel = zoom;

	//category;
	var focusCates = [];
	for(var ii=0;ii<numOfCate;ii++)
		focusCates.push("c"+ii);

	var clusterTree = [];
	//create a dummy node for root, do not visualize this root;
	var obj = {};
	obj['zoom'] = zoom-1;
	obj["clusterId"] = zoom-1 +"_0";
	obj['children'] = [];
	obj['hullIds'] = [];
	obj['ids'] = [0];
	clusterTree.push(obj);

	var tweets = [];
	var tweetIndex = 0;

	var collision = true;
	do{

		var clusters = [];

		for(var k=0;k<numOfCluster;k++){

			var poly = us_polys[Math.floor(Math.random()*us_polys.length)];

			//normalize poly;
			var aabb = PolyK.GetAABB(poly);
			var scale = (128*Math.random() + 128 ) / Math.max(aabb.width, aabb.height);

			var randomCenter = [512 + (Math.random()-0.5)*200,512 + (Math.random()-0.5)*200];

			var normalizedPoly = poly.map(function(val,i){
				if(i%2==0){
					//x axis:
					return (val-(aabb.x+aabb.width*0.5))*scale + randomCenter[0];
				}else{
					//y axis:
					return (val-(aabb.y+aabb.height*0.5))*scale + randomCenter[1];
				}
			});
			
			var obj = {};
			obj['zoom'] = zoom;
			obj["clusterId"] = zoom +"_"+k;
			obj['children'] = [];
			obj['hullIds'] = [];
			obj['ids'] = [];
			obj['bound'] = [];

			// obj['category'] = {"c0":10, "c1":20, "c2":30, "c3":10, "c4":50};
			obj['category'] = UserStudyController.cate3[Math.floor(Math.random()*UserStudyController.cate3.length)];


			for(var i=0; i<normalizedPoly.length/2; i++){

				var px = {x:normalizedPoly[2*i], y:normalizedPoly[2*i+1]};
				
				tweets.push({tweet_id:tweetIndex, lon:px.x, lat:px.y});
				obj['bound'].push([px.x, px.y]);

				obj['hullIds'].push(tweetIndex);
				obj['ids'].push(tweetIndex);
				tweetIndex++;
			}

			// clusterTree[0]['children'].push(zoom +"_"+k);
			// clusterTree.push(obj);
			clusters.push(obj);

		}

		if(numOfCluster == 2){
			var interset = intersectPolyWrapper(clusters[0]['bound'], clusters[1]['bound']);
			var dis = shortestDis(clusters[0]['bound'], clusters[1]['bound']);
			if(interset.length == 0 && dis > 10 ){
				collision = false;
				clusterTree[0]['children'].push(clusters[0]['clusterId']);
				clusterTree[0]['children'].push(clusters[1]['clusterId']);
				clusterTree.push(clusters[0]);
				clusterTree.push(clusters[1]);
			}
		}else{

			clusterTree[0]['children'].push(clusters[0]['clusterId']);
			clusterTree.push(clusters[0]);
		}
	

	}while(numOfCluster > 1 && collision == true);

	DataCenter.instance().reInit(zoom-1 +"_0", focusCates, tweets, clusterTree);

	$('[ng-controller="app_controller"]').scope().masterUpdate();
	

};

var userStudyController = new UserStudyController();
// var userStudyController = null;


Helper = function(){
	this.polyCoords = [];
};

Helper.prototype.addCoords = function(poly){
	this.polyCoords.push(poly);
};

var helper = new Helper();

UserStudyController.cate2 = [{"c0":9, "c1":1},
							{"c0":8, "c1":2},
							{"c0":7, "c1":3},
							{"c0":6, "c1":4},
							{"c0":5, "c1":5},
							{"c0":4, "c1":6},
							{"c0":3, "c1":7},
							{"c0":2, "c1":8},
							{"c0":1, "c1":9}];


UserStudyController.cate3 = [{"c0":9, "c1":1, "c2":2},
							{"c0":8, "c1":2, "c2":2},
							{"c0":7, "c1":3, "c2":3},
							{"c0":6, "c1":4, "c2":4},
							{"c0":5, "c1":5, "c2":5},
							{"c0":4, "c1":6, "c2":4},
							{"c0":3, "c1":7, "c2":3},
							{"c0":2, "c1":8, "c2":2},
							{"c0":1, "c1":9, "c2":2}];