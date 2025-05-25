// d:/Uraan/client/src/config/particleOptions.js

// Basic configuration for a subtle, floating particle effect
// This can be expanded to use actual feather images later

export const featherParticlesOptions = {
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "repulse", // Particles move away from cursor
      },
      onClick: {
        enable: false, // No specific click action for now
        mode: "push",
      },
    },
    modes: {
      repulse: {
        distance: 80,
        duration: 0.4,
      },
      push: {
        quantity: 4,
      },
    },
  },
  particles: {
    color: {
      value: "#333333", // IF NOT USING IMAGE: Darker color for visibility on light backgrounds. For images, this is less relevant.
    },
    links: {
      color: "#333333", // IF NOT USING IMAGE: Darker color for visibility
      distance: 150,
      enable: false, // No links between particles for a feather effect
      opacity: 0.1,
      width: 1,
    },
    move: {
      direction: "bottom", // Particles generally float downwards
      enable: true,
      outModes: "out", // Particles disappear when they go off-screen
      random: true,
      speed: 0.5, // Slow speed for a gentle float
      straight: false, // Not straight, more natural drift
    },
    number: {
      density: {
        enable: true,
        area: 1000, // Adjust for more/less dense particles
      },
      value: 30, // Number of particles
    },
    opacity: {
      value: { min: 0.1, max: 0.5 }, // Varying opacity for depth
      animation: {
        enable: true,
        speed: 0.5,
        minimumValue: 0.1,
        sync: false,
      },
    },
    shape: {
      type: "image", // Change to "image"
      image: {
        src: '/images/pigeon.svg', // Path relative to the public folder
        width: 100, // Intrinsic width of the image (for aspect ratio)
        height: 100 // Intrinsic height of the image (for aspect ratio)
      }
    },
    size: {
      value: { min: 10, max: 25 }, // Adjust these values for feather image size
      animation: {
        enable: true,
        speed: 3, // Speed of size animation
        minimumValue: 8, // Smallest size during animation
        sync: false,
      },
    },
  },
  detectRetina: true,
};