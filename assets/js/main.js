(function () {
  const config = window.MGH_CONFIG || {};
  const products = window.MGH_PRODUCTS || [];

  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

  function createProductCard(product) {
    const contactUrl = `contact.html?product=${encodeURIComponent(product.name)}&form=${encodeURIComponent(product.form)}`;
    const wallpaper = product.wallpaper || product.image;
    return `
      <article class="product-card reveal" style="--product-photo: url('${wallpaper}')" data-category="${product.category}" data-form="${product.form}">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name} ${product.form}">
        </div>
        <div class="product-content">
          <div class="product-meta">
            <span>${product.category}</span>
            <span>${product.form}</span>
          </div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <a class="text-link" href="${contactUrl}">Enquire now</a>
        </div>
      </article>
    `;
  }

  function renderProducts(targetSelector, list) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    target.innerHTML = list.map(createProductCard).join("");
    target.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
  }

  renderProducts("[data-featured-products]", products.filter((product) => product.featured));
  renderProducts("[data-products]", products);

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((chip) => chip.classList.remove("active"));
      button.classList.add("active");

      const filtered = filter === "all"
        ? products
        : products.filter((product) => product.category === filter || product.form.includes(filter));

      renderProducts("[data-products]", filtered);
    });
  });

  const recipientTargets = document.querySelectorAll("[data-recipient-email]");
  recipientTargets.forEach((target) => {
    target.textContent = config.recipientEmail || "Set your email in assets/js/config.js";
  });

  // ==================== EMAILJS CONTACT FORM ====================
  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    const emailjsConfig = config.emailjs || {};
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");
    const form = params.get("form");
    const messageInput = contactForm.elements.message;
    const status = document.querySelector("[data-form-status]");
    const successPopup = document.querySelector("[data-success-popup]");
    const successClose = document.querySelector("[data-success-close]");

    const closeSuccessPopup = () => {
      if (!successPopup) return;
      successPopup.classList.remove("open");
      successPopup.setAttribute("aria-hidden", "true");
    };

    const openSuccessPopup = () => {
      if (!successPopup) return;
      successPopup.classList.add("open");
      successPopup.setAttribute("aria-hidden", "false");
      if (successClose) {
        successClose.focus();
      }
    };

    if (successClose) {
      successClose.addEventListener("click", closeSuccessPopup);
    }

    if (successPopup) {
      successPopup.addEventListener("click", (event) => {
        if (event.target === successPopup) {
          closeSuccessPopup();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeSuccessPopup();
        }
      });
    }

    // Initialize EmailJS with your public key
    if (window.emailjs && emailjsConfig.publicKey) {
      window.emailjs.init({ publicKey: emailjsConfig.publicKey });
    }

    // Prefill message from URL params
    if (product && messageInput) {
      messageInput.value = `I want to enquire about ${product}${form ? ` (${form})` : ""}.\n\n`;
    }

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Validate that EmailJS config exists and is complete
      if (!window.emailjs || !emailjsConfig.publicKey || !emailjsConfig.serviceId || !emailjsConfig.templateId) {
        if (status) {
          status.textContent = "Please add your EmailJS public key, service ID, and template ID in assets/js/config.js.";
          status.classList.add("error");
        }
        return;
      }

      if (status) {
        status.textContent = "Sending enquiry...";
        status.classList.remove("error");
      }

      try {
        await window.emailjs.sendForm(
          emailjsConfig.serviceId,
          emailjsConfig.templateId,
          contactForm
        );

        if (status) {
          status.textContent = "";
        }
        openSuccessPopup();
        contactForm.reset();
      } catch (error) {
        console.error("EmailJS error:", error);
        if (status) {
          status.textContent = "Unable to send enquiry right now. Please try again.";
          status.classList.add("error");
        }
      }
    });
  }
}());