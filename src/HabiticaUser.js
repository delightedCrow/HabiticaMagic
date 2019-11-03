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
