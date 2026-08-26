(function () {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".lang-btn");
    if (!btn) return;

    var lang = btn.getAttribute("data-set-lang");
    var article = document.querySelector(".post-single");
    if (!article) return;

    article.classList.toggle("show-ta", lang === "ta");

    article.querySelectorAll(".lang-btn").forEach(function (b) {
      var active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
  });
})();
