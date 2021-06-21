import Vue from "vue/dist/vue";
import axios from "axios";

const app = new Vue({
	el: "#app",
	data() {
		return {
			api: "http://localhost:3000/products",
			products: [],
			padActivated: "products" //tutaj przechowuje dane o tym, która zakładka jest otwarta | default: products
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
		//zmienia daną: padActivated, w zależności od tego, który przycisk został kliknięty
		padsHandler(param) {
			this.padActivated = param;
		},
	},
});
