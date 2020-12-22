// Delete this if you don't want a help tab :)

let help_data = {
	r1: {
		id: "r1",
		title: "Row 1",
		text: "Do resets, buy Prestige Upgrades, and let your Points grow. There really isn't much to this phase of the game.",
		unlocked() { return player.a.achievements.length>0 },
	},
	r2: {
		id: "r2",
		title: "Row 2",
		text: "Insert Row 2 advice here",
		unlocked() { return player.b.unlocked || player.g.unlocked },
	},
	r3: {
		id: "r3",
		title: "Row 3",
		text: "Insert Row 3 advice here",
		unlocked() { return player.t.unlocked || player.e.unlocked || player.s.unlocked },
	},
	qh: {
		id: "qh",
		title: "Quirks & Hindrances",
		text: "Insert Quirk/Hindrance advice here",
		unlocked() { return player.q.unlocked || player.h.unlocked },
	},
	oss: {
		id: "oss",
		title: "Solarity & Subspace",
		text: "Insert Solarity/Subspace advice here",
		unlocked() { return player.q.unlocked || player.h.unlocked },
	},
	r5: {
		id: "r5",
		title: "Row 5",
		text: "Insert Row 5 advice here",
		unlocked() { return player.m.unlocked || player.ba.unlocked },
	},
	hn: {
		id: "hn",
		title: "Honour",
		text: "Insert Honour advice here",
		unlocked() { return player.hn.unlocked },
	},
	nhs: {
		id: "nhs",
		title: "Nebula & Hyperspace",
		text: "Insert Nebula/Hyperspace advice here",
		unlocked() { return player.n.unlocked || player.hs.unlocked },
	},
	i: {
		id: "i",
		title: "Imperium",
		text: "Insert Imperium advice here",
		unlocked() { return player.i.unlocked },
	},
}