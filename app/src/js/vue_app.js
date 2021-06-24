import Vue from "vue/dist/vue";
import axios from "axios";
import parse from "parse-link-header";

const app = new Vue({
	el: "#app",
	data() {
		return {
			apiAll: "http://localhost:3000/products",
			api: "http://localhost:3000/products/?_limit=4&_page=1", // do paginacji
			products: [], //produkty pobrane z jason-server
			filteredProducts: [], //produkty wyswietlane dynamicznie
			allProducts: [],
			padActivated: "products", //tutaj przechowuje dane o tym, która zakładka jest otwarta | default: products
			sortDirection: "", // to samo do sortowania
			isDataLoading: true, // do loadera
			specialParam: false, //parametr używany do obsługi produktów specjalnych
			searchValue: "",
			buttonDisabled: true, //wyłącza przyciask szukaj gdy jest za mało znaków
			isNothingSearched: false, //obsługuje error gdy brak wyników wyszukiwania
			// poniżej zmienne do paginacji
			unparsedHeadersLink: "",
			parsedHeadersLink: {},
			nextActive: false,
			prevActive: true,
			pageSelected: 1,
			firstPage: "",
			lastPage: "",
			//zmienne do filtrowania po cenie
			priceFrom: "0",
			priceTo: "0",
			filterMode: false, //wyłącza paginacje gdy uzywamy filtru po cenie
			//zmienne do filtru po marce
			productBrands: [],
			productColors: [],
			checked: [false, false, false],
			//
			comparedProducts: [],
		};
	},
	created() {
		this.getProducts();
	},
	computed: {
		pages() {
			return parseInt(this.parsedHeadersLink.last._page);
		},
		//wyliczam czy wpisane ceny są poprawne (cenaDo - cenaOd), jeśli wynik ujemny to ceny nieprawidłowe
		legalPrices() {
			return this.priceTo - this.priceFrom;
		},
		checkedColors() {
			let obj = {};
			this.productColors.forEach((value, index) => {
				obj[value] = this.checked[index];
			});
			return obj;
		},
	},
	methods: {
		//pobiera produkty
		getProducts() {
			axios
				.get(this.api)
				.then((response) => {
					this.unparsedHeadersLink = response.headers.link; // stąd mogę pobrać linki do paginacji
					//parsowanie response.headers.link do pliku JSON
					this.parsedHeadersLink = parse(this.unparsedHeadersLink);
					this.products = response.data;
					this.firstPage = parseInt(this.parsedHeadersLink.first._page);
					this.lastPage = parseInt(this.parsedHeadersLink.last._page);
					this.filteredProducts = this.products.slice(); //kopia tablicy
					this.isDataLoading = false; // zmienna wyłącza loader po załadowaniu danych i dopiero wtedy wyświetla sekcje z danymi
					// (dzięki temu unikam błedów wynikająchych z asynchronicznego pobierania danych)
				})
				.catch((err) => console.error(err));

			//drugie zapytanie potzebne do filtrów - dzięki temu będą wyszukiwać we wszystkich produktach
			axios.get(this.apiAll).then((response) => {
				this.allProducts = response.data;
				this.getProductBrands();
				this.getProductColors();
			});
		},
		getProductBrands() {
			//pobieram wszystkie marki
			for (const product of this.allProducts) {
				this.productBrands.push(product.brand);
			}
			//usuwam duplikaty
			this.productBrands = [...new Set(this.productBrands)];
			//sortuje alfabetycznie
			this.productBrands = this.productBrands.sort();
		},
		getProductColors() {
			for (const product of this.allProducts) {
				this.productColors.push(product.color);
			}
			this.productColors = [...new Set(this.productColors)];
			this.productColors = this.productColors.sort();
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
			this.getProducts();
			this.padActivated = param;
			this.filterMode = false;
		},
		//wyszukiwarka
		search() {
			this.filterMode = true;
			//reset przy nowym wyszukiwaniu
			this.isNothingSearched = false;
			this.filteredProducts = this.allProducts.slice();
			//wyswietla wyszukane produkty
			if (this.searchValue.length >= 3) {
				//gdy mamy 3 lub więcej znaków
				this.filteredProducts = this.filteredProducts.filter((product) => {
					if (
						product.name
							.toLowerCase()
							.includes(this.searchValue.toLowerCase()) ||
						product.model.toLowerCase().includes(this.searchValue.toLowerCase())
					) {
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
			//odblokowanie przycisku
			if (this.searchValue.length >= 3) {
				this.buttonDisabled = false;
				//przywrówcenie oryginalnej tablicy produktów, ewentualnego błędu wyszukiwania, oraz ponowna blokaa przycisku, gdy skasujemy pole wyszukiwania lub znaków będzie 2 lub mniej
			} else {
				this.buttonDisabled = true;
				this.isNothingSearched = false;
				this.filteredProducts = this.products.slice();
				this.filterMode = false;
			}
		},
		//podmienia adres strony pobierania plików z json-server
		pageChange($event) {
			this.api = $event.target.href;
			this.sortDirection = ""; //kasuje wybrany oznaczony przycisk sortowania
			this.getProducts();
			this.paginationActiveItemHandler($event);
		},
		nextPage() {
			this.pageSelected += 1;
			this.prevActive = false;

			if (this.parsedHeadersLink.hasOwnProperty("next")) {
				this.api = this.parsedHeadersLink.next.url;
				this.getProducts();
			}

			//wylacza kolejne klikniecie w prawo gdy jestesmy na ostatniej stronie
			if (this.pageSelected === this.lastPage) {
				this.nextActive = true;
			}
		},
		prevPage() {
			this.pageSelected -= 1;
			this.nextActive = false;

			if (this.parsedHeadersLink.hasOwnProperty("prev")) {
				this.api = this.parsedHeadersLink.prev.url;
				this.getProducts();
			}

			//wylacza kolejne klikniecie w lewo gdy jestesmy na pierwszej stronie
			if (this.pageSelected === this.firstPage) {
				this.prevActive = true;
			}
		},
		paginationActiveItemHandler($event) {
			this.pageSelected = parseInt($event.target.innerHTML);

			if (parseInt($event.target.innerHTML) === this.firstPage) {
				this.prevActive = true;
				this.nextActive = false;
			} else {
				this.prevActive = false;
			}

			if (parseInt($event.target.innerHTML) === this.lastPage) {
				this.nextActive = true;
				this.prevActive = false;
			} else {
				this.nextActive = false;
			}
		},
		priceFilter() {
			this.filterMode = true; //wyłącza paginacje
			if (this.legalPrices < 0) {
				alert("Podałeś niepraidłowe dane");
			} else {
				this.filteredProducts = this.allProducts.slice();
				this.filteredProducts = this.filteredProducts.filter((product) => {
					if (product.price > this.priceFrom && product.price < this.priceTo) {
						return {};
					}
				});
			}
		},
		brandFilter($event) {
			this.filteredProducts = this.allProducts.slice();
			this.filteredProducts = this.filteredProducts.filter((product) => {
				if (product.brand === $event.target.value) {
					return product;
				}
			});
		},

		colorFilter($event) {
			//dobry trop
			for (const item in this.checkedColors) {
				if (this.checkedColors[item] === true) {
					console.log(this.checkedColors[item], item); // warunek dobry
					// tu jakiegos finda i pusha
				}
			}

			// // dokończyć
			// if ($event.target.checked) {
			// 	this.filteredProducts = this.allProducts.slice();
			// 	this.filteredProducts = this.filteredProducts.filter((product) => {
			// 		if (product.color === this.productColors[$event.target.value]) {
			// 			return product;
			// 		}
			// 	});
			// } else {
			// 	this.filteredProducts = this.allProducts.slice();
			// }
		},
		addToCompare(currentProduct) {
			//sprawdzam czy dany produkt jest na liśce po ID
			let check = this.comparedProducts.find((x) => x.id === currentProduct.id);

			if (this.comparedProducts.length < 3) {
				if (!check) {
					//jeśli go nie ma to dodaję
					this.comparedProducts.push(currentProduct);
				} else {
					// jeśli jest
					alert("Ten produkt już znajduje się na liście, wybierz inny");
				}
			}
		},
		removeFromCompare(currentProduct) {
			this.comparedProducts = this.comparedProducts.filter((product) => {
				if (product.id !== currentProduct.id) {
					return product;
				}
			});
		},
	},
});
