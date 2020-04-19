const slate = require('./packages/slate/package.json');
const slateReact = require('./packages/slate-react/package.json');
const slateBase64Serializer = require('./packages/slate-base64-serializer/package.json');
const slateDevBenchmark = require('./packages/slate-dev-benchmark/package.json');
const slateDevEnvironment = require('./packages/slate-dev-environment/package.json');
const slateDevTestUtils = require('./packages/slate-dev-test-utils/package.json');
const slateHotkeys = require('./packages/slate-hotkeys/package.json');
const slateHtmlSerializer = require('./packages/slate-html-serializer/package.json');
const slateHyperscript = require('./packages/slate-hyperscript/package.json');
const slatePlainSerializer = require('./packages/slate-plain-serializer/package.json');
const slatePropTypes = require('./packages/slate-prop-types/package.json');
const slateReactPlaceholder = require('./packages/slate-react-placeholder/package.json');

module.exports = {
  // webpack服务启动端口
  port: 9533,
  // rollup 配置
  configurations: [
    {
      pathName: 'slate',
      pkgName: 'slate',
      pkg: slate,
      cssExtract: false,
      umdGlobals: {
        'immutable': 'Immutable',
        'debug': 'Debug',
        'esrever': 'Esrever',
      },
      namedExports: {
        'esrever': ['reverse'],
        'immutable': [
          'List',
          'Map',
          'Record',
          'OrderedSet',
          'Set',
          'Stack',
          'is',
        ],
      },
    },
    {
      pathName: 'slate-react',
      pkgName: 'slate-react',
      pkg: slateReact,
      cssExtract: false,
      umdGlobals: {
        'immutable': 'immutable',
        'react': 'React',
        'debug': 'Debug',
        '@jianghe/slate': 'Slate',
      },
      namedExports: {
        'immutable': [
          'List',
          'Map',
          'Record',
          'OrderedSet',
          'Set',
          'Stack',
          'is',
        ],
        'react-dom': ['findDOMNode'],
        'react-dom/server': ['renderToStaticMarkup'],
      },
    },
    {
      pathName: 'slate-base64-serializer',
      pkgName: 'slate-base64-serializer',
      pkg: slateBase64Serializer,
      cssExtract: false,
      umdGlobals: {
        '@jianghe/slate': 'Slate',
      },
    },
    {
      pathName: 'slate-dev-benchmark',
      pkgName: 'slate-dev-benchmark',
      pkg: slateDevBenchmark,
      cssExtract: false,

    },
    {
      pathName: 'slate-dev-environment',
      pkgName: 'slate-dev-environment',
      pkg: slateDevEnvironment,
      cssExtract: false,
    },
    {
      pathName: 'slate-dev-test-utils',
      pkgName: 'slate-dev-test-utils',
      pkg: slateDevTestUtils,
      cssExtract: false,
      umdGlobals: {
        '@jianghe/slate': 'Slate',
      },
    },
    {
      pathName: 'slate-hotkeys',
      pkgName: 'slate-hotkeys',
      pkg: slateHotkeys,
      cssExtract: false,
    },
    {
      pathName: 'slate-html-serializer',
      pkgName: 'slate-html-serializer',
      pkg: slateHtmlSerializer,
      cssExtract: false,
      umdGlobals: {
        'immutable': 'Immutable',
        'react': 'React',
        'react-dom': 'ReactDOM',
        'react-dom/server': 'ReactDOMServer',
        '@jianghe/slate': 'Slate',
      },
      namedExports: {
        'immutable': [
          'List',
          'Map',
          'Record',
          'OrderedSet',
          'Set',
          'Stack',
          'is',
        ],
        'react-dom': ['findDOMNode'],
        'react-dom/server': ['renderToStaticMarkup'],
      },
    },
    {
      pathName: 'slate-hyperscript',
      pkgName: 'slate-hyperscript',
      pkg: slateHyperscript,
      cssExtract: false,
      umdGlobals: {
        '@jianghe/slate': 'Slate',
      },
    },
    {
      pathName: 'slate-plain-serializer',
      pkgName: 'slate-plain-serializer',
      pkg: slatePlainSerializer,
      cssExtract: false,
      umdGlobals: {
        'immutable': 'Immutable',
        '@jianghe/slate': 'Slate',
      },
      namedExports: {
        'immutable': [
          'List',
          'Map',
          'Record',
          'OrderedSet',
          'Set',
          'Stack',
          'is',
        ],
      },
    },
    {
      pathName: 'slate-prop-types',
      pkgName: 'slate-prop-types',
      pkg: slatePropTypes,
      cssExtract: false,
      umdGlobals: {
        'immutable': 'Immutable',
        '@jianghe/slate': 'Slate',
      },
      namedExports: {
        'immutable': [
          'List',
          'Map',
          'Record',
          'OrderedSet',
          'Set',
          'Stack',
          'is',
        ],
      },
    },
    {
      pathName: 'slate-react-placeholder',
      pkgName: 'slate-react-placeholder',
      pkg: slateReactPlaceholder,
      cssExtract: false,
      umdGlobals: {
        'react': 'React',
        '@jianghe/slate': 'Slate',
      },
    },
  ],
}
