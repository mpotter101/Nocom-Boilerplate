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
	
	// Essentially constants
	characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	camTypes: {
		orthographic: 'OrthographicCamera',
		perspective: 'PerspectiveCamera'
	},
	severity: {
		error: 'error',
	},
	
	
	// Game engine state
	scenes: {},
	keys: {
		down: {},
		held: {},
		up: {},
	},
	deltaTime: 0,
	
	// Debug options
	debug: {
		keypress: false
	},
	
	// ---
	// Functions not meant to be interacted with outside of this object
	// Essentially private, but end-user should be allowed to interact with these
	
	_Boot: () => {
		
		var jQueryAvailable = window.$ ? true : undefined;
		var pixiAvailable = window.PIXI ? true : undefined;
		var animeAvailable = window.anime ? true: undefined;
		var threeAvailable = window.THREE ? true : undefined;
		
		var message = "KEEPER starting up...\n";
		message += "Checking Libraries:\n";
		message += "\tJquery: %f" + jQueryAvailable + '%f\n';
		message += "\tPixi: " + pixiAvailable + '\n';
		message += "\tAnime: " + animeAvailable + '\n';
		message += "\tThreeJS: " + threeAvailable + '\n';
		
		KEEPER.Log ({
			message: { foo: 'bar' }
		});			
		
		if (
			jQueryAvailable &&
			pixiAvailable &&
			animeAvailable &&
			threeAvailable
		) {
			KEEPER.Log({message: message + "All dependencies detected. Starting KEEPER..."});
			KEEPER._Update();
			return;
		}
		
		KEEPER.Log ({message});
		
		KEEPER.Log({
				message: 'Missing Dependencies! Please ensure listed libraries are loaded onto the page before KEEPER is loaded.',
				severity: KEEPER.severity.error
			});
		
		KEEPER.Log({
			message: 'KEEPER not started.',
			severity: KEEPER.severity.error
		});
	},
	
	_CreateScene: (data) => {
		var safeData = data;
		
		// prevents confusing logs in console
		if (!('camera' in safeData))
		{
			safeData.camera = KEEPER.CreateCamera();
		}
		
		var camera = safeData.camera;
		var scene = new THREE.Scene();
		var renderer = new THREE.WebGLRenderer();
		
		return { 
			camera, scene, renderer,
			Add: (sceneObj) => { scene.add (sceneObj); },
		}
	},
	
	_EnsureDefaults: (defaultValues, actualValues) => {
		if (actualValues == undefined) { actualValues = {} } 
		
		if (actualValues.constructor != Object) {
			throw new Error ("Values provided to method are not an object literal.");
		}
		
		return Object.assign(
			defaultValues,
			actualValues
		);
	},
	
	_KeyListener: (data) => {
		var key = data.key;
		var eventType = data.type;
		
		if (eventType == 'down' && KEEPER.keys.held [key] == 1) {return;}
		
		KEEPER.Log ({
			debugKey: 'keypress',
			severity: KEEPER.severity.quiet,	
			message: eventType + ': ' + key
		});
		
		switch (eventType) {
			case 'down': 
				KEEPER.keys.held [key] = 1; KEEPER.keys.up [key] = 0; KEEPER.keys.down [key] = 1;
				break;
			case 'up': 
				KEEPER.keys.held [key] = 0; KEEPER.keys.down [key] = 0; KEEPER.keys.up [key] = 1;
				break;
		}
	},
	
	_UpdateKeyState: () => {
		// let pressed keys be marked as pressed for 1 frame
		Object.keys (KEEPER.keys.down).forEach (key => {
			if (KEEPER.keys.down [key] == 1) { 
				KEEPER.keys.down [key] = 0;
				KEEPER.keys.held [key] = 1;
			}
		});
		
		Object.keys (KEEPER.keys.up).forEach (key => {
			if (KEEPER.keys.up [key] == 1) { 
				KEEPER.keys.up [key] = 0;
			}
		});
	},
	
	_GetActiveKeysFromArea: (area) => {
		var result = [];
		
		Object.keys (area).forEach (key => {
			if (area [key] > 0) { result.push(key); }
		});
		
		return result;
	},
	
	_CheckSphereIntersection: (sphereA, sphereB) => {
		var distance = sphereA.sceneObj.position.distanceTo (sphereB.sceneObj.position);
		
		return distance < sphereA.radius + sphereB.radius
	},
	
	_CheckForCollisions: () => {
		// Check for any new or continued collisions
		KEEPER._colliders.forEach (collider => {
			KEEPER._colliders.forEach (otherCollider => {
				if (
					collider.id != otherCollider.id &&
					collider.team != otherCollider.team
				) {
					var result = KEEPER._CheckSphereIntersection(collider, otherCollider)
					var currentState = collider.collisions [otherCollider.id];
					var data = {owner: collider.owner, other: otherCollider.owner};
					
					if (!(otherCollider.id in collider.collisions))
					{
						collider.collisions [otherCollider.id] = false;
					}
					
					// A collision happened this frame.
					if (currentState == false && result == true)
					{
						collider.OnCollisionEnter(data);
					}
					
					// A collision has been occurring since last frame
					if (
						currentState == false && result == true ||
						currentState == true && result == true
					) {
						collider.OnCollisionStay(data);
					}
					
					// A collision just stopped happening
					if (currentState == true && result == false)
					{
						collider.OnCollisionLeave(data);
					}
					
					collider.collisions [otherCollider.id] = result;
				}
			});
		});
	},

	_Render: () => {
		Object.keys (KEEPER.scenes).forEach (kSceneKey => {
			var kScene = KEEPER.scenes[kSceneKey];
			kScene.renderer.render (kScene.scene, kScene.camera)
		});
	},
	
	_UpdateTimedEvents: () => {
		// increment all timers by current delta time
		// and fire off any that are ready
		KEEPER._timedEvents.forEach (evnt => {
			evnt.timer += KEEPER.deltaTime;
			
			if (evnt.timer >= evnt.waitForSeconds) {
				evnt.callback ({context: evnt.context});
			}
		});
		
		// Remove all events that have expired
		KEEPER._timedEvents = KEEPER._timedEvents.filter (evnt => evnt != null && evnt.timer < evnt.waitForSeconds);
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
			KEEPER._UpdateTimedEvents();
			
			// Normal update
			KEEPER._onUpdate.forEach (item => { item.method() });
			
			// Check for collisions
			KEEPER._CheckForCollisions();
			
			// Late update
			KEEPER._onLateUpdate.forEach (item => { item.method() });
			
			KEEPER._timeLastFrameMs = nowMs;
			
			// Draw the canvas after updates have happened.
			KEEPER._Render();
			
			// Update keyboard state.
			KEEPER._UpdateKeyState();
		}
		catch (e) {
			console.error (e);
			
			if (KEEPER._pauseOnError == true) {
				KEEPER.Stop ();
			}
		}
	},
	
	_GetKeyStateSafeData: (data) => {
		return KEEPER._EnsureDefaults (
			{ key: '' },
			data
		);
	},
	
	_KeyMatchesState: (key, keyArea, state) => {
		return KEEPER.keys [keyArea] [key] == state;
	},
	// End of "Private" functions
	//---
	
	AddToUpdate: (data) => {
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
	
	AddTimedEvent: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{ 
				id: KEEPER.GenerateName({length: 20}),
				waitForSeconds: 1, 
				context: KEEPER,
				callback: (d) => { console.log ('Event fired off from', d.context); }
			},
			data
		);
		
		safeData.timer = 0;
		KEEPER._timedEvents.push (safeData);
		return safeData.id;
	},
	
	GetTimedEvent: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate [key];
			
			if (item.id == safeData.id) {
				return KEEPER._timedEvents [key]
			}
		}
		
		return null;
	},
	
	RemoveTimedEvent: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{ id: '' },
			data
		);
		
		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate [key];
			
			if (item.id == safeData.id) {
				KEEPER._timedEvents [key] = null;
				return true;
			}
		}
		
		return false;
	},
	
	// Returns true if something was removed from the update
	RemoveFromUpdate: (data) => {
		var safeData = KEEPER._EnsureDefaults (
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
		var safeData = KEEPER._EnsureDefaults (
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
	
	GetInputState: () => {
		return {
			down: KEEPER._GetActiveKeysFromArea(KEEPER.keys.down), 
			held: KEEPER._GetActiveKeysFromArea(KEEPER.keys.held), 
			up: KEEPER._GetActiveKeysFromArea(KEEPER.keys.up)
		}
	},
	
	// Returns true if the key was pressed this frame.
	GetKeyDown: (data) => {
		var safeData = KEEPER._GetKeyStateSafeData(data);
		
		return KEEPER._KeyMatchesState (safeData.key, 'down', 1);
	},
	
	// Returns true if key is being held.
	GetKeyHeld: (data) => {
		var safeData = KEEPER._GetKeyStateSafeData(data);
		
		return KEEPER._KeyMatchesState (safeData.key, 'held', 1);
	},
	
	// Returns true if key was released this frame.
	GetKeyUp: (data) => {
		var safeData = KEEPER._GetKeyStateSafeData(data);
		
		return KEEPER._KeyMatchesState (safeData.key, 'up', 1);
	},
	
	GenerateKeeperId: (data) => { 
		var safeData = KEEPER._EnsureDefaults (
			{ 
				length: KEEPER.defaults.name.length,
			},
			data
		);
		
		var id = Date.now() + '-' + KEEPER.GenerateName (safeData);
		return id;
	},
	
	GenerateName: (data) => {  
		var safeData = KEEPER._EnsureDefaults (
			{ 
				length: KEEPER.defaults.name.length,
			},
			data
		);

		var length = safeData.length;
		if (length == -1) { length = 10; }
		
		var result = '';
		
		for (var i = 0; i < length; i++) {
			result += KEEPER.characters.charAt(Math.floor(Math.random() * KEEPER.characters.length));
		}
		
		return result;
	},
	
	// Creates a THREE.cam with sensible defaults that can be customized.
	CreateCamera: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{ 
				type: KEEPER.camTypes.perspective,
				
				// perspective stuff
				fov: KEEPER.defaults.cam.fov, 
				aspectRatio: KEEPER.defaults.cam.aspectRatio, 
				
				// orthographic stuff
				left: -4,
				right: 4,
				top: 3,
				bottom: -3, 
				// Needed by both
				nearClipping: KEEPER.defaults.cam.nearClipping, 
				farClipping: KEEPER.defaults.cam.farClipping,
			},
			data
		);
		
		
		// return camera
		switch (safeData.type) {
			case KEEPER.camTypes.perspective:
				KEEPER.Log ({message: 'Making ' + KEEPER.camTypes.perspective + ' camera'});
				// return the perspective camera
				return new THREE.PerspectiveCamera(
					safeData.fov, 
					safeData.aspectRatio, 
					safeData.nearClipping, 
					safeData.farClipping
				);
				break;
			case KEEPER.camTypes.orthographic:
				KEEPER.Log ({message: 'Making ' + KEEPER.camTypes.orthographic + ' camera'});
				
				// return the orthographic camera
				return new THREE.OrthographicCamera(
					safeData.left,
					safeData.right,
					safeData.top,
					safeData.bottom, 
					safeData.nearClipping,
					safeData.farClipping
				);
				break;
			default: 
			
				// Warn user that a camera could not be found.
				var ortho = KEEPER.camTypes.orthographic;
				var persp = KEEPER.camTypes.perspective;
				console.log ("Camera type", type, "not recognized. Try either", ortho, "or", persp);
				break;
		}
	},
	
	// Creates a new THREE scene with sensible defaults that can be customized.
	CreateKeeperScene: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{
				node: $(document.body), 
				height: KEEPER.defaults.scene.height, 
				width: KEEPER.defaults.scene.width, 
			},
			data
		);
		
		// Function act a bit weird when passed into _EnsureDefaults...
		// manually assigning here to avoid that.
		if (!('camera' in safeData)) {
			console.log ('here');
			safeData.camera = KEEPER.CreateCamera()
		}
		
		if (!('name' in safeData)) {
			safeData.name = KEEPER.GenerateName()
		}
		
		var n = safeData.name;
		var node = safeData.node;
		
		KEEPER.scenes [n] = KEEPER._CreateScene (safeData)
		KEEPER.scenes [n].renderer.setSize (safeData.width, safeData.height);
		
		node.append (KEEPER.scenes [n].renderer.domElement);
		
		KEEPER.Log ({message: 'Creating scene: ' + n});
		
		return KEEPER.scenes [n];
	},
	
	// Gets a KEEPER scene by name
	GetSceneByName: (data) => {
		var safeData = KEEPER._EnsureDefaults (
			{ name: ''},
			data
		);
		
		return KEEPER.scenes [safeData.name];
	},
	
	
	CreateBasicKeeperShape: () => {
		var geometry = new THREE.BoxGeometry (1, 1, 1);
		var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
		var sceneObj = new THREE.Mesh (geometry, material);
		
		return { geometry, material, sceneObj }
	},
	
	CreateCollisionSphere: (data) => {
		var safeData = KEEPER._EnsureDefaults({
				owner: KEEPER,
				diameter: 1,
				OnCollisionEnter: () => {},
				OnCollisionStay: () => {},
				OnCollisionLeave: () => {},
				enabled: true,
				id: KEEPER.GenerateKeeperId({length: 20}),
				team: KEEPER.GenerateKeeperId({length: 20}),
				
				// for debug view
				verticalSections: 8,
				horizontalSections: 8,
				color: 0xffffff,
			}, 
			data
		);
		
		var sphere = new THREE.SphereGeometry (
			safeData.diameter * 0.5, 
			safeData.verticalSections, 
			safeData.horizontalSections
		);
		
		var wireframe = new THREE.EdgesGeometry (sphere);
		var sceneObj = new THREE.LineSegments (wireframe);
		
		// hide collider
		sceneObj.material.depthTest = false;
		sceneObj.material.transparent = true;
		sceneObj.material.opacity = 0;
		sceneObj.material.color = new THREE.Color (safeData.color);
		
		var collider = {
			collisions: {},
			diameter: safeData.diameter,
			radius: safeData.diameter * 0.5,
			sphere, wireframe, sceneObj,
			id: safeData.id,
			team: safeData.team,
			owner: safeData.owner,
			enabled: safeData.enabled,
			Show: () => { sceneObj.material.opacity = 1; },
			Hide: () => { sceneObj.material.opacity = 0; },
			OnCollisionEnter: safeData.OnCollisionEnter,
			OnCollisionStay: safeData.OnCollisionStay,
			OnCollisionLeave: safeData.OnCollisionLeave,
		}
		
		KEEPER._colliders.push(collider);
		
		KEEPER.Log ({message: 'Creating Sphere Collider: ' + collider.id});
		
		return collider
	},
	
	RemoveCollider: (data) => {
		var safeData = KEEPER._EnsureDefaults ({
				id: ''
			},
			data
		);
		
		KEEPER._colliders = KEEPER._colliders.filter (c => c.id != safeData.id); 
	},
	
	Log: (data) => {
		var safeData = KEEPER._EnsureDefaults({
				debugKey: '',
				message: 'No message provided for log.', 
				severity: ''
			}, 
			data
		);
		
		// Don't log debug info if its turned off.
		if (KEEPER.debug [safeData.debugKey] == false) {return;}
		
		var prefixKeeper, prefixKeeperStyle, prefix;
		var prefixTime = '[ ' + new Date().toLocaleTimeString() + ' ]';
		
		switch (safeData.severity) {
			case KEEPER.severity.quiet:
				prefixKeeper = '%c KEEPER ' + prefixTime;
				prefixKeeperStyle = 'color:#aaaaaa; font-size: 0.9em;';
				console.log (prefixKeeper, prefixKeeperStyle, safeData.message);
				break;
			case KEEPER.severity.error:
				prefixKeeper = '%c!!! KEEPER';
				prefixKeeperStyle = 'font-weight:bold; color:#ff2158; font-size: 1.2em';
				prefix = prefixKeeper + prefixTime + '\n';
				console.log (prefix, prefixKeeperStyle, safeData.message);
				break;
			default: 
				prefixKeeper = '%cKEEPER ';
				prefixKeeperStyle = 'font-weight:bold; color:#13efe0';
				prefix = prefixKeeper + prefixTime + '\n';
				console.log (prefix, prefixKeeperStyle, safeData.message);
				break;
		}
	},
	
	Stop: () => {
		KEEPER._stopUpdate = true;
	},
	
	Resume: () => {
		KEEPER._stopUpdate = false;
	},
}

// Capture key events
$(window).on('keydown', (data) => {
	KEEPER._KeyListener({type: 'down', key: data.key}); 
});

$(window).on('keyup', (data) => {
	KEEPER._KeyListener({type: 'up', key: data.key}); 
});

// Setting up Delta Time
KEEPER._timeLastFrameMs = Date.now ();

// Start the update loop
KEEPER._Boot();
