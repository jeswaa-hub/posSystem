import React from 'react';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`bg-dark-700 animate-pulse rounded ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
