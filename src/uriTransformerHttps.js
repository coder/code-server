module.exports = (remoteAuthority) => {
	return require("./uriTransformerHttp")(remoteAuthority, true);
};
