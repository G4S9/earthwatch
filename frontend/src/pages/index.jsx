/* eslint-disable no-console */
import React, {
  useState, useEffect, useCallback,
} from 'react';
import styled from 'styled-components';
import Amplify, { Auth } from 'aws-amplify';
import AWSAppSyncClient from 'aws-appsync';
import Helmet from 'react-helmet';
import SimpleMap from '../components/simpleMap';
import GoogleButton from '../components/googleButton';
import {
  getTopQuakesLastWeekQuery,
  onPutQuakeSubscription,
  getUserProfileQuery,
  putUserProfileMutation,
} from '../graphql';
import {
  REGION,
  APP_SYNC_HOSTNAME,
  USER_POOL_ID,
  USER_POOL_WEB_CLIENT_ID,
  USER_POOL_DOMAIN,
  IDENTITY_POOL_ID,
  REDIRECT_URL,
} from '../config';

const APP_SYNC_URL = `https://${APP_SYNC_HOSTNAME}/graphql`;
const APP_SYNC_AUTHENTICATION_TYPE = 'AWS_IAM';

const getRedirectUrl = () => (
  typeof window !== 'undefined'
  && window.location
  && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8000/'
    : REDIRECT_URL);

const awsConfig = {
  aws_project_region: REGION,
  aws_cognito_identity_pool_id: IDENTITY_POOL_ID,
  aws_cognito_region: REGION,
  aws_user_pools_id: USER_POOL_ID,
  aws_user_pools_web_client_id: USER_POOL_WEB_CLIENT_ID,
  aws_appsync_graphqlEndpoint: APP_SYNC_URL,
  aws_appsync_region: REGION,
  aws_appsync_authenticationType: APP_SYNC_AUTHENTICATION_TYPE,
  oauth: {
    domain: `${USER_POOL_DOMAIN}.auth.${REGION}.amazoncognito.com`,
    scope: ['email', 'openid'],
    redirectSignIn: getRedirectUrl(),
    redirectSignOut: getRedirectUrl(),
    responseType: 'code',
  },
};

Amplify.configure(awsConfig);

const appSyncClient = new AWSAppSyncClient({
  url: awsConfig.aws_appsync_graphqlEndpoint,
  region: awsConfig.aws_appsync_region,
  auth: {
    type: awsConfig.aws_appsync_authenticationType,
    credentials: () => Auth.currentCredentials(),
  },
});

// markup

const PageWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
`;

const IndexPage = () => {
  const [loginInfo, updateLoginInfo] = useState(null);
  const [userProfile, updateUserProfile] = useState(null);
  const [quakes, updateQuakes] = useState([]);

  const init = async () => {
    try {
      try {
        const data = await Auth.currentAuthenticatedUser();
        updateLoginInfo({ user: data });
        console.log(JSON.stringify({ user: data }));
      } catch (loginError) {
        updateLoginInfo({ user: null });
        console.log('not signed in', loginError);
      }
      const { data: getUserProfileData } = await appSyncClient.query({
        query: getUserProfileQuery,
        fetchPolicy: 'no-cache',
      });
      console.log(JSON.stringify({ userProfile: getUserProfileData.getUserProfile }));
      let profileDetails;
      if (getUserProfileData && getUserProfileData.getUserProfile) {
        const {
          profileDetails: { mapTypeId, zoom, center: { lat, lng } },
        } = getUserProfileData.getUserProfile;
        profileDetails = { mapTypeId, zoom, center: { lat, lng } };
      } else {
        profileDetails = { mapTypeId: 'terrain', zoom: 3, center: { lat: 0, lng: 0 } };
      }
      updateUserProfile({ profileDetails });

      const { data: getTopQuakesLastWeekData } = await appSyncClient.query({
        query: getTopQuakesLastWeekQuery,
        fetchPolicy: 'network-only',
      });
      if (getTopQuakesLastWeekData && getTopQuakesLastWeekData.getTopQuakesLastWeek) {
        updateQuakes(getTopQuakesLastWeekData.getTopQuakesLastWeek);
        console.log(JSON.stringify({ quakes: getTopQuakesLastWeekData.getTopQuakesLastWeek }));
      }

      appSyncClient.subscribe({ query: onPutQuakeSubscription }).subscribe({
        next: ({ data: { onPutQuake } }) => {
          console.log(JSON.stringify({ realTimeUpdate: onPutQuake }));
          updateQuakes((prevQuakes) => [
            onPutQuake,
            ...prevQuakes.filter(({ id }) => id !== onPutQuake.id),
          ]);
        },
        error: (subscriptionError) => {
          console.warn(subscriptionError);
        },
      });
    } catch (genericError) {
      console.error(genericError);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(async () => {
    try {
      if (loginInfo?.user && userProfile) {
        console.log('persisting user profile');
        await appSyncClient.mutate({
          mutation: putUserProfileMutation,
          variables: userProfile,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }, [loginInfo, userProfile]);

  const onMapTypeIdChange = useCallback(async (mapTypeId) => {
    try {
      console.log('onMapTypeChange: ', mapTypeId);
      if (userProfile && userProfile.profileDetails.mapTypeId !== mapTypeId) {
        const profileDetails = {
          ...userProfile.profileDetails,
          mapTypeId,
        };
        console.log(JSON.stringify({ profileDetails }));
        updateUserProfile({ profileDetails });
      }
    } catch (error) {
      console.error(error);
    }
  }, [userProfile]);

  const onChange = useCallback(({ center, zoom }) => {
    try {
      console.log('onChange:', JSON.stringify({ center, zoom }));
      if (userProfile && (userProfile.profileDetails.zoom !== zoom
        || userProfile.profileDetails.center.lat !== center.lat
        || userProfile.profileDetails.center.lng !== center.lng)) {
        const profileDetails = {
          ...userProfile.profileDetails,
          center,
          zoom,
        };
        console.log(JSON.stringify({ profileDetails }));
        updateUserProfile({ profileDetails });
      }
    } catch (error) {
      console.error(error);
    }
  }, [userProfile]);

  return (
    <PageWrapper>
      <Helmet>
        <meta charSet="utf-8" />
        <title>EARTHwatch</title>
        <link rel="canonical" href={getRedirectUrl()} />
      </Helmet>
      {
        userProfile && (
          <SimpleMap
            quakes={quakes}
            mapTypeId={userProfile.profileDetails.mapTypeId}
            defaultZoom={userProfile.profileDetails.zoom}
            defaultCenter={userProfile.profileDetails.center}
            onMapTypeIdChange={onMapTypeIdChange}
            onChange={onChange}
          />
        )
      }
      {
        loginInfo?.user
          ? (
            <GoogleButton
              text="Logout from Google"
              position={{ top: '10px', left: '10px' }}
              onClick={() => Auth.signOut()}
            />
          )
          : (
            <GoogleButton
              text="Log in with Google"
              position={{ top: '10px', left: '10px' }}
              onClick={() => Auth.federatedSignIn({ provider: 'Google' })}
            />
          )
      }
    </PageWrapper>
  );
};

export default IndexPage;
