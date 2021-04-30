import gql from 'graphql-tag';

export default gql`
subscription {
  onPutQuake {
    id
    time
    title
    mag
    coordinates {
      lat
      lon
    }
  }
}`;
