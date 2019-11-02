# HabiticaMagic
A convenient way to interact with the Habitica API (https://habitica.com/apidoc/).

## Generating the Developer Docs
The Developer documentation is generated from [JSDoc](https://jsdoc.app/index.html) formatted comments in the code, and created using [documentation.js](https://documentation.js.org/). To rebuild the documentation file after updating comments:

First, install dependencies locally.
```
	npm install
```

Then run the following command to build the html docs:

```
	./node_modules/.bin/documentation build src/*.js -f html -o docs
```

#### Installing Globally
If you prefer to install documentation.js globally:

```
    npm install -g documentation
```
Then you can use the command it adds to your PATH instead of the one in your node_modules:

```
    documentation build src/*.js -f html -o docs
```
