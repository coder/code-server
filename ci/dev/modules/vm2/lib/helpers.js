// source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
function escapeRegExp(string) {
	return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function match(wildcard, s) {
	const regexString = escapeRegExp(wildcard).replace(/\\\*/g, '\\S*').replace(/\\\?/g, '.');
	const regex = new RegExp(regexString);
	return regex.test(s);
}

module.exports = {match};
