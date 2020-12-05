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
			if (hasUpgrade("p", 23)) mult = mult.times(upgradeEffect("p", 23));
			if (hasUpgrade("p", 41)) mult = mult.times(upgradeEffect("p", 41));
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
		passiveGeneration() { return hasMilestone("g", 1)?1:0 },
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("b", 0) && resettingLayer=="b") keep.push("upgrades")
			if (hasMilestone("g", 0) && resettingLayer=="g") keep.push("upgrades")
			if (hasMilestone("e", 1) && resettingLayer=="e") keep.push("upgrades")
			if (hasMilestone("t", 1) && resettingLayer=="t") keep.push("upgrades")
			if (hasMilestone("s", 1) && resettingLayer=="s") keep.push("upgrades")
			if (hasAchievement("a", 41)) keep.push("upgrades")
			keep.push("pseudoUpgs")
			if (layers[resettingLayer].row > this.row) layerDataReset("p", keep)
		},
		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			pseudoUpgs: [],
			first: 0,
		}},
		upgrades: {
			rows: 4,
			cols: 4,
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
					
					if (hasChallenge("h", 22)) eff = softcap("p12_h22", eff);
					else eff = softcap("p12", eff);
					
					if (hasUpgrade("p", 14)) eff = eff.pow(3);
					return eff;
				},
				unlocked() { return hasUpgrade("p", 11) },
				effectDisplay() { return format(tmp.p.upgrades[12].effect)+"x" },
				formula() { 
					let exp = format(0.5*(hasUpgrade("g", 14)?1.5:1)*(hasUpgrade("g", 24)?1.4666667:1));
					let f = "(x+2)^"+exp
					if (upgradeEffect("p", 12).gte("1e3500")) {
						if (hasChallenge("h", 22)) f = "10^(sqrt(log(x+2))*"+format(Decimal.mul(exp, 3500).sqrt())+")"
						else f = "log(x+2)*"+format(Decimal.div("1e3500",3500).times(exp))
					}
					if (hasUpgrade("p", 14)) f += "^3"
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
					if (hasUpgrade("hn", 13)) eff = eff.pow(upgradeEffect("hn", 13));
					return eff;
				},
				unlocked() { return hasUpgrade("p", 12) },
				effectDisplay() { return format(tmp.p.upgrades[13].effect)+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (hasUpgrade("p", 33)) exp = exp.times(upgradeEffect("p", 33));
					if (hasUpgrade("g", 15)) exp = exp.times(upgradeEffect("g", 15));
					if (hasUpgrade("hn", 13)) exp = exp.times(upgradeEffect("hn", 13))
					return "(log(x+1)^0.75+1)"+(exp.gt(1)?("^"+format(exp)):"")
				},
			},
			14: {
				title: "Prestigious Intensity",
				description: "<b>Prestige Boost</b>'s effect is cubed (unaffected by softcap).",
				cost() { return tmp.h.costMult11.times("1e4070000").pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && hasUpgrade("p", 13) },
				pseudoReq: 'Req: 1e168,000 Prestige Points in the "Productionless" Hindrance',
				pseudoCan() { return player.p.points.gte("1e168000")&&inChallenge("h", 42) },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
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
					if (hasUpgrade("hn", 22)) eff = eff.pow(upgradeEffect("hn", 22))
					return eff;
				},
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 12) },
				effectDisplay() { return format(tmp.p.upgrades[22].effect)+"x" },
				formula() { 
					let exp = new Decimal(hasUpgrade("p", 32)?2:1);
					if (hasUpgrade("hn", 22)) exp = exp.times(upgradeEffect("hn", 22));
					return exp.gt(1)?("(1.4^x)^"+format(exp)):"1.4^x" 
				},
			},
			23: {
				title: "Reverse Prestige Boost",
				description: "Prestige Point gain is boosted by your Points.",
				cost() { return tmp.h.costMult11.times(5e3).pow(tmp.h.costExp11) },
				effect() {
					let eff = player.points.plus(1).log10().cbrt().plus(1);
					if (hasUpgrade("p", 33)) eff = eff.pow(upgradeEffect("p", 33));
					if (hasUpgrade("g", 23)) eff = eff.pow(upgradeEffect("g", 23));
					if (hasUpgrade("hn", 23)) eff = eff.pow(upgradeEffect("hn", 23));
					return eff;
				},
				unlocked() { return hasAchievement("a", 21)&&hasUpgrade("p", 13) },
				effectDisplay() { return format(tmp.p.upgrades[23].effect)+"x" },
				formula() { 
					let exp = new Decimal(1);
					if (hasUpgrade("p", 33)) exp = exp.times(upgradeEffect("p", 33));
					if (hasUpgrade("g", 23)) exp = exp.times(upgradeEffect("g", 23));
					if (hasUpgrade("hn", 23)) exp = exp.times(upgradeEffect("hn", 23));
					return exp.gt(1)?("(log(x+1)^(1/3)+1)^"+format(exp)):"log(x+1)^(1/3)+1"
				},
			},
			24: {
				title: "Plasmic Energies",
				description: "The Tachoclinal Plasma effect uses a better formula (log(log(x+1)+1)*10+1 -> 10^cbrt(log(x+1))).",
				cost() { return tmp.h.costMult11.times("e5070000").pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && (hasUpgrade("p", 14)||hasUpgrade("p", 23)) },
				pseudoReq: "Req: 41,250 Damned Souls without any Wraiths.",
				pseudoCan() { return player.ps.souls.gte(41250) && player.ps.buyables[11].eq(0) },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
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
				effectDisplay() { return "^"+format(tmp.p.upgrades[33].effect) },
				formula: "log(log(x+1)+1)/5+1",
			},
			34: {
				title: "p34",
				description: "???",
				cost() { return tmp.h.costMult11.times(1/0).pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && (hasUpgrade("p", 24)||hasUpgrade("p", 33)) },
				pseudoReq: "Coming Soon!",
				pseudoCan() { return false },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
			},
			41: {
				title: "Prestige Recursion",
				description: "Prestige Points boost their own gain.",
				cost() { return tmp.h.costMult11.times("1e4460000").pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && hasUpgrade("p", 31) },
				pseudoReq: "Req: 25 Total Honour",
				pseudoCan() { return player.hn.total.gte(25) },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
				effect() { return Decimal.pow(10, player.p.points.plus(1).log10().pow(.8)) },
				effectDisplay() { return format(tmp.p.upgrades[41].effect)+"x" },
				formula: "10^(log(x+1)^0.8)",
			},
			42: {
				title: "Spatial Awareness",
				description: "Space Building costs scale 50% slower.",
				cost() { return tmp.h.costMult11.times("e5960000").pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && hasUpgrade("p", 32) },
				pseudoReq: "Req: 1e100 Solarity",
				pseudoCan() { return player.o.points.gte(1e100) },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
			},
			43: {
				title: "p43",
				description: "???",
				cost() { return tmp.h.costMult11.times(1/0).pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && hasUpgrade("p", 33) },
				pseudoReq: "Coming Soon!",
				pseudoCan() { return false },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
			},
			44: {
				title: "p44",
				description: "???",
				cost() { return tmp.h.costMult11.times(1/0).pow(tmp.h.costExp11) },
				pseudoUnl() { return hasUpgrade("hn", 11) && hasUpgrade("p", 33) },
				pseudoReq: "Coming Soon!",
				pseudoCan() { return false },
				unlocked() { return player.p.pseudoUpgs.includes(Number(this.id)) },
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
			if (player.m.unlocked) base = base.times(tmp.m.buyables[11].effect);
			if (inChallenge("h", 12)) base = base.div(tmp.h.baseDiv12);
			
			return base.pow(tmp.b.power);
		},
		power() {
			let power = new Decimal(1);
			if (player.m.unlocked) power = power.times(player.m.spellTimes[12].gt(0)?1.05:1);
			return power;
		},
		effect() {
			return Decimal.pow(tmp.b.effectBase, player.b.points).max(0);
		},
		effectDescription() {
			return "which are boosting Point generation by "+format(tmp.b.effect)+"x"+(tmp.nerdMode?("\n ("+format(tmp.b.effectBase)+"x each)"):"")
		},
		doReset(resettingLayer) {
			let keep = [];
			if (hasMilestone("e", 0) && resettingLayer=="e") keep.push("milestones")
			if (hasMilestone("t", 0) && resettingLayer=="t") keep.push("milestones")
			if (hasMilestone("s", 0) && resettingLayer=="s") keep.push("milestones")
			if (hasMilestone("q", 0)) keep.push("milestones")
			if (hasMilestone("t", 2) || hasAchievement("a", 64)) keep.push("upgrades")
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
		autoPrestige() { return (hasMilestone("t", 3) && player.b.auto) },
		increaseUnlockOrder: ["g"],
		milestones: {
			0: {
				requirementDescription: "8 Boosters",
				done() { return player.b.best.gte(8) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "15 Boosters",
				done() { return player.b.best.gte(15) || hasAchievement("a", 71) },
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
				effectDisplay() { return format(tmp.b.upgrades[11].effect)+"x" },
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
				effectDisplay() { return "+"+format(tmp.b.upgrades[12].effect) },
				formula() { return "sqrt(log(x+1))"+(hasUpgrade("e", 14)?("*"+format(upgradeEffect("e", 14).div(3))):"/3") },
			},
			13: {
				title: "PB Reversal",
				description: "Total Prestige Points add to the Booster effect base.",
				cost() { return tmp.h.costMult11b.times(8) },
				effect() { return player.p.total.add(1).log10().add(1).log10().div(3).times(hasUpgrade("e", 14)?upgradeEffect("e", 14):1) },
				unlocked() { return player.b.unlocked&&player.b.best.gte(7) },
				effectDisplay() { return "+"+format(tmp.b.upgrades[13].effect) },
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
				effectDisplay() { return "/"+format(tmp.b.upgrades[23].effect) },
				formula() { return "(log(x+1)+1)^"+(player.s.unlocked?format(buyableEffect("s", 14).times(3.2)):"3.2") },
			},
			31: {
				title: "Worse BP Combo",
				description: "Super Boosters boost Prestige Point gain.",
				cost() { return tmp.h.costMult11b.times(103) },
				unlocked() { return hasAchievement("a", 41) },
				effect() { return Decimal.pow(1e20, player.sb.points.pow(1.5)) },
				effectDisplay() { return format(tmp.b.upgrades[31].effect)+"x" },
				formula: "1e20^(x^1.5)",
			},
			32: {
				title: "Better BP Combo",
				description() { return "<b>BP Combo</b> uses a better formula"+(tmp.nerdMode?" (sqrt(x+1) -> (1.125^x)*sqrt(x+1))":"")+"." },
				cost() { return tmp.h.costMult11b.times(111) },
				unlocked() { return hasAchievement("a", 41) },
			},
			33: {
				title: "Even More Additions",
				description: "<b>More Additions</b> is stronger based on your Super Boosters.",
				cost() { return tmp.h.costMult11b.times(118) },
				unlocked() { return hasAchievement("a", 41) },
				effect() { return player.sb.points.times(player.sb.points.gte(4)?2.6:2).plus(1) },
				effectDisplay() { return format(tmp.b.upgrades[33].effect)+"x" },
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
			return "which are generating "+format(tmp.g.effect)+" Generator Power/sec"+(tmp.nerdMode?("\n ("+format(tmp.g.effBase)+"x each)"):"")
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
		autoPrestige() { return (hasMilestone("s", 3) && player.g.auto) },
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
			if (hasMilestone("s", 2) || hasAchievement("a", 64)) keep.push("upgrades")
			if (hasMilestone("e", 2) && resettingLayer=="e") keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset("g", keep)
		},
		tabFormat: ["main-display",
			"prestige-button",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.g.power) + ' Generator Power, which boosts Point generation by '+format(tmp.g.powerEff)+'x'+(tmp.nerdMode?" ((x+1)^"+format(tmp.g.powerExp)+")":"")},
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
				done() { return player.g.best.gte(8) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			1: {
				requirementDescription: "10 Generators",
				done() { return player.g.best.gte(10) || hasAchievement("a", 71) },
				effectDescription: "You gain 100% of Prestige Point gain every second.",
			},
			2: {
				requirementDescription: "15 Generators",
				done() { return player.g.best.gte(15) || hasAchievement("a", 71) },
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
				effectDisplay() { return format(tmp.g.upgrades[11].effect)+"x" },
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
				effectDisplay() { return "+"+format(tmp.g.upgrades[12].effect) },
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
				effectDisplay() { return "+"+format(tmp.g.upgrades[13].effect) },
				formula() { 
					let m = new Decimal(hasUpgrade("e", 14)?upgradeEffect("e", 14):1).div(3)
					if (hasUpgrade("s", 24)) m = upgradeEffect("s", 24).times(m);
					return "log(log(x+1)+1)"+(m.eq(1)?"":(m.gt(1)?("*"+format(m)):("/"+format(m.pow(-1)))));
				},
			},
			14: {
				title: "Boost the Boost",
				description() { return "<b>Prestige Boost</b> is raised to the power of 1.5." },
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
				effectDisplay() { return "^"+format(tmp.g.upgrades[15].effect) },
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
				effectDisplay() { return format(tmp.g.upgrades[21].effect)+"x" },
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
				effectDisplay() { return "/"+format(tmp.g.upgrades[22].effect) },
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
				effectDisplay() { return "^"+format(tmp.g.upgrades[23].effect) },
				formula: "x^0.85+1",
			},
			24: {
				title: "Boost the Boost Again",
				description: "<b>Prestige Boost</b> is raised to the power of 1.467.",
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
				effectDisplay() { return format(tmp.g.upgrades[25].effect)+"x" },
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
			if (player.o.unlocked) mult = mult.times(tmp.o.solEnEff2);
			return mult;
		},
		enGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("t", 22)) mult = mult.times(upgradeEffect("t", 22));
			if (player.h.unlocked) mult = mult.times(tmp.h.effect);
			return mult;
		},
		effBaseMult() {
			let mult = new Decimal(1);
			if (player.o.unlocked) mult = mult.times(buyableEffect("o", 13));
			if (player.ba.unlocked) mult = mult.times(tmp.ba.posBuff);
			if (player.m.unlocked) mult = mult.times(tmp.m.buyables[12].effect);
			return mult;
		},
		effBasePow() {
			let exp = new Decimal(1);
			if (player.m.unlocked) exp = exp.times(player.m.spellTimes[12].gt(0)?1.1:1);
			return exp;
		},
		effGainBaseMult() {
			let mult = new Decimal(1);
			if (player.ps.unlocked) mult = mult.times(challengeEffect("h", 32));
			return mult;
		},
		effect() { return {
			gain: Decimal.pow(tmp.t.effBaseMult.times(tmp.t.effGainBaseMult).times(3).pow(tmp.t.effBasePow), player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).times(player.t.points.plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enGainMult),
			limit: Decimal.pow(tmp.t.effBaseMult.times(2).pow(tmp.t.effBasePow), player.t.points.plus(player.t.buyables[11]).plus(tmp.t.freeExtraTimeCapsules)).sub(1).times(100).times(player.t.points.plus(player.t.buyables[11]).gt(0)?1:0).times(tmp.t.enCapMult),
		}},
		effectDescription() {
			return "which are generating "+format(tmp.t.effect.gain)+" Time Energy/sec, but with a limit of "+format(tmp.t.effect.limit)+" Time Energy"+(tmp.nerdMode?("\n("+format(tmp.t.effBaseMult.times(tmp.t.effGainBaseMult).times(3))+"x gain each, "+format(tmp.t.effBaseMult.times(2))+"x limit each)"):"")
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
		autoPrestige() { return (player.t.auto && hasMilestone("q", 3)) },
		update(diff) {
			if (player.t.unlocked) player.t.energy = player.t.energy.plus(this.effect().gain.times(diff)).min(this.effect().limit).max(0);
			if (player.t.autoExt && hasMilestone("q", 1) && !inChallenge("h", 31)) this.buyables[11].buyMax();
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
				function() {return 'You have ' + format(player.t.energy) + ' Time Energy, which boosts Point & Prestige Point gain by '+format(tmp.t.enEff)+'x'+(tmp.nerdMode?" ((x+1)^"+format(1.2*(hasUpgrade("t", 14)?1.3:1)*(hasUpgrade("q", 24)?7.5:1))+")":"")+(hasUpgrade("t", 24)?(", and provides "+formatWhole(tmp.t.enEff2)+" free Extra Time Capsules ("+(tmp.nerdMode?"log(x+1)^0.556":("next at "+format(tmp.t.nextEnEff2)))+")."):"")},
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
			if (hasMilestone("q", 2) || hasAchievement("a", 64)) keep.push("upgrades")
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
				effectDisplay() { return "+"+format(tmp.t.upgrades[11].effect) },
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
				effectDisplay() { return format(tmp.t.upgrades[12].effect)+"x" },
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
				effectDisplay() { return "+"+format(tmp.t.upgrades[13].effect) },
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
				effectDisplay() { return format(tmp.t.upgrades[22].effect)+"x" },
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
				effectDisplay() { return "+"+format(tmp.t.upgrades[25].effect) },
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
                    let display = (tmp.nerdMode?("Cost Formula: "+(player[this.layer].buyables[this.id].gte(25)?"(((x^2)/25":"((x")+"*0.4)^1.2+1)*10"):("Cost: " + formatWhole(data.cost) + " Boosters"))+"\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(e.gt(0)?(" + "+formatWhole(e)):"")+(inChallenge("h", 31)?("\nPurchases Left: "+String(10-player.h.chall31bought)):"")
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
				autoed() { return player.t.autoExt && hasMilestone("q", 1) && !inChallenge("h", 31) },
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Time Capsules",
				done() { return player.t.best.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Time Capsules",
				done() { return player.t.best.gte(3) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Time Capsules",
				done() { return player.t.best.gte(4) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Time Capsules",
				done() { return player.t.best.gte(5) || hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Boosters.",
				toggles: [["b", "auto"]],
			},
			4: {
				requirementDescription: "8 Time Capsules",
				done() { return player.t.best.gte(8) || hasAchievement("a", 71) },
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
		passiveGeneration() { return hasMilestone("q", 1)?1:0 },
		update(diff) {
			if (player.e.auto && hasMilestone("q", 1) && !inChallenge("h", 31)) this.buyables[11].buyMax();
		},
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "e", description: "Press E to Enhance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        increaseUnlockOrder: ["t", "s"],
        doReset(resettingLayer){ 
			let keep = []
			if (hasMilestone("q", 2) || hasAchievement("a", 64)) keep.push("upgrades")
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
				effectDisplay() { return "+"+format(tmp.e.upgrades[11].effect.g)+" to Generator base, +"+format(tmp.e.upgrades[11].effect.b)+" to Booster base" },
				formula: "log(x+1)",
			},
			12: {
				title: "Enhanced Prestige",
				description: "Total Enhance Points boost Prestige Point gain.",
				cost() { return new Decimal(player.e.unlockOrder>=2?400:1e3) },
				unlocked() { return hasUpgrade("e", 11) },
				effect() { 
					let ret = player.e.total.add(1).pow(1.5) 
					ret = softcap("e12", ret);
					return ret
				},
				effectDisplay() { return format(tmp.e.upgrades[12].effect)+"x" },
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
				effectDisplay() { return format(tmp.e.upgrades[14].effect)+"x" },
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
				effectDisplay() { return "+"+formatWhole(tmp.e.upgrades[23].effect) },
				formula: "floor(x^2/25)",
			},
			24: {
				title: "Monstrous Growth",
				description: "Boosters & Generators boost Enhance Point gain.",
				cost: new Decimal(2.5e28),
				unlocked() { return hasAchievement("a", 33) },
				effect() { return Decimal.pow(1.1, player.b.points.plus(player.g.points).pow(0.9)) },
				effectDisplay() { return format(tmp.e.upgrades[24].effect)+"x" },
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
                    return (tmp.nerdMode?("Cost Formula: 2^("+(player[this.layer].buyables[this.id].gte(25)?"((x^2)/25)":"x")+"^1.5)"):("Cost: " + formatWhole(data.cost) + " Enhance Points"))+"\n\
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
				autoed() { return player.e.auto && hasMilestone("q", 1) && !inChallenge("h", 31) },
                style: {'height':'222px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Enhance Points",
				done() { return player.e.best.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "5 Enhance Points",
				done() { return player.e.best.gte(5) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "25 Enhance Points",
				done() { return player.e.best.gte(25) || hasAchievement("a", 71) },
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
			autoBld: false,
        }},
        color: "#dfdfdf",
        requires() { return new Decimal(1e120).times(Decimal.pow("1e180", Decimal.pow(player[this.layer].unlockOrder, 1.415038))) }, // Can be a function that takes requirement increases into account
        resource: "space energy", // Name of prestige currency
        baseResource: "points", // Name of resource prestige is based on
        baseAmount() {return player.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.85), // Prestige currency exponent
        base() { return new Decimal(hasUpgrade("ss", 11)?1e10:1e15) },
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
			if (hasMilestone("q", 2) || hasAchievement("a", 64)) keep.push("upgrades")
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
			if (player.ss.unlocked) space = space.plus(tmp.ss.eff1);
			
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
			if (hasUpgrade("ss", 31)) x = x.plus(upgradeEffect("ss", 31));
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
			if (player.ss.unlocked) pow = pow.plus(tmp.ss.eff2);
			if (hasUpgrade("ss", 42)) pow = pow.plus(1);
			if (hasUpgrade("ba", 12)) pow = pow.plus(upgradeEffect("ba", 12));
			if (inChallenge("h", 21)) pow = pow.sub(0.9);
			return pow;
		},
		autoPrestige() { return player.s.auto&&hasMilestone("q", 3) },
		update(diff) {
			if (player.s.autoBld && hasMilestone("q", 7)) for (let i=5;i>=1;i--) layers.s.buyables[10+i].buyMax();
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
				effectDisplay() { return format(tmp.s.upgrades[12].effect)+"x" },
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
				effectDisplay() { return format(tmp.s.upgrades[13].effect)+"x" },
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
				effectDisplay() { return "+"+formatWhole(tmp.s.upgrades[22].effect) },
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
				effectDisplay() { return format(tmp.s.upgrades[24].effect.sub(1).times(100))+"% stronger" },
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
			if (player.ss.unlocked) div = div.times(tmp.ss.eff3);
			return div;
		},
		buildScalePower() {
			let scale = new Decimal(1);
			if (hasUpgrade("p", 42)) scale = scale.sub(.5);
			return scale;
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
					return Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(1.35)).times(base).div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(x.plus(1).plus(tmp.s.freeSpaceBuildings).times(tmp.s.buildingPower), player.s.points.sqrt()).times(x.plus(tmp.s.freeSpaceBuildings).plus(tmp.s.freeSpaceBuildings1to4).times(tmp.s.buildingPower).max(1).times(4));
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x"+("*"+format(tmp.s.buildScalePower))+")^1.35)*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
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
				target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(1.35).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			12: {
				title: "Secondary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(1.35)).times(base).div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = x.plus(tmp.s.freeSpaceBuildings).plus(tmp.s.freeSpaceBuildings1to4).times(tmp.s.buildingPower).sqrt();
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^1.35)*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
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
				target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(1.35).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			13: {
				title: "Tertiary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					return Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(1.35)).times(base).div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let eff = Decimal.pow(1e18, x.plus(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4)).times(tmp.s.buildingPower).pow(0.9))
					eff = softcap("spaceBuilding3", eff);
					return eff;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^1.35)*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
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
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(1.35).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			14: {
				title: "Quaternary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(1.35)).times(base);
					if (hasUpgrade("s", 15)) cost = cost.root(3);
					return cost.div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.freeSpaceBuildings.plus(tmp.s.freeSpaceBuildings1to4)).times(tmp.s.buildingPower).times((hasUpgrade("s", 15))?3:1).add(1).pow(1.25)
					ret = softcap("spaceBuilding4", ret);
					return ret;
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let extForm = hasUpgrade("s", 15)?3:1
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^1.35)*"+format(tmp.s.buildingBaseCosts[this.id])+(hasUpgrade("s", 15)?"^(1/3)":"")+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
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
                target() { return player.g.power.times(tmp.s.divBuildCosts).pow(hasUpgrade("s", 15)?3:1).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(1.35).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
			15: {
				title: "Quinary Space Building",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = tmp.s.buildingBaseCosts[this.id];
					let cost = Decimal.pow(base, x.times(tmp.s.buildScalePower).pow(1.35)).times(base);
					return cost.div(tmp.s.divBuildCosts);
                },
				effect(x=player[this.layer].buyables[this.id]) { // Effects of owning x of the items, x is a decimal
					let ret = x.plus(tmp.s.freeSpaceBuildings).times(tmp.s.buildingPower).div(2);
					if (hasUpgrade("q", 32)) ret = ret.times(2);
					return ret.floor();
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    return (tmp.nerdMode?("Cost Formula: "+format(tmp.s.buildingBaseCosts[this.id])+"^((x*"+format(tmp.s.buildScalePower)+")^1.35)*"+format(tmp.s.buildingBaseCosts[this.id])+"/"+format(tmp.s.divBuildCosts)):("Cost: " + formatWhole(data.cost) + " Generator Power"))+"\n\
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
                target() { return player.g.power.times(tmp.s.divBuildCosts).div(tmp.s.buildingBaseCosts[this.id]).max(1).log(tmp.s.buildingBaseCosts[this.id]).root(1.35).div(tmp.s.buildScalePower).plus(1).floor().min(player[this.layer].buyables[this.id].plus(layers.s.space())) }, 
                buyMax() {
					if (!this.canAfford() || !this.unlocked()) return;
					let target = this.target();
					player.s.spent = player.s.spent.plus(target.sub(player[this.layer].buyables[this.id]))
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				}, 
                style: {'height':'100px'},
				sellOne() {
					let amount = getBuyableAmount(this.layer, this.id)
					if (!hasMilestone("q", 5) || amount.lt(1)) return;
					setBuyableAmount(this.layer, this.id, amount.sub(1))
                    player[this.layer].spent = player[this.layer].spent.sub(1).max(0);
				},
				canSellOne() { return hasMilestone("q", 5) },
				autoed() { return player.s.autoBld && hasMilestone("q", 7) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Space Energy",
				done() { return player.s.best.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster/Generator milestones on reset.",
			},
			1: {
				requirementDescription: "3 Space Energy",
				done() { return player.s.best.gte(3) || hasAchievement("a", 41) || hasAchievement("a", 71) },
				effectDescription: "Keep Prestige Upgrades on reset.",
			},
			2: {
				requirementDescription: "4 Space Energy",
				done() { return player.s.best.gte(4) || hasAchievement("a", 71) },
				effectDescription: "Keep Generator Upgrades on all resets.",
			},
			3: {
				requirementDescription: "5 Space Energy",
				done() { return player.s.best.gte(5) || hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Generators.",
				toggles: [["g", "auto"]],
			},
			4: {
				requirementDescription: "8 Space Energy",
				done() { return player.s.best.gte(8) || hasAchievement("a", 71) },
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
			if (hasUpgrade("ss", 21)) mult = mult.div(1.2);
			return mult;
		},
		autoPrestige() { return player.sb.auto && hasMilestone("q", 4) },
		canBuyMax() { return hasMilestone("q", 7) },
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
			
			if (player.o.unlocked) base = base.times(buyableEffect("o", 12));
			return base;
		},
		effect() {
			return Decimal.pow(this.effectBase(), player.sb.points).max(0);
		},
		effectDescription() {
			return "which are multiplying the Booster base by "+format(tmp.sb.effect)+"x"+(tmp.nerdMode?("\n ("+format(tmp.sb.effectBase)+"x each)"):"")
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
			if (hasUpgrade("ss", 21)) mult = mult.div(1.2);
			return mult;
		},
		autoPrestige() { return player.sg.auto && hasMilestone("q", 6) },
		update(diff) {
			player.sg.power = player.sg.power.plus(tmp.sg.effect.times(diff));
		},
		canBuyMax() { return hasMilestone("q", 7) },
        row: 2, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "G", description: "Press Shift+G to perform a super generator reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        layerShown(){return hasUpgrade("q", 33)&&player.q.unlocked},
		resetsNothing() { return hasMilestone("q", 6) },
		effectBase() {
			let base = new Decimal(5);
			if (hasUpgrade("ss", 32)) base = base.plus(upgradeEffect("ss", 32));
			
			if (hasUpgrade("ba", 32)) base = base.times(upgradeEffect("ba", 32));
			return base;
		},
		effect() {
			let eff = Decimal.pow(this.effectBase(), player.sg.points).sub(1).max(0);
			if (tmp.h.challenges[31].unlocked) eff = eff.times(challengeEffect("h", 31));
			return eff;
		},
		effectDescription() {
			return "which are generating "+format(tmp.sg.effect)+" Super Generator Power/sec"+(tmp.nerdMode?("\n ("+format(tmp.sg.effectBase)+"x each)"):"")
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
				function() {return 'You have ' + format(player.sg.power) + ' Super Generator Power, which multiplies the Generator base by '+format(tmp.sg.enEff)+'x'+(tmp.nerdMode?(" (sqrt(x+1))"):"")},
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
			if (player.m.unlocked) mult = mult.times(tmp.m.hexEff);
			if (hasUpgrade("ba", 22)) mult = mult.times(tmp.ba.negBuff);
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
			let keep = [];
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			player.h.chall31bought = 0;
			if (hasMilestone("m", 1)) keep.push("challenges")
			if (layers[resettingLayer].row > this.row) {
				layerDataReset(this.layer, keep)
			}
        },
        layerShown(){return (player.t.unlocked&&hasMilestone("q", 4))||player.m.unlocked||player.ba.unlocked},
        branches: ["t"],
		effect() { 
			let h = player.h.points.times(player.points.plus(1).log("1e1000").plus(1));
			h = softcap("hindr_base", h);
			return h.plus(1).pow(3).pow(hasChallenge("h", 11)?1.2:1).pow(hasUpgrade("ba", 21)?8:1)
		},
		effectDescription() {
			return "which are multiplying Point gain, Time Energy gain, & the Time Energy cap by "+format(tmp.h.effect)+" ("+(tmp.nerdMode?(tmp.h.effect.gte(15e4)?("(10^sqrt(log(hindranceSpirit/1e3*(log(points+1)+1))/log(1.5e5))+1)^("+((hasChallenge("h", 11)?3.6:3)*(hasUpgrade("ba", 21)?8:1))+")"):("(hindranceSpirit/1e3*(log(points+1)+1)+1)^("+((hasChallenge("h", 11)?3.6:3)*(hasUpgrade("ba", 21)?8:1))+")")):"boosted by Points")+")"
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
		pointRoot31(x=challengeCompletions("h", 31)) {
			if (player.h.activeChallenge==32) x = challengeCompletions("h", 32)*2
			if (x>=20) x = Math.pow(x-19, 1.5)+19
			let root = Decimal.add(2, Decimal.pow(x, 1.5).div(16))
			return root;
		},
		passiveGeneration() { return hasMilestone("m", 2)?1:0 },
		challenges: {
			rows: 4,
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
				completionLimit() { 
					let lim = 10
					if (hasAchievement("a", 71)) lim += 10;
					if (hasAchievement("a", 74)) lim += 10;
					return lim
				},
				challengeDescription() {return "You can only buy 10 Enhancers & Extra Time Capsules (total), Enhancer/Extra Time Capsule automation is disabled, and Point generation is brought to the "+format(tmp.h.pointRoot31)+"th root<br>Completions: "+challengeCompletions("h", 31)+"/"+this.completionLimit()},
				unlocked() { return hasChallenge("h", 22) },
				goal() { 
					let comps = challengeCompletions("h", 31);
					if (comps>=20) comps = Math.pow(comps-19, 1.95)+19;
					return Decimal.pow("1e50", Decimal.pow(comps, 2.5)).times("1e5325") 
				},
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription() { return "<b>Timeless</b> completions boost Super Generator Power gain based on your time "+(hasUpgrade("ss", 33)?"playing this game.":"in this Row 4 reset.") },
				rewardEffect() { return Decimal.div(9, Decimal.add((hasUpgrade("ss", 33)?(player.timePlayed||0):player.q.time), 1).cbrt().pow(hasUpgrade("ss", 23)?(-1):1)).plus(1).pow(challengeCompletions("h", 31)) },
				rewardDisplay() { return format(this.rewardEffect())+"x" },
				formula() { return "(9"+(hasUpgrade("ss", 23)?"*":"/")+"cbrt(time+1)+1)^completions" },
			},
			32: {
				name: "Option D",
				completionLimit: 10,
				challengeDescription() { return 'All previous challenges are applied at once ("Timeless" is applied at difficulty level '+(challengeCompletions("h", 32)*2+1)+')<br>Completions: '+challengeCompletions("h", 32)+'/'+this.completionLimit },
				goal() {
					let comps = challengeCompletions("h", 32);
					if (comps>=3) comps = comps-0.96;
					if (comps>=3.04) comps *= 1.425;
					return Decimal.pow("1e1000", Decimal.pow(comps, 3)).times("1e9000");
				},
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "<b>Option D</b> completions multiply the Time Energy gain base.",
				rewardEffect() { return softcap("option_d", Decimal.pow(100, Decimal.pow(challengeCompletions("h", 32), 2))) },
				rewardDisplay() { return format(tmp.h.challenges[32].rewardEffect)+"x" },
				formula: "100^(completions^2)",
				unlocked() { return tmp.ps.buyables[11].effects.hindr },
				countsAs: [11,12,21,22,31],
				onStart(testInput=false) { 
					if (testInput) {
						if (!hasAchievement("a", 81)) {
							player.p.upgrades = []; 
							player.b.upgrades = [];
						}
						resetBuyables("s");
						player.s.spent = new Decimal(0);
					}
				},
			},
			41: {
				name: "Central Madness",
				completionLimit: 1,
				challengeDescription: "Perform a Row 5 reset, Positivity & Negativity are reset, and Positivity & Negativity nerfs are extremely stronger.",
				goal: new Decimal("1e765000"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "Unlock 3 new Balance Upgrades.",
				unlocked() { return (tmp.ps.buyables[11].effects.hindr||0)>=2 },
				onStart(testInput=false) {
					if (testInput) {
						doReset("ps", true);
						player.h.activeChallenge = 41;
						player.ba.pos = new Decimal(0);
						player.ba.neg = new Decimal(0);
						updateTemp();
						updateTemp();
						updateTemp();
					}
				},
			},
			42: {
				name: "Productionless",
				completionLimit: 1,
				challengeDescription: "Perform a Row 5 reset, you are trapped in <b>Descension</b>, and all row 2-4 static layers have much harsher cost scalings.",
				goal: new Decimal("1e19000"),
				currencyDisplayName: "points",
				currencyInternalName: "points",
				rewardDescription: "The Quirk Layer cost base is decreased by 0.15, and unlock 2 new Subspace Upgrades.",
				unlocked() { return (tmp.ps.buyables[11].effects.hindr||0)>=3 },
				countsAs: [22],
				onStart(testInput=false) {
					if (testInput) {
						doReset("ps", true);
						player.h.activeChallenge = 42;
						updateTemp();
						updateTemp();
						updateTemp();
					}
				},
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
			auto: false,
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
			if (player.m.unlocked) mult = mult.times(tmp.m.hexEff);
			if (hasUpgrade("ba", 22)) mult = mult.times(tmp.ba.negBuff);
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
			let keep = [];
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			if (hasMilestone("ba", 0)) keep.push("upgrades");
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.e.unlocked},
        branches: ["e"],
		enGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("q", 11)) mult = mult.times(upgradeEffect("q", 11));
			if (hasUpgrade("q", 21)) mult = mult.times(upgradeEffect("q", 21));
			if (player.o.unlocked) mult = mult.times(buyableEffect("o", 12));
			if (player.ba.unlocked) mult = mult.times(tmp.ba.negBuff);
			return mult;
		},
		enGainExp() {
			let exp = player.q.buyables[11].plus(tmp.q.freeLayers).sub(1);
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
			if (hasMilestone("ba", 1) && player.q.auto) layers.q.buyables[11].buyMax();
		},
		passiveGeneration() { return hasMilestone("ba", 0)?1:0 },
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
						function() {return 'You have ' + formatWhole(player.q.energy)+' Quirk Energy ('+(tmp.nerdMode?('Base Gain: (timeInRun^(quirkLayers-1))'):'generated by Quirk Layers')+'), which multiplies Point and Generator Power gain by ' + format(tmp.q.enEff)+(tmp.nerdMode?(" ((x+1)^"+format(hasUpgrade("q", 23)?6:2)+"*"+format(improvementEffect("q", 23))+")"):"")},
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
						function() {return 'You have ' + formatWhole(player.q.energy)+' Quirk Energy ('+(tmp.nerdMode?('Base Gain: (timeInRun^(quirkLayers-1))'):'generated by Quirk Layers')+'), which has provided the below Quirk Improvements (next at '+format(tmp.q.impr.overallNextImpr)+')'},
							{}],
					"blank",
					"improvements"],
			},
		},
		freeLayers() {
			let l = new Decimal(0);
			if (player.m.unlocked) l = l.plus(tmp.m.buyables[13].effect);
			if (tmp.q.impr[43].unlocked) l = l.plus(improvementEffect("q", 43));
			return l;
		},
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Quirk Layers",
				costBase() {
					let base = new Decimal(2);
					if (hasUpgrade("q", 43)) base = base.sub(.25);
					if (hasChallenge("h", 42)) base = base.sub(.15);
					return base;
				},
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					let base = this.costBase();
                    let cost = Decimal.pow(base, Decimal.pow(base, x).sub(1));
                    return cost.floor()
                },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = (tmp.nerdMode?("Cost Formula: "+format(data.costBase)+"^("+format(data.costBase)+"^x-1)"):("Cost: " + formatWhole(data.cost) + " Quirks")+"\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+(tmp.q.freeLayers?(tmp.q.freeLayers.gt(0)?(" + "+format(tmp.q.freeLayers)):""):""))
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
                buyMax() {
					if (!this.unlocked || !this.canAfford()) return;
					let base = this.costBase();
					let target = player.q.points.max(1).log(base).plus(1).log(base);
					target = target.plus(1).floor();
					player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target);
				},
                style: {'height':'222px'},
				autoed() { return hasMilestone("ba", 1) && player.q.auto },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Quirks",
				done() { return player.q.total.gte(2) || hasAchievement("a", 71) },
				effectDescription: "Keep Booster, Generator, Space, & Time milestones on all resets.",
			},
			1: {
				requirementDescription: "3 Total Quirks",
				done() { return player.q.total.gte(3) || hasAchievement("a", 71) },
				effectDescription: "You can buy max Time & Space, gain 100% of Enhance Point gain every second, and unlock Auto-Enhancers & Auto-Extra Time Capsules.",
				toggles: [["e", "auto"], ["t", "autoExt"]],
			},
			2: {
				requirementDescription: "4 Total Quirks",
				done() { return player.q.total.gte(4) || hasAchievement("a", 71) },
				effectDescription: "Keep Time, Enhance, & Space Upgrades on all resets, and keep Space Buildings on Quirk/Hindrance resets.",
			},
			3: {
				requirementDescription: "6 Total Quirks",
				done() { return player.q.total.gte(6) || hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Time Capsules & Auto-Space Energy.",
				toggles: [["t", "auto"], ["s", "auto"]],
			},
			4: {
				requirementDescription: "10 Total Quirks",
				done() { return player.q.total.gte(10) || hasAchievement("a", 71) },
				effectDescription: "Unlock Hindrances & Auto-Super Boosters.",
				toggles: [["sb", "auto"]],
			},
			5: {
				requirementDescription: "25 Total Quirks",
				done() { return player.q.total.gte(25) || hasAchievement("a", 71) },
				effectDescription: "Time, Space, & Super-Boosters reset nothing, and you can destroy individual Space Buildings.",
			},
			6: {
				unlocked() { return player.sg.unlocked },
				requirementDescription: "1e22 Total Quirks",
				done() { return player.q.total.gte(1e22) || hasAchievement("a", 71) },
				effectDescription: "Unlock Auto-Super Generators & Super-Generators reset nothing.",
				toggles: [["sg", "auto"]],
			},
			7: {
				unlocked() { return player.sg.unlocked },
				requirementDescription: "1e60 Total Quirks",
				done() { return player.q.total.gte(1e60) || hasAchievement("a", 71) },
				effectDescription: "You can buy max Super Boosters & Super Generators, and unlock Auto-Space Buildings.",
				toggles: [["s", "autoBld"]],
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
				effectDisplay() { return format(tmp.q.upgrades[11].effect)+"x" },
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
				effectDisplay() { return format(tmp.q.upgrades[12].effect)+"x" },
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
				effect() { 
					let q = player.q.points;
					let h = player.h.points;
					h = softcap("q14_h", h);
					q = softcap("q14_q", q);
					return {
						h: q.plus(1).cbrt().pow(improvementEffect("q", 13)),
						q: h.plus(1).root(4).pow(improvementEffect("q", 13)),
					};
				},
				effectDisplay() { return "H: "+format(tmp.q.upgrades[14].effect.h)+"x, Q: "+format(tmp.q.upgrades[14].effect.q)+"x" },
				formula() { return "H: "+(player.q.points.gte("1e1100")?"log(cbrt(Q+1))^366.67":"cbrt(Q+1)")+", Q: "+(player.h.points.gte("1e1000")?"log(H+1)^83.33":"(H+1)^0.25") },
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
				effectDisplay() { return format(tmp.q.upgrades[21].effect)+"x" },
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
				effectDisplay() { return "+"+formatWhole(tmp.q.upgrades[22].effect) },
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
				effectDisplay() { return "+"+format(tmp.q.upgrades[31].effect) },
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
				effectDisplay() { return format(tmp.q.upgrades[34].effect)+"x" },
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
			baseReq() { 
				let req = new Decimal(1e128);
				if (player.ps.unlocked) req = req.div(tmp.ps.soulEff);
				return req;
			},
			amount() { 
				let amt = player.q.energy.div(this.baseReq()).plus(1).log10().div(2).sqrt();
				if (amt.gte(270)) amt = amt.log10().times(270/Math.log10(270));
				return amt.floor();
			},
			overallNextImpr() { 
				let impr = tmp.q.impr.amount.plus(1);
				if (impr.gte(270)) impr = Decimal.pow(10, impr.div(270/Math.log10(270)));
				return Decimal.pow(10, impr.pow(2).times(2)).sub(1).times(this.baseReq()) 
			},
			nextAt(id=11) { 
				let impr = getImprovements("q", id).times(tmp.q.impr.activeRows*tmp.q.impr.activeCols).add(tmp.q.impr[id].num);
				if (impr.gte(270)) impr = Decimal.pow(10, impr.div(270/Math.log10(270)));
				return Decimal.pow(10, impr.pow(2).times(2)).sub(1).times(this.baseReq());
			},
			resName: "quirk energy",
			rows: 4,
			cols: 3,
			activeRows: 3,
			activeCols: 3,
			11: {
				num: 1,
				title: "Central Improvement",
				description: "<b>Quirk Central</b> is stronger.",
				unlocked() { return hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.1, getImprovements("q", 11)).plus(1) },
				effectDisplay() { return "^"+format(tmp.q.impr[11].effect) },
				formula: "1+0.1*x",
			},
			12: {
				num: 2,
				title: "Secondary Improvement",
				description: "<b>Back to Row 2</b> is stronger.",
				unlocked() { return hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.05, getImprovements("q", 12)).plus(1) },
				effectDisplay() { return format(tmp.q.impr[12].effect)+"x" },
				formula: "1+0.05*x",
			},
			13: {
				num: 3,
				title: "Level 4 Improvement",
				description: "<b>Row 4 Synergy</b> is stronger.",
				unlocked() { return hasUpgrade("q", 41) },
				effect() { return Decimal.mul(0.25, getImprovements("q", 13)).plus(1) },
				effectDisplay() { return "^"+format(tmp.q.impr[13].effect) },
				formula: "1+0.25*x",
			},
			21: {
				num: 4,
				title: "Developmental Improvement",
				description: "<b>Quirk City</b> is stronger.",
				unlocked() { return hasUpgrade("q", 42) },
				effect() { return Decimal.mul(1.5, getImprovements("q", 21)).plus(1) },
				effectDisplay() { return "^"+format(tmp.q.impr[21].effect) },
				formula: "1+1.5*x",
			},
			22: {
				num: 5,
				title: "Transfinite Improvement",
				description: "<b>Infinite Possibilities</b> is stronger.",
				unlocked() { return hasUpgrade("q", 42) },
				effect() { return Decimal.mul(0.2, getImprovements("q", 22)).plus(1) },
				effectDisplay() { return format(tmp.q.impr[22].effect)+"x" },
				formula: "1+0.2*x",
			},
			23: {
				num: 6,
				title: "Energy Improvement",
				description: "The Quirk Energy effect is stronger.",
				unlocked() { return hasUpgrade("q", 42) },
				effect() { return Decimal.pow(1e25, Decimal.pow(getImprovements("q", 23), 1.5)) },
				effectDisplay() { return format(tmp.q.impr[23].effect)+"x" },
				formula: "1e25^(x^1.5)",
			},
			31: {
				num: 7,
				title: "Scale Improvement",
				description: "<b>Scale Softening</b> is stronger.",
				unlocked() { return hasUpgrade("q", 44) },
				effect() { return Decimal.mul(0.5, getImprovements("q", 31)).plus(1) },
				effectDisplay() { return format(tmp.q.impr[31].effect)+"x" },
				formula: "1+0.5*x",
			},
			32: {
				num: 8,
				title: "Booster Improvement",
				description: "<b>Booster Madness</b> is stronger.",
				unlocked() { return hasUpgrade("q", 44) },
				effect() { return Decimal.mul(0.2, getImprovements("q", 32)).plus(1) },
				effectDisplay() { return format(tmp.q.impr[32].effect)+"x" },
				formula: "1+0.2*x",
			},
			33: {
				num: 9,
				title: "Quirk Improvement",
				description: "Quirk gain is stronger.",
				unlocked() { return hasUpgrade("q", 44) },
				effect() { return Decimal.pow(1e8, Decimal.pow(getImprovements("q", 33), 1.2)) },
				effectDisplay() { return format(tmp.q.impr[33].effect)+"x" },
				formula: "1e8^(x^1.2)",
			},
			41: {
				num: 271,
				title: "Solar Improvement",
				description: "Solar Energy gain is stronger.",
				unlocked() { return (tmp.ps.buyables[11].effects.quirkImpr||0)>=1 },
				effect() { return Decimal.pow("1e400", Decimal.pow(getImprovements("q", 41), 0.9)) },
				effectDisplay() { return format(tmp.q.impr[41].effect)+"x" },
				formula: "1e400^(x^0.9)",
			},
			42: {
				num: 540,
				title: "Subspatial Improvement",
				description: "The Subspace base is stronger.",
				unlocked() { return (tmp.ps.buyables[11].effects.quirkImpr||0)>=2 },
				effect() { return Decimal.pow(10, Decimal.pow(getImprovements("q", 42), 0.75)) },
				effectDisplay() { return format(tmp.q.impr[42].effect)+"x" },
				formula: "10^(x^0.75)",
			},
			43: {
				num: 810,
				title: "Layer Improvement",
				description: "Add free Quirk Layers.",
				unlocked() { return (tmp.ps.buyables[11].effects.quirkImpr||0)>=3 },
				effect() { return Decimal.mul(Decimal.pow(getImprovements("q", 43), 0.8), 1.25) },
				effectDisplay() { return format(tmp.q.impr[43].effect)+"x" },
				formula: "1.25*(x^0.8)",
			},
		},
})

addLayer("o", {
	name: "solarity", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "O", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			energy: new Decimal(0),
			first: 0,
        }},
		increaseUnlockOrder: ["ss"],
		roundUpCost: true,
        color: "rgb(255, 205, 0)",
		nodeStyle() {return {
			"background": (player.o.unlocked||canReset("o"))?"radial-gradient(rgb(255, 205, 0), rgb(255, 67, 0))":"#bf8f8f" ,
        }},
		componentStyles: {
			"prestige-button"() {return { "background": canReset("o")?"radial-gradient(rgb(255, 205, 0), rgb(255, 67, 0))":"#bf8f8f" }},
		},
        requires() { 
			let req = new Decimal((player[this.layer].unlockOrder>0&&!hasAchievement("a", 62))?16:14).sub(tmp.o.solEnEff);
			if (hasUpgrade("ba", 23)) req = req.div(tmp.ba.posBuff);
			return req;
		},
        resource: "solarity", // Name of prestige currency
        baseResource: "super boosters", // Name of resource prestige is based on
        baseAmount() {return player.sb.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(10), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = buyableEffect("o", 11);
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "o", description: "Press O to Solarity Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			player.q.time = new Decimal(0);
			player.q.energy = new Decimal(0);
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return (player.sb.unlocked&&player.h.unlocked)||player.m.unlocked||player.ba.unlocked },
        branches: ["sb", "t"],
		effect() { 
			let sol = player.o.points;
			sol = softcap("sol_eff", sol);
			let eff = sol.plus(1).log10().div(100).min(0.1);
			return eff;
		},
		effect2() { return player.o.points.div(1e20).plus(1).sqrt() },
		solEnGain() { 
			let gain = player.t.energy.max(1).pow(tmp.o.effect).times(tmp.o.effect2).sub(1);
			if (player.m.unlocked) gain = gain.times(tmp.m.hexEff);
			if (tmp.q.impr[41].unlocked) gain = gain.times(improvementEffect("q", 41));
			return gain;
		},
		solEnEff() { return Decimal.sub(4, Decimal.div(4, player.o.energy.plus(1).log10().plus(1))) },
		solEnEff2() { return player.o.energy.plus(1).pow(2) },
		effectDescription() { return "which are generating "+(tmp.nerdMode?("(timeEnergy^"+format(tmp.o.effect)+(tmp.o.effect.gt(1.01)?("*"+format(tmp.o.effect2)):"")+"-1)"):format(tmp.o.solEnGain))+" Solar Energy every second." },
		update(diff) {
			player.o.energy = player.o.energy.plus(tmp.o.solEnGain.times(diff));
			if (hasMilestone("m", 0)) {
				for (let i=11;i<=13;i++) if (tmp.o.buyables[i].unlocked) player.o.buyables[i] = player.o.buyables[i].plus(tmp.o.buyables[i].gain.times(diff));
				if (tmp.o.buyables[21].unlocked) player.o.buyables[21] = player.o.buyables[21].plus(tmp.o.buyables[21].gain.times(diff));
			}
		},
		passiveGeneration() { return hasMilestone("m", 0)?1:(hasMilestone("o", 0)?0.05:0) },
		solPow() {
			let pow = new Decimal(1);
			if (hasUpgrade("ss", 33)) pow = pow.plus(upgradeEffect("ss", 33));
			if (hasUpgrade("ss", 41)) pow = pow.plus(buyableEffect("o", 21));
			if (hasUpgrade("ba", 11)) pow = pow.plus(upgradeEffect("ba", 11));
			return pow;
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.o.energy) + ' Solar Energy, which is reducing the Solarity requirement by '+format(tmp.o.solEnEff)+(tmp.nerdMode?(" (4-4/(log(x+1)+1))"):"")+' and multiplies the Time Energy limit by '+format(tmp.o.solEnEff2)+'.'+(tmp.nerdMode?(" (x+1)^2"):"")},
					{}],
			"blank",
			"milestones",
			"blank",
			["display-text",
				function() { return "<b>Solar Power: "+format(tmp.o.solPow.times(100))+"%</b><br>" },
					{}],
			"buyables",
			"blank"
		],
		buyables: {
			rows: 2,
			cols: 3,
			11: {
				title: "Solar Cores",
				gain() { return player.o.points.div(2).root(1.5).floor() },
				effect() { 
					let amt = player[this.layer].buyables[this.id]
					amt = softcap("solCores", amt)
					return hasUpgrade("ss", 22)?(amt.plus(1).pow(tmp.o.solPow).cbrt()):(amt.plus(1).pow(tmp.o.solPow).log10().plus(1)) 
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
					let x = player[this.layer].buyables[this.id].gte(5e4)?"10^(sqrt(log(x)*log(5e4)))":"x"
                    let display = ("Sacrifice all of your Solarity for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Solar Cores\n"+
					"Req: 2 Solarity\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id]))+"\n"+
					(tmp.nerdMode?("Formula: "+(hasUpgrade("ss", 22)?"cbrt("+x+"+1)":"log("+x+"+1)+1")+""):("Effect: Multiplies Solarity gain by "+format(tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() { return player.o.points.gte(2) },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px'},
				autoed() { return hasMilestone("m", 0) },
			},
			12: {
				title: "Tachoclinal Plasma",
				gain() { return player.o.points.div(100).times(player.o.energy.div(2500)).root(3.5).floor() },
				effect() { return hasUpgrade("p", 24)?Decimal.pow(10, player[this.layer].buyables[this.id].plus(1).log10().cbrt()):(player[this.layer].buyables[this.id].plus(1).pow(tmp.o.solPow).log10().plus(1).log10().times(10).plus(1)) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity & Solar Energy for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Tachoclinal Plasma\n"+
					"Req: 100 Solarity & 2,500 Solar Energy\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id]))+"\n"+
					(tmp.nerdMode?("Formula: "+(hasUpgrade("p", 24)?"10^cbrt(log(x+1))":"log(log(x+1)+1)*10+1")):("Effect: Multiplies the Super Booster base and each Quirk Layer by "+format(tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() { return player.o.points.gte(100)&&player.o.energy.gte(2500) },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			13: {
				title: "Convectional Energy",
				gain() { return player.o.points.div(1e3).times(player.o.energy.div(2e5)).times(player.ss.subspace.div(10)).root(6.5).floor() },
				effect() { return player[this.layer].buyables[this.id].plus(1).pow(tmp.o.solPow).log10().plus(1).pow(2.5) },
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity, Solar Energy, & Subspace for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Convectional Energy\n"+
					"Req: 1,000 Solarity, 200,000 Solar Energy, & 10 Subspace\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id]))+"\n"+
					(tmp.nerdMode?("Formula: (log(x+1)+1)^2.5"):("Effect: Multiplies the Time Capsule base and Subspace gain by "+format(tmp[this.layer].buyables[this.id].effect)))
					return display;
                },
                unlocked() { return player[this.layer].unlocked&&player.ss.unlocked }, 
                canAfford() { return player.o.points.gte(1e3)&&player.o.energy.gte(2e5)&&player.ss.subspace.gte(10) },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.ss.subspace = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
			21: {
				title: "Coronal Waves",
				gain() { return player.o.points.div(1e5).root(5).times(player.o.energy.div(1e30).root(30)).times(player.ss.subspace.div(1e8).root(8)).times(player.q.energy.div("1e675").root(675)).floor() },
				effect() { 
					let eff = player[this.layer].buyables[this.id].plus(1).pow(tmp.o.solPow).log10().plus(1).log10();
					eff = softcap("corona", eff);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ("Sacrifice all of your Solarity, Solar Energy, Subspace, & Quirk Energy for "+formatWhole(tmp[this.layer].buyables[this.id].gain)+" Coronal Waves\n"+
					"Req: 100,000 Solarity, 1e30 Solar Energy, 500,000,000 Subspace, & 1e675 Quirk Energy\n"+
					"Amount: " + formatWhole(player[this.layer].buyables[this.id]))+"\n"+
					(tmp.nerdMode?("Formula: log(log(x+1)+1)"):("Effect: +"+format(tmp[this.layer].buyables[this.id].effect)+" to Subspace base & +"+format(tmp[this.layer].buyables[this.id].effect.times(100))+"% Solar Power"))
					return display;
                },
                unlocked() { return player[this.layer].unlocked&&hasUpgrade("ss", 41) }, 
                canAfford() { return player.o.points.gte(1e5)&&player.o.energy.gte(1e30)&&player.ss.subspace.gte(1e8)&&player.q.energy.gte("1e675") },
                buy() { 
                    player.o.points = new Decimal(0);
					player.o.energy = new Decimal(0);
					player.ss.subspace = new Decimal(0);
					player.q.energy = new Decimal(0);
					player.o.buyables[this.id] = player.o.buyables[this.id].plus(tmp[this.layer].buyables[this.id].gain);
                },
                buyMax() {
					// I'll do this later ehehe
				},
                style: {'height':'140px', 'width':'140px', 'font-size':'9px'},
				autoed() { return hasMilestone("m", 0) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "50,000 Total Solarity",
				done() { return player.o.total.gte(5e4) || hasAchievement("a", 71) },
				effectDescription: "Gain 5% of Solarity gain every second.",
			},
		},
})

addLayer("ss", {
        name: "subspace", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "SS", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 3, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			subspace: new Decimal(0),
			auto: false,
			first: 0,
        }},
        color: "#e8ffff",
        requires() { return new Decimal((player[this.layer].unlockOrder>0&&!hasAchievement("a", 62))?30:28) }, // Can be a function that takes requirement increases into account
		roundUpCost: true,
        resource: "subspace energy", // Name of prestige currency
        baseResource: "space energy", // Name of resource prestige is based on
        baseAmount() {return player.s.points}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.1), // Prestige currency exponent
		base: new Decimal(1.15),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return hasMilestone("hn", 3) },
		effBase() {
			let base = new Decimal(2);
			if (hasUpgrade("ss", 32)) base = base.plus(upgradeEffect("ss", 32));
			if (hasUpgrade("ss", 41)) base = base.plus(buyableEffect("o", 21));
			if (player.ba.unlocked) base = base.times(tmp.ba.posBuff);
			if (tmp.q.impr[42].unlocked) base = base.times(improvementEffect("q", 42));
			return base;
		},
		effect() { 
			let gain = Decimal.pow(tmp.ss.effBase, player.ss.points).sub(1);
			if (hasUpgrade("ss", 13)) gain = gain.times(upgradeEffect("ss", 13));
			if (player.o.unlocked) gain = gain.times(buyableEffect("o", 13));
			if (player.m.unlocked) gain = gain.times(tmp.m.hexEff);
			return gain;
		},
		autoPrestige() { return player.ss.auto && hasMilestone("ba", 2) },
		effectDescription() {
			return "which are generating "+format(tmp.ss.effect)+" Subspace/sec"+(tmp.nerdMode?("\n\("+format(tmp.ss.effBase)+"x each)"):"")
		},
		update(diff) {
			if (player.ss.unlocked) player.ss.subspace = player.ss.subspace.plus(tmp.ss.effect.times(diff));
		},
        row: 3, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "S", description: "Press Shift+S to Subspace Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("ba", 2) },
		effPow() {
			let pow = new Decimal(1);
			if (hasUpgrade("ss", 12)) pow = pow.times(upgradeEffect("ss", 12));
			if (hasUpgrade("ba", 12)) pow = pow.times(upgradeEffect("ba", 12).plus(1));
			return pow;
		},
		eff1() { return player.ss.subspace.plus(1).pow(tmp.ss.effPow).log10().pow(3).times(100).floor() },
		eff2() { return player.ss.subspace.plus(1).pow(tmp.ss.effPow).log10().plus(1).log10().div(6) },
		eff3() { return player.ss.subspace.plus(1).pow(tmp.ss.effPow).pow(1e3) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text",
				function() {return 'You have ' + format(player.ss.subspace) + ' Subspace, which is providing '+formatWhole(tmp.ss.eff1)+' extra Space'+(tmp.nerdMode?(" ((log(x+1)^3)*"+format(tmp.ss.effPow.pow(3).times(100))+")"):"")+', makes Space Buildings '+format(tmp.ss.eff2.times(100))+'% stronger'+(tmp.nerdMode?(" (log(log(x+1)*"+format(tmp.ss.effPow)+"+1)/6)"):"")+', and cheapens Space Buildings by '+format(tmp.ss.eff3)+'x.'+(tmp.nerdMode?(" ((x+1)^"+format(tmp.ss.effPow.times(1e3))+")"):"")},
					{}],
			"blank",
			"upgrades",
		],
        increaseUnlockOrder: ["o"],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("ba", 2)) keep.push("upgrades");
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return (player.s.unlocked&&player.h.unlocked)||player.m.unlocked||player.ba.unlocked},
        branches: ["s"],
		upgrades: {
			rows: 4,
			cols: 3,
			11: {
				title: "Spatial Awakening",
				description: "The Space Energy cost base is reduced (1e15 -> 1e10).",
				cost: new Decimal(180),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return player.ss.unlocked },
			},
			12: {
				title: "Subspatial Awakening",
				description: "Subspace Energy boosts all Subspace effects.",
				cost: new Decimal(2),
				unlocked() { return hasUpgrade("ss", 11) },
				effect() { return player.ss.points.div(2.5).plus(1).sqrt() },
				effectDisplay() { return format(tmp.ss.upgrades[12].effect.sub(1).times(100))+"% stronger" },
				formula: "sqrt(x/2.5)*100",
			},
			13: {
				title: "Emissary of Smash",
				description: "Quirks boost Subspace gain.",
				cost: new Decimal(1e3),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 11) },
				effect() { return player.q.points.plus(1).log10().div(10).plus(1) },
				effectDisplay() { return format(tmp.ss.upgrades[13].effect)+"x" },
				formula: "log(x+1)/10+1",
			},
			21: {
				title: "Illegal Upgrade",
				description: "Super Boosters & Super Generators are 20% cheaper.",
				cost: new Decimal(1e4),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 13) },
			},
			22: {
				title: "Underneath The Sun",
				description: "<b>Solar Cores</b> use a better effect formula.",
				cost: new Decimal(4e5),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 21)&&player.o.unlocked },
			},
			23: {
				title: "Anti-Timeless",
				description: "<b>Timeless</b>'s effect increases over time instead of decreasing.",
				cost: new Decimal(1e6),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 21)&&player.o.unlocked },
			},
			31: {
				title: "No More Progress",
				description: "Unspent Space provides free Space Buildings.",
				cost: new Decimal(42),
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return hasUpgrade("ss", 22)||hasUpgrade("ss", 23) },
				effect() { return tmp.s.space.plus(1).cbrt().sub(1).floor() },
				effectDisplay() { return "+"+formatWhole(tmp.ss.upgrades[31].effect) },
				formula: "cbrt(x+1)-1",
			},
			32: {
				title: "Beyond Infinity",
				description: "Add to the Subspace Energy & Super-Generator bases based on your Quirk Layers.",
				cost: new Decimal(43),
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return hasUpgrade("ss", 31) },
				effect() { return player.q.buyables[11].sqrt().div(1.25) },
				effectDisplay() { return "+"+format(tmp.ss.upgrades[32].effect) },
				formula: "sqrt(x)/1.25",
			},
			33: {
				title: "Timeless Solarity",
				description: "<b>Timeless</b>'s effect is now based on your total time playing this game, and Solar Cores boost Solar Power.",
				cost: new Decimal(2.5e7),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasUpgrade("ss", 23)&&hasUpgrade("ss", 31) },
				effect() { return player.o.buyables[11].plus(1).log10().div(10) },
				effectDisplay() { return "+"+format(tmp.ss.upgrades[33].effect.times(100))+"%" },
				formula: "log(x+1)*10",
			},
			41: {
				title: "More Sun",
				description: "Unlock Coronal Waves.",
				cost: new Decimal(46),
				currencyDisplayName: "space energy",
				currencyInternalName: "points",
				currencyLayer: "s",
				unlocked() { return hasUpgrade("ss", 33) },
			},
			42: {
				title: "Sub-Subspace",
				description: "Space Buildings are 100% stronger (additive).",
				cost: new Decimal("1e936"),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasChallenge("h", 42) },
			},
			43: {
				title: "Challenging Speedup",
				description: "When below e1,000,000, Point gain is raised to the power of 1.1. Otherwise, it is raised to the power of 1.01.",
				cost: new Decimal("1e990"),
				currencyDisplayName: "subspace",
				currencyInternalName: "subspace",
				currencyLayer: "ss",
				unlocked() { return hasChallenge("h", 42) },
			},
		},
})

addLayer("m", {
		name: "magic", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "M", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			spellTimes: {
				11: new Decimal(0),
				12: new Decimal(0),
				13: new Decimal(0),
			},
			spellInputs: {
				11: new Decimal(1),
				12: new Decimal(1),
				13: new Decimal(1),
			},
			spellInput: "1",
			distrAll: false,
			hexes: new Decimal(0),
			auto: false,
			first: 0,
        }},
        color: "#eb34c0",
        requires: new Decimal(1e285), // Can be a function that takes requirement increases into account
        resource: "magic", // Name of prestige currency
        baseResource: "hindrance spirit", // Name of resource prestige is based on
        baseAmount() {return player.h.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(0.007), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (hasAchievement("a", 74)) mult = mult.times(challengeEffect("h", 32));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "m", description: "Press M to Magic Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (hasMilestone("hn", 0)) keep.push("milestones")
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		passiveGeneration() { return hasMilestone("hn", 1)?1:0 },
        layerShown(){return player.h.unlocked&&player.o.unlocked },
        branches: ["o","h","q"],
		spellTime() { 
			let time = new Decimal(60);
			if (hasMilestone("m", 3)) time = time.times(tmp.m.spellInputAmt.div(100).plus(1).log10().plus(1));
			return time;
		},
		spellPower() { return new Decimal(1) },
		hexGain() { return new Decimal(1) },
		hexEff() { return softcap("hex", player.m.hexes.times(2).plus(1).pow(10)) },
		update(diff) {
			if (!player.m.unlocked) return;
			if (player.m.auto && hasMilestone("hn", 2) && player.m.distrAll) layers.m.castAllSpells(true, diff);
			for (let i=11;i<=13;i++) {
				if (player.m.auto && hasMilestone("hn", 2) && !player.m.distrAll) {
					player.m.spellInputs[i] = (player.m.spellTimes[i].gt(0)?player.m.spellInputs[i].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.hexes = player.m.hexes.plus(tmp.m.hexGain.times(player.m.spellInputs[i]).times(diff));
					player.m.spellTimes[i] = tmp.m.spellTime;
				} else if (player.m.spellTimes[i].gt(0)) player.m.spellTimes[i] = player.m.spellTimes[i].sub(diff).max(0);
			}
		},
		spellInputAmt() {
			if (hasMilestone("m", 3) && player.m.spellInput!="1") {
				let factor = new Decimal(player.m.spellInput.split("%")[0]).div(100);
				return player.m.points.times(factor.max(0.01)).floor().max(1);
			} else return new Decimal(1);
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			"milestones",
			"blank",
			"buyables",
			["display-text",
				function() {return "You have "+formatWhole(player.m.hexes)+" Hexes, which are multiplying Hindrance Spirit, Quirk, Solar Energy, & Subspace gain by "+format(tmp.m.hexEff)+(tmp.nerdMode?" (2*x+1)^5":"") },
					{}],
		],
		spellsUnlocked() { return 3 },
		castAllSpells(noSpend=false, diff=1) {
			let cost = tmp.m.spellInputAmt;
			let input = tmp.m.spellInputAmt.div(tmp.m.spellsUnlocked);
			for (let i=11;i<=(10+tmp.m.spellsUnlocked);i++) {
				player.m.spellInputs[i] = (player.m.spellTimes[i].gt(0)?player.m.spellInputs[i].max(input):input);
				player.m.spellTimes[i] = tmp.m.spellTime;
			}
			if (!noSpend) player.m.points = player.m.points.sub(cost)
            player.m.hexes = player.m.hexes.plus(tmp.m.hexGain.times(cost).times(diff))
		},
		buyables: {
			rows: 1,
			cols: 3,
			11: {
				title: "Booster Launch",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
					return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.div(2).plus(1)
					if (hasUpgrade("ba", 31)) eff = Decimal.pow(1.1, power).times(eff);
					eff = softcap("spell1", eff);
					return eff.div(1.5).max(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Booster base ^1.05, x" + format(data.effect)+"\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: ((log(inserted+1)+1)/2+1)/1.5"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(tmp.m.hexGain.times(cost))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			12: {
				title: "Time Warp",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                  return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.div(5).plus(1)
					if (hasUpgrade("ba", 31)) eff = Decimal.pow(1.1, power).times(eff);
					eff = softcap("spell2", eff);
					return eff.div(1.2).max(1);
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: Time Capsule base ^1.1, x" + format(data.effect)+"\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: ((log(inserted+1)+1)/5+1)/1.2"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(tmp.m.hexGain.times(cost))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
			13: {
				title: "Quirk Amplification",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                   return tmp.m.spellInputAmt;
                },
				effect() {
					let power = tmp.m.spellPower.times(player.m.spellInputs[this.id].max(1).log10().plus(1));
					if (player.m.spellTimes[this.id].eq(0)) power = new Decimal(0);
					let eff = power.times(1.25)
					eff = softcap("spell3", eff);
					return eff;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = "Effect: +" + format(data.effect)+" Free Quirk Layers\n\
					Time: "+formatTime(player.m.spellTimes[this.id]||0);
					if (hasMilestone("m", 3)) display += "\n "+(tmp.nerdMode?("Formula: (log(inserted+1)+1)*1.25"):("To Insert: "+formatWhole(tmp.m.spellInputAmt.div((player.m.distrAll && hasMilestone("m", 4))?tmp.m.spellsUnlocked:1))));
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.m.points.gte(tmp[this.layer].buyables[this.id].cost)
				},
                buy() { 
					if (player.m.distrAll && hasMilestone("m", 4)) {
						layers.m.castAllSpells();
						return;
					}
                    cost = tmp[this.layer].buyables[this.id].cost
					player.m.spellInputs[this.id] = (player.m.spellTimes[this.id].gt(0)?player.m.spellInputs[this.id].max(tmp.m.spellInputAmt):tmp.m.spellInputAmt);
                    player.m.points = player.m.points.sub(cost)
                    player.m.hexes = player.m.hexes.plus(tmp.m.hexGain.times(cost))
					player.m.spellTimes[this.id] = tmp.m.spellTime;
                },
                buyMax() {}, // You'll have to handle this yourself if you want
                style: {'height':'150px', 'width':'150px'},
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Magic",
				done() { return player.m.total.gte(2) || (hasMilestone("hn", 0)) },
				effectDescription: "Automatically gain 100% of Solarity gain & Solarity buyables every second.",
			},
			1: {
				requirementDescription: "3 Total Magic",
				done() { return player.m.total.gte(3) || (hasMilestone("hn", 0)) },
				effectDescription: 'Keep all Hindrance completions on all resets.',
				toggles: [["h", "auto"]],
			},
			2: {
				requirementDescription: "10 Total Magic",
				done() { return player.m.total.gte(10) || (hasMilestone("hn", 0)) },
				effectDescription: "Automatically gain 100% of Hindrance Spirit gain every second.",
			},
			3: {
				requirementDescription: "5,000 Total Magic",
				done() { return player.m.total.gte(5e3) || (hasMilestone("hn", 0)) },
				effectDescription: "You can insert more Magic into your Spells to make them stronger & last longer.",
				toggles: [{
					layer: "m",
					varName: "spellInput",
					options: ["1","10%","50%","100%"],
				}],
			},
			4: {
				unlocked() { return hasMilestone("m", 3) },
				requirementDescription: "1e10 Total Magic",
				done() { return player.m.total.gte(1e10) || (hasMilestone("hn", 0)) },
				effectDescription: "When casting a Spell, all Spells are casted equally (magic is distributed).",
				toggles: [["m", "distrAll"]],
			},
		},
})

addLayer("ba", {
		name: "balance", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "BA", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 2, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			allotted: 0.5,
			pos: new Decimal(0),
			neg: new Decimal(0),
			keepPosNeg: false,
			first: 0,
        }},
        color: "#fced9f",
        requires: new Decimal("1e365"), // Can be a function that takes requirement increases into account
        resource: "balance energy", // Name of prestige currency
        baseResource: "quirks", // Name of resource prestige is based on
        baseAmount() {return player.q.points}, // Get the current amount of baseResource
        type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(0.005), // Prestige currency exponent
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1);
			if (hasAchievement("a", 74)) mult = mult.times(challengeEffect("h", 32));
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "a", description: "Press A to Balance Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (!(hasMilestone("ba", 4) && player.ba.keepPosNeg)) {
				player.ba.pos = new Decimal(0);
				player.ba.neg = new Decimal(0);
			}
			if (hasMilestone("hn", 0)) keep.push("milestones")
			if (hasMilestone("hn", 3)) keep.push("upgrades")
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.q.unlocked&&player.ss.unlocked },
        branches: ["q","ss"],
		update(diff) {
			if (!player.ba.unlocked) return;
			player.ba.pos = player.ba.pos.plus(tmp.ba.posGain.times(diff));
			player.ba.neg = player.ba.neg.plus(tmp.ba.negGain.times(diff));
		},
		passiveGeneration() { return hasMilestone("hn", 1)?1:0 },
		dirBase() { return player.ba.points.times(10) },
		posGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("ba", 24)) mult = mult.times(upgradeEffect("ba", 24).pos);
			return mult;
		},
		posGain() { return Decimal.pow(tmp.ba.dirBase, hasMilestone("hn", 2)?1:player.ba.allotted).times(hasMilestone("hn", 2)?1:(player.ba.allotted)).times(tmp.ba.posGainMult) },
		posBuff() { 
			let eff = player.ba.pos.plus(1).log10().plus(1).div(tmp.ba.negNerf); 
			eff = softcap("posBuff", eff);
			return eff;
		},
		posNerf() { return player.ba.pos.plus(1).sqrt().pow(inChallenge("h", 41)?100:1) },
		negGainMult() {
			let mult = new Decimal(1);
			if (hasUpgrade("ba", 24)) mult = mult.times(upgradeEffect("ba", 24).neg);
			return mult;
		},
		negGain() { return Decimal.pow(tmp.ba.dirBase, hasMilestone("hn", 2)?1:(1-player.ba.allotted)).times(hasMilestone("hn", 2)?1:(1-player.ba.allotted)).times(tmp.ba.negGainMult) },
		negBuff() { 
			let eff = player.ba.neg.plus(1).pow((hasUpgrade("ba", 13))?10:1).div(tmp.ba.posNerf);
			eff = softcap("negBuff", eff);
			return eff;
		},
		negNerf() { return player.ba.neg.plus(1).log10().plus(1).sqrt().pow(inChallenge("h", 41)?100:1).div(hasUpgrade("ba", 14)?2:1).max(1) },
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			"milestones",
			"blank",
			["clickable", 31],
			["row", [["clickable", 21], ["clickable", 11], "blank", ["bar", "balanceBar"], "blank", ["clickable", 12], ["clickable", 22]]],
			["row", [
				["column", [["display-text", function() {return tmp.nerdMode?("Gain Formula: "+format(tmp.ba.dirBase)+"^(1-barPercent/100)*(1-barBercent/100)"+(tmp.ba.negGainMult.eq(1)?"":("*"+format(tmp.ba.negGainMult)))):("+"+format(tmp.ba.negGain)+"/sec")}, {}], ["display-text", function() {return "Negativity: "+format(player.ba.neg)}, {}], ["display-text", function() {return (tmp.nerdMode?("Buff Formula: "+((hasUpgrade("ba", 13))?"(x+1)^10":"x+1")):("Buff: Multiply each Quirk Layer by "+format(tmp.ba.negBuff)))}, {}], ["display-text", function() {return (tmp.nerdMode?("Nerf Formula: "+(hasUpgrade("ba", 14)?"sqrt(log(x+1)+1)"+(inChallenge("h", 41)?"^100":"")+"/2":"sqrt(log(x+1)+1)")):("Nerf: Divide the Positivity buff by "+format(tmp.ba.negNerf)))}, {}], "blank", ["row", [["upgrade", 11], ["upgrade", 13]]]], {"max-width": "240px"}], 
				"blank", "blank", "blank", 
				["column", 
				[["display-text", function() {return tmp.nerdMode?("Gain Formula: "+format(tmp.ba.dirBase)+"^(barPercent/100)*(barBercent/100)"+(tmp.ba.posGainMult.eq(1)?"":("*"+format(tmp.ba.posGainMult)))):("+"+format(tmp.ba.posGain)+"/sec")}, {}], ["display-text", function() {return "Positivity: "+format(player.ba.pos)}, {}], ["display-text", function() {return (tmp.nerdMode?("Buff Formula: log(x+1)+1"):("Buff: Multiply the Subspace & Time base by "+format(tmp.ba.posBuff)))}, {}], ["display-text", function() {return (tmp.nerdMode?("Nerf Formula: sqrt(x+1)"+(inChallenge("h", 41)?"^100":"")):("Nerf: Divide the Negativity buff by "+format(tmp.ba.posNerf)))}, {}], "blank", ["row", [["upgrade", 14], ["upgrade", 12]]]], {"max-width": "240px"}]], {"visibility": function() { return player.ba.unlocked?"visible":"hidden" }}],
			["row", [["upgrade", 22], ["upgrade", 21], ["upgrade", 23]]],
			["row", [["upgrade", 31], ["upgrade", 24], ["upgrade", 32]]],
			["upgrade", 33],
			"blank", "blank"
		],
		bars: {
			balanceBar: {
				direction: RIGHT,
				width: 400,
				height: 20,
				progress() { return player.ba.allotted },
				unlocked() { return player.ba.unlocked },
				fillStyle() { 
					let r = 235 + (162 - 235) * tmp.ba.bars.balanceBar.progress;
					let g = 64 + (249 - 64) * tmp.ba.bars.balanceBar.progress;
					let b = 52 + (252 - 52) * tmp.ba.bars.balanceBar.progress;
					return {"background-color": ("rgb("+r+", "+g+", "+b+")") } 
				},
				borderStyle() { return {"border-color": "#fced9f"} },
			},
		},
		clickables: {
			rows: 3,
			cols: 2,
			11: {
				title: "-",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted>0 },
				onClick() { player.ba.allotted = Math.max(player.ba.allotted-0.05, 0) },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(235, 64, 52)"},
			},
			12: {
				title: "+",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted<1 },
				onClick() { player.ba.allotted = Math.min(player.ba.allotted+0.05, 1) },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(162, 249, 252)"},
			},
			21: {
				title: "&#8592;",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted>0 },
				onClick() { player.ba.allotted = 0 },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(235, 64, 52)"},
			},
			22: {
				title: "&#8594;",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted<1 },
				onClick() { player.ba.allotted = 1 },
				style: {"height": "50px", "width": "50px", "background-color": "rgb(162, 249, 252)"},
			},
			31: {
				title: "C",
				unlocked() { return player.ba.unlocked },
				canClick() { return player.ba.allotted!=.5 },
				onClick() { player.ba.allotted = .5 },
				style: {"height": "50px", "width": "50px", "background-color": "yellow"},
			},
		},
		upgrades: {
			rows: 3,
			cols: 4,
			11: {
				title: "Negative Ion",
				description: "Negativity boosts Solar Power.",
				cost: new Decimal(5e7),
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
				effect() { 
					let ret = player.ba.neg.plus(1).log10().sqrt().div(10);
					ret = softcap("ba11", ret);
					return ret;
				},
				effectDisplay() { return "+"+format(tmp.ba.upgrades[11].effect.times(100))+"%" },
				formula: "sqrt(log(x+1))*10",
			},
			12: {
				title: "Positive Ion",
				description: "Positivity boosts Space Building Power & all Subspace effects.",
				cost: new Decimal(5e7),
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
				effect() { return softcap("ba12", player.ba.pos.plus(1).log10().cbrt().div(10)) },
				effectDisplay() { return "+"+format(tmp.ba.upgrades[12].effect.times(100))+"%" },
				formula: "cbrt(log(x+1))*10",
			},
			13: {
				title: "Negative Energy",
				description: "Raise the Negativity buff to the power of 10.",
				cost: new Decimal(25e7),
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
			},
			14: {
				title: "Positive Vibe",
				description: "Halve the Negativity nerf.",
				cost: new Decimal(25e7),
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasMilestone("ba", 3) },
			},
			21: {
				title: "Neutral Atom",
				description: "The Hindrance Spirit effect is raised to the power of 8.",
				cost: new Decimal(2.5e8),
				unlocked() { return hasUpgrade("ba", 13)&&hasUpgrade("ba", 14) },
			},
			22: {
				title: "Negative Mass",
				description: "The Negativity buff also multiplies Hindrance Spirit & Quirk gain.",
				cost: new Decimal(2.5e11),
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasUpgrade("ba", 21) },
			},
			23: {
				title: "Complete Plus",
				description: "The Positivity buff also divides the Solarity requirement.",
				cost: new Decimal(2.5e11),
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasUpgrade("ba", 21) },
			},
			24: {
				title: "Net Neutrality",
				description: "Positivity and Negativity boost each other's generation.",
				cost: new Decimal(2.5e12),
				unlocked() { return hasUpgrade("ba", 22) && hasUpgrade("ba", 23) },
				effect() { return {
					pos: player.ba.neg.div(1e12).plus(1).log10().plus(1).pow(hasUpgrade("ba", 33)?15:5),
					neg: player.ba.pos.div(1e12).plus(1).log10().plus(1).pow(hasUpgrade("ba", 33)?15:5),
				} },
				effectDisplay() { return "Pos: "+format(tmp.ba.upgrades[24].effect.pos)+"x, Neg: "+format(tmp.ba.upgrades[24].effect.neg)+"x" },
				formula() { return "Pos: (log(neg/1e12+1)+1)^"+(hasUpgrade("ba", 33)?15:5)+", Neg: (log(pos/1e12+1)+1)^"+(hasUpgrade("ba", 33)?15:5) },
			},
			31: {
				title: "Tangible Degeneration",
				description: "The first two Spells use better formulas.",
				cost: new Decimal(1e52),
				currencyDisplayName: "negativity",
				currencyInternalName: "neg",
				currencyLayer: "ba",
				unlocked() { return hasChallenge("h", 41) },
			},
			32: {
				title: "Visible Regeneration",
				description: "Positivity multiplies the Super-Generator base.",
				cost: new Decimal(1e52),
				currencyDisplayName: "positivity",
				currencyInternalName: "pos",
				currencyLayer: "ba",
				unlocked() { return hasChallenge("h", 41) },
				effect() { 
					return softcap("ba32", player.ba.pos.plus(1).log10().div(50).plus(1).pow(10));
				},
				effectDisplay() { return format(tmp.ba.upgrades[32].effect)+"x" },
				formula: "(log(x+1)/50+1)^10",
			},
			33: {
				title: "True Equality",
				description: "Both <b>Net Neutrality</b> effects are cubed.",
				cost: new Decimal(2.5e51),
				unlocked() { return hasChallenge("h", 41) },
			},
		},
		milestones: {
			0: {
				requirementDescription: "2 Total Balance Energy",
				done() { return player.ba.total.gte(2) || (hasMilestone("hn", 0)) },
				effectDescription: "Gain 100% of Quirks gained every second, and keep Quirk Upgrades on all resets.",
			},
			1: {
				requirementDescription: "3 Total Balance Energy",
				done() { return player.ba.total.gte(3) || (hasMilestone("hn", 0)) },
				effectDescription: "Unlock Auto-Quirk Layers.",
				toggles: [["q", "auto"]],
			},
			2: {
				requirementDescription: "10 Total Balance Energy",
				done() { return player.ba.total.gte(10) || (hasMilestone("hn", 0)) },
				effectDescription: "Keep Subspace Upgrades on all resets, unlock Auto-Subspace Energy, and Subspace Energy resets nothing.",
				toggles: [["ss", "auto"]],
			},
			3: {
				unlocked() { return hasMilestone("ba", 2) },
				requirementDescription: "200,000 Total Balance Energy",
				done() { return player.ba.total.gte(2e5) || (hasMilestone("hn", 0)) },
				effectDescription: "Unlock Balance Upgrades.",
			},
			4: {
				unlocked() { return hasMilestone("ba", 3) },
				requirementDescription: "1e12 Total Balance Energy",
				done() { return player.ba.total.gte(1e12) || (hasMilestone("hn", 0)) },
				effectDescription: "You can keep Positivity & Negativity on reset.",
				toggles: [["ba", "keepPosNeg"]],
			},
		},
})

addLayer("ps", {
		name: "phantom souls", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "PS", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			prevH: new Decimal(0),
			souls: new Decimal(0),
			auto: false,
			autoW: false,
			first: 0,
        }},
        color: "#b38fbf",
        requires() { return new Decimal("1e16000") }, // Can be a function that takes requirement increases into account
        resource: "phantom souls", // Name of prestige currency
        baseResource: "quirk energy", // Name of resource prestige is based on
        baseAmount() {return player.q.energy}, // Get the current amount of baseResource
        type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
        exponent: new Decimal(1.5), // Prestige currency exponent
		base: new Decimal("1e8000"),
        gainMult() { // Calculate the multiplier for main currency from bonuses
            mult = new Decimal(1)
            return mult
        },
        gainExp() { // Calculate the exponent on main currency from bonuses
            return new Decimal(1)
        },
		canBuyMax() { return false },
        row: 4, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "P", description: "Press Shift+P to Phantom Soul Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
		resetsNothing() { return hasMilestone("hn", 6) },
        doReset(resettingLayer){ 
			let keep = [];
			player.ps.souls = new Decimal(0);
            if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
		update(diff) {
			if (hasMilestone("hn", 5)) {
				if (player.ps.autoW) layers.ps.buyables[11].buyMax();
				player.ps.souls = player.ps.souls.max(tmp.ps.soulGain.times(player.h.points.max(1).log10()))
			} else player.ps.souls = player.ps.souls.plus(player.h.points.max(1).log10().sub(player.ps.prevH.max(1).log10()).max(0).times(tmp.ps.soulGain));
			player.ps.prevH = new Decimal(player.h.points);
		},
		autoPrestige() { return hasMilestone("hn", 4) && player.ps.auto },
        layerShown(){return player.m.unlocked && player.ba.unlocked},
        branches: ["q", ["h", 2]],
		soulGainExp() { return 1.5 },
		soulGainMult() {
			let mult = new Decimal(1);
			if (tmp.ps.buyables[11].effects.damned) mult = mult.times(tmp.ps.buyables[11].effects.damned||1);
			return mult;
		},
		soulGain() {
			let gain = Decimal.pow(player.ps.points, layers.ps.soulGainExp()).div(10).times(layers.ps.soulGainMult());
			return gain;
		},
		gainDisplay() {
			let gain = tmp.ps.soulGain;
			let display = "";
			if (gain.eq(0)) display = "0"
			else if (gain.gte(1)) display = format(gain)+" per OoM of Hindrance Spirit"
			else display = "1 per "+format(gain.pow(-1))+" OoMs of Hindrance Spirit"
			return display;
		},
		soulEffExp() {
			let exp = new Decimal(1.5e3);
			if (tmp.ps.buyables[11].effects.damned) exp = exp.times(tmp.ps.buyables[11].effects.damned||1);
			return exp;
		},
		soulEff() {
			let eff = player.ps.souls.plus(1).pow(layers.ps.soulEffExp());
			return eff;
		},
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			"blank",
			["display-text", function() { return "You have "+formatWhole(player.ps.souls)+" Damned Souls "+(tmp.nerdMode?("(Formula: (PS^"+format(tmp.ps.soulGainExp)+")*"+format(tmp.ps.soulGainMult.div(10))+")"):("(Gain: "+tmp.ps.gainDisplay+")"))+": Divide Quirk Improvement requirements by "+format(tmp.ps.soulEff)+(tmp.nerdMode?(" (x+1)^("+formatWhole(tmp.ps.soulEffExp)+")"):"") }],
			"blank",
			"buyables",
		],
		buyables: {
			rows: 1,
			cols: 1,
			11: {
				title: "Wraiths",
				cost(x=player[this.layer].buyables[this.id]) { // cost for buying xth buyable, can be an object if there are multiple currencies
                    let cost1 = x.times(2).plus(1).floor();
					let cost2 = x.plus(1).pow(4).times(174).plus(200).floor();
                    return { phantom: cost1, damned: cost2 };
                },
				effects(adj=0) {
					let data = {};
					let x = player[this.layer].buyables[this.id].plus(adj);
					if (x.gte(1)) data.hindr = x.min(3).toNumber();
					if (x.gte(2)) data.damned = x.sub(1).times(0.5).plus(1);
					if (x.gte(4)) data.quirkImpr = x.div(2).sub(1).floor().min(3).toNumber();
					return data;
				},
				display() { // Everything else displayed in the buyable button after the title
                    let data = tmp[this.layer].buyables[this.id]
                    let display = ((tmp.nerdMode?("Cost Formula: 2*x+1 Phantom Souls, (x+1)^4*174+200 Damned Souls"):("Cost: " + formatWhole(data.cost.phantom) + " Phantom Souls, "+formatWhole(data.cost.damned)+" Damned Souls"))+"\n\
                    Amount: " + formatWhole(player[this.layer].buyables[this.id])+"\n\
					Effects: ")
					let curr = data.effects;
					let next = this.effects(1);
					if (Object.keys(next).length>0) {
						if (next.hindr) {
							display += "\n"
							if (curr.hindr) display += curr.hindr+" New Hindrance"+(curr.hindr==1?"":"s")+(curr.hindr>=3?" (MAXED)":"")
							else display += "<b>NEXT: Unlock a new Hindrance</b>"
						}
						if (next.damned) {
							display += "\n"
							if (curr.damned) display += "Multiply Damned Soul gain & effect exponent by "+format(curr.damned)+(tmp.nerdMode?" ((x-1)*0.5+1)":"");
							else display += "<b>NEXT: Multiply Damned Soul gain & effect exponent</b>"
						}
						if (next.quirkImpr) {
							display += "\n"
							if (curr.quirkImpr) display += curr.quirkImpr+" New Quirk Improvement"+(curr.quirkImpr==1?"":"s")+(curr.quirkImpr>=3?" (MAXED)":"")
							else if (next.quirkImpr>(curr.quirkImpr||0)) display += "<b>NEXT: Unlock a new Quirk Improvement</b>"
						}
					} else display += "None"
					return display;
                },
                unlocked() { return player[this.layer].unlocked }, 
                canAfford() {
                    return player.ps.points.gte(tmp[this.layer].buyables[this.id].cost.phantom)&&player.ps.souls.gte(tmp[this.layer].buyables[this.id].cost.damned)},
                buy() { 
                    cost = tmp[this.layer].buyables[this.id].cost
					if (!hasMilestone("hn", 4)) {
						player.ps.points = player.ps.points.sub(cost.phantom)
						player.ps.souls = player.ps.souls.sub(cost.damned)
					} 
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].add(1)
                },
                buyMax() {
					let target = player.ps.points.sub(1).div(2).min(player.ps.souls.sub(200).div(174).root(4).sub(1)).plus(1).floor().max(0)
                    player[this.layer].buyables[this.id] = player[this.layer].buyables[this.id].max(target)
				},
                style: {'height':'200px', 'width':'200px'},
				autoed() { return hasMilestone("hn", 5) && player.ps.autoW },
			},
		},
})

addLayer("hn", {
		name: "honour", // This is optional, only used in a few places, If absent it just uses the layer id.
        symbol: "HN", // This appears on the layer's node. Default is the id with the first letter capitalized
        position: 1, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			first: 0,
        }},
        color: "#ffbf00",
        resource: "honour", // Name of prestige currency
        type: "custom", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
		baseResource: "magic and balance energy",
		baseAmount() { return new Decimal(0) },
		req: {m: new Decimal(1e150), ba: new Decimal(1e179)},
		requires() { return this.req },
		exp: {m: new Decimal(0.025), ba: new Decimal(0.02)},
		exponent() { return this.exp },
		getResetGain() {
			let gain = player.m.points.div(tmp.hn.req.m).pow(tmp.hn.exp.m).times(player.ba.points.div(tmp.hn.req.ba).pow(tmp.hn.exp.ba));
			return gain.floor();
		},
		resetGain() { return this.getResetGain() },
		getNextAt() {
			let gain = tmp.hn.getResetGain.plus(1);
			let next = {m: gain.sqrt().root(tmp.hn.exp.m).times(tmp.hn.req.m), ba: gain.sqrt().root(tmp.hn.exp.ba).times(tmp.hn.req.ba)};
			return next;
		},
		canReset() {
			return player.m.points.gte(tmp.hn.req.m) && player.ba.points.gte(tmp.hn.req.ba) && tmp.hn.getResetGain.gt(0) 
		},
		dispGainFormula() {
			let vars = ["m", "ba"]
			let txt = "";
			for (let i=0;i<vars.length;i++) {
				let layer = vars[i];
				let start = tmp.hn.req[layer];
				let exp = tmp.hn.exp[layer];
				txt += layer.toUpperCase()+": (x / "+format(start)+")^"+format(exp)
			}
			return txt;
		},
		prestigeButtonText() {
			if (tmp.nerdMode) return "Gain Formula: "+tmp.hn.dispGainFormula;
			else return `${ player.hn.points.lt(1e3) ? (tmp.hn.resetDescription !== undefined ? tmp.hn.resetDescription : "Reset for ") : ""}+<b>${formatWhole(tmp.hn.getResetGain)}</b> ${tmp.hn.resource} ${tmp.hn.resetGain.lt(100) && player.hn.points.lt(1e3) ? `<br><br>Next at ${ ('Magic: '+format(tmp.hn.nextAt.m)+', Balance Energy: '+format(tmp.hn.nextAt.ba))}` : ""}`
		},
		prestigeNotify() {
			if (!canReset("hn")) return false;
			if (tmp.hn.getResetGain.gte(player.hn.points.times(0.6).max(1))) return true;
			else return false;
		},
		tooltip() { return formatWhole(player.hn.points)+" Honour" },
		tooltipLocked() { return "Reach "+formatWhole(tmp.hn.req.m)+" Magic & "+formatWhole(tmp.hn.req.ba)+" Balance Energy to unlock (You have "+formatWhole(player.m.points)+" Magic & "+formatWhole(player.ba.points)+" Balance Energy)" },
        row: 5, // Row the layer is in on the tree (0 is the first row)
        hotkeys: [
            {key: "H", description: "Press Shift+H to Honour Reset", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
        ],
        doReset(resettingLayer){ 
			let keep = [];
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep)
        },
        layerShown(){return player.m.unlocked&&player.ba.unlocked },
        branches: ["m","ba"],
		tabFormat: ["main-display",
			"prestige-button",
			"resource-display",
			["display-text", function() { return player.hn.unlocked?("You have "+formatWhole(player.p.points)+" Prestige Points"):"" }],
			"blank",
			"milestones",
			"blank",
			"upgrades"
		],
		milestones: {
			0: {
				requirementDescription: "1 Total Honour",
				done() { return player.hn.total.gte(1) },
				effectDescription: "Always have all Magic/Balance milestones.",
			},
			1: {
				requirementDescription: "2 Total Honour",
				done() { return player.hn.total.gte(2) },
				effectDescription: "Gain 100% of Magic & Balance Energy every second.",
			},
			2: {
				requirementDescription: "3 Total Honour",
				done() { return player.hn.total.gte(3) },
				effectDescription: "The Balance bar behaves as if it is always at the two extremes, and unlock Auto-Spells.",
				toggles: [["m", "auto"]],
			},
			3: {
				requirementDescription: "4 Total Honour",
				done() { return player.hn.total.gte(4) },
				effectDescription: "You can buy max Subspace Energy, and keep Balance Upgrades on all resets.",
			},
			4: {
				requirementDescription: "5 Total Honour",
				done() { return player.hn.total.gte(5) },
				effectDescription: "Buying Wraiths does not spend Phantom Souls or Damned Souls, and unlock Auto-Phantom Souls.",
				toggles: [["ps", "auto"]],
			},
			5: {
				requirementDescription: "6 Total Honour",
				done() { return player.hn.total.gte(6) },
				effectDescription: "Unlock Auto-Wraiths.",
				toggles: [["ps", "autoW"]],
			},
			6: {
				requirementDescription: "10 Total Honour",
				done() { return player.hn.total.gte(10) },
				effectDescription: "Phantom Souls reset nothing.",
			},
		},
		upgrades: {
			rows: 3,
			cols: 3,
			11: {
				title: "Begin Again",
				description: "You can explore further Prestige Upgrades.",
				multiRes: [
					{
						cost: new Decimal(4),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e4000000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 11) },
			},
			12: {
				title: "Honour Boost",
				description: "<b>Prestige Boost</b>'s softcap starts later based on your Total Honour.",
				multiRes: [
					{
						cost: new Decimal(1),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e1000000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 12) },
				effect() { return softcap("hn12", player.hn.total.plus(1).pow(1e4)) },
				effectDisplay() { return format(tmp.hn.upgrades[12].effect)+"x later" },
				formula: "(x+1)^1e4",
			},
			13: {
				title: "Self-Self-Synergy",
				description: "<b>Self-Synergy</b> is stronger based on its effect.",
				multiRes: [
					{
						cost: new Decimal(2),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e3900000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 13) },
				effect() { return tmp.p.upgrades[13].effect.max(1).log10().plus(1).log10().times(40).plus(1) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[13].effect) },
				formula: "log(log(x+1)+1)*40+1",
			},
			21: {
				title: "Point Efficiency",
				description: "<b>Prestige Boost</b>'s softcap is weaker based on your Hexes.",
				multiRes: [
					{
						cost: new Decimal(25),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e4700000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 21) },
				cap: new Decimal(.9),
				effect() { return player.m.hexes.plus(1).log10().plus(1).log10().times(0.15).min(this.cap) },
				effectDisplay() { return format(tmp.hn.upgrades[21].effect.times(100))+"% weaker"+(tmp.hn.upgrades[21].effect.gte(this.cap)?" (MAXED)":"") },
				formula() { return "log(log(x+1)+1)*15, maxed at "+format(this.cap.times(100))+"%" },
			},
			22: {
				title: "Superpowered Upgrades",
				description: "<b>Upgrade Power</b> is stronger based on your Damned Souls.",
				multiRes: [
					{
						cost: new Decimal(4),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e4000000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 22) },
				effect() { return Decimal.pow(10, player.ps.souls.plus(1).log10().plus(1).log10().sqrt().times(5)) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[22].effect) },
				formula: "10^(sqrt(log(log(x+1)+1))*5)",
			},
			23: {
				title: "Reversal Sensational",
				description: "<b>Reverse Prestige Boost</b> is stronger based on your Balance Energy.",
				multiRes: [
					{
						cost: new Decimal(100),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e5400000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 23) },
				effect() { return player.ba.points.plus(1).log10().plus(1).pow(.75) },
				effectDisplay() { return "^"+format(tmp.hn.upgrades[23].effect) },
				formula: "(log(x+1)+1)^0.75",
			},
			31: {
				title: "Exponential Drift",
				description: "Point gain is raised to the power of 1.05.",
				multiRes: [
					{
						cost: new Decimal(64),
					},
					{
						currencyDisplayName: "prestige points",
						currencyInternalName: "points",
						currencyLayer: "p",
						cost: new Decimal("1e5600000"),
					},
				],
				unlocked() { return player.hn.unlocked && hasUpgrade("p", 31) },
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
            rows: 8,
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
				tooltip: 'Reach e7,250 Points in "Upgrade Desert".',
			},
			53: {
				name: "Already????",
				done() { return player.sg.unlocked },
				tooltip: "Perform a Super-Generator reset. Reward: Get 2 extra Space.",
			},
			54: {
				name: "Super Layers are Pointless",
				done() { return player.sg.best.eq(0) && player.sb.best.eq(0) && player.points.gte("1e15500") },
				tooltip: "Reach 1e15,500 Points without Super-Boosters & Super-Generators.",
			},
			61: {
				name: "Quite Specific",
				done() { return player.ss.unlocked || player.o.unlocked },
				tooltip: "Perform a Solarity reset or a Subspace reset.",
			},
			62: {
				name: "Gotta Get Em All",
				done() { return player.ss.unlocked && player.o.unlocked },
				tooltip: "Perform a Solarity & Subspace reset. Reward: Both Solarity & Subspace behave as if you chose them first.",
			},
			63: {
				name: "Spaceless",
				done() { return inChallenge("h", 21) && player.g.best.eq(0) && player.points.gte("1e25000") },
				tooltip: 'Reach 1e25,000 Points in "Out of Room" without any Generators.',
			},
			64: {
				name: "Timeless^2",
				done() { return player.h.challenges[31]>=10 },
				tooltip: 'Complete "Timeless" 10 times. Reward: Always keep Row 2 & 3 Upgrades.',
			},
			71: {
				name: "Another One Bites the Rust",
				done() { return player.m.unlocked || player.ba.unlocked },
				tooltip: 'Perform a Row 5 reset. Reward: Always have all milestones of Row 2, 3, and 4, and you can complete "Timeless" 10 more times.',
			},
			72: {
				name: "Generator Slowdown",
				done() { return player.g.best.gte(1225) },
				tooltip: "Reach 1,225 Generators.",
			},
			73: {
				name: "Seems Familiar?",
				done() { return player.ps.unlocked },
				tooltip: "Unlock Phantom Souls.",
			},
			74: {
				name: "Super Balanced",
				done() { return player.ba.points.gte(1e100) },
				tooltip: 'Reach 1e100 Balance Energy. Reward: You can complete "Timeless" 10 more times, and the "Option D" effect also affects Magic & Balance Energy gain.',
			},
			81: {
				name: "Yes I Am",
				done() { return player.hn.unlocked },
				tooltip: 'Perform a Row 6 reset. Reward: "Option D" does not reset your Prestige/Booster Upgrades.',
			},
        },
		tabFormat: [
			"blank", 
			["display-text", function() { return "Achievements: "+player.a.achievements.length+"/"+(Object.keys(tmp.a.achievements).length-2) }], 
			"blank", "blank",
			"achievements",
		],
		update(diff) {	// Added this section to call adjustNotificationTime every tick, to reduce notification timers
			adjustNotificationTime(diff);
		},	
    }, 
)

addLayer("sc", {
	startData() { return {unlocked: true}},
	color: "#e6ff69",
	symbol: "SC",
	row: "side",
	layerShown() { return hasAchievement("a", 21) },
	tooltip: "Softcaps",
	tabFormat: [
		"blank", "blank", "blank",
		["raw-html", function() {
			let html = ""
			for (let id in SOFTCAPS) {
				let data = SOFTCAPS[id];
				if (data.display) if (data.display()) {
					html += "<div><h3>"+data.title+"</h3><br>"+data.info();
					html += "</div><br><br>";
				}
			}
			return html;
		}],
	],
})