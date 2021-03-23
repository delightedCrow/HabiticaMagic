/*
 * HabiticaMagic.js
 * https://github.com/delightedCrow/HabiticaMagic
 *
 * A convenient way to interact with the Habitica API
 * (https://habitica.com/apidoc/).
 *
 * Copyright © 2019 JSC (@delightedCrow) & PJM (@ArrayOfFrost)
 *
 * MIT Licensed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

/**
 * A class representing the list of tasks for a HabiticaUser.
 * @param {Array<object>} data - the list of tasks returned from the api call
 */
class HabiticaUserTasksManager {
	constructor(data) {
		/**
		 * The list of tasks.
		 * @type {Array<object>}
		 */
		this.apiData = data;
	}

	/**
	 * The list of tasks.
	 * @type {Array<object>}
	 */
	get taskList() {
		return this.apiData;
	}

	/**
	 * The list of Todo tasks due by the end of today.
	 * @type {Array<object>}
	 */
	get todosDueToday() {
		return this.todosDueOnDate(moment().endOf('day'));
	}

	/**
	 * The list of Todo tasks due by the end of a specific date.
	 * @param {Date} dueDate the date to compare tasks due dates to.
	 * @returns {Array<object>}
	 */
	todosDueOnDate(dueDate) {
		var todos = [];

		for (var i=0; i<this.taskList.length; i++) {
			let task = this.taskList[i];
			if (task.type != "todo") { continue; }

			if (task.date) {
				var taskTime = moment(task.date);
				if (taskTime.isBefore(dueDate)) {
						todos.push(task);
				}
			}
		}

		return todos;
	}

	/**
	 * Calculates the number of unfinished dailies due today, and any
	 * incoming damage that the user will take as a result.
	 * @param {HabiticaUser} user - the user's stats are needed to calculate damage correctly.
	 * @returns {DailyStats}
	 */
	calculateDailyStatsFor(user) {

		var stats = {
			dueCount: 0,
			totalDamageToSelf: 0,
			dailyDamageToSelf: 0,
			bossDamage: 0,
			dailiesEvaded: 0
		}
		const min = -47.27; // task value cap min
		const max = 21.27; // task value cap max
		var stealthRemaining = user.stealth;
		let conBonus = user.constitutionBonus;

		for (var i=0; i<this.taskList.length; i++) {
			let task = this.taskList[i];
			// skip the rest of this for loop if the task isn't a daily, isn't due, or is completed
			if (task.type != "daily") { continue; }
			if (!task.isDue || task.completed) { continue; }

			// thieves can cast stealth to avoid a certain number of dailies
			if (stealthRemaining > 0) { // avoided!
				stealthRemaining --;
				stats.dailiesEvaded ++;
			} else { // calculate damage!

				stats.dueCount ++;

				var taskDamage = (task.value < min) ? min : task.value;
				taskDamage = (taskDamage > max) ? max : taskDamage;
				taskDamage = Math.abs(Math.pow(0.9747, taskDamage));

				// if a subtask is completed, decrease the task damage proportionately
				if (task.checklist.length > 0 ) {
					var subtaskDamage = (taskDamage/task.checklist.length);
					for (var j=0; j<task.checklist.length; j++) {
						if (task.checklist[j].completed) {
							taskDamage = taskDamage - subtaskDamage;
						}
					}
				}

				var damage = taskDamage * conBonus * task.priority * 2;
				stats.dailyDamageToSelf += Math.round(damage * 10) / 10; // round damage to nearest tenth because game does

				// if we have a quest and a boss we can calculate the damage to party from this daily
				if (user.isOnBossQuest) {
					var bossDamage = (task.priority < 1) ? (taskDamage * task.priority) : taskDamage;
					bossDamage *= user.quest.data.boss.str;
					stats.bossDamage += bossDamage;
				}
			}
		}
		// formatting display - rounding up to be safe like Lady Alys does :) - see https://github.com/Alys/tools-for-habitrpg/blob/29710e0f99c9d706d6911f49d60bcceff2792768/habitrpg_user_data_display.html#L1952
		stats.totalDamageToSelf = stats.dailyDamageToSelf + stats.bossDamage;
		stats.totalDamageToSelf = Math.ceil(stats.totalDamageToSelf * 10) / 10;
		stats.bossDamage = Math.ceil(stats.bossDamage * 10) / 10;

		this.dailyStats = stats;
	}
}


/**
 * @typedef {object} DailyStats
 * @property {Number} dueCount - Count of unfinished dailes that are due today.
 * @property {Number} totalDamageToSelf - Total damage user will receive from missed dailies and boss damage.
 * @property {Number} dailyDamageToSelf - Damage user will receive from missed dailies.
 * @property {Number} bossDamage - Damage entire party will receive from boss due to missed dailies.
 * @property {Number} dailiesEvaded - Number of unfinished dailes ignored due to Rogue sneakiness.
 */

/**
 * A class representing the Habitica User.
 * @class
 * @param {object} data the json data object returned from the habitica API.
 */
class HabiticaUser {
	constructor(data) {
		this.apiData = data;
		this.stats = this._calculateStats();
	}
	/**
	 * The number of Subscriber Gems the user owns.
	 * @type {number}
	 */
	get gems() {
		return this.apiData.balance * 4;
	}
	/**
	 * The number of Mystic Hourglasses the user owns.
	 * @type {number}
	 */
	get hourglasses() {
		return this.apiData.purchased.plan.consecutive.trinkets;
	}
	/**
	 * The amount of Gold the user owns.
	 * @type {number}
	 */
	get gold() {
		return Math.round(this.apiData.stats.gp);
	}
	/**
	 * The amount of Gold the user owns as a nicely formatted string.
	 * @type {number}
	 */
	get goldCompact() {
		const formatter = new Intl.NumberFormat('lookup', {
			notation: 'compact',
			compactDisplay: 'short',
		});
		return formatter.format(this.gold);
	}
	/**
	 * The experience level of the user.
	 * @type {number}
	 */
	get level() {
		return this.apiData.stats.lvl;
	}
	/**
	 * The displayed name of the user.
	 * @type {string}
	 */
	get displayName() {
		return this.apiData.profile.name;
	}
	/**
	 * The character class of the user.
	 * @type {string}
	 */
	get className() {
		// the mage class is defined as "wizard" in the API, but referred
		// to everywhere else in Habitica as mage, so we're gonna return mage
		// here as that's what users on the front end would expect to see
		// https://habitica.fandom.com/wiki/Guidance_for_Comrades#Class_Name_.28State_Mage_Instead_of_Wizard.29
		if (this.apiData.stats.class == "wizard") {
			return "mage";
		}
		return this.apiData.stats.class;
	}
	/**
	 * The bio of the user (may contain markdown formatting).
	 * @type {string}
	 */
	get bio() {
		return this.apiData.profile.blurb;
	}
	/**
	 * The experience points the user has gained so far this level.
	 * @type {Number}
	 */
	get experience() {
		return Math.floor(this.apiData.stats.exp);
	}
	/**
	 * The experience points needed to reach the next level.
	 * @type {Number}
	 */
	get experienceToLevel() {
		return Math.round(this.apiData.stats.toNextLevel);
	}
	/**
	 * The amount of remaining Mana the user currently has.
	 * @type {Number}
	 */
	get mana() {
		return Math.floor(this.apiData.stats.mp);
	}
	/**
	 * The maximum amount of mana the user can have.
	 * @type {Number}
	 */
	get manaMax() {
		return Math.round(this.apiData.stats.maxMP);
	}
	/**
	 * The amount of remaining health the user currently has.
	 * @type {Number}
	 */
	get health() {
		return Math.floor(this.apiData.stats.hp);
	}
	/**
	 * The maximum amount of health the user can have.
	 * @type {Number}
	 */
	get healthMax() {
		return Math.round(this.apiData.stats.maxHealth);
	}
	/**
	 * The number of dailies this user can skip without taking damage. (Rogue Skill)
	 * @type {Number}
	 */
	get stealth() {
		return this.apiData.stats.buffs.stealth;
	}
	/**
	 * The set of items this user has equipped.
	 * @type {object}
	 */
	get armor() {
		return this.apiData.items.gear.equipped;
	}
	/**
	 * The set of costume items this user has equipped.
	 * @type {object}
	 */
	get costume() {
		return this.apiData.items.gear.costume;
	}
	/**
	 * The visual set of items the user has on (either {@link HabiticaUser#armor|armor}
	 * or {@link HabiticaUser#costume|costume} depending on the users preferences).
	 * @type {object}
	 */
	get outfit() {
		return this.apiData.preferences.costume == true ? this.costume : this.armor;
	}
	/**
	 * Flag to check if user is in the Inn.
	 * @type {Boolean}
	 */
	get isSleeping() {
		return this.apiData.preferences.sleep;
	}

	/**
	 * @private
	 */
	_calculateStats() {
		var stats = {
			totals: {str: 0, con: 0, int: 0, per: 0},
			armor: {str: 0, con: 0, int: 0, per: 0},
			buffs: {
				str: this.apiData.stats.buffs.str,
				con: this.apiData.stats.buffs.con,
				int: this.apiData.stats.buffs.int,
				per: this.apiData.stats.buffs.per
			},
			points: {
				str: this.apiData.stats.str,
				con: this.apiData.stats.con,
				int: this.apiData.stats.int,
				per: this.apiData.stats.per
			}
		}

		// calculate armor stats from each piece of armor
		for (var key in this.armor) {
			let item = this.armor[key];
			for (var stat in stats.armor) {
				stats.armor[stat] += item[stat];
				// apply class bonus if user is wearing special class gear
				if (this.className === item.klass ||
						this.className === item.specialClass) {
					stats.armor[stat] += .5 * item[stat];
				}
			}
		}

		// add up all stats for total, including level bonus
		let levelBonus = Math.floor(this.level / 2);
		for (var stat in stats.totals) {
			stats.totals[stat] = stats.armor[stat] +
				stats.buffs[stat] +
				stats.points[stat] +
				levelBonus;
		}

		return stats;
	}

	/**
	 * This user's constitution bonus against daily damage.
	 * @type {Number}
	 */
	get constitutionBonus() {
		let bonus = 1 - (this.stats.totals.con / 250);
		return (bonus < 0.1) ? 0.1 : bonus;
	}

	/**
	 * The quest the user is currently on, if any.
	 * @type {object}
	 */
	get quest() {
		return (this.apiData.party.quest);
	}

	/**
	 * Flag to check if user is on a quest.
	 * @type {Boolean}
	 */
	get isOnQuest() {
		if (this.quest.data != null) {
			return true;
		}
		return false;
	}

	/**
	 * Flag to check if user is on a boss quest.
	 * @type {Boolean}
	 */
	get isOnBossQuest() {
		if (this.isOnQuest && this.quest.data.boss != null) {
			return true;
		}
		return false;
	}

	set tasks(userTaskManager) {
		this._taskManager = userTaskManager;
		this.tasks.calculateDailyStatsFor(this);
	}
	/**
	 * The object managing this users tasks, if they have been loaded.
	 * @type {HabiticaUserTasksManager}
	 */
	get tasks() {
		return this._taskManager;
	}
}

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

  /**
	 * Make a POST request to the Habitica API.
	 * Data object returned varies based on the API url called.
	 * @param {string} baseURL - the url of the api call.
	 * @param {HabiticaUserID} userID - the ID of the user, needed for authentication.
	 * @param {HabiticaAPIToken} userAPIToken - the API Token for the user, needed for authentication.
	 * @param {object} [queryParams={}] - key-value pairs for any parameters needed by the api call.
	 * @returns {Promise<String>} Promise containing the raw API response data as a string.
	 */
	postRequest(baseURL, userID, userAPIToken, queryParams={}) {
		let promise = new Promise((resolve, reject) => {
			let req = new XMLHttpRequest();
			req.open("POST", baseURL);

			req.onerror = function() {
				reject(this.responseText);
			};

			req.onload = function() {
				if (req.status === 201 || req.status === 200) {
					resolve(this.responseText);
				} else {
					reject(this.responseText);
				}
			}
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			req.setRequestHeader("x-client", this.xclient);
			req.setRequestHeader("x-api-user", userID);
			req.setRequestHeader("x-api-key", userAPIToken);
			req.send(JSON.stringify(queryParams));
		});
		return promise
	}

	// CLASS HELPER FUNCTIONS

	/**
	 * Updates the data object keys with values from the the {@link HabiticaAPIManager#content|content}.
	 * @param {object} data - See {@link HabiticaUser#apiData|HabiticaUser.apiData}
	 * @returns {object} The same data object passed in, after it is updated.
	 */
	replaceKeysWithContent(data) {
		// if we haven't fetched any content data, nothing we can do here
		if (Object.entries(this.content).length == 0) {
			return data;
		}

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
