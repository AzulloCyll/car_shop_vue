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
			prevActive: false,
			pageSelected: 1,
			//zmienne do sortowania po cenie
			priceFrom: "0",
			priceTo: "0",
			filterMode: false, //wyłącza paginacje gdy uzywamy filtru po cenie
		};
	},
	created() {
		this.getProducts();
	},
	computed: {
		pages() {
			return parseInt(this.parsedHeadersLink.last._page);
		},
		//ceny w filtrze będą dobre tylko jesli legalPrices będzie >0
		legalPrices() {
			return this.priceTo - this.priceFrom;
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
					this.filteredProducts = this.products.slice(); //kopia tablicy
					this.isDataLoading = false; // zmienna wyłącza loader po załadowaniu danych i dopiero wtedy wyświetla sekcje z danymi
					// (dzięki temu unikam błedów wynikająchych z asynchronicznego pobierania danych)
				})
				.catch((err) => console.error(err));
			//drugie zapytanie potzebne do filtrów - dzięki temu będą wyszukiwać we wszystkich produktach
			axios.get(this.apiAll).then((response) => {
				this.allProducts = response.data;
			});
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
		apiChange($event) {
			this.api = $event.target.href;
			this.getProducts();
			this.pageSelected = parseInt($event.target.innerHTML);
			//zmaina api resetuje sortowanie wg ceny więc deaktywuje wybrany filtr
			this.sortDirection = "";
			this.prevActive = false;
			this.nextActive = false;
		},
		nextPage() {
			this.pageSelected += 1;
			this.prevActive = false;
			if (this.parsedHeadersLink.hasOwnProperty("next")) {
				this.api = this.parsedHeadersLink.next.url;
				this.getProducts();
			} else {
				this.nextActive = true;
			}
		},
		prevPage() {
			this.pageSelected -= 1;
			this.nextActive = false;
			if (this.parsedHeadersLink.hasOwnProperty("prev")) {
				this.api = this.parsedHeadersLink.prev.url;
				this.getProducts();
			} else {
				this.prevActive = true;
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
						return {
							product,
						};
					}
				});
			}
		},
	},
});
