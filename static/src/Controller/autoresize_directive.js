twittNavApp.directive('autoresize', 
	function($window) {  
	return function($scope) {  
		$scope.initializeWindowSize = function() {  
			$scope.maxHeight = Math.max(  
		 		document.body.scrollHeight, document.documentElement.scrollHeight,  
		 		document.body.offsetHeight, document.documentElement.offsetHeight,  
		 		document.body.clientHeight, document.documentElement.clientHeight,  
		 		window.innerHeight  
			);
			
			$scope.windowHeight = $window.innerHeight;  
			return $scope.windowWidth = $window.innerWidth;  
		};
	
		// $scope.initializeWindowSize(); 

		$scope.$watch(function() {
			return $window.innerHeight;
		}, function(newHeight, oldHeight) { 
			// console.log("height");
			// console.log(newHeight + " , " + oldHeight);
			$scope.initializeWindowSize();
		});

		$scope.$watch(function() {
			return $window.innerWidth;
		}, function(newWidth, oldWidth) {
			// console.log("width");
			// console.log(newWidth + " , " + oldWidth);
			$scope.initializeWindowSize();
		});
		
		return angular.element($window).bind('resize', function() {  
			$scope.initializeWindowSize();  
			$('[ng-controller="map_controller"]').scope().update();
			return $scope.$apply();  
		});  
	};  
});