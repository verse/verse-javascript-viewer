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
		// var $div = $('\
		// <div class="alert alert-success" role="alert">\
		// <strong>Great:</strong> Your browser supports <a href="http://get.webgl.org/" class="alert-link">WebGL</a>!\
		// </div>\
		// ');
		// $('.container').prepend($div);
		create_login_form(true);
	}

	$('#login_but').click(function() {
		// TODO: connect to Verse server
		console.log(verse);
	});
});
