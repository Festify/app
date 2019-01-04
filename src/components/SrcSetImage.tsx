import React from 'react';

import { Image } from '../state';

type ImgProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

interface SrcSetImageProps extends ImgProps {
  images: Image[];
}

interface SrcSetInnerProps extends SrcSetImageProps {
  innerRef: React.Ref<HTMLImageElement>;
}

const ImageBase: React.FC<SrcSetInnerProps> = ({
  images,
  innerRef,
  ...restProps
}) => {
  if (!images || images.length === 0) {
    return <img ref={innerRef} {...restProps}/>;
  }

  const largest = images.reduce(
    (acc, img) => img.width > acc.width ? img : acc,
    images[0],
  );
  const srcset = images.map(img => `${img.url} ${img.width}w`).join(', ');

  return (
    <img
      ref={innerRef}
      src={largest.url}
      srcSet={srcset}
      {...restProps}
    />
  );
};

const MemoizedImage = React.memo(ImageBase);

const SrcSetImage = React.forwardRef<HTMLImageElement, SrcSetImageProps>(
  (props, ref) => <MemoizedImage innerRef={ref} {...props}/>,
);

export default SrcSetImage;
