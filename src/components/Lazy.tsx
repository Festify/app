import React, { Suspense } from 'react';

import LoadingSpinner from './LoadingSpinner';

// Needs to be `function` because of ambiguity with JSX
// tslint:disable-next-line
const Lazy = function <P>(loader: () => Promise<{ default: React.ComponentType<P> }>) {
  const Lazy = React.lazy(loader);

  const LazyWrapper = React.forwardRef((props: P, ref) => (
    <Suspense fallback={LoadingSpinner}>
      <Lazy ref={ref} {...(props as any)} />
    </Suspense>
  ));

  return LazyWrapper;
};

export default Lazy;
