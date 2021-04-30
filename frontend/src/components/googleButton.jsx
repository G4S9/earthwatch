import React from 'react';
import styled from 'styled-components';
import { withPrefix } from 'gatsby';

const ButtonWrapper = styled.div`
  cursor: default;
  position: fixed;
  background-color: #fff;
  border-radius: 2px;
  top: ${({ position: { top } }) => top};
  left: ${({ position: { left } }) => left};
  display: flex;
  align-items: center;
  padding: 10px;
  color: #666;
  &:hover {
    color: black;
  }
`;

const TextWrapper = styled.span`
  font-family: sans-serif;
  margin: 0 10px;
`;

// eslint-disable-next-line react/prop-types
const GoogleButton = ({ text, position, onClick }) => (
  <ButtonWrapper position={position} onClick={() => onClick()}>
    <img height="24" width="24" src={withPrefix('/google-logo.svg')} alt="google logo" />
    <TextWrapper>{text}</TextWrapper>
  </ButtonWrapper>
);

export default GoogleButton;
