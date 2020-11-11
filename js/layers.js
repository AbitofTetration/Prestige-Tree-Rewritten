const STATIC_SCALE_STARTS = {
	"1": function() { return new Decimal(12) },
	"2": function() { 
		let start = new Decimal(12);
		if (hasUpgrade("q", 31)) start = start.plus(upgradeEffect("q", 31));
		return start;
	},
	"3": function() { 
		let start = new Decimal(12);
		if (hasUpgrade("q", 31)) start = start.plus(upgradeEffect("q", 31));
		return start;
	},
	"4": function() { return new Decimal(12) },
}

function scaleStaticCost(gain, row) {
	if (gain.gte(1225)) gain = gain.pow(10).div(Decimal.pow(1225, 9));
	let start = (STATIC_SCALE_STARTS[String(row+1)]?STATIC_SCALE_STARTS[String(row+1)]():1);
	if (gain.gte(start)) gain = gain.pow(2).div(start);
	return gain;
}

function softcapStaticGain(gain, row) {
	let start = (STATIC_SCALE_STARTS[String(row+1)]?STATIC_SCALE_STARTS[String(row+1)]():1);
	if (gain.gte(start)) gain = gain.times(start).sqrt();
	if (gain.gte(1225)) gain = gain.times(Decimal.pow(1225, 9)).root(10);
	return gain;
}

addLayer("p", {
        name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#31aeb0",
        requires: new Decimal(10), // Can be a function that takes requirement increases into account
        resource: "prestige points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: 0.5, // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasAchievement("a", 13)) mult = mult.times(1.1);
			if (hasAchievement("a", 32)) mult = mult.times(2);
			if (hasUpgrade("p", 21)) mult = mult.times(1.8);
			if (hasUpgrade("b", 11)) mult = mult.times(upgradeEffect("b", 11));
			if (hasUpgrade("g", 11)) mult = mult.times(upgradeEffect("g", 11));
			if (player.t.unlocked) mult = mult.times(tmp.t.enEff);
			if (player.e.unlocked) mult = mult.times(layers.e.buyables[11].effect().first);
			if (player.s.unlocked) mult = mult.times(buyableEffect("s", 11));
			if (hasUpgrade("e", 12)) mult = mult.times(upgradeEffect("e", 12));
			if (hasUpgrade("b", 31)) mult = mult.times(upgradeEffect("b", 31));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            let exp = new Decimal(1)
			if (hasUpgrade("p", 31)) exp = exp.times(1.05);
			return exp;
        },
        row: 0, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "p", description: "Press P to Prestige.", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return true},
		update(diff) {
			if (hasMilestone("g", 1)) generatePoints("p", diff);
		},
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("b", 0) && resettingLayer=="b") keep.push("upgrades")
			if (hasMilestone("g", 0) && resettingLayer=="g") keep.push("upgrades")
			if (hasMilestone("e", 1) && resettingLayer=="e") keep.push("upgrades")
			if (hasMilestone("t", 1) && resettingLayer=="t") keep.push("upgrades")
			if (hasMilestone("s", 1) && resettingLayer=="s") keep.push("upgrades")
			if (hasAchievement("a", 41)) keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("p", keep)
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
		}},
		upgrades: {
			rows: 3,
			cols: 3,
			11: {
				title: "Begin",
				description: "Generate 1 Point every second.",
				cost() { return tmp.h.costMult11.pow(tmp.h.costExp11) },
			},
			12: {
				title: "Prestige Boost",
				description: "Prestige Points boost Point generation.",
				cost() { return tmp.h.costMult11.pow(tmp.h.costExp11) },
				effect() {
					let eff = player.p.points.plus(2).pow(0.5);
					if (hasUpgrade("g", 14)) eff = eff.pow(1.5);
					if (hasUpgrade("g", 24)) eff = eff.pow(1.4666667);
					
					if (eff.gte("1e3500")) {
						if (hasChallenge("h", 22)) eff = Decimal.pow(10, eff.log10().sqrt().times(Math.sqrt(3500)));
						else eff = eff.log10().times(Decimal.div("1e3500", 3500));
					}
					return eff;
				},
				unlocked() { return hasUpgrade("p", 11) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { 
					let exp = format(0.5*(hasUpgrade("g", 14)?1.5:1)*(hasUpgrade("g", 24)?1.4666667:1));
					let f = "(x+2)^"+exp
					if (upgradeEffect("p", 12).gte("1e3500")) {
						if (hasChallenge("h", 22)) f = "10^(sqrt(log(x+2))*"+format(Decimal.mul(exp, 3500).sqrt())+")"
						else f = "log(x+2)*"+format(Decimal.div("1e3500",3500).times(exp))
					}
					return f;
				},
			},
			13: {
				title: "Self-Synergy",
				description: "Points boost their own generation.",
				cost() { return tmp.h.costMult11.times(5).pow(tmp.h.costExp11) },
				effect() { 
					let eff = player.points.plus(1).log10().pow(0.75).plus(1);
					if (hasUpgrade("p", 33)) eff = eff.pow(upgradeEffect("p", 33));
					if (hasUpgrade("g", 15)) eff = eff.pow(upgradeEffect("g", 15));
					return eff;
				},
				unlocked() { return hasUpgrade("p", 12) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (hasUpgrade("p", 33)) exp = exp.times(upgradeEffect("p", 33));
					if (hasUpgrade("g", 15)) exp = exp.times(upgradeEffect("g", 15));
					return "(log(x+1)^0.75+1)"+(exp.gt(1)?("^"+format(exp)):"")
				},
			},
			21: {
				title: "More Prestige",
				description: "Prestige Point gain is increased by 80%.",
				cost() { return tmp.h.costMult11.times(20).pow(tmp.h.costExp11) },
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 11) },
			},
			22: {
				title: "Upgrade Power",
				description: "Point generation is faster based on your Prestige Upgrades bought.",
				cost() { return tmp.h.costMult11.times(75).pow(tmp.h.costExp11) },
				effect() {
					let eff = Decimal.pow(1.4, player.p.upgrades.length);
					if (hasUpgrade("p", 32)) eff = eff.pow(2);
					return eff;
				},
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 12) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { return hasUpgrade("p", 32)?"(1.4^x)^2":"1.4^x" },
			},
			23: {
				title: "Reverse Prestige Boost",
				description: "Prestige Point gain is boosted by your Points.",
				cost() { return tmp.h.costMult11.times(5e3).pow(tmp.h.costExp11) },
				effect() {
					let eff = player.points.plus(1).log10().cbrt().plus(1);
					if (hasUpgrade("p", 33)) eff = eff.pow(upgradeEffect("p", 33));
					if (hasUpgrade("g", 23)) eff = eff.pow(upgradeEffect("g", 23));
					return eff;
				},
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 13) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (hasUpgrade("p", 33)) exp = exp.times(upgradeEffect("p", 33));
					if (hasUpgrade("g", 23)) exp = exp.times(upgradeEffect("g", 23));
					return exp.gt(1)?("(log(x+1)^(1/3)+1)^"+format(exp)):"log(x+1)^(1/3)+1"
				},
			},
			31: {
				title: "WE NEED MORE PRESTIGE",
				description: "Prestige Point gain is raised to the power of 1.05.",
				cost() { return tmp.h.costMult11.times(1e45).pow(tmp.h.costExp11) },
				unlocked() { return hasAchievement("a", 23)&&hasUpgrade("p", 21) },
			},
			32: {
				title: "Still Useless",
				description: "<b>Upgrade Power</b> is squared.",
				cost() { return tmp.h.costMult11.times(1e56).pow(tmp.h.costExp11) },
				unlocked() { return hasAchievement("a", 23)&&hasUpgrade("p", 22) },
			},
			33: {
				title: "Column Leader",
				description: "Both above upgrades are stronger based on your Total Prestige Points.",
				cost() { return tmp.h.costMult11.times(1e60).pow(tmp.h.costExp11) },
				effect() { return player.p.total.plus(1).log10().plus(1).log10().div(5).plus(1) },
				unlocked() { return hasAchievement("a", 23)&&hasUpgrade("p", 23) },
				effectDisplay() { return "^"+format(this.effect()) },
				formula: "log(log(x+1)+1)/5+1",
			},
		},
})

addLayer("b", {
        name: "boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "B", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#6e64c4",
        requires() { return new Decimal(200).times((player.b.unlockOrder&&!player.b.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "boosters", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent: 1.25, // Prestige currency exponent
		base: 5,
		gainMult() { 
			let mult = new Decimal(1);
			if (hasUpgrade("b", 23)) mult = mult.div(upgradeEffect("b", 23));
			if (player.s.unlocked) mult = mult.div(buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return hasMilestone("b", 1) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "b", description: "Press B to perform a booster reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("t", 4) },
		addToBase() {
			let base = new Decimal(0);
			if (hasUpgrade("b", 12)) base = base.plus(upgradeEffect("b", 12));
			if (hasUpgrade("b", 13)) base = base.plus(upgradeEffect("b", 13));
			if (hasUpgrade("t", 11)) base = base.plus(upgradeEffect("t", 11));
			if (hasUpgrade("e", 11)) base = base.plus(upgradeEffect("e", 11).b);
			if (player.e.unlocked) base = base.plus(layers.e.buyables[11].effect().second);
			if (player.s.unlocked) base = base.plus(buyableEffect("s", 12));
			if (hasUpgrade("t", 25)) base = base.plus(upgradeEffect("t", 25));
			return base;
		},
		effectBase() {
			let base = new Decimal(2);
			
			// ADD
			base = base.plus(tmp.b.addToBase);
			
			// MULTIPLY
			if (player.sb.unlocked) base = base.times(tmp.sb.effect);
			if (hasUpgrade("q", 12)) base = base.times(upgradeEffect("q", 12));
			if (hasUpgrade("q", 34)) base = base.times(upgradeEffect("q", 34));
			if (inChallenge("h", 12)) base = base.div(tmp.h.baseDiv12);
			
			return base;
		},
		effect() {
			return Decimal.pow(this.effectBase(), player.b.points).max(0);
		},
		effectDescription() {
			return "which are boosting Point generation by "+format(this.effect())+"x"+(tmp.nerdMode?("\n ("+format(this.effectBase())+"x each)"):"")
		},
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("t", 2)) keep.push("upgrades")
			if (hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("b", keep)
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			auto: false,
		}},
		automate() {
			if (hasMilestone("t", 3) && player.b.auto) doReset("b");
		},
		increaseUnlockOrder: ["g"],
		milestones: {
			0: {
				requirementDescription: "8 Boosters",
				done() { return player.b.best.gte(8) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "15 Boosters",
				done() { return player.b.best.gte(15) },
				effectDescription: "You can buy max Boosters.",
			},
		},
		upgrades: {
			rows: 3,
			cols: 3,
			11: {
				title: "BP Combo",
				description: "Best Boosters boost Prestige Point gain.",
				cost() { return tmp.h.costMult11b.times(3) },
				effect() { 
					let ret = player.b.best.sqrt().plus(1);
					if (hasUpgrade("b", 32)) ret = Decimal.pow(1.125, player.b.best).times(ret);
					if (hasUpgrade("s", 15)) ret = ret.pow(buyableEffect("s", 14).root(2.7));
					return ret;
				},
				unlocked() { return player.b.unlocked },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { 
					let base = "sqrt(x)+1"
					if (hasUpgrade("b", 32)) base = "(sqrt(x)+1)*(1.125^x)"
					return hasUpgrade("s", 15)?("("+base+")^"+format(buyableEffect("s", 14).root(2.7))):base;
				},
			},
			12: {
				title: "Cross-Contamination",
				description: "Generators add to the Booster effect base.",
				cost() { return tmp.h.costMult11b.times(7) },
				effect() { return player.g.points.add(1).log10().sqrt().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1) },
				unlocked() { return player.b.unlocked&&player.g.unlocked },
				effectDisplay() { return "+"+format(this.effect()) },
				formula() { return "sqrt(log(x+1))"+(hasUpgrade("e", 14)?("*"+format(upgradeEffect("e", 14).div(3))):"/3") },
			},
			13: {
				title: "PB Reversal",
				description: "Total Prestige Points add to the Booster effect base.",
				cost() { return tmp.h.costMult11b.times(8) },
				effect() { return player.p.total.add(1).log10().add(1).log10().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1) },
				unlocked() { return player.b.unlocked&&player.b.best.gte(7) },
				effectDisplay() { return "+"+format(this.effect()) },
				formula() { return "log(log(x+1)+1)"+(hasUpgrade("e", 14)?("*"+format(upgradeEffect("e", 14).div(3))):"/3") },
			},
			21: {
				title: "Gen Z^2",
				description: "Square the Generator Power effect.",
				cost() { return tmp.h.costMult11b.times(9) },
				unlocked() { return hasUpgrade("b", 11) && hasUpgrade("b", 12) },
			},
			22: {
				title: "Up to the Fifth Floor",
				description: "Raise the Generator Power effect ^1.2.",
				cost() { return tmp.h.costMult11b.times(15) },
				unlocked() { return hasUpgrade("b", 12) && hasUpgrade("b", 13) },
			},
			23: {
				title: "Discount One",
				description: "Boosters are cheaper based on your Points.",
				cost() { return tmp.h.costMult11b.times(18) },
				effect() { 
					let ret = player.points.add(1).log10().add(1).pow(3.2);
					if (player.s.unlocked) ret = ret.pow(buyableEffect("s", 14));
					return ret;
				},
				unlocked() { return hasUpgrade("b", 21) || hasUpgrade("b", 22) },
				effectDisplay() { return "/"+format(this.effect()) },
				formula() { return "(log(x+1)+1)^"+(player.s.unlocked?format(buyableEffect("s", 14).times(3.2)):"3.2") },
			},
			31: {
				title: "Worse BP Combo",
				description: "Super Boosters boost Prestige Point gain.",
				cost() { return tmp.h.costMult11b.times(103) },
				unlocked() { return hasAchievement("a", 41) },
				effect() { return Decimal.pow(1e20, player.sb.points.pow(1.5)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1e20^(x^1.5)",
			},
			32: {
				title: "Better BP Combo",
				description: "<b>BP Combo</b> uses a better formula.",
				cost() { return tmp.h.costMult11b.times(111) },
				unlocked() { return hasAchievement("a", 41) },
			},
			33: {
				title: "Even More Additions",
				description: "<b>More Additions</b> is stronger based on your Super Boosters.",
				cost() { return tmp.h.costMult11b.times(118) },
				unlocked() { return hasAchievement("a", 41) },
				effect() { return player.sb.points.times(player.sb.points.gte(4)?2.6:2).plus(1) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { return "x*"+(player.sb.points.gte(4)?"2.6":"2")+"+1" },
			},
		},
})

addLayer("g", {
        name: "generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "G", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#a3d9a5",
        requires() { return new Decimal(200).times((player.g.unlockOrder&&!player.g.unlocked)?5000:1) }, // Can be a function that takes requirement increases into account
        resource: "generators", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["p"],
        exponent: 1.25, // Prestige currency exponent
		base: 5,
		gainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("g", 22)) mult = mult.div(upgradeEffect("g", 22));
			if (player.s.unlocked) mult = mult.div(buyableEffect("s", 13));
			return mult;
		},
		canBuyMax() { return hasMilestone("g", 2) },
        row: 1, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "g", description: "Press G to perform a generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.p.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("s", 4) },
		effBase() {
			let base = new Decimal(2);
			
			// ADD
			if (hasUpgrade("g", 12)) base = base.plus(upgradeEffect("g", 12));
			if (hasUpgrade("g", 13)) base = base.plus(upgradeEffect("g", 13));
			if (hasUpgrade("e", 11)) base = base.plus(upgradeEffect("e", 11).g);
			if (player.e.unlocked) base = base.plus(layers.e.buyables[11].effect().second);
			if (player.s.unlocked) base = base.plus(buyableEffect("s", 12));
			
			// MULTIPLY
			if (hasUpgrade("q", 12)) base = base.times(upgradeEffect("q", 12));
			if (inChallenge("h", 12)) base = base.div(tmp.h.baseDiv12)
			if (player.sg.unlocked) base = base.times(tmp.sg.enEff)
			
			return base;
		},
		effect() {
			let eff = Decimal.pow(this.effBase(), player.g.points).sub(1).max(0);
			if (hasUpgrade("g", 21)) eff = eff.times(upgradeEffect("g", 21));
			if (hasUpgrade("g", 25)) eff = eff.times(upgradeEffect("g", 25));
			if (hasUpgrade("t", 15)) eff = eff.times(tmp.t.enEff);
			if (hasUpgrade("s", 12)) eff = eff.times(upgradeEffect("s", 12));
			if (hasUpgrade("s", 13)) eff = eff.times(upgradeEffect("s", 13));
			if (player.q.unlocked) eff = eff.times(tmp.q.enEff);
			return eff;
		},
		effectDescription() {
			return "which are generating "+format(this.effect())+" Generator Power/sec"+(tmp.nerdMode?("\n ("+format(this.effBase())+"x each)"):"")
		},
		update(diff) {
			if (player.g.unlocked) player.g.power = player.g.power.plus(tmp.g.effect.times(diff));
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			power: new Decimal(0),
			first: 0,
			auto: false,
		}},
		automate() {
			if (hasMilestone("s", 3) && player.g.auto) doReset("g");
		},
		powerExp() {
			let exp = new Decimal(1/3);
			if (hasUpgrade("b", 21)) exp = exp.times(2);
			if (hasUpgrade("b", 22)) exp = exp.times(1.2);
			if (hasUpgrade("q", 13)) exp = exp.times(1.25);
			return exp;
		},
		powerEff() {
			return player.g.power.plus(1).pow(this.powerExp());
		},
		doReset(resettingLayer) {
			let keep = [];
			player.g.power = new Decimal(0);
			if (hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("s", 2)) keep.push("upgrades")
			if (hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("g", keep)
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.g.power) + ' Generator Power, which boosts Point generation by '+format(tmp.g.powerEff)+'x'},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Generators is ' + formatWhole(player.g.best) + '<br>You have made a total of '+formatWhole(player.g.total)+" Generators."},
					{}],
			"blank",
			"milestones", "blank", "blank", "upgrades"],
		increaseUnlockOrder: ["b"],
		milestones: {
			0: {
				requirementDescription: "8 Generators",
				done() { return player.g.best.gte(8) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "10 Generators",
				done() { return player.g.best.gte(10) },
				effectDescription: "You gain 100% of Prestige Point gain every second.",
			},
			2: {
				requirementDescription: "15 Generators",
				done() { return player.g.best.gte(15) },
				effectDescription: "You can buy max Generators.",
			},
		},
		upgrades: {
			rows: 2,
			cols: 5,
			11: {
				title: "GP Combo",
				description: "Best Generators boost Prestige Point gain.",
				cost: new Decimal(3),
				effect() { return player.g.best.sqrt().plus(1) },
				unlocked() { return player.g.unlocked },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "sqrt(x)+1",
			},
			12: {
				title: "I Need More!",
				description: "Boosters add to the Generator base.",
				cost: new Decimal(7),
				effect() { 
					let ret = player.b.points.add(1).log10().sqrt().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1);
					if (hasUpgrade("s", 24)) ret = ret.times(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return player.b.unlocked&&player.g.unlocked },
				effectDisplay() { return "+"+format(this.effect()) },
				formula() { 
					let m = new Decimal(hasUpgrade("e", 14)?upgradeEffect("e", 14):1).div(3)
					if (hasUpgrade("s", 24)) m = upgradeEffect("s", 24).times(m);
					return "sqrt(log(x+1))"+(m.eq(1)?"":(m.gt(1)?("*"+format(m)):("/"+format(m.pow(-1)))));
				},
			},
			13: {
				title: "I Need More II",
				description: "Best Prestige Points add to the Generator base.",
				cost: new Decimal(8),
				effect() { 
					let ret = player.p.best.add(1).log10().add(1).log10().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1);
					if (hasUpgrade("s", 24)) ret = ret.times(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return player.g.best.gte(8) },
				effectDisplay() { return "+"+format(this.effect()) },
				formula() { 
					let m = new Decimal(hasUpgrade("e", 14)?upgradeEffect("e", 14):1).div(3)
					if (hasUpgrade("s", 24)) m = upgradeEffect("s", 24).times(m);
					return "log(log(x+1)+1)"+(m.eq(1)?"":(m.gt(1)?("*"+format(m)):("/"+format(m.pow(-1)))));
				},
			},
			14: {
				title: "Boost the Boost",
				description: "<b>Prestige Boost</b> uses a better formula.",
				cost: new Decimal(13),
				unlocked() { return player.g.best.gte(10) },
			},
			15: {
				title: "Outer Synergy",
				description: "<b>Self-Synergy</b> is stronger based on your Generators.",
				cost: new Decimal(15),
				effect() { 
					let eff = player.g.points.sqrt().add(1);
					if (eff.gte(400)) eff = eff.cbrt().times(Math.pow(400, 2/3))
					return eff;
				},
				unlocked() { return hasUpgrade("g", 13) },
				effectDisplay() { return "^"+format(this.effect()) },
				formula() { return upgradeEffect("g", 15).gte(400)?"((x+1)^(1/6))*(400^(2/3))":"sqrt(x)+1" },
			},
			21: {
				title: "I Need More III",
				description: "Generator Power boost its own generation.",
				cost: new Decimal(1e10),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let ret = player.g.power.add(1).log10().add(1);
					if (hasUpgrade("s", 24)) ret = ret.pow(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return hasUpgrade("g", 15) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { 
					let f = "log(x+1)+1";
					if (hasUpgrade("s", 24)) f = "("+f+")^"+format(upgradeEffect("s", 24));
					return f;
				},
			},
			22: {
				title: "Discount Two",
				description: "Generators are cheaper based on your Prestige Points.",
				cost: new Decimal(1e11),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.p.points.add(1).pow(0.25) },
				unlocked() { return hasUpgrade("g", 15) },
				effectDisplay() { return "/"+format(this.effect()) },
				formula: "(x+1)^0.25",
			},
			23: {
				title: "Double Reversal",
				description: "<b>Reverse Prestige Boost</b> is stronger based on your Boosters.",
				cost: new Decimal(1e12),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { return player.b.points.pow(0.85).add(1) },
				unlocked() { return hasUpgrade("g", 15)&&player.b.unlocked },
				effectDisplay() { return "^"+format(this.effect()) },
				formula: "x^0.85+1",
			},
			24: {
				title: "Boost the Boost Again",
				description: "<b>Prestige Boost</b> uses an even better formula.",
				cost: new Decimal(20),
				unlocked() { return hasUpgrade("g", 14)&&(hasUpgrade("g", 21)||hasUpgrade("g", 22)) },
			},
			25: {
				title: "I Need More IV",
				description: "Prestige Points boost Generator Power gain.",
				cost: new Decimal(1e14),
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				effect() { 
					let ret = player.p.points.add(1).log10().pow(3).add(1);
					if (hasUpgrade("s", 24)) ret = ret.pow(upgradeEffect("s", 24));
					return ret;
				},
				unlocked() { return hasUpgrade("g", 23)&&hasUpgrade("g", 24) },
				effectDisplay() { return format(this.effect())+"x" },
				formula() { 
					let f = "log(x+1)^3+1";
					if (hasUpgrade("s", 24)) f = "("+f+")^"+format(upgradeEffect("s", 24));
					return f;
				},
			},
		},
})

addLayer("t", {
        name: "time", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "T", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			energy: new Decimal(0),
			first: 0,
			auto: false,
			autoExt: false,
        }},
        color: "#006609",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "time capsules", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.85), // Prestige currency exponent
		base: new Decimal(1e15),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return hasMilestone("q", 1) },
		enCapMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("t", 12)) mult = mult.times(upgradeEffect("t", 12));
			if (hasUpgrade("t", 21)) mult = mult.times(100);
			if (hasUpgrade("t", 22)) mult = mult.times(upgradeEffect("t", 22));
			if (player.h.unlocked) mult = mult.times(tmp.h.effect);
			return mult;
		},
		enGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("t", 22)) mult = mult.times(upgradeEffect("t", 22));
			if (player.h.unlocked) mult = mult.times(tmp.h.effect);
			return mult;
		},
		effect() { return {
			gain: Decimal.pow(3, player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).times(player.t.points.plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enGainMult),
			limit: Decimal.pow(2, player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).times(100).times(player.t.points.plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enCapMult),
		}},
		effectDescription() {
			return "which are generating "+format(this.effect().gain)+" Time Energy/sec, but with a limit of "+format(this.effect().limit)+" Time Energy"
		},
		enEff() {
			let eff = player.t.energy.add(1).pow(1.2);
			if (hasUpgrade("t", 14)) eff = eff.pow(1.3);
			if (hasUpgrade("q", 24)) eff = eff.pow(7.5);
			return eff;
		},
		enEff2() {
			if (!hasUpgrade("t", 24)) return new Decimal(0);
			let eff = player.t.energy.max(0).plus(1).log10().root(1.8);
			return eff.floor();
		},
		nextEnEff2() {
			if (!hasUpgrade("t", 24)) return new Decimal(1/0);
			let next = Decimal.pow(10, tmp.t.enEff2.plus(1).pow(1.8)).sub(1);
			return next;
		},
		update(diff) {
			if (player.t.unlocked) player.t.energy = player.t.energy.plus(this.effect().gain.times(diff)).min(this.effect().limit).max(0);
			if (player.t.autoExt && hasMilestone("q", 1) && !inChallenge("h", 31)) this.buyables[11].buyMax();
			if (player.t.auto && hasMilestone("q", 3)) doReset("t");
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "t", description: "Press T to Time Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("q", 5) },
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.t.energy) + ' Time Energy, which boosts Point & Prestige Point gain by '+format(tmp.t.enEff)+'x'+(hasUpgrade("t", 24)?(", and provides "+formatWhole(tmp.t.enEff2)+" free Extra Time Capsules (next at "+format(tmp.t.nextEnEff2)+")."):"")},
					{}],
			"blank",
			["display-text",
				function() {return 'Your best Time Capsules is ' + formatWhole(player.t.best)},
					{}],
			"blank",
			"milestones", "blank", "buyables", "blank", "upgrades"],
        increaseUnlockOrder: ["e", "s"],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("q", 2)) keep.push("upgrades")
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.b.unlocked},
        branches: ["b"],
		upgrades: {
			rows: 2,
			cols: 5,
			11: {
				title: "Pseudo-Boost",
				description: "Non-extra Time Capsules add to the Booster base.",
				cost: new Decimal(2),
				unlocked() { return player.t.unlocked },
				effect() { 
					return player.t.points.pow(0.9).add(0.5).plus(hasUpgrade("t", 13)?upgradeEffect("t", 13):0);
				},
				effectDisplay() { return "+"+format(this.effect()) },
				formula() { return "x^0.9"+(hasUpgrade("t", 13)?("+"+format(upgradeEffect("t", 13).plus(0.5))):"+0.5") },
			},
			12: {
				title: "Limit Stretcher",
				description: "Time Energy cap starts later based on Boosters, and +1 Extra Time Capsule.",
				cost() { return new Decimal([5e4,2e5,2.5e6][player[this.layer].unlockOrder||0]) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return player.t.best.gte(2) },
				effect() { 
					return player.b.points.pow(0.95).add(1)
				},
				effectDisplay() { return format(this.effect())+"x" },
				formula: "x^0.95+1",
			},
			13: {
				title: "Pseudo-Pseudo-Boost",
				description: "Extra Time Capsules add to the <b>Pseudo-Boost</b>'s effect.",
				cost() { return new Decimal([3e6,3e7,3e8][player[this.layer].unlockOrder||0]) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return hasUpgrade("t", 12) },
				effect() { 
					return player.t.buyables[11].add(tmp.t.freeExtraTimeCapsules).pow(0.95);
				},
				effectDisplay() { return "+"+format(this.effect()) },
				formula: "x^0.95",
			},
			14: {
				title: "More Time",
				description: "The Time Energy effect is raised to the power of 1.3.",
				cost() { return new Decimal(player.t.unlockOrder>=2?5:4) },
				unlocked() { return hasUpgrade("t", 13) },
			},
			15: {
				title: "Time Potency",
				description: "Time Energy affects Generator Power gain.",
				cost() { return new Decimal([1.25e7,(player.s.unlocked?3e8:6e7),1.5e9][player[this.layer].unlockOrder||0]) },
				currencyDisplayName: "time energy",
                currencyInternalName: "energy",
                currencyLayer: "t",
				unlocked() { return hasUpgrade("t", 13) },
			},
			21: {
				title: "Weakened Chains",
				description: "The Time Energy limit is multiplied by 100.",
				cost: new Decimal(12),
				unlocked() { return hasAchievement("a", 33) },
			},
			22: {
				title: "Enhanced Time",
				description: "Enhance Points boost Time Energy's generation and limit.",
				cost: new Decimal(9),
				unlocked() { return hasAchievement("a", 33) },
				effect() { 
					return player.e.points.plus(1).root(10);
				},
				effectDisplay() { return format(this.effect())+"x" },
				formula: "(x+1)^0.1",
			},
			23: {
				title: "Reverting Time",
				description: "Time acts as if you chose it first.",
				cost() { return new Decimal(player[this.layer].unlockOrder>=2?3e9:(player.s.unlocked?6.5e8:1.35e8)) },
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return (player[this.layer].unlockOrder>0||hasUpgrade("t", 23))&&hasUpgrade("t", 13) },
				onPurchase() { player[this.layer].unlockOrder = 0; },
			},
			24: {
				title: "Time Dilation",
				description: "Unlock a new Time Energy effect.",
				cost: new Decimal(2e17),
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return hasAchievement("a", 33) },
			},
			25: {
				title: "Basic",
				description: "Time Energy adds to the Booster base.",
				cost: new Decimal(3e19),
				currencyDisplayName: "time energy",
				currencyInternalName: "energy",
				currencyLayer: "t",
				unlocked() { return hasAchievement("a", 33) },
				effect() { return player.t.energy.plus(1).log10().div(1.2) },
				effectDisplay() { return "+"+format(this.effect()) },
				formula: "log(x+1)/1.2",
			},
		},
		freeExtraTimeCapsules() {
			let free = new Decimal(0);
			if (hasUpgrade("t", 12)) free = free.plus(1);
			if (hasUpgrade("t", 24)) free = free.plus(tmp.t.enEff2);
			if (hasUpgrade("q", 22)) free = free.plus(upgradeEffect("q", 22));
			return free;
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Extra Time Capsules",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25)) x = x.pow(2).div(25)
                    let cost = x.times(0.4).pow(1.2).add(1).times(10)
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let e = tmp.t.freeExtraTimeCapsules;
                    let display = ("Cost: " + formatWhole(data.cost) + " Boosters\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(e.gt(0)?(" + "+formatWhole(e)):""))+(inChallenge("h", 31)?("\nPurchases Left: "+String(10-player.h.chall31bought)):"")
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.b.points.gte(tmp[this.layer].buyables[this.id].cost) && (inChallenge("h", 31) ? player.h.chall31bought<10 : true)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.b.points = player.b.points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
					if (inChallenge("h", 31)) player.h.chall31bought++;
                },
                buyMax() {
					if (!this.canAfford()) return;
					if (inChallenge("h", 31)) return;
					let tempBuy = player.b.points.plus(1).div(10).sub(1).max(0).root(1.2).div(0.4);
					if (tempBuy.gte(25)) tempBuy = tempBuy.times(25).sqrt();
					let target = tempBuy.plus(1).floor();
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				},
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Time Capsules",
				done() { return player.t.best.gte(2) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Time Capsules",
				done() { return player.t.best.gte(3) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Time Capsules",
				done() { return player.t.best.gte(4) },
				effectDescription: "Keep Booster Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Time Capsules",
				done() { return player.t.best.gte(5) },
				effectDescription: "Unlock Auto-Boosters.",
				toggles: [["b", "auto"]],
			},
			4: {
				requirementDescription: "8 Time Capsules",
				done() { return player.t.best.gte(8) },
				effectDescription: "Boosters reset nothing.",
			},
		},
})

addLayer("e", {
        name: "enhance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "E", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
			auto: false,
        }},
        color: "#b82fbd",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "enhance points", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(.02), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasUpgrade("e", 24)) mult = mult.times(upgradeEffect("e", 24));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		update(diff) {
			if (hasMilestone("q", 1)) generatePoints("e", diff);
			if (player.e.auto && hasMilestone("q", 1) && !inChallenge("h", 31)) this.buyables[11].buyMax();
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "e", description: "Press E to Enhance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        increaseUnlockOrder: ["t", "s"],
        doReset(resettingLayer){ 
			let keep = []
			if (hasMilestone("q", 2)) keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		freeEnh() {
			let enh = new Decimal(0);
			if (hasUpgrade("e", 13)) enh = enh.plus(1);
			if (hasUpgrade("e", 21)) enh = enh.plus(2);
			if (hasUpgrade("e", 23)) enh = enh.plus(upgradeEffect("e", 23));
			if (hasUpgrade("q", 22)) enh = enh.plus(upgradeEffect("q", 22));
			return enh;
		},
        layerShown(){return player.b.unlocked&&player.g.unlocked},
        branches: ["b","g"],
		upgrades: {
			rows: 2,
			cols: 4,
			11: {
				title: "Row 2 Synergy",
				description: "Boosters & Generators boost each other.",
				cost() { return new Decimal((player.e.unlockOrder>=2)?25:100) },
				unlocked() { return player.e.unlocked },
				effect() { 
					let exp = 1
					return {g: player.b.points.add(1).log10().pow(exp), b: player.g.points.add(1).log10().pow(exp)} 
				},
				effectDisplay() { return "+"+format(this.effect().g)+" to Generator base, +"+format(this.effect().b)+" to Booster base" },
				formula: "log(x+1)",
			},
			12: {
				title: "Enhanced Prestige",
				description: "Total Enhance Points boost Prestige Point gain.",
				cost() { return new Decimal(player.e.unlockOrder>=2?400:1e3) },
				unlocked() { return hasUpgrade("e", 11) },
				effect() { 
					let ret = player.e.total.add(1).pow(1.5) 
					if (ret.gte("1e1500")) ret = ret.sqrt().times("1e750")
					return ret
				},
				effectDisplay() { return format(this.effect())+"x" },
				formula() { return upgradeEffect("e", 12).gte("1e1500")?"(x+1)^0.75*1e750":"(x+1)^1.5" },
			},
			13: {
				title: "Enhance Plus",
				description: "Get a free Enhancer.",
				cost: new Decimal(2.5e3),
				unlocked() { return hasUpgrade("e", 11) },
			},
			14: {
				title: "More Additions",
				description: "Any Booster/Generator Upgrades that add to the Booster/Generator base are quadrupled.",
				cost: new Decimal(3e23),
				unlocked() { return hasAchievement("a", 33) },
				effect() {
					let e = new Decimal(4)
					if (hasUpgrade("b", 33)) e = e.times(upgradeEffect("b", 33))
					return e;
				},
				effectDisplay() { return format(this.effect())+"x" },
				noFormula: true,
			},
			21: {
				title: "Enhance Plus Plus",
				description: "Get another two free Enhancers",
				cost() { return new Decimal(player.e.unlockOrder>0?1e4:1e9) },
				unlocked() { return hasUpgrade("e", 13) && ((!player.s.unlocked||(player.s.unlocked&&player.t.unlocked))&&player.t.unlocked) },
			},
			22: {
				title: "Enhanced Reversion",
				description: "Enhance acts as if you chose it first.",
				cost() { return new Decimal(player.e.unlockOrder>=2?1e3:3e4) },
				unlocked() { return (player[this.layer].unlockOrder>0||hasUpgrade("e", 22))&&hasUpgrade("e", 12) },
				onPurchase() { player[this.layer].unlockOrder = 0; },
			},
			23: {
				title: "Enter the E-Space",
				description: "Space Energy provides free Enhancers.",
				cost: new Decimal(2e20),
				unlocked() { return hasAchievement("a", 33) },
				effect() {
					return player.s.points.pow(2).div(25).floor();
				},
				effectDisplay() { return "+"+formatWhole(this.effect()) },
				formula: "floor(x^2/25)",
			},
			24: {
				title: "Monstrous Growth",
				description: "Boosters & Generators boost Enhance Point gain.",
				cost: new Decimal(2.5e28),
				unlocked() { return hasAchievement("a", 33) },
				effect() { return Decimal.pow(1.1, player.b.points.plus(player.g.points).pow(0.9)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1.1^((boosters+generators)^0.9)",
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Enhancers",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(25)) x = x.pow(2).div(25)
                    let cost = Decimal.pow(2, x.pow(1.5))
                    return cost.floor()
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					x = x.plus(tmp.e.freeEnh);
					
                    let eff = {}
                    if (x.gte(0)) eff.first = Decimal.pow(25, x.pow(1.1))
                    else eff.first = Decimal.pow(1/25, x.times(-1).pow(1.1))
					if (hasUpgrade("q", 24)) eff.first = eff.first.pow(7.5);
                
                    if (x.gte(0)) eff.second = x.pow(0.8)
                    else eff.second = x.times(-1).pow(0.8).times(-1)
                    return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Enhance Points\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.e.freeEnh.gt(0)?(" + "+formatWhole(tmp.e.freeEnh)):"") + "\n\
                   "+(tmp.nerdMode?(" Formula 1: 25^(x^1.1)\n\ Formula 2: x^0.8"):(" Boosts Prestige Point gain by " + format(data.effect.first) + "x and adds to the Booster/Generator base by " + format(data.effect.second)))+(inChallenge("h", 31)?("\nPurchases Left: "+String(10-player.h.chall31bought)):"")
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player[this.layer].points.gte(tmp[this.layer].buyables[this.id].cost) && (inChallenge("h", 31) ? player.h.chall31bought<10 : true)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player[this.layer].points = player[this.layer].points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
					if (inChallenge("h", 31)) player.h.chall31bought++;
                },
                buyMax() {
					if (!this.canAfford()) return;
					if (inChallenge("h", 31)) return;
					let tempBuy = player[this.layer].points.max(1).log2().root(1.5)
					if (tempBuy.gte(25)) tempBuy = tempBuy.times(25).sqrt();
					let target = tempBuy.plus(1).floor();
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				},
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Enhance Points",
				done() { return player.e.best.gte(2) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "5 Enhance Points",
				done() { return player.e.best.gte(5) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "25 Enhance Points",
				done() { return player.e.best.gte(25) },
				effectDescription: "Keep Booster/Generator Upgrades on reset.",
			},
		},
})

addLayer("s", {
        name: "space", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "S", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			spent: new Decimal(0),
			first: 0,
			auto: false,
        }},
        color: "#dfdfdf",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "space energy", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.85), // Prestige currency exponent
        base: new Decimal(1e15),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "s", description: "Press S to Space Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("q", 5) },
        increaseUnlockOrder: ["t", "e"],
        doReset(resettingLayer){ 
            let keep = []
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("q", 2)) keep.push("upgrades")
			if (hasMilestone("q", 2) && (resettingLayer=="q"||resettingLayer=="h")) {
				keep.push("buyables");
				keep.push("spent");
			}
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		space() {
			let space = player.s.best.pow(1.1).times(3);
			if (hasUpgrade("s", 13)) space = space.plus(2);
			if (hasAchievement("a", 53)) space = space.plus(2);
			
			if (inChallenge("h", 21)) space = space.div(10);
			return space.floor().sub(player.s.spent).max(0);
		},
		buildingBaseCosts: {
			11: new Decimal(1e3),
			12: new Decimal(1e10),
			13: new Decimal(1e25),
			14: new Decimal(1e48),
			15: new Decimal(1e250),
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'Your best Space Energy is ' + formatWhole(player.s.best)},
					{}],
			"blank",
			"milestones", "blank", 
			["display-text",
				function() {return 'You have ' + format(player.g.power) + ' Generator Power'},
					{}],
			["display-text",
				function() {return 'Your Space Energy has provided you with ' + formatWhole(tmp.s.space) + ' Space'},
					{}],
			["display-text",
				function() {return tmp.s.buildingPower.eq(1)?"":("Space Building Power: "+format(tmp.s.buildingPower.times(100))+"%")},
					{}],
			"blank",
			"buyables", "blank", "upgrades"],
        layerShown(){return player.g.unlocked},
        branches: ["g"],
		canBuyMax() { return hasMilestone("q", 1) },
		freeSpaceBuildings() {
			let x = new Decimal(0);
			if (hasUpgrade("s", 11)) x = x.plus(1);
			if (hasUpgrade("s", 22)) x = x.plus(upgradeEffect("s", 22));
			if (hasUpgrade("q", 22)) x = x.plus(upgradeEffect("q", 22));
			return x;
		},
		freeSpaceBuildings1to4() {
			let x = new Decimal(0);
			if (player.s.unlocked) x = x.plus(buyableEffect("s", 15));
			return x;
		},
		totalBuildingLevels() {
			let len = Object.keys(player.s.buyables).length
			if (len==0) return new Decimal(0);
			if (len==1) return Object.values(player.s.buyables)[0].plus(tmp.s.freeSpaceBuildings).plus(toNumber(Object.keys(player.s.buyables))<15?tmp.s.freeSpaceBuildings1to4:0)
			let l = Object.values(player.s.buyables).reduce((a,c,i) => Decimal.add(a, c).plus(toNumber(Object.keys(player.s.buyables)[i])<15?tmp.s.freeSpaceBuildings1to4:0)).plus(tmp.s.freeSpaceBuildings.times(len));
			return l;
		},
		manualBuildingLevels() {
			let len = Object.keys(player.s.buyables).length
			if (len==0) return new Decimal(0);
			if (len==1) return Object.values(player.s.buyables)[0]
			let l = Object.values(player.s.buyables).reduce((a,c) => Decimal.add(a, c));
			return l;
		},
		buildingPower() {
			let pow = new Decimal(1);
			if (hasUpgrade("s", 21)) pow = pow.plus(0.08);
			if (hasChallenge("h", 21)) pow = pow.plus(challengeEffect("h", 21).div(100));
			if (inChallenge("h", 21)) pow = pow.sub(0.9);
			return pow;
		},
		update(diff) {
			if (player.s.auto && hasMilestone("q", 3)) doReset("s");
		},
		upgrades: {
			rows: 2,
			cols: 5,
			11: {
				title: "Space X",
				description: "Add a free level to all Space Buildings.",
				cost: new Decimal(2),
				unlocked() { return player[this.layer].unlocked }
			},
			12: {
				title: "Generator Generator",
				description: "Generator Power boosts its own generation.",
				cost: new Decimal(3),
				unlocked() { return hasUpgrade("s", 11) },
				effect() { return player.g.power.add(1).log10().add(1) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "log(x+1)+1",
			},
			13: {
				title: "Shipped Away",
				description: "Space Building Levels boost Generator Power gain, and you get 2 extra Space.",
				cost() { return new Decimal([1e37,1e59,1e94][player[this.layer].unlockOrder||0]) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return hasUpgrade("s", 11) },
				effect() { return Decimal.pow(20, tmp.s.totalBuildingLevels) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "20^x",
			},
			14: {
				title: "Into The Repeated",
				description: "Unlock the <b>Quaternary Space Building</b>.",
				cost: new Decimal(4),
				unlocked() { return hasUpgrade("s", 12)||hasUpgrade("s", 13) }
			},
			15: {
				title: "Four Square",
				description: "The <b>Quaternary Space Building</b> cost is cube rooted, is 3x as strong, and also affects <b>BP Combo</b> (brought to the 2.7th root).",
				cost() { return new Decimal([1e65,(player.e.unlocked?1e94:1e88),1e129][player[this.layer].unlockOrder||0]) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return hasUpgrade("s", 14) },
			},
			21: {
				title: "Spacious",
				description: "All Space Buildings are 8% stronger.",
				cost: new Decimal(13),
				unlocked() { return hasAchievement("a", 33) },
			},
			22: {
				title: "Spacetime Anomaly",
				description: "Non-extra Time Capsules provide free Space Buildings.",
				cost: new Decimal(2.5e207),
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				unlocked() { return hasAchievement("a", 33) },
				effect() { return player.t.points.cbrt().floor() },
				effectDisplay() { return "+"+formatWhole(this.effect()) },
				formula: "floor(cbrt(x))",
			},
			23: {
				title: "Revert Space",
				description() { return (player.e.unlocked&&player.t.unlocked&&(player.s.unlockOrder||0)==0)?"All Space Building costs are divided by 1e20.":("Space acts as if you chose it first"+(player.t.unlocked?", and all Space Building costs are divided by 1e20.":".")) },
				cost() { return new Decimal(player.s.unlockOrder>=2?1e141:(player.e.unlocked?1e105:1e95)) },
				currencyDisplayName: "generator power",
                currencyInternalName: "power",
                currencyLayer: "g",
				unlocked() { return ((player.e.unlocked&&player.t.unlocked&&(player.s.unlockOrder||0)==0)||player[this.layer].unlockOrder>0||hasUpgrade("s", 23))&&hasUpgrade("s", 13) },
				onPurchase() { player[this.layer].unlockOrder = 0; },
			},
			24: {
				title: "Want More?",
				description: "All four of the <b>I Need More</b> upgrades are stronger based on your Total Space Buildings.",
				cost: new Decimal(1e177),
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				unlocked() { return hasAchievement("a", 33) },
				effect() {
					return tmp.s.totalBuildingLevels.sqrt().div(5).plus(1);
				},
				effectDisplay() { return format(this.effect().sub(1).times(100))+"% stronger" },
				formula: "sqrt(x)/5+1",
			},
			25: {
				title: "Another One?",
				description: "Unlock the Quinary Space Building.",
				cost: new Decimal(1e244),
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				unlocked() { return hasAchievement("a", 33) },
			},
		},
		divBuildCosts() {
			let div = new Decimal(1);
			if (hasUpgrade("s", 23) && player.t.unlocked) div = div.times(1e20);
			return div;
		},
		buyables: {
			rows: 1,
			cols: 5,
			showRespec() { return player.s.unlocked },
            respec() { // Optional, reset things and give back your currency. Having this function makes a respec button appear
				player[this.layer].spent = new Decimal(0);
                resetBuyables(this.layer)
                doReset(this.layer, true) // Force a reset
            },
            respecText: "Respec Space Buildings", // Text on Respec button, optional
			11: {
				title: "Primary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					if (x.eq(0)) return new Decimal(0);
					return Decimal.pow(base, x.pow(1.35)).times(base).div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(x.plus(1).plus(tmp.s.freeSpaceBuildings).times(tmp.s.buildingPower), player.s.points.sqrt()).times(x.plus(tmp.s.freeSpaceBuildings).plus(tmp.s.freeSpaceBuildings1to4).times(tmp.s.buildingPower).max(1).times(4));
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4).gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4))):"") + "\n\
                   "+(tmp.nerdMode?("Formula: level^sqrt(spaceEnergy)*level*4"):(" Space Energy boosts Point gain & Prestige Point gain by " + format(data.effect) +"x"))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
			},
			12: {
				title: "Secondary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.pow(1.35)).times(base).div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = x.plus(tmp.s.freeSpaceBuildings).plus(tmp.s.freeSpaceBuildings1to4).times(tmp.s.buildingPower).sqrt();
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4).gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4))):"") + "\n\
                    "+(tmp.nerdMode?("Formula: sqrt(level)"):("Adds to base of Booster/Generator effects by +" + format(data.effect)))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
			},
			13: {
				title: "Tertiary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.pow(1.35)).times(base).div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(1e18, x.plus(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4)).times(tmp.s.buildingPower).pow(0.9))
					if (eff.gte("e3e9")) eff = Decimal.pow(10, eff.log10().times(9e18).cbrt())
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4).times(tmp.s.buildingPower).gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4))):"") + "\n\
                    "+(tmp.nerdMode?("Formula: "+(data.effect.gte("e3e9")?"10^((level^0.3)*5.45e6)":"1e18^(level^0.9)")):("Divide Booster/Generator cost by " + format(data.effect)))
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
			},
			14: {
				title: "Quaternary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.pow(1.35)).times(base);
					if (hasUpgrade("s", 15)) cost = cost.root(3);
					return cost.div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4)).times(tmp.s.buildingPower).times((hasUpgrade("s", 15))?3:1).add(1).pow(1.25)
					if (ret.gte(1e6)) ret = ret.log10().times(1e6/6)
					return ret;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let extForm = hasUpgrade("s", 15)?3:1
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4).gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4))):"") + "\n\
					"+(tmp.nerdMode?("Formula: "+(data.effect.gte(1e6)?("log(level"+(extForm==1?"":"*3")+"+1)*2.08e5"):("(level"+(extForm==1?"":"*3")+"+1)^1.25"))):("<b>Discount One</b> is raised to the power of " + format(data.effect)))
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("s", 14) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
			},
			15: {
				title: "Quinary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.pow(1.35)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.freeSpaceBuildings).times(tmp.s.buildingPower).div(2);
					if (hasUpgrade("q", 32)) ret = ret.times(2);
					return ret.floor();
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return "Cost: " + formatWhole(data.cost) + " Generator Power\n\
                    Level: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.s.freeSpaceBuildings.gt(0)?(" + "+formatWhole(tmp.s.freeSpaceBuildings)):"") + "\n\
					"+(tmp.nerdMode?("Formula: level"+(hasUpgrade("q", 32)?"":"/2")):("Add " + formatWhole(data.effect)+" levels to all previous Space Buildings."))
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("s", 25) }, 
                canAfford() {
                    return player.g.power.gte(tmp[this.layer].buyables[this.id].cost) && layers.s.space().gt(0)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.g.power = player.g.power.sub(cost)
					player.s.spent = player.s.spent.plus(1);
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Space Energy",
				done() { return player.s.best.gte(2) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Space Energy",
				done() { return player.s.best.gte(3) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Space Energy",
				done() { return player.s.best.gte(4) },
				effectDescription: "Keep Generator Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Space Energy",
				done() { return player.s.best.gte(5) },
				effectDescription: "Unlock Auto-Generators.",
				toggles: [["g", "auto"]],
			},
			4: {
				requirementDescription: "8 Space Energy",
				done() { return player.s.best.gte(8) },
				effectDescription: "Generators reset nothing.",
			},
		},
})

addLayer("sb", {
        name: "super boosters", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SB", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#504899",
        requires: new Decimal(100), // Can be a function that takes requirement increases into account
        resource: "super boosters", // Name of prestige currency
        baseResource: "boosters", // Name of resource prestige is based on
        baseAmount() {return player.b.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["b"],
        exponent: 1.25, // Prestige currency exponent
		base: 1.05,
		gainMult() { 
			let mult = new Decimal(1);
			return mult;
		},
		update(diff) {
			if (player.sb.auto && hasMilestone("q", 4)) doReset("sb");
		},
		canBuyMax() { return false },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "B", description: "Press Shift+B to perform a super booster reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return player.t.unlocked&&player.e.unlocked&&player.s.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("q", 5) },
		effectBase() {
			let base = new Decimal(5);
			if (hasChallenge("h", 12)) base = base.plus(.25);
			return base;
		},
		effect() {
			return Decimal.pow(this.effectBase(), player.sb.points).max(0);
		},
		effectDescription() {
			return "which are multiplying the Booster base by "+format(this.effect())+"x"+(tmp.nerdMode?("\n ("+format(this.effectBase())+"x each)"):"")
		},
		doReset(resettingLayer){ 
			let keep = []
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			first: 0,
			auto: false,
		}},
})

addLayer("sg", {
        name: "super generators", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SG", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 4, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        color: "#248239",
        requires: new Decimal(200), // Can be a function that takes requirement increases into account
        resource: "super generators", // Name of prestige currency
        baseResource: "generators", // Name of resource prestige is based on
        baseAmount() {return player.g.points}, // Get the current amount of baseResource
		roundUpCost: true,
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		branches: ["g"],
        exponent: 1.25, // Prestige currency exponent
		base: 1.05,
		gainMult() { 
			let mult = new Decimal(1);
			return mult;
		},
		update(diff) {
			player.sg.power = player.sg.power.plus(tmp.sg.effect.times(diff));
			if (hasMilestone("q", 6) && player.sg.auto) doReset("sg");
		},
		canBuyMax() { return false },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "G", description: "Press Shift+G to perform a super generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return hasUpgrade("q", 33)&&player.q.unlocked},
		automate() {},
		resetsNothing() { return hasMilestone("q", 6) },
		effectBase() {
			let base = new Decimal(5);
			return base;
		},
		effect() {
			let eff = Decimal.pow(this.effectBase(), player.sg.points).sub(1).max(0);
			if (tmp.h.challenges[31].unlocked) eff = eff.times(challengeEffect("h", 31));
			return eff;
		},
		effectDescription() {
			return "which are generating "+format(this.effect())+" Super Generator Power/sec"+(tmp.nerdMode?("\n ("+format(this.effectBase())+"x each)"):"")
		},
		enEff() {
			let eff = player.sg.power.plus(1).sqrt();
			return eff;
		},
		doReset(resettingLayer){ 
			let keep = []
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.sg.power) + ' Super Generator Power, which multiplies the Generator base by '+format(tmp.sg.enEff)+'x'},
					{}]],
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			power: new Decimal(0),
			first: 0,
			auto: false,
		}},
})

addLayer("h", {
        name: "hindrance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "H", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			chall31bought: 0,
			first: 0,
        }},
        color: "#a14040",
        requires: new Decimal(1e30), // Can be a function that takes requirement increases into account
        resource: "hindrance spirit", // Name of prestige currency
        baseResource: "time energy", // Name of resource prestige is based on
        baseAmount() {return player.t.energy}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(.125), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasUpgrade("q", 14)) mult = mult.times(upgradeEffect("q", 14).h);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "h", description: "Press H to Hindrance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			player.h.chall31bought = 0;
           if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.t.unlocked&&hasMilestone("q", 4)},
        branches: ["t"],
		effect() { 
			let h = player.h.points.times(player.points.plus(1).log("1e1000").plus(1));
			if (h.gte(15e4)) h = Decimal.pow(10, h.log(15e4).sqrt()).times(15e3);
			return h.plus(1).pow(3).pow(hasChallenge("h", 11)?1.2:1) 
		},
		effectDescription() {
			return "which are multiplying Point gain, Time Energy gain, & the Time Energy cap by "+format(this.effect())+" (boosted by Points)"
		},
		costMult11() {
			let mult = new Decimal(1);
			if (inChallenge("h", 11)) mult = mult.times(Decimal.pow(10, Decimal.pow(player.p.upgrades.length, 2)))
			return mult;
		},
		costExp11() {
			let exp = new Decimal(1);
			if (inChallenge("h", 11)) exp = exp.times(Math.pow(player.p.upgrades.length, 2)*4+1)
			return exp;
		},
		costMult11b() {
			let mult = new Decimal(1);
			if (inChallenge("h", 11)) mult = mult.times(player.b.upgrades.length*3+1)
			return mult;
		},
		baseDiv12() {
			let div = new Decimal(1);
			if (inChallenge("h", 12)) div = div.times(player.q.time.sqrt().times(player.sb.points.pow(3).times(3).plus(1)).plus(1))
			return div;
		},
		pointRoot31() {
			let root = Decimal.add(2, Decimal.pow(challengeCompletions("h", 31), 1.5).div(16))
			return root;
		},
		challenges: {
			rows: 3,
			cols: 2,
			11: {
				name: "Upgrade Desert",
				completionLimit: 1,
				challengeDescription: "Prestige/Booster Upgrades are reset regardless of your milestones, and every Prestige/Booster Upgrade you buy drastically increases the costs of the others.",
				unlocked() { return player.h.unlocked },
				goal: new Decimal("1e1325"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "Unlock Quirk Upgrades, and the Hindrance Spirit effect is raised to the power of 1.2.",
				onStart(testInput=false) { 
					if (testInput) {
						player.p.upgrades = []; 
						player.b.upgrades = [];
					}
				},
			},
			12: {
				name: "Speed Demon",
				completionLimit: 1,
				challengeDescription: "The Booster/Generator bases are divided more over time (this effect is magnified by your Super-Boosters).",
				unlocked() { return hasChallenge("h", 11) },
				goal: new Decimal("1e3550"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "Add 0.25 to the Super Booster base.",
			},
			21: {
				name: "Out of Room",
				completionLimit: 1,
				challengeDescription: "Space Buildings are respecced, your Space is divided by 10, and Space Building Power is decreased by 90%.",
				unlocked() { return hasChallenge("h", 12) },
				goal: new Decimal("1e435"),
				currencyDisplayName: "generator power",
				currencyInternalName: "power",
				currencyLayer: "g",
				rewardDescription: "Space Energy boosts the strength of Space Buildings.",
				rewardEffect() { return player.s.points.div(2) },
				rewardDisplay() { return format(this.rewardEffect())+"% stronger (additive)" },
				formula: "(x/2)%",
				onStart(testInput=false) {
					if (testInput) {
						resetBuyables("s");
						player.s.spent = new Decimal(0);
					}
				},
			},
			22: {
				name: "Descension",
				completionLimit: 1,
				challengeDescription: "Prestige Upgrades, Achievement rewards, & the Primary Space Building are the only things that boost Point generation.",
				unlocked() { return hasChallenge("h", 21) },
				goal: new Decimal("1e3570"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "<b>Prestige Boost</b>'s hardcap is now a softcap.",
			},
			31: {
				name: "Timeless",
				completionLimit: 1/0,
				challengeDescription() {return "You can only buy 10 Enhancers & Extra Time Capsules (total), Enhancer/Extra Time Capsule automation is disabled, and Point generation is brought to the "+format(tmp.h.pointRoot31)+"th root<br>Completions: "+challengeCompletions("h", 31)},
				unlocked() { return hasChallenge("h", 22) },
				goal() { return Decimal.pow("1e50", Decimal.pow(challengeCompletions("h", 31), 2.5)).times("1e5325") },
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "<b>Timeless</b> completions boost Super Generator Power gain based on your time in this Row 4 reset.",
				rewardEffect() { return Decimal.div(9, Decimal.add(player.q.time, 1).cbrt()).plus(1).pow(challengeCompletions("h", 31)) },
				rewardDisplay() { return format(this.rewardEffect())+"x" },
				formula: "(9/cbrt(time+1)+1)^completions",
			},
		},
})

addLayer("q", {
        name: "quirks", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "Q", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			energy: new Decimal(0),
			time: new Decimal(0),
			first: 0,
        }},
        color: "#c20282",
        requires: new Decimal("1e512"), // Can be a function that takes requirement increases into account
        resource: "quirks", // Name of prestige currency
        baseResource: "generator power", // Name of resource prestige is based on
        baseAmount() {return player.g.power}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(.0075), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
			if (hasUpgrade("q", 14)) mult = mult.times(upgradeEffect("q", 14).q);
			mult = mult.times(improvementEffect("q", 33));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "q", description: "Press Q to Quirk Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.e.unlocked},
        branches: ["e"],
		enGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("q", 11)) mult = mult.times(upgradeEffect("q", 11));
			if (hasUpgrade("q", 21)) mult = mult.times(upgradeEffect("q", 21));
			return mult;
		},
		enGainExp() {
			let exp = player.q.buyables[11].sub(1);
			return exp;
		},
		enEff() {
			let eff = player.q.energy.plus(1).pow(2);
			if (hasUpgrade("q", 23)) eff = eff.pow(3);
			return eff.times(improvementEffect("q", 23));
		},
		update(diff) {
			player.q.time = player.q.time.plus(diff);
			if (tmp.q.enGainExp.gte(0)) player.q.energy = player.q.energy.plus(player.q.time.times(tmp.q.enGainMult).pow(tmp.q.enGainExp).times(diff));
		},
		tabFormat: {
			"Main Tab": {
				content: [
					"main-display",
					"prestige-button",
					"blank",
					["display-text",
						function() {return 'You have ' + formatWhole(player.g.power)+' Generator Power'},
							{}],
					["display-text",
						function() {return 'You have ' + formatWhole(player.q.best)+' Best Quirks'},
							{}],
					["display-text",
						function() {return 'You have ' + formatWhole(player.q.total)+' Total Quirks'},
							{}],
					"blank",
					["display-text",
						function() {return 'You have ' + formatWhole(player.q.energy)+' Quirk Energy ('+(tmp.nerdMode?('Base Gain: (timeInRun^(quirkLayers-1))'):'generated by Quirk Layers')+'), which multiplies Point and Generator Power gain by ' + format(tmp.q.enEff)},
							{}],
					"blank",
					"milestones", "blank",
					"blank",
					"buyables", "blank", "upgrades"],
			},
			Improvements: {
				unlocked() { return hasUpgrade("q", 41) },
				buttonStyle() { return {'background-color': '#f25ed7'} },
				content: [
					"main-display",
					"blank",
					["display-text",
						function() {return 'You have ' + formatWhole(player.q.energy)+' Quirk Energy ('+(tmp.nerdMode?('Base Gain: (timeInRun^(quirkLayers-1))'):'generated by Quirk Layers')+'), which has provided the below Quirk Improvements'},
							{}],
					"blank",
					"improvements"],
			},
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Quirk Layers",
				costBase() {
					let base = new Decimal(2);
					if (hasUpgrade("q", 43)) base = base.sub(.25);
					return base;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    if (x.gte(20)) Decimal.pow(1.05, x.sub(20)).times(20)
					let base = this.costBase();
                    let cost = Decimal.pow(base, Decimal.pow(base, x).sub(1));
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Cost: " + formatWhole(data.cost) + " Quirks\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id]))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.q.points.gte(tmp[this.layer].buyables[this.id].cost)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
                    player.q.points = player.q.points.sub(cost)	
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Quirks",
				done() { return player.q.total.gte(2) },
				effectDescription: "Keep Booster, Generator, Space, & Time milestones on all resets.",
			},
			1: {
				requirementDescription: "3 Total Quirks",
				done() { return player.q.total.gte(3) },
				effectDescription: "You can buy max Time & Space, gain 100% of Enhance Point gain every second, and unlock Auto-Enhancers & Auto-Extra Time Capsules.",
				toggles: [["e", "auto"], ["t", "autoExt"]],
			},
			2: {
				requirementDescription: "4 Total Quirks",
				done() { return player.q.total.gte(4) },
				effectDescription: "Keep Time, Enhance, & Space Upgrades on all resets, and keep Space Buildings on Quirk/Hindrance resets.",
			},
			3: {
				requirementDescription: "6 Total Quirks",
				done() { return player.q.total.gte(6) },
				effectDescription: "Unlock Auto-Time Capsules & Auto-Space Energy.",
				toggles: [["t", "auto"], ["s", "auto"]],
			},
			4: {
				requirementDescription: "10 Total Quirks",
				done() { return player.q.total.gte(10) },
				effectDescription: "Unlock Hindrances & Auto-Super Boosters.",
				toggles: [["sb", "auto"]],
			},
			5: {
				requirementDescription: "25 Total Quirks",
				done() { return player.q.total.gte(25) },
				effectDescription: "Time, Space, & Super-Boosters reset nothing, and you can destroy individual Space Buildings.",
			},
			6: {
				unlocked() { return player.sg.unlocked },
				requirementDescription: "1e22 Total Quirks",
				done() { return player.q.total.gte(1e22) },
				effectDescription: "Unlock Auto-Super Generators & Super-Generators reset nothing.",
				toggles: [["sg", "auto"]],
			},
		},
		upgrades: {
			rows: 4,
			cols: 4,
			11: {
				title: "Quirk Central",
				description: "Total Quirks multiply each Quirk Layer's production (boosted by Quirk Upgrades bought).",
				cost() { return player.q.time.plus(1).pow(1.2).times(100) },
				costFormula: "100*(time+1)^1.2",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasChallenge("h", 11) },
				effect() { return player.q.total.plus(1).log10().plus(1).pow(player.q.upgrades.length).pow(improvementEffect("q", 11)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "(log(quirks+1)+1)^upgrades",
			},
			12: {
				title: "Back To Row 2",
				description: "Total Quirks multiply the Booster/Generator bases.",
				cost() { return player.q.time.plus(1).pow(1.4).times(500) },
				costFormula: "500*(time+1)^1.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 11) },
				effect() { return player.q.total.plus(1).log10().plus(1).pow(1.25).times(improvementEffect("q", 12)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "(log(x+1)+1)^1.25",
			},
			13: {
				title: "Skip the Skip the Second",
				description: "The Generator Power effect is raised to the power of 1.25.",
				cost() { return player.q.time.plus(1).pow(1.8).times(750) },
				costFormula: "750*(time+1)^1.8",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 11) },
			},
			14: {
				title: "Row 4 Synergy",
				description: "Hindrance Spirit & Quirks boost each other's gain.",
				cost() { return player.q.time.plus(1).pow(2.4).times(1e6) },
				costFormula: "1e6*(time+1)^2.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 12)||hasUpgrade("q", 13) },
				effect() { return {
					h: player.q.points.plus(1).cbrt().pow(improvementEffect("q", 13)),
					q: player.h.points.plus(1).root(4).pow(improvementEffect("q", 13)),
				}},
				effectDisplay() { return "H: "+format(this.effect().h)+"x, Q: "+format(this.effect().q)+"x" },
				formula: "H: cbrt(Q+1), Q: (H+1)^0.25",
			},
			21: {
				title: "Quirk City",
				description: "Super Boosters multiply each Quirk Layer's production.",
				cost() { return player.q.time.plus(1).pow(3.2).times(1e8) },
				costFormula: "1e8*(time+1)^3.2",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 11)&&hasUpgrade("q", 13) },
				effect() { return Decimal.pow(1.25, player.sb.points).pow(improvementEffect("q", 21)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1.25^x",
			},
			22: {
				title: "Infinite Possibilities",
				description: "Total Quirks provide free Extra Time Capsules, Enhancers, & Space Buildings.",
				cost() { return player.q.time.plus(1).pow(4.2).times(2e11) },
				costFormula: "2e11*(time+1)^4.2",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 12)&&hasUpgrade("q", 14) },
				effect() { return player.q.total.plus(1).log10().sqrt().times(improvementEffect("q", 22)).floor() },
				effectDisplay() { return "+"+formatWhole(this.effect()) },
				formula: "floor(sqrt(log(x+1)))",
			},
			23: {
				title: "The Waiting Game",
				description: "The Quirk Energy effect is cubed.",
				cost() { return player.q.time.plus(1).pow(5.4).times(5e19) },
				costFormula: "5e19*(time+1)^5.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 13)&&hasUpgrade("q", 21) },
			},
			24: {
				title: "Exponential Madness",
				description: "The first Time Energy effect & the first Enhancer effect are raised ^7.5.",
				cost() { return player.q.time.plus(1).pow(6.8).times(1e24) },
				costFormula: "1e24*(time+1)^6.8",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 14)&&hasUpgrade("q", 22) },
			},
			31: {
				title: "Scale Softening",
				description: "Post-12 scaling for static layers in rows 2-3 starts later based on your Quirk Layers.",
				cost() { return player.q.time.plus(1).pow(8.4).times(1e48) },
				costFormula: "1e48*(time+1)^8.4",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 21)&&hasUpgrade("q", 23) },
				effect() { return player.q.buyables[11].sqrt().times(0.4).times(improvementEffect("q", 31)) },
				effectDisplay() { return "+"+format(this.effect()) },
				formula: "sqrt(x)*0.4",
			},
			32: {
				title: "Quinary Superspace",
				description: "The Quinary Space Building's effect is twice as strong.",
				cost() { return player.q.time.plus(1).pow(10).times(1e58) },
				costFormula: "1e58*(time+1)^10",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 22)&&hasUpgrade("q", 24) },
			},
			33: {
				title: "Generated Progression",
				description: "Unlock Super Generators.",
				cost() { return player.q.time.plus(1).pow(12).times(1e81) },
				costFormula: "1e81*(time+1)^12",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 23)&&hasUpgrade("q", 31) },
			},
			34: {
				title: "Booster Madness",
				description: "Anything that adds to the Booster base also multiplies it at a reduced rate.",
				cost() { return player.q.time.plus(1).pow(15).times(2.5e94) },
				costFormula: "2.5e94*(time+1)^15",
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 24)&&hasUpgrade("q", 32) },
				effect() { return tmp.b.addToBase.plus(1).root(2.5).times(improvementEffect("q", 32)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "(x+1)^0.4",
			},
			41: {
				title: "Quirkier",
				description: "Unlock Quirk Improvements.",
				cost: new Decimal(1e125),
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 33) && hasUpgrade("q", 34) },
			},
			42: {
				title: "Improvement Boost",
				description: "Unlock 3 more Quirk Improvements.",
				cost: new Decimal(1e150),
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 41) },
			},
			43: {
				title: "More Layers",
				description: "Quirk Layers cost scale 25% slower.",
				cost: new Decimal(1e175),
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 42) },
			},
			44: {
				title: "Improvements Galore",
				description: "Unlock another 3 Quirk Improvements.",
				cost: new Decimal(1e290),
				currencyDisplayName: "quirk energy",
				currencyInternalName: "energy",
				currencyLayer: "q",
				unlocked() { return hasUpgrade("q", 43) },
			},
		},
		impr: {
			amount() { return player.q.energy.div(1e128).plus(1).log10().div(2).sqrt().floor() },
			nextAt(id=11) { return Decimal.pow(10, getImprovements("q", id).times(tmp.q.impr.rows*tmp.q.impr.cols).add(tmp.q.impr[id].num).pow(2).times(2)).sub(1).times(1e128) },
			resName: "quirk energy",
			rows: 3,
			cols: 3,
			11: {
				num: 1,
				title: "Central Improvement",
				description: "<b>Quirk Central</b> is stronger.",
				unlocked() { return hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.1, getImprovements("q", 11)).plus(1) },
				effectDisplay() { return "^"+format(this.effect()) },
				formula: "1+0.1*x",
			},
			12: {
				num: 2,
				title: "Secondary Improvement",
				description: "<b>Back to Row 2</b> is stronger.",
				unlocked() { return hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.05, getImprovements("q", 12)).plus(1) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1+0.05*x",
			},
			13: {
				num: 3,
				title: "Level 4 Improvement",
				description: "<b>Row 4 Synergy</b> is stronger.",
				unlocked() { return hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.25, getImprovements("q", 13)).plus(1) },
				effectDisplay() { return "^"+format(this.effect()) },
				formula: "1+0.25*x",
			},
			21: {
				num: 4,
				title: "Developmental Improvement",
				description: "<b>Quirk City</b> is stronger.",
				unlocked() { return hasUpgrade("q", 42) },
				effect() { return Decimal.mul(1.5, getImprovements("q", 21)).plus(1) },
				effectDisplay() { return "^"+format(this.effect()) },
				formula: "1+1.5*x",
			},
			22: {
				num: 5,
				title: "Transfinite Improvement",
				description: "<b>Infinite Possibilities</b> is stronger.",
				unlocked() { return hasUpgrade("q", 42) },
				effect() { return Decimal.mul(0.2, getImprovements("q", 22)).plus(1) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1+0.2*x",
			},
			23: {
				num: 6,
				title: "Energy Improvement",
				description: "The Quirk Energy effect is stronger.",
				unlocked() { return hasUpgrade("q", 42) },
				effect() { return Decimal.pow(1e25, Decimal.pow(getImprovements("q", 23), 1.5)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1e25^(x^1.5)",
			},
			31: {
				num: 7,
				title: "Scale Improvement",
				description: "<b>Scale Softening</b> is stronger.",
				unlocked() { return hasUpgrade("q", 44) },
				effect() { return Decimal.mul(0.5, getImprovements("q", 31)).plus(1) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1+0.5*x",
			},
			32: {
				num: 8,
				title: "Booster Improvement",
				description: "<b>Booster Madness</b> is stronger.",
				unlocked() { return hasUpgrade("q", 44) },
				effect() { return Decimal.mul(0.2, getImprovements("q", 32)).plus(1) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1+0.2*x",
			},
			33: {
				num: 9,
				title: "Quirk Improvement",
				description: "Quirk gain is stronger.",
				unlocked() { return hasUpgrade("q", 44) },
				effect() { return Decimal.pow(1e8, Decimal.pow(getImprovements("q", 33), 1.2)) },
				effectDisplay() { return format(this.effect())+"x" },
				formula: "1e8^(x^1.2)",
			},
		},
})

addLayer("a", {
        startData() { return {
            unlocked: true,
        }},
        color: "yellow",
        row: "side",
        layerShown() {return true}, 
        tooltip() { // Optional, tooltip displays when the layer is locked
            return ("Achievements")
        },
        achievements: {
            rows: 5,
            cols: 4,
            11: {
                name: "All that progress is gone!",
                done() { return player.p.points.gt(0) },
                tooltip: "Perform a Prestige reset.",
            },
			12: {
				name: "Point Hog",
				done() { return player.points.gte(25) },
				tooltip: "Reach 25 Points.",
			},
			13: {
				name: "Prestige all the Way",
				done() { return player.p.upgrades.length>=3 },
				tooltip: "Purchase 3 Prestige Upgrades. Reward: Gain 10% more Prestige Points.",
			},
			14: {
				name: "Prestige^2",
				done() { return player.p.points.gte(25) },
				tooltip: "Reach 25 Prestige Points.",
			},
			21: {
				name: "New Rows Await!",
				done() { return player.b.unlocked||player.g.unlocked },
				tooltip: "Perform a Row 2 reset. Reward: Generate Points 10% faster, and unlock 3 new Prestige Upgrades.",
			},
			22: {
				name: "I Will Have All of the Layers!",
				done() { return player.b.unlocked&&player.g.unlocked },
				tooltip: "Unlock Boosters & Generators.",
			},
			23: {
				name: "Prestige^3",
				done() { return player.p.points.gte(1e45) },
				tooltip: "Reach 1e45 Prestige Points. Reward: Unlock 3 new Prestige Upgrades.",
			},
			24: {
				name: "Hey I don't own that company yet!",
				done() { return player.points.gte(1e100) },
				tooltip: "Reach 1e100 Points.",
			},
			31: {
				name: "Further Further Down",
				done() { return player.e.unlocked||player.t.unlocked||player.s.unlocked },
				tooltip: "Perform a Row 3 reset. Reward: Generate Points 50% faster, and Boosters/Generators don't increase each other's requirements.",
			},
			32: {
				name: "Why no meta-layer?",
				done() { return player.points.gte(Number.MAX_VALUE) },
				tooltip: "Reach 1.8e308 Points. Reward: Double Prestige Point gain.",
			},
			33: {
				name: "That Was Quick",
				done() { return player.e.unlocked&&player.t.unlocked&&player.s.unlocked },
				tooltip: "Unlock Time, Enhance, & Space. Reward: Unlock some new Time, Enhance, & Space Upgrades.",
			},
			34: {
				name: "Who Needs Row 2 Anyway?",
				done() { return player.b.best.eq(0) && player.g.best.eq(0) && player.points.gte("1e525") },
				tooltip: "Reach 1e525 Points without any Boosters or Generators.",
			},
			41: {
				name: "Super Super",
				done() { return player.sb.unlocked },
				tooltip: "Unlock Super-Boosters. Reward: Prestige Upgrades are always kept on reset, and unlock 3 new Booster Upgrades.",
			},
			42: {
				name: "Yet Another Inf- [COPYRIGHT]",
				done() { return player.g.power.gte(Number.MAX_VALUE) },
				tooltip: "Reach 1.8e308 Generator Power.",
			},
			43: {
				name: "Enhancing a Company",
				done() { return player.e.points.gte(1e100) },
				tooltip: "Reach 1e100 Enhance Points.",
			},
			44: {
				name: "Space is for Dweebs",
				done() { return tmp.s.manualBuildingLevels.eq(0) && player.g.power.gte("1e370") },
				tooltip: "Reach 1e370 Generator Power without any Space Buildings.",
			},
			51: {
				name: "Yet Another Row, Huh",
				done() { return player.h.unlocked||player.q.unlocked },
				tooltip: "Perform a Row 4 reset. Reward: Time/Enhance/Space don't increase each other's requirements.",
			},
			52: {
				name: "Hinder is Coming",
				done() { return inChallenge("h", 11) && player.points.gte("1e7250") },
				tooltip: 'Reach e7,250 Points in "Upgrade Desert"',
			},
			53: {
				name: "Already????",
				done() { return player.sg.unlocked },
				tooltip: "Perform a Super-Generator reset. Reward: Get 2 extra Space.",
			},
        },
        midsection: [
            "achievements",
		],
		update(diff) {	// Added this section to call adjustNotificationTime every tick, to reduce notification timers
			adjustNotificationTime(diff);
		},	
    }, 
)