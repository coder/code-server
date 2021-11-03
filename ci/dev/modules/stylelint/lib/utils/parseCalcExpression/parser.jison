/* description: Parses expressions. */

%options case-insensitive

/* lexical grammar */
%lex
%%
\s+                                                    /* skip whitespace */

(\-(webkit|moz)\-)?calc\b                             return 'CALC';

[a-z][a-z0-9-]*\s*\((?:(?:\"(?:\\.|[^\"\\])*\"|\'(?:\\.|[^\'\\])*\')|\([^)]*\)|[^\(\)]*)*\)  return 'FUNCTION';

"*"                                                   return 'MUL';
"/"                                                   return 'DIV';
"+"                                                   return 'ADD';
"-"                                                   return 'SUB';

([0-9]+("."[0-9]+)?|"."[0-9]+)em\b                    return 'LENGTH';     // em
([0-9]+("."[0-9]+)?|"."[0-9]+)ex\b                    return 'LENGTH';     // ex
([0-9]+("."[0-9]+)?|"."[0-9]+)ch\b                    return 'LENGTH';     // ch
([0-9]+("."[0-9]+)?|"."[0-9]+)rem\b                   return 'LENGTH';     // rem
([0-9]+("."[0-9]+)?|"."[0-9]+)vw\b                    return 'LENGTH';     // vw
([0-9]+("."[0-9]+)?|"."[0-9]+)vh\b                    return 'LENGTH';     // vh
([0-9]+("."[0-9]+)?|"."[0-9]+)vmin\b                  return 'LENGTH';     // vmin
([0-9]+("."[0-9]+)?|"."[0-9]+)vmax\b                  return 'LENGTH';     // vmax
([0-9]+("."[0-9]+)?|"."[0-9]+)vm\b                    return 'LENGTH';     // vm (non-standard name)
([0-9]+("."[0-9]+)?|"."[0-9]+)px\b                    return 'LENGTH';     // px
([0-9]+("."[0-9]+)?|"."[0-9]+)mm\b                    return 'LENGTH';     // mm
([0-9]+("."[0-9]+)?|"."[0-9]+)cm\b                    return 'LENGTH';     // cm
([0-9]+("."[0-9]+)?|"."[0-9]+)in\b                    return 'LENGTH';     // in
([0-9]+("."[0-9]+)?|"."[0-9]+)pt\b                    return 'LENGTH';     // pt
([0-9]+("."[0-9]+)?|"."[0-9]+)pc\b                    return 'LENGTH';     // pc
([0-9]+("."[0-9]+)?|"."[0-9]+)Q\b                     return 'LENGTH';     // Q
([0-9]+("."[0-9]+)?|"."[0-9]+)fr\b                    return 'LENGTH';     // fr
([0-9]+("."[0-9]+)?|"."[0-9]+)deg\b                   return 'ANGLE';      // deg
([0-9]+("."[0-9]+)?|"."[0-9]+)grad\b                  return 'ANGLE';      // grad
([0-9]+("."[0-9]+)?|"."[0-9]+)turn\b                  return 'ANGLE';      // turn
([0-9]+("."[0-9]+)?|"."[0-9]+)rad\b                   return 'ANGLE';      // rad
([0-9]+("."[0-9]+)?|"."[0-9]+)s\b                     return 'TIME';       // s
([0-9]+("."[0-9]+)?|"."[0-9]+)ms\b                    return 'TIME';       // ms
([0-9]+("."[0-9]+)?|"."[0-9]+)Hz\b                    return 'FREQ';       // Hz
([0-9]+("."[0-9]+)?|"."[0-9]+)kHz\b                   return 'FREQ';       // kHz
([0-9]+("."[0-9]+)?|"."[0-9]+)dpi\b                   return 'RES';        // dpi
([0-9]+("."[0-9]+)?|"."[0-9]+)dpcm\b                  return 'RES';        // dpcm
([0-9]+("."[0-9]+)?|"."[0-9]+)dppx\b                  return 'RES';        // dppm
([0-9]+("."[0-9]+)?|"."[0-9]+)\%                      return 'PERCENTAGE';
([0-9]+("."[0-9]+)?|"."[0-9]+)\b                      return 'NUMBER';

"("                                                   return 'LPAREN';
")"                                                   return 'RPAREN';

#\{([\s\S]*?)\}                                       return 'UNKNOWN'; // scss interpolation
@\{([\s\S]*?)\}                                       return 'UNKNOWN'; // less interpolation

\S[^\s()*/+-]*                                        return 'UNKNOWN';

<<EOF>>                                               return 'EOF';

/lex

%left ADD SUB
%left MUL DIV
%left UPREC


%start expression

%%

expression
  : math_expression EOF { return $1; }
  ;

  math_expression
    : CALC LPAREN math_expression RPAREN {
        $$ = $3;
        $$.source.start = { index: @1.range[0] };
        $$.source.end = { index: @4.range[1] };
      }
    | math_expression ADD math_expression {
        $$ = {
          type: 'MathExpression', operator: $2, left: $1, right: $3,
          source: {
            start: $1.source.start, end: $3.source.end,
            operator: { start: { index: @2.range[0] }, end: { index: @2.range[1] } }
          }
        };
      }
    | math_expression SUB math_expression {
        $$ = {
          type: 'MathExpression', operator: $2, left: $1, right: $3,
          source: {
            start: $1.source.start, end: $3.source.end,
            operator: { start: { index: @2.range[0] }, end: { index: @2.range[1] } }
          }
        };
      }
    | math_expression MUL math_expression {
        $$ = {
          type: 'MathExpression', operator: $2, left: $1, right: $3,
          source: {
            start: $1.source.start, end: $3.source.end,
            operator: { start: { index: @2.range[0] }, end: { index: @2.range[1] } }
          }
        };
      }
    | math_expression DIV math_expression {
        $$ = {
          type: 'MathExpression', operator: $2, left: $1, right: $3,
          source: {
            start: $1.source.start, end: $3.source.end,
            operator: { start: { index: @2.range[0] }, end: { index: @2.range[1] } }
          }
        };
      }
    | SUB math_expression %prec UPREC {
        if (@1.range[1] !== $2.source.start.index) {
          throw new Error('Unexpected spaces was found between sign and value');
        }
        if (typeof $2.value !== 'number') {
          throw new Error('Unexpected sign');
        }
        if ($2.sign) {
          throw new Error('Unexpected continuous sign');
        }
        $$ = $2;
        $$.sign = '-'
        $$.value = -$2.value;
        $$.source.start.index = @1.range[0];
      }
    | ADD math_expression %prec UPREC {
        if (@1.range[1] !== $2.source.start.index) {
          throw new Error('Unexpected spaces was found between sign and value');
        }
        if (typeof $2.value !== 'number') {
          throw new Error('Unexpected sign');
        }
        if ($2.sign) {
          throw new Error('Unexpected continuous sign');
        }
        $$ = $2;
        $$.sign = '+'
        $$.source.start.index = @1.range[0];
      }
    | LPAREN math_expression RPAREN {
        $$ = $2;
        $$.source.start = { index: @1.range[0] };
        $$.source.end = { index: @3.range[1] };
      }
    | function { $$ = $1; }
    | css_value { $$ = $1; }
    | value { $$ = $1; }
    ;

  value
    : NUMBER { $$ = { type: 'Value', value: parseFloat($1), source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    ;

  function
    : FUNCTION { $$ = { type: 'Function', value: $1, source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    ;

  css_value
    : LENGTH { $$ = { type: 'LengthValue', value: parseFloat($1), unit: /[a-z]+/i.exec($1)[0], source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    | ANGLE { $$ = { type: 'AngleValue', value: parseFloat($1), unit: /[a-z]+/i.exec($1)[0], source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    | TIME { $$ = { type: 'TimeValue', value: parseFloat($1), unit: /[a-z]+/i.exec($1)[0], source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    | FREQ { $$ = { type: 'FrequencyValue', value: parseFloat($1), unit: /[a-z]+/i.exec($1)[0], source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    | RES { $$ = { type: 'ResolutionValue', value: parseFloat($1), unit: /[a-z]+/i.exec($1)[0], source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    | PERCENTAGE { $$ = { type: 'PercentageValue', value: parseFloat($1), unit: '%', source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    | UNKNOWN { $$ = { type: 'UnknownValue', value: $1, unit: '', source: { start: { index: @1.range[0] }, end: { index: @1.range[1] } } }; }
    ;
