class HabiticaUser {
	constructor(data) {
		this.apiData = data;
		this.stats = this._calculateStats();
	}

	get gems() {
		return this.apiData.balance * 4;
	}
	get hourglasses() {
		return this.apiData.purchased.plan.consecutive.trinkets;
	}
	get gold() {
		return Math.round(this.apiData.stats.gp);
	}
	get goldCompact() {
		const formatter = new Intl.NumberFormat('lookup', {
			notation: 'compact',
			compactDisplay: 'short',
		});
		return formatter.format(this.gold);
	}
	get level() {
		return this.apiData.stats.lvl;
	}
	get displayName() {
		return this.apiData.profile.name;
	}
	get className() {
		return this.apiData.stats.class;
	}
	get experience() {
		return Math.floor(this.apiData.stats.exp);
	}
	get experienceToLevel() {
		return Math.round(this.apiData.stats.toNextLevel);
	}
	get mana() {
		return Math.floor(this.apiData.stats.mp);
	}
	get manaMax() {
		return Math.round(this.apiData.stats.maxMP);
	}
	get health() {
		return Math.floor(this.apiData.stats.hp);
	}
	get healthMax() {
		return Math.round(this.apiData.stats.maxHealth);
	}
	get stealth() {
		return this.apiData.stats.buffs.stealth;
	}
	get armor() {
		return this.apiData.items.gear.equipped;
	}
	get costume() {
		return this.apiData.items.gear.costume;
	}
	get outfit() {
		return this.apiData.preferences.costume == true ? this.costume : this.armor;
	}
	get isSleeping() {
		return this.apiData.preferences.sleep;
	}


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

	// this user's constitution bonus against daily damage
	get constitutionBonus() {
		let bonus = 1 - (this.stats.totals.con / 250);
		return (bonus < 0.1) ? 0.1 : bonus;
	}

	get quest() {
		return (this.apiData.party.quest);
	}

	get isOnQuest() {
		if (this.quest.data != null) {
			return true;
		}
		return false;
	}

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

	get tasks() {
		return this._taskManager;
	}
}
