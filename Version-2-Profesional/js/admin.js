const defaultMenu = { categories: [] };
const defaultContent = { brand: {}, contact: {}, footer: {} };
const ALLERGEN_OPTIONS = [
    ['gluten', 'Gluten'],
    ['lacteos', 'Lácteos'],
    ['huevos', 'Huevos'],
    ['cacahuetes', 'Cacahuetes'],
    ['pescado', 'Pescado'],
    ['crustaceos', 'Crustáceos'],
    ['moluscos', 'Moluscos'],
    ['frutos', 'Frutos secos'],
    ['apio', 'Apio'],
    ['mostaza', 'Mostaza'],
    ['sesamo', 'Sésamo'],
    ['soja', 'Soja'],
    ['sulfitos', 'Sulfitos'],
    ['altramuces', 'Altramuces'],
    ['free-alergenos', 'Sin alérgenos']
];

let adminContent = defaultContent;
let adminMenu = defaultMenu;
let selectedCategoryIndex = 0;
let selectedProductPage = 0;
const PRODUCTS_PER_PAGE = 3;
let cloudSaveTimer;
let firebaseReachable = Boolean(window.firebaseDb);

const languageSelect = document.getElementById('adminLanguage');
const contentEditor = document.getElementById('adminContentEditor');
const menuEditor = document.getElementById('adminMenuEditor');
const socialEditor = document.getElementById('adminSocialEditor');
const categorySelect = document.getElementById('adminCategorySelect');
const categoryEditor = document.getElementById('adminCategoryEditor');
const status = document.getElementById('adminStatus');
const passwordForm = document.getElementById('adminPasswordForm');
const passwordStatus = document.getElementById('adminPasswordStatus');

async function loadAdminJson(path, fallback) {
    const firebaseKey = path.includes('content_en') ? 'content-en' : path.includes('menu_en') ? 'menu-en' : path.includes('content') ? 'content-es' : 'menu-es';
    if (!window.firebaseDb) return fallback;
    try {
        const snapshot = await window.firebaseDb.collection('siteData').doc(firebaseKey).get();
        if (snapshot.exists && snapshot.data()?.payload) return snapshot.data().payload;
        console.warn(`No existe el documento siteData/${firebaseKey} en Firebase.`);
    } catch (error) {
        firebaseReachable = false;
        console.warn('No se pudo leer Firebase.', error);
    }
    return fallback;
}

function getPathValue(object, path) {
    return path.split('.').reduce((value, key) => value?.[key], object) || '';
}

function setPathValue(object, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => current[key] ||= {}, object);
    target[lastKey] = value;
}

function syncContactPhoneLink() {
    const telephone = adminContent.contact?.telephone || '';
    adminContent.contact ||= {};
    adminContent.contact.bookUrl = telephone ? `tel:${String(telephone).replace(/[^\d+]/g, '')}` : '';
}

function getCategories() {
    return Array.isArray(adminMenu.categories) ? adminMenu.categories : [];
}

function getCategoryName(category) {
    return category?.nombre || category?.name || '';
}

function getProducts(category) {
    return Array.isArray(category?.productos) ? category.productos : Array.isArray(category?.items) ? category.items : [];
}

function setProductValue(product, field, value) {
    const fieldMap = {
        name: ['name', 'nombre'],
        description: ['description', 'descripcion'],
        price: ['price', 'precio'],
        image: ['image', 'imagen']
    };
    const keys = fieldMap[field] || [field];
    const key = Object.prototype.hasOwnProperty.call(product, keys[0]) ? keys[0] : keys[keys.length - 1];
    product[key] = value;
}

function getProductValue(product, field) {
    const fieldMap = {
        name: ['name', 'nombre'],
        description: ['description', 'descripcion'],
        price: ['price', 'precio'],
        image: ['image', 'imagen']
    };
    return (fieldMap[field] || [field]).map(key => product?.[key]).find(value => value !== undefined) || '';
}

function getProductAllergens(product) {
    const values = product?.alergenos ?? product?.allergens;
    return Array.isArray(values) ? values : [];
}

function getAllergenLabel(value) {
    return ALLERGEN_OPTIONS.find(([optionValue]) => optionValue === value)?.[1] || value;
}

function createAllergenSelect(product, index) {
    const selected = getProductAllergens(product);
    const options = ALLERGEN_OPTIONS
        .filter(([value]) => !selected.includes(value))
        .map(([value, label]) => `<button type="button" class="admin-allergen-option" data-add-allergen data-allergen="${escapeHtml(value)}" data-product-index="${index}"><i class="fas fa-plus"></i>${escapeHtml(label)}</button>`)
        .join('');
    const chips = selected.length
        ? selected.map(value => `<span class="admin-allergen-chip">${escapeHtml(getAllergenLabel(value))}<button type="button" data-remove-allergen="${escapeHtml(value)}" data-product-index="${index}" aria-label="Quitar ${escapeHtml(getAllergenLabel(value))}">&times;</button></span>`).join('')
        : '<span class="admin-allergen-empty">Todavía no hay alérgenos seleccionados.</span>';
    return `<div class="admin-field-wide admin-allergen-field"><span class="admin-field-label">Alérgenos</span><details class="admin-allergen-dropdown"><summary><span><i class="fas fa-plus"></i> Añadir alérgeno</span><i class="fas fa-chevron-down"></i></summary><div class="admin-allergen-options">${options || '<span class="admin-allergen-empty">Todos los alérgenos están añadidos.</span>'}</div></details><div class="admin-allergen-list">${chips}</div></div>`;
}

function createInput(label, value, attributes = '') {
    return `<label>${label}<input value="${escapeHtml(value)}" ${attributes}></label>`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderBusinessForm() {
    document.querySelectorAll('[data-content-field]').forEach(field => {
        const value = getPathValue(adminContent, field.dataset.contentField);
        field.value = value;
    });
}

function renderSocials() {
    const socials = Array.isArray(adminContent.footer?.social) ? adminContent.footer.social : [];
    socialEditor.innerHTML = socials.map((social, index) => `
        <article class="admin-repeat-card">
            <div class="admin-repeat-icon" style="--social-color: ${escapeHtml(social.color || '#e85d04')};"><i class="${escapeHtml(social.icon || 'fas fa-link')}"></i></div>
            <div class="admin-repeat-fields">
                ${createInput('Nombre', social.name, `data-social-field="name" data-social-index="${index}"`)}
                ${createInput('Icono Font Awesome', social.icon, `data-social-field="icon" data-social-index="${index}"`)}
                ${createInput('Enlace', social.url, `data-social-field="url" data-social-index="${index}"`)}
                ${createInput('Color', social.color, `data-social-field="color" data-social-index="${index}" type="text"`)}
            </div>
            <button class="admin-danger-button" type="button" data-remove-social="${index}" aria-label="Eliminar red"><i class="fas fa-trash"></i></button>
        </article>
    `).join('');
}

function renderCategorySelector() {
    const categories = getCategories();
    if (!categories.length) {
        categorySelect.innerHTML = '<option value="">Sin categorías</option>';
        categoryEditor.innerHTML = '<p class="admin-empty-state">Crea una categoría para empezar la carta.</p>';
        return;
    }
    selectedCategoryIndex = Math.min(selectedCategoryIndex, categories.length - 1);
    categorySelect.innerHTML = categories.map((category, index) => `<option value="${index}">${escapeHtml(getCategoryName(category) || `Categoría ${index + 1}`)}</option>`).join('');
    categorySelect.value = String(selectedCategoryIndex);
    renderCategoryEditor();
}

function renderCategoryEditor() {
    const category = getCategories()[selectedCategoryIndex];
    if (!category) return;
    const products = getProducts(category);
    const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
    selectedProductPage = Math.min(selectedProductPage, totalPages - 1);
    const pageStart = selectedProductPage * PRODUCTS_PER_PAGE;
    const visibleProducts = products.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);
    const productMarkup = visibleProducts.map((product, visibleIndex) => {
        const index = pageStart + visibleIndex;
        return `
        <details class="admin-product-card" ${visibleIndex === 0 ? 'open' : ''}>
            <summary class="admin-product-summary">
                <span><strong>${escapeHtml(getProductValue(product, 'name') || `Producto ${index + 1}`)}</strong><small>Producto ${index + 1} · ${escapeHtml(getProductValue(product, 'price'))} €</small></span>
                <i class="fas fa-chevron-down"></i>
            </summary>
            <div class="admin-product-body">
                <div class="admin-product-heading">
                    <strong>Datos del producto</strong>
                    <button class="admin-danger-button" type="button" data-remove-product="${index}"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
                <div class="admin-form-grid">
                ${createInput('Nombre', getProductValue(product, 'name'), `data-product-field="name" data-product-index="${index}"`)}
                ${createInput('Precio', getProductValue(product, 'price'), `data-product-field="price" data-product-index="${index}" type="number" step="0.01"`)}
                <label class="admin-field-wide">Descripción<textarea rows="2" data-product-field="description" data-product-index="${index}">${escapeHtml(getProductValue(product, 'description'))}</textarea></label>
                ${createInput('Imagen', getProductValue(product, 'image'), `data-product-field="image" data-product-index="${index}"`)}
                ${createAllergenSelect(product, index)}
                </div>
            </div>
        </details>
        `;
    }).join('');

    categoryEditor.innerHTML = `
        <div class="admin-category-fields">
            ${createInput('Nombre de la categoría', getCategoryName(category), 'data-category-field="name"')}
            ${createInput('Identificador interno', category.identificador || category.id || '', 'data-category-field="id"')}
        </div>
        <div class="admin-section-heading admin-products-heading">
            <div><h2>Productos <span class="admin-count">${products.length}</span></h2></div>
            <button class="admin-secondary-button" id="adminAddProductButton" type="button"><i class="fas fa-plus"></i> Añadir producto</button>
        </div>
        <div class="admin-product-list">${productMarkup || '<p class="admin-empty-state">Todavía no hay productos en esta categoría.</p>'}</div>
        ${products.length > PRODUCTS_PER_PAGE ? `
            <nav class="admin-pagination" aria-label="Páginas de productos">
                <button class="admin-page-button" type="button" data-product-page="prev" ${selectedProductPage === 0 ? 'disabled' : ''} aria-label="Página anterior"><i class="fas fa-chevron-left"></i></button>
                <span>Página ${selectedProductPage + 1} de ${totalPages}</span>
                <button class="admin-page-button" type="button" data-product-page="next" ${selectedProductPage === totalPages - 1 ? 'disabled' : ''} aria-label="Página siguiente"><i class="fas fa-chevron-right"></i></button>
            </nav>
        ` : ''}
    `;
}

function renderAdvancedEditors() {
    contentEditor.value = JSON.stringify(adminContent, null, 2);
    menuEditor.value = JSON.stringify(adminMenu, null, 2);
}

function renderAll() {
    renderBusinessForm();
    renderSocials();
    renderCategorySelector();
    renderAdvancedEditors();
}

function setStatus(message) {
    status.textContent = message;
}

function setPasswordStatus(message, isError = false) {
    if (!passwordStatus) return;
    passwordStatus.textContent = message;
    passwordStatus.classList.toggle('admin-error', isError);
}

function setSaveState(connected, message) {
    const state = document.getElementById('adminSaveState');
    const text = document.getElementById('adminSaveStateText');
    if (!state || !text) return;
    state.classList.toggle('is-local', !connected);
    state.classList.toggle('is-connected', connected);
    text.textContent = message;
}

async function saveData(silent = false) {
    const language = languageSelect.value;
    const contentPath = language === 'en' ? 'data/content_en.json' : 'data/content.json';
    const menuPath = language === 'en' ? 'data/menu_en.json' : 'data/menu.json';
    renderAdvancedEditors();
    if (silent) {
        clearTimeout(cloudSaveTimer);
        cloudSaveTimer = setTimeout(() => saveData(false), 600);
        setStatus('Guardando cambios...');
        return;
    }

    if (window.firebaseDb) {
        try {
            const firebaseKey = path => path.includes('content_en') ? 'content-en' : path.includes('menu_en') ? 'menu-en' : path.includes('content') ? 'content-es' : 'menu-es';
            await Promise.all([
                window.firebaseDb.collection('siteData').doc(firebaseKey(contentPath)).set({ payload: adminContent, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }),
                window.firebaseDb.collection('siteData').doc(firebaseKey(menuPath)).set({ payload: adminMenu, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() })
            ]);
            setStatus('Cambios guardados en Firebase.');
            firebaseReachable = true;
            setSaveState(true, 'Sincronizado con Firebase');
            return;
        } catch (error) {
            console.error('No se pudieron guardar los cambios en Firebase.', error);
            setStatus('No se pudieron guardar los cambios en Firebase. Revisa las reglas y la sesión.');
            setSaveState(false, 'Firebase necesita revisar sus reglas');
            return;
        }
    }

    setStatus('Firebase no está disponible; no se guardaron los cambios.');
    setSaveState(false, 'Firebase no está disponible');
}

async function loadEditors() {
    const language = languageSelect.value;
    const contentPath = language === 'en' ? 'data/content_en.json' : 'data/content.json';
    const menuPath = language === 'en' ? 'data/menu_en.json' : 'data/menu.json';
    [adminContent, adminMenu] = await Promise.all([
        loadAdminJson(contentPath, defaultContent),
        loadAdminJson(menuPath, defaultMenu)
    ]);
    syncContactPhoneLink();
    selectedCategoryIndex = 0;
    selectedProductPage = 0;
    renderAll();
    setSaveState(firebaseReachable, firebaseReachable ? 'Conectado a Firebase' : 'Firebase no está disponible');
    setStatus(`Editando versión ${language === 'en' ? 'inglesa' : 'española'}.`);
}

function downloadJson(value, filename) {
    const blob = new Blob([value], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(`Descargado ${filename}.`);
}

function setupTabs() {
    document.querySelectorAll('[data-admin-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.adminTab;
            document.querySelectorAll('[data-admin-tab]').forEach(button => button.classList.toggle('active', button === tab));
            document.querySelectorAll('[data-admin-panel]').forEach(panel => {
                const active = panel.dataset.adminPanel === target;
                panel.classList.toggle('active', active);
                panel.hidden = !active;
            });
        });
    });
}

if (!window.firebaseAuth) {
    window.location.replace('../login/');
} else {
    window.firebaseAuth.onAuthStateChanged(user => {
        if (!user) {
            window.location.replace('../login/');
            return;
        }

    setupTabs();
    loadEditors();

    languageSelect.addEventListener('change', loadEditors);
    categorySelect.addEventListener('change', () => {
        selectedCategoryIndex = Number(categorySelect.value);
        selectedProductPage = 0;
        renderCategoryEditor();
    });

    socialEditor.addEventListener('input', event => {
        const field = event.target.dataset.socialField;
        const index = Number(event.target.dataset.socialIndex);
        if (field) {
            adminContent.footer.social[index][field] = event.target.value;
            saveData(true);
        }
    });

    socialEditor.addEventListener('click', event => {
        const button = event.target.closest('[data-remove-social]');
        if (!button) return;
        adminContent.footer.social.splice(Number(button.dataset.removeSocial), 1);
        renderSocials();
        saveData(true);
    });

    document.getElementById('adminAddSocialButton').addEventListener('click', () => {
        adminContent.footer ||= {};
        adminContent.footer.social ||= [];
        adminContent.footer.social.push({ name: 'Nueva red', icon: 'fas fa-link', url: '', color: '#e85d04' });
        renderSocials();
        saveData(true);
    });

    categoryEditor.addEventListener('input', event => {
        const category = getCategories()[selectedCategoryIndex];
        if (!category) return;
        const productIndex = event.target.dataset.productIndex;
        if (event.target.dataset.categoryField === 'name') {
            category[Object.prototype.hasOwnProperty.call(category, 'name') ? 'name' : 'nombre'] = event.target.value;
        }
        if (event.target.dataset.categoryField === 'id') {
            category[Object.prototype.hasOwnProperty.call(category, 'id') ? 'id' : 'identificador'] = event.target.value;
        }
        if (productIndex !== undefined) {
            const product = getProducts(category)[Number(productIndex)];
            const field = event.target.dataset.productField;
            setProductValue(product, field, event.target.value);
        }
        if (event.target.dataset.categoryField === 'name') categorySelect.options[selectedCategoryIndex].textContent = event.target.value || `Categoría ${selectedCategoryIndex + 1}`;
        saveData(true);
    });

    categoryEditor.addEventListener('click', event => {
        const addAllergenButton = event.target.closest('[data-add-allergen]');
        if (addAllergenButton) {
            const category = getCategories()[selectedCategoryIndex];
            const product = getProducts(category)[Number(addAllergenButton.dataset.productIndex)];
            const value = addAllergenButton.dataset.allergen;
            if (product && value) {
                const key = Object.prototype.hasOwnProperty.call(product, 'allergens') ? 'allergens' : 'alergenos';
                const values = getProductAllergens(product);
                if (!values.includes(value)) product[key] = [...values, value];
                renderCategoryEditor();
                saveData(true);
            }
            return;
        }

        const removeAllergenButton = event.target.closest('[data-remove-allergen]');
        if (removeAllergenButton) {
            const category = getCategories()[selectedCategoryIndex];
            const product = getProducts(category)[Number(removeAllergenButton.dataset.productIndex)];
            if (product) {
                const key = Object.prototype.hasOwnProperty.call(product, 'allergens') ? 'allergens' : 'alergenos';
                product[key] = getProductAllergens(product).filter(value => value !== removeAllergenButton.dataset.removeAllergen);
                renderCategoryEditor();
                saveData(true);
            }
            return;
        }

        const removeButton = event.target.closest('[data-remove-product]');
        if (removeButton) {
            getProducts(getCategories()[selectedCategoryIndex]).splice(Number(removeButton.dataset.removeProduct), 1);
            selectedProductPage = Math.min(selectedProductPage, Math.max(0, Math.ceil(getProducts(getCategories()[selectedCategoryIndex]).length / PRODUCTS_PER_PAGE) - 1));
            renderCategoryEditor();
            saveData(true);
        }
        if (event.target.closest('#adminAddProductButton')) {
            const category = getCategories()[selectedCategoryIndex];
            const products = getProducts(category);
            if (!Array.isArray(category.productos)) category.productos = products;
            category.productos.push({ nombre: 'Nuevo producto', descripcion: '', precio: '0.00', alergenos: ['free-alergenos'], imagen: '' });
            selectedProductPage = Math.ceil(products.length / PRODUCTS_PER_PAGE) - 1;
            renderCategoryEditor();
            saveData(true);
        }
        const pageButton = event.target.closest('[data-product-page]');
        if (pageButton && !pageButton.disabled) {
            selectedProductPage += pageButton.dataset.productPage === 'next' ? 1 : -1;
            renderCategoryEditor();
        }
    });

    document.getElementById('adminAddCategoryButton').addEventListener('click', () => {
        adminMenu.categories ||= [];
        adminMenu.categories.push({ identificador: `nueva-categoria-${adminMenu.categories.length + 1}`, nombre: 'Nueva categoría', productos: [] });
        selectedCategoryIndex = adminMenu.categories.length - 1;
        selectedProductPage = 0;
        renderCategorySelector();
        categorySelect.focus();
    });

    document.querySelectorAll('[data-content-field]').forEach(field => {
        field.addEventListener('input', () => {
            setPathValue(adminContent, field.dataset.contentField, field.value);
            if (field.dataset.contentField === 'contact.telephone') syncContactPhoneLink();
            saveData(true);
        });
    });

    document.getElementById('adminSaveButton').addEventListener('click', () => {
        try {
            if (document.querySelector('.admin-advanced[open]')) {
                adminContent = JSON.parse(contentEditor.value);
                adminMenu = JSON.parse(menuEditor.value);
                renderAll();
            }
            saveData(false);
        } catch (error) {
            setStatus(`JSON no válido: ${error.message}`);
        }
    });

    document.getElementById('adminExportButton').addEventListener('click', () => {
        const filename = languageSelect.value === 'en' ? 'content_en.json' : 'content.json';
        downloadJson(JSON.stringify(adminContent, null, 2), filename);
    });

    document.getElementById('adminExportMenuButton').addEventListener('click', () => {
        const filename = languageSelect.value === 'en' ? 'menu_en.json' : 'menu.json';
        downloadJson(JSON.stringify(adminMenu, null, 2), filename);
    });

    document.getElementById('adminLogoutButton').addEventListener('click', () => {
        window.firebaseAuth.signOut().finally(() => window.location.replace('../login/'));
    });

    passwordForm.addEventListener('submit', async event => {
        event.preventDefault();
        const currentPassword = document.getElementById('adminCurrentPassword').value;
        const newPassword = document.getElementById('adminNewPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;
        const user = window.firebaseAuth.currentUser;

        if (newPassword.length < 6) {
            setPasswordStatus('La nueva contraseña debe tener al menos 6 caracteres.', true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordStatus('Las nuevas contraseñas no coinciden.', true);
            return;
        }
        if (!user?.email) {
            setPasswordStatus('No hay una sesión de administrador activa.', true);
            return;
        }

        try {
            setPasswordStatus('Actualizando contraseña...');
            const credential = window.firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            passwordForm.reset();
            setPasswordStatus('Contraseña actualizada correctamente.');
        } catch (error) {
            const messages = {
                'auth/invalid-credential': 'La contraseña actual no es correcta.',
                'auth/wrong-password': 'La contraseña actual no es correcta.',
                'auth/weak-password': 'La nueva contraseña es demasiado débil.',
                'auth/requires-recent-login': 'Vuelve a iniciar sesión y prueba de nuevo.'
            };
            setPasswordStatus(messages[error.code] || 'No se pudo actualizar la contraseña.', true);
            console.error('No se pudo actualizar la contraseña.', error);
        }
    });
    });
}
