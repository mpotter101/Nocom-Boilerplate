var KEEPER = {
	// "Private" properties, but user can mess with them if they want
	_stopUpdate: false,
	_onUpdate: [],
	_onLateUpdate: [],
	_animeAnimations: [],
	_timedEvents: [],
	_timeLastFrameMs: 0,
	_pauseOnError: true,
	_colliders: [],
	
	// For use in initial setup or when data is missing from a method call
	defaults: {
		name: { length: 10 },
		cam: {
			fov: 70,
			aspectRatio: 800/600,
			nearClipping: 0.1,
			farClipping: 1000
		},
		scene: {
			height: 600,
			width: 800,
			nameLength: 10
		},
	},
	
	// Game engine state
	scenes: {},
	deltaTime: 0,
	
	// ---
	// Functions not meant to be interacted with outside of this object
	// Essentially private, but end-user should be allowed to interact with these
	
	_Boot: () => {
		// Integrate the broken-out parts of the library.
		KEEPER = Object.assign(KEEPER, K_HELPER, K_INPUT, K_COLLISION, K_FACTORY, K_TIME);

		// Check for dependencies.
		var jQueryAvailable = window.$ ? true : undefined;
		var pixiAvailable = window.PIXI ? true : undefined;
		var animeAvailable = window.anime ? true: undefined;
		var threeAvailable = window.THREE ? true : undefined;
		
		var message = "Booting KEEPER...\n";
		message += "Checking Libraries:\n";
		message += "\tJquery: %f" + jQueryAvailable + '%f\n';
		message += "\tPixi: " + pixiAvailable + '\n';
		message += "\tAnime: " + animeAvailable + '\n';
		message += "\tThreeJS: " + threeAvailable + '\n';	

		KEEPER.Log({ message });

		if (
			jQueryAvailable &&
			pixiAvailable &&
			animeAvailable &&
			threeAvailable
		) {
			KEEPER.Log({ message: "Boot successful. Update starting." });
			KEEPER._Update();
			return;
		}
		
		KEEPER.Log({
				message: 'Missing Dependencies! Please ensure listed libraries are loaded onto the page before KEEPER is loaded.',
				severity: KEEPER.severity.error
			});
		
		KEEPER.Log({
			message: 'KEEPER not started.',
			severity: KEEPER.severity.error
		});
	},

	_Render: () => {
		Object.keys (KEEPER.scenes).forEach (kSceneKey => {
			var kScene = KEEPER.scenes[kSceneKey];
			kScene.renderer.render (kScene.scene, kScene.camera)
		});
	},
	
	_Update: () => {
		try {
			// Prepare new frame
			requestAnimationFrame(KEEPER._Update);
			
			// Don't update if loop is paused
			if (KEEPER._stopUpdate) {return}
			
			// New Delta Time
			var nowMs = Date.now ();
			KEEPER.deltaTime = Date.now () - KEEPER._timeLastFrameMs;
			
			// convert result to Ms
			KEEPER.deltaTime = KEEPER.deltaTime * 0.001;
			
			// Update timed events
			KEEPER.UpdateTimedEvents();
			
			// Normal update
			KEEPER._onUpdate.forEach (item => { item.method() });
			
			// Check for collisions
			KEEPER.CheckForCollisions();
			
			// Late update
			KEEPER._onLateUpdate.forEach (item => { item.method() });
			
			KEEPER._timeLastFrameMs = nowMs;
			
			// Draw the canvas after updates have happened.
			KEEPER._Render();
			
			// Update keyboard state.
			KEEPER.UpdateKeyState();
		}
		catch (e) {
			console.error (e);
			
			if (KEEPER._pauseOnError == true) {
				KEEPER.Stop ();
			}
		}
	},
	// End of "Private" functions
	//---
	
	AddToUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ 
				owner: KEEPER,
				method: () => { console.log ('Object added empty method to update loop.'); },
			},
			data
		);
		
		safeData.id = KEEPER.GenerateKeeperId ({ length: 20 });
		
		KEEPER._onUpdate.push(safeData);
		return safeData.id;
	},
	
	AddToLateUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ 
				owner: KEEPER,
				method: () => { console.log ('Object added empty method to update loop.'); },
			},
			data
		);
		
		safeData.id = KEEPER.GenerateKeeperId ({ length: 20 });
		
		KEEPER._onLateUpdate.push(safeData);
		return safeData.id;
	},
	
	// Returns true if something was removed from the update
	RemoveFromUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate [key];
			
			if (item.id == safeData.id) {
				KEEPER._onUpdate [key] = null;
				return true;
			}
		}
		
		return false;
	},
	
	// Returns true if something was removed from the update
	RemoveFromLateUpdate: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onLateUpdate; key++) {
			item = KEEPER._onLateUpdate [key];
			
			if (item.id == safeData.id) {
				KEEPER._onLateUpdate = null;
				return true;
			}
		}
		
		return false;
	},
	
	// Gets a KEEPER scene by name
	GetSceneByName: (data) => {
		var safeData = KEEPER.EnsureDefaults (
			{ name: ''},
			data
		);
		
		return KEEPER.scenes [safeData.name];
	},
	
	Stop: () => {
		KEEPER._stopUpdate = true;
	},
	
	Resume: () => {
		KEEPER._stopUpdate = false;
	},
}

$(window).on('load', () => {
	// Setting up Delta Time
	KEEPER._timeLastFrameMs = Date.now();

	// Start the update loop
	KEEPER._Boot();

	// Capture key events
	$(window).on('keydown', (data) => {
		KEEPER.KeyListener({ type: 'down', key: data.key });
	});

	$(window).on('keyup', (data) => {
		KEEPER.KeyListener({ type: 'up', key: data.key });
	});
});
