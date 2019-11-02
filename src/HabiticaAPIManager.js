/**
 * This class manages the calls to the Habitica API and converts the responses
 * into helpful class types.
 * @param {string} xclient - The xclient header string for this application. See {@link HabiticaAPIManager#xclient|xclient}
 * @param {string} [language="en"] - The language code to retrieve content for. See {@link HabiticaAPIManager#language|language}
 */
class HabiticaAPIManager {
	constructor(xclient, language="en") {
		/**
		 * The language code to retrieve content for. See https://habitica.com/apidoc/#api-Content-ContentGet for list of allowed values.
		 * @type {string}
		 */
		this.language = language;
		/**
		 * The xclient header string for this application. See https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header for details.
		 * @type {string}
		 */
		this.xclient = xclient;
		/**
		 * The data cache for looking up Habitica content such as items, quests, or appearance information.
		 * @type {object}
		 */
		this.content = {};
	}

	// UNAUTHENTICATED HELPER FUNCTIONS

	/**
	 * Load Habitica content from the api. Populates the {@link HabiticaAPIManager#content|content} attribute.
	 * @returns {Promise}
	 */
	fetchContentData() {
		const baseURL = "https://habitica.com/api/v3/content";
		return this.getRequest(baseURL, {language: this.language})
		.then((rawData) => {
			var data = JSON.parse(rawData).data;
			this.content = data;
		});
	}

	/**
	 * Fetches a HabiticaUser instance from the api, containing publicly visible user data.
	 * @param {HabiticaUserID} userID - The ID of the habitica user.
	 * @returns {Promise<HabiticaUser>} Promise provides a HabiticaUser instance.
	 */
	fetchUser(userID) {
		const baseURL = "https://habitica.com/api/v3/members/" + userID;
		return this.getRequest(baseURL)
		.then((rawData) => {
			var data = JSON.parse(rawData).data;
			let user = new HabiticaUser(this.replaceKeysWithContent(data));
			return user;
		});
	}

	// AUTHENTICATED HELPER FUNCTIONS

	/**
	 * Fetches a HabiticaUser instance, including personal information.
	 * @param {HabiticaUserID} userID
	 * @param {HabiticaAPIToken} userAPIToken
	 * @returns {Promise<HabiticaUser>} Promise provides a HabiticaUser instance.
	 */
	fetchAuthenticatedUser(userID, userAPIToken) {
		const url = "https://habitica.com/api/v3/user";
		return this.authGetRequest(url, userID, userAPIToken)
		.then((rawData) => {
			var data = JSON.parse(rawData).data;
			let user = new HabiticaUser(this.replaceKeysWithContent(data));
			return user;
		});
	}

	/**
	 * Fetches the list of tasks for a given user.
	 * @param {HabiticaUserID} userID
	 * @param {HabiticaAPIToken} userAPIToken
	 * @returns {Promise<HabiticaUserTasksManager>}
	 */
	fetchUserTasks(userID, userAPIToken) {
		const url = "https://habitica.com/api/v3/tasks/user";
		 return this.authGetRequest(url, userID, userAPIToken)
		.then((rawData) => {
			var data = JSON.parse(rawData).data;
			let tasks = new HabiticaUserTasksManager(data);
			return tasks;
		});
	}

	/**
	 * Fetches a user and their list of tasks.
	 * @param {HabiticaUserID} userID
	 * @param {HabiticaAPIToken} userAPIToken
	 * @returns {Promise<HabiticaUser>} Promise provides a HabiticaUser instance, with a populated tasks manager.
	 */
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

	/**
	 * Make an authenticated GET request to the Habitica API. Data object returned varies based on the API url called.
	 * @param {string} baseURL - the url of the api call.
	 * @param {HabiticaUserID} userID - the ID of the user, needed for authentication.
	 * @param {HabiticaAPIToken} userAPIToken - the API Token for the user, needed for authentication.
	 * @param {object} [queryParams={}] - key-value pairs for any parameters needed by the api call.
	 * @returns {Promise<String>} Promise containing the raw API response data as a string.
	 */
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
					resolve(this.responseText);
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

	/**
	 * Make a GET request to the Habitica API.
	 * Data object returned varies based on the API url called.
	 * For accessing personal data endpoints, use {@link HabiticaAPIManager#authGetRequest|authGetRequest}
	 * @param {string} baseURL - the url of the api call.
	 * @param {object} [queryParams={}] - key-value pairs for any parameters needed by the api call.
	 * @returns {Promise<String>} Promise containing the raw API response data as a string.
	 */
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
					resolve(this.responseText);
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

	/**
	 * Updates the data object keys with values from the the {@link HabiticaAPIManager#content|content}.
	 * @param {object} data - See {@link HabiticaUser#apiData|HabiticaUser.apiData}
	 * @returns {object} The same data object passed in, after it is updated.
	 */
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

	/**
	 * Convert a base url and query parameters into a full url with querystring.
	 * @param {string} baseURL the URI of the API endpoint.
	 * @param {object} queryParams key-value pairs in an object to be parameterized.
	 * @returns {string} the full url with querystring.
	 */
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


/**
 * The User's ID. See https://habitica.fandom.com/wiki/API_Options#User_ID_.28UID.29
 * @typedef {string} HabiticaUserID
 */

/**
 * The User's API Token. See https://habitica.fandom.com/wiki/API_Options#API_Token
 * @typedef {string} HabiticaAPIToken
 */
