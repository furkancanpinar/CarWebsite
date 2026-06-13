const searchBar = document.getElementById('search-bar');
const searchResults = document.getElementById('searchResults');

if (searchBar && searchResults) {
    const searchData = [
        {
            title: "Home Page",
            description: "Main landing page",
            link: "index.html",
            icon: "Editables/Home.png",
            keywords: ["home", "main", "landing", "start"]
        },
        {
            title: "Showroom",
            description: "Browse available vehicles",
            link: "showroom.html",
            icon: "Editables/car.png",
            keywords: ["showroom", "inventory", "cars", "vehicles"]
        },
        {
            title: "Sold Gallery",
            description: "Cars we've sold",
            link: "sold-gallery.html",
            icon: "Editables/car.png",
            keywords: ["sold", "gallery", "recent", "customers"]
        },
        {
            title: "Warranty",
            description: "Warranty programs and coverage",
            link: "warranty.html",
            icon: "Editables/gear.png",
            keywords: ["warranty", "coverage", "service"]
        },
        {
            title: "We Buy Cars",
            description: "Sell your car to us",
            link: "we-buy-cars.html",
            icon: "Editables/support.png",
            keywords: ["sell", "we buy cars", "offer", "valuation"]
        },
        {
            title: "About Us",
            description: "Learn about AutoWise",
            link: "about.html",
            icon: "Editables/selfassesment.png",
            keywords: ["about", "company", "team", "mission"]
        },
        {
            title: "Reviews",
            description: "Customer reviews and testimonials",
            link: "reviews.html",
            icon: "Editables/fire.gif",
            keywords: ["reviews", "testimonials", "feedback"]
        },
        {
            title: "Inventory",
            description: "Browse inventory",
            link: "ai.html",
            icon: "Editables/car.png",
            keywords: ["inventory", "cars", "browse"]
        },
        {
            title: "Support",
            description: "Get help and support",
            link: "support.html",
            icon: "Editables/support.png",
            keywords: ["help", "support", "faq"]
        },
        {
            title: "Settings",
            description: "Account and app settings",
            link: "settings.html",
            icon: "Editables/gear.png",
            keywords: ["settings", "preferences", "account"]
        }
    ]; // <-- Missing closing bracket and semicolon

    function performSearch(query) {
        if (!query.trim()) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        const lowerQuery = query.toLowerCase();

        const results = searchData.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.description.toLowerCase().includes(lowerQuery) ||
            item.keywords.some(keyword =>
                keyword.toLowerCase().includes(lowerQuery)
            )
        );

        displayResults(results);
    }

    function displayResults(results) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No results found';
            searchResults.appendChild(noResults);
        } else {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';

                resultItem.innerHTML = `
                    <img src="${result.icon}" alt="${result.title}" class="result-icon">
                    <div class="result-text">
                        <div class="result-title">${result.title}</div>
                        <div class="result-description">${result.description}</div>
                    </div>
                `;

                resultItem.addEventListener('click', () => {
                    window.location.href = result.link;
                });

                searchResults.appendChild(resultItem);
            });
        }

        searchResults.classList.add('active');
    }

    searchBar.addEventListener('input', () => {
        performSearch(searchBar.value);
    });

    searchBar.addEventListener('focus', () => {
        if (searchBar.value.trim()) {
            performSearch(searchBar.value);
        }
    });

    document.body.addEventListener('click', (e) => {
        const isClickInsideSearchArea =
            searchBar.parentElement.contains(e.target) ||
            searchResults.contains(e.target);

        if (!isClickInsideSearchArea) {
            searchResults.classList.remove('active');
        }
    });

    searchBar.addEventListener('keydown', (e) => {
        const results = searchResults.querySelectorAll('.result-item');
        if (results.length === 0) return;

        let currentIndex = -1;

        results.forEach((result, index) => {
            if (result.classList.contains('highlighted')) {
                currentIndex = index;
                result.classList.remove('highlighted');
            }
        });

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % results.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + results.length) % results.length;
        } else if (e.key === 'Enter') {
            if (currentIndex >= 0) {
                e.preventDefault();
                results[currentIndex].click();
            }
            return;
        } else {
            return;
        }

        results[currentIndex].classList.add('highlighted');
        results[currentIndex].scrollIntoView({
            block: 'nearest'
        });
    });
}