const writeInfo = (text) => {
  document.querySelector('p.info').textContent = text;
};

const globalProperties = {
  // Load in JSON config from property, fail if invalid json
  // If url, fetch first
  config: async ({ value }) => {
    try {
      // Is a URL, send fetch request
      if (value.startsWith('http') || value.startsWith('file')) {
        console.log('fetching config from url', value);
        // Fetch and read body as text as we'll be parsing it to json below manually
        value = await (await fetch(value)).text();
      }
      const parsed = JSON.parse(value);
      console.log('[*] loading config', parsed);

      // Deep extend existing object with new values and reset temp object
      Object.deepExtend(pJSDom[0].pJS, parsed);
      pJSDom[0].pJS.tmp.obj = {
        size_value: parsed.particles.size.value,
        size_anim_speed: parsed.particles.size.anim.speed,
        move_speed: parsed.particles.move.speed,
        line_linked_distance: parsed.particles.line_linked.distance,
        line_linked_width: parsed.particles.line_linked.width,
        mode_grab_distance: parsed.interactivity.modes.grab.distance,
        mode_bubble_distance: parsed.interactivity.modes.bubble.distance,
        mode_bubble_size: parsed.interactivity.modes.bubble.size,
        mode_repulse_distance: parsed.interactivity.modes.repulse.distance,
      };
      // Request reload/refresh once reassigned
      pJSDom[0].pJS.fn.particlesRefresh();
      // If info was written before, clear it
      writeInfo('');
    } catch (error) {
      // Rethrow if not a JSON parse error
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      writeInfo('Error: JSON Parse error - Please confirm the provided JSON particle.js configuration is valid.');
    }
    return null;
  },
  schemecolor: ({ value }) => {
    // "Un-normalize" color values
    const customColor = value.split(' ').map((c) => {
      return Math.ceil(c * 255);
    });
    return ['background-color', `rgb(${customColor})`];
  },
  background_size: ({ value }) => value,
  background_position: ({ value }) => value,
  background_repeat: ({ value }) => value,
  // Only return a value if not empty
  background_image: ({ value }) => value ? `url('${value}')` : null,
  background_image_file: ({ value }) => {
    if (!value) {
      // Clear background-image style when empty value
      return ['background-image', ''];
    }
    return ['background-image', `url('file:///${value}')`];
  }
};

window.wallpaperPropertyListener = {
  applyUserProperties: async (properties) => {
    for (const [key, value] of Object.entries(properties)) {
      // Check if key is defined in property handlers
      if (!globalProperties.hasOwnProperty(key)) {
        continue;
      }
      // Execute handler for specific property, and use result to set style field
      const result = await globalProperties[key](value);
      // Short if result was null (should only happen inside the "config" & "background_image(_url)" property handlers)
      if (result === null) {
        continue;
      }
      // Grab key from result if array, otherwise change original property key from snake_case to kebab-case
      const cssKey = Array.isArray(result) ? result[0] : key.replace('_', '-');
      // Grab result if return type is array
      const cssResult = Array.isArray(result) ? result[1] : result;
      // Select DOM element by selector, and set value to result
      document.querySelector('main > canvas').style[cssKey] = cssResult;
    }
  },
};

// Make sure a canvas element is available on startup, config not required
document.addEventListener('DOMContentLoaded', () => {
  particlesJS('particles-js', {});
});
