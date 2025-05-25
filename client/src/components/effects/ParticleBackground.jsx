import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim'; // or loadFull for all features
// import { loadFull } from "tsparticles"; // if you installed the full engine
import { featherParticlesOptions } from '../../config/particleOptions'; // Import your config
import './ParticleBackground.css';

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    // console.log(engine);
    // You can initiate the tsParticles instance (engine) here, adding custom shapes or presets
    // This loads the slim engine, which is smaller
    await loadSlim(engine);
    // await loadFull(engine); // or loadFull if you need more features
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // await console.log(container);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={featherParticlesOptions} // Your custom options
      className="particle-canvas" // Add a class for styling
    />
  );
};

export default ParticleBackground;