const defaultMenu = {
    categories: []
};

const defaultContent = {
    brand: {
        logo: '',
        logoImage: '',
        companyName: '',
        location: '',
        heroImage: '',
        heroEyebrow: '',
        heroTitle: '',
        heroText: '',
        heroButtons: []
    },
    contact: {
        heading: '',
        description: '',
        logoImage: '',
        companyName: '',
        address: '',
        hours: '',
        email: '',
        telephone: '',
        reviewUrl: '',
        bookUrl: '',
        social: [],
        labels: {
            address: '',
            hours: '',
            email: ''
        },
        buttons: {
            review: '',
            book: ''
        }
    },
    home: {
        heading: '',
        description: '',
        logoImage: '',
        companyName: '',
        blocks: []
    },
    footer: {
        text: '',
        socialTitle: '',
        social: []
    }
};

const allergenIconMap = {
    "🌾": "gluten",
    "🥛": "lacteos",
    "🥚": "huevos",
    "🥜": "cacahuetes",
    "🐟": "pescado",
    "🦐": "crustaceos",
    "🌰": "frutos",
    "🍤": "crustaceos",
    "🥬": "apio",
    "🍞": "gluten",
    "🍯": "mostaza",
    "🌶": "sulfitos",
    "🐄": "lacteos",
    "🥑": "frutos",
    "gluten": "gluten",
    "lacteos": "lacteos",
    "huevos": "huevos",
    "cacahuetes": "cacahuetes",
    "pescado": "pescado",
    "crustaceos": "crustaceos",
    "moluscos": "moluscos",
    "frutos": "frutos",
    "apio": "apio",
    "mostaza": "mostaza",
    "sulfitos": "sulfitos",
    "sesamo": "sesamo",
    "soja": "soja",
    "altramuces": "altramuces",
    "free-alergenos": "free-alergenos",
    "libre": "free-alergenos",
    "sin alergenos": "free-alergenos",
    "sin alergenos": "free-alergenos",
    "sin alérgenos": "free-alergenos"
};

function resolveAllergenIconName(allergen) {
    if (!allergen) return null;
    const normalized = String(allergen)
        .trim()
        .toLowerCase()
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n');

    return allergenIconMap[normalized] || allergenIconMap[allergen] || null;
}

async function loadJson(path, fallback) {
    try {
        const response = await fetch(path);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn(`No se pudo cargar ${path}, usando datos internos.`);
    }
    return fallback;
}

async function init() {
    const rawMenuData = await loadJson('data/menu.json', defaultMenu);
    const menuData = normalizeMenu(rawMenuData);
    const rawContent = await loadJson('data/content.json', defaultContent);
    const contentData = normalizeContent(rawContent);

    document.title = contentData.pageTitle || contentData.brand?.heroTitle || 'Carta Digital';
    renderHero(contentData.brand);
    renderMenu(menuData.categories, contentData);
    renderFooter(contentData);
    setupImageModal();
}

function normalizeMenu(menu) {
    if (!menu || !Array.isArray(menu.categories)) {
        return { categories: [] };
    }

    return {
        categories: menu.categories.map(category => ({
            id: category.id || category.identificador || '',
            name: category.name || category.nombre || '',
            items: Array.isArray(category.items ? category.items : category.productos)
                ? (category.items || category.productos).map(item => ({
                    name: item.name || item.nombre || '',
                    description: item.description || item.descripcion || '',
                    price: item.price || item.precio || '',
                    allergens: item.allergens || item.alergenos || [],
                    image: item.image || item.imagen || ''
                }))
                : []
        }))
    };
}

function normalizeContent(content) {
    const brand = content.brand || content.marca || {};
    const contact = content.contact || content.contacto || {};
    const home = content.home || content.inicio || {};
    const footer = content.footer || content.pie || {};

    return {
        pageTitle: content.pageTitle || content.tituloPagina || '',
        brand: {
            logo: brand.logo,
            logoImage: brand.logoImage || brand.logoImagen,
            companyName: brand.companyName || brand.nombreEmpresa,
            location: brand.location || brand.ubicacion,
            heroImage: brand.heroImage || brand.imagenHero,
            heroEyebrow: brand.heroEyebrow || brand.subtituloHero,
            heroTitle: brand.heroTitle || brand.tituloHero,
            heroText: brand.heroText || brand.textoHero,
            heroButtons: brand.heroButtons || brand.botonesHero || []
        },
        contact: {
            heading: contact.heading || contact.encabezado,
            description: contact.description || contact.descripcion,
            logoImage: contact.logoImage || contact.logoImagen,
            companyName: contact.companyName || contact.nombreEmpresa,
            address: contact.address || contact.direccion,
            hours: contact.hours || contact.horario,
            email: contact.email || contact.correo,
            telephone: contact.telephone || contact.telefono,
            reviewUrl: contact.reviewUrl || contact.urlResenas,
            bookUrl: contact.bookUrl || contact.urlReserva || contact.urlReservar,
            social: contact.social || contact.redes || [],
            labels: {
                address: contact.labels?.address || contact.labels?.direccion,
                hours: contact.labels?.hours || contact.labels?.horario,
                email: contact.labels?.email || contact.labels?.correo
            },
            buttons: {
                review: contact.buttons?.review || contact.buttons?.reseña,
                book: contact.buttons?.book || contact.buttons?.reservar
            }
        },
        home: {
            heading: home.heading || home.encabezado,
            description: home.description || home.descripcion,
            logoImage: home.logoImage || home.logoImagen || contact.logoImage || contact.logoImagen || brand.logoImage || brand.logoImagen,
            companyName: home.companyName || home.nombreEmpresa || contact.companyName || contact.nombreEmpresa || brand.companyName || brand.nombreEmpresa,
            blocks: Array.isArray(home.blocks)
                ? home.blocks
                : Array.isArray(home.bloques)
                    ? home.bloques.map(block => ({
                        icon: block.icon || block.icono || '',
                        title: block.title || block.titulo || '',
                        text: block.text || block.texto || ''
                    }))
                    : []
        },
        footer: {
            text: footer.text || footer.texto,
            socialTitle: footer.socialTitle || footer.tituloRedes,
            social: footer.social || footer.redes || []
        }
    };
}

function renderHero(brand) {
    const heroBanner = document.getElementById('heroBanner');
    const logo = document.getElementById('brandLogo');
    const company = document.getElementById('brandCompany');
    const location = document.getElementById('brandLocation');
    const eyebrow = document.getElementById('heroEyebrow');
    const title = document.getElementById('heroTitle');
    const heroText = document.getElementById('heroText');
    const actions = document.getElementById('heroActions');

    if (heroBanner) heroBanner.style.backgroundImage = `linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.45)), url('${brand.heroImage}')`;
    if (logo) {
        if (brand.logoImage) {
            logo.innerHTML = `<img src="${brand.logoImage}" alt="${brand.companyName || 'Logo'}">`;
        } else {
            logo.textContent = brand.logo || '';
        }
    }
    if (company) company.textContent = brand.companyName || '';
    if (location) location.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${brand.location}`;
    if (eyebrow) eyebrow.textContent = brand.heroEyebrow;
    if (title) title.textContent = brand.heroTitle;
    if (heroText) heroText.textContent = brand.heroText;

    if (actions) {
        actions.innerHTML = '';
        brand.heroButtons.forEach(button => {
            const anchor = document.createElement('a');
            anchor.href = button.url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.className = 'btn-action btn-hero';
            anchor.innerHTML = `<i class="${button.icon}"></i> ${button.label}`;
            actions.appendChild(anchor);
        });
    }
}

function renderMenu(categories, content) {
    const navContainer = document.getElementById('categoryNav');
    const menuContainer = document.getElementById('menuContainer');
    const contact = content.contact || {};
    const home = content.home || {};

    navContainer.innerHTML = '';
    menuContainer.innerHTML = '';

    const sections = [
        { id: 'inicio', name: 'Inicio', isHome: true },
        ...categories,
        { id: 'contacto', name: 'Contacto', isContact: true }
    ];

    sections.forEach((sectionData, index) => {
        const btn = document.createElement('a');
        btn.href = `#${sectionData.id}`;
        btn.className = `cat-btn ${sectionData.isHome ? 'home-btn' : ''} ${sectionData.isContact ? 'home-btn' : ''} ${index === 0 ? 'active' : ''}`;
        btn.textContent = sectionData.name;
        btn.addEventListener('click', event => {
            event.preventDefault();
            activateSection(sectionData.id);
            scrollNavButtonIntoView(btn);
        });
        navContainer.appendChild(btn);

        const section = document.createElement('section');
        section.id = sectionData.id;
        section.className = `category-section ${index !== 0 ? 'hidden-section' : ''}`;

        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = sectionData.name;
        section.appendChild(title);

        if (sectionData.isHome) {
            section.innerHTML += renderHomeSection(home);
        } else if (sectionData.isContact) {
            section.innerHTML += renderContactSection(contact);
        } else {
            const grid = document.createElement('div');
            grid.className = 'product-grid';

            sectionData.items.forEach(item => {
                const card = document.createElement('article');
                card.className = 'product-card';

                const allergens = Array.isArray(item.alergenos) ? item.alergenos : [];
                const displayAllergens = allergens.length ? allergens : ['libre'];
                const allergensHtml = displayAllergens
                    .filter(allergen => Boolean(allergen && String(allergen).trim()))
                    .map(a => {
                        const iconName = resolveAllergenIconName(a);
                        if (iconName) {
                            return `<span class="allergen-icon" title="Alérgeno ${a}"><img src="images/alergenos/${iconName}.png" alt="${iconName}" loading="lazy"></span>`;
                        }
                        return `<span class="allergen-icon" title="Alérgeno">${a}</span>`;
                    })
                    .join('');

                card.innerHTML = `
                    <div class="product-image" style="background-image:url('${item.image}')"></div>
                    <div class="product-info">
                        <div class="product-header">
                            <h3 class="product-title">${item.name}</h3>
                            <span class="product-price">${item.price}€</span>
                        </div>
                        <p class="product-desc">${item.description}</p>
                        <div class="allergens">${allergensHtml}</div>
                    </div>
                `;

                const imageDiv = card.querySelector('.product-image');
                if (imageDiv) {
                    imageDiv.style.cursor = 'zoom-in';
                    imageDiv.addEventListener('click', () => openImageModal(item.image, item.name));
                }

                grid.appendChild(card);
            });

            section.appendChild(grid);
        }

        menuContainer.appendChild(section);
    });
}

function activateSection(activeId) {
    document.querySelectorAll('.category-section').forEach(section => {
        const isActive = section.id === activeId;
        section.classList.toggle('hidden-section', !isActive);
        section.classList.toggle('fade-in', isActive);
    });
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const isActive = btn.getAttribute('href') === `#${activeId}`;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            scrollNavButtonIntoView(btn);
        }
    });
    scrollToTop();
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollNavButtonIntoView(button) {
    if (!button || !button.scrollIntoView) return;
    button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function renderHomeSection(home) {
    const blocks = Array.isArray(home.blocks) && home.blocks.length > 0 ? home.blocks : [];
    const blocksHtml = blocks.map(block => `
                    <article class="contact-info-card">
                        <span class="contact-info-icon">${block.icon || '✨'}</span>
                        <div>
                            <strong>${block.title || 'Título'}</strong>
                            <p>${block.text || 'Descripción del bloque.'}</p>
                        </div>
                    </article>
                `).join('');

    return `
        <div class="contact-grid">
            <div class="contact-card contact-main-card">
                <div class="contact-logo-block">
                    <div class="contact-logo">
                        ${home.logoImage ? `<img src="${home.logoImage}" alt="${home.companyName} logo" />` : ''}
                    </div>
                    <h2>${home.heading || ''}</h2>
                    <p class="contact-description">${home.description || ''}</p>
                </div>
                <div class="contact-info-grid">
                    ${blocksHtml}
                </div>
            </div>
        </div>
    `;
}

function renderContactSection(contact) {
    return `
        <div class="contact-grid">
            <div class="contact-card contact-main-card">
                <div class="contact-logo-block">
                    <div class="contact-logo">
                        ${contact.logoImage ? `<img src="${contact.logoImage}" alt="${contact.companyName} logo" />` : ''}
                    </div>
                    <h2>${contact.companyName || ''}</h2>
                    <p class="contact-description">${contact.description || ''}</p>
                </div>
                <div class="contact-info-grid">
                    <article class="contact-info-card">
                        <span class="contact-info-icon">📍</span>
                        <div>
                            <strong>${contact.labels.address || ''}</strong>
                            <p>${contact.address}</p>
                        </div>
                    </article>
                    <article class="contact-info-card">
                        <span class="contact-info-icon">⏰</span>
                        <div>
                            <strong>${contact.labels.hours || ''}</strong>
                            <p>${contact.hours}</p>
                        </div>
                    </article>
                    <article class="contact-info-card">
                        <span class="contact-info-icon">📧</span>
                        <div>
                            <strong>${contact.labels.email || ''}</strong>
                            <p><a href="mailto:${contact.email}">${contact.email}</a></p>
                        </div>
                    </article>
                </div>
                <div class="contact-actions contact-actions-large">
                    <a href="${contact.reviewUrl}" target="_blank" rel="noopener noreferrer" class="btn-action btn-hero"><i class="fas fa-star"></i> ${contact.buttons.review || ''}</a>
                    <a href="${contact.bookUrl}" class="btn-action btn-contact-simple"><i class="fas fa-phone"></i> ${contact.buttons.book || ''}</a>
                </div>
            </div>
        </div>
    `;
}

function setupImageModal() {
    const modal = document.getElementById('imageModal');
    const closeButton = document.getElementById('modalClose');

    if (!modal || !closeButton) return;

    closeButton.addEventListener('click', closeImageModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeImageModal();
        }
    });
}

function openImageModal(src, alt) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    if (!modal || !modalImage) return;

    modalImage.src = src;
    modalImage.alt = alt;
    modal.classList.add('open');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    if (!modal || !modalImage) return;

    modal.classList.remove('open');
    modalImage.src = '';
}

function renderFooter(content) {
    const footerCopy = document.getElementById('footerCopy');
    const footerSocial = document.getElementById('footerSocial');
    const footerSocialLabel = document.getElementById('footerSocialLabel');
    const copyText = content.footer?.text || content.contact?.footerNote || 'Diseñado y desarrollado por ByRuby12 - V4.0.0. Copyright ©2026 Derechos reservados para Bohio Bar.';
    if (footerCopy) footerCopy.textContent = copyText;
    if (footerSocialLabel) footerSocialLabel.textContent = content.footer?.socialTitle || 'Redes sociales';

    const socialLinks = content.footer?.social?.length ? content.footer.social : content.contact?.social || [];
    if (footerSocial) {
        footerSocial.innerHTML = socialLinks.map(link => {
            const color = link.color || getBrandColor(link.name);
            return `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="${link.name}" style="--social-color: ${color};">
                    <i class="${link.icon}"></i>
                </a>
            `;
        }).join('');
    }
}

function getBrandColor(name) {
    const brandColors = {
        instagram: '#E4405F',
        whatsapp: '#25D366',
        google: '#4285F4',
        facebook: '#1877F2',
        twitter: '#1DA1F2',
        tiktok: '#000000',
        youtube: '#FF0000'
    };
    return brandColors[name?.toLowerCase()] || '#e85d04';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.contains('dark-mode')
        ? document.getElementById('theme-icon').classList.replace('fa-moon', 'fa-sun')
        : document.getElementById('theme-icon').classList.replace('fa-sun', 'fa-moon');
}

window.onload = init;