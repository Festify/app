import CircularProgress, {
  CircularProgressProps,
} from '@material-ui/core/es/CircularProgress';
import classNames from 'classnames';
import React from 'react';

import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps extends CircularProgressProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  ...restProps
}) => (
  <div
    className={classNames(styles.container, className)}
    aria-hidden="true"
  >
    <CircularProgress variant="indeterminate" {...restProps}/>
  </div>
);

export default LoadingSpinner;
