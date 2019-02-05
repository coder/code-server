import * as ts from "typescript";
import * as Lint from "tslint";

/**
 * Curly statement newlines rule.
 */
export class Rule extends Lint.Rules.AbstractRule {
	public static FAILURE_STRING = "Curly statements must separate with newlines";

	/**
	 * Apply the rule.
	 */
	public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
		return this.applyWithWalker(new CurlyStatementNewlinesWalker(sourceFile, this.getOptions()));
	}
}

/**
 * Curly statement newlines walker.
 */
class CurlyStatementNewlinesWalker extends Lint.RuleWalker {
	/**
	 * Visit if statements.
	 */
	public visitIfStatement(node: ts.IfStatement): void {
		const splitLength = node.getFullText().trim().split("\n").length;
		if (splitLength <= 2) {
			this.addFailureAt(node.getStart(), node.getWidth(), Rule.FAILURE_STRING);
		}

		super.visitIfStatement(node);
	}
}
