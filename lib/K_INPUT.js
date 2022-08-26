// K_INPUT is integrated directly into the KEEPER library.
// It is fractured out for maintainability.

var K_INPUT = {
	keys: {
		down: {},
		held: {},
		up: {},
	},

	// Gets the key states from down, held, or up areas.
	GetActiveKeysFromArea: (area) => {
		var result = [];

		Object.keys(area).forEach(key => {
			if (area[key] > 0) { result.push(key); }
		});

		return result;
	},

	GetInputState: () => {
		return {
			down: KEEPER.GetActiveKeysFromArea(KEEPER.keys.down),
			held: KEEPER.GetActiveKeysFromArea(KEEPER.keys.held),
			up: KEEPER.GetActiveKeysFromArea(KEEPER.keys.up)
		}
	},

	GetKeyStateSafeData: (data) => {
		return KEEPER.EnsureDefaults(
			{ key: '' },
			data
		);
	},

	// Returns true if the key was pressed this frame.
	GetKeyDown: (data) => {
		var safeData = KEEPER.GetKeyStateSafeData(data);

		return KEEPER.KeyMatchesState(safeData.key, 'down', 1);
	},

	// Returns true if key is being held.
	GetKeyHeld: (data) => {
		var safeData = KEEPER.GetKeyStateSafeData(data);

		return KEEPER.KeyMatchesState(safeData.key, 'held', 1);
	},

	// Returns true if key was released this frame.
	GetKeyUp: (data) => {
		var safeData = KEEPER.GetKeyStateSafeData(data);

		return KEEPER.KeyMatchesState(safeData.key, 'up', 1);
	},

	KeyListener: (data) => {
		var key = data.key;
		var eventType = data.type;

		if (eventType == 'down' && KEEPER.keys.held[key] == 1) { return; }

		KEEPER.Log({
			debugKey: 'keypress',
			severity: KEEPER.severity.quiet,
			message: eventType + ': ' + key
		});

		switch (eventType) {
			case 'down':
				KEEPER.keys.held[key] = 1; KEEPER.keys.up[key] = 0; KEEPER.keys.down[key] = 1;
				break;
			case 'up':
				KEEPER.keys.held[key] = 0; KEEPER.keys.down[key] = 0; KEEPER.keys.up[key] = 1;
				break;
		}
	},

	KeyMatchesState: (key, keyArea, state) => {
		return KEEPER.keys[keyArea][key] == state;
	},

	UpdateKeyState: () => {
		// let pressed keys be marked as pressed for 1 frame
		Object.keys(KEEPER.keys.down).forEach(key => {
			if (KEEPER.keys.down[key] == 1) {
				KEEPER.keys.down[key] = 0;
				KEEPER.keys.held[key] = 1;
			}
		});

		Object.keys(KEEPER.keys.up).forEach(key => {
			if (KEEPER.keys.up[key] == 1) {
				KEEPER.keys.up[key] = 0;
			}
		});
	},
}