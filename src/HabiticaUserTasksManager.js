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
