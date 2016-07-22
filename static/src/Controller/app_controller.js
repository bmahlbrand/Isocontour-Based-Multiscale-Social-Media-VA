// var mapView;
var twittNavApp = angular.module('twittNavApp', []).run(function() {
	
	// mapView = new OlMapView();
   
 //    mapView.init(document.getElementById("mapView"), 1200, 600);
});

//how to call a function from a scope;
//$('[ng-controller="map_controller"]').scope().refresh_map();

// twittNavApp.controller('app_controller', function($rootScope, $scope) {

// });


// twittNavApp.controller('EMTree_controller', function($rootScope, $scope) {

// 	$scope.init = function(){
// 		$rootScope.emtree = new EMTree(EMTerms.instance().get_terms());
// 	};

// 	$scope.init();

// 	//connect tree and map;
// 	$scope.send_tree_interaction_to_map = function(){
// 		var selected_list = $rootScope.emtree.get_selected_list();
// 		var first_lense = $('[ng-controller="map_controller"]').scope().get_first_lense();

// 		if( first_lense != null){
// 			first_lense.topic_lense_data.global_to_cached(selected_list);
// 			$('[ng-controller="map_controller"]').scope().refresh_map();
// 		}
// 	};

// 	$scope.update_tree_volume = function(vol_arr){
// 		$rootScope.emtree.update_vol(vol_arr);
// 	};

// 	$scope.get_tree = function(){
// 		return $rootScope.emtree;
// 	}

// });

// twittNavApp.controller('EMTable_controller', function($rootScope, $scope) {

// 	$scope.init = function(){
// 		$rootScope.em_table = new EMTable();
// 	};

// 	$scope.init();

// 	$scope.display = function(db){
// 		$rootScope.em_table.display(db);
// 	};

// 	$scope.sort = {
// 		mode : 'time_desc'
// 	};

// 	$scope.toggleSort = function() {

// 		switch(this.sort.mode) {
// 			case 'time_desc':
// 				$rootScope.em_table.displayByMode(this.sort.mode);
// 				break;

// 			case 'summarized':
// 				$rootScope.em_table.displayByMode(this.sort.mode);
// 				break;
// 		}
// 	}
// });

// twittNavApp.controller('panel_controller', function($rootScope, $scope) {

// 	$scope.init = function(){
// 	};

// 	$scope.init();

// 	$scope.data = {
// 		glyphType: 0,
// 		displayMode: 0,
// 		showHull: true,
// 		transition: true,
// 		realtime_mode: "resume",
// 		time_window: 30
// 	};

// 	// $scope.glyph_change = function() {
// 	// 	var type = parseInt(this.data.glyphType);
// 	// 	switch(type) {
// 	// 	case 0:
// 	// 		Topic_lense.glyph_index = Topic_lense.glyph_type.TYPE_1;
// 	// 		 break;
// 	// 	case 1:
// 	// 		Topic_lense.glyph_index = Topic_lense.glyph_type.TYPE_2;
// 	// 		break;
// 	// 	case 2:
// 	// 		Topic_lense.glyph_index = Topic_lense.glyph_type.TYPE_3;
// 	// 		break;
// 	// 	}
// 	// 	Canvas_manager.instance().update();
// 	// }

// 	$scope.display_mode_change = function() {
// 		var mode = parseInt(this.data.displayMode);
// 		switch(mode) {
// 		case 0:
// 			$rootScope.mapView.toggleAllModes();
// 			break;
// 		case 1:
// 			$rootScope.mapView.toggleGlyphMode();
// 			break;
// 		case 2:
// 			$rootScope.mapView.toggleHeatMapMode();
// 			break;
// 		case 3:
// 			$rootScope.mapView.toggleDotMode();
// 			break;

// 		}
// 	}

// 	$scope.time_window_change = function(){
// 		globe.time_window = this.data.time_window;
// 	}

// 	// $scope.null_change = function(){

// 	// 	Topic_lense.enable_outline = this.data.showHull;
// 	// 	Canvas_manager.instance().update();	
// 	// }

// 	// $scope.transition_change = function(){
// 	// 	Topic_lense.enable_transition = this.data.transition;

// 	// }

// 	$scope.realtime_mode_change = function(){
// 		if( this.data.realtime_mode == "resume"){
// 			start_timing();
// 		}else if( this.data.realtime_mode == "stop"){
// 			stop_timing();
// 		}
// 	}

// });


// twittNavApp.controller('ts_controller', function($rootScope, $scope) {

// 	$scope.init = function(){
// 		$rootScope.time_series_manager = new Time_series_manager();
// 	};

// 	$scope.init();

// 	$scope.refresh_chart = function(data, start_time, end_time){
// 		$rootScope.time_series_manager.set_data(data, start_time, end_time);
// 	};

// 	$scope.get_ts = function(){
// 		return $rootScope.time_series_manager;
// 	};

// 	$scope.set_time_range_manually = function(start_time, end_time){
// 		return $rootScope.time_series_manager.set_time_range_manually(start_time, end_time);
// 	};

// });

// twittNavApp.controller('form_controller', function($rootScope, $scope, $http) {

// 	$scope.formData = {};
	
// 	$scope.processForm = function() {
		
// 		$http({
// 			method  : 'POST',
// 			url     : 'http://localhost:9000/search',
// 			data    : $.param($scope.formData),
// 			headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
// 			cache	: true
// 		})
// 		.success(function(data) {

// 			// data.forEach(function(entry){
// 			// 	TweetsDataManager.instance().insert(entry);
// 			// });

// 			// console.log(TweetsDataManager.instance().count());
			
// 			// $('[ng-controller="map_controller"]').scope().refresh_map(-1, -1);

// 		});
// 	};
// 	$scope.processForm = function() {

// 		var terms = $scope.formData.queryText.split(" ");
// 		Canvas_manager.instance().topic_lense_manager.add_topic(terms, 0);
// 	}

// });

// twittNavApp.controller('selection_controller', function($rootScope, $scope) {

// 	$scope.flag = false;
	
// 	$scope.switch_selection = function() {
		
// 		if($scope.flag == true)
// 			$rootScope.polygon_layer.activateControl();
// 		else
// 			$rootScope.polygon_layer.deactivateControl();
// 	};

// 	$scope.enable_active = false;

// 	$scope.switch_active = function() {
		
// 		if($scope.enable_active == true)
// 			Canvas_manager.instance().get_lense_manager().set_sts(Topic_lense.status.ACTIVE, 0);
// 		else
// 			Canvas_manager.instance().get_lense_manager().set_sts(Topic_lense.status.NORMAL, 0);
// 	};



// });


// twittNavApp.controller('histogram_controller', function($rootScope, $scope, $http) {

// 	$scope.init = function(){
// 		$scope.histogram = new HistogramBrush();
// 	};

// 	$scope.init();

// 	$scope.update_histogram = function(cluster_data){
		
// 		if ($scope.histogram == null)
// 			return;

// 		$scope.histogram.update(cluster_data);

// 	};

// });

twittNavApp.controller('app_controller', function($rootScope, $scope) {

	$scope.initUI = function(){

		var cates = DataCenter.instance().categories;
		cates.forEach(function(val, idx){
			
			$('#cateList').append(
				'<label><input type="checkbox" name="cates" value="'+val+'" />' 
				//+ '<span style="background-color:' + divergentColorList()[cates.indexOf(val)] + ';">'
				+ '<span style="color:#" id="' +val+ '">'
				+ val
				+ ': ' + EMCateTitle[val]
				+ '</span></label>'
			);
		});

		//set the DataCenter focus categories based on the front end selection;
		$(function() {
		     $("#cateList").multiselect(function(){

				var names = [];
				$('#cateList input:checked').each(function() {
			        names.push(this.value);
			    });
			    
				d3.select("#cateList").selectAll("span")[0].forEach(function(val){

						var index = names.indexOf(val.id);
						if( index != -1){
							d3.select("span#"+val.id).style('color', divergentColorList()[index]);
						}else{
							d3.select("span#"+val.id).style('color', "#aaa");
						}
					}
				);

			    DataCenter.instance().setFocusCate(names);
			});
		});
	};

	$scope.init = function(){

		//this array contains nodes that are inside the geo-scope of map based on the user's navigation on map.
		//this array can only be modified by the topic_lense class.
		$rootScope.activatedNodes = [];
		
		//this array contains array that is in the subtree of clicked node;
		//this array can only be modified by this class;
		//only store this root of the subtree;
		$rootScope.highlightedNodes = [];

		$scope.initUI();

	};

	$scope.init();

	/************************************activated node***************************************/
	$scope.setAcNodes = function(ns){
		$rootScope.activatedNodes = ns;
		$scope.masterUpdate();
	};

	$scope.getAcNodes = function(){
		return $rootScope.activatedNodes;
	};
	/************************************activated node***************************************/
	
	/************************************highlighted node***************************************/
	$scope.addHlNode = function(val){
		if($rootScope.highlightedNodes.indexOf(val) == -1)
			$rootScope.highlightedNodes.push(val);

		$scope.masterUpdate();
	};

	$scope.removeHlNode = function(val){
		$rootScope.highlightedNodes = $rootScope.highlightedNodes.filter(function(_val){ return val != _val; });

		$scope.masterUpdate();
	};

	$scope.getHlNodes = function(){

		var ids = [];
		$rootScope.highlightedNodes.forEach(function(val){

			var node = DataCenter.instance().getTree().getNodeById(val);
			var list = node.toList();
			var _ids = list.map(function(_val){ return _val.cluster.clusterId; });
		    ids = ids.concat(_ids);
		});
		return ids;
	};
	/************************************highlighted node***************************************/

	$scope.masterUpdate = function(){
		
		//$('[ng-controller="ScaleTreeCtrl"]').scope().update();
		$('[ng-controller="treeCanvasCtrl"]').scope().update();
		$('[ng-controller="map_controller"]').scope().update();
	};


});


twittNavApp.controller('cp_controller', function($rootScope, $scope) {

	$scope.initRange = function(min, max){

		$( "#slider-range" ).slider({
	      range: true,
	      min: min,
	      max: max,
	      values: [ min, max ],
	      slide: function( event, ui ) {
	        $( "#rangeText" ).html( "<h6>Range: " + ui.values[ 0 ] + " - " + ui.values[ 1 ] +"</h6>" );
	        DataCenter.instance().setRange(ui.values[0], ui.values[1]);
	      }
	    });

	    $( "#slider-range" ).width(80);
		$( "#slider-range" ).css('left', 30);

	};

	//init range:
	var list = DataCenter.instance().getTree().toList();
	var vol = list.map(function(val){ return val.getVol(); });
	$scope.initRange(vol.min(), vol.max());

});


twittNavApp.controller('map_controller', function($rootScope, $scope) {
	$scope.init = function(){

		//initialize map;
		$rootScope.mapView =  new OlMapView();
		$rootScope.mapView.init(document.getElementById("mapView"));
		
		/************************************************************************************/
		/*************generate multiple scale coordinates************************************/
		/********after generating the file, the server side will perform clustering**********/
		/************************************************************************************/

		// $rootScope.mapViewHelper = new OlMapViewHelper($rootScope.mapView.getMap().getCenter(), $rootScope.mapView.getMap().getZoom());
		// $rootScope.mapViewHelper.initData();
		// $rootScope.mapViewHelper.genMultiScaleCoords();
		/************************************************************************************/

		//initialize polygon selection:
		//$rootScope.polygon_layer = new PolygonLayerManager($rootScope.mapView.getMap());

		//initialize canvas manager:
		Canvas_manager.instance().init(document.getElementById("mapView"), $rootScope.mapView.getMap());

		//init dot map;
		var dotLayer = $rootScope.mapView.addDotLayer();
		$(dotLayer.div).css("pointer-events", "none")
		
	};

	$scope.init();

	//flag: true, zoom, false, pan or other interaction;
	$scope.update = function() {
	
		if (typeof $rootScope.mapView == 'undefined')
			return;
		// $rootScope.mapView.render_heatmap();
		// $rootScope.mapView.render_dots();
		
		// var clusters = $rootScope.mapView.tweetsHeatmapManager.get_clusters();
		//TweetsDataManager.instance().set_geo_clusters(clusters);

		// var cluster_dist = TweetsDataManager.instance().get_geo_cluster_dist();
		// $('[ng-controller="histogram_controller"]').scope().update_histogram(cluster_dist);
		Canvas_manager.instance().update();
	
	};

	$scope.updateGeoBbox = function(){
		Canvas_manager.instance().cv.updateGeoBbox();
	};

	$scope.getMap = function(){
		return $rootScope.mapView;
	};

	$scope.load_data = function(start, end, is_his){
		var first_lense = $scope.get_first_lense();
		var data_manager = first_lense.topic_lense_data;
		data_manager.load_data(start, end, is_his);

	};

	$scope.add_region_to_canvas = function(bounds){
		Canvas_manager.instance().add_region(bounds);
	};

	// //assume there is only one lense;
	// $scope.get_first_lense = function(){
	// 	var lense_db = Canvas_manager.instance().get_lense_manager().lense_db;
	// 	if(lense_db.length < 1)
	// 		return null;
	// 	else{
	// 		return lense_db[0];
	// 	}
	// };

	$scope.getCV = function(){
		return Canvas_manager.instance().cv;
	};

	$scope.createDummyPath = function(pts){
		return Canvas_manager.instance().cv.createDummyPath(pts);
	};

	// $scope.update_time_range = function(start_time, end_time){

	// 	var first_lense = $scope.get_first_lense();

	// 	if( first_lense != null){
	// 		first_lense.update_time_range(start_time, end_time);
	// 		$scope.refresh_map(false);
	// 	}

	// };

	// $scope.get_color_scheme = function(){

	// 	var first_lense = $scope.get_first_lense();

	// 	if( first_lense != null){
	// 		return first_lense.topic_lense_data.get_color_mapping();
	// 	}else{
	// 		alert("cannot find color mapping");
	// 		return null;
	// 	}


	// };

	// $scope.get_current_key = function(){

	// 	var first_lense = $scope.get_first_lense();

	// 	if( first_lense != null){
	// 		return first_lense.topic_lense_data.get_current_key();
	// 	}else{
	// 		alert("cannot find current key");
	// 		return null;
	// 	}
	// };

	$scope.render_dots = function(geoPts, color){
		$rootScope.mapView.render_dots(geoPts, color);
	}
	$scope.clear_dots = function(){
		$rootScope.mapView.clear_dots();
	}

	// $scope.get_color_mapping = function(key){
	// 	var default_color = "#000000";
	// 	var first_lense = $scope.get_first_lense();
	// 	if(first_lense != null)
	// 		return this.get_color_scheme()(key);
	// 	else
	// 		return default_color;
	// }

});

twittNavApp.controller('dataedit_controller', function($rootScope, $scope) {

	$scope.init = function(){

		$rootScope.dataviewer = new DataViewer();
	};

	$scope.init();

	$scope.showData = function(){
		$rootScope.dataviewer.showData();
	};

});

// /* controller for scale tree view */
// twittNavApp.controller('ScaleTreeCtrl', function($rootScope, $scope) {
	
// 	$scope.init = function(){

// 		$rootScope.stc = new ScaleTreeCanvas();
// 		$scope.update();
// 	};

// 	$scope.getScaleTreeCanvas = function(){
// 		return $rootScope.stc;
// 	};

// 	$scope.update = function(){
// 		$rootScope.stc.update();
// 	};
// 	//have getScaleTreeCanvas() defined before calling init function
// 	$scope.init();

// });

//  controller for fd tree view 
// twittNavApp.controller('FDTreeCtrl', function($rootScope, $scope) {
	
// 	$scope.init = function(){

// 		$rootScope.fdtc = new FDTreeCanvas();
// 		$scope.updateLayout();
// 	};

// 	$scope.getFDTreeCanvas = function(){
// 		return $rootScope.fdtc;
// 	};

// 	$scope.update = function(){
// 		$rootScope.fdtc.update();
// 	};

// 	$scope.updateLayout = function(){
// 		$rootScope.fdtc.updateLayout();
// 	};

// 	$scope.init();

// });

twittNavApp.controller('treeCanvasCtrl', function($rootScope, $scope) {
	
	$scope.init = function(){
		$rootScope.treeC = new TreeCanvas();
	};

	$scope.getCanvas = function(type){
		return $rootScope.treeC.getCanvas(type);
	};

	$scope.update = function(){
		$rootScope.treeC.update();
	};

	$scope.switchCanvas = function(mode){
		$rootScope.treeC.switchCanvas(mode);
	};


	$scope.init();

});



twittNavApp.controller('table_controller', function($rootScope, $scope) {

	$scope.init = function(){
		$scope.table = new EMTable();
	};

	$scope.init();

	$scope.displayMsgByClusterId = function(clusterId){

		var ids = DataCenter.instance().getTree().getNodeById(clusterId).cluster['ids'];
    	var tweets = DataCenter.instance().getTweetsByIds(ids);
		$scope.table.display(tweets);

	};

});

twittNavApp.controller('ClusterSignatureCtrl', function($rootScope, $scope) {

	$scope.init = function(){
		$scope.clusterSignatures = [];
	};

	$scope.init();

	var counter = 0;

    $scope.loadMore = function() {
        for (var i = 0; i < 5; i++) {
            //$scope.clusterSignatures.loadIndex(counter);
            $scope.clusterSignatures.push({id: counter});
            counter += 1;
        }
    };

    //$scope.loadMore();

	$scope.displayClusterSignatures = function(clusters) {

	};

	$scope.update = function() {
		var clusters = [];

		var nodes = DataCenter.instance().getTree().toList();

		for (var i = 0; i < nodes.length; i++) {
			//console.log(nodes[i].cluster);
			clusters.push(nodes[i].cluster);
			
			if (i >= 15) {
				break;
			}
		}		
		
		for (var i = 0; i < clusters.length; i++) {
			$scope.clusterSignatures.push({
				 	id: clusters[i].clusterId,
					area: ClusterSignature.instance().getArea(ClusterSignature.instance().getPointsFromTweetIds(clusters[i].hullIds)),
					volume: clusters[i].ids.length 
				});
		}
	};

	$scope.update();
});

twittNavApp.directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        var raw = elm[0];
        elm.bind('scroll', function() {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.whenScrolled);
            }
        });
    };
});

twittNavApp.directive('minimap', function () {
    return {
        restrict: 'E',
        scope: {
            data: '='
        },
        template: '<div class="myTemplate"></div>',
        link: function (scope, element, attrs) {
            // We lookup .myTemplate starting from element
            console.log(d3.select(element[0]).select('.minimap'))
        }
    };
});