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
	else return Decimal.gte(val, SOFTCAPS[name].start);
}

function softcap(name, val) {
	val = new Decimal(val);
	let data = SOFTCAPS[name];
	if (!softcapActive(name, val)) return val;
	if (data.type=="root") return val.times(data.start.pow(data.mag.sub(1))).root(data.mag);
	else if (data.type=="expRoot") return Decimal.pow(10, val.log10().root(data.mag).times(data.start.log10().pow(Decimal.sub(1, data.mag.pow(-1)))));
	else if (data.type=="log") return val.log10().pow(data.exp).times(data.start.div(data.start.log10().pow(data.exp)));
	else return val;
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