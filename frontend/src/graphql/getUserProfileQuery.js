import gql from 'graphql-tag';

export default gql`
query {
  getUserProfile {
    profileDetails {
      mapTypeId
      zoom
      center {
        lat
        lng
      }
    }
  }
}`;
