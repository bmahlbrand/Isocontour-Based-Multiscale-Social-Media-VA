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


var globalIndex = 0;

UserStudyController.prototype.us2Generator = function(){

	var type = [ContourVis.OUTLINEMODE.STRIP, ContourVis.OUTLINEMODE.DASH, ContourVis.OUTLINEMODE.STACKLINE];
	var difficulty = [UserStudyController.DIFFMODE.EASY, UserStudyController.DIFFMODE.HARD, UserStudyController.DIFFMODE.HARD];
	var numOfCate = [2,4];
	UserStudyController.numOfCluster = 2;

	var instances = [];
	for(var i=0;i<type.length; i++)
		for(var j=0;j<difficulty.length; j++)
			for(var k=0;k<numOfCate.length; k++){

				var t = type[i];
				var d = difficulty[j];
				var n = numOfCate[k];
				instances.push([t,d,n]);
			}

	var that = this;
	//set time out;
	setInterval(function(){

		ContourVis.OUTLINE = instances[globalIndex][0];
		UserStudyController.numOfCate = instances[globalIndex][2];
		UserStudyController.difficulty = instances[globalIndex][1];

		console.log("instance "+globalIndex+" : "
						+"; numOfCate "+UserStudyController.numOfCate
						+"; numOfCluster "+UserStudyController.numOfCluster
						+"; OUTLINE "+ContourVis.OUTLINE
						+"; difficulty "+UserStudyController.difficulty);

		that.getStudy2Image(UserStudyController.numOfCate,
							UserStudyController.numOfCluster,
							UserStudyController.difficulty);

		globalIndex++;

	}, 5000);

}


//difficulty is only for two clusters;
UserStudyController.prototype.getStudy2ImageWrapper = function(){

	// UserStudyController.numOfCate = 2;
	UserStudyController.numOfCate = 4;
	UserStudyController.numOfCluster = 1;
	UserStudyController.difficulty = UserStudyController.DIFFMODE.EASY;

	//vis type;
	//ContourVis.OUTLINE = ContourVis.OUTLINEMODE.CIRCLE;
	//ContourVis.OUTLINE = ContourVis.OUTLINEMODE.STRIP;
	ContourVis.OUTLINE = ContourVis.OUTLINEMODE.DASH;
	//ContourVis.OUTLINE = ContourVis.OUTLINEMODE.STACKLINE;

	this.getStudy2Image(UserStudyController.numOfCate, UserStudyController.numOfCluster, UserStudyController.difficulty);

};

UserStudyController.prototype.getStudy2Image = function(numOfCate, numOfCluster, difficulty){

	var question = "";
	var answer = "";

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
			var scale = ( 50*Math.random() + 300 ) / Math.max(aabb.width, aabb.height);

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
			obj['category'] = UserStudyController.getCateDist(numOfCate);


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
			var targetCate = UserStudyController.cateDiffForTwo(clusters[0]['category'], clusters[1]['category'], numOfCate, difficulty);

			if(interset.length == 0 && dis > 10 && targetCate != null ){
				collision = false;
				clusterTree[0]['children'].push(clusters[0]['clusterId']);
				clusterTree[0]['children'].push(clusters[1]['clusterId']);
				clusters[0]['letter'] = "A";
				clusters[1]['letter'] = "B";
				clusterTree.push(clusters[0]);
				clusterTree.push(clusters[1]);
				answer = targetCate.join("_");
				console.log("answer: "+targetCate);
			}
		}else{

			var targetCate = UserStudyController.cateDiffForOne(clusters[0]['category'], difficulty);

			if(targetCate != null){

				collision = false;
				clusterTree[0]['children'].push(clusters[0]['clusterId']);
				clusterTree.push(clusters[0]);
				answer = targetCate;
			
			}
		}
	

	}while(collision == true);

	DataCenter.instance().reInit(zoom-1 +"_0", focusCates, tweets, clusterTree);

	$('[ng-controller="app_controller"]').scope().masterUpdate();

	setTimeout(function(){ UserStudyController.downloadImg(answer); }, 3000);

};

UserStudyController.cateDiffForOne = function(cates, difficulty){

	var values = Object.keys(cates).map(function(key){return cates[key]});
	values.sort(function(a,b){ return b-a; });

	var diff = Math.abs(values[1]/values[0]);

	if(difficulty == UserStudyController.DIFFMODE.EASY && diff >= 5/6 )
		return null;

	if(difficulty == UserStudyController.DIFFMODE.HARD && diff < 5/6 )
		return null;

	for(var key in cates)
		if(cates[key] == values[0]){
			console.log("answer:"+key);
			return key;
		}

};

UserStudyController.cateDiffForTwo = function(cate1, cate2, numOfCate, difficulty){

	var sum1 = Object.keys(cate1).map(function(key){return cate1[key]}).reduce(function(a,b){ return a+b; });
	var sum2 = Object.keys(cate2).map(function(key){return cate2[key]}).reduce(function(a,b){ return a+b; });

	var diff = {};
	var larger = {};
	for(var i=0;i<numOfCate;i++){

		por1 = cate1["c"+i] / sum1;
		por2 = cate2["c"+i] / sum2;

		diff["c"+i] = Math.abs(por1-por2);
		larger["c"+i] = por1 > por2 ? "A" : "B";
	}

	if(difficulty == UserStudyController.DIFFMODE.EASY){
		for(var cate in diff){
			if(diff[cate] >= 0.1 && diff[cate] <= 0.3){
				return [cate, larger[cate]];
			}
		}
	}
	if(difficulty == UserStudyController.DIFFMODE.HARD){
		for(var cate in diff){
			if(diff[cate] <= 0.09 && diff[cate] >= 0.02){

				return [cate, larger[cate]];
			}
		}
	}

	return null;

}

UserStudyController.downloadImg = function(answer){

	var type = "";
	if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.STRIP)
		type = "strip";
	if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.DASH)
		type = "dash";
	if(ContourVis.OUTLINE == ContourVis.OUTLINEMODE.STACKLINE)
		type = "stack";

	var difficulty = "";

	if(UserStudyController.difficulty == UserStudyController.DIFFMODE.EASY)
		difficulty = "easy";
	else
		difficulty = "hard";


	var element = $("#mapView"); // global variable
	var getCanvas; // global variable
 
    html2canvas(element, {
	    onrendered: function (canvas) {
	    	
	    	getCanvas = canvas;

	    	var imgageData = getCanvas.toDataURL("image/png");
		    // Now browser starts downloading it instead of just showing it
		    var newData = imgageData.replace(/^data:image\/png/, "data:application/octet-stream");
		    $("#btn-Convert-Html2Image").attr("download", "your_pic_name.png").attr("href", newData);

		    var doc = document.createElement('a');
			doc.setAttribute('href', newData);
			doc.setAttribute('download', 'us2_' + globalIndex + "_" + answer + "_" + type +"_" + difficulty + "_" + UserStudyController.numOfCate + "_" + UserStudyController.numOfCluster + '.png');
			doc.click();

        }
    });


};

var userStudyController = new UserStudyController();
//var userStudyController = null;


Helper = function(){
	this.polyCoords = [];
};

Helper.prototype.addCoords = function(poly){
	this.polyCoords.push(poly);
};

var helper = new Helper();

UserStudyController.cate2 = [{"c0":8, "c1":2},
							{"c0":7, "c1":3},
							{"c0":5, "c1":6},
							{"c0":5, "c1":4},
							{"c0":8, "c1":9},
							{"c0":9, "c1":10},
							{"c0":9, "c1":6},
							{"c0":3, "c1":6},
							{"c0":4, "c1":7},
							{"c0":6, "c1":7},
							];


UserStudyController.cate4 = [{"c0":2, "c1":4, "c2":6,"c3":8},
							{"c0":5, "c1":5, "c2":1,"c3":8},
							{"c0":5, "c1":6, "c2":7,"c3":4},
							{"c0":4, "c1":4, "c2":7,"c3":1},
							{"c0":6, "c1":4, "c2":5,"c3":3},
							{"c0":7, "c1":8, "c2":6,"c3":5},
							{"c0":6, "c1":8, "c2":9,"c3":7},
							];


UserStudyController.difficulty = null;
UserStudyController.DIFFMODE = {EASY:0, HARD:1};

UserStudyController.getCateDist = function(cate){

	var arr = cate == 2 ? UserStudyController.cate2 : UserStudyController.cate4;

	var engine = Random.engines.mt19937().autoSeed();
	var distribution = Random.integer(0, arr.length-1);
	function generateNaturalLessThanCates(){
  		return distribution(engine);
	}

	generateNaturalLessThanCates();
	generateNaturalLessThanCates();

	var rst = arr[generateNaturalLessThanCates()];
	return rst;
}


function getTime() {
	var date = new Date();
	thedate = date.getUTCFullYear() + "/" + date.getUTCMonth() + 1 + "/" + date.getUTCDate() + "_" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

	return thedate;
}

UserStudyController.numOfCate = -1;