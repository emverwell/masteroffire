document.addEventListener("DOMContentLoaded", function () {
  // Get the hash from the URL
  var currentHash = window.location.hash;

  // If the hash is not provided or empty, default to "meats"
  if (!currentHash || currentHash === "") {
    currentHash = "#meats";
  }

  // Remove the 'active' class from all tabs
  var tabs = document.querySelectorAll(".tabs a");
  tabs.forEach(function (tab) {
    tab.classList.remove("active");
  });

  // Add the 'active' class to the tab with the matching hash
  var activeTab = document.querySelector('.tabs a[href="' + currentHash + '"]');
  if (activeTab) {
    activeTab.classList.add("active");
  }

  // Listen for hash changes and update the active tab accordingly
  window.addEventListener("hashchange", function () {
    var newHash = window.location.hash;
    var newActiveTab = document.querySelector(
      '.tabs a[href="' + newHash + '"]'
    );

    // Remove the 'active' class from all tabs
    tabs.forEach(function (tab) {
      tab.classList.remove("active");
    });

    // Add the 'active' class to the new active tab
    if (newActiveTab) {
      newActiveTab.classList.add("active");
    }
    // Hide all menu categories
    var menuCategories = ["meats", "sides", "combos", "specials", "giftcards"];
    menuCategories.forEach(function (category) {
      document.getElementById(category).style.display = "none";
    });

    // Show the selected menu category
    document.getElementById(newHash.substring(1)).style.display = "block";
  });
});

function generateMenu(category, data) {
  var gutterProductHtml = ``;
  var container = document.getElementById(category);

  data.forEach(function (item) {
    var productHtml = `
            <div class="col col-3">
                <div class="vincent_menu1_block_item">
                    <div class="vincent_prod_list_image_cont">
                        <div class="vincent_prod_list_image_wrapper">
                            <div class="vincent_team_overlay"></div>
                            <img src="${item.product_data.img_url}" alt="${item.product_name}">
                            <a class="vincent_add_to_cart_button" href="product.html?id=${item.id}"></a>
                        </div>
                    </div>
                    <h5><a href="product.html?id=${item.id}">${item.product_name}</a></h5>
                    <p class="vincent_prod_list_text">${item.product_data.description}</p>
                    <div class="vincent_prod_list_price"><span>${item.product_data.price}</span></div>
                </div>
            </div>
        `;
    gutterProductHtml += productHtml;
  });
  container.innerHTML = `<div class="row gutters">${gutterProductHtml}</div>`;
}

// Fetch data from the API endpoint
fetch("https://app.themasteroffire.com/backend?destinationUrl=products", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    console.log("API Response:", response);
    return response.json();
  })
  .then((data) => {
    console.log("Parsed JSON Data:", data);
    // Process the fetched data and update the HTML
    const productList = document.getElementById("product-list");
    var groupedItems = {};
    // Group items by category
    data.forEach(function (item) {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });

    console.log;
    // Loop through each category in groupedItems
    for (var category in groupedItems) {
      if (groupedItems.hasOwnProperty(category)) {
        // Generate HTML for the category
        generateMenu(category, groupedItems[category]);
      }
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
