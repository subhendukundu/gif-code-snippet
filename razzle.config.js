'use strict';

module.exports = {
  modify(config, { target, dev }, webpack) {
    delete config.externals;
    // Since RN web takes care of CSS, we should remove it for a #perf boost
    return config;
  },
};
