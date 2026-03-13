// Asegúrate de que window.businessesData esté definido en Shop.js y cargado antes de este script.

// --- Configuración de imágenes de mapa ---
const mapImagePaths = {
    'main': 'img/MapaCUCEI.jpg', // Tu mapa oficial 3D principal

    // Vistas para la navegación direccional (EJEMPLOS - DEBES CREAR ESTAS IMÁGENES)
    'dir_up_1': 'img/mapa_cucei_up1.jpg', 'dir_up_2': 'img/mapa_cucei_up2.jpg',
    'dir_down_1': 'img/mapa_cucei_down1.jpg', 'dir_down_2': 'img/mapa_cucei_down2.jpg',
    'dir_left_1': 'img/mapa_cucei_left1.jpg', 'dir_left_2': 'img/mapa_cucei_left2.jpg',
    'dir_right_1': 'img/mapa_cucei_right1.jpg', 'dir_right_2': 'img/mapa_cucei_right2.jpg',

    // Vistas de edificios específicos (EJEMPLOS - DEBES CREAR ESTAS IMÁGENES)
    'building_a': 'img/mapa_edificioA.jpg', 'building_b': 'img/mapa_edificioB.jpg',
    'building_c': 'img/mapa_edificioC.jpg', 'building_d': 'img/mapa_edificioD.jpg',
    'building_e': 'img/mapa_edificioE.jpg', 'building_f': 'img/mapa_edificioF.jpg',
    'building_g': 'img/mapa_edificioG.jpg', 'building_h': 'img/mapa_edificioH.jpg',
    'building_i': 'img/mapa_edificioI.jpg', 'building_j': 'img/mapa_edificioJ.jpg',
    'building_k': 'img/mapa_edificioK.jpg', 'building_l': 'img/mapa_edificioL.jpg',
    'building_m': 'img/mapa_edificioM.jpg', 'building_n': 'img/mapa_edificioN.jpg',
    'building_o': 'img/mapa_edificioO.jpg', 'building_p': 'img/mapa_edificioP.jpg',
    'building_q': 'img/mapa_edificioQ.jpg', 'building_r': 'img/mapa_edificioR.jpg',
    'building_s': 'img/mapa_edificioS.jpg', 'building_s2': 'img/mapa_edificioS2.jpg',
    'building_t': 'img/mapa_edificioT.jpg', 'building_u': 'img/mapa_edificioU.jpg',
    'building_v': 'img/mapa_edificioV.jpg', 'building_v2': 'img/mapa_edificioV2.jpg',
    'building_w': 'img/mapa_edificioW.jpg', 'building_x': 'img/mapa_edificioX.jpg',
    'building_y': 'img/mapa_edificioY.jpg', 'building_z': 'img/mapa_edificioZ.jpg',
    'building_z2': 'img/mapa_edificioZ2.jpg',

    // Vistas de zonas de interés (EJEMPLOS - DEBES CREAR ESTAS IMÁGENES)
    'zone_lonaria': 'img/mapa_lonaria.jpg', 'zone_baños': 'img/mapa_sanitarios.jpg',
    'zone_control_escolar': 'img/mapa_controlescolar.jpg', 'zone_jobs': 'img/mapa_jobs.jpg',
    'zone_auditorios': 'img/mapa_auditorios.jpg', 'zone_medico': 'img/mapa_medicos.jpg',
    'zone_cajero_santander': 'img/mapa_cajero.jpg', 'zone_cafeterias': 'img/mapa_cafeterias.jpg',
    'zone_lab_ingenierias': 'img/mapa_labingenierias.jpg', 'zone_jardines_explanadas': 'img/mapa_jardines.jpg',
    'zone_linea3': 'img/mapa_linea3.jpg', 'zone_biblioteca': 'img/mapa_biblioteca.jpg',
    'zone_estacionamiento': 'img/mapa_estacionamiento.jpg', 'zone_papelerias': 'img/mapa_papelerias.jpg',
    'zone_servicios_generales': 'img/mapa_generales.jpg', 'zone_gimnasio': 'img/mapa_gimnasio.jpg',
    // Si tienes imágenes para la vista "real" (plantel), añádelas aquí con el sufijo _real
    'main_real': 'img/mapa_cucei_real.jpg' // Ejemplo: vista real del mapa principal
};


// --- Variables de Estado del Mapa ---
let currentMapType = 'main'; // 'main', 'building_X', 'zone_Y', 'dir_...'
let currentPanOffset = { x: 0, y: 0 }; // Para el paneo del viewport (translate X, Y)
const panStep = 0.05; // Cuánto se mueve el viewport por cada clic (5% del tamaño de la imagen extra)
const IMAGE_OVERSIZE_FACTOR = 0.50; // La imagen es 150% del contenedor, tiene 50% extra para panear
const MAX_PAN_OFFSET_PCT = IMAGE_OVERSIZE_FACTOR / 2; // El límite de paneo es la mitad del 'oversize' (25%)

let isRealViewActive = false; // Para alternar entre vista de mapa y "vista real"
let currentActivePin = null; // Para rastrear el pin activo


// --- Elementos del DOM del MAPA (se asignarán en DOMContentLoaded) ---
let mainCampusMap;
let mapViewport; 
let mapPinsContainer;
let businessInfoCard;
let infoCardName;
let infoCardCategory;
let infoCardDescription;
let infoCardLink;
let infoCardFeaturedBadge;
let closeCardBtnMap;
let mapSearchInput;
let filterFeaturedBtn;
let resetFiltersBtn;
let toggleViewBtn;
let resetMapButton;

let upButton;
let downButton;
let leftButton;
let rightButton;

let showBuildingsBtn;
let showZonesBtn;
let showBusinessesBtn;
let relojElement; 

let dynamicBuildingButtonsContainer;
let dynamicZoneButtonsContainer;


// --- FUNCIONES ESPECÍFICAS DEL MAPA ---

// Función para cambiar la imagen del mapa base o aplicar paneo
function changeCampusMap(mapIdentifier) {
    if (!mainCampusMap || !mapViewport) {
        console.error("Elementos del mapa no encontrados: mainCampusMap o mapViewport.");
        return;
    }

    let imageUrl;
    let isSpecificView = false; 

    // Reinicia el offset de paneo y transformación al cambiar la imagen base
    currentPanOffset = { x: 0, y: 0 }; 
    mapViewport.style.transform = `translate(0%, 0%)`; 

    if (typeof mapIdentifier === 'string' && mapImagePaths[mapIdentifier]) {
        imageUrl = mapImagePaths[mapIdentifier];
        currentMapType = mapIdentifier;
        
        if (mapIdentifier.startsWith('building_') || mapIdentifier.startsWith('zone_')) {
            isSpecificView = true;
        }

    } else if (mapIdentifier === 'pan') { 
        // Solo aplica el transform actual sin cambiar la imagen base
        mapViewport.style.transform = `translate(${currentPanOffset.x * 100}%, ${currentPanOffset.y * 100}%)`;
        imageUrl = mainCampusMap.src; // Mantiene la URL actual del mapa
    } else {
        console.warn('Identificador de mapa no válido o imagen no encontrada:', mapIdentifier);
        imageUrl = mapImagePaths['main']; 
        currentMapType = 'main';
    }

    // Actualiza src solo si es diferente
    if (mainCampusMap.src !== imageUrl) {
        mainCampusMap.src = imageUrl;
    }
    
    // Controla la visibilidad de los pines:
    const showPins = (currentMapType === 'main' || isSpecificView);
    if (mapPinsContainer) {
        mapPinsContainer.style.display = showPins ? 'block' : 'none';
    }
    
    if (showPins) {
        renderMapPins(); 
    }
    closeBusinessInfo(); 
}


// Función para renderizar los pines en el mapa
function renderMapPins(businessesToRender = window.businessesData) { 
    if (!mapPinsContainer || mapPinsContainer.style.display === 'none') {
        return;
    }

    mapPinsContainer.innerHTML = ''; 

    businessesToRender.forEach(business => {
        if (business.mapX === undefined || business.mapY === undefined) {
            return; // No renderiza pines para negocios sin coordenadas de mapa
        }

        const isCurrentViewRelevant = currentMapType === 'main' ||
            (business.buildingId && currentMapType === `building_${business.buildingId.toLowerCase()}`) ||
            (business.zoneId && currentMapType === `zone_${business.zoneId.toLowerCase()}`);

        if (isCurrentViewRelevant) {
            const pin = document.createElement('div');
            pin.classList.add('map-pin');
            pin.style.left = `${business.mapX * 100}%`;
            pin.style.top = `${business.mapY * 100}%`;
            pin.dataset.businessId = business.id;

            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-map-marker-alt');
            pin.appendChild(icon);

            if (business.isFeatured) {
                pin.classList.add('featured');
                icon.classList.remove('fa-map-marker-alt');
                icon.classList.add('fa-star');
            }

            pin.addEventListener('click', () => showBusinessInfo(business, pin));
            mapPinsContainer.appendChild(pin);
        }
    });
}

function showBusinessInfo(business, clickedPin) {
    if (!businessInfoCard) return;

    if (currentActivePin && currentActivePin !== clickedPin) {
        currentActivePin.classList.remove('active');
    }

    clickedPin.classList.add('active');
    currentActivePin = clickedPin;

    infoCardName.textContent = business.name;
    infoCardCategory.textContent = Array.isArray(business.category) ? business.category.join(', ') : business.category;
    infoCardDescription.textContent = business.description;
    infoCardLink.href = business.url || business.website || (business.whatsapp ? `https://wa.me/${business.whatsapp}?text=Hola%20${encodeURIComponent(business.name)}%2C%20te%20encontré%20en%20CUCEI%20Mart%20y%20me%20interesa%20tu%20negocio.` : '#');
    infoCardLink.textContent = (business.url || business.website) ? 'Visitar Tienda' : (business.whatsapp ? 'Enviar WhatsApp' : 'Más Info');
    
    if (!business.url && !business.website && !business.whatsapp) {
        infoCardLink.style.pointerEvents = 'none';
        infoCardLink.style.opacity = '0.5';
    } else {
        infoCardLink.style.pointerEvents = 'auto';
        infoCardLink.style.opacity = '1';
    }


    if (business.isFeatured) {
        infoCardFeaturedBadge.style.display = 'flex';
    } else {
        infoCardFeaturedBadge.style.display = 'none';
    }

    businessInfoCard.style.display = 'flex';
}

function closeBusinessInfo() {
    if (!businessInfoCard) return;
    businessInfoCard.style.display = 'none';
    if (currentActivePin) {
        currentActivePin.classList.remove('active');
        currentActivePin = null;
    }
}

// Lógica de búsqueda en el mapa
function setupMapSearchListeners() {
    if (mapSearchInput) {
        mapSearchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                changeCampusMap('main');
                renderMapPins(window.businessesData);
                closeBusinessInfo();
                return;
            }

            const buildingOrZoneKey = Object.keys(mapImagePaths).find(key => 
                (key.startsWith('building_') || key.startsWith('zone_')) && key.replace(/_/g, ' ').includes(searchTerm)
            );

            if (buildingOrZoneKey) {
                changeCampusMap(buildingOrZoneKey);
                const filteredBusinessesByLocation = window.businessesData.filter(b => 
                    (b.buildingId && `building_${b.buildingId.toLowerCase()}` === buildingOrZoneKey) ||
                    (b.zoneId && `zone_${b.zoneId.toLowerCase()}` === buildingOrZoneKey)
                );
                renderMapPins(filteredBusinessesByLocation.length > 0 ? filteredBusinessesByLocation : []);
                closeBusinessInfo();
            } else {
                changeCampusMap('main');
                const filteredBusinesses = window.businessesData.filter(business =>
                    business.name.toLowerCase().includes(searchTerm) ||
                    business.description.toLowerCase().includes(searchTerm) ||
                    (Array.isArray(business.category) ? business.category.join(' ').toLowerCase() : business.category.toLowerCase()).includes(searchTerm)
                );
                renderMapPins(filteredBusinesses);
                closeBusinessInfo();
            }
        });
    }
}

// Lógica de filtro para ver solo destacados
function setupFeaturedFilterListeners() {
    if (filterFeaturedBtn) {
        filterFeaturedBtn.addEventListener('click', () => {
            filterFeaturedBtn.classList.toggle('active');
            const showFeaturedOnly = filterFeaturedBtn.classList.contains('active');
            
            changeCampusMap('main'); 
            
            if (showFeaturedOnly) {
                const featuredBusinesses = window.businessesData.filter(business => business.isFeatured);
                renderMapPins(featuredBusinesses);
            } else {
                renderMapPins(window.businessesData);
            }
            closeBusinessInfo();
        });
    }
}

// Botón de reset de filtros (muestra todos los negocios y el mapa principal)
function setupResetFiltersListeners() {
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (filterFeaturedBtn) filterFeaturedBtn.classList.remove('active');
            if (mapSearchInput) mapSearchInput.value = '';
            changeCampusMap('main');
            renderMapPins(window.businessesData);
            closeBusinessInfo();
        });
    }
}

// Alternar vista de mapa / plantel
function setupToggleViewListeners() {
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', () => {
            isRealViewActive = !isRealViewActive;
            toggleViewBtn.innerHTML = isRealViewActive 
                ? '<i class="fas fa-map"></i> Ver Mapa' 
                : '<i class="fas fa-eye"></i> Ver desde Plantel';
            
            const currentMapPathKey = currentMapType; 
            const realMapKey = `${currentMapPathKey}_real`; 

            if (isRealViewActive && mapImagePaths[realMapKey]) {
                mainCampusMap.src = mapImagePaths[realMapKey];
                mapPinsContainer.style.display = 'none'; // Pines no relevantes en vista real
            } else {
                mainCampusMap.src = mapImagePaths[currentMapPathKey] || mapImagePaths['main'];
                const showPins = (currentMapPathKey === 'main' || currentMapPathKey.startsWith('building_') || currentMapPathKey.startsWith('zone_'));
                mapPinsContainer.style.display = showPins ? 'block' : 'none';
            }
            closeBusinessInfo();
        });
    }
}

// Botón Home del teléfono para resetear el mapa a su estado inicial
function setupResetMapButtonListeners() {
    if (resetMapButton) {
        resetMapButton.addEventListener('click', () => {
            currentPanOffset = { x: 0, y: 0 };
            mapViewport.style.transform = `translate(0%, 0%)`; 
            changeCampusMap('main');
            if (mapSearchInput) mapSearchInput.value = '';
            if (filterFeaturedBtn) filterFeaturedBtn.classList.remove('active');
            renderMapPins(window.businessesData);
            closeBusinessInfo();
        });
    }
}

// Lógica de navegación direccional (PANEO del viewport)
function setupDirectionalControlsListeners() {
    if (upButton) {
        upButton.addEventListener('click', () => {
            currentPanOffset.y = Math.max(-MAX_PAN_OFFSET_PCT, currentPanOffset.y + panStep); // Mueve el viewport hacia ABAJO (imagen se ve subiendo)
            changeCampusMap('pan');
            closeBusinessInfo();
        });
    }
    if (downButton) {
        downButton.addEventListener('click', () => {
            currentPanOffset.y = Math.min(MAX_PAN_OFFSET_PCT, currentPanOffset.y - panStep); // Mueve el viewport hacia ARRIBA (imagen se ve bajando)
            changeCampusMap('pan');
            closeBusinessInfo();
        });
    }
    if (leftButton) {
        leftButton.addEventListener('click', () => {
            currentPanOffset.x = Math.max(-MAX_PAN_OFFSET_PCT, currentPanOffset.x + panStep); // Mueve el viewport hacia DERECHA (imagen se ve yendo a la izquierda)
            changeCampusMap('pan');
            closeBusinessInfo();
        });
    }
    if (rightButton) {
        rightButton.addEventListener('click', () => {
            currentPanOffset.x = Math.min(MAX_PAN_OFFSET_PCT, currentPanOffset.x - panStep); // Mueve el viewport hacia IZQUIERDA (imagen se ve yendo a la derecha)
            changeCampusMap('pan');
            closeBusinessInfo();
        });
    }
}

// Lógica para botones de filtro de panel (Edificios, Zonas, Negocios)
function setupExploreButtonsListeners() {
    // Esconder grupos dinámicos por defecto
    if (dynamicBuildingButtonsContainer) dynamicBuildingButtonsContainer.style.display = 'none';
    if (dynamicZoneButtonsContainer) dynamicZoneButtonsContainer.style.display = 'none';

    if (showBuildingsBtn) {
        showBuildingsBtn.addEventListener('click', () => {
            changeCampusMap('main'); 
            renderMapPins(window.businessesData.filter(b => b.buildingId && b.mapX !== undefined && b.mapY !== undefined));
            closeBusinessInfo();
            // Generar botones dinámicos para cada edificio
            generateDynamicButtons('building');
        });
    }

    if (showZonesBtn) {
        showZonesBtn.addEventListener('click', () => {
            changeCampusMap('main');
            renderMapPins(window.businessesData.filter(b => b.zoneId && b.mapX !== undefined && b.mapY !== undefined));
            closeBusinessInfo();
            // Generar botones dinámicos para cada zona
            generateDynamicButtons('zone');
        });
    }

    if (showBusinessesBtn) { // Este es el botón "Todos los Negocios" ahora
        showBusinessesBtn.addEventListener('click', () => {
            changeCampusMap('main');
            renderMapPins(window.businessesData.filter(b => b.mapX !== undefined && b.mapY !== undefined)); 
            closeBusinessInfo();
            // Ocultar los grupos dinámicos si estaban visibles
            if (dynamicBuildingButtonsContainer) dynamicBuildingButtonsContainer.style.display = 'none';
            if (dynamicZoneButtonsContainer) dynamicZoneButtonsContainer.style.display = 'none';
        });
    }
}

// Función para generar botones dinámicos de Edificios/Zonas
function generateDynamicButtons(type) { // 'building' o 'zone'
    let container = null;
    let items = [];
    let prefix = '';
    let iconClass = '';

    if (type === 'building') {
        container = dynamicBuildingButtonsContainer;
        items = [...new Set(window.businessesData.map(b => b.buildingId).filter(id => id))].sort();
        prefix = 'building_';
        iconClass = 'fas fa-building';
        if (dynamicZoneButtonsContainer) dynamicZoneButtonsContainer.style.display = 'none';
    } else if (type === 'zone') {
        container = dynamicZoneButtonsContainer;
        items = [...new Set(window.businessesData.map(b => b.zoneId).filter(id => id))].sort();
        prefix = 'zone_';
        iconClass = 'fas fa-map-marker-alt';
        if (dynamicBuildingButtonsContainer) dynamicBuildingButtonsContainer.style.display = 'none';
    } else {
        return;
    }

    if (container) {
        container.innerHTML = '';
        if (items.length > 0) {
            items.forEach(item => {
                const button = document.createElement('button');
                button.classList.add('control-button');
                // Si tienes una imagen específica para ese edificio/zona, úsala
                const mapImageKey = `${prefix}${item.toLowerCase()}`;
                if (mapImagePaths[mapImageKey]) {
                     button.onclick = () => {
                         changeCampusMap(mapImageKey);
                         renderMapPins(window.businessesData.filter(b => (type === 'building' ? b.buildingId : b.zoneId) === item));
                         closeBusinessInfo();
                     };
                } else { // Si no hay imagen específica, solo filtra los pines
                    button.onclick = () => {
                         changeCampusMap('main'); // Vuelve al mapa principal
                         renderMapPins(window.businessesData.filter(b => (type === 'building' ? b.buildingId : b.zoneId) === item));
                         closeBusinessInfo();
                     };
                }
                
                button.innerHTML = `<i class="${iconClass}"></i> ${item.toUpperCase()}`;
                container.appendChild(button);
            });
            container.style.display = 'flex'; // Muestra el contenedor de botones
        } else {
            container.style.display = 'none'; // Oculta si no hay elementos
        }
    }
}


function showGoogleMapsExternal() {
    window.open("https://www.google.com/maps/place/CUCEI+-+Centro+Universitario+de+Ciencias+Exactas+e+Ingenierías/@20.6558199,-103.3283286,17z/data=!3m1!4b1!4m6!3m5!1s0x8428b22a00000001:0x6b6329e46a16c72e!8m2!3d20.6558199!4d-103.3257537!16s%2Fg%2F122_920h?entry=ttu", '_blank');
}
window.showGoogleMapsExternal = showGoogleMapsExternal; 

function actualizarReloj() {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const ahora = new Date();
    const diaSemana = diasSemana[ahora.getDay()];
    const dia = ahora.getDate();
    const mes = meses[ahora.getMonth()];
    const año = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12;
    
    const horaActual = `${horas}:${minutos} ${ampm}`;
    const fechaActual = `${diaSemana}, ${dia} de ${mes} del ${año}`;
    
    if (relojElement) {
        relojElement.innerHTML = `${fechaActual} - ${horaActual}`;
    }
}


// --- INICIALIZACIÓN DE map.js ---
document.addEventListener('DOMContentLoaded', () => {
    // Asignar elementos del DOM cuando el documento esté listo
    mainCampusMap = document.getElementById('main-campus-map');
    mapViewport = document.getElementById('mapViewport');
    mapPinsContainer = document.getElementById('mapPinsContainer');
    businessInfoCard = document.getElementById('businessInfoCard');
    infoCardName = document.getElementById('infoCardName');
    infoCardCategory = document.getElementById('infoCardCategory');
    infoCardDescription = document.getElementById('infoCardDescription');
    infoCardLink = document.getElementById('infoCardLink');
    infoCardFeaturedBadge = document.getElementById('infoCardFeaturedBadge');
    closeCardBtnMap = document.querySelector('.business-info-card .close-card-btn');
    mapSearchInput = document.getElementById('mapSearchInput');
    filterFeaturedBtn = document.getElementById('filterFeaturedBtn');
    resetFiltersBtn = document.getElementById('resetFiltersBtn');
    toggleViewBtn = document.getElementById('toggle-view-btn');
    resetMapButton = document.getElementById('resetMapButton');

    upButton = document.getElementById('up-button');
    downButton = document.getElementById('down-button');
    leftButton = document.getElementById('left-button');
    rightButton = document.getElementById('right-button');

    showBuildingsBtn = document.getElementById('show-buildings-btn');
    showZonesBtn = document.getElementById('show-zones-btn');
    showBusinessesBtn = document.getElementById('show-all-businesses-btn'); // ID Correcto
    relojElement = document.getElementById('reloj');

    dynamicBuildingButtonsContainer = document.getElementById('dynamic-building-buttons');
    dynamicZoneButtonsContainer = document.getElementById('dynamic-zone-buttons');


    // Control del Overlay "Próximamente" (específico para esta página)
    const comingSoonOverlay = document.getElementById('comingSoonOverlay');
    if (comingSoonOverlay) {
        // console.log("Overlay de Próximamente encontrado, activando.");
        comingSoonOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evita el scroll del fondo
        // Desactiva el overlay después de unos segundos para la demostración
        // Comenta o quita esto para que el overlay se quede fijo
        setTimeout(() => {
             comingSoonOverlay.classList.remove('active');
             document.body.style.overflow = 'auto'; // Habilita el scroll
        }, 5000); // 5 segundos para que se quite automáticamente
    }


    // Solo inicializa las funcionalidades del mapa si estamos en la página del mapa
    if (mainCampusMap && mapViewport && mapPinsContainer && businessInfoCard) {
        console.log('map.js: Elementos del mapa encontrados. Inicializando funcionalidades.');
        
        changeCampusMap('main'); 
        
        // Asignar Event Listeners a los botones
        setupMapSearchListeners();
        setupFeaturedFilterListeners();
        setupResetFiltersListeners();
        setupToggleViewListeners();
        setupResetMapButtonListeners();
        setupDirectionalControlsListeners();
        setupExploreButtonsListeners(); // Este también inicializa los grupos dinámicos

        if (closeCardBtnMap) {
            closeCardBtnMap.addEventListener('click', closeBusinessInfo);
        }

        if (relojElement) {
            setInterval(actualizarReloj, 1000);
            actualizarReloj();
        }

        console.log('map.js: Funcionalidades del mapa inicializadas correctamente.');
    } else {
        console.warn('map.js: Elementos del DOM del mapa no encontrados. Las funcionalidades del mapa no se inicializarán en esta página.');
    }
});