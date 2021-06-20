import Vue from "vue/dist/vue";
import axios from "axios";

const app = new Vue({
	el: "#app",
	data() {
		return {
			api: "http://localhost:3000/products",
			products: [],
		};
	},
	created() {
		this.getProducts();
	},
	methods: {
		getProducts() {
			axios.get(this.api).then((response) => {
				this.products = response.data;
			});
		},
		setColor(productColor) {
			return {
				"background-color": productColor,
			};
		},
	},
});
