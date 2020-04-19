module.exports = {
  plugins: ['stylelint-scss'],
  rules: {
    /*
     * stylelint possible-errors 类目下的规则，即 stylelint-config-recommended 中的规则
     * https://stylelint.io/user-guide/rules/#possible-errors
     */
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'block-no-empty': null, // 不作为必修问题
    'color-no-invalid-hex': true,
    'comment-no-empty': true,
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates-with-different-values']
      }
    ],
    'declaration-block-no-shorthand-property-overrides': true,
    'font-family-no-duplicate-names': true,
    'font-family-no-missing-generic-family-keyword': true,
    'function-calc-no-unspaced-operator': true,
    'function-linear-gradient-no-nonstandard-direction': true,
    'keyframe-declaration-no-important': null, // 不作为必修问题
    'media-feature-name-no-unknown': true,
    'no-descending-specificity': null, // 此条规则关闭：实际中有很多这样用的，且多数人熟悉css优先级
    'no-duplicate-at-import-rules': true,
    'no-duplicate-selectors': true,
    'no-empty-source': true,
    'no-extra-semicolons': true,
    'no-invalid-double-slash-comments': true,
    'property-no-unknown': true,
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global', 'local', 'export']
    }] ,
    'selector-pseudo-element-no-unknown': true,
    'selector-type-no-unknown': true,
    'string-no-newline': true,
    'unit-no-unknown': true,
    'declaration-block-trailing-semicolon': 'always',
    // possible-errors
    'block-no-empty': true,
    'keyframe-declaration-no-important': true,
    // 空格相关
    indentation: 2,
    'block-opening-brace-space-before': 'always',
    'block-opening-brace-space-after': 'always-single-line',
    "block-closing-brace-space-before": "always-single-line",
    'declaration-colon-space-before': 'never',
    'declaration-colon-space-after': 'always',
    'value-list-comma-space-after': 'always-single-line',
    // 'scss/operator-no-unspaced': true,
    'scss/double-slash-comment-whitespace-inside': 'always',
    'block-closing-brace-newline-before': 'always-multi-line',
    'block-opening-brace-newline-after': 'always-multi-line',
    'declaration-block-single-line-max-declarations': 1,
    'max-line-length': 100,
    'length-zero-no-unit': true,
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    'selector-max-id': 0,
    'comment-whitespace-inside': 'always'
  }
};
