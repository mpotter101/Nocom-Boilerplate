var K_COLLISION = {
	CheckForCollisions: () => {
		// Check for any new or continued collisions
		KEEPER._colliders.forEach(collider => {
			KEEPER._colliders.forEach(otherCollider => {
				if (
					collider.id != otherCollider.id &&
					collider.team != otherCollider.team
				) {
					var result = KEEPER.CheckSphereIntersection(collider, otherCollider)
					var currentState = collider.collisions[otherCollider.id];
					var data = { owner: collider.owner, other: otherCollider.owner };

					if (!(otherCollider.id in collider.collisions)) {
						collider.collisions[otherCollider.id] = false;
					}

					// A collision happened this frame.
					if (currentState == false && result == true) {
						collider.OnCollisionEnter(data);
					}

					// A collision has been occurring since last frame
					if (
						(currentState == false && result == true) ||
						(currentState == true && result == true)
					) {
						collider.OnCollisionStay(data);
					}

					// A collision just stopped happening
					if (currentState == true && result == false) {
						collider.OnCollisionLeave(data);
					}

					collider.collisions[otherCollider.id] = result;
				}
			});
		});
	},

	CheckSphereIntersection: (sphereA, sphereB) => {
		var distance = sphereA.sceneObj.position.distanceTo(sphereB.sceneObj.position);

		return distance < sphereA.radius + sphereB.radius
	},

	CreateCollisionSphere: (data) => {
		var safeData = KEEPER.EnsureDefaults({
			owner: KEEPER,
			diameter: 1,
			OnCollisionEnter: () => { },
			OnCollisionStay: () => { },
			OnCollisionLeave: () => { },
			enabled: true,
			id: KEEPER.GenerateKeeperId({ length: 20 }),
			team: KEEPER.GenerateKeeperId({ length: 20 }),

			// for debug view
			verticalSections: 8,
			horizontalSections: 8,
			color: 0xffffff,
		},
			data
		);

		var sphere = new THREE.SphereGeometry(
			safeData.diameter * 0.5,
			safeData.verticalSections,
			safeData.horizontalSections
		);

		var wireframe = new THREE.EdgesGeometry(sphere);
		var sceneObj = new THREE.LineSegments(wireframe);

		// hide collider
		//sceneObj.material.depthTest = false;
		sceneObj.material.transparent = true;
		sceneObj.material.opacity = 0;
		sceneObj.material.color = new THREE.Color(safeData.color);

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
			DrawOnTop: () => { sceneObj.material.depthTest = false },
			DrawWithDepth: () => { sceneObj.material.depthTest = true },
			OnCollisionEnter: safeData.OnCollisionEnter,
			OnCollisionStay: safeData.OnCollisionStay,
			OnCollisionLeave: safeData.OnCollisionLeave,
		}

		KEEPER._colliders.push(collider);

		KEEPER.Log({ message: 'Creating Sphere Collider: ' + collider.id });

		return collider
	},

	RemoveCollider: (data) => {
		var safeData = KEEPER.EnsureDefaults({
			id: ''
		},
			data
		);

		KEEPER._colliders = KEEPER._colliders.filter(c => c.id != safeData.id);
	},
}