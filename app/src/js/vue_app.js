import Vue from "vue/dist/vue";
import axios from "axios";


const app = new Vue({
	el: "#app",
	data() {
		return {
			api: "http://localhost:3000/products",
			products: [], //produkty pobrane z jason-server
			filteredProducts: [], //produkty wyswietlane dynamicznie
			padActivated: "products", //tutaj przechowuje dane o tym, która zakładka jest otwarta | default: products
			sortDirection: "", // to samo do sortowania 
			isDataLoading: true, // do loadera
			specialParam: false, //parametr używany do obsługi produktów specjalnych
			searchValue: "",
			buttonDisabled: true, //wyłącza przyciask szukaj gdy jest za mało znaków
			isNothingSearched: false, //obsługuje error gdy brak wynikjów wyszukiwania
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
		//wyszukiwarka
		search() {
			//reset przy nowym wyszukiwaniu
			this.isNothingSearched = false;
			this.filteredProducts = this.products.slice();
			//wyswietla wyszukane produkty
			if (this.searchValue.length >= 3) { //gdy mamy 3 lub więcej znaków
				this.filteredProducts = this.filteredProducts.filter((product) => {
					if (product.name.toLowerCase().includes(this.searchValue.toLowerCase()) || product.model.toLowerCase().includes(this.searchValue.toLowerCase())) {
						//zwracam produkty o pasujących warunkach
						return product;
					}
				});
			}
			//dodatkowy warunek pokazujący błąd wyszukiwania, gdy wyszukanych produktów bedzie zero
			if (this.filteredProducts.length == 0) {
				this.isNothingSearched = true;
			}
		},
		searchButtonHandler() {
			//odpblokowanie przycisku
			if (this.searchValue.length >= 3) {
				this.buttonDisabled = false;
				//przywrówcenie oryginalnej tablicy produktów, ewentualnego błędu wyszukiwania, oraz ponowna blokaa przycisku, gdy skasujemy pole wyszukiwania lub znaków będzie 2 lub mniej
			} else {
				this.buttonDisabled = true;
				this.isNothingSearched = false;
				this.filteredProducts = this.products.slice();
			}

		}
	},
});
