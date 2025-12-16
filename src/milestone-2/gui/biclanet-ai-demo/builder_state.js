/**
 * Builder State Management
 * Manages localStorage state for Pod Builder and App Builder flows
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'biclaNetConfig';

  const DEFAULT_CONFIG = {
    pod: {
      model: "Standard Pod",
      capacity: 8,
      context: ["Outdoor", "City"],
      access: { qr: true, rfid: false, both: false },
      lock: { type: "solenoid", claw: "servo", heightUI: true },
      sensors: { presence: true, hub: true, network: true, tempHumidity: false, camera: false }
    },
    app: {
      branding: {
        primary: "#1A1A1A",
        secondary: "#5A5A5A",
        accent: "#7CA8D6",
        bg: "#FAFAFA",
        fontHeadings: "Space Grotesk",
        fontBody: "Inter"
      },
      features: {
        surveillanceBadge: false,
        environmentCard: false,
        aiForecastLabels: true,
        pushNotifications: false,
        rideHistory: false,
        walletPayments: false,
        subscriptions: false
      }
    }
  };

  /**
   * Get current config from localStorage
   */
  function getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return deepMerge(DEFAULT_CONFIG, parsed);
      }
    } catch (e) {
      console.error('Error reading config from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  /**
   * Save config to localStorage
   */
  function saveConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Error saving config to localStorage:', e);
      return false;
    }
  }

  /**
   * Deep merge two objects
   */
  function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Update pod config
   */
  function updatePodConfig(updates) {
    const config = getConfig();
    config.pod = Object.assign({}, config.pod, updates);
    saveConfig(config);
    return config;
  }

  /**
   * Update app config
   */
  function updateAppConfig(updates) {
    const config = getConfig();
    config.app = Object.assign({}, config.app, updates);
    saveConfig(config);
    return config;
  }

  /**
   * Get required app features based on pod hardware
   */
  function getRequiredAppFeatures() {
    const config = getConfig();
    const required = [];
    
    if (config.pod.access.qr || config.pod.access.both) {
      required.push('QR Access Screen');
    }
    if (config.pod.access.rfid || config.pod.access.both) {
      required.push('RFID Access Option');
    }
    if (config.pod.sensors.presence) {
      required.push('Live Parking Status');
    }
    if (config.pod.lock.type) {
      required.push('Lock Control Button');
    }
    
    return required;
  }

  /**
   * Get optional app features based on pod hardware
   */
  function getOptionalAppFeatures() {
    const config = getConfig();
    const optional = [];
    
    if (config.pod.sensors.tempHumidity) {
      optional.push('Environment Card');
    }
    if (config.pod.sensors.camera) {
      optional.push('Surveillance Badge');
    }
    
    return optional;
  }

  // Export to window
  window.BuilderState = {
    getConfig,
    saveConfig,
    updatePodConfig,
    updateAppConfig,
    getRequiredAppFeatures,
    getOptionalAppFeatures,
    DEFAULT_CONFIG
  };
})();

