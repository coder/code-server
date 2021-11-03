// @ts-nocheck

'use strict';

// these algorithms are sourced from https://drafts.csswg.org/css-color/#color-conversion-code

function lin_sRGB(RGB) {
	// convert an array of sRGB values in the range 0.0 - 1.0
	// to linear light (un-companded) form.
	// https://en.wikipedia.org/wiki/SRGB
	return RGB.map((val) => {
		if (val < 0.04045) {
			return val / 12.92;
		}

		return ((val + 0.055) / 1.055) ** 2.4;
	});
}

function matrixMultiple3d(matrix, vector) {
	return [
		matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
		matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
		matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
	];
}

function srgb2xyz(srgb) {
	return matrixMultiple3d(
		[
			[0.4124564, 0.3575761, 0.1804375],
			[0.2126729, 0.7151522, 0.072175],
			[0.0193339, 0.119192, 0.9503041],
		],
		srgb,
	);
}

function chromaticAdaptationD65_D50(xyz) {
	return matrixMultiple3d(
		[
			[1.0478112, 0.0228866, -0.050127],
			[0.0295424, 0.9904844, -0.0170491],
			[-0.0092345, 0.0150436, 0.7521316],
		],
		xyz,
	);
}

function xyz2lab(xyzIn) {
	// Assuming XYZ is relative to D50, convert to CIE Lab
	// from CIE standard, which now defines these as a rational fraction
	const ε = 216 / 24389; // 6^3/29^3
	const κ = 24389 / 27; // 29^3/3^3
	const white = [0.9642, 1.0, 0.8249]; // D50 reference white

	// compute xyz, which is XYZ scaled relative to reference white
	const xyz = xyzIn.map((value, i) => value / white[i]);

	// now compute f
	const f = xyz.map((value) => {
		if (value > ε) {
			return Math.cbrt(value);
		}

		return (κ * value + 16) / 116;
	});

	return [
		116 * f[1] - 16, // L
		500 * (f[0] - f[1]), // a
		200 * (f[1] - f[2]), // b
	];
}

function rgb2hsl(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	let h;
	let s;
	let l;
	const M = Math.max(r, g, b);
	const m = Math.min(r, g, b);
	const d = M - m;

	if (d === 0) {
		h = 0;
	} else if (M === r) {
		h = ((g - b) / d) % 6;
	} else if (M === g) {
		h = (b - r) / d + 2;
	} else {
		h = (r - g) / d + 4;
	}

	h *= 60;

	if (h < 0) {
		h += 360;
	}

	l = (M + m) / 2;

	s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

	s *= 100;
	l *= 100;

	return [Math.round(h), Math.round(s), Math.round(l)];
}

function rgb2hwb(rgb_r, rgb_g, rgb_b) {
	rgb_r /= 255;
	rgb_g /= 255;
	rgb_b /= 255;

	const w = Math.min(rgb_r, rgb_g, rgb_b);
	const v = Math.max(rgb_r, rgb_g, rgb_b);

	const b = 1 - v;

	if (v === w) {
		return [0, Math.round(w * 100), Math.round(b * 100)];
	}

	const f = rgb_r === w ? rgb_g - rgb_b : rgb_g === w ? rgb_b - rgb_r : rgb_r - rgb_g;
	const i = rgb_r === w ? 3 : rgb_g === w ? 5 : 1;

	return [
		Math.round(((i - f / (v - w)) / 6) * 360) % 360,
		Math.round(w * 100),
		Math.round(b * 100),
	];
}

function perc255(value) {
	return `${Math.round((value * 100) / 255)}%`;
}

function generateColorFuncs(hexString) {
	if (hexString.length !== 7) {
		throw new Error(
			`Invalid hex string color definition (${hexString}) - expected 6 character hex string`,
		);
	}

	const rgb = [0, 0, 0];

	for (let i = 0; i < 3; i += 1) {
		rgb[i] = Number.parseInt(hexString.substr(2 * i + 1, 2), 16);
	}

	const hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
	const hwb = rgb2hwb(rgb[0], rgb[1], rgb[2]);
	const func = [];
	const rgbStr = `${rgb[0]},${rgb[1]},${rgb[2]}`;
	const rgbPercStr = `${perc255(rgb[0])},${perc255(rgb[1])},${perc255(rgb[2])}`;
	const hslStr = `${hsl[0]},${hsl[1]}%,${hsl[2]}%`;
	const hwbStr = `${hwb[0]},${hwb[1]}%,${hwb[2]}%`;

	// *very* convoluted process, just to be able to establish if the color
	// is gray -- or not.
	const linRgb = lin_sRGB([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]);
	const xyz_d65 = srgb2xyz(linRgb);
	const xyz_d50 = chromaticAdaptationD65_D50(xyz_d65);
	const lab = xyz2lab(xyz_d50);

	func.push(`rgb(${rgbStr})`);
	func.push(`rgba(${rgbStr},1)`);
	func.push(`rgba(${rgbStr},100%)`);
	func.push(`rgb(${rgbPercStr})`);
	func.push(`rgba(${rgbPercStr},1)`);
	func.push(`rgba(${rgbPercStr},100%)`);
	func.push(`hsl(${hslStr})`);
	func.push(`hsla(${hslStr},1)`);
	func.push(`hsla(${hslStr},100%)`);
	func.push(`hwb(${hwbStr})`);
	func.push(`hwb(${hwbStr},1)`);
	func.push(`hwb(${hwbStr},100%)`);

	// technically, this should be 0 - but then #808080 wouldn't even be gray
	if (lab[1] * lab[1] < 0.01 && lab[2] * lab[2] < 0.01) {
		// yay! gray!
		const grayStr = Math.round(lab[0]);

		func.push(`gray(${grayStr})`);
		func.push(`gray(${grayStr},1)`);
		func.push(`gray(${grayStr},100%)`);
		func.push(`gray(${grayStr}%)`);
		func.push(`gray(${grayStr}%,1)`);
		func.push(`gray(${grayStr}%,100%)`);
	}

	return func;
}

module.exports = generateColorFuncs;
