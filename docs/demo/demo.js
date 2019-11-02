// putting everything in a demo object because namespaces are cool
var demo = {
	start: function() {
		// this is the element in the DOM where we're going to append
		// all of our templates when we have new data
		this.contentElement = document.getElementById("profile-content");

		// compiling our nunjucks templates so that we can render these
		// babies when we get some sweet API data later.
		// You don't have to use nunjucks templates I just think it makes the
		// HTML look super nice.
		this.template = nunjucks.compile(document.getElementById("profile-template").innerHTML);
		this.errorTemplate = nunjucks.compile(document.getElementById("error-template").innerHTML);

		// time to fetch our user for the first time!
		this.fetchUser();
	},

	fetchUser: function() {
		let userID = document.getElementById("userID-field").value;
		let xclient = "6c2c57d5-67c3-4edf-9a74-2d6d70aa4c56-HabiticaMagicDemo";
		let manager = new HabiticaAPIManager(xclient, "en");

		// First we fetch the Habitica Content so that the Habitica user
		// we get later will have all their armor & quest data fully
		// populated. We could keep the manager object around instead of
		// creating a new one every time we go to fetch a user (and then
		// we wouldn't have to fetch the data every time), but since the
		// Habitica content data will be cached by the browser anyway this
		// isn't too big a deal.
		manager.fetchContentData()
		// once our content data fetch succeeds we can add the fetchUser()
		// call to the promise chain.
		.then(() => {
			return manager.fetchUser(userID);
		})
		// Now that our fetchUser call has finished we're done with API calls
		// and we can send the resulting HabiticaUser object to our
		// renderUserTemplate function.
		.then((user) => {
			this.renderUserTemplate(user);
		})
		// The nice thing about promise chains like this is that if an error
		// happens AT ANY POINT in the chain here we'll automatically skip
		// to this catch block, which will render our error template
		.catch((error) => {
			this.renderErrorTemplate(error);
		});
	},

	// If we get an error we'll render the error temlate with the error
	// data we just got
	renderErrorTemplate: function(error) {
		console.log(error);
		this.contentElement.innerHTML = this.errorTemplate.render({data: error});
	},

	// If we get a user we'll render the user template with the user data
	renderUserTemplate: function(user) {
		console.log(user);
		this.contentElement.innerHTML = this.template.render({user: user});
	}
};

// call our demo start when the DOM is ready!
document.addEventListener("DOMContentLoaded", (event) => {
	demo.start();
})
