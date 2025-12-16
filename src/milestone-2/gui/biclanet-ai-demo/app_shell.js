/**
 * App Shell Loader
 * Loads sidebar and topbar partials and handles navigation state
 */

(function() {
  'use strict';

  // Configuration for search placeholders per page
  const searchPlaceholders = {
    'dashboard.html': 'Search Pod ID or Location...',
    'pod.html': 'Search Pod ID or Location...',
    'team.html': 'Search members or teams...',
    'faq.html': 'Search FAQ...'
  };

  /**
   * Get current page filename
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
  }

  /**
   * Load HTML partial into container
   */
  async function loadPartial(url, containerId) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
      }
      const html = await response.text();
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        return true;
      }
      console.error(`Container #${containerId} not found`);
      return false;
    } catch (error) {
      console.error(`Error loading ${url}:`, error);
      return false;
    }
  }

  /**
   * Set active sidebar item based on current page
   */
  function setActiveSidebarItem() {
    const currentPage = getCurrentPage();
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    
    navItems.forEach(item => {
      const itemPage = item.getAttribute('data-page');
      // For pod.html, highlight Dashboard (dashboard.html) since it's a detail view
      if (currentPage === 'pod.html' && itemPage === 'dashboard.html') {
        item.classList.add('sidebar-nav-item-active');
      } else if (itemPage === currentPage) {
        item.classList.add('sidebar-nav-item-active');
      } else {
        // Handle builder pages - highlight first step of each flow
        const isPodBuilder = currentPage.startsWith('pod_builder_');
        const isAppBuilder = currentPage.startsWith('app_builder_');
        if (isPodBuilder && itemPage === 'pod_builder_1_model.html') {
          item.classList.add('sidebar-nav-item-active');
        } else if (isAppBuilder && itemPage === 'app_builder_1_branding.html') {
          item.classList.add('sidebar-nav-item-active');
        } else {
          item.classList.remove('sidebar-nav-item-active');
        }
      }
    });
  }

  /**
   * Configure topbar based on current page
   */
  function configureTopbar() {
    const currentPage = getCurrentPage();
    
    // Show/hide topbar sections
    const teamSection = document.getElementById('topNavTeamSection');
    const backSection = document.getElementById('topNavBackSection');
    
    if (currentPage === 'pod.html') {
      // Show back link, hide team dropdown
      if (backSection) backSection.style.display = 'block';
      if (teamSection) teamSection.style.display = 'none';
    } else {
      // Show team dropdown, hide back link
      if (teamSection) teamSection.style.display = 'flex';
      if (backSection) backSection.style.display = 'none';
    }
    
    // Set search placeholder
    const searchInput = document.getElementById('topNavSearchInput');
    if (searchInput && searchPlaceholders[currentPage]) {
      searchInput.placeholder = searchPlaceholders[currentPage];
    }
  }

  /**
   * Initialize team dropdown functionality
   */
  function initTeamDropdown() {
    const teamDropdownTrigger = document.getElementById('teamDropdownTrigger');
    const teamDropdownMenu = document.getElementById('teamDropdownMenu');
    const teamNameLabel = document.getElementById('teamNameLabel');

    if (!teamDropdownTrigger || !teamDropdownMenu) return;

    teamDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = teamDropdownMenu.classList.contains('team-dropdown-menu-open');
      teamDropdownMenu.classList.toggle('team-dropdown-menu-open');
      teamDropdownTrigger.setAttribute('aria-expanded', !isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!teamDropdownTrigger.contains(e.target) && !teamDropdownMenu.contains(e.target)) {
        teamDropdownMenu.classList.remove('team-dropdown-menu-open');
        teamDropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    teamDropdownMenu.addEventListener('click', (e) => {
      if (e.target.classList.contains('team-dropdown-item')) {
        const teamName = e.target.getAttribute('data-team');
        if (teamNameLabel) {
          teamNameLabel.textContent = teamName;
        }
        teamDropdownMenu.classList.remove('team-dropdown-menu-open');
        teamDropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    teamDropdownTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        teamDropdownMenu.classList.remove('team-dropdown-menu-open');
        teamDropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /**
   * Load stepper if page has stepper container
   */
  async function loadStepper() {
    const stepperContainer = document.getElementById('stepper');
    if (stepperContainer) {
      try {
        const response = await fetch('partials/stepper.html');
        if (response.ok) {
          const html = await response.text();
          stepperContainer.innerHTML = html;
        }
      } catch (error) {
        console.error('Error loading stepper:', error);
      }
    }
  }

  /**
   * Initialize app shell
   */
  async function initAppShell() {
    // Load partials (using relative paths for GitHub Pages compatibility)
    const sidebarLoaded = await loadPartial('partials/sidebar.html', 'sidebar');
    const topbarLoaded = await loadPartial('partials/topbar.html', 'topbar');

    if (sidebarLoaded) {
      setActiveSidebarItem();
    }

    if (topbarLoaded) {
      configureTopbar();
      initTeamDropdown();
    }

    // Load stepper if needed
    await loadStepper();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppShell);
  } else {
    initAppShell();
  }
})();

