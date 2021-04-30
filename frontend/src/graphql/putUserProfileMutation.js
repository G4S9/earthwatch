import gql from 'graphql-tag';

export default gql`
mutation PutUserProfile($profileDetails: ProfileDetailsInput!){
  putUserProfile(profileDetails: $profileDetails) {
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
