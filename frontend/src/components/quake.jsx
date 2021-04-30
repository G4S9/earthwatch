/* eslint-disable react/require-default-props */
import React from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';

const Quake = ({ quake: { time, title, mag }, fill }) => {
  const radius = 1.5 * mag;
  const diameter = 2 * radius;
  return (
    <svg
      height={diameter}
      width={diameter}
      style={{
        position: 'absolute', top: -radius, left: -radius,
      }}
    >
      <circle
        cx={radius}
        cy={radius}
        r={radius}
        // above 5 it is likely to cause damage
        // eslint-disable-next-line no-nested-ternary
        fill={fill}
        fillOpacity={Math.min(1, (mag ** 2) / 25)}
      >
        <title>{`${title} (${formatDistanceToNow(time, { addSuffix: true })})`}</title>
      </circle>
    </svg>
  );
};

Quake.propTypes = {
  quake: PropTypes.shape({
    id: PropTypes.string,
    time: PropTypes.number,
    title: PropTypes.string,
    mag: PropTypes.number,
    coordinates: PropTypes.shape({
      lat: PropTypes.number,
      lon: PropTypes.number,
    }),
  }),
  fill: PropTypes.string,
};

export default Quake;
