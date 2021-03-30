# HabiticaMagicJS

HabiticaMagicJS is a javascript API wrapper for the [Habitica API (V3)](https://habitica.com/apidoc/). It provides the `HabiticaAPIManager` which makes API requests simple, as well as wrapper classes (like `HabiticaUser`) that make accessing Habitica's returned API data convenient.

## Demo

For an example of HabiticaMagicJS in action, check out the [demo](https://delightedcrow.github.io/HabiticaMagic/docs/demo/demo.html).

## Docs

For the most comprehensive and up-to-date documentation on HabiticaMagicJS functions, [check out the docs](https://delightedcrow.github.io/HabiticaMagic/docs/index.html).

## Usage And Examples

⚠️ Before you do anything else, you'll need to include the HabiticaMagicJS source in your project - check the [dist/](dist/) directory for the latest version!

### HabiticaAPIManager

```javascript
var apiManager = new HabiticaAPIManager("Your x-client ID", "en@pirate");
```

The `HabiticaAPIManager` class is the primary way you'll interact with HabiticaMagicJS. Its constructor takes two parameters:

- **x-client-id**: REQUIRED. Your x-client-id. [See Habitica's documentation here for what your x-client should be](https://habitica.fandom.com/wiki/Guidance_for_Comrades#X-Client_Header).
- **language**: OPTIONAL. The language you want Habitica's content in. [See possible values here](https://habitica.com/apidoc/#api-Content-ContentGet). The default is `"en"` for english.

#### Promises, Promises...

All of `HabiticaAPIManager`'s API call functions return javascript `Promise` objects which make error handling and asynchronous function callbacks a breeze!

Check out this example of making multiple API requests and chaining them together using `.then()` so that they happen one-after-another (example taken from the [demo](docs/demo/demo.html)):

##### Example: API call promise chain

```javascript
// get a manager object!
let manager = new HabiticaAPIManager(xclient);

// first we're going to do an API call to fetch the Habitica content data
manager
  .fetchContentData()
  // once our content data fetch succeeds we can add the fetchUser()
  // API call to the promise chain.
  .then(() => {
    return manager.fetchUser(userID);
  })
  // Now that our fetchUser call has finished we're done with API calls
  // (for now!) and we can send the resulting HabiticaUser object to our
  // renderUserTemplate function to display.
  .then((user) => {
    this.renderUserTemplate(user);
  })
  // The nice thing about promise chains like this is that if an error
  // happens AT ANY POINT in the chain here we'll automatically skip
  // to this catch block, which will render our error template
  .catch((error) => {
    this.renderErrorTemplate(error);
  });
```

#### Generic Get Requests

HabiticaMagicJS provides several fetch functions for getting specific API data (like getting a user profile using `HabiticaAPIManager.getUser()`), but if none of those suit your purposes then there are two generalized functions for making get requests to the Habitica API:

- `getRequest` (for requests that don't require an API Token)
- `authGetRequest` (for requests that do)

##### getRequest Example: Checking for Habitica's API status

```javascript
var apiManager = new HabiticaAPIManager("Your x-client ID");

let apiURL = "https://habitica.com/api/v3/status";
apiManager.getRequest(apiURL).then((rawData) => {
  // process the raw string of data into a JSON object
  let statusData = JSON.parse(rawData).data;
  // Now you know the API status!
  console.log(statusData);
});
```

##### getAuthRequest Example: Requesting a user's party

```javascript
var apiManager = new HabiticaAPIManager("Your x-client ID");

let apiURL = "https://habitica.com/api/v3/groups/party";
apiManager
  .authGetRequest(apiURL, "USER ID", "USER API TOKEN")
  .then((rawData) => {
    // process the raw string of data into a JSON object
    let partyData = JSON.parse(rawData).data;
    // now you can party!
    console.log(partyData);
  });
```

#### Generic Post Request

HabiticaMagicJS provides a generalized `postRequest` function.

##### postRequest Example: Adding a task

```javascript
var apiManager = new HabiticaAPIManager("Your x-client ID");

let apiURL = "https://habitica.com/api/v3/tasks/user";
let task = {
  type: "TASK TYPE",
  text: "TASK NAME",
};
apiManager.postRequest(apiURL, "USER ID", "USER API TOKEN", task);
```

#### Before Fetching HabiticaUsers: Getting the Habitica Content

If you intend to use `HabiticaAPIManager` to get `HabiticaUser` objects, you should first start by fetching Habitica's content.

Habitica stores certain data (like armor and quest details) in this content data. The `HabiticaAPIManager` will take this data and add it to the user objects it creates so that they have the data they need about the equipment they're wearing or the quests they're on.

For more low-level details on which data gets filled in, check out `HabiticaAPIManager.replaceKeysWithContent()`.

#### Example: fetchUser() Before Content Fetch: details missing!

```javascript
// fetching a user without getting the content
apiManager.fetchUser("USER-ID")
.then((user) => {
	console.log(user.armor);
});

// console.log will output something like the following object:
{
	armor: "armor_base_0",
	head: "head_base_0",
	shield: "shield_base_0"
}
```

#### Example: fetchUser() After Content Fetch: details filled in!

```javascript
// fetching the content first
apiManager.fetchContentData()
.then(() => {
	// after we fetch the content NOW we get our user
	return apiManager.fetchUser("USER-ID");
})
.then((user) => {
	console.log(user.armor);
});

// console.log will output something like the following object:
{
	armor: {
		"text": "Plain Clothing",
		"notes": "Ordinary clothing. Confers no benefit.",
		"value": 0,
		"type": "armor",
		"key": "armor_base_0",
		"set": "base-0",
		"klass": "base",
		"index": "0",
		"str": 0,
		"int": 0,
		"per": 0,
		"con": 0
		},
	head: {...},
	shield: {...}
}
```

### Convenience Classes

HabiticaMagicJS also comes with some classes (like `HabiticaUser` and `HabiticaUserTasksManager`) that make accessing the data you get from the Habitica API much easier. You'll notice that the `HabiticaAPIManager` has API request functions like `fetchAuthenticatedUser()` and `fetchUserWithTasks()` that return objects of these classes directly - sweet!

These classes store the API returned by Habitica in a property (`.apiData`) and then provide computed properties that access that data for you. This is handy for a couple of reasons:

- If the underlying structure of the Habitica API data changes in a future update, you won't have to change any of the code that uses `HabiticaUser`. Only the `HabiticaUser` access functions will have to be fixed and your code will go on working normally (yay abstraction!).
- There is often a lot of complexity in the way the Habitica API returns data, which `HabiticaUser` smoothes over - just look at the following example for getting a user's gems.

##### Example: getting a user's gems

```javascript
// Assuming you've already created an apiManager and fetched
// Habitica the content data
apiManager.fetchUserWithTasks("USER ID", "API TOKEN").then((user) => {
  // you can always get to the raw API object data from
  // the .apiData property
  console.log(user.apiData);

  // If you were to use the old-fashioned way of finding out how
  // many gems a user had you'd have to know the Habitica API
  // returns gems in a data property called "balance", and that
  // you had to multiply that value by 4.
  console.log(user.apiData.balance * 4); // gives you # of gems...

  // But really you should just call:
  console.log(user.gems); // what it does is obvious!
});
```

##### Some other examples of useful HabiticaUser properties:

```javascript
// Assuming you've already created an apiManager and fetched
// Habitica the content data

apiManager.fetchUserWithTasks("USER ID", "API TOKEN").then((user) => {
  // you can always get to the raw API object data from
  // the .apiData property
  console.log(user.apiData);

  // user.tasks is actually a HabiticaUserTasksManager object that
  // lets you do neat things like see the amount of damage your
  // undone dailies will to!
  console.log(user.tasks.dailyStats.dailyDamageToSelf);

  // want a list of this user's todos, due today?
  console.log(user.tasks.todosDueToday);

  // user stats will be computed for you! Yay!
  console.log(user.stats);
  // output of console.log(user.stats):
  // {
  // 	totals: {str: 0, con: 0, int: 0, per: 0},
  // 	armor: {str: 0, con: 0, int: 0, per: 0},
  // 	buffs: {str: 0, con: 0, int: 0, per: 0},
  // 	points: {str: 0, con: 0, int: 0, per: 0}
  // }
});
```

---

## HabiticaMagicJS Development

### Build Scripts

To run all the build scripts:

```bash
npm run build
```

### Building the JS files

We're using npm and node-minify to compile and minify the js for use/distribution. Run `npm install` in the `HabiticaMagic` directory to install node-minify and its dependencies, then:

```bash
npm run build:minify
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

---

## Contributing

HabiticaMagicJS is a fan-made project and we welcome any contributions to make it better! Create a pull request, submit a bug report, or just come say hello in the [Habitica Aspiring Comrades Guild](https://habitica.com/groups/guild/2ff9822b-27f2-4774-98da-db349b57a38e) (we're @delightedCrow and @array-of-frost!). We can't say we'll respond in a timely manner, but we'll do our best ;)

### Guidelines For Pull Requests

- Pull Requests should be submitted to the `dev` branch
- If there isn't one already, it's helpful to open an issue detailing the feature/bug your PR will address before you submit it.
- Add a short description of your change to the [Changelog](CHANGELOG.md) file under the `[Unreleased]` section.

---

## Attributions & Special Thanks

- Huge thanks to [Lady Alys](https://github.com/Alys) for her [Habitica Official User Data Display Tool](https://github.com/Alys/tools-for-habitrpg) which was a _massively_ helpful resource in understanding the Habitica game logic!
