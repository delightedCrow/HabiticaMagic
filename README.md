# HabiticaMagicJS

HabiticaMagicJS is a javascript API wrapper for the [Habitica API (V3)](https://habitica.com/apidoc/). It provides the `HabiticaAPIManager` which makes API requests simple, as well as wrapper classes (like `HabiticaUser`) that make accessing Habitica's returned API data convenient.

## Table Of Contents

- [Table Of Contents](#table-of-contents)
- [Demo](#demo)
- [Limitations](#limitations)
- [Usage](#usage)
	- [`HabiticaAPIManager`](#habiticaapimanager)

## Demo

For an example of HabiticaMagicJS in action, check out the [demo](docs/demo/demo.html).

## Limitations

HabiticaMagicJS currently supports only `GET` requests at the moment, so it works best for projects that just need **read-only access to the Habitica API**.

## Usage

⚠️ Before you do anything else, you'll need to include the HabiticaMagicJS source in your project - check the [dist/](dist/) directory for the latest version!

### HabiticaAPIManager

````javascript
var apiManager = new HabiticaAPIManager("Your x-client ID", "en@pirate");
````

The `HabiticaAPIManager` class is the primary way you'll interact with HabiticaMagicJS. Its constructor takes two parameters:
- **x-client-id**: REQUIRED. Your x-client-id. [See Habitica's documentation here for what your x-client should be](https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header).
- **language**: OPTIONAL. The language you want Habitica's content in. [See possible values here](https://habitica.com/apidoc/#api-Content-ContentGet). The default is `"en"` for english.

#### Getting Habitica Content

If you intend to use `HabiticaAPIManager` to get `HabiticaUser` objects, you should first start by fetching Habitica's content.

````javascript
var apiManager = new HabiticaAPIManager("en", "Your x-client ID");

apiManager.fetchContentData()
.then(() => {
	console.log("Content fetch complete: ", apiManager.content);
	// now that we've got the content we can fetch other users.
	// Since APIManager.fetchUser() returns a promise, we can
	// return it here and our user will be given as the parameter
	// in the following then() chain
	return apiManager.fetchUser("USER-ID");
})
.then((user) => {
	console.log("Fetched a user named ", user.displayName);
});
.catch((error) => {
	console.error("Error fetching data: ", error);
});
````

## Contributing & Development

### Building the JS files

We're using npm and node-minify to compile and minify the js for use/distribution. Run `npm install` in the `HabiticaMagic` directory to install node-minify and its dependencies, then:

```bash
	npm run build
```

Compiled files will be output in the `/dist` directory. To modify the build process, edit `minify.js`.

### Generating the Developer Docs
The Developer documentation is generated from [JSDoc](https://jsdoc.app/index.html) formatted comments in the code, and created using [documentation.js](https://documentation.js.org/). To rebuild the documentation file after updating comments:

First, install dependencies locally.
```bash
	npm install
```

Then run the following command to build the html docs:
```bash
	npm run build:docs
```

# Attributions & Special Thanks

- Huge thanks to [Lady Alys](https://github.com/Alys) for her [Habitica Official User Data Display Tool](https://github.com/Alys/tools-for-habitrpg) which was a _massively_ helpful resource in understanding the Habitica game logic!
