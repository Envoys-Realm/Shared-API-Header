/**
 * @file        /src/render-header.js
 * @description Enhanced Shared Header Script with improved responsive design
 * @features    Features: Sidebar navigation, smooth transitions, fixed logo loading
 * @version     1.0.0
 * @date        2025-05-04
 * @author      EnvoyOfHell
 * @copyright   (c) 2025 EnvoysRealm
 * @license     MIT 
 *
 * @dependencies 
 * @dependents  
 *
 * @changelog
 * v1.0.0 Implementation of core features 
 */

// Configuration
const HEADER_API_URL = 'https://cloudflare-worker-bff.jasonh1993.workers.dev/api/header-data';
const WORKER_BASE_URL = 'https://cloudflare-worker-bff.jasonh1993.workers.dev';
const THEME_STORAGE_KEY = 'user-theme-preference';
let currentTheme = 'light';

// Logo path fallbacks (will try these in order)
const LOGO_FALLBACKS = [
   '/img/logo.png',
   'img/logo.png',
   '/src/img/logo.png',
   'src/img/logo.png',
   '../img/logo.png',
   './img/logo.png',
   './assets/logo.png',
   '/assets/logo.png'
];

// --- Theme Handling ---
function applyTheme(theme) {
   const root = document.documentElement;
   if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      currentTheme = 'dark';
   } else {
      root.classList.remove('dark');
      root.classList.add('light');
      currentTheme = 'light';
   }
   updateThemeButtonIcon();
   console.log(`Theme applied: ${currentTheme}`);
}

function getInitialTheme(serverPreference) {
   const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
   if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
   if (serverPreference === 'light' || serverPreference === 'dark') return serverPreference;
   if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
   return 'light';
}

function updateThemeButtonIcon() {
   const themeButtonIcon = document.querySelector('.action-theme-toggle .icon-theme');
   if (themeButtonIcon) themeButtonIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
   const themeButton = document.querySelector('.action-theme-toggle');
   if (themeButton) themeButton.setAttribute('aria-label', `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`);
}

function toggleTheme() {
   const newTheme = currentTheme === 'light' ? 'dark' : 'light';
   localStorage.setItem(THEME_STORAGE_KEY, newTheme);
   applyTheme(newTheme);
}

// --- Navigation Item Rendering ---
function createNavItemHtml(item, isChild = false) {
   let childrenHtml = '';
   if (item.type === 'dropdown' && item.children && item.children.length > 0) {
      childrenHtml = `<ul class="dropdown-menu">
            ${item.children.map(child => createNavItemHtml(child, true)).join('')}
        </ul>`;
   }

   const linkClass = `nav-link ${item.isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`;
   const targetAttr = item.target ? `target="${item.target}"` : '';
   const iconHtml = item.icon ? `<span class="nav-icon">${item.icon}</span>` : '';
   const hrefValue = (item.url && item.type === 'link' && !item.disabled) ? item.url : '#';
   const typeClass = item.type === 'placeholder' ? 'is-placeholder' : (item.type === 'dropdown' ? 'has-dropdown' : '');
   const liClass = `nav-item nav-item-group-${item.group} ${typeClass} ${isChild ? 'nav-item-child' : 'nav-item-top'}`;

   // Render placeholder or disabled item as a non-clickable span
   if (item.type === 'placeholder' || item.disabled) {
      return `<li class="${liClass}">
                    <span class="${linkClass}" title="${item.label}${item.type === 'placeholder' ? ' (coming soon)' : ' (disabled)'}">
                        ${iconHtml}
                        <span class="nav-label">${item.label}</span>
                    </span>
                    ${childrenHtml}
                </li>`;
   }

   // Render regular link/dropdown trigger
   const dropdownAttr = item.type === 'dropdown' ? 'data-toggle="dropdown"' : '';
   return `<li class="${liClass}">
              <a href="${hrefValue}" class="${linkClass}" ${targetAttr} ${dropdownAttr}>
                ${iconHtml}
                <span class="nav-label">${item.label}</span>
                ${item.type === 'dropdown' ? '<span class="dropdown-arrow">▼</span>' : ''}
              </a>
              ${childrenHtml}
            </li>`;
}

// Create mobile navigation item HTML
function createMobileNavItemHtml(item) {
   // Handle different item types
   if (item.type === 'placeholder' || item.disabled) {
      // Placeholder/disabled items
      return `<li class="mobile-nav-item is-placeholder">
                    <span class="mobile-nav-link disabled">
                        ${item.label}
                        ${item.type === 'placeholder' ? ' <small>(coming soon)</small>' : ' <small>(disabled)</small>'}
                    </span>
                </li>`;
   } else if (item.type === 'dropdown' && item.children && item.children.length > 0) {
      // Dropdown items with children
      const childrenHtml = item.children.map(child => createMobileNavItemHtml(child)).join('');

      return `<li class="mobile-nav-item has-dropdown">
                    <button type="button" class="mobile-nav-toggle" aria-expanded="false">
                        ${item.label}
                        <span class="toggle-icon">▼</span>
                    </button>
                    <ul class="mobile-submenu">
                        ${childrenHtml}
                    </ul>
                </li>`;
   } else {
      // Regular link items
      const targetAttr = item.target ? `target="${item.target}"` : '';
      return `<li class="mobile-nav-item">
                    <a href="${item.url}" class="mobile-nav-link ${item.isActive ? 'active' : ''}" ${targetAttr}>
                        ${item.label}
                    </a>
                </li>`;
   }
}

// --- Event Listener Setup ---
function setupHeaderListeners(headerElement) {
   if (!headerElement) return;

   // Theme Toggle Listener
   const themeButton = headerElement.querySelector('.action-theme-toggle');
   if (themeButton) {
      themeButton.removeEventListener('click', toggleTheme);
      themeButton.addEventListener('click', toggleTheme);
      updateThemeButtonIcon();
   }

   // Dropdown Toggle Listener
   headerElement.removeEventListener('click', handleHeaderClick);
   headerElement.addEventListener('click', handleHeaderClick);

   // Outside Click Listener
   if (!document.body.hasAttribute('data-header-outside-click')) {
      document.addEventListener('click', handleOutsideClick, true);
      document.body.setAttribute('data-header-outside-click', 'true');
   }

   // Set up mobile menu
   setupMobileMenuListeners(headerElement);
}

// Setup Mobile Menu Listeners
function setupMobileMenuListeners(headerElement) {
   if (!headerElement) return;

   // Mobile menu toggle button
   const mobileMenuToggle = headerElement.querySelector('.mobile-menu-toggle');
   const mobileMenuContainer = headerElement.querySelector('.mobile-menu-container');
   const mobileMenuOverlay = headerElement.querySelector('.mobile-menu-overlay');

   if (mobileMenuToggle && mobileMenuContainer && mobileMenuOverlay) {
      // Toggle mobile menu on button click
      mobileMenuToggle.addEventListener('click', () => {
         mobileMenuContainer.classList.toggle('active');
         mobileMenuOverlay.classList.toggle('active');

         // Toggle aria-expanded attribute
         const isExpanded = mobileMenuContainer.classList.contains('active');
         mobileMenuToggle.setAttribute('aria-expanded', isExpanded);

         // Show/hide overlay
         if (isExpanded) {
            mobileMenuOverlay.style.display = 'block';
         } else {
            setTimeout(() => {
               mobileMenuOverlay.style.display = 'none';
            }, 300); // Match transition duration
         }
      });

      // Close mobile menu when clicking overlay
      mobileMenuOverlay.addEventListener('click', () => {
         mobileMenuContainer.classList.remove('active');
         mobileMenuOverlay.classList.remove('active');
         mobileMenuToggle.setAttribute('aria-expanded', 'false');

         setTimeout(() => {
            mobileMenuOverlay.style.display = 'none';
         }, 300); // Match transition duration
      });

      // Toggle mobile submenu when clicking dropdown toggles
      const mobileNavToggles = headerElement.querySelectorAll('.mobile-nav-toggle');
      mobileNavToggles.forEach(toggle => {
         toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentItem = toggle.closest('.mobile-nav-item');

            // Close any open siblings
            const siblings = Array.from(parentItem.parentElement.children)
               .filter(el => el !== parentItem && el.classList.contains('is-open'));

            siblings.forEach(sibling => {
               sibling.classList.remove('is-open');
               const siblingToggle = sibling.querySelector('.mobile-nav-toggle');
               if (siblingToggle) siblingToggle.setAttribute('aria-expanded', 'false');
            });

            // Toggle current item
            parentItem.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', parentItem.classList.contains('is-open'));
         });
      });
   }
}

// Populate mobile menu with navigation items - called during render
function populateMobileMenu(headerElement, data) {
   const mobileNavList = headerElement.querySelector('.mobile-menu-container .mobile-nav-list');
   if (!mobileNavList) return;

   // Clear existing content
   mobileNavList.innerHTML = '';

   // Add main navigation items
   const mainNavItems = data.navigation.filter(item => item.group === 'main');
   if (mainNavItems.length > 0) {
      mainNavItems.forEach(item => {
         const mobileItem = createMobileNavItemHtml(item);
         mobileNavList.innerHTML += mobileItem;
      });
   }

   // Add separator if both main and resource items exist
   const resourceNavItems = data.navigation.filter(item => item.group === 'resources');
   if (mainNavItems.length > 0 && resourceNavItems.length > 0) {
      mobileNavList.innerHTML += `<li class="mobile-nav-separator"></li>`;
   }

   // Add resource navigation items
   if (resourceNavItems.length > 0) {
      resourceNavItems.forEach(item => {
         const mobileItem = createMobileNavItemHtml(item);
         mobileNavList.innerHTML += mobileItem;
      });
   }
}

// Handles clicks within the header container
function handleHeaderClick(event) {
   // Find dropdown trigger
   const dropdownTrigger = event.target.closest('[data-toggle="dropdown"]');
   const userMenuTrigger = event.target.closest('.user-menu-button');

   if (dropdownTrigger) {
      event.preventDefault();
      event.stopPropagation();

      // Find parent LI with dropdown
      const parentLi = dropdownTrigger.closest('.nav-item.has-dropdown');
      if (parentLi) {
         toggleDropdown(parentLi);
      }
   } else if (userMenuTrigger) {
      event.preventDefault();
      event.stopPropagation();

      // Get user menu container
      const parentDiv = userMenuTrigger.closest('.user-menu');
      if (parentDiv) {
         toggleDropdown(parentDiv);
      }
   }
}

// Toggles a specific dropdown, closing others
function toggleDropdown(dropdownContainer) {
   const isOpen = dropdownContainer.classList.contains('is-open');

   // Close all dropdowns first
   closeAllDropdowns();

   // If clicked dropdown wasn't open, open it
   if (!isOpen) {
      dropdownContainer.classList.add('is-open');
      console.log('Dropdown opened:', dropdownContainer);

      // Find dropdown menu for positioning adjustments
      const dropdownMenu = dropdownContainer.querySelector('.dropdown-menu');
      if (dropdownMenu) {
         // Check if dropdown would go offscreen right
         const containerRect = dropdownContainer.getBoundingClientRect();
         const menuWidth = dropdownMenu.offsetWidth || 180; // Fallback width if not rendered yet
         const windowWidth = window.innerWidth;

         // If dropdown would extend beyond right edge, align right
         if (containerRect.left + menuWidth > windowWidth) {
            dropdownMenu.style.left = 'auto';
            dropdownMenu.style.right = '0';
         } else {
            dropdownMenu.style.left = '0';
            dropdownMenu.style.right = 'auto';
         }
      }
   }
}

// Closes dropdowns if click is outside
function handleOutsideClick(event) {
   // If not clicking within an open dropdown or trigger
   if (!event.target.closest('.nav-item.has-dropdown.is-open') &&
      !event.target.closest('[data-toggle="dropdown"]') &&
      !event.target.closest('.user-menu.is-open') &&
      !event.target.closest('.user-menu-button')) {

      closeAllDropdowns();
   }
}

// Helper to close all open dropdowns
function closeAllDropdowns() {
   document.querySelectorAll('.nav-item.has-dropdown.is-open, .user-menu.is-open').forEach(openItem => {
      openItem.classList.remove('is-open');
   });
}

// Handle logo loading with fallbacks
function setupLogoWithFallbacks(logoElement) {
   if (!logoElement) return;

   // Backup original src
   const originalSrc = logoElement.getAttribute('src');

   // Create array of sources to try
   const sources = [originalSrc, ...LOGO_FALLBACKS].filter(Boolean);

   // Try loading sources one by one
   function tryNextSource(index) {
      if (index >= sources.length) {
         console.error('Failed to load logo from any source');
         logoElement.style.display = 'none';
         return;
      }

      logoElement.onerror = function () {
         console.log(`Logo failed to load from ${sources[index]}, trying next source`);
         tryNextSource(index + 1);
      };

      logoElement.src = sources[index];
   }

   // Start with first source
   logoElement.onerror = function () {
      console.log(`Logo failed to load from ${originalSrc}, trying fallbacks`);
      tryNextSource(0);
   };
}

// --- Main Header Rendering Function ---
async function renderSharedHeader() {
   const placeholder = document.getElementById('shared-header-placeholder');
   if (!placeholder) {
      console.error('Shared Header Error: Placeholder element not found.');
      return;
   }

   placeholder.innerHTML = '';
   placeholder.className = 'sticky top-0 z-[999]'; // Apply positioning to placeholder

   try {
      console.log(`Fetching header data from: ${HEADER_API_URL}`);
      const response = await fetch(HEADER_API_URL, {
         cache: 'no-store'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('Header data received:', data);

      // Apply Initial Theme
      const initialTheme = getInitialTheme(data.themePreference);
      applyTheme(initialTheme);

      // Build Header HTML
      const headerContainer = document.createElement('div');
      headerContainer.className = 'shared-header'; // Main container class

      // 1. Create unified header layout with three sections
      let headerInnerHtml = '<div class="header-content-wrapper">'; // Main wrapper

      // Left Section: Branding + Toggle
      headerInnerHtml += `<div class="header-left-section">
            <button type="button" class="mobile-menu-toggle" aria-label="Toggle Navigation Menu" aria-expanded="false">☰</button>
            <div class="branding-section">
                <a href="${data.branding.homeUrl}" class="branding-link">
                    <img src="${data.branding.logoUrl || LOGO_FALLBACKS[0]}" alt="${data.branding.siteTitle} Logo" class="branding-logo">
                    <span class="branding-title">${data.branding.siteTitle}</span>
                </a>
            </div>
        </div>`;

      // Middle Section: Main Navigation
      const mainNavItems = data.navigation.filter(item => item.group === 'main');
      headerInnerHtml += `<div class="header-middle-section">
            <div class="unified-navigation">
                <div class="nav-group main-navigation">
                    <ul class="main-nav-list">${mainNavItems.map(item => createNavItemHtml(item, false)).join('')}</ul>
                </div>
            </div>
        </div>`;

      // Right Section: Resource Navigation + User Actions
      headerInnerHtml += `<div class="header-right-section">`;

      // Resource Navigation
      const resourceNavItems = data.navigation.filter(item => item.group === 'resources');
      if (resourceNavItems.length > 0) {
         headerInnerHtml += `<div class="nav-group resource-navigation">
                <ul class="resource-nav-list">${resourceNavItems.map(item => createNavItemHtml(item, false)).join('')}</ul>
            </div>`;
      }

      // User & Actions Section
      headerInnerHtml += `<div class="actions-user-section">`;

      // Action Buttons
      headerInnerHtml += `<div class="action-buttons">`;
      if (data.actions.showThemeToggle) {
         headerInnerHtml += `<button class="action-button action-theme-toggle" aria-label="Toggle Theme"><span class="icon-theme"></span></button>`;
      }
      if (data.actions.randomLinkUrl) {
         const absoluteRandomUrl = `${WORKER_BASE_URL}${data.actions.randomLinkUrl}`;
         headerInnerHtml += `<a href="${absoluteRandomUrl}" class="action-button action-random" aria-label="Random" title="Go to a random page"><span class="icon-random">🎲</span></a>`;
      }
      headerInnerHtml += `</div>`; // Close action-buttons

      // User Area
      headerInnerHtml += `<div class="user-area">`;
      if (data.user.isAuthenticated) {
         // Logged In State - User Menu Dropdown
         headerInnerHtml += `<div class="user-menu nav-item has-dropdown">`;

         // User Menu Button
         headerInnerHtml += `<button type="button" class="user-menu-button nav-link" data-toggle="dropdown" aria-label="User Menu" aria-haspopup="true">`;

         // User Avatar
         if (data.user.avatarUrl) {
            headerInnerHtml += `<img src="${data.user.avatarUrl}" alt="User Avatar" class="user-avatar">`;
         } else {
            headerInnerHtml += `<svg class="user-avatar" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>`;
         }

         // User Name
         if (data.user.name) {
            headerInnerHtml += `<span class="user-name">${data.user.name}</span>`;
         }

         // Add dropdown arrow if there are menu items
         const userNavItems = data.navigation.filter(item => item.group === 'user');
         if (data.user.profileUrl || data.user.logoutUrl || userNavItems.length > 0) {
            headerInnerHtml += `<span class="dropdown-arrow">▼</span>`;
         }

         headerInnerHtml += `</button>`;

         // User Dropdown Menu
         headerInnerHtml += `<ul class="dropdown-menu user-dropdown-menu">`;

         // Profile Link
         if (data.user.profileUrl) {
            headerInnerHtml += createNavItemHtml({
               label: 'Profile',
               url: data.user.profileUrl,
               type: 'link',
               group: 'user'
            }, true);
         }

         // User Nav Items
         headerInnerHtml += userNavItems.map(item => createNavItemHtml(item, true)).join('');

         // Logout Link
         if (data.user.logoutUrl) {
            // Add separator before logout
            headerInnerHtml += `<li class="dropdown-divider"></li>`;
            headerInnerHtml += createNavItemHtml({
               label: 'Logout',
               url: data.user.logoutUrl,
               type: 'link',
               group: 'user'
            }, true);
         }

         headerInnerHtml += `</ul></div>`; // Close dropdown & user-menu
      } else {
         // Logged Out State
         if (data.user.loginUrl) {
            headerInnerHtml += `<a href="${data.user.loginUrl}" class="user-link user-link-login">Login</a>`;
         }
         if (data.user.registerUrl) {
            headerInnerHtml += `<a href="${data.user.registerUrl}" class="user-link user-link-register">Register</a>`;
         }
      }

      headerInnerHtml += `</div>`; // Close user-area
      headerInnerHtml += `</div>`; // Close actions-user-section
      headerInnerHtml += `</div>`; // Close header-right-section
      headerInnerHtml += `</div>`; // Close header-content-wrapper

      // 2. Mobile Menu Container (sidebar)
      headerInnerHtml += `<div class="mobile-menu-container">
            <ul class="mobile-nav-list"></ul>
        </div>`;

      // 3. Mobile Menu Overlay
      headerInnerHtml += `<div class="mobile-menu-overlay"></div>`;

      // Inject HTML
      headerContainer.innerHTML = headerInnerHtml;
      placeholder.appendChild(headerContainer);
      console.log('Shared Header Rendered.');

      // Handle logo loading
      const logoElement = headerContainer.querySelector('.branding-logo');
      setupLogoWithFallbacks(logoElement);

      // Populate the mobile menu
      populateMobileMenu(headerContainer, data);

      // Setup event listeners
      setupHeaderListeners(headerContainer);

   } catch (error) {
      console.error('Failed to fetch or render shared header:', error);
      placeholder.innerHTML = '<div class="shared-header-error">Could not load header</div>';
   }
}

// Run the function when the DOM is ready
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', renderSharedHeader);
} else {
   renderSharedHeader();
}