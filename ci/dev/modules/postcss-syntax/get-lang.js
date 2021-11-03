"use strict";

const languages = {
	sass: /^sass$/i,
	// https://github.com/Microsoft/vscode/blob/master/extensions/scss/package.json
	scss: /^scss$/i,
	// https://github.com/Microsoft/vscode/blob/master/extensions/less/package.json
	less: /^less$/i,
	// https://github.com/MhMadHamster/vscode-postcss-language/blob/master/package.json
	sugarss: /^s(?:ugar)?ss$/i,
	// https://github.com/d4rkr00t/language-stylus/blob/master/package.json
	stylus: /^styl(?:us)?$/i,
	// WXSS(WeiXin Style Sheets)		See: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html
	// acss(AntFinancial Style Sheet)	See: https://docs.alipay.com/mini/framework/acss
	// `*.pcss`, `*.postcss`
	// https://github.com/Microsoft/vscode/blob/master/extensions/css/package.json
	// https://github.com/rcsole/postcss-syntax/blob/master/package.json
	css: /^(?:wx|\w*c)ss$/i,
};

const extracts = {
	// https://github.com/Microsoft/vscode/blob/master/extensions/javascript/package.json
	// https://github.com/Microsoft/vscode/blob/master/extensions/typescript-basics/package.json
	// https://github.com/michaelgmcd/vscode-language-babel/blob/master/package.json
	jsx: /^(?:m?[jt]sx?|es\d*|pac|babel|flow)$/i,
	// *.*html?	HTML		https://github.com/Microsoft/vscode/blob/master/extensions/html/package.json
	// *.xslt?	XSLT		https://msdn.microsoft.com/en-us/library/ms764661(v=vs.85).aspx
	// *.vue	VUE 		https://vue-loader.vuejs.org/spec.html
	// *.wpy	WePY		https://github.com/Tencent/wepy/blob/master/docs/md/doc.md#wpy文件说明
	// *.ux		quickapp	https://doc.quickapp.cn/framework/source-file.html
	// *.php*	PHP			https://github.com/Microsoft/vscode/blob/master/extensions/php/package.json
	// *.twig	Twig		https://github.com/mblode/vscode-twig-language/blob/master/package.json
	// *.liquid	Liquid		https://github.com/GingerBear/vscode-liquid/blob/master/package.json
	// *.svelte Svelte		https://github.com/UnwrittenFun/svelte-vscode/blob/master/package.json
	html: /^(?:\w*html?|xht|xslt?|mdoc|jsp|aspx?|volt|ejs|vue|wpy|ux|php\d*|ctp|twig|liquid|svelte)$/i,
	// https://github.com/Microsoft/vscode/blob/master/extensions/markdown-basics/package.json
	markdown: /^(?:m(?:ark)?d(?:ow)?n|mk?d)$/i,
	// https://github.com/Microsoft/vscode/blob/master/extensions/xml/package.json
	xml: /^(?:xml|xsd|ascx|atom|axml|bpmn|config|cpt|csl|csproj|csproj|user|dita|ditamap|dtd|dtml|fsproj|fxml|iml|isml|jmx|launch|menu|mxml|nuspec|opml|owl|proj|props|pt|publishsettings|pubxml|pubxml|user|rdf|rng|rss|shproj|storyboard|svg|targets|tld|tmx|vbproj|vbproj|user|vcxproj|vcxproj|filters|wsdl|wxi|wxl|wxs|xaml|xbl|xib|xlf|xliff|xpdl|xul|xoml)$/i,
};

function sourceType (source) {
	source = source && source.trim();
	if (!source) {
		return;
	}
	let extract;
	if (
		// start with strict mode
		// start with import code
		// start with require code
		/^(?:(?:\/\/[^\r\n]*\r?\n|\/\*.*?\*\/)\s*)*(?:(?:("|')use strict\1|import(?:\s+[^;]+\s+from)?\s+("|')[^'"]+?\2|export\s+[^;]+\s+[^;]+)\s*(;|\r?\n|$)|(?:(?:var|let|const)\s+[^;]+\s*=\s*)?(?:require|import)\(.+\))/.test(source) ||
		// https://en.wikipedia.org/wiki/Shebang_(Unix)
		(/^#!([^\r\n]+)/.test(source) && /(?:^|\s+|\/)(?:ts-)?node(?:\.\w+)?(?:\s+|$)$/.test(RegExp.$1))
	) {
		extract = "jsx";
	} else if (
		/^(?:<\?.*?\?>\s*)*<(?:!DOCTYPE\s+)?html(\s+[^<>]*)?>/i.test(source) ||
		/^<\?php(?:\s+[\s\S]*)?(?:\?>|$)/.test(source)
	) {
		extract = "html";
	} else if (/^<\?xml(\s+[^<>]*)?\?>/i.test(source)) {
		// https://msdn.microsoft.com/en-us/library/ms764661(v=vs.85).aspx
		if (/<xsl:\w+\b[^<>]*>/.test(source) || /<\/xsl:\w+>/i.test(source)) {
			extract = "html";
		} else {
			extract = "xml";
		}
	} else if (/^(?:#+\s+\S+|\S+[^\r\n]*\r?\n=+(\r?\n|$))/.test(source)) {
		extract = "markdown";
	} else if (/<(\w+)(?:\s+[^<>]*)?>[\s\S]*?<\/\1>/.test(source)) {
		extract = "html";
	} else {
		return;
	}
	return {
		extract,
	};
}

function extType (extName, languages) {
	for (const langName in languages) {
		if (languages[langName].test(extName)) {
			return langName;
		}
	}
}

function fileType (file) {
	if (file && /\.(\w+)(?:[?#].*?)?$/.test(file)) {
		const extName = RegExp.$1;
		const extract = extType(extName, extracts);
		if (extract) {
			return {
				extract,
			};
		}
		const lang = extType(extName, languages);
		if (lang) {
			return {
				lang,
			};
		}
	}
}

function getLang (file, source) {
	return fileType(file) || sourceType(source);
}

module.exports = getLang;
