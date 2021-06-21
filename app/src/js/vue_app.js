import Vue from "vue/dist/vue";
import axios from "axios";

const app = new Vue({
	el: "#app",
	data() {
		return {
			api: "http://localhost:3000/products",
			products: [],
			filteredProducts: [],
			padActivated: "products", //tutaj przechowuje dane o tym, która zakładka jest otwarta | default: products
			sortDirection: "",
			isDataLoading: true,
			specialParam: false,
		};
	},
	created() {
		this.getProducts();
	},
	methods: {
		//pobiera produkty
		getProducts() {
			axios
				.get(this.api)
				.then((response) => {
					this.products = response.data;
					this.filteredProducts = this.products.slice(); //kopia tablicy
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
		specialProductColorChange(isSpecial) {
			if (isSpecial) {
				return {
					"background-color": "#f2ede7",
				};
			}
		},
		sortProducts(sortDirection) {
			this.sortDirection = sortDirection;
			switch (sortDirection) {
				case "desc":
					this.filteredProducts = this.filteredProducts.sort((a, b) =>
						a.price < b.price ? 1 : -1
					);
					break;
				case "asc":
					this.filteredProducts = this.filteredProducts.sort((a, b) =>
						a.price > b.price ? 1 : -1
					);
					break;
			}
		},
		//zmienia daną: padActivated, w zależności od tego, który przycisk został kliknięty
		padsHandler(param) {
			this.padActivated = param;
		},
	},
});
