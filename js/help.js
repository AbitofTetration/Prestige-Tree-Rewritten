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
		text: "At this point, you have a choice between Boosters and Generators, but since you can eventually get both, there is no wrong decision here. Generators involve generating a resource whereas Boosters involve just a flat boost, so if you want to play more actively without waiting, Boosters are probably the choice for you.<br><br>Continue to purchase Booster & Generator Upgrades (stockpile Points beforehand to make buying them back easier), and try to strive for the milestones as much as you can, as they will make the runs more automated and faster. <br><br>Once you unlock both Boosters and Generators, it's smooth sailing to complete this phase of the game, just keep buying upgrades, getting milestones, and getting Boosters & Generators.",
		unlocked() { return player.b.unlocked || player.g.unlocked },
	},
	r3: {
		id: "r3",
		title: "Row 3",
		text: "You have a choice between Time, Enhance, and Space here, and you will be able to unlock them in any order you choose. All combinations are viable, but some are faster than others. Enhance will tend to be the fastest to get milestones, since it is more Point-based, and its milestones involve both Boosters & Generators, so it may be beneficial to go there first.<br><br>Time & Space on the other hand fully automate  Boosters & Generators respectively, so if you're finding Generators more tedious to purchase on every reset than Boosters, maybe go with Space before Time. When it comes to Space specifically, Space Buildings should be purchased where the later buildings are given more priority (prioritize Tertiary Buildings over Secondary Buildings, and those over Primary Buildings).<br><br>Once all three layers are unlocked, just continue to manage all three of them, purchase Upgrades, and strive to unlock Super-Boosters and eventually Super-Generators, which power up Boosters & Generators respectively. From here it's just a push to complete this phase of the game.",
		unlocked() { return player.t.unlocked || player.e.unlocked || player.s.unlocked || player.sb.unlocked || player.sg.unlocked },
	},
	qh: {
		id: "qh",
		title: "Quirks & Hindrances",
		text: "Once you unlock Quirks, just try to get as many Total Quirks as possible, getting Quirk Layers whenever possible (which generate Quirk Energy), and strive for the milestones to make runs faster and more automated, until you can unlock Hindrances. Make sure to get plenty of Hindrance Spirit before even trying the first Hindrance, since its effect is quite useful for the challenge.<br><br>The first Hindrance (Upgrade Desert) can be completed by choosing your Prestige/Booster Upgrades very carefully. For Prestige Upgrades, purchase upgrades 1, 2, 3, and 6, whereas for Booster Upgrades, purchase Upgrades 1, 2, & 4. This should push you through the challenge fairly easily. If you are unable to complete a Hindrance in a reasonable amount of time, you can always exit, push Quirks and Hindrance Spirit a little more, and come back later, as there is no penalty for doing so.<br><br>This will unlock Quirk Upgrades, which increase in cost over time, but the costs reset on a Row 4 reset. This means that you should be striving for more Quirk Layers, and keep an eye on the upgrades for the first 10-20 seconds after a Row 4 reset to see if you can afford any of them during that time.<br><br>Once you've purchased the first few Quirk Upgrades, try out the second Hindrance (Speed Demon) which can be completed with little strategy. If it is not completable within a reasonable amount of time, leave the challenge, grind more Quirks, Hindrance Spirit, Quirk Layers, and Quirk Upgrades and try again until it is possible. This rule will work for most of the following Hindrances, so a good rule of thumb to keep in mind.<br><br>Once you purchase the sixth Quirk Upgrade (Infinite Possibilities), you can most likely beat the third Hindrance (Out of Room) which can be beaten by prioritizing the later Space Buildings as you normally do. Once you purchase the eighth Quirk Upgrade (Exponential Madness), you can most likely beat the fourth Hindrance (Descension), which can be beaten by respeccing Space Buildings before starting the challenge and putting them all into Primary Space Buildings.<br><br>Continue to push as much as you can once you complete the first four Hindrances, and begin to complete the first repeatable Hindrance (Timeless) as many times as you can (purchase all Extra Time Capsules).<br><br>Eventually, you will unlock Quirk Improvements, which will boost various aspects of the game as you get more Quirk Energy. Grind through the last three Quirk Upgrades, continue to get more Timeless completions, and keep going until you can unlock either Solarity or Subspace.",
		unlocked() { return player.q.unlocked || player.h.unlocked },
	},
	oss: {
		id: "oss",
		title: "Solarity & Subspace",
		text: "Once you unlock Solarity/Subspace, you can choose either one, but there is a difference in how they progress. Solarity is more of an active layer, requiring you to be on the game more often, but it is faster than Subspace, which is more idle and requires more waiting. There is no wrong choice here, just go with what works with your playstyle, you'll end up getting the other one later anyway.<br><br>For Solarity, do resets and purchase Solarity buyables, continue this cycle over time and grind up. For Subspace, just let Subspace build up, buy Subspace Upgrades, and do resets. Keep in mind that both of these layers reset Space Buildings, so having that Auto-Space Building milestone in the Quirk tab is very useful in making these runs less painful.<br><br>Eventually, you will unlock both Solarity & Subspace, at which point you continue to grind up as much as possible, remembering to check all relevant layers when you feel stuck to see if you're missing any upgrades or anything else. Continue this push until you can unlock Magic or Balance in Row 5.",
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