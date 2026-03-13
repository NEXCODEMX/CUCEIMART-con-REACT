const businessesData = [
    {
        id: "sanza-art",
        name: "SANZA ART",
        description: "Cuadros Personalizados Artisticos.",
        category: ["decoraciones", "regalos"],
        icon: "fas fa-image",
        price: "Desde $250 MXN",
        url: "https://nexcodemx.github.io/SanzaArt/SanzaArt.html",
        image: "img/negocio1.jpg",
        whatsapp: "523343408028",
        instagram: "https://www.instagram.com/sanza.art/",
        website: "https://nexcodemx.github.io/SanzaArt/SanzaArt.html",
        mapX: 0.78, 
        mapY: 0.40, 
        isFeatured: true,
        buildingId: "U", 
        zoneId: "lab_ingenierias"
    },
    {
        id: "papeleria-ejemplo",
        name: "Papeleria ejemplo",
        description: "Servicio de impresiones, copias, engargolados y material escolar. Rápido y económico.",
        category: "servicios",
        icon: "fas fa-print",
        price: "Desde $0.20 MXN",
        url: "copymax-express.html",
        image: "img/negocio2.jpg",
        whatsapp: "523312345678",
        instagram: "",
        website: "",
        mapX: 0.35, 
        mapY: 0.70,
        isFeatured: false,
        buildingId: "A",
        zoneId: "papelerias"
    },
    {
        id: "nexcode",
        name: "NEXCODE",
        description: "Plataforma de cursos en línea con variedad de temas y rutas de aprendizaje para potenciar tus habilidades.",
        category: "educación",
        icon: "fas fa-laptop-code",
        price: "Acceso Gratuito",
        url: "https://nexcodemx.github.io/NEXCODE/",
        image: "img/negocio10.jpg",
        whatsapp: "523343408028",
        instagram: "@NexCode_MX",
        website: "https://nexcodemx.github.io/NEXCODE/",
        mapX: undefined, 
        mapY: undefined, 
        isFeatured: true,
        buildingId: undefined,
        zoneId: undefined
    },
];
window.businessesData = businessesData;
let currentBusinesses = [...businessesData];
let currentCategory = 'todos';
let currentSearch = '';

function renderBusinesses(businesses) {
    const grid = document.getElementById('businessesGrid');
    if (!grid) return; 

    grid.innerHTML = '';
    businesses.forEach(business => {
        const card = document.createElement('div');
        card.className = 'business-card';
        card.onclick = () => window.location.href = business.url;
        card.innerHTML = `
            <div class="business-image">
                <img src="${business.image}" alt="${business.name}" />
            </div>
            <h3 class="business-name">${business.name}</h3>
            <p class="business-description">${business.description}</p>
            <div class="business-category">
                <i class="${business.icon}"></i>
                <span>${
                  Array.isArray(business.category)
                    ? business.category.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)).join(', ')
                    : business.category.charAt(0).toUpperCase() + business.category.slice(1)
                }</span>
            </div>
            <div style="font-weight: bold; color: #667eea; margin-bottom: 1rem;">${business.price}</div>
            <button class="business-btn">
                <i class="fas fa-external-link-alt"></i> Ver Negocio
            </button>
        `;
        grid.appendChild(card);
    });

    if (businesses.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-primary);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;"></i>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda o categoría</p>
            </div>
        `;
    }
}
function filterBusinesses() {
    let filtered = businessesData;
    if (currentCategory !== 'todos') {
        filtered = filtered.filter(business => {
          if (Array.isArray(business.category)) {
              return business.category.includes(currentCategory);
          } else {
              return business.category === currentCategory;
          }
      });

    }
    if (currentSearch) {
        filtered = filtered.filter(business =>
            business.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            business.description.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (Array.isArray(business.category) ? business.category.join(' ').toLowerCase() : business.category.toLowerCase()).includes(currentSearch.toLowerCase())
        );
    }
    currentBusinesses = filtered;
    renderBusinesses(currentBusinesses);
}
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            filterBusinesses();
        });
    }
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterBusinesses();
        });
    });
}
function toggleNotifications() {
    const popup = document.getElementById('notificationPopup');
    if (popup) {
        popup.classList.toggle('show');
        if (popup.classList.contains('show')) {
            setTimeout(() => {
                document.addEventListener('click', function closeNotifications(e) {
                    if (!popup.contains(e.target) && !e.target.closest('.nav-icon')) {
                        popup.classList.remove('show');
                        document.removeEventListener('click', closeNotifications);
                    }
                });
            }, 100);
        }
    }
}
function initBannerRotation() {
    const slides = document.querySelectorAll('.banner-slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 4000);
    }
}

class PaletteManager {
    constructor() {
        this.currentPalette = this.getPaletteFromStorage() || 'ocean';
        this.init();
    }
    init() {
        this.applyPalette(this.currentPalette);
        this.updateActiveOption();
    }
    changePalette(paletteName) {
        this.currentPalette = paletteName;
        this.applyPalette(paletteName);
        this.savePaletteToStorage(paletteName);
        this.updateActiveOption();
        setTimeout(() => {
            this.closePalette();
        }, 300);
        this.showPaletteNotification(paletteName);
    }
    applyPalette(paletteName) {
        document.documentElement.setAttribute('data-palette', paletteName);
    }
    updateActiveOption() {
        const paletteOptions = document.querySelectorAll('.palette-option');
        if (paletteOptions.length > 0) {
            paletteOptions.forEach(option => {
                option.classList.remove('active');
            });
            const activeOption = document.querySelector(`[data-palette="${this.currentPalette}"]`);
            if (activeOption) {
                activeOption.classList.add('active');
            }
        }
    }
    togglePalette() {
        const popup = document.getElementById('palettePopup');
        if (popup) {
            popup.classList.toggle('show');
            if (popup.classList.contains('show')) {
                document.addEventListener('click', this.handleClickOutside.bind(this));
            } else {
                document.removeEventListener('click', this.handleClickOutside.bind(this));
            }
        }
    }
    closePalette() {
        const popup = document.getElementById('palettePopup');
        if (popup) {
            popup.classList.remove('show');
            document.removeEventListener('click', this.handleClickOutside.bind(this));
        }
    }
    handleClickOutside(e) {
        const popup = document.getElementById('palettePopup');
        const trigger = document.querySelector('.palette-trigger');

        if (popup && trigger && !popup.contains(e.target) && !trigger.contains(e.target)) {
            this.closePalette();
        }
    }
    savePaletteToStorage(paletteName) {
        try {
            localStorage.setItem('cuceimart_palette', paletteName);
        } catch (error) {
            console.error('Error al guardar la paleta en localStorage:', error);
        }
    }
    getPaletteFromStorage() {
        try {
            return localStorage.getItem('cuceimart_palette');
        } catch (error) {
            console.error('Error al recuperar la paleta de localStorage:', error);
            return null;
        }
    }
    showPaletteNotification(paletteName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--background-overlay);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            color: var(--text-primary);
            font-weight: 500;
            animation: fadeInUp 0.3s ease;
        `;
        const paletteNames = {
            ocean: 'Océano', trust: 'Marino', forest: 'Bosque', neon: 'Neón', dark: 'Oscuro',
            royal: 'Violeta', rosenight: 'Rosal', greenroots: 'Eco', yellow: 'Ámbar', red: 'Carmesí'
        };
        notification.innerHTML = `
            <i class="fas fa-palette" style="margin-right: 0.5rem; color: var(--primary-start);"></i>
            Paleta cambiada a: <strong>${paletteNames[paletteName]}</strong>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

window.paletteManagerInstance = new PaletteManager();

window.togglePalette = function() {
    if (window.paletteManagerInstance) {
        window.paletteManagerInstance.togglePalette();
    }
};

window.changePalette = function(paletteName) {
    if (window.paletteManagerInstance) {
        window.paletteManagerInstance.changePalette(paletteName);
    }
};


const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(styleSheet);


// --- FUNCIONES DEL CHATBOT ---
const chatBtn = document.getElementById('chat-btn');
const chatContainer = document.getElementById('chat-container');
const chatClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatOptions = document.getElementById('chat-options');
let conversationState = "start";

function getBusinessCategories() {
    const categories = new Set();
    const excludedCategories = ["educación"];

    businessesData.forEach(business => {
        if (Array.isArray(business.category)) {
            business.category.forEach(cat => {
                if (!excludedCategories.includes(cat)) {
                    categories.add(cat);
                }
            });
        } else {
            if (!excludedCategories.includes(business.category)) {
                categories.add(business.category);
            }
        }
    });

    const categoryOptions = Array.from(categories).map(cat => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: cat
    }));
    return categoryOptions.sort((a, b) => a.label.localeCompare(b.label));
}

function addMessage(text, sender = "bot") {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.innerHTML = text.replace(/\n/g, '<br>');
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showOptions(options) {
  chatOptions.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt.label;

    if (opt.value.startsWith("mailto:") || opt.value.startsWith("https://wa.me/")) {
        btn.onclick = () => {
            window.open(opt.value, '_blank');
            addMessage(opt.label, "user");
            addMessage("¡Perfecto! Se ha abierto la aplicación correspondiente para que puedas contactarnos. Estamos listos para asistirte.", "bot");

            if (conversationState === "soporte_ayuda_main") {
                showOptions([ {label: "Volver a opciones de soporte", value: "soporte_ayuda"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            } else if (conversationState === "emprendedor_main") {
                 showOptions([ {label: "Volver al menú de emprendedores", value: "emprendedor_vender"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            } else if (conversationState === "reporte_general") {
                 showOptions([ {label: "Volver a opciones de reporte", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            }
            else { startConversation(); }
        };
    } else {
        btn.onclick = () => handleUserResponse(opt.value);
    }
    chatOptions.appendChild(btn);
  });
}

function handleUserResponse(value) {
  if (!value.startsWith("mailto:") && !value.startsWith("https://wa.me/")) {
    addMessage(value, "user");
  }

  switch(conversationState) {
    case "start":
      if (value === "estudiante_comprar") {
        addMessage("¡Perfecto! Estoy aquí para ayudarte a encontrar lo que buscas entre los emprendimientos de CUCEI. ¿Qué te gustaría hacer hoy?", "bot");
        showOptions([ {label: "Buscar negocios por categoría", value: "buscar_categoria"}, {label: "Buscar negocios por nombre o producto", value: "buscar_nombre"}, {label: "Ver emprendedores destacados", value: "ver_destacados"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        conversationState = "estudiante_main";
      } else if (value === "emprendedor_vender") {
        addMessage("¡Excelente! En NEXCODE estamos comprometidos a impulsar tu emprendimiento en la comunidad CUCEI. ¿Qué te gustaría hacer?", "bot");
        showOptions([ {label: "Registrar mi negocio en CUCEI Mart", value: "registrar_negocio"}, {label: "Quiero publicidad destacada", value: "quiero_publicidad"}, {label: "Necesito una página web profesional", value: "quiero_web_profesional"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        conversationState = "emprendedor_main";
      } else if (value === "info_general") {
        addMessage("CUCEI Mart es tu plataforma principal para conectar con el emprendimiento dentro de CUCEI. Nuestro objetivo es brindar un acceso profesional y eficiente a los productos y servicios de nuestros talentosos emprendedores universitarios, facilitando las conexiones y apoyando el comercio local. Este proyecto es desarrollado por NEXCODE, buscando ofrecer un servicio valioso a nuestra comunidad.", "bot");
        showOptions([ {label: "Beneficios para estudiantes", value: "beneficios_estudiantes"}, {label: "Beneficios para emprendedores", value: "beneficios_emprendedores"}, {label: "¿Quiénes somos (NEXCODE)?", value: "quienes_somos_nexcode"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        conversationState = "info_general";
      } else if (value === "soporte_ayuda") {
        addMessage("Si tienes alguna duda o necesitas asistencia técnica, estamos aquí para ayudarte. Por favor, selecciona la opción que mejor describa tu necesidad.", "bot");
        showOptions([ {label: "Contactar a soporte técnico (Email)", value: "contactar_soporte_email"}, {label: "Ver otras formas de contacto", value: "otras_formas_contacto"}, {label: "Reportar un incidente", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        conversationState = "soporte_ayuda_main";
      } else if (value === "volver_inicio") { startConversation(); }
      else { addMessage("Disculpa, no logré comprender tu solicitud. Por favor, selecciona una de las opciones principales para que podamos ayudarte con la máxima eficiencia:", "bot"); startConversation(); }
      break;

    case "estudiante_main":
      if (value === "buscar_categoria") {
        addMessage("Claro, tenemos una amplia variedad de categorías para explorar los emprendimientos. ¿Cuál te interesa más?", "bot");
        showOptions([ ...getBusinessCategories(), {label: "Volver al menú anterior", value: "estudiante_comprar"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        conversationState = "buscar_categoria_estudiante";
      } else if (value === "buscar_nombre") {
        addMessage("Para una búsqueda rápida y precisa, te invitamos a utilizar la barra de búsqueda principal en la parte superior de la página. Ahí podrás escribir el nombre del negocio o el producto que te interesa.", "bot");
        showOptions([ {label: "Volver al menú anterior", value: "estudiante_comprar"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
      } else if (value === "ver_destacados") {
        addMessage("En la sección de 'Emprendedores Destacados' de nuestra página principal, encontrarás los negocios que actualmente están resaltando sus ofertas. ¡Es una excelente forma de descubrir nuevas opciones y apoyar a la comunidad emprendedora!", "bot");
        showOptions([ {label: "Volver al menú anterior", value: "estudiante_comprar"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
      } else if (value === "volver_inicio" || value === "estudiante_comprar") { startConversation(); }
      else { addMessage("Entiendo. Por favor, elige una de las siguientes opciones relacionadas con la búsqueda de emprendimientos para estudiantes:", "bot"); showOptions([ {label: "Buscar negocios por categoría", value: "buscar_categoria"}, {label: "Buscar negocios por nombre o producto", value: "buscar_nombre"}, {label: "Ver emprendedores destacados", value: "ver_destacados"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); }
      break;

    case "buscar_categoria_estudiante":
        if (getBusinessCategories().some(cat => cat.value === value)) {
            addMessage(`Excelente elección. Para ver todos los negocios en la categoría de "${value.charAt(0).toUpperCase() + value.slice(1)}", por favor utiliza el filtro de categorías en la parte superior de nuestra página.`, "bot");
            showOptions([ {label: "Volver a elegir categoría", value: "buscar_categoria"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            conversationState = "estudiante_main";
        } else if (value === "volver_inicio") { startConversation(); }
        else if (value === "estudiante_comprar") { addMessage("¡Perfecto! Estoy aquí para ayudarte a encontrar lo que buscas entre los emprendimientos de CUCEI. ¿Qué te gustaría hacer hoy?", "bot"); showOptions([ {label: "Buscar negocios por categoría", value: "buscar_categoria"}, {label: "Buscar negocios por nombre o producto", value: "buscar_nombre"}, {label: "Ver emprendedores destacados", value: "ver_destacados"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); conversationState = "estudiante_main"; }
        else { addMessage("No reconocí esa categoría. Por favor, selecciona una de las opciones disponibles o regresa al menú.", "bot"); showOptions([ ...getBusinessCategories(), {label: "Volver al menú anterior", value: "estudiante_comprar"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); }
        break;

    case "emprendedor_main":
      if (value === "registrar_negocio") {
        addMessage("Registrar tu negocio en CUCEI Mart es el primer paso para ampliar tu alcance en la comunidad universitaria de forma gratuita. Para iniciar este proceso profesional, por favor, envíanos un correo electrónico con los detalles de tu emprendimiento. Haz clic en el botón para abrir un borrador de correo.", "bot");
        showOptions([ {label: "Enviar correo para registrar mi negocio", value: "mailto:nexcodemx@gmail.com?subject=Solicitud%20de%20Registro%20de%20Negocio%20en%20CUCEI%20Mart&body=Estimado%20equipo%20de%20NEXCODE%2C%0A%0AMe%20dirijo%20a%20ustedes%20con%20gran%20interés%20en%20registrar%20mi%20negocio%20en%20la%20plataforma%20CUCEI%20Mart.%20Agradeceré%20me%20indiquen%20los%20pasos%20a%20seguir%20y%20la%20información%20detallada%20que%20requieren.%0A%0ANombre%20del%20negocio%3A%20%5BAquí%20tu%20nombre%20de%20negocio%5D%0ADescripción%20corta%3A%20%5BAquí%20una%20breve%20descripción%5D%0ACategorías%20relevantes%3A%20%5BEj.%20Alimentos%2C%20Ropa%2C%20Servicios%5D%0A%0AEn%20espera%20de%20su%20pronta%20respuesta%2C%0A%0ASaludos%20cordiales%2C%0A%5BTu%20Nombre%5D"}, {label: "Volver al menú de emprendedores", value: "emprendedor_vender"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
      } else if (value === "quiero_publicidad") {
        addMessage("Potencia la visibilidad de tu negocio con publicidad destacada en CUCEI Mart. Un banner profesional en nuestra página principal te ayudará a llegar directamente a miles de estudiantes y profesores de la comunidad CUCEI. Para hablar sobre las opciones de publicidad, costos y cómo podemos maximizar tu impacto, por favor, contáctanos directamente por WhatsApp.", "bot");
        showOptions([ {label: "Contactar por WhatsApp sobre Publicidad", value: "https://wa.me/523343408028?text=Hola%20NEXCODE%2C%20estoy%20interesado%20en%20la%20publicidad%20destacada%20en%20CUCEI%20Mart.%20Me%20gustaría%20saber%20más%20detalles%20y%20opciones%20para%20mi%20negocio."}, {label: "Volver al menú de emprendedores", value: "emprendedor_vender"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
      } else if (value === "quiero_web_profesional") {
        addMessage("En NEXCODE, somos especialistas en diseñar y desarrollar páginas web profesionales a medida, perfectas para darle a tu emprendimiento una presencia digital robusta, atractiva y funcional. Si estás listo para llevar tu negocio al siguiente nivel con tu propia página web personalizada, contáctanos por WhatsApp para una asesoría detallada y sin compromiso.", "bot");
        showOptions([ {label: "Contactar por WhatsApp sobre Páginas Web", value: "https://wa.me/523343408028?text=Hola%20NEXCODE%2C%20estoy%20interesado%20en%20la%20creación%20de%20una%20página%20web%20para%20mi%20negocio.%20Me%20gustaría%20saber%20más%20sobre%20sus%20servicios%20y%20recibir%20una%20propuesta."}, {label: "Volver al menú de emprendedores", value: "emprendedor_vender"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
      } else if (value === "volver_inicio" || value === "emprendedor_vender") { startConversation(); }
      else { addMessage("Disculpa, no reconocí esa opción. Por favor, elige una de las siguientes opciones para emprendedores:", "bot"); showOptions([ {label: "Registrar mi negocio en CUCEI Mart", value: "registrar_negocio"}, {label: "Quiero publicidad destacada", value: "quiero_publicidad"}, {label: "Necesito una página web profesional", value: "quiero_web_profesional"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); }
      break;

    case "info_general":
        if (value === "beneficios_estudiantes") {
            addMessage("Para los estudiantes, CUCEI Mart ofrece un buscador profesional y organizado con categorías para encontrar fácilmente productos y servicios, una forma conveniente de apoyar a sus compañeros emprendedores y acceder a información relevante de manera eficiente.", "bot");
            showOptions([ {label: "Volver a información general", value: "info_general"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "beneficios_emprendedores") {
            addMessage("Los emprendedores pueden registrar su negocio de forma gratuita para aumentar significativamente su visibilidad en la comunidad CUCEI, establecer un contacto más directo y profesional con sus clientes potenciales, y acceder a opciones avanzadas de publicidad y desarrollo web para impulsar su crecimiento.", "bot");
            showOptions([ {label: "Volver a información general", value: "info_general"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "quienes_somos_nexcode") {
             addMessage("NEXCODE es el equipo de desarrollo detrás de CUCEI Mart. Nuestra misión es potenciar el emprendimiento en la universidad ofreciendo esta plataforma como un servicio valioso a la comunidad. Además de CUCEI Mart, NEXCODE se especializa en la creación de páginas web profesionales y cursos en línea para el desarrollo de habilidades digitales.", "bot");
             showOptions([ {label: "Volver a información general", value: "info_general"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        }
        else if (value === "volver_inicio") { startConversation(); }
        else { addMessage("Disculpa, no entendí esa opción. Por favor, elige una de las siguientes sobre información general de CUCEI Mart:", "bot"); showOptions([ {label: "Beneficios para estudiantes", value: "beneficios_estudiantes"}, {label: "Beneficios para emprendedores", value: "beneficios_emprendedores"}, {label: "¿Quiénes somos (NEXCODE)?", value: "quienes_somos_nexcode"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); }
        break;

    case "soporte_ayuda_main":
        if (value === "contactar_soporte_email") {
            addMessage("Para contactar a nuestro equipo de soporte técnico, por favor haz clic en el botón de abajo. Esto abrirá un borrador de correo en tu cliente de email predeterminado.", "bot");
            showOptions([ {label: "Enviar Email a Soporte Técnico", value: "mailto:nexcodemx@gmail.com?subject=Consulta%20de%20Soporte%20Técnico%20CUCEI%20Mart&body=Hola%20equipo%20de%20Soporte%20Técnico%20de%20CUCEI%20Mart%2C%0A%0AMi%20nombre%20es%20%5BTu%20Nombre%5D%20y%20estoy%20escribiendo%20por%20el%20siguiente%20motivo%3A%0A%0A%5BAquí%20describe%20tu%20problema%20o%20consulta%20con%20el%20mayor%20detalle%20posible%2C%20incluyendo%20pasos%20para%20reproducirlo%20si%20es%20un%20error%5D%0A%0AGracias%20por%20su%20atención%20y%20pronta%20respuesta.%0A%0ASaludos%20cordiales.%0A"}, {label: "Volver a opciones de soporte", value: "soporte_ayuda"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "otras_formas_contacto") {
            addMessage("Aquí tienes otras formas profesionales de mantenerte en contacto con el equipo de NEXCODE y CUCEI Mart:", "bot");
            addMessage("📧 Email de contacto: nexcodemx@gmail.com", "bot");
            addMessage("📸 Síguenos en Instagram: @NexCode_MX", "bot");
            addMessage("💻 Visita nuestro GitHub: github.com/NEXCODEMX", "bot");
            addMessage("▶️ Suscríbete en YouTube: NexCodeMX", "bot");
            addMessage("📞 Llámanos o escríbenos por WhatsApp: +52 3343408028", "bot");
            showOptions([ {label: "Volver a opciones de soporte", value: "soporte_ayuda"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "reportar_incidente") {
            addMessage("Comprendo. Para ayudarnos a mantener la calidad y seguridad de CUCEI Mart, por favor, indícanos qué tipo de incidente deseas reportar:", "bot");
            showOptions([ {label: "Reportar un emprendimiento", value: "reportar_emprendimiento"}, {label: "Reportar un bug/error en la web", value: "reportar_bug"}, {label: "Enviar una sugerencia o mejora", value: "enviar_sugerencia"}, {label: "Otro tipo de reporte", value: "reportar_otro"}, {label: "Volver a opciones de soporte", value: "soporte_ayuda"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            conversationState = "reporte_general";
        } else if (value === "soporte_ayuda") {
            addMessage("Si tienes alguna duda o necesitas asistencia técnica, estamos aquí para ayudarte. Por favor, selecciona la opción que mejor describa tu necesidad.", "bot");
            showOptions([ {label: "Contactar a soporte técnico (Email)", value: "contactar_soporte_email"}, {label: "Ver otras formas de contacto", value: "otras_formas_contacto"}, {label: "Reportar un incidente", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            conversationState = "soporte_ayuda_main";
        } else if (value === "volver_inicio") { startConversation(); }
        else { addMessage("No reconocí esa opción en el menú de soporte. Por favor, elige una de las opciones disponibles:", "bot"); showOptions([ {label: "Contactar a soporte técnico (Email)", value: "contactar_soporte_email"}, {label: "Ver otras formas de contacto", value: "otras_formas_contacto"}, {label: "Reportar un incidente", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); }
        break;

    case "reporte_general":
        let subject = "";
        let body = "Hola equipo de CUCEI Mart, me gustaría reportar un incidente.%0A%0ADescribe%20aquí%20los%20detalles%20del%20incidente%20con%20la%20mayor%20precisión%20posible%20(ej.%20nombre%20del%20emprendimiento%2C%20fecha%20y%20hora%20del%20error%2C%20pasos%20para%20reproducirlo).%0A%0AGracias%2C%0A[Tu%20Nombre]";

        if (value === "reportar_emprendimiento") {
            subject = "Reporte%20de%20Emprendimiento%20CUCEI%20Mart";
            addMessage("Para reportar un emprendimiento, ya sea por información incorrecta, prácticas dudosas o cualquier otra preocupación, haz clic para enviar un correo electrónico con los detalles.", "bot");
            showOptions([ {label: "Enviar Email: Reporte de Emprendimiento", value: `mailto:nexcodemx@gmail.com?subject=${subject}&body=Hola%20equipo%20de%20CUCEI%20Mart%2C%0A%0AMe%20dirijo%20a%20ustedes%20para%20reportar%20un%20incidente%20relacionado%20con%20el%20siguiente%20emprendimiento%3A%0A%0ANombre%20del%20emprendimiento%3A%20%5BAquí%20nombre%20o%20descripción%5D%0AMotivo%20del%20reporte%3A%20%5BAquí%20describe%20el%20motivo%20con%20detalle%5D%0AFecha%20o%20contexto%20del%20incidente%3A%20%5BAquí%20fecha%2Fhora%20si%20aplica%5D%0A%0AEn%20espera%20de%20su%20pronta%20atención%2C%0A%0ASaludos%20cordiales%2C%0A%5BTu%20Nombre%5D`}, {label: "Volver a opciones de reporte", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "reportar_bug") {
            subject = "Reporte%20de%20Bug%2FErro%20en%20CUCEI%20Mart";
            addMessage("Agradecemos tu ayuda para mejorar CUCEI Mart. Por favor, describe el bug o error que encontraste con el mayor detalle posible al enviar el correo, incluyendo los pasos para reproducirlo.", "bot");
            showOptions([ {label: "Enviar Email: Reporte de Bug/Error", value: `mailto:nexcodemx@gmail.com?subject=${subject}&body=Hola%20equipo%20de%20CUCEI%20Mart%2C%0A%0AEncontré%20un%20bug%20%2F%20error%20en%20la%20plataforma.%0A%0ADescripción%20del%20problema%3A%20%5BAquí%20describe%20el%20bug%20claramente%5D%0APasos%20para%20reproducir%3A%0A1.%20%5BPaso%201%5D%0A2.%20%5BPaso%202%5D%0A3.%20%5BPaso%203%5D%0AComportamiento%20esperado%3A%20%5BAquí%20lo%20que%20debería%20suceder%5D%0AComportamiento%20actual%3A%20%5BAquí%20lo%20que%20realmente%20sucede%5D%0A%0AGracias%20por%20su%20atención%20para%20resolverlo%2C%0A%0ASaludos%20cordiales%2C%0A%5BTu%20Nombre%5D`}, {label: "Volver a opciones de reporte", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "enviar_sugerencia") {
            subject = "Sugerencia%20para%20CUCEI%20Mart";
            addMessage("¡Nos encanta recibir sugerencias y nuevas ideas para mejorar! Por favor, comparte tus pensamientos en el correo electrónico. Tu feedback es muy valioso.", "bot");
            showOptions([ {label: "Enviar Email: Sugerencia/Mejora", value: `mailto:nexcodemx@gmail.com?subject=${subject}&body=Hola%20equipo%20de%20CUCEI%20Mart%2C%0A%0AMe%20gustaría%20compartir%20la%20siguiente%20sugerencia%20%2F%20idea%20para%20mejorar%20la%20plataforma%3A%0A%0A%5BAquí%20describe%20tu%20sugerencia%20con%20detalle%5D%0A%0ACreo%20que%20esto%20podría%20beneficiar%20a%20%5BAquí%20menciona%20a%20quién%20beneficiaría%2C%20ej.%20usuarios%2C%20emprendedores%5D%0A%0AGracias%20por%20considerarla%2C%0A%0ASaludos%20cordiales%2C%0A%5BTu%20Nombre%5D`}, {label: "Volver a opciones de reporte", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "reportar_otro") {
            subject = "Otro%20Tipo%20de%20Reporte%20CUCEI%20Mart";
            addMessage("Si tu reporte no encaja en las categorías anteriores, por favor, describe detalladamente tu situación en el correo electrónico. Agradecemos tu apoyo para mantener nuestra plataforma segura y funcional.", "bot");
            showOptions([ {label: "Enviar Email: Otro Reporte", value: `mailto:nexcodemx@gmail.com?subject=${subject}&body=${body}`}, {label: "Volver a opciones de reporte", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
        } else if (value === "reportar_incidente") {
            addMessage("Comprendo. Para ayudarnos a mantener la calidad y seguridad de CUCEI Mart, por favor, indícanos qué tipo de incidente deseas reportar:", "bot");
            showOptions([ {label: "Reportar un emprendimiento", value: "reportar_emprendimiento"}, {label: "Reportar un bug/error en la web", value: "reportar_bug"}, {label: "Enviar una sugerencia o mejora", value: "enviar_sugerencia"}, {label: "Otro tipo de reporte", value: "reportar_otro"}, {label: "Volver a opciones de soporte", value: "soporte_ayuda"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            conversationState = "reporte_general";
        } else if (value === "soporte_ayuda") {
            addMessage("Si tienes alguna duda o necesitas asistencia técnica, estamos aquí para ayudarte. Por favor, selecciona la opción que mejor describa tu necesidad.", "bot");
            showOptions([ {label: "Contactar a soporte técnico (Email)", value: "contactar_soporte_email"}, {label: "Ver otras formas de contacto", value: "otras_formas_contacto"}, {label: "Reportar un incidente", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]);
            conversationState = "soporte_ayuda_main";
        } else if (value === "volver_inicio") { startConversation(); }
        else { addMessage("No reconocí esa opción en el menú de soporte. Por favor, elige una de las opciones disponibles:", "bot"); showOptions([ {label: "Contactar a soporte técnico (Email)", value: "contactar_soporte_email"}, {label: "Ver otras formas de contacto", value: "otras_formas_contacto"}, {label: "Reportar un incidente", value: "reportar_incidente"}, {label: "Volver al menú principal", value: "volver_inicio"} ]); }
        break;

    default:
      addMessage("Disculpa, hubo un problema inesperado o no reconocí tu última opción. Volvamos al inicio para que pueda asistirte con la profesionalidad que mereces.", "bot");
      startConversation();
      break;
  }
}

function startConversation() {
  chatMessages.innerHTML = "";
  addMessage("¡Hola! Soy MART, tu asistente virtual de CUCEI Mart. Estoy aquí para ayudarte a encontrar lo que necesitas o a impulsar tu negocio. ¿Cómo puedo ayudarte hoy?", "bot");
  showOptions([ {label: "Soy estudiante/quiero comprar", value: "estudiante_comprar"}, {label: "Soy emprendedor/quiero vender", value: "emprendedor_vender"}, {label: "Información general de CUCEI Mart", value: "info_general"}, {label: "Necesito soporte/ayuda", value: "soporte_ayuda"} ]);
  conversationState = "start";
}

chatBtn.addEventListener('click', () => {
  chatContainer.classList.add('active');
  chatContainer.setAttribute('aria-hidden', 'false');
  startConversation();
});

chatClose.addEventListener('click', () => {
  chatContainer.classList.remove('active');
  chatContainer.setAttribute('aria-hidden', 'true');
});


// --- FUNCIONALIDAD FAQ (para soporte.html) ---
function setupFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length === 0) return;

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;

            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== question && otherQuestion.classList.contains('active')) {
                    otherQuestion.classList.remove('active');
                    otherQuestion.nextElementSibling.style.maxHeight = null;
                    otherQuestion.nextElementSibling.classList.remove('active');
                }
            });

            if (answer.classList.contains('active')) {
                answer.style.maxHeight = null;
                question.classList.remove('active');
                answer.classList.remove('active');
            } else {
                answer.style.maxHeight = answer.scrollHeight + "px";
                question.classList.add('active');
                answer.classList.add('active');
            }
        });
    });
}

// --- INICIALIZACIONES GLOBALES DEL DOM (para todas las páginas) ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializaciones para CUCEIMART.html (si aplica)
    const businessesGrid = document.getElementById('businessesGrid');
    if (businessesGrid) {
        renderBusinesses(window.businessesData); // Usa window.businessesData
        setupEventListeners();
        initBannerRotation();
    }
    
    // Inicialización del Chatbot
    if (chatBtn) {
        chatBtn.addEventListener('click', () => {
            chatContainer.classList.add('active');
            chatContainer.setAttribute('aria-hidden', 'false');
            startConversation();
        });
        chatClose.addEventListener('click', () => {
            chatContainer.classList.remove('active');
            chatContainer.setAttribute('aria-hidden', 'true');
        });
    }

    // Inicialización del FAQ (para soporte.html)
    if (document.querySelector('.faq-section')) {
        setupFaqAccordion();
    }
});

 