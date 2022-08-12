console.clear ();
console.log ("Nocom Boilerplate: A no-compile no-server-needed boilerplate for front-end app development.");
console.log ("Checking Libraries:");
console.log ("Jquery:", $);
console.log ("Pixi:", PIXI);
console.log ("Anime", anime);
console.log ("ThreeJS", THREE);

// Setup config
var config = {
	foo: 'bar'
}

// Start application
Main.Start(config);