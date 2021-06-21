import Vue from "vue/dist/vue";
import axios from "axios";

const app = new Vue({
	el: "#app",
	data() {
		return {
			api: "http://localhost:3000/products",
			products: [],
			padActivated: "products", //tutaj przechowuje dane o tym, która zakładka jest otwarta | default: products
			isDataLoading: true,
			specialParam: false,
		};
	},
	created() {
		this.getProducts();
	},
	methods: {
		getProducts() {
			axios
				.get(this.api)
				.then((response) => {
					this.products = response.data;
					this.isDataLoading = false; // zmienna wyłącza loader po załadowaniu danych i dopiero wtedy wyświetla sekcje z danymi
					// (dzięki temu unikam błedów wynikająchych z asynchronicznego pobierania danych)
				})
				.catch((err) => console.error(err));
		},
		setColor(productColor) {
			return {
				"background-color": productColor,
			};
		},
		setSpecialProductColor(productSpecial) {
			if (productSpecial) {
				this.specialParam = true; //na podstawie zmiennej specalParam określam kolor buttona
				return {
					backgroundColor: "#e4f2ff", //dodaje do zbindowanego stylu kolor
				};
			} else {
				this.specialParam = false;
			}
		},
		//zmienia daną: padActivated, w zależności od tego, który przycisk został kliknięty
		padsHandler(param) {
			this.padActivated = param;
		},
	},
});
