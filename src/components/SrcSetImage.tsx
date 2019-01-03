import React from 'react';

import { Image } from '../state';

type ImgProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

interface SrcSetImageProps extends ImgProps {
  images: Image[];
}

const SrcSetImage = React.forwardRef<HTMLImageElement, SrcSetImageProps>(
  ({ images, ...restProps }, ref) => {
    if (!images || images.length === 0) {
      return <img ref={ref} {...restProps}/>;
    }

    const largest = images.reduce(
      (acc, img) => img.width > acc.width ? img : acc,
      images[0],
    );
    const srcset = images.map(img => `${img.url} ${img.width}w`).join(', ');

    return (
      <img
        ref={ref}
        src={largest.url}
        srcSet={srcset}
        {...restProps}
      />
    );
  },
);

export default SrcSetImage;
