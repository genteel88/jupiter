(function() {
	/**
	 * Variables
	 */
	var user_id = '1111';
	var user_fullname = 'John';
	var lng = -122.08;
	var lat = 37.38;
	
//	console.log(user_id);
	
	function init() {
		// register event listener
		document.querySelector('#login-form-btn').addEventListener('click', 
				onSessionInvalid);
		document.querySelector('#register-form-btn').addEventListener('click',
				showRegisterForm);
		document.querySelector('#register-btn').addEventListener('click',
				register);
		document.querySelector('#login-btn').addEventListener('click', login);
		
		document.querySelector('#nearby-btn').addEventListener('click', loadNearbyItems);
		document.querySelector('#fav-btn').addEventListener('click', loadFavoriteItems);
		document.querySelector('#recommend-btn').addEventListener('click', loadRecommendedItems);
		
		validateSession();
	}
	
	function validateSession() {
		onSessionInvalid();
		// The request parameters
		var url = './login';
		var req = JSON.stringify({});
		
		// display loading message
		showLoadingMessage('Validating session...');
		
		// make AJAX call 
		ajax('GET', url, req,
		// session is still valid
		function(res) {
			var result = JSON.parse(res);
			
			if (result.status === 'OK') {
				onSessionValid(result);
			}
		}, function() {
			console.log('login error')
		});
	}
	
	function showLoadingMessage(msg) {
		var itemList = document.querySelector('#item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '
			+ msg + '</p>';
	}
	
	function onSessionValid(result) {
		user_id = result.user_id;
		user_fullname = result.name;
		
		var loginForm = document.querySelector('#login-form');
		var registerForm = document.querySelector('#register-form');
		var itemNav = document.querySelector('#item-nav');
		var itemList = document.querySelector('#item-list');
		var avatar = document.querySelector('#avatar');
		var welcomeMsg = document.querySelector('#welcome-msg');
		var logoutBtn = document.querySelector('#logout-link');
		
		welcomeMsg.innerHTML = 'Welcome, ' + user_fullname;
		
		showElement(itemNav);
		showElement(itemList);
		showElement(avatar);
		showElement(welcomeMsg);
		showElement(logoutBtn, 'inline-block');
		hideElement(loginForm);
		hideElement(registerForm);
		
		initGeoLocation();
	}
	
	function initGeoLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(onPositionUpdated,
					onLoadPositionFailed, {
				maximumAge : 60000
			});
			showLoadingMessage('Retrieving your location...');
		} else {
			onLoadPositionFailed();
		}
	}
	
	function onPositionUpdated(position) {
		lat = position.coords.latitude;
		lng = position.coords.longitude;
//		console.log('lat ->', lat);
//		console.log('lng ->', lng);
		loadNearbyItems();
	}
	
	function onLoadPositionFailed() {
		console.warn('navigator.geolocation is not available');
		getLocationFromIP();
	}
	
	function getLocationFromIP() {
		// get location from http://ipinfo.io/json
		var url = 'http://ipinfo.io/json';
		var data = null;
		
		ajax('GET', url, data, function(res) {
			var result = JSON.parse(res);
			if ('loc' in result) {
				var loc = result.loc.split(',');
				lat = loc[0];
				lng = loc[1];
			} else {
				console.warn('Getting location by IP failed');
			}
			loadNearbyItems();
		});
	}
	
	/*
	 * API #2 Load favorite (or visited) items API end point: [GET]
	 * /history?user_id=1111
	 */
	function loadFavoriteItems() {
		activeBtn('fav-btn');
		// request parameters
		var url = './history';
		var params = 'user_id=' + user_id;
		var req = JSON.stringify({});
		
		// display loading message
		showLoadingMessage('Loading favorite items...');
		
		// make ajax call
		ajax('GET', url + '?' + params, req, 
		function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No favorite item.');
			} else {
				listItems(items);
			}
		}, function() {
			showErrorMessage('Cannot load favorite items.');
		});
	}
	
	/*
	 * API #3 Load recommended items API end point: [GET]
	 *  / recommended?user_id=1111
	 */
	function loadRecommendedItems() {
		activeBtn('recommend-btn');
		
		// request parameters
		var url = './recommendation' + '?' + 'user_id=' + user_id + '&lat='
				+ lat + '&lon=' + lng;
		var data = null;
		
		// display loading message
		showLoadingMessage('Loading recommened items...');
		
		// make ajax call
		ajax('GET', url, data,
		// successfully callback
		function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No recommended item. Make sure you have favorite.');
			} else {
				listItems(items);
			}
		}, function() {
			showErrorMessage('Cannot load recommended items.')
		});
 	}
	
	/*
	 * API #1 Load the nearby items API end point: [GET]
	 * /search?user_id=1111&lat=37.38&lon=-122.08
	 */
	function loadNearbyItems() {
		console.log('loadNearbyItems');
		activeBtn('nearby-btn');
		
		// Bay area
//		lat = 37.38;
//		lng = -122.08;
		
		// NYC
		lat = 40.71;
		lng = -74.00;
		
		// Seattle
//		lat = 47.60;
//		lng = -122.33;
		
		// The request parameters
		var url = './search';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;
		var data = null;
		
//		console.log('lat: ' + lat);
//		console.log('lng: ' + lng);
//		console.log('url: ' + url);
		
		// display loading message
		showLoadingMessage('Loading nearby items...');
		
		// make AJAX call
		ajax('GET', url + '?' + params, data, 
		// successfully callback
		function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No nearby item');
			} else {
				console.log('show items.');
				console.log(items);
				listItems(items);
			}
		}, 
		// failed callback
		function() {
			showErrorMessage('Cannot load nearby items.')
		});
	}
	
	/*
	 * API #4 Toggle favorite (or visited) items
	 * @params item - The item from the list
	 * 
	 * API end point: [POST]/[DELETE] /history request json data: { user_id : 1111, favorite: item }
	 */
	function changeFavoriteItem(item) {
		// check whether this item has been visited or not
		var li = document.querySelector('#item-' + item.item_id);
		var favIcon = document.querySelector('#fav-icon-' + item.item_id);
		var favorite = !(li.dataset.favorite === 'true');
		
		// request parameters
		var url = './history';
		var req = JSON.stringify({
			user_id : user_id,
			favorite : item
		});
		var method = favorite ? 'POST' : 'DELETE';
		
		ajax(method, url, req,
		// successfully callback
		function(res) {
			var result = JSON.parse(res);
			if (result.status === 'OK' || result.result === 'SUCCESS') {
				li.dataset.favorite = favorite;
				favIcon.className = favorite ? 'fa fa-heart' : 'fa fa-heart-o';
			}
		},
		// error
		function() {
			console.log('change favorite failed!');
		});
	}
	
	/*
	 * A helper function that create a DOM element <tag options...>
	 * 
	 * @param tag
	 * @param options
	 * @returns {element}
	 */
	function $create(tag, options) {
		var element = document.createElement(tag);
		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				element[key] = options[key];
			}
		}
		return element;
	}
	
	/*
	 * Create item list
	 * 
	 * List recommendation items base on the data received
	 * 
	 * @params items - An array of item JSON objects
	 * 
	 */
	function listItems(items) {
		var itemList = document.querySelector('#item-list');
		itemList.innerHTML = ''; // clear current results
		
		for (var i = 0; i < items.length; i++) {
			addItem(itemList, items[i]);
		}
	}
	
	/*
	 * Add a single item to the list
	 * 
	 * @param itemList - The <ul id="item-list"> tag (DOM container)
	 * @param item - The item data (JSON object)
	 * 
	 */
	function addItem(itemList, item) {
		var item_id = item.item_id;
		
		// create the <li> tag and specify the id and class attributes
		var li = $create('li', {id : 'item-' + item_id,
								className : 'item'
		});
		
		// set the data attribute ex. <li data-item_id="xxxxxxx" data-favorite="true">
		li.dataset.item_id = item_id;
		li.dataset.favorite = item.favorite;
		
		// item image
		if (item.image_url) {
			li.appendChild($create('img', {src : item.image_url}));
		} else {
			li.appendChild($create('img', {src : 'https://via.placeholder.com/100'}));
		}
		
		// section
		var section = $create('div');
		
		// title
		var title = $create('a', {
			className : 'item-name',
			href : item.url,
			target : '_blank'
		});
		title.innerHTML = item.name;
		section.appendChild(title);
		
		// keyword
		var keyword = $create('p', {className : 'item-keyword'});
		keyword.innerHTML = 'keyword: ' + item.keywords.join(', ');
		section.appendChild(keyword);
		
		li.appendChild(section);
		
		// address
		var address = $create('p', {className : 'item-address'});
		
		// ',' => '<br/>', '\"' => ''
		address.innerHTML = item.address.replace(/,/g, '<br/>').replace(/\"/g, '');
		li.appendChild(address);
		
		// favorite link
		var favLink = $create('p', {className : 'fav-link'});
		favLink.onclick = function() {
			changeFavoriteItem(item);
		};
		
		favLink.appendChild($create('i', {id : 'fav-icon-' + item_id,
										className : item.favorite ? 'fa fa-heart' : 'fa fa-heart-o'
		}));
		
		li.appendChild(favLink);	
		itemList.appendChild(li);
	}
	
	/*
	 * A helper function that makes a navigation button active
	 * @param btnId - The id of the navigation button
	 */
	function activeBtn(btnId) {
		var btns = document.querySelectorAll('.main-nav-btn');
		
		// deactivate all navigation buttons
		for (var i = 0; i < btns.length; i++) {
			btns[i].className = btns[i].className.replace(/\bactive\b/, '');
		}
		
		// active the one that has id = btnId
		var btn = document.querySelector('#' + btnId);
		btn.className += ' active';
	}
	
	function showLoadingMessage(msg) {
		var itemList = document.querySelector('#item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '
			+ msg + '</p>';
	}
	
	function showWarningMessage(msg) {
		var itemList = document.querySelector('#item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i> '
			+ msg + '</p>';
	}
	
	function showErrorMessage(msg) {
		var itemList = document.querySelector('#item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-circle"></i> '
			+ msg + '</p>';
	}
	
	// Only show login form, hide the rest
	function onSessionInvalid() {
		var loginForm = document.querySelector('#login-form');
		var registerForm = document.querySelector('#register-form');
		var itemNav = document.querySelector('#item-nav');
		var itemList = document.querySelector('#item-list');
		var avatar = document.querySelector('#avatar');
		var welcomeMsg = document.querySelector('#welcome-msg');
		var logoutBtn = document.querySelector('#logout-link');
		
		hideElement(itemNav);
		hideElement(itemList);
		hideElement(avatar);
		hideElement(logoutBtn);
		hideElement(welcomeMsg);
		hideElement(registerForm);
		
		clearLoginError();
		showElement(loginForm);
	}
	
	function showRegisterForm() {
		var loginForm = document.querySelector('#login-form');
		var registerForm = document.querySelector('#register-form');
		var itemNav = document.querySelector('#item-nav');
		var itemList = document.querySelector('#item-list');
		var avatar = document.querySelector('#avatar');
		var welcomeMsg = document.querySelector('#welcome-msg');
		var logoutBtn = document.querySelector('#logout-link');
		
		hideElement(itemNav);
		hideElement(itemList);
		hideElement(avatar);
		hideElement(logoutBtn);
		hideElement(welcomeMsg);
		hideElement(loginForm);
		
		clearRegisterResult();
		showElement(registerForm);
	}
	
	function clearRegisterResult() {
		document.querySelector('#register-result').innerHTML = '';
	}
	
	function hideElement(element) {
		element.style.display = 'none';
	}
	
	function clearLoginError() {
		document.querySelector('#login-error').innerHTML = '';
	}
	
	function showElement(element, style) {
		var displayStyle = style ? style : 'block';
		element.style.display = displayStyle;
	}
	
	// Register
	function register() {
		var username = document.querySelector('#register-username').value;
		var password = document.querySelector('#register-password').value;
		var firstName = document.querySelector('#register-first-name').value;
		var lastName = document.querySelector('#register-last-name').value;
		
		if (username === "" || password == "" || firstName === ""
			|| lastName === "") {
			showRegisterResult('Please fill in all fields');
			return;
		}
		
		if (username.match(/^[a-z0-9_]+$/) === null) {
			showRegisterResult('Invalid username');
			return;
		}
		password = md5(username + md5(password));
		
		// The request parameters
		var url = './register';
		var req = JSON.stringify({
			user_id : username,
			password : password,
			first_name : firstName,
			last_name : lastName,
		});
		
		ajax('POST', url, req, 
			// successfully callback
		function(res) {
			var result = JSON.parse(res);
			// successfully logged in
			if (result.status === 'OK') {
				showRegisterResult('Successfully registered');
			} else {
				showRegisterResult('User already existed');
			}
		},
		// error
		function() {
			showRegisterResult('Failed to register');
		}, true);
	}
	
	function showRegisterResult(registerMessage) {
		document.querySelector('#register-result').innerHTML = registerMessage;
	}
	
	function clearRegisterResult() {
		document.querySelector('#register-result').innerHTML = '';
	}
	
	// Login
	function login() {
		var username = document.querySelector('#username').value;
		var password = document.querySelector('#password').value;
		password = md5(username + md5(password));
		
		// The response parameter
		var url = './login';
		var req = JSON.stringify({
			user_id : username,
			password : password,
		});
		
		ajax('POST', url, req, 
		// successfully callback
		function(res) {
			var result = JSON.parse(res);
			// successfully logged in
			if (result.status === 'OK') {
//				console.log('login successfully!');
				onSessionValid(result);
			}
		},
		function() {
			showLoginError();
		}, true);
	}
	
	function showLoginError() {
		document.querySelector('#login-error').innerHTML = 'Invalid username or password';
	}
	
	
	function ajax(method, url, data, successCallback, errorCallback) {
		var xhr = new XMLHttpRequest();
		
		xhr.open(method, url, true);
		
		xhr.onload = function() {
			if (xhr.status === 200) {
				successCallback(xhr.responseText);
			} else {
				errorCallback();
			}
		};
		
		xhr.onerror = function() {
			console.error("The request couldn't be completed.");
		};
		
		if (data === null) {
			xhr.send();
		} else {
			xhr.setRequestHeader("Content-Type", 
					"application/json;charset=utf-8");
//			console.log(data);
//			console.log('check_0');
			xhr.send(data);
		}
	}
	
	init();
})();

