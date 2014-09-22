$(document).ready(function() {
	
	// This function creates login form
	function create_login_form (enabled) {
		if(enabled === false) {
			disabled = 'disabled';
		} else {
			disabled = '';
		}
		var $login_div = $('\
			<form class="form-login" role="form">\
				<h2 class="form-login-heading">Verse Server Login</h2>\
				<input type="text" class="form-control" name="username" placeholder="Username" required autofocus ' + disabled + '>\
				<input type="password" class="form-control" name="password" placeholder="Password" ' + disabled + '>\
				<span class="help-block">Type your username and password to login.</span>\
				<button id="login_but" class="btn btn-lg btn-primary btn-block" type="submit" ' + disabled + '>Sign in</button>\
			</form>\
			');
		$('.jumbotron').append($login_div);
	};

	// Create jumbotron div
	var $jumbotron_div = $('<div class="jumbotron"></div>');
	$('.container').append($jumbotron_div);

	if (!window.WebGLRenderingContext) {
		// The browser doesn't even know what WebGL is
		var $alert_div = $('\
			<div class="alert alert-danger" role="alert">\
			<strong>Sorry:</strong> Your browser does not support <a href="http://get.webgl.org/" class="alert-link">WebGL</a>!\
			</div>\
			');
		$('.container').prepend($alert_div);
		create_login_form(false);
	} else {
		create_login_form(true);
	}

	$('.form-login').submit(function(event) {
		// Connect to Verse server

		var config,  dataHandler;

		console.log(verse);

		dataHandler = function dataHandler (data) {
			if (data.CMD === 'NODE_CREATE') {
				verse.subscribeNode(data.NODE_ID);
				console.log('subscribed node ' + data.NODE_ID);
			}
			else if (data.CMD === 'TAG_GROUP_CREATE') {
				verse.subscribeTagGroup(data.NODE_ID, data.TAG_GROUP_ID);
				console.info('subscribed tagGroup nodeId =' + data.NODE_ID + ' tagGroupId = ' + data.TAG_GROUP_ID);
			}
			else if (data.CMD === 'LAYER_CREATE') {
				verse.subscribeLayer(data.NODE_ID, data.LAYER_ID);
				console.info('subscribed Layer nodeId =' + data.NODE_ID + ' layerId = ' + data.LAYER_ID);
			}
			else {
				console.log(data);
			}
		};

		config = {
			uri: 'ws://localhost:23456',
			version: 'v1.verse.tul.cz',
			username: $('input[name=username]').val(),
			passwd: $('input[name=password]').val(),
			dataCallback: dataHandler,
			connectionTerminatedCallback: function(event) {
				/*
				 * callback function for end of session handling
				 * called when onClose websocket event is fired
				 */
				console.info('[Disconnected], Code:' + event.code + ', Reason: ' + event.reason);

				// Create allert message
				var $div = $('\
					<div class="alert alert-danger alert-dismissible" role="alert">\
					<strong>Sorry:</strong> Connection with Verse server was terminated!\
					</div>\
				');
				$('.container').prepend($div);
				create_login_form(true);
			},
			connectionAcceptedCallback: function(userInfo) {
				/*
				 * callback function for connection accepted event
				 * called when negotiation process is finished
				 * @param userInfo object
				 */
				console.info('User ID: ' + userInfo.USER_ID);
				console.info('Avatar ID: ' + userInfo.AVATAR_ID);

				// Create dismissible 'info' message
				var $div = $('\
					<div class="alert alert-success alert-dismissible" role="alert">\
					<button type="button" class="close" data-dismiss="alert">\
					<span aria-hidden="true">&times;</span>\
					<span class="sr-only">Close</span></button>\
					<strong>Great:</strong> Connected to Verse server!\
					</div>\
				');
				$('.container').prepend($div);
				// Close login form
				$('.jumbotron').remove();
				// TODO: do not close jumbotron, but create in jumbotron list of available
				// scenes
			}

		};

		verse.init(config);

		console.info(verse);
		
		event.preventDefault();
	});
});
