import * as ts from "typescript";
import * as Lint from "tslint";

/**
 * Rule for disallowing blank lines around the content of blocks.
 */
export class Rule extends Lint.Rules.AbstractRule {
	public static BEFORE_FAILURE_STRING = "Blocks must not start with blank lines";
	public static AFTER_FAILURE_STRING = "Blocks must not end with blank lines";

	/**
	 * Apply the rule.
	 */
	public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
		return this.applyWithWalker(new NoBlockPaddingWalker(sourceFile, this.getOptions()));
	}
}

/**
 * Walker for checking block padding.
 */
class NoBlockPaddingWalker extends Lint.RuleWalker {
	/**
	 * Apply this rule to interfaces.
	 */
	public visitInterfaceDeclaration(node: ts.InterfaceDeclaration): void {
		this.visitBlockNode(node);
		super.visitInterfaceDeclaration(node);
	}

	/**
	 * Apply this rule to classes.
	 */
	public visitClassDeclaration(node: ts.ClassDeclaration): void {
		this.visitBlockNode(node);
		super.visitClassDeclaration(node);
	}

	/**
	 * Add failures to blank lines surrounding a block's content.
	 */
	private visitBlockNode(node: ts.ClassDeclaration | ts.InterfaceDeclaration): void {
		const sourceFile = node.getSourceFile();
		const children = node.getChildren();

		const openBraceIndex = children.findIndex((n) => n.kind === ts.SyntaxKind.OpenBraceToken);
		if (openBraceIndex !== -1) {
			const nextToken = children[openBraceIndex + 1];
			if (nextToken) {
				const startLine = this.getStartIncludingComments(sourceFile, nextToken);
				const openBraceToken = children[openBraceIndex];
				if (ts.getLineAndCharacterOfPosition(sourceFile, openBraceToken.getEnd()).line + 1 < startLine) {
					this.addFailureAt(openBraceToken.getEnd(), openBraceToken.getEnd(), Rule.BEFORE_FAILURE_STRING);
				}
			}
		}

		const closeBraceIndex = children.findIndex((n) => n.kind === ts.SyntaxKind.CloseBraceToken);
		if (closeBraceIndex >= 2) {
			const previousToken = children[closeBraceIndex - 1];
			if (previousToken) {
				let endLine = ts.getLineAndCharacterOfPosition(sourceFile, previousToken.getEnd()).line;
				const closeBraceToken = children[closeBraceIndex];
				if (this.getStartIncludingComments(sourceFile, closeBraceToken) > endLine + 1) {
					this.addFailureAt(closeBraceToken.getStart(), closeBraceToken.getStart(), Rule.AFTER_FAILURE_STRING);
				}
			}
		}
	}

	/**
	 * getStart() doesn't account for comments while this does.
	 */
	private getStartIncludingComments(sourceFile: ts.SourceFile, node: ts.Node): number {
		// This gets the line the node starts on without counting comments.
		let startLine = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line;

		// Adjust the start line for the comments.
		const comments = ts.getLeadingCommentRanges(sourceFile.text, node.pos) || [];
		comments.forEach((c) => {
			const commentStartLine = ts.getLineAndCharacterOfPosition(sourceFile, c.pos).line;
			if (commentStartLine < startLine) {
				startLine = commentStartLine;
			}
		});

		return startLine;
	}
}
