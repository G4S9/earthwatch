/* eslint-disable react/require-default-props */
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import GoogleMap from 'google-map-react';
import Quake from './quake';

// sent on each API request in clear text
// protected by throttle limits and origin validation instead
import { MAPS_API_KEY } from '../config';

const StyledDiv = styled.div`
  flex: 0 0 100%;
`;

// eslint-disable-next-line react/prefer-stateless-function
const SimpleMap = ({
  mapTypeId,
  defaultCenter,
  defaultZoom,
  quakes,
  onMapTypeIdChange = () => {},
  onChange = () => {},
}) => (
  <StyledDiv>
    <GoogleMap
      bootstrapURLKeys={{ key: MAPS_API_KEY }}
      options={(map) => ({
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: map.ControlPosition.TOP_RIGHT,
        },
        fullscreenControl: false,
        mapTypeId,
      })}
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      onMapTypeIdChange={onMapTypeIdChange}
      onChange={onChange}
    >
      {quakes.map(({ coordinates: { lat, lon }, ...rest }) => (
        <Quake lat={lat} lng={lon} quake={rest} key={rest.id} fill="red" />
      ))}
    </GoogleMap>
  </StyledDiv>
);

SimpleMap.propTypes = {
  mapTypeId: PropTypes.string,
  quakes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      time: PropTypes.number,
      title: PropTypes.string,
      mag: PropTypes.number,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lon: PropTypes.number,
      }),
    }),
  ),
  defaultZoom: PropTypes.number,
  defaultCenter: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  onMapTypeIdChange: PropTypes.func,
  onChange: PropTypes.func,
};

export default SimpleMap;
