function renderMenu(type) {
  fetch(`${type}.html`)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(type).innerHTML = data;
    });
}

// Using a common header
renderMenu("menu-header");

// Using a common footer
renderMenu("menu-footer");
