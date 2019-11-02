class HabiticaAPIManager {
	constructor(language="en", xclient) {
		this.language = language;
		// For more info on the xclient header: https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header
		this.xclient = xclient;
		this.content = {};
	}

	// UNAUTHENTICATED HELPER FUNCTIONS
	fetchContentData() {
		const baseURL = "https://habitica.com/api/v3/content";
		return this.getRequest(baseURL, {language: this.language})
		.then((data) => {
			this.content = data;
		});
	}

	fetchUser(userID) {
		const baseURL = "https://habitica.com/api/v3/members/" + userID;
		return this.getRequest(baseURL)
		.then((data) => {
			let user = new HabiticaUser(this.replaceKeysWithContent(data));
			return user;
		});
	}

	// AUTHENTICATED HELPER FUNCTIONS
	fetchAuthenticatedUser(userID, userAPIToken) {
		const url = "https://habitica.com/api/v3/user";
		return this.authGetRequest(url, userID, userAPIToken)
		.then((data) => {
			let user = new HabiticaUser(this.replaceKeysWithContent(data));
			return user;
		});
	}

	fetchUserTasks(userID, userAPIToken) {
		const url = "https://habitica.com/api/v3/tasks/user";
		 return this.authGetRequest(url, userID, userAPIToken)
		.then((data) => {
			let tasks = new HabiticaUserTasksManager(data);
			return tasks;
		});
	}

	fetchUserWithTasks(userID, userAPIToken) {
		var user;
		return this.fetchAuthenticatedUser(userID, userAPIToken)
		.then((newUser) => {
			user = newUser;
			return this.fetchUserTasks(userID, userAPIToken);
		})
		.then((tasks) => {
			user.tasks = tasks;
			return user;
		});
	}

	// API REQUEST FUNCTIONS

	authGetRequest(baseURL, userID, userAPIToken, queryParams={}) {
		let url = this.getQueryStringURL(baseURL, queryParams);

		let promise = new Promise((resolve, reject) => {
			let req = new XMLHttpRequest();
			req.open("GET", url);

			req.onerror = function() {
				reject(this.statusText);
			};

			req.onload = function() {
				if (this.status == 200) {
					var data = JSON.parse(this.responseText).data;
					resolve(data);
				} else {
					reject(this.responseText);
				}
			}

			req.setRequestHeader("x-api-user", userID);
			req.setRequestHeader("x-api-key", userAPIToken);
			req.setRequestHeader("x-client", this.xclient);
			req.send();
		});

		return promise;
	}

	getRequest(baseURL, queryParams={}) {
		let url = this.getQueryStringURL(baseURL, queryParams);

		let promise = new Promise((resolve, reject) => {
			let req = new XMLHttpRequest();
			req.open("GET", url);

			req.onerror = function() {
				reject(this.statusText);
			};

			req.onload = function() {
				if (this.status == 200) {
					var data = JSON.parse(this.responseText).data;
					resolve(data);
				} else {
					reject(this.responseText);
				}
			}
			req.setRequestHeader("x-client", this.xclient);
			req.send();
		});

		return promise;
	}

	// CLASS HELPER FUNCTIONS

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

	getQueryStringURL(baseURL, queryParams) {
		let params = Object.entries(queryParams);
		if (params.length < 1) {
			return baseURL;
		}

		return baseURL + "?" +
			params.map(kv => kv.map(encodeURIComponent).join("="))
			.join("&");
	}
}
