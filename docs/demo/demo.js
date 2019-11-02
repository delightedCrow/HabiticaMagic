var demo = {
	start: function() {
		this.contentElement = document.getElementById("profile-content");
		this.template = nunjucks.compile(document.getElementById("profile-template").innerHTML);
		this.errorTemplate = nunjucks.compile(document.getElementById("error-template").innerHTML);

		let xclient = "6c2c57d5-67c3-4edf-9a74-2d6d70aa4c56-HabiticaMagicDemo";
		this.manager = new HabiticaAPIManager("en", xclient);

		this.manager.fetchContentData().then(() => {
			this.fetchUser();
		})
		.catch((error) => {
			this.renderErrorTemplate(error)
		});
	},

	fetchUser: function() {
		let userID = document.getElementById("userID-field").value;

		this.manager.fetchUser(userID)
		.then((user) => {
			this.renderUserTemplate(user);
		}).catch((error) => {
			this.renderErrorTemplate(error);
		});
	},
	renderErrorTemplate: function(error) {
		console.log(error);
		this.contentElement.innerHTML = this.errorTemplate.render({data: error});
	},
	renderUserTemplate: function(user) {
		console.log(user);
		this.contentElement.innerHTML = this.template.render({user: user});
	}
};

document.addEventListener("DOMContentLoaded", (event) => {
	demo.start();
})
