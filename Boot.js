console.log ("Nocom Boilerplate: A no-compile no-server-needed boilerplate for front-end game development.");

// Setup config
var config = {
	foo: 'bar'
}

$(window).on('load', () => {
	// Start application
	Main.Start(config);
})