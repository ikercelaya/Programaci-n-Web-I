let appState = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')) || null,
    socket: null,
    editingProductId: null 
};

function saveAuthState(token, user) {
    appState.token = token;
    appState.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthState() {
    appState.token = null;
    appState.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

async function fetchWithAuth(url, options = {}) {
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (appState.token) {
        headers['Authorization'] = `Bearer ${appState.token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
        console.error('Error de autenticación. Deslogueando.');
        displayFeedback('login-error', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
        handleLogout();
        throw new Error('Autenticación fallida');
    }
    return response;
}

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function displayFeedback(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `feedback-message ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 5000); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
    
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html')) {
        initIndexPage();
    } else if (path.includes('chat.html')) {
        initChatPage();
    }
});

function setupNavbar() {
    const guestNav = document.getElementById('guest-nav');
    const userNav = document.getElementById('user-nav');
    const chatLink = document.getElementById('chat-link');
    const logoutBtn = document.getElementById('logout-btn');

    if (appState.token && appState.user) {
        guestNav.style.display = 'none';
        userNav.style.display = 'flex';
        chatLink.style.display = 'block';
        document.getElementById('welcome-msg').textContent = `Hola, ${appState.user.email} (${appState.user.role})`;
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        guestNav.style.display = 'flex';
        userNav.style.display = 'none';
        chatLink.style.display = 'none';
        
        const showLoginBtn = document.getElementById('show-login-btn');
        const showRegisterBtn = document.getElementById('show-register-btn');
        if (showLoginBtn && showRegisterBtn) {
            showLoginBtn.addEventListener('click', () => showAuthView('login-view'));
            showRegisterBtn.addEventListener('click', () => showAuthView('register-view'));
        }
    }
}

function handleLogout() {
    clearAuthState();
    if (appState.socket) {
        appState.socket.disconnect();
    }
    window.location.href = '/';
}

function initIndexPage() {
    const authPage = document.getElementById('auth-page');
    const productsPage = document.getElementById('products-page');
    
    if (appState.token && appState.user) {
        authPage.style.display = 'none';
        productsPage.style.display = 'block';
        setupProductsPage();
    } else {
        authPage.style.display = 'flex';
        productsPage.style.display = 'none';
        setupAuthForms();
    }
}

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    document.getElementById('auth-switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        showAuthView('register-view');
    });
    document.getElementById('auth-switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showAuthView('login-view');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg || 'Error al iniciar sesión');
            }
            const data = await response.json();
            saveAuthState(data.token, data.user);
            window.location.reload();
        } catch (err) {
            displayFeedback('login-error', err.message, 'error');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg || 'Error al registrar');
            }
            displayFeedback('register-success', '¡Registro exitoso! Por favor, inicia sesión.', 'success');
            showAuthView('login-view');
        } catch (err) {
            displayFeedback('register-error', err.message, 'error');
        }
    });

    showAuthView('login-view');
}

function showAuthView(viewId) {
    document.getElementById('login-view').style.display = (viewId === 'login-view') ? 'block' : 'none';
    document.getElementById('register-view').style.display = (viewId === 'register-view') ? 'block' : 'none';
}

function setupProductsPage() {
    const adminPanel = document.getElementById('admin-panel');
    
    if (appState.user.role === 'admin') {
        adminPanel.style.display = 'block';
        setupAdminPanel();
    }
    loadProducts();
}

function setupAdminPanel() {
    const toggleBtn = document.getElementById('admin-toggle-btn');
    const formContainer = document.getElementById('admin-form-container');
    const icon = toggleBtn.querySelector('i.toggle-icon');

    toggleBtn.addEventListener('click', () => {
        if (formContainer.style.display === 'none') {
            formContainer.style.display = 'block';
            toggleBtn.classList.remove('collapsed');
            icon.style.transform = 'rotate(0deg)';
        } else {
            formContainer.style.display = 'none';
            toggleBtn.classList.add('collapsed');
            icon.style.transform = 'rotate(-90deg)';
        }
    });

    setupProductForm();
}

async function loadProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '<p class="feedback-message">Cargando productos...</p>';
    try {
        const response = await fetchWithAuth('/api/products');
        const products = await response.json();
        productList.innerHTML = ''; 
        if (products.length === 0) {
            productList.innerHTML = '<p class"feedback-message">No hay productos para mostrar.</p>';
            return;
        }
        products.forEach(product => {
            const li = document.createElement('li');
            li.className = 'product-card'; 
            
            const imageUrl = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/300?text=Sin+Imagen';
            li.innerHTML = `
                <div class="product-card-image">
                    <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(product.name)}">
                </div>
                <div class="product-card-content">
                    <strong>${escapeHTML(product.name)}</strong>
                    <div class="price-stock">
                        $${product.price}
                        <span>${product.stock} en stock</span>
                    </div>
                    <p>${escapeHTML(product.description)}</p>
                    <div class="product-card-actions">
                        ${appState.user.role === 'admin' ? `
                            <button class="btn btn-warning edit-btn" data-id="${product._id}"><i class="fas fa-edit"></i> Editar</button>
                            <button class="btn btn-danger delete-btn" data-id="${product._id}"><i class="fas fa-trash-alt"></i> Eliminar</button>
                        ` : ''}
                    </div>
                </div>
            `;
            productList.appendChild(li);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const product = products.find(p => p._id === btn.dataset.id);
                populateProductForm(product);
            });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });

    } catch (error) {
        productList.innerHTML = `<p class="feedback-message error">Error al cargar productos: ${error.message}</p>`;
    }
}

function setupProductForm() {
    const form = document.getElementById('product-form');
    const productImageInput = document.getElementById('product-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const clearImageBtn = document.getElementById('clear-image-btn');

    productImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imagePreviewContainer.style.display = 'none';
            imagePreview.src = '#';
        }
    });

    clearImageBtn.addEventListener('click', () => {
        productImageInput.value = ''; 
        imagePreview.src = '#';
        imagePreviewContainer.style.display = 'none';
        if (appState.editingProductId) {
            form.dataset.clearImage = 'true'; 
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = appState.editingProductId; 
        
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('description', document.getElementById('product-desc').value);
        formData.append('price', parseFloat(document.getElementById('product-price').value));
        formData.append('stock', parseInt(document.getElementById('product-stock').value));
        
        const productImage = document.getElementById('product-image').files[0];
        if (productImage) {
            formData.append('productImage', productImage);
        } else if (form.dataset.clearImage === 'true') {
            formData.append('clearImage', 'true');
        }

        const url = id ? `/api/products/${id}` : '/api/products';
        const method = id ? 'PUT' : 'POST';

        try {
            const response = await fetchWithAuth(url, { method, body: formData });
            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg);
            }
            resetProductForm();
            loadProducts(); 
            displayFeedback('product-form-success', id ? 'Producto actualizado con éxito!' : 'Producto creado con éxito!', 'success');
        } catch (error) {
            displayFeedback('product-form-error', `Error al guardar producto: ${error.message}`, 'error');
        }
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', resetProductForm);
    resetProductForm();
}

function populateProductForm(product) {
    appState.editingProductId = product._id; 
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-desc').value = product.description;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    
    if (product.imageUrl) {
        document.getElementById('image-preview').src = product.imageUrl;
        document.getElementById('image-preview-container').style.display = 'block';
    } else {
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('image-preview').src = '#';
    }
    document.getElementById('product-image').value = '';
    document.getElementById('product-form').dataset.clearImage = 'false';

    document.getElementById('form-title').textContent = 'Editar Producto';
    document.getElementById('submit-product-btn').innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    
    const formContainer = document.getElementById('admin-form-container');
    if (formContainer.style.display === 'none') {
        document.getElementById('admin-toggle-btn').click();
    }
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function resetProductForm() {
    appState.editingProductId = null; 
    document.getElementById('product-form').reset();
    document.getElementById('form-title').textContent = 'Añadir Nuevo Producto';
    document.getElementById('submit-product-btn').innerHTML = '<i class="fas fa-plus-circle"></i> Crear Producto';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    document.getElementById('image-preview').src = '#';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('product-form').dataset.clearImage = 'false';
    document.getElementById('product-form-error').style.display = 'none';
    document.getElementById('product-form-success').style.display = 'none';
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    try {
        await fetchWithAuth(`/api/products/${id}`, { method: 'DELETE' });
        loadProducts(); 
    } catch (error) {
        alert(`Error al eliminar producto: ${error.message}`);
    }
}

function initChatPage() {
    if (!appState.token || !appState.user) {
        alert('Necesitas iniciar sesión para acceder al chat.');
        window.location.href = '/';
        return;
    }
    
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    appState.socket = io({ auth: { token: appState.token } });

    appState.socket.on('connect_error', (err) => {
        console.error(err.message);
        alert(`Error de conexión al chat: ${err.message}. Redirigiendo a login.`);
        handleLogout();
    });

    appState.socket.on('connect', () => {
        console.log('Conectado al chat con ID:', appState.socket.id);
    });
    
    appState.socket.on('chat history', (messages) => {
        const messagesUl = document.getElementById('messages');
        messagesUl.innerHTML = ''; 
        messages.forEach(msg => {
            addMessageToList(msg.message, msg.user);
        });
        document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;
    });

    appState.socket.on('chat message', (data) => {
        addMessageToList(data.message, data.user);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value.trim()) { 
            appState.socket.emit('chat message', input.value.trim());
            input.value = '';
        }
    });
}

function addMessageToList(message, user) {
    const messages = document.getElementById('messages');
    if (!messages) return; 

    const item = document.createElement('li');
    const userEmail = appState.user ? appState.user.email : null;

    if (user === 'Sistema') {
        item.classList.add('message-system');
        item.textContent = escapeHTML(message);
    } else {
        item.innerHTML = `<strong>${escapeHTML(user === userEmail ? 'Tú' : user)}</strong> ${escapeHTML(message)}`;
        if (user === userEmail) {
            item.classList.add('message-self');
        }
    }
    messages.appendChild(item);
    messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
}