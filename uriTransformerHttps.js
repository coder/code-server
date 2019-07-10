module.exports = (remoteAuthority) => {
	return require("./uriTransformer")(remoteAuthority, true);
};
