var K_FACTORY = {
	camTypes: {
		orthographic: 'OrthographicCamera',
		perspective: 'PerspectiveCamera'
	},

	CreateScene: (data) => {
		var safeData = data;

		// prevents confusing logs in console
		if (!('camera' in safeData)) {
			safeData.camera = KEEPER.CreateCamera();
		}

		var camera = safeData.camera;
		var scene = new THREE.Scene();
		var renderer = new THREE.WebGLRenderer();

		return {
			camera, scene, renderer,
			Add: (sceneObj) => { scene.add(sceneObj); },
		}
	},

	CreateBasicKeeperShape: () => {
		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		var sceneObj = new THREE.Mesh(geometry, material);

		return { geometry, material, sceneObj }
	},

	// Creates a THREE.cam with sensible defaults that can be customized.
	CreateCamera: (data) => {
		var safeData = KEEPER.EnsureDefaults(
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
				KEEPER.Log({ message: 'Making ' + KEEPER.camTypes.perspective + ' camera' });
				// return the perspective camera
				return new THREE.PerspectiveCamera(
					safeData.fov,
					safeData.aspectRatio,
					safeData.nearClipping,
					safeData.farClipping
				);
				break;
			case KEEPER.camTypes.orthographic:
				KEEPER.Log({ message: 'Making ' + KEEPER.camTypes.orthographic + ' camera' });

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
				console.log("Camera type", type, "not recognized. Try either", ortho, "or", persp);
				break;
		}
	},

	// Creates a new THREE scene with sensible defaults that can be customized.
	CreateKeeperScene: (data) => {
		var safeData = KEEPER.EnsureDefaults(
			{
				node: $(document.body),
				height: KEEPER.defaults.scene.height,
				width: KEEPER.defaults.scene.width,
			},
			data
		);

		// Function act a bit weird when passed into EnsureDefaults...
		// manually assigning here to avoid that.
		if (!('camera' in safeData)) {
			console.log('here');
			safeData.camera = KEEPER.CreateCamera()
		}

		if (!('name' in safeData)) {
			safeData.name = KEEPER.GenerateName()
		}

		var n = safeData.name;
		var node = safeData.node;

		KEEPER.scenes[n] = KEEPER.CreateScene(safeData)
		KEEPER.scenes[n].renderer.setSize(safeData.width, safeData.height);

		node.append(KEEPER.scenes[n].renderer.domElement);

		KEEPER.Log({ message: 'Creating scene: ' + n });

		return KEEPER.scenes[n];
	},
}