const SOFTCAPS = {
	p12: {
		type: "log",
		start: new Decimal("1e3500"),
		exp: new Decimal(1),
	},
	p12_h22: {
		type: "expRoot",
		start: new Decimal("1e3500"),
		mag: new Decimal(2),
	},
	e12: {
		type: "root",
		start: new Decimal("1e1500"),
		mag: new Decimal(2),
	},
	spaceBuilding3: {
		type: "expRoot",
		start: new Decimal("e3e9"),
		mag: new Decimal(3),
	},
	spaceBuilding4: {
		type: "log",
		start: new Decimal(1e6),
		exp: new Decimal(1),
	},
	hindr_base: {
		type: "expRoot",
		start: new Decimal(15e4),
		mag: new Decimal(4),
	},
	q14_h: {
		type: "log",
		start: new Decimal("1e1000"),
		exp: new Decimal(1000/3),
	},
	q14_q: {
		type: "log",
		start: new Decimal("1e1100"),
		exp: new Decimal(1100/3),
	},
	sol_eff: {
		type: "expRoot",
		start: new Decimal(1e4),
		mag: new Decimal(2),
	},
	solCores: {
		type: "expRoot",
		start: new Decimal(5e4),
		mag: new Decimal(2),
	},
}

const STATIC_SCALE_DATA = [
	{
		start: new Decimal(12),
		start_adj: {
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
		},
		exp: new Decimal(2),
	}, {
		start: new Decimal(1225),
		exp: new Decimal(10),
	},
]

function softcapActive(name, val) {
	if (!SOFTCAPS[name]) return false;
	else return Decimal.gte(val, getSoftcapData(name, "start"));
}

function getSoftcapData(name, id) {
	let data = SOFTCAPS[name][id]
	if (isFunction(data)) return data();
	else return data;
}

function softcap(name, val) {
	val = new Decimal(val);
	if (!softcapActive(name, val)) return val;
	let type = getSoftcapData(name, "type");
	let start = getSoftcapData(name, "start");
	if (type=="root") {
		let mag = getSoftcapData(name, "mag");
		return val.times(start.pow(mag.sub(1))).root(mag);
	} else if (type=="expRoot") {
		let mag = getSoftcapData(name, "mag");
		return Decimal.pow(10, val.log10().root(mag).times(start.log10().pow(Decimal.sub(1, mag.pow(-1)))));
	} else if (type=="log") {
		let exp = getSoftcapData(name, "exp");
		return val.log10().pow(exp).times(start.div(start.log10().pow(exp)));
	} else return val;
}

function getStaticScaleStart(scale, r) {
	let adjData = STATIC_SCALE_DATA[scale].start_adj;
	if (adjData) return adjData[String(r)]?adjData[String(r)]():STATIC_SCALE_DATA[scale].start;
	else return STATIC_SCALE_DATA[scale].start;
}

function getStaticScaleExp(scale, r) {
	let adjData = STATIC_SCALE_DATA[scale].exp_adj;
	if (adjData) return adjData[String(r)]?adjData[String(r)]():STATIC_SCALE_DATA[scale].exp;
	else return STATIC_SCALE_DATA[scale].exp;
}

function scaleStaticCost(gain, row) {
	for (let scale=STATIC_SCALE_DATA.length-1;scale>=0;scale--) {
		let start = getStaticScaleStart(scale, row+1)
		let exp = getStaticScaleExp(scale, row+1)
		if (gain.gte(start)) gain = gain.pow(exp).div(start.pow(exp.sub(1)));
	}
	return gain;
}

function softcapStaticGain(gain, row) {
	for (let scale=0;scale<STATIC_SCALE_DATA.length;scale++) {
		let start = getStaticScaleStart(scale, row+1)
		let exp = getStaticScaleExp(scale, row+1)
		if (gain.gte(start)) gain = gain.times(start.pow(exp.sub(1))).root(exp);
	}
	return gain;
}