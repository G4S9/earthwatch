import gql from 'graphql-tag';

export default gql`
query {
  getTopQuakesLastWeek {
    id
    time
    mag
    title
    coordinates {
      lat
      lon
    }
  }
}`;
