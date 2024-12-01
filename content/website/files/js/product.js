document.addEventListener("DOMContentLoaded", function () {
  // Function to get the value of a parameter from the query string
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // Create a new URLSearchParams object
  const params = new URLSearchParams();

  // Get the string representation of the parameters
  const queryString = params.toString();
  // Get the 'id' parameter from the query string
  var productId = getParameterByName("id");

  // Check if 'id' is present in the query string
  if (productId) {
    // Build the API endpoint with the productId
    // Add parameters to the object
    params.append("destinationUrl", "productDetails");
    params.append("id", productId);
    const queryString = params.toString();
    var apiUrl = "https://app.themasteroffire.com/backend?" + queryString;

    // Now 'encodedUrl' contains the encoded URL
    console.log("Endpoint to be called: ", apiUrl);

    // Fetch data from the API endpoint
    fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Update HTML elements with the fetched data
        document.querySelector(".vincent_single_product_img").innerHTML = `
        <a href="${data.product_data.img_url}" class="swipebox">
            <img src="${data.product_data.img_url}" alt="${data.product_name}">
        </a>        
        `;
        document.querySelector(".vincent_single_product_title").textContent =
          data.product_name;
        document.querySelector(
          ".vincent_single_product_price span"
        ).textContent = data.product_data.price;
        document.querySelector(".vincent_single_product_cont p").textContent =
          data.product_data.description;
        document.querySelector(".vincent_product_meta").innerHTML = `
        <li><span>SKU:</span> ${data.product_data.sku}</li>
        <li><span>Category:</span> ${data.category}</li>        
        `;
        data.product_data.description;
        document.querySelector("#tab1 p").textContent =
          data.product_data.detailed_description;
        document.querySelector("#tab2 .vincent_tab2").innerHTML = `
          <li><span>Weight</span>${data.product_data.weight}</li>
          <li><span>Dimensions</span>${data.product_data.dimensions}</li>
          <li><span>Reheat Instructions</span>${data.product_data.reheat_instructions}</li>
        `;
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        // Redirect to "500.html" on error
        window.location.href = "../500.html";
      });
  } else {
    console.error('No "id" parameter found in the query string.');
  }

  // Add to Cart
  const addToCartForm = document.getElementById("addToCartForm");

  addToCartForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const quantity = document.getElementById("quantity").value;
    const price = document.getElementById("price").value;

    // Replace with your actual cart API endpoint
    const cartApiEndpoint = "https://app.themasteroffire.com/backend?destinationUrl=cart";

    // Make a request to add the product to the cart
    fetch(cartApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: productId,
        quantity: parseInt(quantity, 10),
        priceString: price,
      }),
    })
      .then((response) => {
        if (response.ok) {
          // Redirect to the cart.html page upon success
          window.location.href = "cart.html";
        } else {
          // Handle the error as needed
          console.error("Error adding to cart:", response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error adding to cart:", error.message);
      });
  });
});
