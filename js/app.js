/******************************************************/
//	Author	: Nick Angelo
//	Date	: 23 January 2016
//	Title	: app.js
//	Desc	: the main file for our app
//
/******************************************************/
(function() {
	// declare our app, be sure to include the angluar-md5 dependency for hashing
	var app = angular.module('marvelApp', ['angular-md5']);

	// create a controller for the search bar
	// necessary dependencies:
	//	$http - used for our HTTP requests to the API
	//	$scope - used to access values from our HTML view
	//	$interval - used for our loading timeout. using the vanilla setInterval method doesn't inform Angular when a value changes
	//	$sce - used to safely inject HTML into our view
	// 	md5 - this an angular extension for calculating an md5 hash: js/angular-md5.js
	//	
	app.controller('SearchController', ['$http', '$scope', '$interval', '$sce', 'md5', function($http, $scope, $interval, $sce, md5) {
		// define constants for our API requests
		var publicKey 	= "548f23754ff1e6394f93d1382c5c176e";
		var privateKey 	= "35fd068b1f72818f3225e3df05e400b21291b9e6";
		var endpoint	= "https://gateway.marvel.com/";
		// create a psuedo timestamp. using the current date,
		// will allow us to use the caching properties of $http so 
		// that we can limit the requests to the API each day
		var today = new Date();
		// timestamp format: (int) DDMMYY 
		var timestamp	= (today.getDate()*10000) + (today.getMonth()*100) + today.getYear();
		// as per the API requirements, a MD5 hash of timestamp + privateKey + publicKey must be sent
		var hash		= md5.createHash(timestamp+privateKey+publicKey);

		// declare an empty array for the search results
		$scope.resultsArray = [];

		// ensure that the Advanced Options are initialized properly
		$scope.advSort = "name";
		$scope.advLimit = null;

		// the marvelAPI.getCharacter() method
		// used to search for a character based on user input
		// to preserve our daily API requests, use the $http
		// object with caching enabled
		this.getCharacter = function () {
			// the marvelAPI can search for the characters
			// use the name to make a search using the API
			// create the proper GET request using the angular $http object
			// first, prepare the proper url with the specified name
			if(!$scope.searchText)
				return;
			// we have a valid search value, show the Loading... message
			$scope.resultsText = "Loading...";
			// create the URL for our GET request. note, we are using the nameStartsWith
			// field instead of name so that we get a list of characters close to what 
			// the user entered
			// NOTE: there are some weird bugs with the API
			// i.e. searching for "Wolverine" returns nothing when only using the nameStartsWith field
			var url = endpoint + "v1/public/characters?nameStartsWith=" + $scope.searchText;
			// check the current status of the Advanced Options.
			// if the check box is enabled, grab any values and put them in with the 
			// API request
			if($scope.advancedOptions) {
				if($scope.advSort)
					url = url + "&orderBy="+$scope.advSort;
				if($scope.advLimit)
					url = url + "&limit="+$scope.advLimit;
			}
			// now, ensure that we add our API public key to the request
			url = url + "&ts=" + timestamp + "&apikey=" + publicKey + "&hash=" + hash;
			// ensure that the URL is properly encoded
			url = encodeURI(url);
			// clear out the current result data
			$scope.resultsArray = [];
			// create a setTimeout method to cycle the Loading message until we get a response
			// Loading
			// Loading.
			// Loading..
			// Loading...
			var loadingAnimation = {
				frames:		["Loading", "Loading.", "Loading..", "Loading..."],
				curFrame:	0
			}
			
			var loadingMsg = $interval( function() {
				// set the text equal to the current frame
				$scope.resultsText = loadingAnimation.frames[loadingAnimation.curFrame];
				// increment the current frame
				loadingAnimation.curFrame = (++loadingAnimation.curFrame)%4;
			}, 250);
			// now, prepare the HTTP request with the angular $http service
			
			$http({
				method: "GET",
				url: 	url,
				cache:  true, 
				// on success, use the data somehow
			}).then(function successCallback(response) {
				// cool, we got a response
				// stop our loading Timeout
				$interval.cancel(loadingMsg);
				// first, let's check the amount of hits we got
				console.log(response);
				var result = response.data;
				if(result.data.count && result.data.count>0) {
					var txt;
					if(result.data.count===1)
						txt = " result found!";
					else
						txt = " results found!";

					$scope.resultsText = result.data.count + txt;
					// clear out the resultsArray before we fill it back up with data
					for(var i=0; i<result.data.count; i++) {
						// build the object for the results list items
						var current = result.data.results[i];
						var obj = {
							name: 			decodeURI(current.name),
							image: 			current.thumbnail.path + "/standard_medium." + current.thumbnail.extension,
							description: 		$sce.trustAsHtml(current.description),
							detailURL:		null,
							wikiURL:		null,
							comicURL:		null
						};

						// ew, I don't like this nested loop, but I can't think of a better
						// way to get the data to Angular while allowing it to use ng-show
						// on the separate elements. I guess worst case is only 3 iterations...

						// check the status of the URLs available for this object, and
						// add them to the object if they are defined
						for(var j=0; j<current.urls.length; j++) {
							if(current.urls[j].type === "detail")
								obj.detailURL = current.urls[j].url;
							else if(current.urls[j].type === "wiki")
								obj.wikiURL = current.urls[j].url;
							else if(current.urls[j].type === "comiclink")
								obj.comicURL = current.urls[j].url;
						}

						$scope.resultsArray.push(obj);
					}

					// there is some attriubtion information we get back, that we have to display
					$scope.marvelAttribution = result.attributionText;
				}
				else {
					$scope.resultsText = "No results found. Please try a different search term...";
				}
				
			}, 
			// if it fails, execute the error callback
			function errorCallback(response) {
				// an error is still a response, stop our loading timeout
				$interval.cancel(loadingMsg);
				// we can get several different error codes from the API.
				// let's make sure we give some proper error info to the user
				$scope.resultsText = "Something went wrong. Please try again...";
				console.error("ERROR, API request failed: " + response.statusText);

				// NOTE: there is a bug in the API that I have identified.
				// When searching for "ir" or "iro" it will return with an error
				// however, "i" and "iron" will return successfully
				/*// just so we don't keep an error cached for the next time the user
				// makes this request, adjust the timestamp
				timestamp++;
				// we also have to recalc the hash now
				hash = md5.createHash(timestamp+privateKey+publicKey);*/
				
			});
		};		// end SearchController.getCharacter

		// the following method will be used by the search controller to control whether or not
		// the Advanced Options are shown. These values will be used within the getCharacter
		// request if it is enabled
		this.toggleAdvOptions = function() {
			if($scope.advancedOptions)
				console.log("SHOW ADVANCED OPTIONS MENU!");
		};

	}]);	// end controller definition
})();	// end closure
