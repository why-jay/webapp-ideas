# chcokr-webapp-build

## What is this?

There are a number of build steps and best practices I take advantage of on a
regular basis when I make a webapp, and I want a core tool that enforces their
use.

This tool is mainly intended for use across my own projects.
I want a common standard across them, and this tool helps enforce it.
Criticism is welcome, but please don't just condemn me for not making this tool
available enough for generic use or sticking to my preferences.
If you have a suggestion, we can work on it together.

## What does this do?

CWB builds a single-page webapp, provided certain rules (described in upcoming
sections) are being followed.
It makes use of the following tools to ensure the quality of the codebase and
build the application.

- Lint: [eslint](https://eslint.org)
- Transpile: [babel](https://babeljs.io) + [webpack](http://webpack.github.io)
- (TODO) Test: [jest](https://facebook.github.io/jest/)
- (TODO) Check code coverage: jest also seems to take care of this
- Install a git pre-commit hook: can't commit until all of the above are
verified

## Using the CLI

The only prerequisite to using this tool so far is to have node.js and npm
installed in advance.

```
npm install -g chcokr-webapp-build
cwb
```

## Semver

Until it hits v1.0, every new `x` in v0.x may introduce breaking changes.

## CJB knowledge required

CWB is a wrapper around [CJB](https://github.com/chcokr/js-build), and takes
advantage of many of its features and requirements.
Being familiar with CJB is an essential prerequisite to using CWB.
So if you're not familiar with CJB, please read CJB's documentation before
reading any further about CWB.

## Expectations on the target project

### All of CJB's expectations apply

First things first: all of
[CJB's expectations](https://github.com/chcokr/js-build#expectations-on-the-target-project)
apply.
Make sure you understand those.

### Entry point: `cjbConfig.js/jsx` -  `webpackConfigs.cwbStart`

Another expectation on top of those is that `cjbConfig.js/jsx`'s exported
property `webpackConfigs` must specify an entry point called `cwbStart`.
Think of this entry point as the point through which the browser will make
the first contact with the webapp.
In it, at least the property `entry` should be defined.
For example:

```JS
module.exports.webpackConfigs = {
  cwbStart: {
    entry: './src/index.jsx'
  }
};
```

As you can see, the webpack configuration is very brief and terse, and seems
to lack many of what a typical webpack configuration would contian.
This is because CWB injects a number of modifications commonly found across
many webpack configurations into each entry point's configuration.
For a full list of these modifications, there's a relevant section below.

### Don't write an `index.html`

You many ask: isn't a webapp's entry point on a browser always an HTML file?
That is of course correct, but CWB doesn't expect an `index.html` file to be
written, because of many reasons:
 
- The practice of including resources via webpack's `require()` function should
be encouraged.
- CWB generates file names in `dist/` such as
`index-<hash>.js` to allow cache-busting.
In order to call such uniquely named resources from `index.html` more easily,
it is better for CWB to take control of `index.html` on its own.

So, CWB includes a build step that generates `index.html` inside `dist/` for
you, using the template in this repo's `src/indexTemplate.html`.

### `<div id="cwb-app"></div>`

One thing you can notice in `src/indexTemplate.html` is that it defines a
`<div>` right inside `<body>` with `id="cwb-app"`.
This is where all DOMs of the app must exist.
For example, `React.render()` should mount the application into this `<div>`.
**Do not render directly to `<body>`**. For an explanation of why not, check out
[Dan Abramov's
piece](https://medium.com/@dan_abramov/two-weird-tricks-that-fix-react-7cf9bbdef375).

### How to handle `<title>`s

TODO

### Browsers to support: `cjbConfig.js/jsx` - `cwbBrowsers`

Every webapp must specify in advance the exact range of browsers it plans to
support.
This gives a clear view on the scope of testing and customer support.

A CWB app must specify the range of supported browsers by exporting property
`cwbBrowsers` in `cjbConfig.js/jsx`.
This property must be a string as defined by the great
[browwserslist](https://github.com/ai/browserslist) library.
For example:

```JS
module.exports.cwbBrowsers = 'last 1 version, > 5%';
```

At the moment, this information is used to autoprefix CSS (more about this
below). In the future, as more features are added to CWB, this information about
browser support range will be used for other CWB features as well, such as UI
testing.

### How CSS works

I'm one of those people who think [CSS should be mostly replaced with
JS (Vjeux's suggestion)](https://speakerdeck.com/vjeux/react-css-in-js).
JS can replace a number of major features in preprocessors like SASS, and it
makes more coherent sense to place the styling of components with their
definition anyway.

While Vjeux's suggestion is enlightening, his proposal of replacing CSS classes
with inline styles has drawbacks, which [Pete Hunt sum up
well](https://github.com/petehunt/jsxstyle/tree/9be22fe89e35a9637824a0a4834c6d6fe698a27c#the-problem-with-vjeuxs-solution).
So I initially turned to [Cheng Lou's solution
RCSS](https://github.com/chenglou/RCSS).
While RCSS was a great pioneering work, there was a major problem when I wanted
to mix it with [Autoprefixer](https://github.com/postcss/autoprefixer).
For example, whereas JS objects cannot have duplicate keys, autoprefixed CSS
definitions do sometimes require duplicate properties:

```
.foo {
  display: flex;
  display: -webkit-flex;
}
```

So I ended up ditching RCSS and came up with my own conventions:

- For every component `X.jsx`, there will be a corresponding file `X.scss`
- `X.jsx` will `require('./X.scss')`
- `X.scss` will define classes that apply **only to** the component defined in
`X.jsx`
- Any DOM element defined in `X.jsx` can have at most one CSS class, and this
class must be defined in `X.scss`.
- If a class in `X.scss` needs to inherit properties from another class in,
say, `Y.scss`, it will do so with SCSS's `@extend` method.
**Do not apply more than one class to any DOM element at any time.**
- A class must follow this naming convention:
`.<semantic_name>-<random_string_of_your_choice>`.
An example is `.alert-modal-v092jf093fl`.
The random string prevents duplicate names.

With these conventions in mind, CWB sets up a number of build steps (which you
can find out more about further below) that transpile and bundle the SCSS files.
One of theses steps is using Autoprefixer.
Keep in mind that `cjbConfig.js/jsx`'s exported property `cwbBrowsers` is a
factor in determining Autoprefixer's output.

This solution works fairly well as long as the conventions are met, but I do
foresee it will be replaced with a more elegant alternative in the near future.
In particular, I'm currently evaluating [Pete Hunt's
idea](https://github.com/petehunt/jsxstyle).

## Minification and optimization

CWB minifies and optimizes the final result of JS transpiling and bundling using
the `webpack.optimize.UglifyJsPlugin`.
Note that comments will be stripped out during this process.

## So how do I deploy the final build?

### `dist/index.html` is the start of everything

Expose `dist/` to the web, using whatever method you like.
`dist/index.html` is the start of the web app, and everything else will follow.

### CDN preferred

Since `dist/` only contains static assets, deployment on a CDN-style network
would be preferable for a faster response time on the browser side.
It would be especially essential that:

- the server can detect changes in `dist/` and send HTTP status 200 or 304
accordingly
- the server can gzip output from `dist/` to browsers
- the server must expose *everything* in `dist/`
- the server assigns a cache TTL (max-age) of **forever** to everything in
`dist/` **except** `dist/index.html`.
This is no issue because CWB's build process ensures a different filename every
time a file other than `index.html` is built, should it be necessary.
- As for `index.html`, a cache TTL of less than one day is recommended.

I recommend [Netlify](https://www.netlify.com/) for a CDN satisfying all these
requirements.

### The "dist server"

During development on a local machine, it is a hassle to set up on localhost
such a CDN-style server satisfying all those CDN expectations.
To save you the hassle, CWB a quick [Express.js](http://expressjs.com/) server
satisfying all of the above conditions.
To use it, first export a new property in `environment.jsx`:

```JS
module.exports.CWB_DEV_SERVER_PORT = 3001;
```

Then run `cwb distserver` and go to `localhost:3001` on your browser.

## List of `webpackConfig` manipulations

### CJB's modifications are applied first

The following modifications are applied **after** [CJB's
modifications](https://github.com/chcokr/js-build#list-of-webpackconfig-manipulations)
are applied.

### `module.loaders`

The following loaders are added at the **end** of the `module.loaders` array
(order: the last one in this list will be the last one in the `module.loaders`
array).

```
{
  test: /\.css/,
  loader: ExtractPlugin.extract('style', 'css!autoprefixer?' +
    'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
}
```

```
{
  test: /\.scss/,
  loader: ExtractPlugin.extract('style', 'css!autoprefixer?' +
    'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>' +
    '!sass?sourceMap=true'
}
```

### `output.filename`

`output.filename` is set to `index-<hash of index.jsx bundle>.js`.

### `plugins`

The following plugins are added at the **beginning** of the `plugins` array,
in this order:

```
new HtmlPlugin({
  filename: 'index.html',
  templateContent: <contents of this repo's src/indexTemplate.html>,

  // custom option, will be used inside the indexTemplate.html template
  isWdsMode: false,

  // custom option, will be used inside the indexTemplate.html template
  timestamp: <current timestamp>
})
```

```JS
new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production')
  }
})
```

```JS
new webpack.optimize.DedupePlugin()
```

```JS
new webpack.optimize.OccurenceOrderPlugin()
```

```JS
new webpack.optimize.UglifyJsPlugin({output: {comments: false}})
```

```
new ExtractTextPlugin(
  `index-<timestamp at time of build>.css`,
  {allChunks: true}
)
```

## webpack-dev-server support

CWB provides basic configurations for
[webpack-dev-server](http://webpack.github.io/docs/webpack-dev-server.html),
thanks to [CJB's support for
WDS](https://github.com/chcokr/js-build#webpack-dev-server-support).
Please read CJB's documentation first.

Differences from CJB's WDS implementation:

- The command is `cwb wds`.
- You don't need to specify an entry point.
`cwb wds` automatically assumes entry point `cwbStart`.
`process.argv[3]` is simply ignored.
- The following WDS-specific `wepbackConfig` modifications are applied, instead
of [CJB's WDS-specific
modifications](https://github.com/chcokr/js-build#wds-specific-webpackconfig-manipulations),
**after** [CJB's default
modifications](https://github.com/chcokr/js-build#list-of-webpackconfig-manipulations)
are applied.

### WDS-specific `wepbackConfig` modifications

Instead of CSS/SCSS loaders mentioned earlier, the following loaders are added
at the **end** of the `module.loaders` array (order: the last one in this list
will be the last one in the `module.loaders` array).

```
{
  test: /\.css/,
  loader: 'style!css!autoprefixer?' +
    'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
}
```
```
{
  test: /\.scss/,
  loader: 'style!css!autoprefixer?' +
    'browsers=<cjbConfig.js/jsx's `cwbBrowsers`>'
    '!sass?sourceMap=true'
}
```

Instead of the `webpack.DefinePlugin` from above which defines
`process.env.NODE_ENV` to `"production"`, the following plugin is used in its
place, setting `process.env.NODE_ENV` to `"development"` instead:

```JS
new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('development')
  }
})
```

Also, the following plugins mentioned earlier are *not* added.

```JS
new webpack.optimize.DedupePlugin()
```

```JS
new webpack.optimize.OccurenceOrderPlugin()
```

```JS
new webpack.optimize.UglifyJsPlugin({output: {comments: false}})
```

```
new ExtractTextPlugin(
  `index-<timestamp at time of build>.css`,
  {allChunks: true}
)
```
