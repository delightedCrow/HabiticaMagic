class HabiticaAPIManager {
	constructor(language="en", xclient) {
		this.language = language;
		// For more info on the xclient header: https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header
		this.xclient = xclient;
		this.content = {};
	}

	fetchContentData(callback) {
		const url = "https://habitica.com/api/v3/content?language=" +
			this.language;
		let req = this.constructor.APIRequest(url, this.xclient);
		let hm = this;

		req.onload = function() {
			if (this.status == 200) {
				let data = JSON.parse(this.responseText);
				hm.content = data.data;
				if (callback) {
					callback();
				}
			}
		};
		req.send();
	}

	fetchAuthenticatedUser(userID, userAPIToken, callback) {
		const url = "https://habitica.com/api/v3/user";
		let req = this.constructor.authenticatedAPIRequest(url, this.xclient, userID, userAPIToken);
		let hm = this;

		req.onload = function() {
			if (this.status == 200) {
				var data = JSON.parse(this.responseText).data;
				let user = new HabiticaUser(hm.replaceKeysWithContent(data));
				callback(user);
			}
		};
		req.send();
	}

	fetchUserTasks(userID, userAPIToken, callback) {
		const url = "https://habitica.com/api/v3/tasks/user";
		let req = this.constructor.authenticatedAPIRequest(url, this.xclient, userID, userAPIToken);
		let hm = this;

		req.onload = function() {
			if (this.status == 200) {
				var data = JSON.parse(this.responseText).data;
				var tasks = new HabiticaUserTasksManager(data);
				callback(tasks);
			}
		};
		req.send();
	}

	fetchUserWithTasks(userID, userAPIToken, callback) {
		this.fetchAuthenticatedUser(userID, userAPIToken, (user) => {
			this.fetchUserTasks(userID, userAPIToken, (tasks) => {
				user.tasks = tasks;
				callback(user);
			});
		});
	}

	replaceKeysWithContent(data) {
		// replace equipped and costume gear with full content version
		for (var section of [data.items.gear.equipped, data.items.gear.costume]) {
			for (var key in section) {
				let armorName = section[key];
				let armor = this.content.gear.flat[armorName];
				section[key] = armor;
			}
		}
		// replace party quest key with actual quest
		if (data.party.quest.key) {
			data.party.quest.data = this.content.quests[data.party.quest.key];
		}
		return data;
	}

	// API REQUEST FUNCTIONS
	static authenticatedAPIRequest(url, xclient, userID, userAPIToken) {
		let req = new XMLHttpRequest();
		req.open("GET", url);

		req.onerror = function() {
			console.error("HabiticaAPI Error: ", this.statusText);
		};

		req.setRequestHeader("x-api-user", userID);
		req.setRequestHeader("x-api-key", userAPIToken);
		req.setRequestHeader("x-client", xclient);
		return req;
	}

	static APIRequest(url, xclient) {
		let req = new XMLHttpRequest();
		req.open("GET", url);

		req.onerror = function() {
			console.error("HabiticaAPI Error: ", this.statusText);
		};

		req.setRequestHeader("x-client", this.xclient);

		return req;
	}
}
