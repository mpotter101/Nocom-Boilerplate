var K_TIME = {
	AddTimedEvent: (data) => {
		var safeData = KEEPER.EnsureDefaults(
			{
				id: KEEPER.GenerateName({ length: 20 }),
				waitForSeconds: 1,
				context: KEEPER,
				callback: (d) => { console.log('Event fired off from', d.context); }
			},
			data
		);

		safeData.timer = 0;
		KEEPER._timedEvents.push(safeData);
		return safeData.id;
	},

	GetTimedEvent: (data) => {
		var safeData = KEEPER.EnsureDefaults(
			{ id: '' },
			data
		);

		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate[key];

			if (item.id == safeData.id) {
				return KEEPER._timedEvents[key]
			}
		}

		return null;
	},

	RemoveTimedEvent: (data) => {
		var safeData = KEEPER.EnsureDefaults(
			{ id: '' },
			data
		);

		var item, key;
		for (key = 0; key < KEEPER._onUpdate; key++) {
			item = KEEPER._onUpdate[key];

			if (item.id == safeData.id) {
				KEEPER._timedEvents[key] = null;
				return true;
			}
		}

		return false;
	},

	UpdateTimedEvents: () => {
		// increment all timers by current delta time
		// and fire off any that are ready
		KEEPER._timedEvents.forEach(evnt => {
			evnt.timer += KEEPER.deltaTime;

			if (evnt.timer >= evnt.waitForSeconds) {
				evnt.callback({ context: evnt.context });
			}
		});

		// Remove all events that have expired
		KEEPER._timedEvents = KEEPER._timedEvents.filter(evnt => evnt != null && evnt.timer < evnt.waitForSeconds);
	},
}