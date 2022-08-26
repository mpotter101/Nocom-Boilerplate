var K_HELPER = {
	// Debug options
	debug: {
		keypress: false
	},

	// Log severity options
	severity: {
		error: 'error',
	},

	// For name and ID gen.
	characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',

	// Methods
	EnsureDefaults: (defaultValues, actualValues) => {
		if (actualValues == undefined) { actualValues = {} }

		if (actualValues.constructor != Object) {
			throw new Error("Values provided to method are not an object literal.");
		}

		return Object.assign(
			defaultValues,
			actualValues
		);
	},

	Log: (data) => {
		var safeData = KEEPER.EnsureDefaults({
			debugKey: '',
			message: 'No message provided for log.',
			severity: ''
		},
			data
		);

		// Don't log debug info if its turned off.
		if (KEEPER.debug[safeData.debugKey] == false) { return; }

		var prefixKeeper, prefixKeeperStyle, prefix;
		var prefixTime = '[ ' + new Date().toLocaleTimeString() + ' ]';

		switch (safeData.severity) {
			case KEEPER.severity.quiet:
				prefixKeeper = '%c KEEPER ' + prefixTime;
				prefixKeeperStyle = 'color:#aaaaaa; font-size: 0.9em;';
				console.log(prefixKeeper, prefixKeeperStyle, safeData.message);
				break;
			case KEEPER.severity.error:
				prefixKeeper = '%c!!! KEEPER';
				prefixKeeperStyle = 'font-weight:bold; color:#ff2158; font-size: 1.2em';
				prefix = prefixKeeper + prefixTime + '\n';
				console.log(prefix, prefixKeeperStyle, safeData.message);
				break;
			default:
				prefixKeeper = '%cKEEPER ';
				prefixKeeperStyle = 'font-weight:bold; color:#13efe0';
				prefix = prefixKeeper + prefixTime + '\n';
				console.log(prefix, prefixKeeperStyle, safeData.message);
				break;
		}
	},

	GenerateKeeperId: (data) => {
		var safeData = KEEPER.EnsureDefaults(
			{
				length: KEEPER.defaults.name.length,
			},
			data
		);

		var id = Date.now() + '-' + KEEPER.GenerateName(safeData);
		return id;
	},

	GenerateName: (data) => {
		var safeData = KEEPER.EnsureDefaults(
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
}