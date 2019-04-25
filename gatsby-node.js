const path = require('path');

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  // Create pages for the share template
  createPage({
    path: '/party/',
    matchPath: '/party/*',
    component: path.resolve('./src/components/App.tsx'),
  });
};
